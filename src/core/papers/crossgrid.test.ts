import crossgrid from './crossgrid'
import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  horizontalPositions,
  renderPaper,
  shapesOf,
  verticalPositions,
} from '../testing/paperTestKit'

describe('crossgrid', () => {
  test('declares the calligraphy paper with the recommended 15 mm pitch', () => {
    expect(crossgrid.type).toBe('crossgrid')
    expect(crossgrid.group).toBe('calligraphy')
    expect(crossgrid.suggestsCalligraphyFrame).toBe(true)
    expect(crossgrid.spacing).toMatchObject({
      min: 8,
      max: 25,
      step: 1,
      default: 15,
    })
  })

  test('keeps messages and the single preset in step', () => {
    expect(Object.keys(crossgrid.messages.en).sort()).toEqual(
      Object.keys(crossgrid.messages['zh-CN']).sort(),
    )
    expect(crossgrid.presets.map((p) => p.id)).toEqual(['crossgrid'])
  })

  test('draws a centred grid with crosses at the intersections', () => {
    const { shapes, ctx } = renderPaper('crossgrid')
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
    // 11 cols × 17 rows at 15 mm; grid lines 12 vertical + 18 horizontal.
    expect(verticalPositions(shapes)).toHaveLength(12)
    expect(horizontalPositions(shapes)).toHaveLength(18)
    const rects = shapesOf(shapes, 'rect')
    expect(rects).toHaveLength(1)
    expect(rects[0]?.box).toEqual({ x: 22.5, y: 21, w: 165, h: 255 })
  })

  test('stays inside A5 landscape and changes count with spacing', () => {
    const small = renderPaper('crossgrid', { spacing: 8 })
    const large = renderPaper('crossgrid', { spacing: 25 })
    expect(verticalPositions(small.shapes).length).toBeGreaterThan(
      verticalPositions(large.shapes).length,
    )
    const landscape = renderPaper('crossgrid', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(() =>
      expectInside(landscape.shapes, landscape.ctx.area),
    ).not.toThrow()
  })
})
