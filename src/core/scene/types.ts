/**
 * Scene primitives.
 *
 * A paper's `render()` never writes SVG, Canvas or PDF directly. It returns a
 * *scene*: a list of drawing items in millimetres, with the origin at the
 * top-left corner of the page and `y` pointing down. Every output (preview,
 * SVG, PNG, PDF, print) is produced from the same scene, so what you see is
 * what you print and physical sizes stay exact.
 *
 * Deliberate restrictions that keep the renderers simple:
 * - There is no clipping. Anything that must stay inside a boundary is
 *   computed to fit when the scene is built.
 * - Paths only use M / L / Q / C / Z. Arcs are expressed with `ellipse`.
 * - Dashes are explicit millimetre arrays, so auxiliary and primary lines can
 *   use different rhythms.
 */

export interface Pt {
  x: number
  y: number
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/**
 * CSS colour string. Themes, presets and papers only emit `#rrggbb`; colours
 * picked by the user arrive in the same form from `<input type="color">`.
 */
export type Color = string

export interface Stroke {
  color: Color
  /** Line width in millimetres. */
  width: number
  /** Dash pattern in millimetres (`[dash, gap, ...]`). Omit for a solid line. */
  dash?: readonly number[]
  /** 0–1. Omit for fully opaque. */
  opacity?: number
}

export interface Paint {
  color: Color
  /** 0–1. Omit for fully opaque. */
  opacity?: number
}

export interface Font {
  /** CSS `font-family` list. */
  family: string
  /** Font size (em) in millimetres. */
  size: number
  weight?: 400 | 700
  style?: 'normal' | 'italic'
}

/** Horizontal alignment of text relative to its `x`. Defaults to `start`. */
export type Anchor = 'start' | 'middle' | 'end'

/**
 * Vertical meaning of a text item's `y`.
 * - `alphabetic`: the text baseline.
 * - `middle`: the vertical middle of the em box.
 * Defaults to `alphabetic`.
 */
export type Baseline = 'alphabetic' | 'middle'

export type PathCommand =
  | { op: 'M'; p: Pt }
  | { op: 'L'; p: Pt }
  | { op: 'Q'; c: Pt; p: Pt }
  | { op: 'C'; c1: Pt; c2: Pt; p: Pt }
  | { op: 'Z' }

export interface LineItem {
  op: 'line'
  x1: number
  y1: number
  x2: number
  y2: number
  stroke: Stroke
}

export interface RectItem {
  op: 'rect'
  box: Box
  stroke?: Stroke
  fill?: Paint
}

/**
 * A full ellipse, or an arc when both `start` and `end` are given.
 *
 * Angles are in radians, measured from the +x axis and increasing clockwise on
 * screen (because `y` points down). The arc runs from `start` to `end` in that
 * direction; when `end` is smaller than `start` it is treated as `end + 2π`.
 */
export interface EllipseItem {
  op: 'ellipse'
  cx: number
  cy: number
  rx: number
  ry: number
  start?: number
  end?: number
  stroke?: Stroke
  fill?: Paint
}

export interface PolyItem {
  op: 'poly'
  points: readonly Pt[]
  closed: boolean
  stroke?: Stroke
  fill?: Paint
}

export interface PathItem {
  op: 'path'
  d: readonly PathCommand[]
  /** Close the path with a straight segment back to its start. */
  closed?: boolean
  stroke?: Stroke
  fill?: Paint
}

export interface TextItem {
  op: 'text'
  x: number
  y: number
  text: string
  font: Font
  fill: Paint
  anchor?: Anchor
  baseline?: Baseline
  /** Rotation in degrees, clockwise, around `(x, y)`. */
  rotate?: number
}

export interface ImageItem {
  op: 'image'
  box: Box
  /** Data URL of the image. */
  src: string
  opacity?: number
}

/** Items that draw something. */
export type Shape =
  LineItem | RectItem | EllipseItem | PolyItem | PathItem | TextItem | ImageItem

/** Items that group others and share one opacity. */
export interface GroupItem {
  op: 'g'
  opacity?: number
  items: readonly SceneItem[]
}

export type SceneItem = Shape | GroupItem

/** A flat list of drawing items. */
export type Scene = readonly SceneItem[]

/** One finished page, with its size in millimetres. */
export interface Page {
  width: number
  height: number
  scene: Scene
}
