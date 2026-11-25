import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  renderPaper,
  shapesOf,
  textsOf,
} from '../testing/paperTestKit'
import chinesePreviewCard from './chinesePreviewCard'

describe('chinesePreviewCard', () => {
  test('renders a non-empty scene of finite numbers inside the area', () => {
    const { shapes, ctx } = renderPaper('chinese_preview_card')
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('has matching zh/en message keys and a default in range', () => {
    expect(Object.keys(chinesePreviewCard.messages.en).sort()).toEqual(
      Object.keys(chinesePreviewCard.messages['zh-CN']).sort(),
    )
    expect(chinesePreviewCard.spacing.default).toBeGreaterThanOrEqual(
      chinesePreviewCard.spacing.min,
    )
    expect(chinesePreviewCard.spacing.default).toBeLessThanOrEqual(
      chinesePreviewCard.spacing.max,
    )
  })

  test('labels the 8 header columns through i18n', () => {
    const zh = textsOf(renderPaper('chinese_preview_card').shapes)
    const en = textsOf(
      renderPaper('chinese_preview_card', { locale: 'en' }).shapes,
    )
    expect(zh).toHaveLength(8)
    expect(en).toHaveLength(8)
    expect(zh.join()).not.toBe(en.join())
    expect(zh.some((v) => /[\u4e00-\u9fff]/.test(v))).toBe(true)
  })

  test('draws an 8-column header and body rows with square guides', () => {
    const { shapes } = renderPaper('chinese_preview_card')
    expect(shapesOf(shapes, 'rect').length).toBeGreaterThan(8)
    expect(shapesOf(shapes, 'line').length).toBeGreaterThan(8)
  })

  test('more room yields more rows and A5 landscape stays inside', () => {
    const a4 = renderPaper('chinese_preview_card')
    const a5 = renderPaper('chinese_preview_card', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(shapesOf(a4.shapes, 'line').length).toBeGreaterThan(
      shapesOf(a5.shapes, 'line').length,
    )
    expect(() => expectInside(a5.shapes, a5.ctx.area)).not.toThrow()
  })
})
