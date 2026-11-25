/**
 * 长方回宫格 — a fixed 10 × 14 lattice of square cells. Each cell carries a
 * dashed inner rectangle, a dashed cross inside that rectangle, a dashed cross
 * spanning the whole cell, and the paper draws its name at the bottom right.
 * The spacing parameter is declared but not used: the cell side is derived
 * from the writing area.
 */
import { line, text } from '../scene/builders'
import { definePaper } from './define'
import { cellBorder, fixedLattice, latticeLines } from './shared/cjkCells'
import type { Box, SceneItem, Stroke } from '../scene/types'

const COLS = 10
const ROWS = 14
/** Inner rectangle: 0.4 of the width, 0.8 of the height, centred in the cell. */
const INNER_W = 0.4
const INNER_H = 0.8
/** Label sits 2 mm above the bottom edge of the writing area. */
const LABEL_INSET = 2
const LABEL_SIZE = 3

/** Dashed auxiliary stroke: the user's line width and colour, dash 2–2. */
function dashed(base: Stroke): Stroke {
  return { ...base, dash: [2, 2] }
}

/** The dashed inner rectangle and the two crosses of one cell. */
function cellGuides(cell: Box, stroke: Stroke): SceneItem[] {
  const box: Box = {
    x: cell.x + (cell.w - cell.w * INNER_W) / 2,
    y: cell.y + (cell.h - cell.h * INNER_H) / 2,
    w: cell.w * INNER_W,
    h: cell.h * INNER_H,
  }
  const cx = cell.x + cell.w / 2
  const cy = cell.y + cell.h / 2
  const icx = box.x + box.w / 2
  const icy = box.y + box.h / 2
  return [
    line(icx, box.y, icx, box.y + box.h, stroke),
    line(box.x, icy, box.x + box.w, icy, stroke),
    cellBorder(box, stroke),
    line(cx, cell.y, cx, cell.y + cell.h, stroke),
    line(cell.x, cy, cell.x + cell.w, cy, stroke),
  ]
}

export default definePaper({
  type: 'hardpen_huigongge',
  group: 'calligraphy',
  messages: {
    'zh-CN': {
      name: '长方回宫格',
      'spacing.label': '硬笔回宫格大小',
      'spacing.hint':
        '此纸型的格子数量固定，间距不影响画面。需要更大的字请换用「A3」纸张尺寸，或减小四边边距让书写区更宽。',
      'text.label': '长方回宫格',
      'preset.hardpen_huigongge.name': '朱红长方回宫格',
      'preset.hardpen_huigongge.description': '朱红格线，固定 10 × 14 格',
    },
    en: {
      name: 'Long Hui-Gong grid',
      'spacing.label': 'Long grid size',
      'spacing.hint':
        'This sheet has a fixed number of cells, so spacing has no effect. For larger characters switch to A3 paper or reduce the margins to widen the writing area.',
      'text.label': 'Long Hui-Gong grid',
      'preset.hardpen_huigongge.name': 'Vermilion long grid',
      'preset.hardpen_huigongge.description':
        'Vermilion lines, fixed 10 × 14 cells',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 15,
    max: 30,
    step: 1,
    default: 25,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'hardpen_huigongge',
      name: 'preset.hardpen_huigongge.name',
      description: 'preset.hardpen_huigongge.description',
      patch: {},
    },
  ],
  suggestsCalligraphyFrame: true,
  render: (ctx) => {
    const lattice = fixedLattice(ctx.area, COLS, ROWS)
    if (lattice.cell <= 0) return []
    const base = ctx.ink.main()
    const guide = dashed(base)
    const items: SceneItem[] = [
      ...latticeLines(lattice, base),
      ...lattice.cells.flatMap((cell) => cellGuides(cell, guide)),
      text(
        ctx.area.x + ctx.area.w,
        ctx.area.y + ctx.area.h - LABEL_INSET,
        ctx.t('text.label'),
        ctx.fonts.cjk(LABEL_SIZE),
        base.color,
        { anchor: 'end' },
      ),
    ]
    return items
  },
})
