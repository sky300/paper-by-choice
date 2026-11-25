/**
 * 绘制带红色基线和浅色斜线的英语定位纸。
 * Draws English placement paper with a red baseline and pale slanted guides.
 */
import { line } from '../scene/builders'
import { definePaper } from './define'
import {
  englishHeader,
  englishHeaderField,
  englishHeaderMessages,
} from './shared/englishGuides'

export default definePaper<{ showHeader: boolean }>({
  type: 'english_slanted',
  group: 'english',
  messages: {
    'zh-CN': {
      ...englishHeaderMessages['zh-CN'],
      name: '双色斜线定位纸',
      'spacing.label': '线组总高',
      'spacing.hint': '从最上方到最下方格线的高度，默认 10 mm。',
      'preset.name': '双色斜线定位',
      'preset.description': '四条实线、红色书写基线和浅色右斜定位线。',
    },
    en: {
      ...englishHeaderMessages.en,
      name: 'Two-tone slanted placement paper',
      'spacing.label': 'Guide group height',
      'spacing.hint':
        'Distance from the top rule to the bottom rule, 10 mm by default.',
      'preset.name': 'Two-tone slanted placement',
      'preset.description':
        'Four solid rules with a red baseline and pale right-slanted guides.',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 9,
    max: 24,
    step: 0.5,
    default: 10,
  },
  fields: [englishHeaderField],
  defaultOptions: { showHeader: true },
  presets: [
    {
      id: 'slanted',
      name: 'preset.name',
      description: 'preset.description',
      patch: {},
    },
  ],
  render(ctx) {
    const { area, items } = englishHeader(ctx, ctx.options.showHeader)
    const height = ctx.spacing
    const right = area.x + area.w
    const main = ctx.ink.main({ dash: undefined })
    const baseline = ctx.ink.make('#a94545', main.width)
    const guide = ctx.ink.make('#aeb8c2', main.width * 0.7)
    // 斜线向右倾 12°，仅绘制能完整落在四线组内的定位线。
    // Guides lean 12 degrees to the right and stay within the four-rule group.
    const lean = height * Math.tan(Math.PI / 15)
    for (
      let offset = 0;
      offset + height <= area.h + 1e-6;
      offset += height * 1.6
    ) {
      const top = area.y + offset
      for (let x = area.x + height / 3; x + lean <= right; x += height / 3) {
        items.push(line(x, top + height, x + lean, top, guide))
      }
      for (let row = 0; row < 4; row++) {
        const y = top + (height * row) / 3
        items.push(line(area.x, y, right, y, row === 2 ? baseline : main))
      }
    }
    return items
  },
})
