/**
 * 验证 grids 模块的 horizontalRules、verticalRules、cellGrid 行为。
 * Tests grids behavior covering horizontalRules, verticalRules, cellGrid.
 */
import { createInkKit } from '../kit'
import { describe, expect, test } from 'vitest'
import { cellGrid, dotGrid, horizontalRules, verticalRules } from './grids'

const ink = createInkKit({
  color: '#6b7280',
  width: 0.13,
  style: 'solid',
  spacing: 8,
})
/** The writing area of an A4 portrait page with 20 mm margins. */
const AREA = { x: 20, y: 20, w: 170, h: 257 }

/** The distinct x positions of the vertical lines among `items`, ascending. */
function xs(
  items: readonly {
    op: string
    x1: number
    y1: number
    x2: number
    y2: number
  }[],
) {
  return [
    ...new Set(
      items.filter((i) => i.op === 'line' && i.x1 === i.x2).map((i) => i.x1),
    ),
  ].sort((a, b) => a - b)
}
/** The distinct y positions of the horizontal lines among `items`, ascending. */
function ys(
  items: readonly {
    op: string
    x1: number
    y1: number
    x2: number
    y2: number
  }[],
) {
  return [
    ...new Set(
      items.filter((i) => i.op === 'line' && i.y1 === i.y2).map((i) => i.y1),
    ),
  ].sort((a, b) => a - b)
}

describe('horizontalRules', () => {
  test('starts one pitch below the top edge and repeats every pitch', () => {
    const rules = horizontalRules(AREA, 8, ink.main())
    expect(rules).toHaveLength(32)
    expect(rules[0]).toMatchObject({ x1: 20, y1: 28, x2: 190, y2: 28 })
    expect(rules.at(-1)).toMatchObject({ y1: 276, y2: 276 })
  })

  test('leaves the rule out when it would sit on the bottom edge', () => {
    // 256 is an exact multiple of 8: the 32nd rule would lie on the edge.
    const rules = horizontalRules({ ...AREA, h: 256 }, 8, ink.main())
    expect(rules).toHaveLength(31)
    expect(rules.at(-1)?.y1).toBe(268)
  })

  test('draws with the stroke it is given', () => {
    const stroke = ink.guide()
    expect(horizontalRules(AREA, 8, stroke)[0].stroke).toBe(stroke)
  })

  test('starts at the offset it is given', () => {
    expect(horizontalRules(AREA, 8, ink.main(), 4)[0].y1).toBe(24)
  })

  test('gives nothing when the first rule would not fit', () => {
    expect(horizontalRules({ ...AREA, h: 5 }, 8, ink.main())).toEqual([])
  })
})

describe('verticalRules', () => {
  test('runs from the top edge to the bottom edge at every pitch', () => {
    const rules = verticalRules(AREA, 10, ink.main())
    expect(rules).toHaveLength(16)
    expect(rules[0]).toMatchObject({ x1: 30, y1: 20, x2: 30, y2: 277 })
    expect(rules.at(-1)).toMatchObject({ x1: 180, x2: 180 })
  })

  test('leaves the rule out when it would sit on the right edge', () => {
    // 170 is an exact multiple of 10: the 17th rule would lie on the edge.
    expect(verticalRules({ ...AREA, w: 160 }, 10, ink.main()).at(-1)?.x1).toBe(
      170,
    )
  })
})

describe('cellGrid', () => {
  test('draws cols + 1 vertical lines and rows + 1 horizontal lines', () => {
    const { items, layout } = cellGrid(AREA, 10, ink.main())
    expect(layout).toEqual({ cols: 17, rows: 25, offsetX: 0, offsetY: 3.5 })
    expect(items).toHaveLength(44)
    expect(xs(items)).toHaveLength(18)
    expect(ys(items)).toHaveLength(26)
  })

  test('spans the grid from its first line to its last, leaving equal gaps where the cells do not fill the area', () => {
    const { items } = cellGrid(AREA, 10, ink.main())
    const x = xs(items)
    const y = ys(items)
    expect([x[0], x.at(-1)]).toEqual([20, 190])
    expect([y[0], y.at(-1)]).toEqual([23.5, 273.5])
    expect(y[0]! - AREA.y).toBe(AREA.y + AREA.h - y.at(-1)!)
  })

  test('starts flush with the top-left corner when asked', () => {
    const { items, layout } = cellGrid(AREA, 10, ink.main(), 'start')
    expect(layout.offsetY).toBe(0)
    expect(ys(items)[0]).toBe(20)
  })

  test('gives no lines when not a single cell fits', () => {
    const { items, layout } = cellGrid({ ...AREA, h: 5 }, 10, ink.main())
    expect(items).toEqual([])
    expect(layout.rows).toBe(0)
  })
})

describe('dotGrid', () => {
  test('puts a filled dot of 0.25 mm at the centre of every cell', () => {
    const dots = dotGrid({ x: 0, y: 0, w: 100, h: 60 }, 10, '#000000')
    expect(dots).toHaveLength(60)
    expect(dots[0]).toStrictEqual({
      op: 'ellipse',
      cx: 5,
      cy: 5,
      rx: 0.25,
      ry: 0.25,
      fill: { color: '#000000' },
    })
    expect(dots.at(-1)).toMatchObject({ cx: 95, cy: 55 })
  })

  test('centres the lattice, so the rim of dots keeps an equal margin', () => {
    const dots = dotGrid({ x: 0, y: 0, w: 105, h: 65 }, 10, '#000000')
    expect(dots).toHaveLength(60)
    expect(dots[0]).toMatchObject({ cx: 7.5, cy: 7.5 })
    expect(dots.at(-1)).toMatchObject({ cx: 97.5, cy: 57.5 })
  })

  test('takes the radius it is given', () => {
    expect(dotGrid(AREA, 10, '#000000', 0.5)[0].rx).toBe(0.5)
  })

  test('gives nothing when not a single cell fits', () => {
    expect(dotGrid({ ...AREA, w: 5 }, 10, '#000000')).toEqual([])
  })
})
