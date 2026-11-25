/**
 * Shared helpers for the geometry-grid papers (isometric, hexagonal, Seyes,
 * storyboard, mizige). Pure functions over millimetre boxes.
 */
import { box, line, poly, rect } from '../../scene/builders'
import type { Box, SceneItem, Stroke } from '../../scene/types'

/** A grid of full cells anchored at the writing area's top-left corner. */
export function gridFrame(
  area: Box,
  cell: number,
  stroke: Stroke,
): { cols: number; rows: number; items: SceneItem[] } {
  const cols = cell > 0 ? Math.floor((area.w + 1e-6) / cell) : 0
  const rows = cell > 0 ? Math.floor((area.h + 1e-6) / cell) : 0
  const items: SceneItem[] = []
  const right = area.x + cols * cell
  const bottom = area.y + rows * cell
  for (let r = 0; r <= rows; r++) {
    const y = area.y + r * cell
    items.push(line(area.x, y, right, y, stroke))
  }
  for (let c = 0; c <= cols; c++) {
    const x = area.x + c * cell
    items.push(line(x, area.y, x, bottom, stroke))
  }
  return { cols, rows, items }
}

/** A four-line "mi" guide inside one square cell. */
export function miziGuides(b: Box, stroke: Stroke): SceneItem[] {
  const { x, y, w, h } = b
  return [
    line(x, y, x + w, y + h, stroke),
    line(x + w, y, x, y + h, stroke),
    line(x + w / 2, y, x + w / 2, y + h, stroke),
    line(x, y + h / 2, x + w, y + h / 2, stroke),
  ]
}

/** A regular hexagon with a vertex pointing up, centred at (cx, cy). */
export function hexagon(
  cx: number,
  cy: number,
  radius: number,
  stroke: Stroke,
): SceneItem {
  const points = Array.from({ length: 6 }, (_, k) => {
    const angle = (Math.PI / 180) * (90 + 60 * k)
    return {
      x: cx + radius * Math.cos(angle),
      y: cy - radius * Math.sin(angle),
    }
  })
  return poly(points, true, stroke)
}

/** An empty rect with a stroke (box → rect item). */
export function outlined(b: Box, stroke: Stroke): SceneItem {
  return rect(b, stroke)
}

/** A filled rect with no stroke. */
export function filled(b: Box, color: string, opacity?: number): SceneItem {
  return rect(b, undefined, { color, opacity })
}

/** Four L-shaped corner brackets inside a box. */
export function cornerBrackets(
  b: Box,
  arm: number,
  stroke: Stroke,
): SceneItem[] {
  const { x, y, w, h } = b
  const r = x + w
  const d = y + h
  return [
    line(x, y + arm, x, y, stroke),
    line(x, y, x + arm, y, stroke),
    line(r - arm, y, r, y, stroke),
    line(r, y, r, y + arm, stroke),
    line(x, d - arm, x, d, stroke),
    line(x, d, x + arm, d, stroke),
    line(r - arm, d, r, d, stroke),
    line(r, d, r, d - arm, stroke),
  ]
}

/** A grid of rectangles (storyboard frames). */
export function frameGrid(
  area: Box,
  rows: number,
  cols: number,
  captionHeight: number,
  stroke: Stroke,
): SceneItem[] {
  const items: SceneItem[] = []
  const rowH = area.h / rows
  const colW = area.w / cols
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = area.x + c * colW
      const y = area.y + r * rowH
      items.push(rect(box(x, y, colW, rowH - captionHeight), stroke))
    }
  }
  return items
}
