/**
 * 生成汉英互译单词练习纸。
 * Draws Chinese–English translation drills.
 */
/**
 * Chinese–English word practice paper: a two-column sheet where every row
 * pairs a numbered Chinese blank with a four-line English writing guide.
 */
import { line, rect, text } from '../scene/builders'
import type { Scene, SceneItem, Stroke } from '../scene/types'
import { definePaper } from './define'

const PX = 25.4 / 96
const TITLE_FONT = 24 * PX
const INFO_FONT = 16 * PX
const ROW_FONT = 16 * PX
const FOOT_FONT = 14 * PX

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
  group: 'english',
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
    const main = ctx.ink.make(color, lw)
    const frame = ctx.ink.make(color, lw * 1.2, undefined)
    const inner = ctx.ink.make(
      color,
      lw * 0.8,
      ctx.ink.main().dash ?? [4 * PX, 3 * PX],
    )
    const textColor = ctx.theme.text
    const titleColor = ctx.theme.primary
    const ncol = Math.max(1, Math.floor(ctx.options.wordsPerColumn))
    const items: SceneItem[] = []

    // Keep the fixed header and footer proportions on smaller formats.
    const unit = Math.min(PX, a.h / 160, a.w / 300)
    const titleY = a.y + 30 * unit
    const infoY = a.y + 70 * unit
    const frameTop = a.y + 90 * unit
    const frameBottom = a.y + a.h - 30 * unit
    const rowTop = a.y + 120 * unit
    const rowBottom = frameBottom
    const footerY = a.y + a.h - 10 * unit

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
    const colW = (a.w - 40 * unit) / 4
    const infoFont = ctx.fonts.body(INFO_FONT)
    infoKeys.forEach((key, i) => {
      const x = a.x + 20 * unit + i * colW
      items.push(text(x, infoY, ctx.t(key), infoFont, textColor))
      items.push(
        line(
          x + 50 * unit,
          infoY + 5 * unit,
          x + 50 * unit + Math.min(90 * unit, colW - 60 * unit),
          infoY + 5 * unit,
          main,
        ),
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
        items.push(
          text(left + 20 * unit, cy + 5 * unit, `${num}.`, rowFont, textColor),
        )
        // Chinese blank line.
        items.push(line(left + 45 * unit, cy, left + 120 * unit, cy, main))
        // English four-line guide.
        const gh = Math.min(
          rh,
          Math.max(35 * unit, Math.min(60 * unit, 0.8 * rh)),
        )
        const gx1 = left + 130 * unit
        const gx2 = right - 20 * unit
        if (gx2 > gx1) {
          items.push(...fourLineGuide(gx1, gx2, cy - gh / 2, gh, main, inner))
        }
      }
    }

    // 5. Footer: year / month / day.
    const footFont = ctx.fonts.body(FOOT_FONT)
    const ds = Math.min(a.w / 8, 45 * unit)
    const q = a.x + a.w - (2 * ds + 60 * unit)
    const footKeys = ['text.year', 'text.month', 'text.day'] as const
    footKeys.forEach((key, i) => {
      items.push(text(q + i * ds, footerY, ctx.t(key), footFont, textColor))
    })
    return items as Scene
  },
})
