/**
 * 验证 raster 模块的 dotsPerMm、fitDpi、drawScene / line 行为。
 * Tests raster behavior covering dotsPerMm, fitDpi, drawScene / line.
 */
import { describe, expect, test } from 'vitest'
import {
  arc,
  box,
  cubicTo,
  ellipse,
  group,
  image,
  line,
  lineTo,
  moveTo,
  path,
  poly,
  pt,
  quadTo,
  rect,
  text,
} from '../scene/builders'
import type { Page, Scene } from '../scene/types'
import {
  MAX_CANVAS_PIXELS,
  MAX_CANVAS_SIDE,
  canvasToPngBlob,
  dotsPerMm,
  drawScene,
  fitDpi,
  imageSize,
  rasterizePage,
} from './raster'
import type { RasterCanvas, RasterContext } from './raster'

const page = (width: number, height: number): Page => ({
  width,
  height,
  scene: [],
})

const pixelSize = (p: Page, dpi: number) => {
  const scale = dotsPerMm(dpi)
  return { w: Math.ceil(p.width * scale), h: Math.ceil(p.height * scale) }
}

const withinLimits = (p: Page, dpi: number): boolean => {
  const { w, h } = pixelSize(p, dpi)
  return (
    w <= MAX_CANVAS_SIDE && h <= MAX_CANVAS_SIDE && w * h <= MAX_CANVAS_PIXELS
  )
}

interface Call {
  name: string
  args: readonly unknown[]
  globalAlpha: number
  strokeStyle: string
  fillStyle: string
  lineWidth: number
  font: string
  textAlign: string
  textBaseline: string
}

interface State {
  globalAlpha: number
  strokeStyle: string
  fillStyle: string
  lineWidth: number
  font: string
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
}

type MetricsFactory = (text: string) => TextMetrics

const emptyMetrics = (text: string): TextMetrics =>
  ({ width: text.length * 10 }) as TextMetrics

function fakeContext(metrics: MetricsFactory = emptyMetrics) {
  const calls: Call[] = []
  const state: State = {
    globalAlpha: 1,
    strokeStyle: '#000000',
    fillStyle: '#000000',
    lineWidth: 1,
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
  }
  const record = (name: string, ...args: unknown[]): void => {
    calls.push({
      name,
      args,
      globalAlpha: state.globalAlpha,
      strokeStyle: state.strokeStyle,
      fillStyle: state.fillStyle,
      lineWidth: state.lineWidth,
      font: state.font,
      textAlign: state.textAlign,
      textBaseline: state.textBaseline,
    })
  }
  const ctx = Object.assign(state, {
    save(): void {
      record('save')
    },
    restore(): void {
      record('restore')
    },
    scale(x: number, y: number): void {
      record('scale', x, y)
    },
    translate(x: number, y: number): void {
      record('translate', x, y)
    },
    rotate(angle: number): void {
      record('rotate', angle)
    },
    beginPath(): void {
      record('beginPath')
    },
    closePath(): void {
      record('closePath')
    },
    moveTo(x: number, y: number): void {
      record('moveTo', x, y)
    },
    lineTo(x: number, y: number): void {
      record('lineTo', x, y)
    },
    quadraticCurveTo(cx: number, cy: number, x: number, y: number): void {
      record('quadraticCurveTo', cx, cy, x, y)
    },
    bezierCurveTo(
      c1x: number,
      c1y: number,
      c2x: number,
      c2y: number,
      x: number,
      y: number,
    ): void {
      record('bezierCurveTo', c1x, c1y, c2x, c2y, x, y)
    },
    rect(x: number, y: number, w: number, h: number): void {
      record('rect', x, y, w, h)
    },
    ellipse(
      x: number,
      y: number,
      rx: number,
      ry: number,
      rotation: number,
      start: number,
      end: number,
    ): void {
      record('ellipse', x, y, rx, ry, rotation, start, end)
    },
    clip(): void {
      record('clip')
    },
    fill(): void {
      record('fill')
    },
    stroke(): void {
      record('stroke')
    },
    fillText(value: string, x: number, y: number): void {
      record('fillText', value, x, y)
    },
    measureText(value: string): TextMetrics {
      record('measureText', value)
      return metrics(value)
    },
    drawImage(...args: unknown[]): void {
      record('drawImage', ...args)
    },
    setLineDash(dash: number[]): void {
      record('setLineDash', dash)
    },
  })
  return { ctx: ctx as unknown as RasterContext, calls }
}

const names = (calls: readonly Call[]): string[] => calls.map((c) => c.name)
const named = (calls: readonly Call[], name: string, index = 0): Call => {
  const hits = calls.filter((c) => c.name === name)
  const hit = hits[index]
  if (!hit) throw new Error(`no call named ${name} (#${index})`)
  return hit
}

const draw = (scene: Scene, scale = 2) => {
  const { ctx, calls } = fakeContext()
  drawScene(ctx, scene, scale)
  return calls
}

describe('dotsPerMm', () => {
  test('300 dpi is about 11.811 pixels per millimetre', () => {
    expect(dotsPerMm(300)).toBeCloseTo(11.811, 3)
  })
})

describe('fitDpi', () => {
  test('leaves A4 at 300 dpi unchanged', () => {
    expect(fitDpi(page(210, 297), 300)).toBe(300)
  })

  test('reduces an oversized A3 at 1200 dpi to the largest fitting standard resolution', () => {
    const a3 = page(297, 420)
    const fitted = fitDpi(a3, 1200)
    expect(fitted).toBe(600)
    expect(withinLimits(a3, fitted)).toBe(true)
    expect(withinLimits(a3, 1200)).toBe(false)
  })

  test('floors an extreme 5000x5000 mm page at 36 dpi', () => {
    expect(fitDpi(page(5000, 5000), 300)).toBe(36)
  })

  test('never returns less than the 36 dpi floor', () => {
    expect(fitDpi(page(5000, 5000), 10)).toBeGreaterThanOrEqual(36)
  })
})

describe('drawScene / line', () => {
  test('draws a line with the documented call order', () => {
    const calls = draw([line(10, 20, 30, 20, { color: '#123456', width: 0.2 })])
    expect(names(calls)).toEqual([
      'save',
      'scale',
      'beginPath',
      'moveTo',
      'lineTo',
      'stroke',
      'setLineDash',
      'restore',
    ])
    expect(calls[1].args).toEqual([2, 2])
    expect(named(calls, 'moveTo').args).toEqual([10, 20])
    expect(named(calls, 'lineTo').args).toEqual([30, 20])
    expect(named(calls, 'setLineDash').args).toEqual([[]])
  })

  test('sets the stroke colour, width and inherited opacity', () => {
    const calls = draw([
      line(0, 0, 1, 1, { color: '#abcdef', width: 0.35, opacity: 0.4 }),
    ])
    const stroke = named(calls, 'stroke')
    expect(stroke.strokeStyle).toBe('#abcdef')
    expect(stroke.lineWidth).toBe(0.35)
    expect(stroke.globalAlpha).toBeCloseTo(0.4)
  })

  test('sets a dash array and resets it to empty before the next solid line', () => {
    const calls = draw([
      line(0, 0, 10, 0, { color: '#000000', width: 1, dash: [3, 2] }),
      line(0, 5, 10, 5, { color: '#000000', width: 1 }),
    ])
    const dashes = calls
      .filter((c) => c.name === 'setLineDash')
      .map((c) => c.args[0])
    expect(dashes).toEqual([[3, 2], [], []])
    const secondStroke = named(calls, 'stroke', 1)
    expect(calls.indexOf(secondStroke)).toBeGreaterThan(
      calls.findIndex(
        (c) =>
          c.name === 'setLineDash' &&
          Array.isArray(c.args[0]) &&
          (c.args[0] as number[]).length === 0,
      ),
    )
  })
})

describe('drawScene / groups', () => {
  test('multiplies nested group opacities into the primitive alpha', () => {
    const calls = draw([
      group(
        [group([line(0, 0, 1, 0, { color: '#000000', width: 1 })], 0.5)],
        0.5,
      ),
    ])
    expect(named(calls, 'stroke').globalAlpha).toBeCloseTo(0.25)
  })
})

describe('drawScene / rect', () => {
  test('fills before stroking and uses each paint colour', () => {
    const calls = draw([
      rect(
        box(1, 2, 3, 4),
        { color: '#111111', width: 0.5 },
        { color: '#222222' },
      ),
    ])
    expect(names(calls)).toEqual([
      'save',
      'scale',
      'beginPath',
      'rect',
      'fill',
      'stroke',
      'setLineDash',
      'restore',
    ])
    expect(named(calls, 'rect').args).toEqual([1, 2, 3, 4])
    expect(named(calls, 'fill').fillStyle).toBe('#222222')
    expect(named(calls, 'stroke').strokeStyle).toBe('#111111')
  })
})

describe('drawScene / ellipse', () => {
  test('a full ellipse spans 0 to 2pi', () => {
    const calls = draw([ellipse(5, 6, 7, 8, { color: '#000000', width: 1 })])
    expect(named(calls, 'ellipse').args).toEqual([
      5,
      6,
      7,
      8,
      0,
      0,
      2 * Math.PI,
    ])
  })

  test('adds 2pi to an arc whose end is smaller than its start', () => {
    const calls = draw([
      arc(1, 2, 3, 4, 1, -0.5, { color: '#000000', width: 1 }),
    ])
    const args = named(calls, 'ellipse').args
    expect(args.slice(0, 5)).toEqual([1, 2, 3, 4, 0])
    expect(args[5]).toBeCloseTo(1)
    expect(args[6]).toBeCloseTo(-0.5 + 2 * Math.PI)
  })
})

describe('drawScene / poly and path', () => {
  test('emits move/line/close for a closed polygon', () => {
    const calls = draw([
      poly([pt(1, 2), pt(3, 4)], true, { color: '#000000', width: 1 }),
    ])
    expect(names(calls)).toEqual([
      'save',
      'scale',
      'beginPath',
      'moveTo',
      'lineTo',
      'closePath',
      'stroke',
      'setLineDash',
      'restore',
    ])
    expect(named(calls, 'moveTo').args).toEqual([1, 2])
    expect(named(calls, 'lineTo').args).toEqual([3, 4])
  })

  test('emits every path command and an added close for closed paths', () => {
    const calls = draw([
      path(
        [
          moveTo(pt(0, 0)),
          lineTo(pt(1, 1)),
          quadTo(pt(2, 2), pt(3, 3)),
          cubicTo(pt(4, 4), pt(5, 5), pt(6, 6)),
        ],
        true,
        { color: '#000000', width: 1 },
      ),
    ])
    expect(names(calls)).toEqual([
      'save',
      'scale',
      'beginPath',
      'moveTo',
      'lineTo',
      'quadraticCurveTo',
      'bezierCurveTo',
      'closePath',
      'stroke',
      'setLineDash',
      'restore',
    ])
    expect(named(calls, 'quadraticCurveTo').args).toEqual([2, 2, 3, 3])
    expect(named(calls, 'bezierCurveTo').args).toEqual([4, 4, 5, 5, 6, 6])
  })
})

describe('drawScene / text', () => {
  test('builds the font string, transform and alignment', () => {
    const calls = draw([
      text(
        10,
        20,
        'Hello',
        { family: 'serif', size: 12, weight: 700, style: 'italic' },
        { color: '#333333' },
        { anchor: 'middle', baseline: 'middle', rotate: 30 },
      ),
    ])
    expect(names(calls)).toEqual([
      'save',
      'scale',
      'save',
      'translate',
      'rotate',
      'fillText',
      'restore',
      'restore',
    ])
    expect(named(calls, 'translate').args).toEqual([10, 20])
    expect(named(calls, 'rotate').args[0]).toBeCloseTo((30 * Math.PI) / 180)
    const fill = named(calls, 'fillText')
    expect(fill.args).toEqual(['Hello', 0, 0])
    expect(fill.font).toBe('italic 700 12px serif')
    expect(fill.textAlign).toBe('center')
    expect(fill.textBaseline).toBe('middle')
    expect(fill.fillStyle).toBe('#333333')
  })

  test('defaults alignment to start and alphabetic', () => {
    const calls = draw([
      text(0, 0, 'x', { family: 'sans-serif', size: 4 }, '#000000'),
    ])
    const fill = named(calls, 'fillText')
    expect(fill.font).toBe('400 4px sans-serif')
    expect(fill.textAlign).toBe('left')
    expect(fill.textBaseline).toBe('alphabetic')
  })
})

describe('drawScene / image', () => {
  const picture = { width: 200, height: 100 } as CanvasImageSource

  test('centre-crops the picture to cover its box', () => {
    const item = image(box(10, 20, 50, 50), 'data:a')
    const { ctx, calls } = fakeContext()
    drawScene(ctx, [item], 2, new Map([['data:a', picture]]))
    expect(names(calls)).toContain('clip')
    const drawCall = named(calls, 'drawImage')
    expect(drawCall.args[0]).toBe(picture)
    expect(drawCall.args.slice(1)).toEqual([-15, 20, 100, 50])
    expect(named(calls, 'rect').args).toEqual([10, 20, 50, 50])
  })

  test('skips an image that was not loaded', () => {
    const calls = draw([image(box(0, 0, 10, 10), 'data:missing')])
    expect(names(calls)).toEqual(['save', 'scale', 'restore'])
  })
})

describe('imageSize', () => {
  test('reads naturalWidth / naturalHeight of an HTMLImageElement', () => {
    expect(
      imageSize({ naturalWidth: 640, naturalHeight: 480 } as CanvasImageSource),
    ).toEqual({ width: 640, height: 480 })
  })

  test('reads width / height of an ImageBitmap or canvas', () => {
    expect(imageSize({ width: 64, height: 32 } as CanvasImageSource)).toEqual({
      width: 64,
      height: 32,
    })
  })
})

describe('rasterizePage', () => {
  const makeCanvas = () => {
    const made: { w: number; h: number }[] = []
    const createCanvas = (w: number, h: number): RasterCanvas => {
      made.push({ w, h })
      const { ctx } = fakeContext()
      return {
        context: ctx,
        canvas: { width: w, height: h },
        widthPx: w,
        heightPx: h,
      }
    }
    return { made, createCanvas }
  }

  test('creates a canvas at the fitted pixel size', async () => {
    const { made, createCanvas } = makeCanvas()
    const a4 = page(210, 297)
    const result = await rasterizePage(a4, { dpi: 300, createCanvas })
    const scale = dotsPerMm(300)
    expect(made).toEqual([
      { w: Math.ceil(a4.width * scale), h: Math.ceil(a4.height * scale) },
    ])
    expect(result.widthPx).toBe(Math.ceil(a4.width * scale))
    expect(result.heightPx).toBe(Math.ceil(a4.height * scale))
  })

  test('clamps dpi for an oversized page before sizing the canvas', async () => {
    const { made, createCanvas } = makeCanvas()
    await rasterizePage(page(5000, 5000), { dpi: 300, createCanvas })
    const scale = dotsPerMm(36)
    expect(made[0]).toEqual({
      w: Math.ceil(5000 * scale),
      h: Math.ceil(5000 * scale),
    })
  })

  test('loads each distinct image src exactly once before drawing', async () => {
    const { createCanvas } = makeCanvas()
    const loaded: string[] = []
    const loadImage = async (src: string): Promise<CanvasImageSource> => {
      loaded.push(src)
      return { width: 10, height: 10 } as CanvasImageSource
    }
    const scene: Scene = [
      image(box(0, 0, 10, 10), 'data:a'),
      image(box(20, 0, 10, 10), 'data:a'),
      image(box(40, 0, 10, 10), 'data:b'),
    ]
    await rasterizePage(
      { ...page(100, 100), scene },
      { dpi: 72, createCanvas, loadImage },
    )
    expect(loaded).toEqual(['data:a', 'data:b'])
  })
})

describe('canvasToPngBlob', () => {
  test('delegates to convertToBlob on an OffscreenCanvas', async () => {
    const marker = {} as Blob
    let received: string | undefined
    const canvas = {
      width: 4,
      height: 4,
      convertToBlob: async (opts: { type: string }) => {
        received = opts.type
        return marker
      },
    } as unknown as RasterCanvas['canvas']
    expect(await canvasToPngBlob(canvas)).toBe(marker)
    expect(received).toBe('image/png')
  })
})
