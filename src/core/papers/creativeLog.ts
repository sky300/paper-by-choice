/**
 * 布局创意记录区。
 * Lays out creative log areas.
 */
/**
 * Creative-log paper: a cross divides the writing area into four labelled
 * quadrants, overlaid with a sparse dashed grid that avoids the centre lines.
 */
import { line, text } from '../scene/builders'
import { repeatPositions } from '../scene/geometry'
import type { Scene, SceneItem } from '../scene/types'
import { definePaper } from './define'

const LABEL_PX = 3.7
const INSET = 2.6
const TOP_DROP = 5.3

export default definePaper({
  type: 'creative_log',
  group: 'creative',
  messages: {
    'zh-CN': {
      name: '创意记录纸',
      'spacing.label': '行距',
      'spacing.hint':
        '稀疏虚线网格与横线的间距。常用 6–10 mm：调大更便于写长段灵感与批注，调小更适合列清单、画小图。',
      'preset.default.name': '创意记录',
      'preset.default.description': '想法、灵感来源、问题与解决方案四象限',
      'text.ideas': '想法',
      'text.sources': '灵感来源',
      'text.problems': '问题',
      'text.solutions': '解决方案',
    },
    en: {
      name: 'Creative log',
      'spacing.label': 'Line spacing',
      'spacing.hint':
        'Spacing of the sparse dashed grid and rules. 6–10 mm is typical: a larger value suits long notes and annotations, a smaller one suits lists and small sketches.',
      'preset.default.name': 'Creative log',
      'preset.default.description':
        'Ideas, sources, problems and solutions in four quadrants',
      'text.ideas': 'Ideas',
      'text.sources': 'Sources',
      'text.problems': 'Problems',
      'text.solutions': 'Solutions',
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
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'creative-log',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  render: (ctx): Scene => {
    const a = ctx.area
    const S = ctx.spacing
    const color = ctx.ink.main().color
    const lw = ctx.ink.main().width
    const cx = a.x + a.w / 2
    const cy = a.y + a.h / 2
    const cross = ctx.ink.make(color, lw * 1.5, undefined)
    const dashed = ctx.ink.make(color, lw * 0.5, [2, 2])
    const items: SceneItem[] = []

    // 1. Central cross.
    items.push(line(a.x, cy, a.x + a.w, cy, cross))
    items.push(line(cx, a.y, cx, a.y + a.h, cross))

    // 2. Four quadrant labels, filled with the theme accent.
    const font = ctx.fonts.body(LABEL_PX, { weight: 700 })
    const fill = { color: ctx.theme.accent }
    const labels: readonly [number, number, string][] = [
      [a.x + INSET, a.y + TOP_DROP, ctx.t('text.ideas')],
      [cx + INSET, a.y + TOP_DROP, ctx.t('text.sources')],
      [a.x + INSET, cy + TOP_DROP, ctx.t('text.problems')],
      [cx + INSET, cy + TOP_DROP, ctx.t('text.solutions')],
    ]
    for (const [x, y, label] of labels) {
      items.push(text(x, y, label, font, fill))
    }

    // 3. Dashed grid at 2S, skipping lines within S of the centre lines.
    const pitch = 2 * S
    for (const dy of repeatPositions(a.h, pitch, pitch)) {
      const y = a.y + dy
      if (Math.abs(y - cy) >= S && y < a.y + a.h) {
        items.push(line(a.x, y, a.x + a.w, y, dashed))
      }
    }
    for (const dx of repeatPositions(a.w, pitch, pitch)) {
      const x = a.x + dx
      if (Math.abs(x - cx) >= S && x < a.x + a.w) {
        items.push(line(x, a.y, x, a.y + a.h, dashed))
      }
    }
    return items as Scene
  },
})
