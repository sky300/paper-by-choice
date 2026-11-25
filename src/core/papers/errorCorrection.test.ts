import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  renderPaper,
  shapesOf,
  textsOf,
} from '../testing/paperTestKit'
import errorCorrection from './errorCorrection'

describe('errorCorrection', () => {
  test('renders a non-empty scene of finite numbers inside the area', () => {
    const { shapes, ctx } = renderPaper('error_correction')
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('has matching zh/en message keys and a default in range', () => {
    expect(Object.keys(errorCorrection.messages.en).sort()).toEqual(
      Object.keys(errorCorrection.messages['zh-CN']).sort(),
    )
    expect(errorCorrection.spacing.default).toBeGreaterThanOrEqual(
      errorCorrection.spacing.min,
    )
    expect(errorCorrection.spacing.default).toBeLessThanOrEqual(
      errorCorrection.spacing.max,
    )
  })

  test('labels the field rows in both halves through i18n', () => {
    const zh = textsOf(renderPaper('error_correction').shapes)
    const en = textsOf(renderPaper('error_correction', { locale: 'en' }).shapes)
    expect(zh.length).toBeGreaterThan(0)
    expect(zh.length).toBe(en.length)
    expect(zh.some((v) => /[\u4e00-\u9fff]/.test(v))).toBe(true)
    expect(en.some((v) => /Source|Reason|Analysis/.test(v))).toBe(true)
    expect(zh.join()).not.toBe(en.join())
  })

  test('draws two halves with a divider and two column rules', () => {
    const { shapes } = renderPaper('error_correction')
    const lines = shapesOf(shapes, 'line')
    expect(lines.filter((l) => l.x1 === l.x2).length).toBeGreaterThanOrEqual(2)
    expect(shapesOf(shapes, 'ellipse').length).toBe(20)
  })

  test('min/max spacing does not break geometry and A5 landscape stays inside', () => {
    const lo = renderPaper('error_correction', { spacing: 8 })
    const hi = renderPaper('error_correction', { spacing: 15 })
    expect(() => expectInside(lo.shapes, lo.ctx.area)).not.toThrow()
    expect(() => expectInside(hi.shapes, hi.ctx.area)).not.toThrow()
    const a5 = renderPaper('error_correction', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(() => expectInside(a5.shapes, a5.ctx.area)).not.toThrow()
  })
})
