/**
 * Notation building blocks shared by the three staff papers: five-line staffs,
 * six-line TAB groups, blank chord grids, bar lines and clef text marks.
 * All geometry is in millimetres and stays where the caller places it.
 */
import { line, text } from '../../scene/builders'
import type { LineItem, Stroke, TextItem } from '../../scene/types'

/** A staff of five horizontal lines, `gap` apart, starting at (x, y) and spanning `width`. */
export function staffGroup(
  x: number,
  y: number,
  width: number,
  gap: number,
  stroke: Stroke,
): LineItem[] {
  return Array.from({ length: 5 }, (_, i) =>
    line(x, y + i * gap, x + width, y + i * gap, stroke),
  )
}

/** Six TAB lines `gap` apart, plus a heavier left bar joining them. */
export function tabGroup(
  x: number,
  y: number,
  width: number,
  gap: number,
  stroke: Stroke,
  bar: Stroke,
): LineItem[] {
  const height = 5 * gap
  return [
    ...Array.from({ length: 6 }, (_, i) =>
      line(x, y + i * gap, x + width, y + i * gap, stroke),
    ),
    line(x, y, x, y + height, bar),
  ]
}

/** A vertical bar line of `height` at (x, y). */
export function barLine(
  x: number,
  y: number,
  height: number,
  stroke: Stroke,
): LineItem {
  return line(x, y, x, y + height, stroke)
}

/** All the strokes of one blank chord grid of cell size `u` at (x, y). */
export function chordCell(
  x: number,
  y: number,
  u: number,
  orientation: 'vertical' | 'horizontal',
  stroke: Stroke,
  nut: Stroke,
  thin: Stroke,
): LineItem[] {
  if (orientation === 'vertical') {
    const items: LineItem[] = []
    for (let i = 0; i <= 5; i++) {
      items.push(line(x + i * u, y, x + i * u, y + 4 * u, stroke))
    }
    for (let j = 0; j <= 4; j++) {
      items.push(line(x, y + j * u, x + 5 * u, y + j * u, j === 0 ? nut : thin))
    }
    return items
  }
  const items: LineItem[] = [
    line(x, y, x + 5 * u, y, stroke),
    line(x + 5 * u, y, x + 5 * u, y + 3 * u, stroke),
    line(x + 5 * u, y + 3 * u, x, y + 3 * u, stroke),
    line(x, y + 3 * u, x, y, stroke),
  ]
  for (let i = 1; i <= 4; i++) {
    items.push(line(x + i * u, y, x + i * u, y + 3 * u, thin))
  }
  for (let j = 1; j <= 2; j++) {
    items.push(line(x, y + j * u, x + 5 * u, y + j * u, thin))
  }
  return items
}

/** A text mark (clef glyph, tuning label) translated by the caller's `t`. */
export function clefMark(
  x: number,
  y: number,
  size: number,
  glyph: string,
  color: string,
  family: string,
): TextItem {
  return text(x, y, glyph, { family, size }, color, {
    baseline: 'alphabetic',
  })
}
