/** 行组节距参考美国出版商标称规格，线组内部比例为应用默认值。
 * The row pitch follows publisher examples. The internal proportions are app defaults.
 */
import { definePaper } from './define'
import {
  englishHeader,
  englishHeaderField,
  englishHeaderMessages,
  handwritingRows,
} from './shared/englishGuides'

interface Options {
  showHeader: boolean
}

export default definePaper<Options>({
  type: 'english_primary',
  group: 'english',
  messages: {
    'zh-CN': {
      ...englishHeaderMessages['zh-CN'],
      name: '美式三线练习纸',
      'spacing.label': '行组间距',
      'spacing.hint': '以毫米计，默认 15.875 mm。',
      'preset.grade-one': '一年级 5/8 英寸',
      'preset.kindergarten': '幼儿园 3/4 英寸',
      'preset.primary-letter': '美式 Letter 纸张',
      'preset.description':
        '行组节距参考美国出版商标称规格，线组内部比例为应用默认值。',
    },
    en: {
      ...englishHeaderMessages['en'],
      name: 'US primary three-line paper',
      'spacing.label': 'Row pitch',
      'spacing.hint': 'Measured in millimetres. Default: 15.875 mm.',
      'preset.grade-one': 'Grade 1 · 5/8 in',
      'preset.kindergarten': 'Kindergarten · 3/4 in',
      'preset.primary-letter': 'US Letter paper',
      'preset.description':
        'The row pitch follows publisher examples. The internal proportions are app defaults.',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 9.525,
    max: 25.4,
    step: 0.025,
    default: 15.875,
  },
  fields: [englishHeaderField],
  defaultOptions: { showHeader: true },
  presets: [
    {
      id: 'grade-one',
      name: 'preset.grade-one',
      description: 'preset.description',
      patch: {},
    },
    {
      id: 'kindergarten',
      name: 'preset.kindergarten',
      description: 'preset.description',
      patch: { line: { spacing: 19.05 } },
    },
    {
      id: 'primary-letter',
      name: 'preset.primary-letter',
      description: 'preset.description',
      patch: { paperSize: 'letter' },
    },
  ],
  render(ctx) {
    const { area, items } = englishHeader(ctx, ctx.options.showHeader)
    return [
      ...items,
      ...handwritingRows(ctx, area, ctx.spacing, ctx.spacing / 3.4, 'primary'),
    ]
  },
})
