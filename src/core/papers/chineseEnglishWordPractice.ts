/**
 * Chinese–English word practice paper: a two-column sheet where every row
 * pairs a numbered Chinese blank with a four-line English writing guide.
 */
import { line, rect, text } from '../scene/builders'
import type { Scene, SceneItem, Stroke } from '../scene/types'
import { definePaper } from './define'

const TITLE_FONT = 6
const INFO_FONT = 4
const ROW_FONT = 4
const FOOT_FONT = 3.5

interface Options {
  wordsPerPage: number
  wordsPerColumn: number
}

/** Four-line guide used for practising English handwriting. */
function fourLineGuide(
  x1: number,
  x2: number,
  top: number,
  gh: number,
  outer: Stroke,
  inner: Stroke,
): SceneItem[] {
  const step = gh / 3
  return [
    line(x1, top, x2, top, outer),
    line(x1, top + step, x2, top + step, inner),
    line(x1, top + 2 * step, x2, top + 2 * step, inner),
    line(x1, top + gh, x2, top + gh, outer),
  ]
}

export default definePaper<Options>({
  type: 'chinese_english_word_practice',
  group: 'creative',
  messages: {
    'zh-CN': {
      name: '汉英互译单词练习纸',
      'spacing.label': '行距',
      'spacing.hint':
        '这个参数不改变本纸型的版面：单词行由「每页词数 / 每栏词数」两个专属配置决定。如需调整行距感，请修改那两项。',
      'preset.default.name': '单词练习',
      'preset.default.description': '左右两栏，每行中文词横线配英文四线格',
      'field.wordsPerPage': '每页单词数',
      'field.wordsPerColumn': '每栏行数',
      'text.title': '汉英互译单词练习',
      'text.class': '班级',
      'text.name': '姓名',
      'text.number': '学号',
      'text.date': '日期',
      'text.year': '年',
      'text.month': '月',
      'text.day': '日',
    },
    en: {
      name: 'Chinese–English word practice',
      'spacing.label': 'Line spacing',
      'spacing.hint':
        'This setting does not change this layout: word rows are set by the two options "Words per page" and "Words per column" below. Adjust those instead to change how the rows feel.',
      'preset.default.name': 'Word practice',
      'preset.default.description':
        'Two columns, each row pairs a Chinese blank with a four-line guide',
      'field.wordsPerPage': 'Words per page',
      'field.wordsPerColumn': 'Rows per column',
      'text.title': 'Chinese–English word practice',
      'text.class': 'Class',
      'text.name': 'Name',
      'text.number': 'No.',
      'text.date': 'Date',
      'text.year': 'Y',
      'text.month': 'M',
      'text.day': 'D',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 8,
    max: 15,
    step: 0.5,
    default: 10,
  },
  fields: [
    {
      kind: 'number',
      key: 'wordsPerPage',
      label: 'field.wordsPerPage',
      min: 8,
      max: 32,
      step: 1,
      default: 16,
    },
    {
      kind: 'number',
      key: 'wordsPerColumn',
      label: 'field.wordsPerColumn',
      min: 1,
      max: 32,
      step: 1,
      default: 8,
    },
  ],
  defaultOptions: { wordsPerPage: 16, wordsPerColumn: 8 },
  presets: [
    {
      id: 'word-practice',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  render: (ctx): Scene => {
    const a = ctx.area
    if (a.w <= 0 || a.h <= 0) return []
    const color = ctx.ink.main().color
    const lw = ctx.ink.main().width
    const main = ctx.ink.main()
    const frame = ctx.ink.make(color, lw * 1.2, undefined)
    const inner = ctx.ink.make(color, lw * 0.8, [4, 3])
    const textColor = ctx.theme.text
    const titleColor = ctx.theme.primary
    const ncol = Math.max(1, Math.floor(ctx.options.wordsPerColumn))
    const items: SceneItem[] = []

    // Vertical layout, all proportional to the area so it never overflows.
    const titleY = a.y + a.h * 0.035
    const infoY = a.y + a.h * 0.085
    const frameTop = a.y + a.h * 0.12
    const frameBottom = a.y + a.h * 0.93
    const rowTop = a.y + a.h * 0.16
    const rowBottom = a.y + a.h * 0.88
    const footerY = a.y + a.h * 0.97

    // 1. Centred title.
    items.push(
      text(
        a.x + a.w / 2,
        titleY,
        ctx.t('text.title'),
        ctx.fonts.heading(TITLE_FONT, { weight: 700 }),
        titleColor,
        {
          anchor: 'middle',
        },
      ),
    )

    // 2. Four info fields with underlines.
    const infoKeys = [
      'text.class',
      'text.name',
      'text.number',
      'text.date',
    ] as const
    const colW = a.w / 4
    const infoFont = ctx.fonts.body(INFO_FONT)
    infoKeys.forEach((key, i) => {
      const x = a.x + i * colW
      items.push(text(x, infoY, ctx.t(key), infoFont, textColor))
      items.push(
        line(x + colW * 0.35, infoY + 1.3, x + colW * 0.9, infoY + 1.3, main),
      )
    })

    // 3. Outer frame and centre gutter.
    items.push(
      rect({ x: a.x, y: frameTop, w: a.w, h: frameBottom - frameTop }, frame),
    )
    const mid = a.x + a.w / 2
    items.push(line(mid, rowTop, mid, rowBottom, main))

    // 4. Two columns of rows.
    const rh = (rowBottom - rowTop) / ncol
    const rowFont = ctx.fonts.body(ROW_FONT)
    for (let col = 0; col < 2; col++) {
      const left = col === 0 ? a.x : mid
      const right = col === 0 ? mid : a.x + a.w
      for (let k = 0; k < ncol; k++) {
        const cy = rowTop + k * rh + rh / 2
        const num = col * ncol + k + 1
        items.push(text(left + 2, cy + 1.5, `${num}.`, rowFont, textColor))
        // Chinese blank line.
        items.push(line(left + colW * 0.22, cy, left + colW * 0.58, cy, main))
        // English four-line guide.
        const gh = Math.max(9, Math.min(16, 0.8 * rh))
        const gx1 = left + colW * 0.62
        const gx2 = right - 2
        if (gx2 > gx1) {
          items.push(...fourLineGuide(gx1, gx2, cy - gh / 2, gh, main, inner))
        }
      }
    }

    // 5. Footer: year / month / day.
    const footFont = ctx.fonts.body(FOOT_FONT)
    const ds = Math.min(a.w * 0.12, 30)
    const q = a.x + a.w - (2 * ds + 16)
    const footKeys = ['text.year', 'text.month', 'text.day'] as const
    footKeys.forEach((key, i) => {
      items.push(text(q + i * ds, footerY, ctx.t(key), footFont, textColor))
    })
    return items as Scene
  },
})
