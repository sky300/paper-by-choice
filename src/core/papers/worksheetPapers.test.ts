import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  renderPaper,
  shapesOf,
  textsOf,
} from '../testing/paperTestKit'
import { box } from '../scene/builders'

const worksheetTypes = [
  'vertical_lined',
  'pinyin_paper',
  'pinyin_tianzi',
  'composition_paper',
  'arithmetic_paper',
  'english_paper',
  'practice_paper',
] as const

describe('worksheet papers', () => {
  for (const type of worksheetTypes) {
    test(`${type}: renders inside the page and has finite numbers`, () => {
      const { shapes, ctx } = renderPaper(type)
      expect(shapes.length).toBeGreaterThan(0)
      expectInside(shapes, box(0, 0, ctx.page.width, ctx.page.height))
      expectFiniteNumbers(shapes)
    })

    test(`${type}: A5 landscape renders inside the page`, () => {
      const { shapes, ctx } = renderPaper(type, {
        paperSize: 'a5',
        orientation: 'landscape',
      })
      expectInside(shapes, box(0, 0, ctx.page.width, ctx.page.height))
      expectFiniteNumbers(shapes)
    })
  }

  test('vertical_lined draws vertical lines whose count changes with spacing', () => {
    const fine = shapesOf(
      renderPaper('vertical_lined', { spacing: 4 }).scene,
      'line',
    ).length
    const coarse = shapesOf(
      renderPaper('vertical_lined', { spacing: 20 }).scene,
      'line',
    ).length
    expect(fine).toBeGreaterThan(coarse)
  })

  test('english_paper draws four-line groups and a header', () => {
    const { shapes } = renderPaper('english_paper')
    expect(shapesOf(shapes, 'line').length).toBeGreaterThan(12)
    expect(textsOf(shapes).length).toBeGreaterThan(0)
  })

  test('english_paper showHeader=false removes the header labels', () => {
    const withHeader = textsOf(renderPaper('english_paper').scene).length
    const without = textsOf(
      renderPaper('english_paper', {
        options: { englishPaper: { showHeader: false } },
      }).scene,
    ).length
    expect(without).toBeLessThan(withHeader)
  })

  test('composition_paper and arithmetic_paper show name/date labels', () => {
    for (const type of ['composition_paper', 'arithmetic_paper'] as const) {
      expect(textsOf(renderPaper(type).scene).length).toBeGreaterThan(0)
    }
  })

  test('pinyin_tianzi rows change with spacing', () => {
    const fine = shapesOf(
      renderPaper('pinyin_tianzi', { spacing: 15 }).scene,
      'line',
    ).length
    const coarse = shapesOf(
      renderPaper('pinyin_tianzi', { spacing: 30 }).scene,
      'line',
    ).length
    expect(fine).toBeGreaterThan(coarse)
  })
})
