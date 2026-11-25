/**
 * Dot matrix paper.
 *
 * A centred lattice of small filled dots whose diameter scales gently with
 * the user's line width. The column layout is declared but applied by the
 * compose layer, which calls `render()` once per column.
 */
import { definePaper } from './define'
import {
  COLUMNS_DEFAULTS,
  COLUMNS_FIELDS,
  COLUMNS_MESSAGES,
} from './shared/columns'
import { dotGrid } from './shared/grids'

/** Dot radius for a line width: a little wider than the line, never thinner than 0.3 mm. */
function dotRadius(width: number): number {
  return Math.max(0.3, width * 1.2)
}

export default definePaper({
  type: 'dot',
  group: 'basic',
  messages: {
    'zh-CN': {
      ...COLUMNS_MESSAGES['zh-CN'],
      name: '点阵纸',
      'spacing.label': '点间距',
      'spacing.hint':
        '点与点之间的距离。4–6 mm 看起来最清爽，适合子弹笔记、草图与规划；最小 3 mm 适合精细作图，最大 15 mm 适合大版面速写。',
      'preset.dot-paper.name': '标准点阵',
      'preset.dot-paper.description': '5 mm 点阵，适合子弹笔记与草图',
    },
    en: {
      ...COLUMNS_MESSAGES.en,
      name: 'Dot paper',
      'spacing.label': 'Dot spacing',
      'spacing.hint':
        'Distance between dots. 4–6 mm looks cleanest for bullet journals, sketches and planning; 3 mm suits fine technical drawing, 15 mm suits large-format sketching.',
      'preset.dot-paper.name': 'Standard dots',
      'preset.dot-paper.description': '5 mm dots for bullet notes and sketches',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 3,
    max: 15,
    step: 0.5,
    default: 5,
  },
  fields: COLUMNS_FIELDS,
  defaultOptions: COLUMNS_DEFAULTS,
  presets: [
    {
      id: 'dot-paper',
      name: 'preset.dot-paper.name',
      description: 'preset.dot-paper.description',
      patch: {},
    },
  ],
  render: (ctx) =>
    dotGrid(
      ctx.area,
      ctx.spacing,
      ctx.ink.main().color,
      dotRadius(ctx.ink.main().width),
    ),
})
