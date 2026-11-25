/** English handwriting paper: four-line groups with an optional class/name/ID/date header. */
import { line, text } from '../scene/builders'
import type { SceneItem } from '../scene/types'
import { definePaper } from './define'

interface Options {
  englishPaper: { showHeader: boolean }
}

export default definePaper<Options>({
  type: 'english_paper',
  group: 'worksheet',
  messages: {
    'zh-CN': {
      name: '英语作业纸',
      'spacing.label': '四线间距',
      'spacing.hint':
        '四线三格里相邻两条线的距离，决定英文字母的高度。标准 4–6 mm；低年级建议 6–8 mm，写大写字母更从容。',
      'preset.default.name': '英语四线三格',
      'preset.default.description':
        '四线三格练习纸，带班级、姓名、学号、日期栏',
      'field.showHeader': '显示页眉',
      'text.class': '班级',
      'text.name': '姓名',
      'text.id': '学号',
      'text.date': '日期',
    },
    en: {
      name: 'English handwriting paper',
      'spacing.label': 'Line gap',
      'spacing.hint':
        'Gap between adjacent lines of the four-line guide; it sets letter height. 4–6 mm is standard; 6–8 mm gives younger learners more room for capitals.',
      'preset.default.name': 'Four-line guide',
      'preset.default.description':
        'Four-line groups with a class / name / ID / date header',
      'field.showHeader': 'Show header',
      'text.class': 'Class',
      'text.name': 'Name',
      'text.id': 'ID',
      'text.date': 'Date',
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
    {
      kind: 'toggle',
      key: 'englishPaper.showHeader',
      label: 'field.showHeader',
      default: true,
    },
  ],
  defaultOptions: { englishPaper: { showHeader: true } },
  presets: [
    {
      id: 'english',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  render: (ctx) => {
    const { x: L, y: T, w: AW, h: AH } = ctx.area
    const b = ctx.spacing
    const main = ctx.ink.main()
    const thin = ctx.ink.main({ width: main.width * 0.8 })
    const items: SceneItem[] = []
    const showHeader = ctx.options.englishPaper.showHeader !== false
    const top = showHeader ? T + 35 : T

    if (showHeader) {
      const cw = AW / 4
      const keys = ['text.class', 'text.name', 'text.id', 'text.date'] as const
      const font = ctx.fonts.body(4.2)
      keys.forEach((key, i) => {
        const label = ctx.t(key)
        const lx = L + i * cw + Math.min(5, cw / 8)
        items.push(text(lx, T + 15, label, font, main.color))
        if (cw > 25) {
          const y = T + 15 + (5 * 25.4) / 96
          items.push(
            line(
              lx + 15,
              y,
              lx + cw - 10,
              y,
              ctx.ink.make(main.color, 25.4 / 96),
            ),
          )
        }
      })
    }

    const height = T + AH - top
    if (height < 3 * b) return items
    const groups = Math.max(1, Math.floor(height / (5 * b)))
    const gap =
      groups > 1
        ? Math.max((height - 4 * b * groups) / (groups - 1), 0.8 * b)
        : b
    const heavy = ctx.ink.main({ width: main.width * 1.2 })
    for (let g = 0; g < groups; g++) {
      const y0 = top + g * (4 * b + gap)
      for (let i = 0; i < 4; i++) {
        const stroke = i === 2 ? heavy : thin
        items.push(line(L, y0 + i * b, L + AW, y0 + i * b, stroke))
      }
    }
    return items
  },
})
