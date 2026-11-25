/**
 * 交叉格 — a square grid whose intersections are emphasised with a short
 * cross, useful for practising character structure. `spacing` is the cell
 * pitch; the lattice is centred in the writing area.
 */
import { line } from '../scene/builders'
import { clamp } from '../scene/geometry'
import { definePaper } from './define'
import { cellBorder, cellLattice, latticeLines } from './shared/cjkCells'
import type { Box, LineItem, Stroke } from '../scene/types'

/** Half-arm of a cross at each intersection, as a fraction of the pitch. */
const ARM = 1 / 6

/** A cross at `(x, y)` clipped to `box` so boundary crosses stay inside. */
function cross(
  x: number,
  y: number,
  arm: number,
  box: Box,
  stroke: Stroke,
): LineItem[] {
  const left = clamp(x - arm, box.x, box.x + box.w)
  const right = clamp(x + arm, box.x, box.x + box.w)
  const top = clamp(y - arm, box.y, box.y + box.h)
  const bottom = clamp(y + arm, box.y, box.y + box.h)
  return [line(x, top, x, bottom, stroke), line(left, y, right, y, stroke)]
}

export default definePaper({
  type: 'crossgrid',
  group: 'calligraphy',
  messages: {
    'zh-CN': {
      name: '交叉格',
      'spacing.label': '交叉格间距',
      'spacing.hint':
        '交叉点的间距，用于练习汉字结构与笔画定位。常用 12–18 mm；练大字调大，练小字调小。',
      'preset.crossgrid.name': '灰线交叉格',
      'preset.crossgrid.description': '中性灰格线，交点加重便于对准',
    },
    en: {
      name: 'Cross grid',
      'spacing.label': 'Grid pitch',
      'spacing.hint':
        'Distance between the cross marks, used to practise character structure and stroke placement. 12–18 mm is typical; increase for large characters, decrease for small ones.',
      'preset.crossgrid.name': 'Grey cross grid',
      'preset.crossgrid.description':
        'Neutral grey lines with emphasised crossings',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 8,
    max: 25,
    step: 1,
    default: 15,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'crossgrid',
      name: 'preset.crossgrid.name',
      description: 'preset.crossgrid.description',
      patch: {},
    },
  ],
  suggestsCalligraphyFrame: true,
  render: (ctx) => {
    const lattice = cellLattice(ctx.area, ctx.spacing)
    if (lattice.cols === 0 || lattice.rows === 0) return []
    const base = ctx.ink.main()
    const arm = lattice.cell * ARM
    const { x, y } = lattice.box
    const crosses: LineItem[] = []
    for (let row = 0; row <= lattice.rows; row++) {
      for (let col = 0; col <= lattice.cols; col++) {
        crosses.push(
          ...cross(
            x + col * lattice.cell,
            y + row * lattice.cell,
            arm,
            lattice.box,
            base,
          ),
        )
      }
    }
    return [
      ...latticeLines(lattice, base),
      ...crosses,
      cellBorder(lattice.box, { ...base, width: base.width * 1.2 }),
    ]
  },
})
