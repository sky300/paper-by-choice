/**
 * 验证 paperSizes 模块。对应实现管理纸张规格、方向和打印单位。
 * Tests paperSizes, whose implementation handles paper sizes, orientations, and print units.
 */
import type { PaperSize, PaperSizeKey } from './types'
import { expect, test } from 'vitest'
import {
  CUSTOM_SIZE_LIMITS,
  PAPER_SIZES,
  getPaperSize,
  pageSizeMm,
} from './paperSizes'

test('PAPER_SIZES lists the nine built-in sizes in menu order, portrait, in mm', () => {
  expect(PAPER_SIZES).toEqual([
    { key: 'a4', width: 210, height: 297 },
    { key: 'a5', width: 148, height: 210 },
    { key: 'a3', width: 297, height: 420 },
    { key: 'b4', width: 250, height: 353 },
    { key: 'b5', width: 176, height: 250 },
    { key: 'letter', width: 215.9, height: 279.4 },
    { key: 'legal', width: 215.9, height: 355.6 },
    { key: 'tabloid', width: 279.4, height: 431.8 },
    { key: 'executive', width: 184.15, height: 266.7 },
  ])
})

test('CUSTOM_SIZE_LIMITS spans 50–1000 mm', () => {
  expect(CUSTOM_SIZE_LIMITS).toEqual({ min: 50, max: 1000 })
})

const LOOKUPS: readonly [PaperSizeKey, PaperSize][] = [
  ['a4', { key: 'a4', width: 210, height: 297 }],
  ['letter', { key: 'letter', width: 215.9, height: 279.4 }],
  ['executive', { key: 'executive', width: 184.15, height: 266.7 }],
]

test.each(LOOKUPS)(
  'getPaperSize(%j) returns the table entry',
  (key, expected) => {
    expect(getPaperSize(key)).toEqual(expected)
  },
)

test("getPaperSize('custom') returns A4 dimensions as the placeholder", () => {
  expect(getPaperSize('custom')).toEqual({
    key: 'custom',
    width: 210,
    height: 297,
  })
})

test('pageSizeMm keeps portrait dimensions', () => {
  expect(pageSizeMm('a4', 'portrait')).toEqual({ width: 210, height: 297 })
})

test('pageSizeMm swaps width and height for landscape', () => {
  expect(pageSizeMm('a4', 'landscape')).toEqual({ width: 297, height: 210 })
})

test('pageSizeMm uses the custom width and height as given', () => {
  expect(pageSizeMm('custom', 'portrait', { width: 100, height: 50 })).toEqual({
    width: 100,
    height: 50,
  })
})

test('pageSizeMm does not swap custom dimensions in landscape', () => {
  expect(pageSizeMm('custom', 'landscape', { width: 100, height: 50 })).toEqual(
    {
      width: 100,
      height: 50,
    },
  )
})

test('pageSizeMm falls back to A4 when custom dimensions are missing', () => {
  expect(pageSizeMm('custom', 'landscape')).toEqual({ width: 210, height: 297 })
})
