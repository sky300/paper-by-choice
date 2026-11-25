/**
 * 绘制等距网格。
 * Draws an isometric grid.
 */
/**
 * Isometric (30°/60°) grid paper.
 *
 * Three line families — horizontal and two diagonals — tile the writing area
 * with equilateral triangles of side `spacing`. Diagonals run the full height
 * and may extend beyond the left / right edges of the writing area.
 */
import { line } from '../scene/builders'
import type { SceneItem } from '../scene/types'
import { definePaper } from './define'

export default definePaper({
  type: 'isometric',
  group: 'basic',
  messages: {
    'zh-CN': {
      name: '等距网格',
      'spacing.label': '网格间距',
      'spacing.hint':
        '等边三角形的边长，决定三组斜线的密度。常用 4–6 mm，适合等轴测草图；调小更精细，调大更适合快速构思。',
      'preset.default.name': '等距网格',
      'preset.default.description': '三组直线围成等边三角形，适合立体草图',
    },
    en: {
      name: 'Isometric grid',
      'spacing.label': 'Grid spacing',
      'spacing.hint':
        'Side length of the equilateral triangles, setting the density of the three line families. 4–6 mm is typical for isometric sketches; smaller is finer, larger suits quick concepts.',
      'preset.default.name': 'Isometric grid',
      'preset.default.description':
        'Three line families form equilateral triangles',
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
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'isometric',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  render: (ctx) => {
    const { x: L, y: T, w: AW, h: AH } = ctx.area
    const c = ctx.spacing
    const f = (c * Math.sqrt(3)) / 2
    const items: SceneItem[] = []
    const main = ctx.ink.main()

    // Horizontal lines at every row height.
    for (let k = 0; T + k * f <= T + AH + 1e-6; k++) {
      items.push(line(L, T + k * f, L + AW, T + k * f, main))
    }

    const shift = AH / Math.sqrt(3)
    // Diagonals span the full height. Their endpoints are clipped to the
    // writing area so every export stays inside the sheet.
    const clipX = (x: number): number => Math.max(L, Math.min(L + AW, x))
    // "＼" diagonals: start left of the area, move right by c.
    for (let t = L - shift; t <= L + AW + 1e-6; t += c) {
      items.push(line(clipX(t), T, clipX(t + shift), T + AH, main))
    }
    // "／" diagonals: start at L, move right by c.
    for (let t = L; t <= L + AW + shift + 1e-6; t += c) {
      items.push(line(clipX(t), T, clipX(t - shift), T + AH, main))
    }
    return items
  },
})
