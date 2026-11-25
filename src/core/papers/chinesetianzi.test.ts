import chinesetianzi from './chinesetianzi'
import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  horizontalPositions,
  renderPaper,
  shapesOf,
  verticalPositions,
} from '../testing/paperTestKit'

describe('chinesetianzi', () => {
  test('declares the calligraphy paper with the recommended 18 mm cell', () => {
    expect(chinesetianzi.type).toBe('chinesetianzi')
    expect(chinesetianzi.group).toBe('calligraphy')
    expect(chinesetianzi.suggestsCalligraphyFrame).toBe(true)
    expect(chinesetianzi.spacing).toMatchObject({
      min: 12,
      max: 30,
      step: 1,
      default: 18,
    })
  })

  test('adopts the calligraphy guide fields and keeps messages in step', () => {
    const keys = chinesetianzi.fields.map((field) => field.key)
    expect(keys).toContain('calligraphy.showGuides')
    expect(keys).toContain('calligraphy.guideColor')
    expect(Object.keys(chinesetianzi.messages.en).sort()).toEqual(
      Object.keys(chinesetianzi.messages['zh-CN']).sort(),
    )
    expect(chinesetianzi.presets[0]?.id).toBe('chinesetianzi')
  })

  test('renders a centred 9 × 14 lattice with crosses in a chosen guide colour', () => {
    const { shapes, ctx } = renderPaper('chinesetianzi', {
      options: { calligraphy: { guideColor: '#a05a3c' } },
    })
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
    // 10 grid lines + 9 cell midlines = 19 vertical lines.
    expect(verticalPositions(shapes)).toHaveLength(19)
    // 15 grid lines + 14 cell midlines = 29 horizontal lines.
    expect(horizontalPositions(shapes)).toHaveLength(29)
    expect(shapesOf(shapes, 'rect')).toHaveLength(1)
    expect(shapesOf(shapes, 'rect')[0]?.box).toEqual({
      x: 24,
      y: 22.5,
      w: 162,
      h: 252,
    })
    const guides = shapesOf(shapes, 'line').filter(
      (item) => item.stroke.color === '#a05a3c',
    )
    expect(guides.length).toBeGreaterThan(0)
    expect(guides.every((item) => item.stroke.dash === undefined)).toBe(true)
  })

  test('changes the cell count with the spacing and stays inside A5 landscape', () => {
    const small = renderPaper('chinesetianzi', { spacing: 12 })
    const large = renderPaper('chinesetianzi', { spacing: 30 })
    expect(verticalPositions(small.shapes).length).toBeGreaterThan(
      verticalPositions(large.shapes).length,
    )
    const landscape = renderPaper('chinesetianzi', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(() =>
      expectInside(landscape.shapes, landscape.ctx.area),
    ).not.toThrow()
  })
})
