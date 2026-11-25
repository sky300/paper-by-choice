/**
 * 绘制四线三格及彩色、灰阶定位预设。
 * Draws four-line handwriting and its color and grayscale presets.
 *
 * English handwriting paper: four-line groups with an optional class/name/ID/date header.
 */
import { line, text } from '../scene/builders'
import type { SceneItem } from '../scene/types'
import { definePaper } from './define'
import { handwritingRows } from './shared/englishGuides'

interface Options {
  englishPaper: {
    showHeader: boolean
    guide?: 'four' | 'colour' | 'gray' | 'red'
  }
}

export default definePaper<Options>({
  type: 'english_paper',
  group: 'english',
  messages: {
    'zh-CN': {
      'field.guide': '定位样式',
      'guide.four': '四线三格',
      'guide.colour': '天空草地泥土',
      'guide.gray': '灰阶色带',
      'guide.red': '红色基线',
      'preset.four-compact': '紧凑四线三格',
      'preset.four-wide': '宽四线三格',
      'preset.english-sky-grass-ground': '天空草地泥土定位',
      'preset.four-grayscale': '灰阶定位',
      'preset.four-red': '红色基线',
      name: '英语四线三格纸',
      'spacing.label': '四线间距',
      'spacing.hint':
        '四线三格里相邻两条线的距离，决定英文字母的高度。默认 4 mm，四线三格总高 12 mm。',
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
      'field.guide': 'Placement style',
      'guide.four': 'Four lines',
      'guide.colour': 'Sky, grass and ground',
      'guide.gray': 'Grayscale bands',
      'guide.red': 'Red baseline',
      'preset.four-compact': 'Compact four-line',
      'preset.four-wide': 'Wide four-line',
      'preset.english-sky-grass-ground': 'Sky, grass and ground',
      'preset.four-grayscale': 'Grayscale placement',
      'preset.four-red': 'Red baseline',
      name: 'English handwriting paper',
      'spacing.label': 'Line gap',
      'spacing.hint':
        'Gap between adjacent lines of the four-line guide; it sets letter height. Defaults to 4 mm for a 12 mm guide.',
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
    default: 4,
  },
  fields: [
    {
      kind: 'toggle',
      key: 'englishPaper.showHeader',
      label: 'field.showHeader',
      default: true,
    },
    {
      kind: 'select',
      key: 'englishPaper.guide',
      label: 'field.guide',
      default: 'four',
      choices: [
        { value: 'four', label: 'guide.four' },
        { value: 'colour', label: 'guide.colour' },
        { value: 'gray', label: 'guide.gray' },
        { value: 'red', label: 'guide.red' },
      ],
    },
  ],
  defaultOptions: { englishPaper: { showHeader: true, guide: 'four' } },
  presets: [
    {
      id: 'english',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
    {
      id: 'four-compact',
      name: 'preset.four-compact',
      description: 'preset.default.description',
      patch: { line: { spacing: 3 } },
    },
    {
      id: 'four-wide',
      name: 'preset.four-wide',
      description: 'preset.default.description',
      patch: { line: { spacing: 6 } },
    },
    {
      id: 'english-sky-grass-ground',
      name: 'preset.english-sky-grass-ground',
      description: 'preset.default.description',
      patch: { options: { englishPaper: { guide: 'colour' } } },
    },
    {
      id: 'four-grayscale',
      name: 'preset.four-grayscale',
      description: 'preset.default.description',
      patch: { options: { englishPaper: { guide: 'gray' } } },
    },
    {
      id: 'four-red',
      name: 'preset.four-red',
      description: 'preset.default.description',
      patch: { options: { englishPaper: { guide: 'red' } } },
    },
  ],
  render: (ctx) => {
    const { x: L, y: T, w: AW, h: AH } = ctx.area
    const b = ctx.spacing
    const main = ctx.ink.main()
    const items: SceneItem[] = []
    const showHeader =
      ctx.options.englishPaper.showHeader !== false && AH >= 35 && AW >= 45
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

    // 按固定毫米节距铺满可写区域，保持预览和导出的一致性。
    // Use fixed millimetre pitch across the writing area for consistent rendering.
    const guide = ctx.options.englishPaper.guide ?? 'four'
    const area = { x: L, y: top, w: AW, h: T + AH - top }
    items.push(
      ...handwritingRows(
        ctx,
        area,
        5 * b,
        b,
        guide === 'red' ? 'four' : guide,
        guide === 'red' ? '#a94545' : undefined,
      ),
    )
    return items
  },
})
