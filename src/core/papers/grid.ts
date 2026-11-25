/**
 * Square grid paper.
 *
 * A centred lattice of square cells inside the writing area; the number of
 * cells is whatever fits, with equal leftover space on opposite sides. The
 * column layout is declared but applied by the compose layer, which calls
 * `render()` once per column.
 */
import { definePaper } from './define'
import {
  COLUMNS_DEFAULTS,
  COLUMNS_FIELDS,
  COLUMNS_MESSAGES,
} from './shared/columns'
import { cellGrid } from './shared/grids'

export default definePaper({
  type: 'grid',
  group: 'basic',
  messages: {
    'zh-CN': {
      ...COLUMNS_MESSAGES['zh-CN'],
      name: '方格纸',
      'spacing.label': '格边长',
      'spacing.hint':
        '方格的边长。绘图与规划常用 4–6 mm；做数学草稿、像素画可到 3 mm，做大幅草图或低龄练习可到 10 mm 以上。',
      'preset.math.name': '数学方格',
      'preset.math.description': '标准 5 mm 方格，适合草稿与作图',
    },
    en: {
      ...COLUMNS_MESSAGES.en,
      name: 'Graph paper',
      'spacing.label': 'Cell size',
      'spacing.hint':
        'Side length of each square. 4–6 mm is typical for drawing and planning; 3 mm for maths drafts or pixel art, 10 mm+ for large sketches or young learners.',
      'preset.math.name': 'Math grid',
      'preset.math.description':
        'Standard 5 mm squares for sketching and graphs',
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
      id: 'math',
      name: 'preset.math.name',
      description: 'preset.math.description',
      patch: {},
    },
  ],
  render: (ctx) => cellGrid(ctx.area, ctx.spacing, ctx.ink.main()).items,
})
