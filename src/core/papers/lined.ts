/**
 * 绘制横线纸。
 * Draws horizontal ruled paper.
 */
/**
 * Ruled paper.
 *
 * Horizontal lines at the spacing the user chose, from one pitch below the
 * top of the writing area down to just above its bottom edge. The left /
 * right column layout is offered here but drawn by the compose layer, which
 * splits the writing area and calls `render()` once per column.
 */
import { definePaper } from './define'
import {
  COLUMNS_DEFAULTS,
  COLUMNS_FIELDS,
  COLUMNS_MESSAGES,
} from './shared/columns'
import { line } from '../scene/builders'
import { countThatFit } from '../scene/geometry'

export default definePaper({
  type: 'lined',
  group: 'basic',
  messages: {
    'zh-CN': {
      ...COLUMNS_MESSAGES['zh-CN'],
      name: '横线纸',
      'spacing.label': '行距',
      'spacing.hint':
        '相邻两条横线的距离。日常书写常用 6–10 mm：字大或喜欢留白用 10 mm 以上，想每页多写几行用 6 mm 左右。',
      'preset.notebook.name': '标准笔记',
      'preset.notebook.description': '适合日常笔记与课堂记录',
      'preset.exam-two-column.name': 'A3 试卷双栏',
      'preset.exam-two-column.description': 'A3 横向、左右两栏，适合试卷与讲义',
    },
    en: {
      ...COLUMNS_MESSAGES.en,
      name: 'Ruled paper',
      'spacing.label': 'Line spacing',
      'spacing.hint':
        'Distance between two ruled lines. 6–10 mm is typical for everyday handwriting: above 10 mm for large writing or generous whitespace, around 6 mm to fit more lines per page.',
      'preset.notebook.name': 'Standard notes',
      'preset.notebook.description': 'For everyday notes and class',
      'preset.exam-two-column.name': 'A3 two-column exam paper',
      'preset.exam-two-column.description':
        'A3 landscape in two columns, for exam papers and handouts',
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
  fields: COLUMNS_FIELDS,
  defaultOptions: COLUMNS_DEFAULTS,
  presets: [
    {
      id: 'notebook',
      name: 'preset.notebook.name',
      description: 'preset.notebook.description',
      patch: {},
    },
    {
      id: 'exam-two-column',
      name: 'preset.exam-two-column.name',
      description: 'preset.exam-two-column.description',
      patch: {
        paperSize: 'a3',
        orientation: 'landscape',
        margins: { top: 15, right: 15, bottom: 15, left: 15 },
        options: { columns: { count: '2', gap: 8, divider: 'solid' } },
      },
    },
  ],
  suggestsCalligraphyFrame: true,
  render: (ctx) => {
    const { x, y, w, h } = ctx.area
    const ink = ctx.ink.main()
    return Array.from({ length: countThatFit(h, ctx.spacing) + 1 }, (_, i) => {
      const row = y + i * ctx.spacing
      return line(x, row, x + w, row, ink)
    })
  },
})
