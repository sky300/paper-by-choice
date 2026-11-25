/**
 * 计算并绘制可复用的网格几何。
 * Calculates and draws reusable grid geometry.
 */
/**
 * Rule and lattice builders shared by the grid-like papers: ruled lines,
 * square cells and dot matrices. All of them stay inside the writing area
 * and leave out whatever would lie on its far edge.
 */
import { circle, line } from '../../scene/builders'
import { layoutGrid, repeatPositions } from '../../scene/geometry'
import type { GridLayout } from '../../scene/geometry'
import type { Box, EllipseItem, LineItem, Stroke } from '../../scene/types'

const PX_PER_MM = 96 / 25.4

/** Counts whole cells using the reference's pixel fit and the printable millimetre limit. */
export function referenceCellCount(width: number, pitch: number): number {
  const pixelPitch = Math.max(1, Math.round(pitch * PX_PER_MM))
  return Math.min(
    Math.floor(width / pitch),
    Math.floor(Math.round(width * PX_PER_MM) / pixelPitch),
  )
}

/**
 * Horizontal rules: the first one `offset` below the top edge of `area` (one
 * pitch by default), then one every `pitch`, never one on the bottom edge.
 * Each spans the area from its left edge to its right edge.
 */
export function horizontalRules(
  area: Box,
  pitch: number,
  stroke: Stroke,
  offset = pitch,
): LineItem[] {
  return repeatPositions(area.h, pitch, offset).map((y) =>
    line(area.x, area.y + y, area.x + area.w, area.y + y, stroke),
  )
}

/** Vertical rules: the same rule as `horizontalRules`, stepped along x and spanning the area's full height. */
export function verticalRules(
  area: Box,
  pitch: number,
  stroke: Stroke,
  offset = pitch,
): LineItem[] {
  return repeatPositions(area.w, pitch, offset).map((x) =>
    line(area.x + x, area.y, area.x + x, area.y + area.h, stroke),
  )
}

/** A square grid together with the layout it was built from. */
export interface CellGrid {
  items: LineItem[]
  layout: GridLayout
}

/**
 * A grid of `cell` × `cell` mm squares: as many cells as fit in `area`,
 * centred unless `align` is `'start'`, with every grid line drawn (`cols + 1`
 * vertical and `rows + 1` horizontal). Nothing fits, no lines.
 */
export function cellGrid(
  area: Box,
  cell: number,
  stroke: Stroke,
  align: 'start' | 'center' = 'center',
  fitted?: GridLayout,
): CellGrid {
  const layout = fitted ?? layoutGrid(area.w, area.h, cell, align)
  if (layout.cols === 0 || layout.rows === 0) return { items: [], layout }

  const left = area.x + layout.offsetX
  const top = area.y + layout.offsetY
  const right = left + layout.cols * cell
  const bottom = top + layout.rows * cell
  const items: LineItem[] = []

  for (let col = 0; col <= layout.cols; col++) {
    const x = left + col * cell
    items.push(line(x, top, x, bottom, stroke))
  }
  for (let row = 0; row <= layout.rows; row++) {
    const y = top + row * cell
    items.push(line(left, y, right, y, stroke))
  }
  return { items, layout }
}

/**
 * A lattice of filled dots laid out like `cellGrid`: one dot of `radius` at
 * the centre of every `pitch` × `pitch` cell. Nothing fits, no dots.
 */
export function dotGrid(
  area: Box,
  pitch: number,
  color: string,
  radius = 0.25,
  align: 'start' | 'center' = 'center',
): EllipseItem[] {
  const { cols, rows, offsetX, offsetY } = layoutGrid(
    area.w,
    area.h,
    pitch,
    align,
  )
  const left = area.x + offsetX
  const top = area.y + offsetY
  const dots: EllipseItem[] = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      dots.push(
        circle(
          left + (col + 0.5) * pitch,
          top + (row + 0.5) * pitch,
          radius,
          undefined,
          {
            color,
          },
        ),
      )
    }
  }
  return dots
}
