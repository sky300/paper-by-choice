/**
 * 验证 guides 模块的 crossGuides、diagonalGuides、borderOf 行为。
 * Tests guides behavior covering crossGuides, diagonalGuides, borderOf.
 */
import { createInkKit } from '../kit'
import { describe, expect, test } from 'vitest'
import { borderOf, crossGuides, diagonalGuides } from './guides'

const ink = createInkKit({
  color: '#6b7280',
  width: 0.4,
  style: 'solid',
  spacing: 8,
})
/** A box from (20, 30) to (120, 90), midlines at x = 70 and y = 60. */
const B = { x: 20, y: 30, w: 100, h: 60 }

describe('crossGuides', () => {
  test('draws the horizontal midline from the left edge to the right edge', () => {
    expect(crossGuides(B, ink.guide())[0]).toMatchObject({
      op: 'line',
      x1: 20,
      y1: 60,
      x2: 120,
      y2: 60,
    })
  })

  test('draws the vertical midline from the top edge to the bottom edge', () => {
    expect(crossGuides(B, ink.guide())[1]).toMatchObject({
      op: 'line',
      x1: 70,
      y1: 30,
      x2: 70,
      y2: 90,
    })
  })

  test('draws with the stroke it is given', () => {
    const stroke = ink.guide({ dash: [1, 1] })
    expect(crossGuides(B, stroke).map((guide) => guide.stroke)).toEqual([
      stroke,
      stroke,
    ])
  })
})

describe('diagonalGuides', () => {
  test('joins top-left to bottom-right and top-right to bottom-left', () => {
    const [down, up] = diagonalGuides(B, ink.guide())
    expect(down).toMatchObject({ x1: 20, y1: 30, x2: 120, y2: 90 })
    expect(up).toMatchObject({ x1: 120, y1: 30, x2: 20, y2: 90 })
  })
})

describe('borderOf', () => {
  test('outlines the box with the given stroke', () => {
    const stroke = ink.main()
    expect(borderOf(B, stroke)).toStrictEqual({ op: 'rect', box: B, stroke })
  })
})
