/**
 * Vector PDF renderer.
 *
 * Lines and curves stay vector, so the file scales losslessly in any
 * reader. Text is rasterized into transparent patches (see `TextRasterizer`)
 * because embedding CJK fonts would add tens of megabytes to the app.
 *
 * `paintScene` is the pure half: it walks a page, converts millimetres to
 * points, measures `y` from the bottom edge and calls a `PdfPageTarget`.
 * `buildPdf` is the pdf-lib half behind that target: vector operators for
 * lines and curves, embedded PNGs for text patches and images.
 */
import {
  PDFDocument,
  PrintScaling,
  clip,
  closePath,
  degrees,
  endPath,
  lineTo,
  moveTo,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  type PDFImage,
  type PDFPage,
} from 'pdf-lib'
import type {
  Page,
  Paint,
  PathCommand,
  SceneItem,
  Shape,
  Stroke,
  TextItem,
} from '../scene/types'
import {
  arcToPath,
  polyToPath,
  resolvePaint,
  toPathData,
  type ResolvedFill,
  type ResolvedPaint,
  type ResolvedStroke,
} from './pathData'
import type { Rgb } from './color'

/** Points per millimetre (1 mm = 72 / 25.4 pt). */
export const MM_TO_PT = 72 / 25.4

/**
 * A text run rasterized into a transparent PNG patch.
 *
 * The patch carries the text's colour; the PDF renderer only applies the
 * opacity. Offsets are in millimetres, in the text's own unrotated frame.
 */
export interface TextPatch {
  /** PNG bytes with an alpha channel. */
  png: Uint8Array
  dpi: number
  widthPx: number
  heightPx: number
  /** Offset of the patch's top-left corner from the text anchor (x, y). */
  dx: number
  dy: number
}

/** Rasterizes one text item; `null` means the text draws nothing. */
export type TextRasterizer = (item: TextItem) => Promise<TextPatch | null>

/** A rectangle in PDF points. */
export interface PdfClipRect {
  x: number
  y: number
  width: number
  height: number
}

/** How an image is composited onto the page. */
export interface PdfImageOptions {
  /** Clips the image to this rectangle; omitted means no clipping. */
  clip?: PdfClipRect
  /** 0–1; omitted means opaque. */
  opacity?: number
}

/**
 * The drawing surface of one PDF page.
 *
 * Coordinates are PDF points (1 mm = `MM_TO_PT` points) with the origin at
 * the page's bottom-left corner and `y` pointing up; `paintScene` has
 * already done that conversion. The one exception is `path`, see there.
 * The real implementation wraps pdf-lib; tests record the calls.
 */
export interface PdfPageTarget {
  sizePt: { width: number; height: number }
  line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    paint: ResolvedPaint,
  ): void
  /** `x, y` is the rectangle's bottom-left corner; lengths are in points. */
  rect(x: number, y: number, w: number, h: number, paint: ResolvedPaint): void
  /**
   * Draws a path and strokes / fills it according to `paint`.
   *
   * `svgPath` is SVG path data in *points* with the origin at the page's
   * top-left and `y` pointing down, i.e. the scene's own orientation: SVG
   * path readers (pdf-lib's `drawSvgPath` among them) expect exactly that
   * and the target flips it, so the data must not be flipped here.
   */
  path(svgPath: string, paint: ResolvedPaint): void
  /**
   * Places an image patch of `wPt × hPt`.
   *
   * `(anchorX, anchorY)` is the anchor in PDF points. Unrotated, the
   * patch's top-left corner sits `(dxMm, dyMm)` millimetres from the anchor
   * (`dyMm` positive is down). The whole patch is turned clockwise by
   * `rotateDeg` degrees around the anchor, as seen on the page.
   */
  image(
    png: Uint8Array,
    anchorX: number,
    anchorY: number,
    wPt: number,
    hPt: number,
    rotateDeg: number,
    dxMm: number,
    dyMm: number,
    opts?: PdfImageOptions,
  ): Promise<void>
}

/** A decoded scene image, ready for `embedPng`. */
export interface ImageDecoded {
  png: Uint8Array
  widthPx: number
  heightPx: number
}

export interface PaintOptions {
  textRasterizer: TextRasterizer
  /**
   * Decodes a scene image (a data URL) into PNG bytes. Opacity is applied
   * by the renderer, so the decoder must not bake it into the pixels.
   * `null` skips the image.
   */
  decodeImage: (src: string) => Promise<ImageDecoded | null>
  /** Patches rasterized so far; pass one in to share them between pages. */
  textCache?: Map<string, TextPatch | null>
}

/**
 * Where pdf-lib must place a patch that is turned clockwise by `rotateDeg`
 * around its anchor: pdf-lib rotates an image around its lower-left corner,
 * so that corner is where the anchor's rotation sends it.
 */
export function patchPlacement(
  anchorX: number,
  anchorY: number,
  _wPt: number,
  hPt: number,
  rotateDeg: number,
  dxMm: number,
  dyMm: number,
): { x: number; y: number; rotateDeg: number } {
  // Offset of the patch's lower-left corner from the anchor, unrotated, in
  // PDF coordinates: (dx, -(dy + h)).
  const ox = dxMm * MM_TO_PT
  const oy = -(dyMm * MM_TO_PT + hPt)
  // Clockwise on the page is a negative (counter-clockwise) PDF angle.
  // `0` rather than `-0`, which is a different value to `Object.is`.
  const angle = (-rotateDeg * Math.PI) / 180
  return {
    x: anchorX + ox * Math.cos(angle) - oy * Math.sin(angle),
    y: anchorY + ox * Math.sin(angle) + oy * Math.cos(angle),
    rotateDeg: rotateDeg === 0 ? 0 : -rotateDeg,
  }
}

interface Painter {
  target: PdfPageTarget
  /** Page height in millimetres. */
  pageHeight: number
  opts: PaintOptions
  textCache: Map<string, TextPatch | null>
}

const mm = (value: number): number => value * MM_TO_PT

/** Resolved paint with the stroke width and dash turned into points. */
function paintInPoints(paint: ResolvedPaint): ResolvedPaint {
  const stroke: ResolvedStroke | null = paint.stroke
  if (!stroke) return paint
  return {
    ...paint,
    stroke: { ...stroke, width: mm(stroke.width), dash: stroke.dash.map(mm) },
  }
}

/** Cache key of a text: everything that changes its patch, not its position. */
function textKey(item: TextItem): string {
  const { font } = item
  return JSON.stringify([
    item.text,
    font.family,
    font.size,
    font.weight ?? null,
    font.style ?? null,
    item.anchor ?? null,
    item.baseline ?? null,
    item.rotate ?? 0,
    item.fill.color,
  ])
}

async function paintPath(
  commands: readonly PathCommand[],
  stroke: Stroke | undefined,
  fill: Paint | undefined,
  inherited: number,
  p: Painter,
): Promise<void> {
  const paint = resolvePaint(stroke, fill, inherited)
  if (commands.length === 0 || (!paint.stroke && !paint.fill)) return
  p.target.path(toPathData(commands, { scale: MM_TO_PT }), paintInPoints(paint))
}

async function paintText(
  item: TextItem,
  inherited: number,
  p: Painter,
): Promise<void> {
  const key = textKey(item)
  let patch = p.textCache.get(key)
  if (patch === undefined) {
    patch = await p.opts.textRasterizer(item)
    p.textCache.set(key, patch)
  }
  if (!patch) return
  const paint = resolvePaint(undefined, item.fill, inherited)
  // Pixels to points at the patch's resolution.
  const px = 72 / patch.dpi
  await p.target.image(
    patch.png,
    mm(item.x),
    mm(p.pageHeight - item.y),
    patch.widthPx * px,
    patch.heightPx * px,
    item.rotate ?? 0,
    patch.dx,
    patch.dy,
    { opacity: paint.fill?.opacity ?? 0 },
  )
}

async function paintImage(
  item: Extract<Shape, { op: 'image' }>,
  inherited: number,
  p: Painter,
): Promise<void> {
  const decoded = await p.opts.decodeImage(item.src)
  if (!decoded || !(decoded.widthPx > 0) || !(decoded.heightPx > 0)) return
  const { x, y, w, h } = item.box
  const boxW = mm(w)
  const boxH = mm(h)
  // Cover: scale so the picture fills the box, then centre it. What sticks
  // out is clipped by the target.
  const scale = Math.max(boxW / decoded.widthPx, boxH / decoded.heightPx)
  const wPt = decoded.widthPx * scale
  const hPt = decoded.heightPx * scale
  const opacity = inherited * (item.opacity ?? 1)
  await p.target.image(
    decoded.png,
    mm(x + w / 2),
    mm(p.pageHeight - (y + h / 2)),
    wPt,
    hPt,
    0,
    -wPt / 2 / MM_TO_PT,
    -hPt / 2 / MM_TO_PT,
    {
      clip: {
        x: mm(x),
        y: mm(p.pageHeight - (y + h)),
        width: boxW,
        height: boxH,
      },
      opacity: Math.min(1, Math.max(0, opacity)),
    },
  )
}

async function paintItem(
  item: Shape,
  inherited: number,
  p: Painter,
): Promise<void> {
  const fromTop = (y: number): number => mm(p.pageHeight - y)
  switch (item.op) {
    case 'line': {
      const paint = resolvePaint(item.stroke, undefined, inherited)
      if (!paint.stroke) return
      p.target.line(
        mm(item.x1),
        fromTop(item.y1),
        mm(item.x2),
        fromTop(item.y2),
        paintInPoints(paint),
      )
      return
    }
    case 'rect': {
      const paint = resolvePaint(item.stroke, item.fill, inherited)
      if (!paint.stroke && !paint.fill) return
      const { x, y, w, h } = item.box
      p.target.rect(mm(x), fromTop(y + h), mm(w), mm(h), paintInPoints(paint))
      return
    }
    case 'ellipse':
      if (!(item.rx > 0) || !(item.ry > 0)) return
      return paintPath(arcToPath(item), item.stroke, item.fill, inherited, p)
    case 'poly':
      return paintPath(
        polyToPath(item.points, item.closed),
        item.stroke,
        item.fill,
        inherited,
        p,
      )
    case 'path': {
      const last = item.d.at(-1)
      const commands: readonly PathCommand[] =
        item.closed && last?.op !== 'Z'
          ? [...item.d, { op: 'Z' } as const]
          : item.d
      return paintPath(commands, item.stroke, item.fill, inherited, p)
    }
    case 'text':
      return paintText(item, inherited, p)
    case 'image':
      return paintImage(item, inherited, p)
  }
}

async function paintItems(
  items: readonly SceneItem[],
  inherited: number,
  p: Painter,
): Promise<void> {
  for (const item of items) {
    if (item.op === 'g') {
      await paintItems(item.items, inherited * (item.opacity ?? 1), p)
    } else {
      await paintItem(item, inherited, p)
    }
  }
}

/**
 * Draws one page onto `target`: groups are flattened with their opacity
 * multiplied into each child, lines and rectangles become `line` / `rect`,
 * every other shape becomes path data, text and images become images.
 * Identical text is rasterized once per `textCache`.
 */
export async function paintScene(
  target: PdfPageTarget,
  page: Page,
  opts: PaintOptions,
): Promise<void> {
  await paintItems(page.scene, 1, {
    target,
    pageHeight: page.height,
    opts,
    textCache: opts.textCache ?? new Map(),
  })
}

/* ------------------------------------------------------------------ */
/* buildPdf: the pdf-lib half                                          */
/* ------------------------------------------------------------------ */

export interface BuildPdfOptions {
  textRasterizer: TextRasterizer
  /** PDF title metadata, `'Paper by Choice'` by default. */
  title?: string
  /** PDF creator metadata, `'paper-by-choice'` by default. */
  creator?: string
  /** Decodes scene images into PNG bytes; without it, images are left out. */
  decodeImage?: PaintOptions['decodeImage']
}

const toColor = ({ r, g, b }: Rgb) => rgb(r / 255, g / 255, b / 255)

/**
 * `undefined` when fully opaque: pdf-lib would otherwise register a
 * separate graphics-state object for every item drawn.
 */
function unlessOpaque(opacity: number): number | undefined {
  return opacity === 1 ? undefined : opacity
}

/** Border options of `drawRectangle` / `drawSvgPath`; no stroke means no border. */
function borderOptions(stroke: ResolvedStroke | null) {
  if (!stroke) return { borderWidth: 0 }
  return {
    borderColor: toColor(stroke.color),
    borderWidth: stroke.width,
    borderOpacity: unlessOpaque(stroke.opacity),
    borderDashArray: stroke.dash.length > 0 ? [...stroke.dash] : undefined,
    borderDashPhase: 0,
  }
}

/** Fill options of `drawRectangle` / `drawSvgPath`; no fill paints nothing. */
function fillOptions(fill: ResolvedFill | null) {
  if (!fill) return {}
  return { color: toColor(fill.color), opacity: unlessOpaque(fill.opacity) }
}

/** Embeds `png` once: later requests for the same bytes share the result. */
function embedOnce(
  doc: PDFDocument,
  embedded: Map<Uint8Array, Promise<PDFImage>>,
  png: Uint8Array,
): Promise<PDFImage> {
  let pending = embedded.get(png)
  if (!pending) {
    pending = doc.embedPng(png)
    embedded.set(png, pending)
  }
  return pending
}

/** The real target: every length it receives is already in points. */
function pdfLibTarget(
  doc: PDFDocument,
  page: PDFPage,
  embedded: Map<Uint8Array, Promise<PDFImage>>,
): PdfPageTarget {
  const { width, height } = page.getSize()
  return {
    sizePt: { width, height },
    line(x1, y1, x2, y2, paint) {
      const stroke = paint.stroke
      if (!stroke) return
      page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness: stroke.width,
        color: toColor(stroke.color),
        opacity: unlessOpaque(stroke.opacity),
        dashArray: stroke.dash.length > 0 ? [...stroke.dash] : undefined,
        dashPhase: 0,
      })
    },
    rect(x, y, w, h, paint) {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        ...borderOptions(paint.stroke),
        ...fillOptions(paint.fill),
      })
    },
    path(svgPath, paint) {
      // drawSvgPath reads its data the SVG way (y down from the anchor at
      // (x, y)) and flips y itself, so the anchor is the page height.
      page.drawSvgPath(svgPath, {
        x: 0,
        y: height,
        ...borderOptions(paint.stroke),
        ...fillOptions(paint.fill),
      })
    },
    async image(png, anchorX, anchorY, wPt, hPt, rotateDeg, dxMm, dyMm, opts) {
      const image = await embedOnce(doc, embedded, png)
      const placed = patchPlacement(
        anchorX,
        anchorY,
        wPt,
        hPt,
        rotateDeg,
        dxMm,
        dyMm,
      )
      const box = opts?.clip
      if (box) {
        const { x, y, width: w, height: h } = box
        page.pushOperators(
          pushGraphicsState(),
          moveTo(x, y),
          lineTo(x + w, y),
          lineTo(x + w, y + h),
          lineTo(x, y + h),
          closePath(),
          clip(),
          endPath(),
        )
      }
      page.drawImage(image, {
        x: placed.x,
        y: placed.y,
        width: wPt,
        height: hPt,
        rotate: degrees(placed.rotateDeg),
        opacity:
          opts?.opacity === undefined ? undefined : unlessOpaque(opts.opacity),
      })
      if (box) page.pushOperators(popGraphicsState())
    },
  }
}

/**
 * Builds a complete PDF document, one page per `Page`, each sized by
 * converting its millimetres to points exactly. Text that occurs more than
 * once is rasterized and embedded once per document.
 */
export async function buildPdf(
  pages: readonly Page[],
  opts: BuildPdfOptions,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(opts.title ?? 'Paper by Choice')
  doc.setCreator(opts.creator ?? 'paper-by-choice')
  doc.setProducer('paper-by-choice')
  doc.catalog.getOrCreateViewerPreferences().setPrintScaling(PrintScaling.None)
  const embedded = new Map<Uint8Array, Promise<PDFImage>>()
  const textCache = new Map<string, TextPatch | null>()
  const decodeImage: PaintOptions['decodeImage'] =
    opts.decodeImage ?? (async () => null)
  for (const page of pages) {
    const pdfPage = doc.addPage([page.width * MM_TO_PT, page.height * MM_TO_PT])
    await paintScene(pdfLibTarget(doc, pdfPage, embedded), page, {
      textRasterizer: opts.textRasterizer,
      decodeImage,
      textCache,
    })
  }
  return doc.save()
}
