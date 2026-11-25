import { createInkKit } from '../kit'
import { describe, expect, test } from 'vitest'
import {
  cellBorder,
  cellLattice,
  fixedLattice,
  horizontalThirds,
  huimiCell,
  innerBox,
  latticeLines,
  tianziCell,
  verticalThirds,
} from './cjkCells'

const ink = createInkKit({
  color: '#6b7280',
  width: 0.4,
  style: 'solid',
  spacing: 8,
})
const frame = ink.main()
const guide = ink.guide()

/** The writing area of an A4 portrait page with 20 mm margins. */
const AREA = { x: 20, y: 20, w: 170, h: 257 }
const CELL = { x: 0, y: 0, w: 30, h: 30 }

describe('cellLattice', () => {
  test('centres as many squares as fit and lists every cell', () => {
    const lattice = cellLattice(AREA, 22)
    expect(lattice.cols).toBe(7)
    expect(lattice.rows).toBe(11)
    expect(lattice.cell).toBe(22)
    expect(lattice.box).toEqual({ x: 28, y: 27.5, w: 154, h: 242 })
    expect(lattice.cells).toHaveLength(77)
    expect(lattice.cells[0]).toEqual({ x: 28, y: 27.5, w: 22, h: 22 })
    expect(lattice.cells.at(-1)).toEqual({ x: 160, y: 247.5, w: 22, h: 22 })
  })

  test('is empty when no cell fits', () => {
    const lattice = cellLattice(AREA, 1000)
    expect(lattice.cols).toBe(0)
    expect(lattice.rows).toBe(0)
    expect(lattice.cells).toEqual([])
  })
})

describe('fixedLattice', () => {
  test('fits an exact number of squares to the shorter side', () => {
    const lattice = fixedLattice(AREA, 10, 14)
    expect(lattice.cell).toBe(17)
    expect(lattice.box).toEqual({ x: 20, y: 29.5, w: 170, h: 238 })
    expect(lattice.cells).toHaveLength(140)
    expect(lattice.cells[0]).toEqual({ x: 20, y: 29.5, w: 17, h: 17 })
  })
})

describe('latticeLines', () => {
  test('draws one more line than there are cells on each axis', () => {
    const lattice = cellLattice({ x: 0, y: 0, w: 20, h: 20 }, 10)
    const lines = latticeLines(lattice, frame)
    expect(lines).toHaveLength(6)
    expect(lines.filter((item) => item.x1 === item.x2)).toHaveLength(3)
    expect(lines.filter((item) => item.y1 === item.y2)).toHaveLength(3)
    expect(lines.every((item) => item.stroke === frame)).toBe(true)
  })

  test('draws nothing for an empty lattice', () => {
    expect(latticeLines(cellLattice(AREA, 1000), frame)).toEqual([])
  })
})

describe('cellBorder', () => {
  test('outlines a box with the stroke it is given', () => {
    expect(cellBorder(CELL, frame)).toStrictEqual({
      op: 'rect',
      box: CELL,
      stroke: frame,
    })
  })
})

describe('innerBox', () => {
  test('scales a box about its centre', () => {
    expect(innerBox({ x: 0, y: 0, w: 20, h: 20 }, 0.45)).toEqual({
      x: 5.5,
      y: 5.5,
      w: 9,
      h: 9,
    })
  })
})

describe('third lines', () => {
  test('horizontalThirds splits the height into three', () => {
    expect(horizontalThirds(CELL, guide)).toEqual([
      { op: 'line', x1: 0, y1: 10, x2: 30, y2: 10, stroke: guide },
      { op: 'line', x1: 0, y1: 20, x2: 30, y2: 20, stroke: guide },
    ])
  })

  test('verticalThirds splits the width into three', () => {
    expect(verticalThirds(CELL, guide)).toEqual([
      { op: 'line', x1: 10, y1: 0, x2: 10, y2: 30, stroke: guide },
      { op: 'line', x1: 20, y1: 0, x2: 20, y2: 30, stroke: guide },
    ])
  })
})

describe('tianziCell', () => {
  test('draws a frame and the two midlines', () => {
    const items = tianziCell(CELL, frame, guide)
    expect(items).toHaveLength(3)
    expect(items[0]).toStrictEqual({ op: 'rect', box: CELL, stroke: frame })
    expect(items[1]).toMatchObject({
      op: 'line',
      x1: 0,
      y1: 15,
      x2: 30,
      y2: 15,
    })
    expect(items[2]).toMatchObject({
      op: 'line',
      x1: 15,
      y1: 0,
      x2: 15,
      y2: 30,
    })
  })
})

describe('huimiCell', () => {
  test('draws cross, diagonals, an inner box and the outer frame', () => {
    const items = huimiCell(CELL, frame, guide, 0.45)
    expect(items).toHaveLength(6)
    const rects = items.filter((item) => item.op === 'rect')
    expect(rects).toHaveLength(2)
    expect(rects[0]).toMatchObject({
      box: { x: 8.25, y: 8.25, w: 13.5, h: 13.5 },
      stroke: guide,
    })
    expect(rects[1]).toStrictEqual({ op: 'rect', box: CELL, stroke: frame })
  })
})
