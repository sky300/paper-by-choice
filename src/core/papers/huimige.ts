/**
 * 回米格 — a hard-pen practice cell: a square frame with a dashed cross, two
 * dashed diagonals through the centre and a smaller dashed square centred in
 * the cell. Cells are laid out in a centred lattice; `spacing` is the cell side.
 */
import { definePaper } from './define'
import { cellLattice, huimiCell } from './shared/cjkCells'
import type { Stroke } from '../scene/types'

/** The inner square is 0.45 of the cell side; the frame is at least 0.21 mm. */
const INNER_RATIO = 0.45
const MIN_FRAME_WIDTH = 0.21

/** Auxiliary lines: 0.8 of the line width, dashed 3–2, in the user's colour. */
function guideInk(base: Stroke): Stroke {
  return { ...base, width: base.width * 0.8, dash: [3, 2] }
}

export default definePaper({
  type: 'huimige',
  group: 'calligraphy',
  messages: {
    'zh-CN': {
      name: '回米格',
      'spacing.label': '格子大小',
      'spacing.hint':
        '回米格单格的边长，外框实线、内含田字格与对角线辅助线。常用 18–22 mm，适合硬笔书法练习。',
      'preset.huimige.name': '朱红回米格',
      'preset.huimige.description': '朱红格线配米字辅助线，适合硬笔练字',
    },
    en: {
      name: 'Hui-Mi grid',
      'spacing.label': 'Cell size',
      'spacing.hint':
        'Side length of one huimige cell: a solid frame with an inner tianzi grid and diagonal guides. 18–22 mm is typical for hard-pen calligraphy practice.',
      'preset.huimige.name': 'Vermilion Hui-Mi grid',
      'preset.huimige.description': 'Vermilion lines with star guides',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 15,
    max: 30,
    step: 1,
    default: 20,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'huimige',
      name: 'preset.huimige.name',
      description: 'preset.huimige.description',
      patch: {},
    },
  ],
  suggestsCalligraphyFrame: true,
  render: (ctx) => {
    const lattice = cellLattice(ctx.area, ctx.spacing)
    if (lattice.cols === 0 || lattice.rows === 0) return []
    const base = ctx.ink.main()
    const frame: Stroke = {
      ...base,
      width: Math.max(base.width * 1.5, MIN_FRAME_WIDTH),
      dash: undefined,
    }
    return lattice.cells.flatMap((cell) =>
      huimiCell(cell, frame, guideInk(base), INNER_RATIO),
    )
  },
})
