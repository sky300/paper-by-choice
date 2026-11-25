/**
 * 绘制表单分区与填空线。
 * Draws form sections and fill-in rules.
 */
/**
 * Form-paper building blocks: titled sections, labelled blanks, checkboxes,
 * ruled rows and table lattices. Pure millimetre geometry shared by the
 * planning and worksheet papers of batch B4.
 */
import { box, line, rect, text } from '../../scene/builders'
import { countThatFit, repeatPositions } from '../../scene/geometry'
import type {
  Box,
  Font,
  LineItem,
  Paint,
  RectItem,
  SceneItem,
  Stroke,
} from '../../scene/types'

/** An empty square box used as a checklist marker. */
export function checkbox(
  x: number,
  y: number,
  size: number,
  stroke: Stroke,
): RectItem {
  return rect(box(x, y, size, size), stroke)
}

/** A horizontal blank to write on, starting at (x, y) and `length` mm long. */
export function fieldUnderline(
  x: number,
  y: number,
  length: number,
  stroke: Stroke,
): LineItem {
  return line(x, y, x + length, y, stroke)
}

/** Options of a labelled blank: the label's font and fill and its underline. */
export interface LabelledFieldOptions {
  font: Font
  fill: Paint
  stroke: Stroke
  /** Length of the underline in millimetres. */
  lineLength: number
  /** Where the underline starts relative to the label's x. Defaults to 0. */
  lineStart?: number
  /** Gap from the label baseline down to the underline in millimetres. */
  lineOffset?: number
}

/** Draws `label` as text plus a blank underline just below it. */
export function labelledField(
  x: number,
  y: number,
  label: string,
  options: LabelledFieldOptions,
): SceneItem[] {
  const gap = options.lineOffset ?? options.font.size * 0.42
  return [
    text(x, y, label, options.font, options.fill),
    fieldUnderline(
      x + (options.lineStart ?? 0),
      y + gap,
      options.lineLength,
      options.stroke,
    ),
  ]
}

/** A section outline, optionally filled with a soft accent wash. */
export function sectionBox(b: Box, stroke: Stroke, fill?: Paint): RectItem {
  return rect(b, stroke, fill)
}

/** Horizontal rules inside `b`, the first `offset` below its top, then every `pitch`. */
export function rulesWithin(
  b: Box,
  pitch: number,
  offset: number,
  stroke: Stroke,
): LineItem[] {
  return repeatPositions(b.h, pitch, offset).map((y) =>
    line(b.x, b.y + y, b.x + b.w, b.y + y, stroke),
  )
}

/** A `rows` × `cols` lattice inside `b` with lines on every cell edge. */
export function tableGrid(
  b: Box,
  rows: number,
  cols: number,
  stroke: Stroke,
): LineItem[] {
  if (rows <= 0 || cols <= 0) return []
  const rowH = b.h / rows
  const colW = b.w / cols
  const items: LineItem[] = []
  for (let r = 0; r <= rows; r++) {
    const y = b.y + r * rowH
    items.push(line(b.x, y, b.x + b.w, y, stroke))
  }
  for (let c = 0; c <= cols; c++) {
    const x = b.x + c * colW
    items.push(line(x, b.y, x, b.y + b.h, stroke))
  }
  return items
}

/** How many full pitches of `pitch` fit along `length`; exported for row planning. */
export function rowsThatFit(length: number, pitch: number): number {
  return countThatFit(length, pitch)
}
