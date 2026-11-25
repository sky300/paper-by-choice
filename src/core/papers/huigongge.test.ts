/**
 * 验证 huigongge 模块的 huigongge 行为。
 * Tests huigongge behavior covering huigongge.
 */
import huigongge from './huigongge'
import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  horizontalPositions,
  renderPaper,
  shapesOf,
  verticalPositions,
} from '../testing/paperTestKit'

describe('huigongge', () => {
  test('declares the calligraphy paper with the recommended 22 mm cell', () => {
    expect(huigongge.type).toBe('huigongge')
    expect(huigongge.group).toBe('calligraphy')
    expect(huigongge.suggestsCalligraphyFrame).toBe(true)
    expect(huigongge.spacing).toMatchObject({
      min: 15,
      max: 35,
      step: 1,
      default: 22,
    })
  })

  test('keeps its messages and preset ids in step', () => {
    expect(Object.keys(huigongge.messages.en).sort()).toEqual(
      Object.keys(huigongge.messages['zh-CN']).sort(),
    )
    expect(huigongge.presets[0]?.id).toBe('huigongge')
    expect(huigongge.presets.map((preset) => preset.id)).toEqual(['huigongge'])
  })

  test('renders a centred 7 × 11 lattice with nine-palace guides', () => {
    const { shapes, ctx } = renderPaper('huigongge')
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
    // 8 vertical grid lines + 2 thirds per column × 7 = 22 vertical lines.
    expect(verticalPositions(shapes)).toHaveLength(22)
    // 12 horizontal grid lines + 2 thirds per row × 11 = 34 horizontal lines.
    expect(horizontalPositions(shapes)).toHaveLength(34)
    // One outer frame rect after the lines.
    expect(shapesOf(shapes, 'rect')).toHaveLength(1)
    expect(shapesOf(shapes, 'rect')[0]?.box).toEqual({
      x: 28,
      y: 27.5,
      w: 154,
      h: 242,
    })
  })

  test('changes the cell count with the spacing and stays inside A5 landscape', () => {
    const small = renderPaper('huigongge', { spacing: 15 })
    const large = renderPaper('huigongge', { spacing: 35 })
    expect(verticalPositions(small.shapes).length).toBeGreaterThan(
      verticalPositions(large.shapes).length,
    )
    const landscape = renderPaper('huigongge', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(() =>
      expectInside(landscape.shapes, landscape.ctx.area),
    ).not.toThrow()
  })
})
