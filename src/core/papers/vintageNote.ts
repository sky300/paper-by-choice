/**
 * Vintage note paper.
 *
 * A blank title strip at the top, ruled writing lines below it, one accent
 * vertical guide near the left edge and four L-shaped corner brackets. All
 * emphasis is drawn in the theme's accent colour; the writing rules follow the
 * user's line settings. The faint speckles of the reference are background
 * decoration and belong to the page composer, so they are not drawn here.
 */
import { line, poly, pt } from '../scene/builders'
import type { SceneItem, Stroke } from '../scene/types'
import { definePaper } from './define'
import { horizontalRules } from './shared/grids'

const ARM = 5.3

interface Options {
  vintageNote: { verticalLinePosition: number }
}

export default definePaper<Options>({
  type: 'vintage_note',
  group: 'creative',
  messages: {
    'zh-CN': {
      name: '复古笔记纸',
      'spacing.label': '行距',
      'spacing.hint':
        '复古笔记纸正文横线的间距，稍大的行距更显舒展。常用 8–10 mm；标题区高度约为三个行距，左侧竖线位置可在专属配置里调整。',
      'field.verticalLinePosition': '竖线位置',
      'field.verticalLinePosition.hint': '竖线距书写区左边缘的毫米数',
      'preset.vintage-note.name': '复古笔记',
      'preset.vintage-note.description':
        '顶部标题线、左侧竖线与四角括线，适合写复古手记',
    },
    en: {
      name: 'Vintage notes',
      'spacing.label': 'Line spacing',
      'spacing.hint':
        'Line pitch of the vintage notes area; a slightly larger value feels more relaxed. 8–10 mm is typical. The title band is about three lines tall, and the left vertical rule is adjustable in the options below.',
      'field.verticalLinePosition': 'Guide position',
      'field.verticalLinePosition.hint':
        'Millimetres from the left edge of the writing area',
      'preset.vintage-note.name': 'Vintage notes',
      'preset.vintage-note.description':
        'A title rule, a left guide and corner brackets for classic notes',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 6,
    max: 15,
    step: 0.5,
    default: 9,
  },
  fields: [
    {
      kind: 'number',
      key: 'vintageNote.verticalLinePosition',
      label: 'field.verticalLinePosition',
      hint: 'field.verticalLinePosition.hint',
      min: 5,
      max: 100,
      step: 1,
      unit: 'mm',
      default: 15,
    },
  ],
  defaultOptions: { vintageNote: { verticalLinePosition: 15 } },
  presets: [
    {
      id: 'vintage-note',
      name: 'preset.vintage-note.name',
      description: 'preset.vintage-note.description',
      patch: {
        theme: 'vintage',
        margins: { top: 25, right: 20, bottom: 25, left: 25 },
      },
    },
  ],
  render: (ctx) => {
    const { x: L, y: T, w: AW, h: AH } = ctx.area
    const R = L + AW
    const B = T + AH
    const S = ctx.spacing
    const main = ctx.ink.main()
    const accent: Stroke = ctx.ink.make(ctx.theme.accent, main.width * 1.5)
    const items: SceneItem[] = []

    // Title rule: one accent line three spacings below the top edge.
    const titleY = T + 3 * S
    if (titleY <= B) items.push(line(L, titleY, R, titleY, accent))

    // Left guide: clamped to the writing area so it never escapes it.
    const position = ctx.options.vintageNote.verticalLinePosition
    const guideX = Math.min(L + Math.max(0, position), R)
    items.push(line(guideX, T, guideX, B, accent))

    // Body rules: from four spacings down, every spacing, never on the bottom.
    items.push(...horizontalRules(ctx.area, S, main, 4 * S))

    // Four L-shaped corner brackets.
    const arm = Math.min(ARM, AW / 2, AH / 2)
    items.push(
      poly([pt(L, T + arm), pt(L, T), pt(L + arm, T)], false, accent),
      poly([pt(R - arm, T), pt(R, T), pt(R, T + arm)], false, accent),
      poly([pt(L, B - arm), pt(L, B), pt(L + arm, B)], false, accent),
      poly([pt(R - arm, B), pt(R, B), pt(R, B - arm)], false, accent),
    )
    return items
  },
})
