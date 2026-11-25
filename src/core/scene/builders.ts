/**
 * 创建统一的场景图元。
 * Creates shared scene primitives.
 */
/**
 * Scene item constructors.
 *
 * Thin wrappers over the item interfaces in `types.ts`, so papers write
 * `line(0, 8, 190, 8, ink)` rather than object literals. Optional parts that
 * are not given are left out of the object instead of being set to
 * `undefined`, which keeps items easy to compare in tests and stops renderers
 * from mistaking an absent stroke for a present one.
 */
import type {
  Anchor,
  Baseline,
  Box,
  EllipseItem,
  Font,
  GroupItem,
  ImageItem,
  LineItem,
  Paint,
  PathCommand,
  PathItem,
  PolyItem,
  Pt,
  RectItem,
  SceneItem,
  Stroke,
  TextItem,
} from './types'

/** Copies `item` without the fields whose value is `undefined`. */
function compact<T extends object>(item: T): T {
  const kept = Object.entries(item).filter(([, value]) => value !== undefined)
  return Object.fromEntries(kept) as T
}

/* ------------------------------------------------------------------ */
/* Points and boxes                                                    */
/* ------------------------------------------------------------------ */

/** A point at (x, y). */
export function pt(x: number, y: number): Pt {
  return { x, y }
}

/** A rectangle given by its top-left corner and size. */
export function box(x: number, y: number, w: number, h: number): Box {
  return { x, y, w, h }
}

/* ------------------------------------------------------------------ */
/* Shapes                                                              */
/* ------------------------------------------------------------------ */

/** A straight segment from (x1, y1) to (x2, y2). */
export function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: Stroke,
): LineItem {
  return { op: 'line', x1, y1, x2, y2, stroke }
}

/** A rectangle, optionally outlined and/or filled. */
export function rect(b: Box, stroke?: Stroke, fill?: Paint): RectItem {
  return compact<RectItem>({ op: 'rect', box: b, stroke, fill })
}

/** A square of side `size` with its top-left corner at (x, y). */
export function square(
  x: number,
  y: number,
  size: number,
  stroke?: Stroke,
): RectItem {
  return rect(box(x, y, size, size), stroke)
}

/** A circle of radius `r`. */
export function circle(
  cx: number,
  cy: number,
  r: number,
  stroke?: Stroke,
  fill?: Paint,
): EllipseItem {
  return ellipse(cx, cy, r, r, stroke, fill)
}

/** An ellipse with radii `rx` and `ry`. */
export function ellipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  stroke?: Stroke,
  fill?: Paint,
): EllipseItem {
  return compact<EllipseItem>({ op: 'ellipse', cx, cy, rx, ry, stroke, fill })
}

/** An arc of an ellipse; angles in radians from +x, clockwise on screen (see `EllipseItem`). */
export function arc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  start: number,
  end: number,
  stroke: Stroke,
): EllipseItem {
  return { op: 'ellipse', cx, cy, rx, ry, start, end, stroke }
}

/** A polygon (`closed`) or a polyline through `points`. */
export function poly(
  points: readonly Pt[],
  closed: boolean,
  stroke?: Stroke,
  fill?: Paint,
): PolyItem {
  return compact<PolyItem>({ op: 'poly', points, closed, stroke, fill })
}

/** A path from explicit commands; `closed` joins the last point back to the first. */
export function path(
  d: readonly PathCommand[],
  closed: boolean,
  stroke?: Stroke,
  fill?: Paint,
): PathItem {
  return compact<PathItem>({ op: 'path', d, closed, stroke, fill })
}

/** A text run; `fill` may be a bare colour string, which becomes `{ color }`. */
export function text(
  x: number,
  y: number,
  value: string,
  font: Font,
  fill: Paint | string,
  opts?: { anchor?: Anchor; baseline?: Baseline; rotate?: number },
): TextItem {
  return compact<TextItem>({
    op: 'text',
    x,
    y,
    text: value,
    font,
    fill: typeof fill === 'string' ? { color: fill } : fill,
    anchor: opts?.anchor,
    baseline: opts?.baseline,
    rotate: opts?.rotate,
  })
}

/** A raster image (data URL) covering `b`. */
export function image(b: Box, src: string, opacity?: number): ImageItem {
  return compact<ImageItem>({ op: 'image', box: b, src, opacity })
}

/** A group whose items share one opacity. */
export function group(
  items: readonly SceneItem[],
  opacity?: number,
): GroupItem {
  return compact<GroupItem>({ op: 'g', items, opacity })
}

/* ------------------------------------------------------------------ */
/* Path commands                                                       */
/* ------------------------------------------------------------------ */

/** Starts a new sub-path at `p`. */
export function moveTo(p: Pt): PathCommand {
  return { op: 'M', p }
}

/** Draws a straight segment to `p`. */
export function lineTo(p: Pt): PathCommand {
  return { op: 'L', p }
}

/** Draws a quadratic curve via control point `c` to `p`. */
export function quadTo(c: Pt, p: Pt): PathCommand {
  return { op: 'Q', c, p }
}

/** Draws a cubic curve via control points `c1` and `c2` to `p`. */
export function cubicTo(c1: Pt, c2: Pt, p: Pt): PathCommand {
  return { op: 'C', c1, c2, p }
}

/** Closes the current sub-path. */
export function closePath(): PathCommand {
  return { op: 'Z' }
}

/** `M` to the first point, `L` to every following one, plus `Z` when `close`. */
export function polylinePath(
  points: readonly Pt[],
  close: boolean,
): PathCommand[] {
  if (points.length === 0) return []
  const [first, ...rest] = points
  const commands: PathCommand[] = [moveTo(first), ...rest.map(lineTo)]
  if (close) commands.push(closePath())
  return commands
}
