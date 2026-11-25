import { describe, expect, test, vi } from 'vitest'
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
  decodePDFRawStream,
  type PDFPage,
} from 'pdf-lib'
import {
  arc,
  box,
  cubicTo,
  ellipse,
  group,
  image,
  line,
  moveTo,
  path,
  pt,
  poly,
  quadTo,
  rect,
  text,
} from '../scene/builders'
import type { Font, Page, TextItem } from '../scene/types'
import { formatNumber } from './svg'
import {
  MM_TO_PT,
  buildPdf,
  paintScene,
  patchPlacement,
  type PdfPageTarget,
  type TextPatch,
  type TextRasterizer,
} from './pdf'

const ink = { color: '#000000', width: 0.3 }
const red = { color: '#ff0000' }
const font: Font = { family: 'serif', size: 4 }

function a4(scene: Page['scene']): Page {
  return { width: 210, height: 297, scene }
}

/** A recording target; every method is a mock. */
function fakeTarget(): PdfPageTarget {
  return {
    sizePt: { width: 210 * MM_TO_PT, height: 297 * MM_TO_PT },
    line: vi.fn(),
    rect: vi.fn(),
    path: vi.fn(),
    image: vi.fn(async () => {}),
  }
}

function mm(value: number): number {
  return value * MM_TO_PT
}

/** A fixed patch of 4 × 2 mm, `dx`/`dy` as given. */
function patch(dx: number, dy: number): TextPatch {
  return {
    png: new Uint8Array([1, 2, 3]),
    dpi: 254,
    widthPx: 40,
    heightPx: 20,
    dx,
    dy,
  }
}

/** A rasterizer that always answers with `result` and records the items. */
function rasterizerOf(result: TextPatch | null) {
  return vi.fn(async (_item: TextItem): Promise<TextPatch | null> => result)
}

describe('paintScene', () => {
  const noText = {
    textRasterizer: rasterizerOf(null),
    decodeImage: vi.fn(async () => null),
  }

  test('converts a line to points with y measured from the bottom edge', async () => {
    const target = fakeTarget()
    await paintScene(target, a4([line(10, 20, 30, 20, ink)]), noText)
    const [x1, y1, x2, y2] = vi.mocked(target.line).mock.calls[0]
    expect(x1).toBeCloseTo(28.346, 2)
    expect(y1).toBeCloseTo(785.197, 2)
    expect(x2).toBeCloseTo(85.039, 2)
    expect(y2).toBeCloseTo(785.197, 2)
  })

  test('converts the stroke width and dash to points', async () => {
    const target = fakeTarget()
    const dashed = { color: '#000000', width: 0.3, dash: [3, 2] }
    await paintScene(target, a4([line(10, 20, 30, 20, dashed)]), noText)
    const paint = vi.mocked(target.line).mock.calls[0][4]
    expect(paint.stroke?.width).toBeCloseTo(mm(0.3), 4)
    expect(paint.stroke?.dash).toEqual([
      expect.closeTo(mm(3), 4),
      expect.closeTo(mm(2), 4),
    ])
    expect(paint.fill).toBeNull()
  })

  test('passes the bottom-left corner and size of a rectangle', async () => {
    const target = fakeTarget()
    await paintScene(target, a4([rect(box(10, 20, 30, 40), ink, red)]), noText)
    const [x, y, w, h] = vi.mocked(target.rect).mock.calls[0]
    expect(x).toBeCloseTo(mm(10), 4)
    expect(y).toBeCloseTo(mm(297 - 20 - 40), 4)
    expect(w).toBeCloseTo(mm(30), 4)
    expect(h).toBeCloseTo(mm(40), 4)
  })

  test('multiplies group opacity into strokes and fills', async () => {
    const target = fakeTarget()
    const scene = group(
      [
        line(0, 0, 1, 0, { ...ink, opacity: 0.5 }),
        rect(box(0, 0, 1, 1), undefined, { ...red, opacity: 0.8 }),
      ],
      0.5,
    )
    await paintScene(target, a4([scene]), noText)
    const linePaint = vi.mocked(target.line).mock.calls[0][4]
    const rectPaint = vi.mocked(target.rect).mock.calls[0][4]
    expect(linePaint.stroke?.opacity).toBeCloseTo(0.25, 6)
    expect(rectPaint.fill?.opacity).toBeCloseTo(0.4, 6)
  })

  test('multiplies the opacity of nested groups', async () => {
    const target = fakeTarget()
    const scene = group([group([line(0, 0, 1, 0, ink)], 0.5)], 0.5)
    await paintScene(target, a4([scene]), noText)
    const paint = vi.mocked(target.line).mock.calls[0][4]
    expect(paint.stroke?.opacity).toBeCloseTo(0.25, 6)
  })

  test('draws a full ellipse as four cubic segments in scene orientation', async () => {
    const target = fakeTarget()
    await paintScene(target, a4([ellipse(50, 60, 10, 5, ink)]), noText)
    const [d] = vi.mocked(target.path).mock.calls[0]
    // Not flipped: the first point is (cx + rx, cy) with y counted from the
    // top of the page, because the target flips paths itself.
    const first = `${formatNumber(mm(60))} ${formatNumber(mm(60))}`
    expect(d.startsWith(`M ${first} C`)).toBe(true)
    expect(d.split(' ').filter((token) => token === 'C')).toHaveLength(4)
  })

  test('draws a quarter arc as one cubic segment', async () => {
    const target = fakeTarget()
    await paintScene(
      target,
      a4([arc(50, 60, 10, 5, 0, Math.PI / 2, ink)]),
      noText,
    )
    const [d] = vi.mocked(target.path).mock.calls[0]
    expect(d.startsWith('M ')).toBe(true)
    expect(d.split(' ').filter((token) => token === 'C')).toHaveLength(1)
  })

  test('draws polygons and paths as path data starting with M', async () => {
    const target = fakeTarget()
    const triangle = poly([pt(0, 0), pt(10, 0), pt(0, 10)], true, ink)
    const curve = path(
      [
        moveTo(pt(0, 0)),
        quadTo(pt(1, 1), pt(2, 0)),
        cubicTo(pt(3, 1), pt(4, 2), pt(5, 0)),
      ],
      false,
      ink,
    )
    await paintScene(target, a4([triangle, curve]), noText)
    const data = vi.mocked(target.path).mock.calls.map(([d]) => d)
    expect(
      data[0].startsWith(
        `M 0 0 L ${formatNumber(mm(10))} 0 L 0 ${formatNumber(mm(10))} Z`,
      ),
    ).toBe(true)
    expect(data[1]).toContain(' Q ')
    expect(data[1]).toContain(' C ')
  })

  test('skips items that have neither a stroke nor a fill', async () => {
    const target = fakeTarget()
    const bare = [
      rect(box(0, 0, 1, 1)),
      ellipse(0, 0, 1, 1),
      poly([pt(0, 0)], false),
    ]
    await paintScene(target, a4(bare), noText)
    expect(target.rect).not.toHaveBeenCalled()
    expect(target.path).not.toHaveBeenCalled()
  })

  test('places a text patch at its anchor and rasterizes once per content', async () => {
    const textPatch = patch(-1, -1.5)
    const textRasterizer = rasterizerOf(textPatch)
    const target = fakeTarget()
    const scene = [
      text(50, 100, 'Hello', font, red),
      text(80, 100, 'Hello', font, red),
    ]
    await paintScene(target, a4(scene), { ...noText, textRasterizer })
    expect(textRasterizer).toHaveBeenCalledTimes(1)
    expect(target.image).toHaveBeenCalledTimes(2)
    const first = vi.mocked(target.image).mock.calls[0]
    expect(first[0]).toBe(textPatch.png)
    expect(first[1]).toBeCloseTo(mm(50), 4)
    expect(first[2]).toBeCloseTo(mm(297 - 100), 4)
    expect(first[3]).toBeCloseTo(mm(4), 4)
    expect(first[4]).toBeCloseTo(mm(2), 4)
    expect(first[5]).toBe(0)
    expect(first[6]).toBe(-1)
    expect(first[7]).toBe(-1.5)
    expect(first[8]).toEqual({ opacity: 1 })
  })

  test('rasterizes texts that differ only in colour separately', async () => {
    const textRasterizer = rasterizerOf(patch(0, 0))
    const scene = [
      text(50, 100, 'Hello', font, red),
      text(50, 100, 'Hello', font, ink),
    ]
    await paintScene(fakeTarget(), a4(scene), { ...noText, textRasterizer })
    expect(textRasterizer).toHaveBeenCalledTimes(2)
  })

  test('hands the text item to the rasterizer and skips it when the patch is null', async () => {
    const target = fakeTarget()
    const item = text(50, 100, 'Hello', font, red)
    await paintScene(target, a4([item]), noText)
    expect(noText.textRasterizer).toHaveBeenCalledWith(item)
    expect(target.image).not.toHaveBeenCalled()
  })

  test('passes the rotation and the fill opacity of a text to the image', async () => {
    const target = fakeTarget()
    const item = text(
      50,
      100,
      'Tilted',
      font,
      { ...red, opacity: 0.5 },
      { rotate: 30 },
    )
    await paintScene(target, a4([group([item], 0.5)]), {
      ...noText,
      textRasterizer: rasterizerOf(patch(0, 0)),
    })
    const call = vi.mocked(target.image).mock.calls[0]
    expect(call[5]).toBe(30)
    expect(call[8]).toEqual({ opacity: 0.25 })
  })

  test('reuses a text cache handed in by the caller', async () => {
    const textRasterizer = rasterizerOf(patch(0, 0))
    const textCache = new Map<string, TextPatch | null>()
    for (let i = 0; i < 2; i++) {
      await paintScene(fakeTarget(), a4([text(50, 100, 'Hello', font, red)]), {
        ...noText,
        textRasterizer,
        textCache,
      })
    }
    expect(textRasterizer).toHaveBeenCalledTimes(1)
  })

  test('covers the image box and centres the picture on it', async () => {
    const png = new Uint8Array([137, 80, 78, 71])
    const decodeImage = vi.fn(async () => ({
      png,
      widthPx: 200,
      heightPx: 100,
    }))
    const target = fakeTarget()
    const item = image(box(10, 20, 50, 50), 'data:,x', 0.5)
    await paintScene(target, a4([item]), { ...noText, decodeImage })
    expect(decodeImage).toHaveBeenCalledWith('data:,x')
    const call = vi.mocked(target.image).mock.calls[0]
    // The anchor is the box centre. Covering 50 × 50 mm with a 2:1 picture
    // takes 100 × 50 mm, so the patch's top-left corner is 50 mm left of and
    // 25 mm above the anchor.
    expect(call[0]).toBe(png)
    expect(call[1]).toBeCloseTo(mm(35), 4)
    expect(call[2]).toBeCloseTo(mm(297 - 45), 4)
    expect(call[3]).toBeCloseTo(mm(100), 4)
    expect(call[4]).toBeCloseTo(mm(50), 4)
    expect(call[5]).toBe(0)
    expect(call[6]).toBeCloseTo(-50, 6)
    expect(call[7]).toBeCloseTo(-25, 6)
    expect(call[8]).toEqual({
      clip: {
        x: expect.closeTo(mm(10), 4),
        y: expect.closeTo(mm(297 - 70), 4),
        width: expect.closeTo(mm(50), 4),
        height: expect.closeTo(mm(50), 4),
      },
      opacity: 0.5,
    })
  })

  test('skips an image the decoder cannot decode', async () => {
    const target = fakeTarget()
    await paintScene(target, a4([image(box(0, 0, 10, 10), 'data:,x')]), noText)
    expect(target.image).not.toHaveBeenCalled()
  })
})

describe('patchPlacement', () => {
  const wPt = mm(4)
  const hPt = mm(2)

  test('puts the lower-left corner at (dx, -(dy + h)) from the anchor when not rotated', () => {
    // Top-left 1 mm left of and 1.5 mm above the anchor; the patch is 2 mm
    // tall, so its bottom edge is 0.5 mm below the anchor.
    const place = patchPlacement(100, 200, wPt, hPt, 0, -1, -1.5)
    expect(place.x).toBeCloseTo(100 - mm(1), 6)
    expect(place.y).toBeCloseTo(200 - mm(2 - 1.5), 6)
    expect(place.rotateDeg).toBe(0)
  })

  test('drops a patch that sits to the right of the anchor below it after a 90° clockwise turn', () => {
    // Unrotated lower-left corner (dx, dy + h) = (10 mm, 0): due right.
    // Clockwise on screen turns "right" into "down".
    const place = patchPlacement(100, 200, wPt, hPt, 90, 10, -2)
    expect(place.x).toBeCloseTo(100, 6)
    expect(place.y).toBeCloseTo(200 - mm(10), 6)
    expect(place.rotateDeg).toBe(-90)
  })

  test('moves a corner above the anchor to its right after a 90° clockwise turn', () => {
    // Unrotated lower-left corner (0, -5 mm) in screen coordinates: due up.
    // Clockwise turns "up" into "right".
    const place = patchPlacement(100, 200, wPt, hPt, 90, 0, -7)
    expect(place.x).toBeCloseTo(100 + mm(5), 6)
    expect(place.y).toBeCloseTo(200, 6)
  })

  test('rotates by the given angle: 10 mm to the right, 30° clockwise', () => {
    // On screen the corner goes to (10·cos30°, 10·sin30°) = (8.660, 5) mm,
    // which is 5 mm *below* the anchor, i.e. -5 mm in PDF coordinates.
    const place = patchPlacement(100, 200, wPt, hPt, 30, 10, -2)
    expect(place.x).toBeCloseTo(100 + mm(8.660254), 5)
    expect(place.y).toBeCloseTo(200 - mm(5), 6)
    expect(place.rotateDeg).toBe(-30)
  })
})

/* ------------------------------------------------------------------ */
/* buildPdf: the pdf-lib half                                          */
/* ------------------------------------------------------------------ */

/** A 1 × 1 pixel PNG with an alpha channel. */
const PNG_1X1 = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  ),
  (ch) => ch.charCodeAt(0),
)

/** A fixed patch of 4 × 2 mm whose top-left is (-1, -1.5) mm from the anchor. */
const PATCH: TextPatch = {
  png: PNG_1X1,
  dpi: 254,
  widthPx: 40,
  heightPx: 20,
  dx: -1,
  dy: -1.5,
}
const fixedRasterizer: TextRasterizer = async () => PATCH
const pdfOptions = { textRasterizer: fixedRasterizer }

/** The decoded content stream of a page. */
async function contentOf(page: PDFPage): Promise<string> {
  const contents = page.node.Contents()
  const streams: PDFRawStream[] = []
  if (contents instanceof PDFArray) {
    for (let i = 0; i < contents.size(); i++) {
      streams.push(contents.lookup(i, PDFRawStream))
    }
  } else if (contents instanceof PDFRawStream) {
    streams.push(contents)
  }
  return streams
    .map((stream) =>
      new TextDecoder().decode(decodePDFRawStream(stream).decode()),
    )
    .join('\n')
}

async function contentOfFirstPage(bytes: Uint8Array): Promise<string> {
  return contentOf((await PDFDocument.load(bytes)).getPage(0))
}

/** The graphics-state dictionaries of a page as text; they hold the opacities. */
function graphicsStates(page: PDFPage): string[] {
  const states = page.node.Resources()?.lookup(PDFName.of('ExtGState'), PDFDict)
  if (!states) return []
  return states.entries().map(([, value]) => String(value))
}

describe('buildPdf', () => {
  test('requests actual-size printing in PDF viewers that support it', async () => {
    const pdf = await PDFDocument.load(await buildPdf([a4([])], pdfOptions))
    expect(pdf.catalog.getOrCreateViewerPreferences().getPrintScaling()).toBe(
      'None',
    )
  })
  test('writes a two-page A4 document of the exact physical size', async () => {
    const bytes = await buildPdf(
      [a4([line(10, 20, 30, 20, ink)]), a4([])],
      pdfOptions,
    )
    expect(new TextDecoder().decode(bytes.subarray(0, 5))).toBe('%PDF-')
    const doc = await PDFDocument.load(bytes)
    expect(doc.getPageCount()).toBe(2)
    for (const page of doc.getPages()) {
      const { width, height } = page.getSize()
      expect(Math.abs(width - 595.28)).toBeLessThan(0.02)
      expect(Math.abs(height - 841.89)).toBeLessThan(0.02)
    }
  })

  test('sets the title, creator and producer metadata', async () => {
    // `updateMetadata: false` keeps pdf-lib from stamping its own producer
    // over the stored one while loading.
    const doc = await PDFDocument.load(await buildPdf([a4([])], pdfOptions), {
      updateMetadata: false,
    })
    expect(doc.getTitle()).toBe('Paper by Choice')
    expect(doc.getCreator()).toBe('paper-by-choice')
    expect(doc.getProducer()).toBe('paper-by-choice')
    const custom = await buildPdf([a4([])], {
      ...pdfOptions,
      title: 'Ruled sheet',
      creator: 'Someone',
    })
    const customDoc = await PDFDocument.load(custom, { updateMetadata: false })
    expect(customDoc.getTitle()).toBe('Ruled sheet')
    expect(customDoc.getCreator()).toBe('Someone')
  })

  test('draws a line as vector operators at the converted coordinates', async () => {
    const content = await contentOfFirstPage(
      await buildPdf([a4([line(10, 20, 30, 20, ink)])], pdfOptions),
    )
    const m =
      /([\d.]+) ([\d.]+) m\s+[\d.]+ [\d.]+ m\s+([\d.]+) ([\d.]+) l\s+S/.exec(
        content,
      )
    if (!m) throw new Error(`no line operator in:\n${content}`)
    expect(Number(m[1])).toBeCloseTo(mm(10), 3)
    expect(Number(m[2])).toBeCloseTo(mm(297 - 20), 3)
    expect(Number(m[3])).toBeCloseTo(mm(30), 3)
    expect(Number(m[4])).toBeCloseTo(mm(297 - 20), 3)
  })

  test('writes a dashed stroke as a dash pattern in points', async () => {
    const dashed = { ...ink, dash: [3, 2] }
    const content = await contentOfFirstPage(
      await buildPdf([a4([line(10, 20, 30, 20, dashed)])], pdfOptions),
    )
    expect(content).toContain(`[${mm(3)} ${mm(2)}] 0 d`)
  })

  test('hands path data to pdf-lib in scene orientation, anchored at the page height', async () => {
    // pdf-lib's drawSvgPath translates to (x, y) and then scales by
    // (1, -1): it reads the path the SVG way, with y pointing down from
    // (x, y). So the data keeps the scene's orientation (only scaled to
    // points) and the anchor is the page height; pre-flipped data would
    // come out mirrored.
    const triangle = poly([pt(0, 0), pt(10, 0), pt(0, 10)], true, ink)
    const content = await contentOfFirstPage(
      await buildPdf([a4([triangle])], pdfOptions),
    )
    const anchor = `1 0 0 1 0 ${297 * MM_TO_PT} cm`
    const side = formatNumber(mm(10))
    const expected =
      `${anchor}\\s+1 0 0 1 0 0 cm\\s+1 0 0 -1 0 0 cm` +
      `\\s+[\\s\\S]*?0 0 m\\s+${side} 0 l\\s+0 ${side} l`
    expect(content).toMatch(new RegExp(expected))
  })

  test('fills and strokes a shape with its own opacities', async () => {
    const item = rect(
      box(10, 20, 30, 40),
      { ...ink, opacity: 0.5 },
      { ...red, opacity: 0.25 },
    )
    const doc = await PDFDocument.load(await buildPdf([a4([item])], pdfOptions))
    // pdf-lib keeps opacities in graphics-state dictionaries: `ca` is the
    // fill opacity, `CA` the stroke opacity.
    expect(graphicsStates(doc.getPage(0))).toEqual([
      expect.stringMatching(/\/ca 0\.25\b/),
    ])
    expect(graphicsStates(doc.getPage(0))[0]).toMatch(/\/CA 0\.5\b/)
    // `B` paints the fill and the stroke in one go.
    expect(await contentOf(doc.getPage(0))).toMatch(/\nB\s*$/m)
  })

  test('turns a text patch clockwise around its anchor', async () => {
    // Text at (100, 150) mm, turned 90° clockwise. The patch's lower-left
    // corner is (dx, dy + h) = (-1, 0.5) mm from the anchor on screen.
    // Clockwise by 90° maps (x, y) to (-y, x): (-0.5, -1) mm on screen,
    // which is (-0.5, +1) mm in PDF coordinates. So the corner sits at
    // (99.5, 148) mm from the left and bottom edges.
    const item = text(100, 150, 'Hello', font, red, { rotate: 90 })
    const content = await contentOfFirstPage(
      await buildPdf([a4([item])], pdfOptions),
    )
    const m =
      /1 0 0 1 ([\d.e-]+) ([\d.e-]+) cm\s+([\d.e-]+) ([\d.e-]+) ([\d.e-]+) ([\d.e-]+) 0 0 cm\s+([\d.]+) 0 0 ([\d.]+) 0 0 cm\s+1 0 0 1 0 0 cm\s+\/\S+ Do/.exec(
        content,
      )
    if (!m) throw new Error(`no image operator in:\n${content}`)
    expect(Number(m[1])).toBeCloseTo(mm(99.5), 3)
    expect(Number(m[2])).toBeCloseTo(mm(148), 3)
    expect(Number(m[3])).toBeCloseTo(0, 6)
    expect(Number(m[4])).toBeCloseTo(-1, 6)
    expect(Number(m[5])).toBeCloseTo(1, 6)
    expect(Number(m[6])).toBeCloseTo(0, 6)
    expect(Number(m[7])).toBeCloseTo(mm(4), 4)
    expect(Number(m[8])).toBeCloseTo(mm(2), 4)
  })

  test('clips a scene image to its box and applies its opacity once', async () => {
    const decodeImage = vi.fn(async () => ({
      png: PNG_1X1,
      widthPx: 200,
      heightPx: 100,
    }))
    const item = image(box(10, 20, 50, 50), 'data:,x', 0.2)
    const page = (
      await PDFDocument.load(
        await buildPdf([a4([item])], { ...pdfOptions, decodeImage }),
      )
    ).getPage(0)
    const content = await contentOf(page)
    // Clip path = the box, in points, measured from the bottom-left corner.
    // Float rounding differs by a few ULPs, so match the operators rather
    // than exact coordinate strings.
    const placed =
      /m\s+[\d.e-]+\s+[\d.e-]+\s+l\s+[\d.e-]+\s+[\d.e-]+\s+l\s+[\d.e-]+\s+[\d.e-]+\s+l\s+h\s+W\s+n\s+q\s+\/\S+ gs\s+1 0 0 1 [\d.e-]+ [\d.e-]+ cm[\s\S]*?\/\S+ Do/
    expect(content).toMatch(placed)
    expect(graphicsStates(page)).toEqual([expect.stringMatching(/\/ca 0\.2\b/)])
  })

  test('embeds a set of PNG bytes only once per document', async () => {
    const embed = vi.spyOn(PDFDocument.prototype, 'embedPng')
    let calls = 0
    try {
      const scene = [
        text(50, 100, 'Hello', font, red),
        text(80, 100, 'Hello', font, red),
        image(box(0, 0, 10, 10), 'data:,a'),
        image(box(0, 0, 10, 10), 'data:,b'),
      ]
      const decodeImage = async () => ({
        png: PNG_1X1,
        widthPx: 4,
        heightPx: 4,
      })
      await buildPdf([a4(scene), a4(scene)], { ...pdfOptions, decodeImage })
      calls = embed.mock.calls.length
    } finally {
      embed.mockRestore()
    }
    expect(calls).toBe(1)
  })

  test('skips scene images when no decoder is given', async () => {
    const content = await contentOfFirstPage(
      await buildPdf([a4([image(box(0, 0, 10, 10), 'data:,x')])], pdfOptions),
    )
    expect(content).not.toContain(' Do')
  })
})
