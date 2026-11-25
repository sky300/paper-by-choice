/** Combined pinyin + tianzi practice cells. */
import { line, rect } from '../scene/builders'
import type { SceneItem } from '../scene/types'
import { referenceCellCount } from './shared/grids'
import { definePaper } from './define'

export default definePaper({
  type: 'pinyin_tianzi',
  group: 'worksheet',
  messages: {
    'zh-CN': {
      name: '拼音田字格',
      'spacing.label': '田字格边长',
      'spacing.hint':
        '下方田字格的边长；上方拼音区高度是它的 0.6 倍。常用 18–22 mm，先写拼音再写汉字；孩子刚开始练字建议 20 mm 以上。',
      'preset.default.name': '拼音田字格',
      'preset.default.description': '上格写拼音、下格写汉字的组合练习格',
    },
    en: {
      name: 'Pinyin + tianzi',
      'spacing.label': 'Tianzi cell size',
      'spacing.hint':
        'Side length of the lower tianzi cell; the pinyin band above is 0.6× as tall. 18–22 mm is typical for pinyin-then-character practice; 20 mm+ is kinder for beginners.',
      'preset.default.name': 'Pinyin + tianzi',
      'preset.default.description': 'Pinyin above, character grid below',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 15,
    max: 30,
    step: 1,
    default: 20,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'pinyin-tianzi',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  render: (ctx) => {
    const { x: L, y: T, w: AW, h: AH } = ctx.area
    const g = ctx.spacing
    const a = 0.6 * g
    const uh = a + g
    const gap = 4
    const cols = referenceCellCount(AW, g)
    const rows = Math.floor(AH / (uh + gap))
    const gx = L + (AW - cols * g) / 2
    const gy = T + (AH - (rows * (uh + gap) - gap)) / 2
    const main = ctx.ink.main()
    const px = 25.4 / 96
    const ink = '#888888'
    const pinyinGuide = ctx.ink.make(ink, main.width * 0.7, [4 * px, 2 * px])
    const guide = ctx.ink.make(ink, main.width * 0.8, [5 * px, 2 * px])
    const items: SceneItem[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x0 = gx + c * g
        const y0 = gy + r * (uh + gap)
        const ty = y0 + a
        items.push(rect({ x: x0, y: y0, w: g, h: uh }, main))
        items.push(line(x0, ty, x0 + g, ty, main))
        items.push(line(x0, y0 + a / 3, x0 + g, y0 + a / 3, pinyinGuide))
        items.push(
          line(x0, y0 + (2 * a) / 3, x0 + g, y0 + (2 * a) / 3, pinyinGuide),
        )
        items.push(line(x0 + g / 2, ty, x0 + g / 2, ty + g, guide))
        items.push(line(x0, ty + g / 2, x0 + g, ty + g / 2, guide))
      }
    }
    return items
  },
})
