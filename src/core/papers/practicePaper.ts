/** General practice paper: horizontal rules with a name / date header. */
import { line, rect } from '../scene/builders'
import { definePaper } from './define'
import { horizontalRules } from './shared/grids'
import { twoFieldHeader } from './shared/worksheets'

export default definePaper({
  type: 'practice_paper',
  group: 'worksheet',
  messages: {
    'zh-CN': {
      name: '练习纸',
      'spacing.label': '行距',
      'spacing.hint':
        '横线练习纸的行距。常用 7–9 mm，适合日常抄写与听写；字大就调大，想一页多练几行就调小。',
      'preset.default.name': '练习纸',
      'preset.default.description': '带姓名与日期栏的横线练习纸',
      'text.name': '姓名',
      'text.date': '日期',
    },
    en: {
      name: 'Practice sheet',
      'spacing.label': 'Line spacing',
      'spacing.hint':
        'Line pitch of the practice sheet. 7–9 mm is typical for everyday copying and dictation; increase for large handwriting, decrease to fit more lines per page.',
      'preset.default.name': 'Practice sheet',
      'preset.default.description':
        'Ruled practice sheet with a name and date header',
      'text.name': 'Name',
      'text.date': 'Date',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 6,
    max: 12,
    step: 0.5,
    default: 8,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'practice',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  render: (ctx) => {
    const { x, y, w, h } = ctx.area
    const top = y + 25
    const bottom = y + h
    if (bottom <= top) return []
    const main = ctx.ink.main()
    const dashed = ctx.ink.make(main.color, main.width * 0.8, [0.8, 0.8])
    return [
      rect(
        { x, y: top, w, h: bottom - top },
        ctx.ink.make(main.color, main.width),
      ),
      line(x + w / 2, top, x + w / 2, bottom, dashed),
      ...twoFieldHeader(
        ctx.area,
        [ctx.t('text.name'), ctx.t('text.date')],
        ctx.fonts.body(3.2),
        ctx.ink.main(),
      ),
      ...horizontalRules(
        { x, y: top, w, h: bottom - top },
        ctx.spacing,
        dashed,
      ),
    ]
  },
})
