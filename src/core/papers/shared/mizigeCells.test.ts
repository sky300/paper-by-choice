import { describe, expect, test } from 'vitest'
import { box } from '../../scene/builders'
import { shapesOf } from '../../testing/paperTestKit'
import {
  cornerBrackets,
  frameGrid,
  gridFrame,
  hexagon,
  miziGuides,
} from './mizigeCells'

const ink = { color: '#333333', width: 0.2 }

describe('mizigeCells shared helpers', () => {
  test('gridFrame lays out full cells from the top-left corner', () => {
    const { cols, rows, items } = gridFrame(box(10, 20, 95, 105), 20, ink)
    expect(cols).toBe(4)
    expect(rows).toBe(5)
    // (cols + 1) horizontal + (rows + 1) vertical lines
    expect(shapesOf(items, 'line')).toHaveLength(5 + 6)
  })

  test('gridFrame returns zero cells when the area is too small', () => {
    const { cols, rows } = gridFrame(box(0, 0, 5, 5), 20, ink)
    expect(cols).toBe(0)
    expect(rows).toBe(0)
  })

  test('miziGuides draws two diagonals and two midlines', () => {
    const items = miziGuides(box(0, 0, 10, 10), ink)
    expect(items).toHaveLength(4)
  })

  test('hexagon has six vertices with one pointing up', () => {
    const item = hexagon(5, 5, 4, ink)
    expect(item.op).toBe('poly')
    if (item.op !== 'poly') throw new Error('not a poly')
    expect(item.points).toHaveLength(6)
    expect(item.points[0].x).toBeCloseTo(5, 6)
    expect(item.points[0].y).toBeCloseTo(1, 6)
  })

  test('cornerBrackets draws eight short arms', () => {
    expect(cornerBrackets(box(0, 0, 100, 100), 10, ink)).toHaveLength(8)
  })

  test('frameGrid lays out rows × cols frames with caption space', () => {
    const items = frameGrid(box(0, 0, 100, 60), 3, 2, 5, ink)
    expect(items).toHaveLength(6)
    for (const item of items) {
      if (item.op !== 'rect') throw new Error('not a rect')
      expect(item.box.h).toBeCloseTo(20 - 5, 6)
    }
  })
})
