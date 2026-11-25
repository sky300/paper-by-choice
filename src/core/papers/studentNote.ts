/**
 * Student note paper.
 *
 * A header title box for the course and date, a binding rule 25 mm from the
 * left edge, and full-width ruled lines below. The fine footer rule that the
 * reference places in the bottom margin is kept just inside the lower edge of
 * the writing area so the paper never draws outside its area.
 */
import { line, rect, text } from '../scene/builders'
import type { SceneItem } from '../scene/types'
import { definePaper } from './define'
import { horizontalRules } from './shared/grids'

const BINDING_OFFSET = 25

export default definePaper({
  type: 'student_note',
  group: 'creative',
  messages: {
    'zh-CN': {
      name: '学生笔记纸',
      'spacing.label': '行距',
      'spacing.hint':
        '课堂笔记区横线的间距。常用 7–9 mm；老师板书多、字写得大就调到 10 mm 以上，只记关键词可用 6 mm。左侧侧边栏宽度不受它影响。',
      'text.course': '课程笔记',
      'text.date': '日期: ___/___/___',
      'preset.class.name': '课堂笔记',
      'preset.class.description': '标题框、装订栏与通栏横线，适合课堂记录',
    },
    en: {
      name: 'Student notes',
      'spacing.label': 'Line spacing',
      'spacing.hint':
        'Line pitch of the class-notes area. 7–9 mm is typical; above 10 mm for heavy board-copying or large handwriting, 6 mm for short keywords. The left sidebar width is unaffected.',
      'text.course': 'Class notes',
      'text.date': 'Date: ___/___/___',
      'preset.class.name': 'Class notes',
      'preset.class.description':
        'A title box, a binding column and full-width rules for class notes',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 6,
    max: 12,
    step: 0.5,
    default: 8,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'class',
      name: 'preset.class.name',
      description: 'preset.class.description',
      patch: {
        margins: { top: 30, right: 20, bottom: 25, left: 40 },
      },
    },
  ],
  render: (ctx) => {
    const { x: L, y: T, w: AW, h: AH } = ctx.area
    const R = L + AW
    const B = T + AH
    const S = ctx.spacing
    const main = ctx.ink.main()
    const items: SceneItem[] = []

    // Title box: three spacings tall, empty.
    items.push(rect({ x: L, y: T, w: AW, h: 3 * S }, main))

    // Binding rule, from the bottom of the title box down to the area's bottom.
    const bindingX = Math.min(L + BINDING_OFFSET, R)
    items.push(line(bindingX, T + 3 * S, bindingX, B, main))

    // Body rules, from four spacings down.
    items.push(...horizontalRules(ctx.area, S, main, 4 * S))

    // Fine footer rule, just inside the lower edge of the area.
    const fine = ctx.ink.main({ width: main.width * 0.5 })
    items.push(line(L, B, R, B, fine))

    // Header labels, all in the user's line colour.
    const labelY = T + 1.5 * S + 1.3
    items.push(
      text(
        L + 2.6,
        labelY,
        ctx.t('text.course'),
        ctx.fonts.body(3.2),
        main.color,
      ),
    )
    items.push(
      text(
        R - 26.5,
        labelY,
        ctx.t('text.date'),
        ctx.fonts.body(2.6),
        main.color,
      ),
    )
    return items
  },
})
