/**
 * 绘制点阵纸。
 * Draws dot-grid paper.
 */
/**
 * Dot matrix paper.
 *
 * The lattice starts at the top-left margin; dots scale with line width. The column layout is declared but applied by the
 * compose layer, which calls `render()` once per column.
 */
import { definePaper } from './define'
import {
  COLUMNS_DEFAULTS,
  COLUMNS_FIELDS,
  COLUMNS_MESSAGES,
} from './shared/columns'
import { circle } from '../scene/builders'
import { referenceCellCount } from './shared/grids'

/** Dot radius for a line width: the line width or half a reference pixel. */
function dotRadius(width: number): number {
  return Math.max((0.5 * 25.4) / 96, width)
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
  render: (ctx) => {
    const { x, y, w, h } = ctx.area
    const { spacing } = ctx
    const ink = ctx.ink.main()
    const fill = { color: ink.color }
    const radius = dotRadius(ink.width)
    const cols = referenceCellCount(w, spacing)
    const rows = referenceCellCount(h, spacing)
    return Array.from({ length: rows + 1 }, (_, row) =>
      Array.from({ length: cols + 1 }, (_, col) =>
        circle(x + col * spacing, y + row * spacing, radius, undefined, fill),
      ),
    ).flat()
  },
})
