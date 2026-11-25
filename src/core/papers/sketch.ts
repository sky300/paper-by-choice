/**
 * Sketch paper: a dot matrix, a frame around the writing area and a 100 mm
 * scale bar in the lower-left corner for drawing to scale.
 */
import { circle, group, line, rect, text } from '../scene/builders'
import type { Scene, SceneItem } from '../scene/types'
import { definePaper } from './define'

const DOT_MIN = 0.3
const SCALE_LEN = 100
const TICK_COUNT = 11
const SCALE_FONT = 2.6

export default definePaper({
  type: 'sketch',
  group: 'creative',
  messages: {
    'zh-CN': {
      name: '草图纸',
      'spacing.label': '网格间距',
      'spacing.hint':
        '草图纸浅色网格的间距。常用 5–10 mm：画草图、构思版面用 8–10 mm，画细节或做像素稿可用 5 mm。',
      'preset.default.name': '草图纸',
      'preset.default.description': '点阵加书写区边框，左下角带比例尺',
      'text.mm': '{n}mm',
    },
    en: {
      name: 'Sketch paper',
      'spacing.label': 'Grid pitch',
      'spacing.hint':
        'Spacing of the faint sketch grid. 5–10 mm is typical: 8–10 mm for rough layouts and concepts, 5 mm for detail work or pixel sketches.',
      'preset.default.name': 'Sketch paper',
      'preset.default.description':
        'Dot matrix with a frame and a scale bar at the lower left',
      'text.mm': '{n}mm',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 5,
    max: 15,
    step: 0.5,
    default: 8,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'sketch',
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
    const radius = Math.max(DOT_MIN, lw) / 2
    const main = ctx.ink.main()
    const items: SceneItem[] = []

    // 1. Dots on the top and left edges, one every pitch, never past the far edges.
    const dots: SceneItem[] = []
    const cols = Math.floor(a.w / S) + 1
    const rows = Math.floor(a.h / S) + 1
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        dots.push(
          circle(a.x + i * S, a.y + j * S, radius, undefined, { color }),
        )
      }
    }
    items.push(group(dots, 0.4))

    // 2. Frame around the writing area.
    items.push(rect({ x: a.x, y: a.y, w: a.w, h: a.h }, main))

    // 3. Scale bar: 100 mm long, 11 ticks, labels at 0 / 50 / 100 mm.
    const baseY = a.y + a.h - S
    const scaleLen = Math.min(SCALE_LEN, a.w)
    const step = scaleLen / (TICK_COUNT - 1)
    items.push(line(a.x, baseY, a.x + scaleLen, baseY, main))
    const font = ctx.fonts.body(SCALE_FONT)
    for (let k = 0; k < TICK_COUNT; k++) {
      const x = a.x + k * step
      const long = k === 0 || k === 5 || k === 10
      const tick = long ? S / 2 : S / 4
      items.push(line(x, baseY - tick, x, baseY, main))
      if (long) {
        const labelX = Math.max(a.x, x - 2.6)
        items.push(
          text(
            labelX,
            baseY - tick - 1.3,
            ctx.t('text.mm', { n: k * 10 }),
            font,
            color,
          ),
        )
      }
    }
    return items as Scene
  },
})
