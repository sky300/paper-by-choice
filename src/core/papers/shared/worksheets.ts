/**
 * Shared building blocks for the Chinese school worksheet papers.
 * All geometry is in millimetres; strings come from `ctx.t()` at the call site.
 */
import { line, rect, text } from '../../scene/builders'
import type { Box, Font, SceneItem, Stroke, TextItem } from '../../scene/types'

/** A "name / date" header: two labels with an underline to write on. */
export function twoFieldHeader(
  area: Box,
  labels: readonly [string, string],
  font: Font,
  ink: Stroke,
): SceneItem[] {
  const baseline = area.y + 10
  const fieldW = Math.min(40, area.w / 2)
  const cx = area.x + area.w / 2
  const items: SceneItem[] = []
  const offset = Math.min(50, (area.w - fieldW) / 2)
  const centres = [cx - offset, cx + offset]
  labels.forEach((label, i) => {
    const x = centres[i] - fieldW / 2
    items.push(text(x, baseline, label, font, ink.color))
    items.push(
      line(
        x + Math.min(8, fieldW / 2),
        baseline + 1.3,
        centres[i] + fieldW / 2,
        baseline + 1.3,
        ink,
      ),
    )
  })
  return items
}

/** A four-line English handwriting group (four lines, one of them heavier). */
export function fourLineGroup(
  area: Box,
  lineGap: number,
  main: Stroke,
  thin: Stroke,
): SceneItem[] {
  const items: SceneItem[] = []
  for (let i = 0; i < 4; i++) {
    items.push(
      line(
        area.x,
        area.y + i * lineGap,
        area.x + area.w,
        area.y + i * lineGap,
        i === 2 ? main : thin,
      ),
    )
  }
  return items
}

/** A rectangular grid of cells starting at the area's top-left corner. */
export function cellLattice(area: Box, cell: number, ink: Stroke): SceneItem[] {
  const cols = cell > 0 ? Math.floor((area.w + 1e-6) / cell) : 0
  const rows = cell > 0 ? Math.floor((area.h + 1e-6) / cell) : 0
  const items: SceneItem[] = []
  const right = area.x + cols * cell
  const bottom = area.y + rows * cell
  for (let r = 0; r <= rows; r++)
    items.push(line(area.x, area.y + r * cell, right, area.y + r * cell, ink))
  for (let c = 0; c <= cols; c++)
    items.push(line(area.x + c * cell, area.y, area.x + c * cell, bottom, ink))
  return items
}

/** A single labelled line: a short label followed by an underline. */
export function labelledLine(
  x: number,
  y: number,
  label: string,
  width: number,
  font: Font,
  ink: Stroke,
): SceneItem[] {
  const labelItem: TextItem = text(x, y, label, font, ink.color)
  return [labelItem, line(x + 8, y + 1.3, x + width, y + 1.3, ink)]
}

/** A bordered box with horizontal rules inside it. */
export function ruledBox(
  area: Box,
  pitch: number,
  ink: Stroke,
  frame?: Stroke,
): SceneItem[] {
  const items: SceneItem[] = [rect(area, frame ?? ink)]
  for (let y = area.y + pitch; y < area.y + area.h - 1e-6; y += pitch) {
    items.push(line(area.x, y, area.x + area.w, y, ink))
  }
  return items
}
