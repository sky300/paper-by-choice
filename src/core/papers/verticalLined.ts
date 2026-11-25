/** Vertical ruled paper: the portrait sibling of `lined`. */
import { definePaper } from './define'
import { line } from '../scene/builders'
import { countThatFit } from '../scene/geometry'

export default definePaper({
  type: 'vertical_lined',
  group: 'basic',
  messages: {
    'zh-CN': {
      name: '竖线纸',
      'spacing.label': '列宽',
      'spacing.hint':
        '相邻两条竖线的距离，适合竖排书写或画表格列。常用 6–10 mm：写毛笔字调大，做窄栏列表调小。',
      'preset.default.name': '竖线纸',
      'preset.default.description': '等距竖线，适合竖排书写与表格',
    },
    en: {
      name: 'Vertical rules',
      'spacing.label': 'Column width',
      'spacing.hint':
        'Distance between two vertical rules, for vertical writing or table columns. 6–10 mm is typical; increase for brush writing, decrease for narrow columns.',
      'preset.default.name': 'Vertical rules',
      'preset.default.description':
        'Evenly spaced vertical lines for columns and vertical writing',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 4,
    max: 20,
    step: 0.5,
    default: 8,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'vertical-lined',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  render: (ctx) => {
    const { x, y, w, h } = ctx.area
    const ink = ctx.ink.main()
    return Array.from({ length: countThatFit(w, ctx.spacing) + 1 }, (_, i) => {
      const column = x + i * ctx.spacing
      return line(column, y, column, y + h, ink)
    })
  },
})
