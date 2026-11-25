import hardpenCalligraphyPaper from './hardpenCalligraphyPaper'
import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  renderPaper,
  shapesOf,
} from '../testing/paperTestKit'

describe('hardpenCalligraphyPaper', () => {
  test('declares the calligraphy paper with the recommended 20 mm cell', () => {
    expect(hardpenCalligraphyPaper.type).toBe('hardpen_calligraphy_paper')
    expect(hardpenCalligraphyPaper.group).toBe('calligraphy')
    expect(hardpenCalligraphyPaper.suggestsCalligraphyFrame).toBe(true)
    expect(hardpenCalligraphyPaper.spacing).toMatchObject({
      min: 15,
      max: 30,
      step: 1,
      default: 20,
    })
  })

  test('keeps messages and the single preset in step', () => {
    expect(Object.keys(hardpenCalligraphyPaper.messages.en).sort()).toEqual(
      Object.keys(hardpenCalligraphyPaper.messages['zh-CN']).sort(),
    )
    expect(hardpenCalligraphyPaper.presets.map((p) => p.id)).toEqual([
      'hardpen_calligraphy_paper',
    ])
  })

  test('draws a frame plus four dashed guides in every cell', () => {
    const { shapes, ctx } = renderPaper('hardpen_calligraphy_paper')
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
    const rects = shapesOf(shapes, 'rect')
    expect(rects).toHaveLength(96)
    expect(rects[0]?.box).toEqual({ x: 25, y: 28.5, w: 20, h: 20 })
    const guides = shapesOf(shapes, 'line').filter(
      (item) => item.stroke.dash !== undefined,
    )
    expect(guides).toHaveLength(96 * 4)
    // The two short verticals are centred vertically: from cy − 0.3g to cy + 0.3g.
    const short = guides.filter(
      (item) => item.x1 === item.x2 && item.y2 - item.y1 !== 20,
    )
    expect(short).toHaveLength(96 * 2)
    expect(short[0]).toMatchObject({ x1: 30, y1: 32.5, x2: 30, y2: 44.5 })
  })

  test('stays inside A5 landscape and changes count with spacing', () => {
    const small = renderPaper('hardpen_calligraphy_paper', { spacing: 15 })
    const large = renderPaper('hardpen_calligraphy_paper', { spacing: 30 })
    expect(shapesOf(small.shapes, 'rect').length).toBeGreaterThan(
      shapesOf(large.shapes, 'rect').length,
    )
    const landscape = renderPaper('hardpen_calligraphy_paper', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(() =>
      expectInside(landscape.shapes, landscape.ctx.area),
    ).not.toThrow()
  })
})
