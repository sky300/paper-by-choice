/**
 * 硬笔书法纸 — a pen-practice cell: a square frame, a dashed cross and two
 * short dashed verticals at the quarter and three-quarter marks, centred
 * vertically. `spacing` is the cell side and the grid is centred in the area.
 */
import { line } from '../scene/builders'
import { definePaper } from './define'
import { cellBorder, cellLattice } from './shared/cjkCells'
import type { Box, SceneItem, Stroke } from '../scene/types'

/** Short verticals run from 0.2 to 0.8 of the cell height (0.6 of it). */
const SHORT_TOP = 0.2
const SHORT_BOTTOM = 0.8
const QUARTERS = [0.25, 0.75]
const MIN_FRAME_WIDTH = 0.13

/** Auxiliary lines: 0.8 of the line width, dashed 3–2, in the user's colour. */
function guideInk(base: Stroke): Stroke {
  return { ...base, width: base.width * 0.8, dash: [3, 2] }
}

/** One cell: frame plus cross plus the two short verticals. */
function penCell(b: Box, frame: Stroke, guide: Stroke): SceneItem[] {
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  return [
    line(b.x, cy, b.x + b.w, cy, guide),
    line(cx, b.y, cx, b.y + b.h, guide),
    ...QUARTERS.map((q) => {
      const x = b.x + q * b.w
      return line(x, b.y + SHORT_TOP * b.h, x, b.y + SHORT_BOTTOM * b.h, guide)
    }),
    cellBorder(b, frame),
  ]
}

export default definePaper({
  type: 'hardpen_calligraphy_paper',
  group: 'calligraphy',
  messages: {
    'zh-CN': {
      name: '硬笔书法纸',
      'spacing.label': '格子大小',
      'spacing.hint':
        '硬笔书法大格的边长，格内另有短竖线与对角线辅助定位。常用 18–22 mm；练楷书结构建议 20 mm 左右。',
      'preset.hardpen_calligraphy_paper.name': '青绿硬笔格',
      'preset.hardpen_calligraphy_paper.description':
        '青绿格线，适合硬笔日常练习',
    },
    en: {
      name: 'Pen calligraphy paper',
      'spacing.label': 'Cell size',
      'spacing.hint':
        'Side length of each hard-pen practice cell, with short vertical lines and diagonals as guides. 18–22 mm is typical; about 20 mm works well for regular script structure.',
      'preset.hardpen_calligraphy_paper.name': 'Green pen grid',
      'preset.hardpen_calligraphy_paper.description':
        'Green lines for everyday pen practice',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 15,
    max: 30,
    step: 1,
    default: 20,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'hardpen_calligraphy_paper',
      name: 'preset.hardpen_calligraphy_paper.name',
      description: 'preset.hardpen_calligraphy_paper.description',
      patch: {},
    },
  ],
  suggestsCalligraphyFrame: true,
  render: (ctx) => {
    const lattice = cellLattice(ctx.area, ctx.spacing)
    if (lattice.cols === 0 || lattice.rows === 0) return []
    const base = ctx.ink.main()
    const frame: Stroke = {
      ...base,
      width: Math.max(base.width, MIN_FRAME_WIDTH),
      dash: undefined,
    }
    return lattice.cells.flatMap((cell) => penCell(cell, frame, guideInk(base)))
  },
})
