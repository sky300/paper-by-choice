/**
 * Error-correction worksheet: two identical half-page forms, each with a
 * labelled left column and a blank right column for the corrected solution.
 */
import { circle, line, text } from '../scene/builders'
import { repeatPositions } from '../scene/geometry'
import type { Scene, SceneItem } from '../scene/types'
import { definePaper } from './define'

const LABEL_PX = 3.2
const FIELD_ROWS = 7
const LEFT_RATIO = 0.35
const CIRCLE_R = 1.3
const CIRCLE_GAP = 4
const BOTTOM_LINES_GAP = 5

export default definePaper({
  type: 'error_correction',
  group: 'creative',
  messages: {
    'zh-CN': {
      name: '错题整理',
      'spacing.label': '行距',
      'spacing.hint':
        '这个参数不改变本纸型的版面：错题整理按固定分区与行数排布。想让订正区更宽裕，请调整纸张尺寸或四边边距。',
      'preset.default.name': '错题整理',
      'preset.default.description': '上下两栏结构化的错题记录表',
      'text.code': '编码:',
      'text.topic': '题目/错题:',
      'text.date': '整理时间:',
      'text.source': '题目来自:',
      'text.importance': '重要程度:',
      'text.mastery': '掌握程度:',
      'text.reason': '原因分析:',
      'text.point': '所属知识点:',
      'text.solution': '正解&思路:',
    },
    en: {
      name: 'Error correction',
      'spacing.label': 'Line spacing',
      'spacing.hint':
        'This setting does not change this layout: the error-correction sheet has fixed sections and rows. For a larger correction area, change the paper size or margins.',
      'preset.default.name': 'Error correction',
      'preset.default.description':
        'Two structured mistake-review forms per page',
      'text.code': 'Code:',
      'text.topic': 'Question / mistake:',
      'text.date': 'Reviewed:',
      'text.source': 'Source:',
      'text.importance': 'Importance:',
      'text.mastery': 'Mastery:',
      'text.reason': 'Reason:',
      'text.point': 'Topic:',
      'text.solution': 'Solution & reasoning:',
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
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'error-correction',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  render: (ctx): Scene => {
    const a = ctx.area
    const color = ctx.ink.main().color
    const lw = ctx.ink.main().width
    const main = ctx.ink.main()
    const dashed = ctx.ink.make(color, lw, [0.8, 0.53])
    const rating = ctx.ink.make(color, 25.4 / 96)
    const strong = ctx.ink.make(color, lw * 1.5, undefined)
    const medium = ctx.ink.make(color, lw * 1.2, undefined)
    const font = ctx.fonts.body(LABEL_PX)
    const items: SceneItem[] = []

    const hh = a.h / 2
    const leftW = a.w * LEFT_RATIO
    const XL = a.x + leftW
    const rowH = Math.min(8, hh / FIELD_ROWS)

    const rowLabels: readonly [string, string | null][] = [
      [ctx.t('text.code'), ctx.t('text.topic')],
      [ctx.t('text.date'), null],
      [ctx.t('text.source'), null],
      [ctx.t('text.importance'), null],
      [ctx.t('text.mastery'), null],
      [ctx.t('text.reason'), null],
      [ctx.t('text.point'), ctx.t('text.solution')],
    ]

    for (let h = 0; h < 2; h++) {
      const y0 = a.y + h * hh
      const y1 = y0 + hh
      if (h === 1) {
        items.push(line(a.x, y0, a.x + a.w, y0, strong))
      }
      // Field rows: each ends with a bottom rule.
      for (let r = 0; r < FIELD_ROWS; r++) {
        const bottom = y0 + (r + 1) * rowH
        const mid = y0 + r * rowH + rowH / 2
        const [left, right] = rowLabels[r]
        items.push(text(a.x, mid, left, font, color, { baseline: 'middle' }))
        if (right)
          items.push(text(XL, mid, right, font, color, { baseline: 'middle' }))
        const full = r === 0 || r === FIELD_ROWS - 1
        const stroke = r === FIELD_ROWS - 1 ? medium : r === 0 ? main : dashed
        items.push(line(a.x, bottom, full ? a.x + a.w : XL, bottom, stroke))
        // Rating circles on rows 4 and 5 (importance / mastery).
        if (r === 3 || r === 4) {
          for (let k = 0; k < 5; k++) {
            items.push(
              circle(
                a.x + Math.min(20 + k * CIRCLE_GAP, leftW * (0.4 + k / 9)),
                mid,
                CIRCLE_R,
                rating,
                undefined,
              ),
            )
          }
        }
      }
      // Extra faint rules below the field rows in the left column.
      const extraTop = y0 + FIELD_ROWS * rowH
      for (const dy of repeatPositions(
        y1 - extraTop,
        BOTTOM_LINES_GAP,
        BOTTOM_LINES_GAP,
      )) {
        const y = extraTop + dy
        if (y < y1 - 2) {
          items.push(line(a.x, y, XL, y, dashed))
        }
      }
      // Column divider.
      items.push(line(XL, y0, XL, y1, strong))
    }
    return items as Scene
  },
})
