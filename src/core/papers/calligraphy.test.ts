/**
 * 验证 calligraphy 模块的 calligraphy 行为。
 * Tests calligraphy behavior covering calligraphy.
 */
import calligraphy from './calligraphy'
import { describe, expect, test } from 'vitest'
import {
  expectInside,
  renderPaper,
  shapesOf,
  textsOf,
} from '../testing/paperTestKit'

describe('calligraphy', () => {
  test('declares its type, spacing, guide options and frame suggestion', () => {
    expect(calligraphy.type).toBe('calligraphy')
    expect(calligraphy.spacing).toMatchObject({
      min: 15,
      max: 40,
      step: 1,
      default: 25,
    })
    expect(calligraphy.fields.map((f) => f.key)).toEqual([
      'calligraphy.showGuides',
      'calligraphy.guideColor',
    ])
    expect(calligraphy.suggestsCalligraphyFrame).toBe(true)
  })

  test('keeps zh-CN and en message keys identical', () => {
    expect(Object.keys(calligraphy.messages.en).sort()).toEqual(
      Object.keys(calligraphy.messages['zh-CN']).sort(),
    )
    expect(calligraphy.presets[0].id).toBe('calligraphy')
  })

  test('draws a top-left aligned lattice of 25 mm squares with guide crosses on A4', () => {
    const { shapes, ctx } = renderPaper('calligraphy')
    expect(shapesOf(shapes, 'rect')).toHaveLength(6 * 10)
    expect(shapes.length).toBeGreaterThan(shapesOf(shapes, 'rect').length)
    expect(textsOf(shapes)).toEqual([])
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('drops the guide lines when showGuides is off', () => {
    const withGuides = renderPaper('calligraphy')
    const without = renderPaper('calligraphy', {
      options: { calligraphy: { showGuides: false } },
    })
    expect(without.shapes.length).toBeLessThan(withGuides.shapes.length)
    expect(shapesOf(without.shapes, 'rect')).toHaveLength(60)
  })

  test('clamps the guide colour and renders on A5 landscape', () => {
    const { shapes, ctx } = renderPaper('calligraphy', {
      paperSize: 'a5',
      orientation: 'landscape',
      options: { calligraphy: { guideColor: 'nope' } },
      locale: 'en',
    })
    expect(
      (ctx.options as { calligraphy: { guideColor: string } }).calligraphy
        .guideColor,
    ).toBe('#8a6f4d')
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })
})
