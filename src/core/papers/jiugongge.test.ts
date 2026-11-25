import jiugongge from './jiugongge'
import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  horizontalPositions,
  renderPaper,
  shapesOf,
  verticalPositions,
} from '../testing/paperTestKit'

describe('jiugongge', () => {
  test('declares the calligraphy paper with the recommended 20 mm base cell', () => {
    expect(jiugongge.type).toBe('jiugongge')
    expect(jiugongge.group).toBe('calligraphy')
    expect(jiugongge.suggestsCalligraphyFrame).toBe(true)
    expect(jiugongge.spacing).toMatchObject({
      min: 15,
      max: 35,
      step: 1,
      default: 20,
    })
  })

  test('keeps its messages and preset ids in step', () => {
    expect(Object.keys(jiugongge.messages.en).sort()).toEqual(
      Object.keys(jiugongge.messages['zh-CN']).sort(),
    )
    expect(jiugongge.presets[0]?.id).toBe('jiugongge')
  })

  test('renders a centred 2 × 4 lattice of 60 mm blocks, split into thirds', () => {
    const { shapes, ctx } = renderPaper('jiugongge')
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
    // 2 block columns, each with 2 inner verticals (at 20 and 40 mm), plus 3 block edges = 7.
    expect(verticalPositions(shapes)).toHaveLength(7)
    // 4 block rows, each with 2 inner horizontals, plus 5 block edges = 13.
    expect(horizontalPositions(shapes)).toHaveLength(13)
    expect(shapesOf(shapes, 'rect')).toHaveLength(1)
    expect(shapesOf(shapes, 'rect')[0]?.box).toEqual({
      x: 45,
      y: 28.5,
      w: 120,
      h: 240,
    })
  })

  test('changes the block count with the spacing and stays inside A5 landscape', () => {
    const small = renderPaper('jiugongge', { spacing: 15 })
    const large = renderPaper('jiugongge', { spacing: 35 })
    expect(verticalPositions(small.shapes).length).toBeGreaterThan(
      verticalPositions(large.shapes).length,
    )
    const landscape = renderPaper('jiugongge', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(() =>
      expectInside(landscape.shapes, landscape.ctx.area),
    ).not.toThrow()
  })
})
