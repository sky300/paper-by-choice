/**
 * Pinyin practice paper (汉语拼音作业纸).
 *
 * Ten columns of four-line pinyin cells per row; a blank strip beneath every
 * row; a two-field name/date header on top. The reference default uses 20 mm
 * row height, coral-red rules, 25 mm margins on every side.
 */
import { line, rect } from '../scene/builders'
import type { SceneItem } from '../scene/types'
import { definePaper } from './define'
import { twoFieldHeader } from './shared/worksheets'

/** px (96 dpi) → mm. The reference geometry is given in px. */
const PX = 25.4 / 96

export default definePaper({
  type: 'pinyin_paper',
  group: 'worksheet',
  messages: {
    'zh-CN': {
      name: '汉语拼音作业纸',
      'spacing.label': '拼音格行高',
      'spacing.hint':
        '每组四线三格的行高：拼音区高度 = 行高 − 7 mm，剩下的是下方写汉字的空白带。常用 10–12 mm；行高低于 8 mm 时拼音区会变得很窄，建议保持 10 mm 以上。',
      'preset.default.name': '拼音四线三格',
      'preset.default.description':
        '四线三格拼音练习纸，每行下方留有空白带，可写拼音与汉字',
      'text.name': '姓名',
      'text.date': '日期',
    },
    en: {
      name: 'Pinyin practice paper',
      'spacing.label': 'Pinyin row height',
      'spacing.hint':
        'Height of one four-line pinyin row: the pinyin band = row height − 7 mm, and the rest is a blank strip for characters. 10–12 mm is typical; below 8 mm the pinyin band becomes very short, so 10 mm or more is recommended.',
      'preset.default.name': 'Pinyin four-line guide',
      'preset.default.description':
        'Four-line pinyin rows with a blank strip below each for handwriting',
      'text.name': 'Name',
      'text.date': 'Date',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 8,
    max: 15,
    step: 0.5,
    default: 12,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'pinyin',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  render: (ctx) => {
    const { x: L, y: T, w: AW, h: AH } = ctx.area
    const R = (mm: number): number => mm
    const rh = ctx.spacing
    // Reference constants: 7 mm blank strip below each row; grid starts 25 mm
    // below the top of the writing area (10 mm header + 15 mm gap).
    const strip = 7
    const pz = Math.max(1, rh - strip)
    const gy = T + R(10) + R(15)
    const rows = Math.max(0, Math.floor((T + AH - gy) / rh))
    const main = ctx.ink.main()
    const thin = ctx.ink.main({ width: main.width * 0.8 })
    const guide = ctx.ink.make(main.color, main.width * 0.5, [2 * PX, 2 * PX])
    const items: SceneItem[] = [
      ...twoFieldHeader(
        ctx.area,
        [ctx.t('text.name'), ctx.t('text.date')],
        ctx.fonts.body(3.2),
        ctx.ink.make(ctx.theme.text, 0.13),
      ),
      rect({ x: L, y: gy, w: AW, h: rows * rh }, main),
    ]
    const cw = AW / 10
    for (let r = 0; r < rows; r++) {
      const y0 = gy + r * rh
      items.push(line(L, y0, L + AW, y0, main))
      items.push(line(L, y0 + pz / 3, L + AW, y0 + pz / 3, guide))
      items.push(line(L, y0 + (2 * pz) / 3, L + AW, y0 + (2 * pz) / 3, guide))
      items.push(line(L, y0 + pz, L + AW, y0 + pz, main))
      // Vertical rules only cross the pinyin band, never the blank strip.
      for (let j = 0; j <= 10; j++) {
        items.push(line(L + j * cw, y0, L + j * cw, y0 + pz, thin))
      }
    }
    return items
  },
})
