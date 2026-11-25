/**
 * Children's drawing paper.
 *
 * A white drawing area with a centered title bar at the top and ten faint
 * stars scattered inside it; there are no ruled lines or grids. The layered
 * page-wide colour frame and the warm page fill are background decoration and
 * belong to the page composer, so only the area itself is drawn here.
 */
import { poly, pt, rect, text } from '../scene/builders'
import type { SceneItem } from '../scene/types'
import { definePaper } from './define'

const STAR_COUNT = 10
const PALETTE = [
  '#f4a6b8',
  '#f8c8d4',
  '#fbd8bd',
  '#bfe3b4',
  '#a8dfd0',
  '#b9c8ef',
] as const
const TITLE_BAR = '#fbd8bd'
const DRAWING_FILL = '#ffffff'
const TITLE_INK = '#6b4423'
const STAR_OPACITY = 0.3
const BAR_OPACITY = 0.5

/** A pseudo-random unit value in [0, 1); fixed seed keeps render() pure. */
function noise(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}

/** A faint five-pointed star, first outer point pointing down, filled in one palette colour. */
function star(
  cx: number,
  cy: number,
  radius: number,
  color: string,
): ReturnType<typeof poly> {
  const points = []
  for (let i = 0; i < 10; i++) {
    const angle = Math.PI / 2 + (i * Math.PI) / 5
    const r = i % 2 === 0 ? radius : radius / 2
    points.push(pt(cx + r * Math.cos(angle), cy + r * Math.sin(angle)))
  }
  return poly(points, true, undefined, { color, opacity: STAR_OPACITY })
}

export default definePaper({
  type: 'children_drawing',
  group: 'creative',
  messages: {
    'zh-CN': {
      name: '儿童涂鸦纸',
      'spacing.label': '标题栏高度',
      'spacing.hint':
        '只调整顶部标题栏的高度，纸面本身不画格子，方便孩子自由涂画。需要更大标题栏就调大，想给画面留更多空间就调小。',
      'text.title': '我的创作',
      'preset.doodle.name': '彩色涂鸦纸',
      'preset.doodle.description': '六层彩色边框、白色画区与淡色星星',
    },
    en: {
      name: 'Drawing paper for kids',
      'spacing.label': 'Title bar height',
      'spacing.hint':
        'Only the height of the top title bar; the page itself has no grid so children can draw freely. Increase it for a bigger title area, decrease it to leave more room for the drawing.',
      'text.title': 'My creation',
      'preset.doodle.name': 'Colourful doodle sheet',
      'preset.doodle.description':
        'Six coloured frames, a white drawing area and faint stars',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 10,
    max: 25,
    step: 1,
    default: 15,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'doodle',
      name: 'preset.doodle.name',
      description: 'preset.doodle.description',
      patch: {},
    },
  ],
  render: (ctx) => {
    const { x: L, y: T, w: AW, h: AH } = ctx.area
    const S = ctx.spacing
    const items: SceneItem[] = []

    // The white drawing area, outlined in the user's line colour.
    items.push(rect(ctx.area, ctx.ink.main(), { color: DRAWING_FILL }))

    // Ten faint stars, deterministic so render() stays pure.
    const barHeight = Math.min(S, AH)
    const fieldTop = T + barHeight
    const fieldHeight = Math.max(0, AH - barHeight)
    for (let i = 0; i < STAR_COUNT; i++) {
      const radius = 1.3 + noise(i + 1) * 2.7
      const cx = L + radius + noise(i + 41) * Math.max(0, AW - 2 * radius)
      const cy =
        fieldTop +
        radius +
        noise(i + 81) * Math.max(0, fieldHeight - 2 * radius)
      items.push(star(cx, cy, radius, PALETTE[i % PALETTE.length]))
    }

    // The title bar sits above the stars.
    items.push(
      rect({ x: L, y: T, w: AW, h: barHeight }, undefined, {
        color: TITLE_BAR,
        opacity: BAR_OPACITY,
      }),
    )

    // Centered handwritten-style title on the bar.
    items.push(
      text(
        L + AW / 2,
        T + barHeight / 2 + 1.3,
        ctx.t('text.title'),
        ctx.fonts.hand(3.7, { weight: 700 }),
        TITLE_INK,
        { anchor: 'middle' },
      ),
    )
    return items
  },
})
