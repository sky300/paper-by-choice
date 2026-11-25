/**
 * 回宫格 — a calligraphy practice sheet: a centred lattice of square cells,
 * each split into nine smaller cells by two horizontal and two vertical
 * dashed guides. The whole grid gets a heavier outer frame.
 */
import { definePaper } from './define'
import {
  cellBorder,
  cellLattice,
  horizontalThirds,
  latticeLines,
  verticalThirds,
} from './shared/cjkCells'
import type { SceneItem, Stroke } from '../scene/types'

/** Guides at half the line width and a short dash, as an auxiliary layer. */
function guideInk(main: Stroke): Stroke {
  return {
    ...main,
    width: main.width * 0.5,
    dash: [2, 2],
    opacity: 0.6,
  }
}

export default definePaper({
  type: 'huigongge',
  group: 'calligraphy',
  messages: {
    'zh-CN': {
      name: '回宫格',
      'spacing.label': '回宫格大小',
      'spacing.hint':
        '回宫格的边长，格内用虚线分成九小格来定位笔画。常用 20–25 mm；初学建议 25 mm，熟练后可降到 15 mm。',
      'preset.huigongge.name': '经典回宫格',
      'preset.huigongge.description': '暖棕色格线，适合毛笔书法练习',
    },
    en: {
      name: 'Nine-palace grid',
      'spacing.label': 'Cell size',
      'spacing.hint':
        'Side length of each huigongge cell, whose dashed 3×3 subdivision locates strokes. 20–25 mm is typical; start at 25 mm for beginners, reduce to 15 mm with practice.',
      'preset.huigongge.name': 'Classic nine-palace grid',
      'preset.huigongge.description': 'Warm brown lines for brush practice',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 15,
    max: 35,
    step: 1,
    default: 22,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'huigongge',
      name: 'preset.huigongge.name',
      description: 'preset.huigongge.description',
      patch: {},
    },
  ],
  suggestsCalligraphyFrame: true,
  render: (ctx) => {
    const lattice = cellLattice(ctx.area, ctx.spacing)
    if (lattice.cols === 0 || lattice.rows === 0) return []
    const frame = ctx.ink.main()
    const guides = guideInk(frame)
    const items: SceneItem[] = latticeLines(lattice, frame)
    for (const cell of lattice.cells) {
      items.push(
        ...horizontalThirds(cell, guides),
        ...verticalThirds(cell, guides),
      )
    }
    items.push(cellBorder(lattice.box, { ...frame, width: frame.width * 1.2 }))
    return items
  },
})
