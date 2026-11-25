/**
 * Meeting-note paper: an information header followed by three stacked
 * sections (agenda, discussion points, action items), the last with
 * checkboxes on every ruled line.
 */
import { line, rect, text } from '../scene/builders'
import { repeatPositions } from '../scene/geometry'
import type { Scene, SceneItem } from '../scene/types'
import { definePaper } from './define'
import { checkbox, fieldUnderline } from './shared/forms'

const TITLE_PX = 3.7
const LABEL_PX = 3.2
const INSET = 2.6
const TITLE_DROP = 5.3
const LABEL_ROW1 = 11.9
const LABEL_ROW2 = 18.5
const SECTION_TITLE_DROP = 5.3
const FIRST_RULE_DROP = 7.9
const BOX_SIZE = 2.6
const BOX_RISE = 2.6
const SUBJECT_INSET = 52.9
const FIELD_LEN = 39.7

export default definePaper({
  type: 'meeting_note',
  group: 'creative',
  messages: {
    'zh-CN': {
      name: '会议笔记纸',
      'spacing.label': '行距',
      'spacing.hint':
        '会议记录区行线的间距。常用 6–10 mm：需要手写较多行动项就调大，只记录要点可调小；议程与行动项分区是固定的。',
      'preset.default.name': '会议记录',
      'preset.default.description': '信息头加议程、讨论要点与行动项三分区',
      'text.title': '会议记录',
      'text.date': '日期:',
      'text.attendees': '参与者:',
      'text.subject': '主题:',
      'text.agenda': '议程',
      'text.discussion': '讨论要点',
      'text.actions': '行动项',
    },
    en: {
      name: 'Meeting notes',
      'spacing.label': 'Line spacing',
      'spacing.hint':
        'Line pitch of the meeting-notes area. 6–10 mm is typical: increase it for handwritten action items, decrease it for short bullet points. The agenda and action-item sections are fixed.',
      'preset.default.name': 'Meeting record',
      'preset.default.description':
        'Header plus agenda, discussion and action-item sections',
      'text.title': 'Meeting notes',
      'text.date': 'Date:',
      'text.attendees': 'Attendees:',
      'text.subject': 'Subject:',
      'text.agenda': 'Agenda',
      'text.discussion': 'Discussion points',
      'text.actions': 'Action items',
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
      id: 'meeting-note',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  render: (ctx): Scene => {
    const a = ctx.area
    const S = ctx.spacing
    const thin = ctx.ink.make(ctx.ink.main().color, ctx.ink.main().width * 0.5)
    const divider = ctx.ink.make(
      ctx.ink.main().color,
      ctx.ink.main().width * 1.2,
    )
    const accentFill = { color: ctx.theme.accent, opacity: 0.1 }
    const inkColor = ctx.ink.main().color
    const main = ctx.ink.main()
    const labelFont = ctx.fonts.body(LABEL_PX)
    const titleFont = ctx.fonts.heading(TITLE_PX, { weight: 700 })
    const sectionFont = ctx.fonts.body(LABEL_PX, { weight: 700 })
    const items: SceneItem[] = []

    // 1. Header band, 4 line-spacings tall, with accented wash.
    const headerH = 4 * S
    if (headerH > 0) {
      items.push(rect({ x: a.x, y: a.y, w: a.w, h: headerH }, main, accentFill))
    }
    items.push(
      text(
        a.x + INSET,
        a.y + TITLE_DROP,
        ctx.t('text.title'),
        titleFont,
        inkColor,
      ),
    )
    items.push(
      text(
        a.x + INSET,
        a.y + LABEL_ROW1,
        ctx.t('text.date'),
        labelFont,
        inkColor,
      ),
    )
    items.push(
      fieldUnderline(a.x + INSET, a.y + LABEL_ROW1 + 1.3, FIELD_LEN, thin),
    )
    items.push(
      text(
        a.x + INSET,
        a.y + LABEL_ROW2,
        ctx.t('text.attendees'),
        labelFont,
        inkColor,
      ),
    )
    items.push(
      fieldUnderline(a.x + INSET, a.y + LABEL_ROW2 + 1.3, FIELD_LEN, thin),
    )
    const subjectX = a.x + a.w - SUBJECT_INSET
    items.push(
      text(
        subjectX,
        a.y + LABEL_ROW1,
        ctx.t('text.subject'),
        labelFont,
        inkColor,
      ),
    )
    items.push(
      fieldUnderline(subjectX, a.y + LABEL_ROW1 + 1.3, FIELD_LEN, thin),
    )

    // 2. Three equal sections. Rule positions use the paper's spacing.
    const y1 = a.y + 5 * S
    const hp = (a.y + a.h - y1) / 3
    const titles = [
      ctx.t('text.agenda'),
      ctx.t('text.discussion'),
      ctx.t('text.actions'),
    ]
    for (let r = 0; r < 3; r++) {
      const top = y1 + r * hp
      const bottom = r < 2 ? y1 + (r + 1) * hp : a.y + a.h
      if (r > 0) {
        items.push(line(a.x, top, a.x + a.w, top, divider))
      }
      items.push(
        text(
          a.x + INSET,
          top + SECTION_TITLE_DROP,
          titles[r],
          sectionFont,
          inkColor,
        ),
      )
      const rules = repeatPositions(bottom - top, S, FIRST_RULE_DROP)
      for (const y of rules) {
        const ry = top + y
        items.push(line(a.x, ry, a.x + a.w, ry, main))
        if (r === 2) {
          items.push(checkbox(a.x + 1.3, ry - BOX_RISE, BOX_SIZE, thin))
        }
      }
    }
    return items as Scene
  },
})
