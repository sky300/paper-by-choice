/**
 * 验证 color 模块的 parseHexColor、rgbToHex 行为。
 * Tests color behavior covering parseHexColor, rgbToHex.
 */
import { describe, expect, test } from 'vitest'
import { parseHexColor, rgbToHex } from './color'

describe('parseHexColor', () => {
  test('parses a six-digit hex colour', () => {
    expect(parseHexColor('#808080')).toEqual({ r: 128, g: 128, b: 128 })
  })

  test('expands a three-digit hex colour', () => {
    expect(parseHexColor('#ABC')).toEqual({ r: 170, g: 187, b: 204 })
  })

  test('ignores case and surrounding whitespace', () => {
    expect(parseHexColor('  #A1B2C3 ')).toEqual({ r: 161, g: 178, b: 195 })
  })

  test('gives null for anything that is not a hex colour', () => {
    expect(parseHexColor('rgb(1,2,3)')).toBeNull()
    expect(parseHexColor('#12345')).toBeNull()
    expect(parseHexColor('#gggggg')).toBeNull()
    expect(parseHexColor('808080')).toBeNull()
    expect(parseHexColor('#1234567')).toBeNull()
    expect(parseHexColor('')).toBeNull()
  })
})

describe('rgbToHex', () => {
  test('formats a lower-case six-digit string', () => {
    expect(rgbToHex({ r: 128, g: 0, b: 15 })).toBe('#80000f')
  })

  test('round-trips through parseHexColor', () => {
    const parsed = parseHexColor('#ABC')
    expect(parsed && rgbToHex(parsed)).toBe('#aabbcc')
    expect(parseHexColor(rgbToHex({ r: 1, g: 254, b: 255 }))).toEqual({
      r: 1,
      g: 254,
      b: 255,
    })
  })
})
