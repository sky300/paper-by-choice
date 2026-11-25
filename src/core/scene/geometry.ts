/**
 * Geometry helpers for scenes.
 *
 * Pure arithmetic in millimetres on plain numbers and scene items, shared by
 * papers, page composition and the tests that check them.
 */

/** Comparison tolerance in millimetres: a nanometre, far below print resolution. */
export const EPS = 1e-6

/** Limits `value` to the inclusive range [`min`, `max`]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Rounds `value` to `digits` decimals (3 by default) and turns `-0` into `0`. */
export function roundTo(value: number, digits = 3): number {
  const factor = 10 ** digits
  const rounded = Math.round(value * factor) / factor
  return rounded === 0 ? 0 : rounded
}

/**
 * Snaps `value` to `min + k * step` (nearest `k`) and clamps into [`min`, `max`].
 * A `step` that is not positive or is NaN only clamps; a NaN `value` gives `min`.
 */
export function snapToStep(
  value: number,
  min: number,
  max: number,
  step: number,
): number {
  if (Number.isNaN(value)) return min
  if (!(step > 0)) return clamp(value, min, max)
  return clamp(min + Math.round((value - min) / step) * step, min, max)
}

/**
 * How many pitches of `pitch` fit along `length`, floored and never below 0.
 * An exact fit counts even when binary floating point makes the quotient a hair
 * too small; a pitch that is not positive or is NaN gives 0.
 */
export function countThatFit(length: number, pitch: number): number {
  if (!(pitch > 0) || !Number.isFinite(length)) return 0
  const count = Math.floor((length + EPS) / pitch)
  return count > 0 ? count : 0
}

/** Where `count` pitches of `pitch` must start so they sit centred in `length`. */
export function centeredStart(
  length: number,
  pitch: number,
  count: number,
): number {
  return (length - pitch * count) / 2
}

/**
 * Positions `offset + k * pitch` along a span of `length`, keeping only those
 * strictly inside it: a position lying on the start or the end edge is
 * dropped, so a ruled sheet gets no line along its bottom edge.
 */
export function repeatPositions(
  length: number,
  pitch: number,
  offset = 0,
): number[] {
  const out: number[] = []
  if (!(pitch > 0) || !Number.isFinite(length) || !Number.isFinite(offset))
    return out
  const limit = length - EPS
  for (let k = 0; ; k++) {
    const pos = offset + k * pitch
    if (pos >= limit) break
    if (pos > EPS) out.push(pos)
  }
  return out
}

export interface CellLayout {
  count: number
  /** Offset of the first cell's start from the start of the span. */
  start: number
  /** `count + 1` grid line positions from the span start, from `start` to `start + count * cell`. */
  edges: number[]
}

/**
 * Divides `length` into cells of side `cell`: `count = floor((length + EPS) / cell)`.
 * `align` is `'center'` (equal gaps at both ends) unless `'start'` is given.
 * Returns `null` when not a single cell fits.
 */
export function layoutCells(
  length: number,
  cell: number,
  align: 'start' | 'center' = 'center',
): CellLayout | null {
  const count = countThatFit(length, cell)
  if (count === 0) return null
  const start = align === 'start' ? 0 : centeredStart(length, cell, count)
  const edges: number[] = []
  for (let i = 0; i <= count; i++) edges.push(start + i * cell)
  return { count, start, edges }
}

export interface GridLayout {
  cols: number
  rows: number
  /** Offset of the grid's top-left corner from the writing area's top-left corner. */
  offsetX: number
  offsetY: number
}

/** Two-dimensional `layoutCells`; an axis that fits nothing reports 0 and offset 0. */
export function layoutGrid(
  width: number,
  height: number,
  cell: number,
  align: 'start' | 'center' = 'center',
): GridLayout {
  const cols = layoutCells(width, cell, align)
  const rows = layoutCells(height, cell, align)
  return {
    cols: cols?.count ?? 0,
    rows: rows?.count ?? 0,
    offsetX: cols?.start ?? 0,
    offsetY: rows?.start ?? 0,
  }
}
