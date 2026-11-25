/**
 * Calligraphy practice paper.
 *
 * A top-left aligned lattice of squares; each cell may carry a "rice" guide
 * of two diagonals and two midlines. Only whole cells are drawn, so any
 * leftover space stays on the right and at the bottom. The frame around the
 * content area is offered as a one-click finishing touch by the UI.
 */
import { definePaper } from './define'
import { layoutGrid } from '../scene/geometry'
import { rect } from '../scene/builders'
import { crossGuides, diagonalGuides } from './shared/guides'
import type { SceneItem, Stroke } from '../scene/types'

interface CalligraphyOptions {
  calligraphy: { showGuides: boolean; guideColor: string }
}

export default definePaper<CalligraphyOptions>({
  type: 'calligraphy',
  group: 'basic',
  messages: {
    'zh-CN': {
      name: '书法纸',
      'spacing.label': '格边长',
      'spacing.hint':
        '格子的边长，也是米字辅助线的尺度。初学者建议 20–30 mm 的大格，便于看清笔画位置；熟练后可逐步调小到 15 mm 左右。',
      'field.calligraphy.showGuides': '显示米字辅助线',
      'field.calligraphy.guideColor': '辅助线颜色',
      'preset.calligraphy.name': '书法练习格',
      'preset.calligraphy.description': '带米字辅助线的大方格，适合毛笔练习',
    },
    en: {
      name: 'Calligraphy paper',
      'spacing.label': 'Cell size',
      'spacing.hint':
        'The side length of each square and its "rice" guides. Beginners do well with 20–30 mm cells; as control improves, try smaller sizes around 15 mm.',
      'field.calligraphy.showGuides': 'Show rice-character guides',
      'field.calligraphy.guideColor': 'Guide colour',
      'preset.calligraphy.name': 'Practice squares',
      'preset.calligraphy.description':
        'Large squares with guide crosses for brush practice',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 15,
    max: 40,
    step: 1,
    default: 25,
  },
  fields: [
    {
      kind: 'toggle',
      key: 'calligraphy.showGuides',
      label: 'field.calligraphy.showGuides',
      default: true,
    },
    {
      kind: 'color',
      key: 'calligraphy.guideColor',
      label: 'field.calligraphy.guideColor',
      default: '#8a6f4d',
      showIf: (options) =>
        (options as { calligraphy?: { showGuides?: boolean } }).calligraphy
          ?.showGuides !== false,
    },
  ],
  defaultOptions: {
    calligraphy: { showGuides: true, guideColor: '#8a6f4d' },
  },
  presets: [
    {
      id: 'calligraphy',
      name: 'preset.calligraphy.name',
      description: 'preset.calligraphy.description',
      patch: {},
    },
  ],
  suggestsCalligraphyFrame: true,
  render: (ctx) => {
    const { area, spacing, ink, options } = ctx
    const { cols, rows } = layoutGrid(area.w, area.h, spacing, 'start')
    if (cols === 0 || rows === 0) return []
    const main: Stroke = ink.main()
    const guide: Stroke = ink.make(
      options.calligraphy.guideColor,
      main.width / 2,
    )
    const items: SceneItem[] = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = {
          x: area.x + col * spacing,
          y: area.y + row * spacing,
          w: spacing,
          h: spacing,
        }
        items.push(rect(cell, main))
        if (options.calligraphy.showGuides) {
          items.push(
            ...crossGuides(cell, guide),
            ...diagonalGuides(cell, guide),
          )
        }
      }
    }
    return items
  },
})
