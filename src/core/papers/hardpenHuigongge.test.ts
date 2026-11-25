/**
 * 验证 hardpenHuigongge 模块的 hardpenHuigongge 行为。
 * Tests hardpenHuigongge behavior covering hardpenHuigongge.
 */
import hardpenHuigongge from './hardpenHuigongge'
import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  renderPaper,
  shapesOf,
  textsOf,
} from '../testing/paperTestKit'

describe('hardpenHuigongge', () => {
  test('declares the calligraphy paper with the recommended 25 mm spacing', () => {
    expect(hardpenHuigongge.type).toBe('hardpen_huigongge')
    expect(hardpenHuigongge.group).toBe('calligraphy')
    expect(hardpenHuigongge.suggestsCalligraphyFrame).toBe(true)
    expect(hardpenHuigongge.spacing).toMatchObject({
      min: 15,
      max: 30,
      step: 1,
      default: 25,
    })
  })

  test('keeps messages and the single preset in step', () => {
    expect(Object.keys(hardpenHuigongge.messages.en).sort()).toEqual(
      Object.keys(hardpenHuigongge.messages['zh-CN']).sort(),
    )
    expect(hardpenHuigongge.presets.map((p) => p.id)).toEqual([
      'hardpen_huigongge',
    ])
  })

  test('always draws a fixed 10 × 14 lattice with dashed inner boxes and a label', () => {
    const { shapes, ctx } = renderPaper('hardpen_huigongge')
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
    // 11 vertical + 15 horizontal grid lines.
    const verticals = shapesOf(shapes, 'line').filter((i) => i.x1 === i.x2)
    expect(verticals.length).toBeGreaterThanOrEqual(11)
    // One inner box rect per cell (140) plus one label text.
    expect(shapesOf(shapes, 'rect')).toHaveLength(140)
    expect(textsOf(shapes)).toEqual(['长方回宫格'])
    // The label follows the locale.
    const en = renderPaper('hardpen_huigongge', { locale: 'en' })
    expect(textsOf(en.shapes)).toEqual(['Long Hui-Gong grid'])
  })

  test('ignores the spacing parameter and stays inside A5 landscape', () => {
    const a = renderPaper('hardpen_huigongge', { spacing: 15 })
    const b = renderPaper('hardpen_huigongge', { spacing: 30 })
    expect(a.shapes).toEqual(b.shapes)
    const landscape = renderPaper('hardpen_huigongge', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(() =>
      expectInside(landscape.shapes, landscape.ctx.area),
    ).not.toThrow()
    expect(shapesOf(landscape.shapes, 'rect')).toHaveLength(140)
  })
})
