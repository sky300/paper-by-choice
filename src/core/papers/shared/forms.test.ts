import { describe, expect, test } from 'vitest'
import type { Font, Paint, Stroke } from '../../scene/types'
import {
  checkbox,
  fieldUnderline,
  labelledField,
  rulesWithin,
  sectionBox,
  tableGrid,
} from './forms'

const stroke: Stroke = { color: '#123456', width: 0.2 }
const fill: Paint = { color: '#abcdef', opacity: 0.1 }
const font: Font = { family: 'Arial', size: 3 }
const area = { x: 0, y: 0, w: 60, h: 40 }

describe('shared/forms: checkbox', () => {
  test('is an empty square of the requested size', () => {
    const item = checkbox(12, 34, 2.6, stroke)
    expect(item.op).toBe('rect')
    expect(item.box).toEqual({ x: 12, y: 34, w: 2.6, h: 2.6 })
    expect(item.stroke).toBe(stroke)
    expect(item.fill).toBeUndefined()
  })
})

describe('shared/forms: fieldUnderline', () => {
  test('is one horizontal line of the requested length', () => {
    expect(fieldUnderline(10, 20, 40, stroke)).toEqual({
      op: 'line',
      x1: 10,
      y1: 20,
      x2: 50,
      y2: 20,
      stroke,
    })
  })
})

describe('shared/forms: labelledField', () => {
  test('draws the translated label and an underline below it', () => {
    const items = labelledField(10, 20, 'Date', {
      font,
      fill,
      stroke,
      lineLength: 40,
    })
    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({
      op: 'text',
      x: 10,
      y: 20,
      text: 'Date',
      font,
      fill,
    })
    expect(items[1]).toMatchObject({ op: 'line', x1: 10, x2: 50 })
    expect((items[1] as { y1: number }).y1).toBeCloseTo(21.26)
  })

  test('lets the underline start after the label', () => {
    const items = labelledField(10, 20, 'Date', {
      font,
      fill,
      stroke,
      lineStart: 18,
      lineLength: 21.2,
      lineOffset: 1.3,
    })
    expect(items[1]).toMatchObject({ x1: 28, y1: 21.3 })
    expect((items[1] as { x2: number }).x2).toBeCloseTo(49.2)
  })
})

describe('shared/forms: sectionBox', () => {
  test('is a rectangle with the given stroke, filled only when asked', () => {
    expect(sectionBox(area, stroke)).toEqual({ op: 'rect', box: area, stroke })
    expect(sectionBox(area, stroke, fill)).toEqual({
      op: 'rect',
      box: area,
      stroke,
      fill,
    })
  })
})

describe('shared/forms: rulesWithin', () => {
  test('steps rules from the first offset and never on the bottom edge', () => {
    const b = { x: 5, y: 7, w: 50, h: 20 }
    const items = rulesWithin(b, 8, 7.9, stroke)
    expect(items).toHaveLength(2)
    expect(items[0]?.y1).toBeCloseTo(14.9)
    expect(items[1]?.y1).toBeCloseTo(22.9)
    expect(items.every((item) => item.x1 === 5 && item.x2 === 55)).toBe(true)
  })

  test('returns nothing when the pitch is not positive', () => {
    expect(rulesWithin(area, 0, 2, stroke)).toEqual([])
  })
})

describe('shared/forms: tableGrid', () => {
  test('draws rows+1 horizontal and cols+1 vertical lines', () => {
    const items = tableGrid(area, 4, 3, stroke)
    const horizontals = items.filter((item) => item.y1 === item.y2)
    const verticals = items.filter((item) => item.x1 === item.x2)
    expect(horizontals.map((item) => item.y1)).toEqual([0, 10, 20, 30, 40])
    expect(verticals.map((item) => item.x1)).toEqual([0, 20, 40, 60])
  })

  test('returns nothing when a dimension has no cells', () => {
    expect(tableGrid(area, 0, 3, stroke)).toEqual([])
    expect(tableGrid(area, 2, 0, stroke)).toEqual([])
  })
})
