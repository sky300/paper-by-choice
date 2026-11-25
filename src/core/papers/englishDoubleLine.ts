/** 上下实线标示小写字母主体的书写区域。
 * Two solid rules mark the body of lowercase letters.
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
  type: 'english_double_line',
  group: 'english',
  messages: {
    'zh-CN': {
      ...englishHeaderMessages['zh-CN'],
      name: '双线定位纸',
      'spacing.label': '行组间距',
      'spacing.hint': '以毫米计，默认 16 mm。',
      'preset.double': '双线定位',
      'preset.double-wide': '宽双线',
      'preset.description': '上下实线标示小写字母主体的书写区域。',
    },
    en: {
      ...englishHeaderMessages['en'],
      name: 'Double-line placement paper',
      'spacing.label': 'Row pitch',
      'spacing.hint': 'Measured in millimetres. Default: 16 mm.',
      'preset.double': 'Double-line placement',
      'preset.double-wide': 'Wide double line',
      'preset.description':
        'Two solid rules mark the body of lowercase letters.',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 10,
    max: 24,
    step: 0.5,
    default: 16,
  },
  fields: [englishHeaderField],
  defaultOptions: { showHeader: true },
  presets: [
    {
      id: 'double',
      name: 'preset.double',
      description: 'preset.description',
      patch: {},
    },
    {
      id: 'double-wide',
      name: 'preset.double-wide',
      description: 'preset.description',
      patch: { line: { spacing: 20 } },
    },
  ],
  render(ctx) {
    const { area, items } = englishHeader(ctx, ctx.options.showHeader)
    return [
      ...items,
      ...handwritingRows(ctx, area, ctx.spacing, ctx.spacing * 0.375, 'double'),
    ]
  },
})
