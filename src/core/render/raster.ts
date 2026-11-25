/**
 * 将场景绘制到 Canvas 供 PNG 导出。
 * Draws scenes to canvas for PNG export.
 */
/**
 * Canvas raster renderer.
 *
 * Turns a scene into pixels by replaying each item as 2D-context calls in
 * millimetres (the context is scaled once up front). Everything that touches
 * the DOM is injectable, so the drawing logic itself runs in Node against a
 * fake context; browser defaults are supplied for real use.
 */
import type {
  EllipseItem,
  GroupItem,
  ImageItem,
  LineItem,
  Paint,
  Page,
  PathItem,
  PolyItem,
  RectItem,
  Scene,
  SceneItem,
  Stroke,
  TextItem,
} from '../scene/types'

/**
 * The `CanvasRenderingContext2D` members this renderer uses; tests supply a
 * fake object with the same shape.
 */
export type RasterContext = Pick<
  CanvasRenderingContext2D,
  | 'save'
  | 'restore'
  | 'scale'
  | 'translate'
  | 'rotate'
  | 'beginPath'
  | 'closePath'
  | 'moveTo'
  | 'lineTo'
  | 'quadraticCurveTo'
  | 'bezierCurveTo'
  | 'rect'
  | 'ellipse'
  | 'clip'
  | 'fill'
  | 'stroke'
  | 'fillText'
  | 'measureText'
  | 'drawImage'
  | 'setLineDash'
  | 'globalAlpha'
  | 'strokeStyle'
  | 'fillStyle'
  | 'lineWidth'
  | 'font'
  | 'textAlign'
  | 'textBaseline'
>

/** Largest canvas side (px) browsers accept; Safari is the strictest. */
export const MAX_CANVAS_SIDE = 16384
/** Largest canvas area (px²) browsers accept. */
export const MAX_CANVAS_PIXELS = 115_000_000

const MIN_DPI = 36
const MM_PER_INCH = 25.4
const FULL_TURN = 2 * Math.PI
/** Standard export resolutions, finest first; 36 is the hard floor. */
const DPI_LADDER = [600, 300, 150, 96, 72, 36] as const

/** Pixels per millimetre at `dpi`. */
export function dotsPerMm(dpi: number): number {
  return dpi / MM_PER_INCH
}

const fits = (width: number, height: number, scale: number): boolean => {
  const w = Math.ceil(width * scale)
  const h = Math.ceil(height * scale)
  return (
    w <= MAX_CANVAS_SIDE && h <= MAX_CANVAS_SIDE && w * h <= MAX_CANVAS_PIXELS
  )
}

/**
 * Reduces `dpi` until the page's pixel size fits the canvas limits, stepping
 * down through the standard export resolutions; never returns below 36.
 */
export function fitDpi(page: Page, dpi: number): number {
  if (fits(page.width, page.height, dotsPerMm(dpi))) {
    return Math.max(MIN_DPI, dpi)
  }
  const scaleLimit = Math.min(
    MAX_CANVAS_SIDE / page.width,
    MAX_CANVAS_SIDE / page.height,
    Math.sqrt(MAX_CANVAS_PIXELS / (page.width * page.height)),
  )
  const dpiLimit = scaleLimit * MM_PER_INCH
  const step = DPI_LADDER.find((d) => d <= dpiLimit) ?? MIN_DPI
  return Math.max(MIN_DPI, Math.min(dpi, step))
}

function opacityOf(item: { opacity?: number }, inherited: number): number {
  return inherited * (item.opacity ?? 1)
}

function applyStroke(
  ctx: RasterContext,
  stroke: Stroke,
  inherited: number,
): void {
  ctx.globalAlpha = opacityOf(stroke, inherited)
  ctx.strokeStyle = stroke.color
  ctx.lineWidth = stroke.width
  if (stroke.dash && stroke.dash.length > 0) ctx.setLineDash([...stroke.dash])
}

function applyFill(ctx: RasterContext, fill: Paint, inherited: number): void {
  ctx.globalAlpha = opacityOf(fill, inherited)
  ctx.fillStyle = fill.color
}

function endStroke(ctx: RasterContext): void {
  ctx.setLineDash([])
}

function drawLine(ctx: RasterContext, item: LineItem, inherited: number): void {
  applyStroke(ctx, item.stroke, inherited)
  ctx.beginPath()
  ctx.moveTo(item.x1, item.y1)
  ctx.lineTo(item.x2, item.y2)
  ctx.stroke()
  endStroke(ctx)
}

function drawRect(ctx: RasterContext, item: RectItem, inherited: number): void {
  const { x, y, w, h } = item.box
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  if (item.fill) {
    applyFill(ctx, item.fill, inherited)
    ctx.fill()
  }
  if (item.stroke) {
    applyStroke(ctx, item.stroke, inherited)
    ctx.stroke()
    endStroke(ctx)
  }
}

function drawEllipse(
  ctx: RasterContext,
  item: EllipseItem,
  inherited: number,
): void {
  const start = item.start ?? 0
  let end = item.end ?? FULL_TURN
  if (end < start) end += FULL_TURN
  ctx.beginPath()
  ctx.ellipse(item.cx, item.cy, item.rx, item.ry, 0, start, end)
  if (item.fill) {
    applyFill(ctx, item.fill, inherited)
    ctx.fill()
  }
  if (item.stroke) {
    applyStroke(ctx, item.stroke, inherited)
    ctx.stroke()
    endStroke(ctx)
  }
}

function drawPoly(ctx: RasterContext, item: PolyItem, inherited: number): void {
  const [first, ...rest] = item.points
  if (!first) return
  ctx.beginPath()
  ctx.moveTo(first.x, first.y)
  for (const p of rest) ctx.lineTo(p.x, p.y)
  if (item.closed) ctx.closePath()
  if (item.fill) {
    applyFill(ctx, item.fill, inherited)
    ctx.fill()
  }
  if (item.stroke) {
    applyStroke(ctx, item.stroke, inherited)
    ctx.stroke()
    endStroke(ctx)
  }
}

function drawPath(ctx: RasterContext, item: PathItem, inherited: number): void {
  ctx.beginPath()
  for (const c of item.d) {
    switch (c.op) {
      case 'M':
        ctx.moveTo(c.p.x, c.p.y)
        break
      case 'L':
        ctx.lineTo(c.p.x, c.p.y)
        break
      case 'Q':
        ctx.quadraticCurveTo(c.c.x, c.c.y, c.p.x, c.p.y)
        break
      case 'C':
        ctx.bezierCurveTo(c.c1.x, c.c1.y, c.c2.x, c.c2.y, c.p.x, c.p.y)
        break
      case 'Z':
        ctx.closePath()
        break
    }
  }
  if (item.closed) ctx.closePath()
  if (item.fill) {
    applyFill(ctx, item.fill, inherited)
    ctx.fill()
  }
  if (item.stroke) {
    applyStroke(ctx, item.stroke, inherited)
    ctx.stroke()
    endStroke(ctx)
  }
}

/** CSS font shorthand matching the scene text font. */
export function fontOf(font: TextItem['font']): string {
  const italic = font.style === 'italic' ? 'italic ' : ''
  return `${italic}${font.weight ?? 400} ${font.size}px ${font.family}`
}

function drawText(ctx: RasterContext, item: TextItem, inherited: number): void {
  ctx.save()
  ctx.translate(item.x, item.y)
  ctx.rotate(((item.rotate ?? 0) * Math.PI) / 180)
  ctx.font = fontOf(item.font)
  // Scene anchors are SVG's `start` / `middle` / `end`; Canvas uses
  // `left` / `center` / `right`.
  ctx.textAlign =
    item.anchor === 'middle'
      ? 'center'
      : item.anchor === 'end'
        ? 'right'
        : 'left'
  ctx.textBaseline = item.baseline ?? 'alphabetic'
  applyFill(ctx, item.fill, inherited)
  ctx.fillText(item.text, 0, 0)
  ctx.restore()
}

/**
 * Reads an image's intrinsic size from `naturalWidth` / `naturalHeight`
 * (HTMLImageElement) or `width` / `height` (ImageBitmap, canvas).
 */
export function imageSize(image: CanvasImageSource): {
  width: number
  height: number
} {
  const sized = image as unknown as {
    naturalWidth?: number
    naturalHeight?: number
    width?: number
    height?: number
  }
  if (
    typeof sized.naturalWidth === 'number' &&
    typeof sized.naturalHeight === 'number'
  ) {
    return { width: sized.naturalWidth, height: sized.naturalHeight }
  }
  return { width: sized.width ?? 0, height: sized.height ?? 0 }
}

function drawImage(
  ctx: RasterContext,
  item: ImageItem,
  inherited: number,
  images: ReadonlyMap<string, CanvasImageSource> | undefined,
): void {
  const source = images?.get(item.src)
  if (!source) return
  const { width, height } = imageSize(source)
  if (!(width > 0) || !(height > 0)) return
  const { x, y, w, h } = item.box
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  const scale = Math.max(w / width, h / height)
  const dw = width * scale
  const dh = height * scale
  ctx.globalAlpha = opacityOf(item, inherited)
  ctx.drawImage(source, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
  ctx.restore()
}

function drawItem(
  ctx: RasterContext,
  item: SceneItem,
  inherited: number,
  images: ReadonlyMap<string, CanvasImageSource> | undefined,
): void {
  if (item.op === 'g') {
    drawItems(
      ctx,
      (item as GroupItem).items,
      inherited * (item.opacity ?? 1),
      images,
    )
    return
  }
  switch (item.op) {
    case 'line':
      return drawLine(ctx, item, inherited)
    case 'rect':
      return drawRect(ctx, item, inherited)
    case 'ellipse':
      return drawEllipse(ctx, item, inherited)
    case 'poly':
      return drawPoly(ctx, item, inherited)
    case 'path':
      return drawPath(ctx, item, inherited)
    case 'text':
      return drawText(ctx, item, inherited)
    case 'image':
      return drawImage(ctx, item, inherited, images)
  }
}

function drawItems(
  ctx: RasterContext,
  items: readonly SceneItem[],
  inherited: number,
  images: ReadonlyMap<string, CanvasImageSource> | undefined,
): void {
  for (const item of items) drawItem(ctx, item, inherited, images)
}

/**
 * Draws `scene` onto an untransformed context at `scale` pixels per mm,
 * wrapping the whole pass in `save` / `scale` / `restore`.
 */
export function drawScene(
  ctx: RasterContext,
  scene: Scene,
  scale: number,
  images?: ReadonlyMap<string, CanvasImageSource>,
): void {
  ctx.save()
  ctx.scale(scale, scale)
  drawItems(ctx, scene, 1, images)
  ctx.restore()
}

/** A raster canvas plus its 2D context and pixel size. */
export interface RasterCanvas {
  context: RasterContext
  canvas: { width: number; height: number }
  widthPx: number
  heightPx: number
}

/** Options for rasterizing a whole page. */
export interface RasterizeOptions {
  dpi: number
  /** Creates the canvas; browser default prefers OffscreenCanvas. */
  createCanvas?: (widthPx: number, heightPx: number) => RasterCanvas
  /** Decodes a data URL into a drawable image; the default caches by src. */
  loadImage?: (src: string) => Promise<CanvasImageSource>
}

/** The browser's canvas factory, preferring OffscreenCanvas. */
export const defaultCreateCanvas = (
  widthPx: number,
  heightPx: number,
): RasterCanvas => {
  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(widthPx, heightPx)
      : Object.assign(document.createElement('canvas'), {
          width: widthPx,
          height: heightPx,
        })
  const context = canvas.getContext('2d') as RasterContext | null
  if (!context) throw new Error('2D canvas context unavailable')
  return {
    context,
    canvas: canvas as { width: number; height: number },
    widthPx,
    heightPx,
  }
}

const imageCache = new Map<string, Promise<CanvasImageSource>>()

/** Browser image loader: decodes a data URL with `Image.decode()`, cached by src. */
export const defaultLoadImage = (src: string): Promise<CanvasImageSource> => {
  let pending = imageCache.get(src)
  if (!pending) {
    const img = new Image()
    img.src = src
    pending = img.decode().then(() => img)
    imageCache.set(src, pending)
  }
  return pending
}

function collectImageSources(scene: Scene): string[] {
  const sources: string[] = []
  const seen = new Set<string>()
  const visit = (items: readonly SceneItem[]): void => {
    for (const item of items) {
      if (item.op === 'g') visit(item.items)
      else if (item.op === 'image' && !seen.has(item.src)) {
        seen.add(item.src)
        sources.push(item.src)
      }
    }
  }
  visit(scene)
  return sources
}

/**
 * Renders one page: `dpi` is clamped by `fitDpi`, all images are loaded up
 * front, then the scene is drawn at the resulting pixel density.
 */
export async function rasterizePage(
  page: Page,
  opts: RasterizeOptions,
): Promise<RasterCanvas> {
  const scale = dotsPerMm(fitDpi(page, opts.dpi))
  const widthPx = Math.ceil(page.width * scale)
  const heightPx = Math.ceil(page.height * scale)
  const createCanvas = opts.createCanvas ?? defaultCreateCanvas
  const canvas = createCanvas(widthPx, heightPx)
  const loadImage = opts.loadImage ?? defaultLoadImage
  const sources = collectImageSources(page.scene)
  const images = new Map<string, CanvasImageSource>()
  for (const src of sources) images.set(src, await loadImage(src))
  drawScene(canvas.context, page.scene, scale, images)
  return canvas
}

/**
 * Exports a canvas as a PNG `Blob`, using `convertToBlob` for
 * OffscreenCanvas and `toBlob` for an HTMLCanvasElement.
 */
export function canvasToPngBlob(canvas: RasterCanvas['canvas']): Promise<Blob> {
  const offscreen = canvas as Partial<OffscreenCanvas>
  if (typeof offscreen.convertToBlob === 'function') {
    return offscreen.convertToBlob({ type: 'image/png' })
  }
  const element = canvas as HTMLCanvasElement
  return new Promise<Blob>((resolve, reject) => {
    element.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))),
      'image/png',
    )
  })
}
