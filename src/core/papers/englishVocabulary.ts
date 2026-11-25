/** 分栏记录单词、释义和例句。
 * Separate columns for words, meanings, and example sentences.
 */
import { line, rect } from '../scene/builders'
import { definePaper } from './define'
import {
  englishHeader,
  englishHeaderField,
  englishHeaderMessages,
  worksheetLabel,
} from './shared/englishGuides'

interface Options {
  showHeader: boolean
}

export default definePaper<Options>({
  type: 'english_vocabulary',
  group: 'english',
  messages: {
    'zh-CN': {
      ...englishHeaderMessages['zh-CN'],
      name: '英文词汇积累纸',
      'spacing.label': '行高',
      'spacing.hint': '以毫米计，默认 14 mm。',
      'text.word': '单词',
      'text.meaning': '释义',
      'text.example': '例句',
      'preset.vocabulary': '词汇、释义与例句',
      'preset.description': '分栏记录单词、释义和例句。',
    },
    en: {
      ...englishHeaderMessages['en'],
      name: 'English vocabulary paper',
      'spacing.label': 'Row height',
      'spacing.hint': 'Measured in millimetres. Default: 14 mm.',
      'text.word': 'Word',
      'text.meaning': 'Meaning',
      'text.example': 'Example',
      'preset.vocabulary': 'Word, meaning and example',
      'preset.description':
        'Separate columns for words, meanings, and example sentences.',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 9,
    max: 24,
    step: 0.5,
    default: 14,
  },
  fields: [englishHeaderField],
  defaultOptions: { showHeader: true },
  presets: [
    {
      id: 'vocabulary',
      name: 'preset.vocabulary',
      description: 'preset.description',
      patch: {},
    },
  ],
  render(ctx) {
    const { area, items } = englishHeader(ctx, ctx.options.showHeader)
    const ink = ctx.ink.main()
    const header = 8
    const rows = Math.floor((area.h - header) / ctx.spacing)
    if (rows < 1 || area.w < 30) return items
    const height = header + rows * ctx.spacing
    items.push(rect({ ...area, h: height }, ink))
    // 例句为连续书写预留更宽的列。
    // The example column is wider to accommodate sentences.
    const starts = [0, 0.24, 0.53, 1]
    const labels = ['text.word', 'text.meaning', 'text.example']
    labels.forEach((key, i) => {
      const x = area.x + area.w * starts[i]
      const width = area.w * (starts[i + 1] - starts[i])
      if (i > 0) items.push(line(x, area.y, x, area.y + height, ink))
      items.push(worksheetLabel(ctx, ctx.t(key), x + 2, area.y + 5, width - 4))
    })
    for (let row = 0; row < rows; row++) {
      const y = area.y + header + row * ctx.spacing
      items.push(line(area.x, y, area.x + area.w, y, ink))
    }
    return items
  },
})
