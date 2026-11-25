/**
 * Blank manuscript paper.
 *
 * Five-line staffs laid from the top of the writing area downwards. The
 * spacing parameter is the gap between lines inside one staff; a separate
 * option sets the blank band between consecutive staffs. A staff whose bottom
 * line would cross the bottom edge is simply not drawn.
 */
import { definePaper } from './define'
import { staffGroup } from './shared/musicStaff'
import type { SceneItem } from '../scene/types'

interface MusicOptions {
  music: { staffCount: number; staffSpacing: number }
}

export default definePaper<MusicOptions>({
  type: 'music',
  group: 'basic',
  messages: {
    'zh-CN': {
      name: '乐谱纸',
      'spacing.label': '谱线间距',
      'spacing.hint':
        '每组五线谱内部相邻两条线的距离，决定谱表的大小。常用 2.5–3.5 mm；想每页排更多组谱表可配合下方「谱表间距」一起调。',
      'field.music.staffCount': '谱表组数',
      'field.music.staffCount.hint': '最多绘制多少组五线谱',
      'field.music.staffSpacing': '组间距',
      'field.music.staffSpacing.hint': '上一组底线到下一组顶线的距离',
      'preset.music-paper.name': '标准乐谱',
      'preset.music-paper.description': '10 组空白五线谱，适合抄谱与作曲',
    },
    en: {
      name: 'Manuscript paper',
      'spacing.label': 'Staff line gap',
      'spacing.hint':
        'Gap between adjacent lines inside one staff; it sets the staff size. 2.5–3.5 mm is typical. To fit more staves per page, adjust this together with the "Staff spacing" option below.',
      'field.music.staffCount': 'Number of staffs',
      'field.music.staffCount.hint': 'Maximum number of staffs to draw',
      'field.music.staffSpacing': 'Gap between staffs',
      'field.music.staffSpacing.hint':
        'Blank band between two consecutive staffs',
      'preset.music-paper.name': 'Standard manuscript',
      'preset.music-paper.description':
        'Ten blank staffs for copying and composing',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 2,
    max: 8,
    step: 0.5,
    default: 3,
  },
  fields: [
    {
      kind: 'number',
      key: 'music.staffCount',
      label: 'field.music.staffCount',
      hint: 'field.music.staffCount.hint',
      min: 1,
      max: 20,
      step: 1,
      default: 10,
    },
    {
      kind: 'number',
      key: 'music.staffSpacing',
      label: 'field.music.staffSpacing',
      hint: 'field.music.staffSpacing.hint',
      min: 4,
      max: 40,
      step: 1,
      unit: 'mm',
      default: 12,
    },
  ],
  defaultOptions: { music: { staffCount: 10, staffSpacing: 12 } },
  presets: [
    {
      id: 'music-paper',
      name: 'preset.music-paper.name',
      description: 'preset.music-paper.description',
      patch: {},
    },
  ],
  render: (ctx) => {
    const { area, spacing, ink } = ctx
    const { staffCount, staffSpacing } = ctx.options.music
    const height = 4 * spacing
    const period = height + staffSpacing
    const items: SceneItem[] = []
    for (let group = 0; group < staffCount; group++) {
      const top = area.y + group * period
      if (top + height > area.y + area.h + 1e-6) break
      items.push(...staffGroup(area.x, top, area.w, spacing, ink.main()))
    }
    return items
  },
})
