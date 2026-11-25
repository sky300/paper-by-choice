/** 带编号的单词听写和可选订正栏。
 * Numbered dictation with an optional corrections column.
 */
import { line, text } from '../scene/builders'
import { definePaper } from './define'
import {
  englishHeader,
  englishHeaderField,
  englishHeaderMessages,
  worksheetLabel,
} from './shared/englishGuides'

interface Options {
  showHeader: boolean
  count: '10' | '15' | '20'
  correction: boolean
}

export default definePaper<Options>({
  type: 'english_dictation',
  group: 'english',
  messages: {
    'zh-CN': {
      ...englishHeaderMessages['zh-CN'],
      name: '英文听写纸',
      'spacing.label': '行高',
      'spacing.hint': '以毫米计，默认 10 mm。',
      'field.count': '听写题数',
      'field.correction': '显示订正栏',
      'choice.10': '10',
      'choice.15': '15',
      'choice.20': '20',
      'text.correction': '订正',
      'preset.dictation-20': '20 题听写与订正',
      'preset.dictation-15': '15 题听写与订正',
      'preset.dictation-10': '10 题听写',
      'preset.description': '带编号的单词听写和可选订正栏。',
    },
    en: {
      ...englishHeaderMessages['en'],
      name: 'English dictation paper',
      'spacing.label': 'Row height',
      'spacing.hint': 'Measured in millimetres. Default: 10 mm.',
      'field.count': 'Dictation items',
      'field.correction': 'Show corrections column',
      'choice.10': '10',
      'choice.15': '15',
      'choice.20': '20',
      'text.correction': 'Corrections',
      'preset.dictation-20': '20 items with corrections',
      'preset.dictation-15': '15 items with corrections',
      'preset.dictation-10': '10 dictation items',
      'preset.description':
        'Numbered dictation with an optional corrections column.',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 7,
    max: 18,
    step: 0.5,
    default: 10,
  },
  fields: [
    englishHeaderField,
    {
      kind: 'select',
      key: 'count',
      label: 'field.count',
      default: '20',
      choices: [
        { value: '10', label: 'choice.10' },
        { value: '15', label: 'choice.15' },
        { value: '20', label: 'choice.20' },
      ],
    },
    {
      kind: 'toggle',
      key: 'correction',
      label: 'field.correction',
      default: true,
    },
  ],
  defaultOptions: { showHeader: true, count: '20', correction: true },
  presets: [
    {
      id: 'dictation-20',
      name: 'preset.dictation-20',
      description: 'preset.description',
      patch: {},
    },
    {
      id: 'dictation-15',
      name: 'preset.dictation-15',
      description: 'preset.description',
      patch: { options: { count: '15' } },
    },
    {
      id: 'dictation-10',
      name: 'preset.dictation-10',
      description: 'preset.description',
      patch: { options: { count: '10', correction: false } },
    },
  ],
  render(ctx) {
    const { area, items } = englishHeader(ctx, ctx.options.showHeader)
    const ink = ctx.ink.main()
    const split = area.x + area.w * 0.6
    const right = area.x + area.w
    const heading = ctx.options.correction ? 7 : 0
    // 较小的纸张或较大的行距只保留可以完整打印的行。
    // Keep only complete rows on small sheets or with large spacing.
    const count = Math.min(
      Number(ctx.options.count),
      Math.floor((area.h - heading) / ctx.spacing),
    )
    if (count < 1 || area.w < 30) return items
    if (ctx.options.correction) {
      items.push(
        worksheetLabel(
          ctx,
          ctx.t('text.correction'),
          split + 2,
          area.y + 4,
          right - split - 4,
        ),
      )
      items.push(
        line(split, area.y, split, area.y + heading + count * ctx.spacing, ink),
      )
    }
    for (let row = 0; row < count; row++) {
      const y = area.y + heading + (row + 1) * ctx.spacing
      items.push(
        text(area.x, y - 2, String(row + 1), ctx.fonts.body(2.8), ink.color),
      )
      items.push(
        line(area.x + 9, y, ctx.options.correction ? split - 2 : right, y, ink),
      )
      if (ctx.options.correction) items.push(line(split + 2, y, right, y, ink))
    }
    return items
  },
})
