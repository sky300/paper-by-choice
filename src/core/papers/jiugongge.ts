/**
 * 九宫格 — a calligraphy practice sheet: square "blocks" of three-by-three
 * small cells, laid out in a centred lattice. Thin inner lines split each
 * block into thirds; heavier lines mark the block edges; a heaviest frame
 * surrounds the whole lattice. `spacing` is the small cell side, so a block
 * is three times as wide.
 */
import { line } from '../scene/builders'
import { definePaper } from './define'
import { cellBorder, cellLattice, latticeLines } from './shared/cjkCells'
import type { LineItem, Stroke } from '../scene/types'

/** Inner thirds at 0.7 of the line width; block edges at 1.5; frame at 1.8. */
function scaled(base: Stroke, factor: number, opacity?: number): Stroke {
  return { ...base, width: base.width * factor, opacity }
}

export default definePaper({
  type: 'jiugongge',
  group: 'calligraphy',
  messages: {
    'zh-CN': {
      name: '九宫格',
      'spacing.label': '九宫格基础大小',
      'spacing.hint':
        '指 3×3 小格里每个小格的边长；整个九宫格块的边长是它的 3 倍。常用 18–22 mm，适合练习汉字的间架结构。',
      'preset.jiugongge.name': '经典九宫格',
      'preset.jiugongge.description': '暖棕色格线，适合毛笔书法练习',
    },
    en: {
      name: 'Nine-square grid',
      'spacing.label': 'Base cell size',
      'spacing.hint':
        'Side length of one small cell in the 3×3 block; the whole block is three times as wide. 18–22 mm is typical for practising character structure.',
      'preset.jiugongge.name': 'Classic nine-square grid',
      'preset.jiugongge.description': 'Warm brown lines for brush practice',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 15,
    max: 35,
    step: 1,
    default: 20,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'jiugongge',
      name: 'preset.jiugongge.name',
      description: 'preset.jiugongge.description',
      patch: {},
    },
  ],
  suggestsCalligraphyFrame: true,
  render: (ctx) => {
    const lattice = cellLattice(ctx.area, ctx.spacing * 3)
    if (lattice.cols === 0 || lattice.rows === 0) return []
    const base = ctx.ink.main()
    const inner = scaled(base, 0.7, 0.8)
    const edge = scaled(base, 1.5)
    const { x, y, w, h } = lattice.box
    const innerItems: LineItem[] = []
    for (let row = 0; row < lattice.rows; row++) {
      for (let k = 1; k <= 2; k++) {
        const cy = y + row * lattice.cell + (k * lattice.cell) / 3
        innerItems.push(line(x, cy, x + w, cy, inner))
      }
    }
    for (let col = 0; col < lattice.cols; col++) {
      for (let k = 1; k <= 2; k++) {
        const cx = x + col * lattice.cell + (k * lattice.cell) / 3
        innerItems.push(line(cx, y, cx, y + h, inner))
      }
    }
    return [
      ...innerItems,
      ...latticeLines(lattice, edge),
      cellBorder(lattice.box, scaled(base, 1.8)),
    ]
  },
})
