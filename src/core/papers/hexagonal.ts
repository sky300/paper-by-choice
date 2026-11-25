/**
 * Hexagonal (honeycomb-ish) grid paper.
 *
 * A faint backing panel with a thin border, then staggered hexagon outlines.
 * The geometry follows the reference behaviour: column step 1.5a, row step
 * √3·a, odd rows shifted by half a step; outlines deliberately overlap.
 */
import { text } from '../scene/builders'
import type { SceneItem } from '../scene/types'
import { definePaper } from './define'
import { hexagon, outlined, filled } from './shared/mizigeCells'

interface Options {}

export default definePaper<Options>({
  type: 'hexagonal',
  group: 'basic',
  messages: {
    'zh-CN': {
      name: '六边形网格',
      'spacing.label': '六边形边长',
      'spacing.hint':
        '六边形外接圆的半径（也就是边长）。常用 5–7 mm，适合游戏地图与图案设计；调大六边形更醒目，调小能排得更密。',
      'preset.default.name': '六边形网格',
      'preset.default.description': '交错排列的六边形，适合地图与图案设计',
      'text.label': '六边形网格',
    },
    en: {
      name: 'Hexagonal grid',
      'spacing.label': 'Hexagon size',
      'spacing.hint':
        'Radius (and side length) of each hexagon. 5–7 mm is typical for game maps and pattern design; larger hexagons stand out more, smaller ones pack the page densely.',
      'preset.default.name': 'Hexagonal grid',
      'preset.default.description':
        'Staggered hexagons for maps and pattern design',
      'text.label': 'Hexagonal grid',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 4,
    max: 12,
    step: 0.5,
    default: 6,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'hexagonal',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  render: (ctx) => {
    const area = ctx.area
    const a = ctx.spacing
    const p = 1.5 * a
    const q = Math.sqrt(3) * a
    const items: SceneItem[] = []

    // Backing panel and its border.
    items.push(filled(area, '#f4f7fa'))
    items.push(
      outlined(area, ctx.ink.main({ width: ctx.ink.main().width * 0.8 })),
    )

    const nc = Math.floor(area.w / p)
    const nr = Math.floor(area.h / q)
    const ox = area.x + (area.w - nc * p) / 2
    const oy = area.y + (area.h - nr * q) / 2
    const main = ctx.ink.main()
    const accent = ctx.ink.make(ctx.theme.accent, main.width, main.dash)

    for (let j = 0; j <= nr; j++) {
      for (let i = 0; i <= nc; i++) {
        const cx = ox + i * p + (j % 2 === 1 ? p / 2 : 0)
        const cy = oy + j * q
        if (cx + a > area.x + area.w || cx - a < area.x) continue
        if (cy + q / 2 > area.y + area.h || cy - q / 2 < area.y) continue
        const highlight = (j + i) % 4 === 0
        items.push(
          hexagon(cx, cy, a, highlight ? { ...accent, opacity: 0.3 } : main),
        )
      }
    }

    // A small label in the top-left corner, inside the border.
    items.push(
      text(
        area.x + 2.6,
        area.y + 4,
        ctx.t('text.label'),
        ctx.fonts.body(2.6),
        { color: main.color, opacity: 0.7 },
        { anchor: 'start', baseline: 'alphabetic' },
      ),
    )
    return items
  },
})
