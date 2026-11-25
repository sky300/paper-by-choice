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

  test('draws a centred 34 × 51 lattice of 0.3 mm dots at 5 mm on A4', () => {
    const { shapes, ctx } = renderPaper('dot')
    const dots = shapesOf(shapes, 'ellipse')
    expect(dots).toHaveLength(shapes.length)
    expect(dots).toHaveLength(34 * 51)
    expect(dots[0].rx).toBeCloseTo(0.3)
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
