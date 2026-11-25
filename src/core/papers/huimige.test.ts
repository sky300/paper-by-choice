/**
 * 验证 huimige 模块的 huimige 行为。
 * Tests huimige behavior covering huimige.
 */
import huimige from './huimige'
import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  renderPaper,
  shapesOf,
} from '../testing/paperTestKit'

describe('huimige', () => {
  test('declares the calligraphy paper with the recommended 20 mm cell', () => {
    expect(huimige.type).toBe('huimige')
    expect(huimige.group).toBe('calligraphy')
    expect(huimige.suggestsCalligraphyFrame).toBe(true)
    expect(huimige.spacing).toMatchObject({
      min: 15,
      max: 30,
      step: 1,
      default: 20,
    })
  })

  test('keeps messages and the single preset in step', () => {
    expect(Object.keys(huimige.messages.en).sort()).toEqual(
      Object.keys(huimige.messages['zh-CN']).sort(),
    )
    expect(huimige.presets.map((preset) => preset.id)).toEqual(['huimige'])
  })

  test('draws each cell with cross, diagonals, an inner box and a frame', () => {
    const { shapes, ctx } = renderPaper('huimige')
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
    // 8 cols × 12 rows at 20 mm on A4 with 20 mm margins.
    const rects = shapesOf(shapes, 'rect')
    expect(rects).toHaveLength(96 * 2)
    // Inner boxes are 0.45 × 20 = 9 mm, centred in the cell.
    expect(rects[0]?.box).toEqual({ x: 30.5, y: 34, w: 9, h: 9 })
    expect(rects[1]?.box).toEqual({ x: 25, y: 28.5, w: 20, h: 20 })
    const guides = shapesOf(shapes, 'line').filter(
      (item) => item.stroke.dash !== undefined,
    )
    expect(guides.length).toBe(96 * 4)
  })

  test('stays inside A5 landscape and changes count with spacing', () => {
    const small = renderPaper('huimige', { spacing: 15 })
    const large = renderPaper('huimige', { spacing: 30 })
    expect(shapesOf(small.shapes, 'rect').length).toBeGreaterThan(
      shapesOf(large.shapes, 'rect').length,
    )
    const landscape = renderPaper('huimige', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(() =>
      expectInside(landscape.shapes, landscape.ctx.area),
    ).not.toThrow()
  })
})
