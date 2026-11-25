/** 上方画图，下方用四线三格或美式三线写作。
 * Draw above and write on four-line or primary guides below.
 */
import { rect } from '../scene/builders'
import { definePaper } from './define'
import {
  englishHeader,
  englishHeaderField,
  englishHeaderMessages,
  handwritingRows,
} from './shared/englishGuides'

interface Options {
  showHeader: boolean
  ratio: 'third' | 'half'
  guide: 'four' | 'primary'
}

export default definePaper<Options>({
  type: 'english_draw_write',
  group: 'english',
  messages: {
    'zh-CN': {
      ...englishHeaderMessages['zh-CN'],
      name: '英语图文写作纸',
      'spacing.label': '四线间距',
      'spacing.hint': '以毫米计，默认 4 mm。',
      'field.ratio': '绘图区高度',
      'field.guide': '书写格线',
      'choice.third': '三分之一',
      'choice.half': '一半',
      'choice.four': '四线三格',
      'choice.primary': '美式三线',
      'preset.draw-third': '上方三分之一绘图',
      'preset.draw-half': '上方一半绘图',
      'preset.description': '上方画图，下方用四线三格或美式三线写作。',
    },
    en: {
      ...englishHeaderMessages['en'],
      name: 'English draw-and-write paper',
      'spacing.label': 'Line gap',
      'spacing.hint': 'Measured in millimetres. Default: 4 mm.',
      'field.ratio': 'Drawing area height',
      'field.guide': 'Writing guide',
      'choice.third': 'One third',
      'choice.half': 'One half',
      'choice.four': 'Four lines',
      'choice.primary': 'US primary',
      'preset.draw-third': 'One-third drawing area',
      'preset.draw-half': 'Half-page drawing area',
      'preset.description':
        'Draw above and write on four-line or primary guides below.',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 3,
    max: 8,
    step: 0.5,
    default: 4,
  },
  fields: [
    englishHeaderField,
    {
      kind: 'select',
      key: 'ratio',
      label: 'field.ratio',
      default: 'third',
      choices: [
        { value: 'third', label: 'choice.third' },
        { value: 'half', label: 'choice.half' },
      ],
    },
    {
      kind: 'select',
      key: 'guide',
      label: 'field.guide',
      default: 'four',
      choices: [
        { value: 'four', label: 'choice.four' },
        { value: 'primary', label: 'choice.primary' },
      ],
    },
  ],
  defaultOptions: { showHeader: true, ratio: 'third', guide: 'four' },
  presets: [
    {
      id: 'draw-third',
      name: 'preset.draw-third',
      description: 'preset.description',
      patch: {},
    },
    {
      id: 'draw-half',
      name: 'preset.draw-half',
      description: 'preset.description',
      patch: { options: { ratio: 'half' } },
    },
  ],
  render(ctx) {
    const { area, items } = englishHeader(ctx, ctx.options.showHeader)
    const height = area.h * (ctx.options.ratio === 'half' ? 0.5 : 1 / 3)
    const offset = height + 7
    const writing = { ...area, y: area.y + offset, h: area.h - offset }
    return [
      ...items,
      rect({ ...area, h: height }, ctx.ink.main()),
      ...handwritingRows(
        ctx,
        writing,
        5 * ctx.spacing,
        ctx.spacing,
        ctx.options.guide,
      ),
    ]
  },
})
