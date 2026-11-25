/**
 * 绘制汉字练习方格和常用辅助线。
 * Draws shared CJK practice cells and guides.
 */
/**
 * Cell builders shared by the CJK calligraphy practice papers: square cells,
 * their lattice lines, inner "cell in a cell" boxes, thirds, crosses and
 * diagonals. All geometry stays inside the box it is given.
 */
import { line, rect } from '../../scene/builders'
import { countThatFit, centeredStart } from '../../scene/geometry'
import type {
  Box,
  LineItem,
  RectItem,
  SceneItem,
  Stroke,
} from '../../scene/types'

/** A centred lattice of square cells inside `area`. */
export interface CellLattice {
  /** Side of one cell in millimetres. */
  cell: number
  cols: number
  rows: number
  /** The lattice's bounding box. */
  box: Box
  /** Every cell's box, row by row. */
  cells: Box[]
}

/**
 * Fits as many `cell`-sized squares as possible into `area`, centred with
 * equal gaps on both ends of each axis. An axis that fits no cell yields an
 * empty lattice.
 */
export function cellLattice(area: Box, cell: number): CellLattice {
  const cols = countThatFit(area.w, cell)
  const rows = countThatFit(area.h, cell)
  const side = cols > 0 && rows > 0 ? cell : 0
  const left = area.x + centeredStart(area.w, side, cols)
  const top = area.y + centeredStart(area.h, side, rows)
  const box: Box = { x: left, y: top, w: cols * side, h: rows * side }
  const cells: Box[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({
        x: left + col * side,
        y: top + row * side,
        w: side,
        h: side,
      })
    }
  }
  return { cell: side, cols, rows, box, cells }
}

/**
 * A lattice of a fixed number of square cells: the cell side is limited by the
 * shorter side of `area`, and the whole grid is centred inside it.
 */
export function fixedLattice(
  area: Box,
  cols: number,
  rows: number,
): CellLattice {
  const cell = Math.min(area.w / cols, area.h / rows)
  const side = Number.isFinite(cell) && cell > 0 ? cell : 0
  const left = area.x + centeredStart(area.w, side, cols)
  const top = area.y + centeredStart(area.h, side, rows)
  const box: Box = { x: left, y: top, w: cols * side, h: rows * side }
  const cells: Box[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({
        x: left + col * side,
        y: top + row * side,
        w: side,
        h: side,
      })
    }
  }
  return { cell: side, cols, rows, box, cells }
}

/** Every grid line of `lattice`: `cols + 1` vertical and `rows + 1` horizontal. */
export function latticeLines(lattice: CellLattice, stroke: Stroke): LineItem[] {
  if (lattice.cols === 0 || lattice.rows === 0) return []
  const { x, y, w, h } = lattice.box
  const items: LineItem[] = []
  for (let col = 0; col <= lattice.cols; col++) {
    const cx = x + (col * w) / lattice.cols
    items.push(line(cx, y, cx, y + h, stroke))
  }
  for (let row = 0; row <= lattice.rows; row++) {
    const cy = y + (row * h) / lattice.rows
    items.push(line(x, cy, x + w, cy, stroke))
  }
  return items
}

/** An outline of `b` without a fill. */
export function cellBorder(b: Box, stroke: Stroke): RectItem {
  return rect(b, stroke)
}

/** `b` scaled by `ratio` about its centre. */
export function innerBox(b: Box, ratio: number): Box {
  const w = b.w * ratio
  const h = b.h * ratio
  return { x: b.x + (b.w - w) / 2, y: b.y + (b.h - h) / 2, w, h }
}

/** The two horizontal lines that split `b` into thirds. */
export function horizontalThirds(b: Box, stroke: Stroke): LineItem[] {
  return [1, 2].map((k) =>
    line(b.x, b.y + (k * b.h) / 3, b.x + b.w, b.y + (k * b.h) / 3, stroke),
  )
}

/** The two vertical lines that split `b` into thirds. */
export function verticalThirds(b: Box, stroke: Stroke): LineItem[] {
  return [1, 2].map((k) =>
    line(b.x + (k * b.w) / 3, b.y, b.x + (k * b.w) / 3, b.y + b.h, stroke),
  )
}

/** A 田字格: the frame plus the horizontal and vertical midlines. */
export function tianziCell(b: Box, frame: Stroke, guide: Stroke): SceneItem[] {
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  return [
    cellBorder(b, frame),
    line(b.x, cy, b.x + b.w, cy, guide),
    line(cx, b.y, cx, b.y + b.h, guide),
  ]
}

/**
 * A 回米格: the frame, the cross, the two diagonals and a smaller centred box.
 * Auxiliary lines and the inner box use `guide`, the outer frame uses `frame`.
 */
export function huimiCell(
  b: Box,
  frame: Stroke,
  guide: Stroke,
  innerRatio: number,
): SceneItem[] {
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  const right = b.x + b.w
  const bottom = b.y + b.h
  return [
    line(b.x, cy, right, cy, guide),
    line(cx, b.y, cx, bottom, guide),
    line(b.x, b.y, right, bottom, guide),
    line(right, b.y, b.x, bottom, guide),
    cellBorder(innerBox(b, innerRatio), guide),
    cellBorder(b, frame),
  ]
}
