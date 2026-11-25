/**
 * 将场景转换为 SVG。
 * Converts a scene to SVG.
 */
/**
 * SVG serializer.
 *
 * Turns a scene into one standalone `<svg>` element whose user units are
 * millimetres, so the same string serves the on-screen preview and the SVG
 * export. Pure string assembly with no DOM access: a page easily holds a
 * thousand items and the preview re-serializes on every slider change.
 */
import { closePath, polylinePath } from '../scene/builders'
import type {
  EllipseItem,
  ImageItem,
  Paint,
  Page,
  PathCommand,
  Scene,
  SceneItem,
  Stroke,
  TextItem,
} from '../scene/types'

/** Options of the serializers. */
export interface SvgOptions {
  /** Decimal places of coordinates, 3 by default. */
  precision?: number
}

const SVG_NS = 'http://www.w3.org/2000/svg'
const XLINK_NS = 'http://www.w3.org/1999/xlink'
const FULL_TURN = 2 * Math.PI

/**
 * Formats a number for SVG output: rounded to `precision` decimals, without
 * trailing zeros, and `0` for negative zero and non-finite values (which
 * would make the attribute invalid).
 */
export function formatNumber(value: number, precision = 3): string {
  if (!Number.isFinite(value)) return '0'
  let text = value.toFixed(Math.max(0, Math.floor(precision)))
  if (text.includes('.')) text = text.replace(/0+$/, '').replace(/\.$/, '')
  return text === '-0' ? '0' : text
}

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

/** Escapes `& < > " '` so that text and attribute values stay well-formed. */
export function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => XML_ESCAPES[ch])
}

/** Formats one point as `x y`. */
export type PointFormatter = (x: number, y: number) => string

/**
 * Formats path commands as SVG path data with absolute `M / L / Q / C / Z`
 * commands; `pt` formats one point, so callers can scale or flip on the way.
 */
export function pathCommandsToData(
  commands: readonly PathCommand[],
  pt: PointFormatter,
): string {
  const parts: string[] = []
  for (const c of commands) {
    switch (c.op) {
      case 'M':
        parts.push(`M ${pt(c.p.x, c.p.y)}`)
        break
      case 'L':
        parts.push(`L ${pt(c.p.x, c.p.y)}`)
        break
      case 'Q':
        parts.push(`Q ${pt(c.c.x, c.c.y)} ${pt(c.p.x, c.p.y)}`)
        break
      case 'C':
        parts.push(
          `C ${pt(c.c1.x, c.c1.y)} ${pt(c.c2.x, c.c2.y)} ${pt(c.p.x, c.p.y)}`,
        )
        break
      case 'Z':
        parts.push('Z')
        break
    }
  }
  return parts.join(' ')
}

/** Formats one coordinate. */
type Num = (value: number) => string

/** Number formatting shared by one serialization pass. */
interface Formatter {
  n: Num
  pt: PointFormatter
}

function formatterOf(opts: SvgOptions): Formatter {
  const n: Num = (value) => formatNumber(value, opts.precision ?? 3)
  return { n, pt: (x, y) => `${n(x)} ${n(y)}` }
}

/** An attribute-value pair, or nothing when the value is absent. */
function attr(name: string, value: string | undefined): string {
  return value === undefined ? '' : ` ${name}="${value}"`
}

/** An opacity attribute; 1 is the default and is left out. */
function opacityAttr(
  name: string,
  opacity: number | undefined,
  n: Num,
): string {
  return opacity !== undefined && opacity !== 1 ? attr(name, n(opacity)) : ''
}

/** The four stroke attributes; empty when the item has no stroke. */
function strokeAttrs(stroke: Stroke | undefined, n: Num): string[] {
  if (!stroke) return []
  return [
    attr('stroke', stroke.color),
    attr('stroke-width', n(stroke.width)),
    attr(
      'stroke-dasharray',
      stroke.dash?.length ? stroke.dash.map(n).join(' ') : undefined,
    ),
    opacityAttr('stroke-opacity', stroke.opacity, n),
  ]
}

/** The fill attributes; an absent fill becomes `fill="none"`. */
function fillAttrs(fill: Paint | undefined, n: Num): string[] {
  if (!fill) return [' fill="none"']
  return [
    attr('fill', fill.color),
    opacityAttr('fill-opacity', fill.opacity, n),
  ]
}

/** `<tag` + attributes + ` />`. */
function emptyElement(tag: string, attrs: string[]): string {
  return `<${tag}${attrs.join('')} />`
}

/** `<path d="…" />` plus paint; nothing when there is nothing to draw. */
function pathElement(
  d: string,
  stroke: Stroke | undefined,
  fill: Paint | undefined,
  n: Num,
): string {
  if (!d) return ''
  return emptyElement('path', [
    attr('d', d),
    ...strokeAttrs(stroke, n),
    ...fillAttrs(fill, n),
  ])
}

/**
 * Path data of an arc, following the scene's angle convention (from the +x
 * axis, clockwise on screen). SVG's sweep flag 1 is the same direction.
 */
function arcData(item: EllipseItem, n: Num): string {
  const { cx, cy, rx, ry } = item
  const start = item.start ?? 0
  let sweep = ((item.end ?? 0) - start) % FULL_TURN
  if (sweep <= 0) sweep += FULL_TURN
  const at = (theta: number) =>
    `${n(cx + rx * Math.cos(theta))} ${n(cy + ry * Math.sin(theta))}`
  const arc = (from: number, to: number) =>
    `A ${n(rx)} ${n(ry)} 0 ${to - from > Math.PI ? 1 : 0} 1 ${at(to)}`
  const head = `M ${at(start)}`
  // An SVG arc whose end points coincide is omitted, so a full turn is
  // drawn as two half turns.
  if (sweep >= FULL_TURN - 1e-9) {
    const mid = start + Math.PI
    return `${head} ${arc(start, mid)} ${arc(mid, start + FULL_TURN)}`
  }
  return `${head} ${arc(start, start + sweep)}`
}

/** A `<text>` element. Line breaks become spaces, as in the other outputs. */
function textElement(item: TextItem, n: Num): string {
  const { font } = item
  return (
    `<text${attr('x', n(item.x))}${attr('y', n(item.y))}` +
    attr('font-family', escapeXml(font.family)) +
    attr('font-size', n(font.size)) +
    attr(
      'font-weight',
      font.weight !== undefined ? String(font.weight) : undefined,
    ) +
    attr('font-style', font.style === 'italic' ? 'italic' : undefined) +
    attr('fill', item.fill.color) +
    opacityAttr('fill-opacity', item.fill.opacity, n) +
    attr('text-anchor', item.anchor) +
    attr(
      'dominant-baseline',
      item.baseline === 'middle' ? 'central' : undefined,
    ) +
    attr(
      'transform',
      item.rotate === undefined
        ? undefined
        : `rotate(${n(item.rotate)} ${n(item.x)} ${n(item.y)})`,
    ) +
    `>${escapeXml(item.text.replace(/\r?\n/g, ' '))}</text>`
  )
}

/** An `<image>` element that covers its box (centre crop). */
function imageElement(item: ImageItem, n: Num): string {
  const { box } = item
  const src = escapeXml(item.src)
  return emptyElement('image', [
    attr('href', src),
    attr('xlink:href', src),
    attr('x', n(box.x)),
    attr('y', n(box.y)),
    attr('width', n(box.w)),
    attr('height', n(box.h)),
    ' preserveAspectRatio="xMidYMid slice"',
    opacityAttr('opacity', item.opacity, n),
  ])
}

/** Serializes one item. */
function serializeItem(item: SceneItem, f: Formatter): string {
  const { n, pt } = f
  switch (item.op) {
    case 'line':
      return emptyElement('line', [
        attr('x1', n(item.x1)),
        attr('y1', n(item.y1)),
        attr('x2', n(item.x2)),
        attr('y2', n(item.y2)),
        ...strokeAttrs(item.stroke, n),
      ])
    case 'rect': {
      const { x, y, w, h } = item.box
      return emptyElement('rect', [
        attr('x', n(x)),
        attr('y', n(y)),
        attr('width', n(w)),
        attr('height', n(h)),
        ...strokeAttrs(item.stroke, n),
        ...fillAttrs(item.fill, n),
      ])
    }
    case 'ellipse':
      if (item.start === undefined || item.end === undefined) {
        return emptyElement('ellipse', [
          attr('cx', n(item.cx)),
          attr('cy', n(item.cy)),
          attr('rx', n(item.rx)),
          attr('ry', n(item.ry)),
          ...strokeAttrs(item.stroke, n),
          ...fillAttrs(item.fill, n),
        ])
      }
      return pathElement(arcData(item, n), item.stroke, item.fill, n)
    case 'poly':
      return pathElement(
        pathCommandsToData(polylinePath(item.points, item.closed), pt),
        item.stroke,
        item.fill,
        n,
      )
    case 'path': {
      const last = item.d.at(-1)
      const commands =
        item.closed && last?.op !== 'Z' ? [...item.d, closePath()] : item.d
      return pathElement(
        pathCommandsToData(commands, pt),
        item.stroke,
        item.fill,
        n,
      )
    }
    case 'text':
      return textElement(item, n)
    case 'image':
      return imageElement(item, n)
    case 'g':
      return `<g${opacityAttr('opacity', item.opacity, n)}>${serializeItems(item.items, f).join('')}</g>`
  }
}

/** Serializes a flat list of items. */
function serializeItems(items: readonly SceneItem[], f: Formatter): string[] {
  const out: string[] = []
  for (const item of items) out.push(serializeItem(item, f))
  return out
}

/**
 * Only the content between `<svg>` and `</svg>`, for embedding one page
 * into a larger `<svg>` when several pages are exported together.
 */
export function sceneToSvgBody(scene: Scene, opts: SvgOptions = {}): string {
  return serializeItems(scene, formatterOf(opts)).join('')
}

/**
 * A standalone `<svg>` sized in millimetres with a viewBox in the same
 * units, so item coordinates are written as they are and the file prints at
 * its true physical size.
 */
export function sceneToSvg(
  scene: Scene,
  width: number,
  height: number,
  opts: SvgOptions = {},
): string {
  const { n } = formatterOf(opts)
  return (
    `<svg xmlns="${SVG_NS}" xmlns:xlink="${XLINK_NS}"` +
    ` width="${n(width)}mm" height="${n(height)}mm"` +
    ` viewBox="0 0 ${n(width)} ${n(height)}">` +
    sceneToSvgBody(scene, opts) +
    '</svg>'
  )
}

/** `sceneToSvg` with the page's own size. */
export function pageToSvg(page: Page, opts: SvgOptions = {}): string {
  return sceneToSvg(page.scene, page.width, page.height, opts)
}
