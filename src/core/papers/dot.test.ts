/**
 * 验证 dot 模块的 dot 行为。
 * Tests dot behavior covering dot.
 */
import dot from './dot'
import { COLUMNS_DEFAULTS, COLUMNS_FIELDS } from './shared/columns'
import { describe, expect, test } from 'vitest'
import { expectInside, renderPaper, shapesOf } from '../testing/paperTestKit'

describe('dot', () => {
  test('declares its type, spacing and column schema', () => {
    expect(dot.type).toBe('dot')
    expect(dot.group).toBe('basic')
    expect(dot.spacing).toMatchObject({
      min: 3,
      max: 15,
      step: 0.5,
      default: 5,
    })
    expect(dot.fields).toBe(COLUMNS_FIELDS)
    expect(dot.defaultOptions).toEqual(COLUMNS_DEFAULTS)
  })

  test('keeps zh-CN and en message keys identical', () => {
    expect(Object.keys(dot.messages.en).sort()).toEqual(
      Object.keys(dot.messages['zh-CN']).sort(),
    )
    expect(dot.presets[0].id).toBe('dot-paper')
  })

  test('draws a 34 × 52 lattice starting at the top-left margin at 5 mm on A4', () => {
    const { shapes, ctx } = renderPaper('dot')
    const dots = shapesOf(shapes, 'ellipse')
    expect(dots).toHaveLength(shapes.length)
    expect(dots).toHaveLength(34 * 52)
    expect(dots[0]).toMatchObject({ cx: 20, cy: 20 })
    expect(dots[0].rx).toBeCloseTo((0.5 * 25.4) / 96)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('changes the dot count with min and max spacing', () => {
    const narrow = renderPaper('dot', { spacing: 3 })
    const wide = renderPaper('dot', { spacing: 15 })
    expect(shapesOf(narrow.shapes, 'ellipse').length).toBeGreaterThan(
      shapesOf(wide.shapes, 'ellipse').length,
    )
    expect(() => expectInside(wide.shapes, wide.ctx.area)).not.toThrow()
  })

  test('renders on A5 landscape and translates its spacing label', () => {
    const { shapes, ctx } = renderPaper('dot', {
      paperSize: 'a5',
      orientation: 'landscape',
      locale: 'en',
    })
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
    expect(ctx.t('spacing.label')).toBe('Dot spacing')
  })
})
