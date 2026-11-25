/**
 * Construction guides shared by the papers that practise writing in a box:
 * midlines, diagonals and the outline of a cell.
 */
import { line, rect } from '../../scene/builders'
import type { Box, LineItem, RectItem, Stroke } from '../../scene/types'

/** The horizontal and the vertical midline of `b`, each spanning the box edge to edge. */
export function crossGuides(b: Box, stroke: Stroke): LineItem[] {
  const midX = b.x + b.w / 2
  const midY = b.y + b.h / 2
  return [
    line(b.x, midY, b.x + b.w, midY, stroke),
    line(midX, b.y, midX, b.y + b.h, stroke),
  ]
}

/** The two diagonals of `b`: top-left to bottom-right, then top-right to bottom-left. */
export function diagonalGuides(b: Box, stroke: Stroke): LineItem[] {
  const right = b.x + b.w
  const bottom = b.y + b.h
  return [
    line(b.x, b.y, right, bottom, stroke),
    line(right, b.y, b.x, bottom, stroke),
  ]
}

/** An outline of `b` without a fill. */
export function borderOf(b: Box, stroke: Stroke): RectItem {
  return rect(b, stroke)
}
