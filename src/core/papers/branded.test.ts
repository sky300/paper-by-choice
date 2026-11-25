import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  renderPaper,
  shapesOf,
  textsOf,
} from '../testing/paperTestKit'
import branded from './branded'

describe('branded', () => {
  test('renders a non-empty scene of finite numbers inside the area', () => {
    const { shapes, ctx } = renderPaper('branded')
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('has matching zh/en message keys and a default in range', () => {
    expect(Object.keys(branded.messages.en).sort()).toEqual(
      Object.keys(branded.messages['zh-CN']).sort(),
    )
    expect(branded.spacing.default).toBeGreaterThanOrEqual(branded.spacing.min)
    expect(branded.spacing.default).toBeLessThanOrEqual(branded.spacing.max)
  })

  test('exposes a text field for the brand line and defaults it to empty', () => {
    expect(branded.fields.map((f) => f.key)).toContain('brandText')
    expect(branded.defaultOptions).toEqual({ brandText: '' })
    expect(textsOf(renderPaper('branded').shapes)).toEqual([])
  })

  test('draws the user-provided brand text in the footer', () => {
    const { shapes, ctx } = renderPaper('branded', {
      options: { brandText: 'ACME' },
    })
    expect(textsOf(shapes)).toContain('ACME')
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('spacing changes the rules and A5 landscape stays inside', () => {
    const narrow = renderPaper('branded', { spacing: 6 })
    const wide = renderPaper('branded', { spacing: 15 })
    expect(shapesOf(narrow.shapes, 'line').length).toBeGreaterThan(
      shapesOf(wide.shapes, 'line').length,
    )
    const a5 = renderPaper('branded', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(() => expectInside(a5.shapes, a5.ctx.area)).not.toThrow()
  })
})
