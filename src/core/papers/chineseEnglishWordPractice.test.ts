import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  renderPaper,
  textsOf,
} from '../testing/paperTestKit'
import chineseEnglishWordPractice from './chineseEnglishWordPractice'

describe('chineseEnglishWordPractice', () => {
  test('renders a non-empty scene of finite numbers inside the area', () => {
    const { shapes, ctx } = renderPaper('chinese_english_word_practice')
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('has matching zh/en message keys and a default in range', () => {
    expect(Object.keys(chineseEnglishWordPractice.messages.en).sort()).toEqual(
      Object.keys(chineseEnglishWordPractice.messages['zh-CN']).sort(),
    )
    expect(chineseEnglishWordPractice.spacing.default).toBeGreaterThanOrEqual(
      chineseEnglishWordPractice.spacing.min,
    )
    expect(chineseEnglishWordPractice.spacing.default).toBeLessThanOrEqual(
      chineseEnglishWordPractice.spacing.max,
    )
  })

  test('declares the wordsPerPage and wordsPerColumn fields with defaults', () => {
    const keys = chineseEnglishWordPractice.fields.map((f) => f.key)
    expect(keys).toEqual(['wordsPerPage', 'wordsPerColumn'])
    expect(chineseEnglishWordPractice.defaultOptions).toEqual({
      wordsPerPage: 16,
      wordsPerColumn: 8,
    })
  })

  test('puts all paper text through i18n', () => {
    const zh = textsOf(renderPaper('chinese_english_word_practice').shapes)
    const en = textsOf(
      renderPaper('chinese_english_word_practice', { locale: 'en' }).shapes,
    )
    expect(zh.length).toBe(en.length)
    expect(zh.some((v) => /[\u4e00-\u9fff]/.test(v))).toBe(true)
    expect(en.some((v) => /Class|Name|Date/.test(v))).toBe(true)
    expect(zh.join()).not.toBe(en.join())
  })

  test('wordsPerColumn changes the number of row numbers and clamps out-of-range', () => {
    const few = renderPaper('chinese_english_word_practice', {
      options: { wordsPerColumn: 4 },
    })
    const many = renderPaper('chinese_english_word_practice', {
      options: { wordsPerColumn: 12 },
    })
    const nums = (s: typeof few.shapes) =>
      textsOf(s).filter((v) => /^\d+\.$/.test(v)).length
    expect(nums(many.shapes)).toBeGreaterThan(nums(few.shapes))
    const clamped = renderPaper('chinese_english_word_practice', {
      options: { wordsPerColumn: 999 },
    })
    expect(clamped.ctx.options.wordsPerColumn).toBeLessThanOrEqual(32)
    expect(() => expectInside(clamped.shapes, clamped.ctx.area)).not.toThrow()
  })

  test('renders on A5 landscape without leaving the writing area', () => {
    const { shapes, ctx } = renderPaper('chinese_english_word_practice', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })
})
