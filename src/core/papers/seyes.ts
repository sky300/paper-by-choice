/**
 * 绘制法式 Séyès 练习格。
 * Draws French Séyès ruling.
 */
/**
 * Séyès (French ruling) paper.
 *
 * A fixed 8 mm square grid, centred in the writing area, with three faint
 * auxiliary horizontals inside every cell. The spacing control is inert: the
 * ruling is always 8 mm, as in a real Séyès notebook.
 */
import { line, rect } from '../scene/builders'
import type { SceneItem } from '../scene/types'
import { layoutGrid } from '../scene/geometry'
import { definePaper } from './define'

const CELL = 8

export default definePaper({
  type: 'seyes',
  group: 'basic',
  messages: {
    'zh-CN': {
      name: '法式田字格',
      'spacing.label': '格子大小',
      'spacing.hint':
        '法式书写格（Séyès）固定为 8 mm，每格内含三条浅色辅助线控制字母高度，所以这个参数不改变画面。需要更大格子请换用「田字格」类纸型。',
      'preset.default.name': '法式田字格',
      'preset.default.description':
        '每格 8 mm，内含三条辅助线，用于控制字母高度',
    },
    en: {
      name: 'Séyès ruling',
      'spacing.label': 'Cell size',
      'spacing.hint':
        'Séyès ruling is fixed at 8 mm with three faint auxiliary lines per cell to control letter height, so this setting has no effect. For larger cells, choose one of the tianzi-style papers.',
      'preset.default.name': 'Séyès ruling',
      'preset.default.description':
        '8 mm cells with three auxiliary lines for letter heights',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 6,
    max: 12,
    step: 0.5,
    default: 8,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'seyes',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  render: (ctx) => {
    const { x: L, y: T, w: AW, h: AH } = ctx.area
    const grid = layoutGrid(AW, AH, CELL, 'center')
    const { cols: nc, rows: nr } = grid
    const ox = L + grid.offsetX
    const oy = T + grid.offsetY
    const right = ox + nc * CELL
    const bottom = oy + nr * CELL
    const main = ctx.ink.main()
    const items: SceneItem[] = []

    // Auxiliary horizontals first (three per cell).
    const guide = ctx.ink.main({
      width: main.width * 0.5,
      opacity: 0.7,
    })
    for (let j = 0; j < nr; j++) {
      for (let m = 1; m <= 3; m++) {
        items.push(
          line(
            ox,
            oy + j * CELL + (m * CELL) / 4,
            right,
            oy + j * CELL + (m * CELL) / 4,
            guide,
          ),
        )
      }
    }
    // Main horizontals and verticals (shared edges, drawn once).
    for (let k = 0; k <= nr; k++) {
      items.push(line(ox, oy + k * CELL, right, oy + k * CELL, main))
    }
    for (let k = 0; k <= nc; k++) {
      items.push(line(ox + k * CELL, oy, ox + k * CELL, bottom, main))
    }
    // A slightly heavier frame, drawn last.
    items.push(
      rect(
        { x: ox, y: oy, w: nc * CELL, h: nr * CELL },
        ctx.ink.main({ width: main.width * 1.2 }),
      ),
    )
    return items
  },
})
