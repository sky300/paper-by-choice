/**
 * Text patch rasterization for the PDF renderer.
 *
 * A `TextItem` is drawn onto a small transparent canvas at high resolution and
 * exported as a PNG with alpha. The PDF renderer embeds that patch as an image
 * (see `pdf.ts`), which keeps the app small: no CJK font has to be bundled.
 *
 * All DOM access is injectable, so the layout maths and the drawing sequence
 * can be tested in Node with a fake canvas.
 */
import type { TextItem } from '../scene/types'
import type { TextPatch, TextRasterizer } from './pdf'
import { canvasToPngBlob, fontOf, type RasterCanvas } from './raster'

/** The four distances a `TextMetrics` reports around the alignment point. */
export interface TextMetricsLike {
  left: number
  right: number
  ascent: number
  descent: number
}

export interface PatchLayout {
  widthPx: number
  heightPx: number
  /** Offsets of the patch's top-left corner from the text anchor, in mm. */
  dx: number
  dy: number
}

/** Converts a measured bounding box into a patch size and its anchor offsets. */
export function patchLayout(
  m: TextMetricsLike,
  scale: number,
  paddingPx: number,
): PatchLayout {
  return {
    widthPx: Math.ceil(m.left + m.right + 2 * paddingPx),
    heightPx: Math.ceil(m.ascent + m.descent + 2 * paddingPx),
    dx: -(m.left + paddingPx) / scale,
    dy: -(m.ascent + paddingPx) / scale,
  }
}

export interface TextRasterOptions {
  /** Pixel density of the patch. 600 is a good sharpness / size balance. */
  dpi: number
  /** Transparent padding around the glyphs, in pixels. */
  paddingPx?: number
  /** Colour of the glyphs. The PDF applies the scene's opacity. */
  color?: string
  /** Canvas factory; the browser default prefers OffscreenCanvas. */
  createCanvas?: (widthPx: number, heightPx: number) => RasterCanvas
}

interface Measured extends TextMetricsLike {
  fillX: number
  fillY: number
}

/** Applies the scene text's font and alignment to a raster context. */
function applyTextStyle(ctx: RasterCanvas['context'], item: TextItem): void {
  ctx.font = fontOf(item.font)
  ctx.textAlign = (item.anchor ?? 'start') as CanvasTextAlign
  ctx.textBaseline = item.baseline ?? 'alphabetic'
}

/**
 * Measures a text run. When `actualBoundingBox*` fields are unavailable we
 * fall back to estimating from `width` and the font size, using the anchor to
 * decide how much of the text sits to the left of the alignment point.
 */
function measure(
  ctx: RasterCanvas['context'],
  item: TextItem,
  scale: number,
): Measured {
  applyTextStyle(ctx, item)
  const m = ctx.measureText(item.text)
  const pxSize = item.font.size * scale
  const left = m.actualBoundingBoxLeft
  const right = m.actualBoundingBoxRight
  const ascent = m.actualBoundingBoxAscent
  const descent = m.actualBoundingBoxDescent
  const valid =
    [left, right, ascent, descent].every(
      (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0,
    ) && m.width > 0

  if (valid) {
    return {
      left: left as number,
      right: right as number,
      ascent: ascent as number,
      descent: descent as number,
      fillX: 0,
      fillY: 0,
    }
  }

  const width = m.width || pxSize * item.text.length * 0.6
  const anchor = item.anchor ?? 'start'
  const leftPart =
    anchor === 'end' ? width : anchor === 'middle' ? width / 2 : 0
  return {
    left: leftPart,
    right: width - leftPart,
    ascent: pxSize * 0.88,
    descent: pxSize * 0.22,
    fillX: 0,
    fillY: 0,
  }
}

/** Builds a rasterizer that turns one text item into one transparent PNG patch. */
export function createTextRasterizer(opts: TextRasterOptions): TextRasterizer {
  const scale = opts.dpi / 25.4
  const paddingPx = opts.paddingPx ?? 2
  const color = opts.color ?? '#000000'
  const createCanvas: (w: number, h: number) => RasterCanvas =
    opts.createCanvas ?? ((w, h) => defaultCanvas(w, h))

  return async (item: TextItem): Promise<TextPatch | null> => {
    const value = item.text.trim()
    if (value.length === 0) return null
    const textItem: TextItem = { ...item, text: value }

    // Pass 1: measure on a throwaway 1×1 canvas.
    const measuring = createCanvas(1, 1)
    const m = measure(measuring.context, textItem, scale)

    // Pass 2: draw into a canvas sized to the measured bounding box.
    const layout = patchLayout(m, scale, paddingPx)
    const drawing = createCanvas(layout.widthPx, layout.heightPx)
    const ctx = drawing.context
    applyTextStyle(ctx, textItem)
    ctx.fillStyle = color
    ctx.fillText(
      value,
      m.left + paddingPx + m.fillX,
      m.ascent + paddingPx + m.fillY,
    )

    const blob = await canvasToPngBlob(drawing.canvas)
    const png = new Uint8Array(await blob.arrayBuffer())
    return {
      png,
      dpi: opts.dpi,
      widthPx: layout.widthPx,
      heightPx: layout.heightPx,
      dx: layout.dx,
      dy: layout.dy,
    }
  }
}

/** Browser canvas factory, preferring OffscreenCanvas. */
function defaultCanvas(widthPx: number, heightPx: number): RasterCanvas {
  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(widthPx, heightPx)
      : Object.assign(document.createElement('canvas'), {
          width: widthPx,
          height: heightPx,
        })
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create a 2D canvas context')
  return {
    canvas: canvas as unknown as RasterCanvas['canvas'],
    context: context as unknown as RasterCanvas['context'],
    widthPx,
    heightPx,
  }
}
