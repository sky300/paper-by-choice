/**
 * 中国田字格 — traditional square practice cells with a cross (horizontal
 * and vertical midline) in each cell, plus a heavier frame around the whole
 * centred lattice. The cross colour is a dedicated guide colour.
 */
import { definePaper } from './define'
import { getOption } from './kit'
import {
  cellBorder,
  cellLattice,
  latticeLines,
  tianziCell,
} from './shared/cjkCells'
import type { SceneItem, Stroke } from '../scene/types'

interface Options {
  calligraphy: { showGuides: boolean; guideColor: string }
}

const GUIDE_FIELDS = [
  {
    kind: 'toggle' as const,
    key: 'calligraphy.showGuides',
    label: 'field.guides',
    default: true,
  },
  {
    kind: 'color' as const,
    key: 'calligraphy.guideColor',
    label: 'field.guideColor',
    default: '#a9714b',
    showIf: (options: Record<string, unknown>) =>
      getOption<boolean>(options, 'calligraphy.showGuides', true),
  },
]

export default definePaper<Options>({
  type: 'chinesetianzi',
  group: 'calligraphy',
  messages: {
    'zh-CN': {
      name: '中国田字格',
      'spacing.label': '田字格大小',
      'spacing.hint':
        '田字格的边长。常用 15–20 mm：低年级或写大字用 20 mm 以上，练小楷可降到 12 mm。格内十字辅助线帮孩子找准笔画中心。',
      'field.guides': '显示十字辅助线',
      'field.guideColor': '辅助线颜色',
      'preset.chinesetianzi.name': '经典田字格',
      'preset.chinesetianzi.description': '暖棕色格线配棕色十字，适合书法练习',
    },
    en: {
      name: 'Chinese Tianzi grid',
      'spacing.label': 'Cell size',
      'spacing.hint':
        'The side length of each tianzi cell. 15–20 mm is typical: 20 mm or more for young children and large characters, down to 12 mm for small regular script. The cross guides help centre each stroke.',
      'field.guides': 'Show cross guides',
      'field.guideColor': 'Guide colour',
      'preset.chinesetianzi.name': 'Classic Tianzi grid',
      'preset.chinesetianzi.description': 'Warm brown lines with a brown cross',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 12,
    max: 30,
    step: 1,
    default: 18,
  },
  fields: GUIDE_FIELDS,
  defaultOptions: {
    calligraphy: { showGuides: true, guideColor: '#a9714b' },
  },
  presets: [
    {
      id: 'chinesetianzi',
      name: 'preset.chinesetianzi.name',
      description: 'preset.chinesetianzi.description',
      patch: {},
    },
  ],
  suggestsCalligraphyFrame: true,
  render: (ctx) => {
    const lattice = cellLattice(ctx.area, ctx.spacing)
    if (lattice.cols === 0 || lattice.rows === 0) return []
    const base = ctx.ink.main()
    const guide: Stroke = {
      ...base,
      color: ctx.options.calligraphy.guideColor,
      width: base.width * 0.7,
      dash: undefined,
      opacity: 0.7,
    }
    const items: SceneItem[] = latticeLines(lattice, base)
    if (ctx.options.calligraphy.showGuides) {
      for (const cell of lattice.cells) {
        // Only the cross, not the frame: the lattice lines already draw it.
        items.push(...tianziCell(cell, base, guide).slice(1))
      }
    }
    items.push(cellBorder(lattice.box, { ...base, width: base.width * 1.2 }))
    return items
  },
})
