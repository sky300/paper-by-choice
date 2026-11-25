import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  renderPaper,
  shapesOf,
  textsOf,
} from '../testing/paperTestKit'
import sketch from './sketch'

describe('sketch', () => {
  test('renders a non-empty scene of finite numbers inside the area', () => {
    const { shapes, ctx } = renderPaper('sketch')
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('has matching zh/en message keys and a default in range', () => {
    expect(Object.keys(sketch.messages.en).sort()).toEqual(
      Object.keys(sketch.messages['zh-CN']).sort(),
    )
    expect(sketch.spacing.default).toBeGreaterThanOrEqual(sketch.spacing.min)
    expect(sketch.spacing.default).toBeLessThanOrEqual(sketch.spacing.max)
  })

  test('lays out a dot grid with a frame and a 100 mm scale', () => {
    const { shapes } = renderPaper('sketch')
    const dots = shapesOf(shapes, 'ellipse')
    const rects = shapesOf(shapes, 'rect')
    expect(dots.length).toBeGreaterThan(50)
    expect(rects.length).toBe(1)
    const labels = textsOf(shapes)
    expect(labels).toContain('0mm')
    expect(labels).toContain('50mm')
    expect(labels).toContain('100mm')
  })

  test('larger spacing yields fewer dots and stays inside', () => {
    const narrow = renderPaper('sketch', { spacing: 5 })
    const wide = renderPaper('sketch', { spacing: 15 })
    expect(shapesOf(narrow.shapes, 'ellipse').length).toBeGreaterThan(
      shapesOf(wide.shapes, 'ellipse').length,
    )
    expect(() => expectInside(wide.shapes, wide.ctx.area)).not.toThrow()
  })

  test('renders on A5 landscape without leaving the writing area', () => {
    const { shapes, ctx } = renderPaper('sketch', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })
})
