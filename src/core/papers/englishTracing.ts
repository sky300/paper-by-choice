/** 根据可写宽度分行，按范例、描红、独写的顺序练习。
 * Wraps examples to fit and alternates model, tracing, and independent practice.
 */
import { text } from '../scene/builders'
import { definePaper } from './define'
import {
  englishHeader,
  englishHeaderField,
  englishHeaderMessages,
  handwritingGuide,
  wrapTracingSample,
} from './shared/englishGuides'

interface Options {
  showHeader: boolean
  sample: string
}

export default definePaper<Options>({
  type: 'english_tracing',
  group: 'english',
  messages: {
    'zh-CN': {
      ...englishHeaderMessages['zh-CN'],
      name: '英文描红纸',
      'spacing.label': '四线间距',
      'spacing.hint': '以毫米计，默认 5 mm。',
      'field.sample': '描红内容',
      'preset.trace-letters': '字母描红',
      'preset.trace-words': '单词描红',
      'preset.trace-sentence': '句子描红',
      'preset.description': '根据可写宽度分行，按范例、描红、独写的顺序练习。',
    },
    en: {
      ...englishHeaderMessages['en'],
      name: 'English tracing paper',
      'spacing.label': 'Line gap',
      'spacing.hint': 'Measured in millimetres. Default: 5 mm.',
      'field.sample': 'Tracing text',
      'preset.trace-letters': 'Trace letters',
      'preset.trace-words': 'Trace words',
      'preset.trace-sentence': 'Trace a sentence',
      'preset.description':
        'Wraps examples to fit and alternates model, tracing, and independent practice.',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 3,
    max: 8,
    step: 0.5,
    default: 5,
  },
  fields: [
    englishHeaderField,
    {
      kind: 'text',
      key: 'sample',
      label: 'field.sample',
      default: 'Aa Bb Cc',
      maxLength: 200,
    },
  ],
  defaultOptions: { showHeader: true, sample: 'Aa Bb Cc' },
  presets: [
    {
      id: 'trace-letters',
      name: 'preset.trace-letters',
      description: 'preset.description',
      patch: {},
    },
    {
      id: 'trace-words',
      name: 'preset.trace-words',
      description: 'preset.description',
      patch: { options: { sample: 'apple book cat' } },
    },
    {
      id: 'trace-sentence',
      name: 'preset.trace-sentence',
      description: 'preset.description',
      patch: { options: { sample: 'The sun is up.' } },
    },
  ],
  render(ctx) {
    const { area, items } = englishHeader(ctx, ctx.options.showHeader)
    const band = ctx.spacing
    const pitch = band * 4
    const fontSize = band * 1.5
    const maxChars = Math.max(1, Math.floor((area.w - 4) / fontSize))
    const samples = wrapTracingSample(ctx.options.sample, maxChars)
    const font = ctx.fonts.body(fontSize)
    // 每组依次安排范例、浅色描红和空白独写。
    // Each group presents a model, a faint tracing row, and an independent writing row.
    for (let row = 0; row * pitch + 3 * band <= area.h; row++) {
      const y = area.y + row * pitch
      items.push(...handwritingGuide(ctx, area, y, band, 'four'))
      const sample = samples[Math.floor(row / 3)]
      const stage = row % 3
      if (sample && stage !== 2) {
        items.push(
          text(
            area.x + 2,
            y + 2 * band,
            sample,
            font,
            stage === 0 ? ctx.theme.text : '#a4afbb',
          ),
        )
      }
    }
    return items
  },
})
