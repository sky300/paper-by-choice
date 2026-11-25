/**
 * 验证 encoding 模块的 base64url、utf8 行为。
 * Tests encoding behavior covering base64url, utf8.
 */
import { describe, expect, test } from 'vitest'
import {
  base64UrlToBytes,
  bytesToBase64Url,
  utf8Decode,
  utf8Encode,
} from './encoding'

describe('base64url', () => {
  test('round-trips bytes that cover the whole 0-255 range', () => {
    const bytes = new Uint8Array([0, 1, 2, 127, 128, 254, 255, 0, 42])
    expect(base64UrlToBytes(bytesToBase64Url(bytes))).toEqual(bytes)
  })

  test('round-trips random byte arrays of every length from 0 to 39', () => {
    for (let length = 0; length < 40; length++) {
      const bytes = new Uint8Array(length)
      for (let i = 0; i < length; i++)
        bytes[i] = Math.floor(Math.random() * 256)
      expect(base64UrlToBytes(bytesToBase64Url(bytes))).toEqual(bytes)
    }
  })

  test('emits only the URL-safe alphabet, never +, / or =', () => {
    const bytes = new Uint8Array([251, 255, 191, 254, 0, 63, 62])
    const text = bytesToBase64Url(bytes)
    expect(text).not.toMatch(/[+/=]/)
    expect(text).toMatch(/^[A-Za-z0-9_-]*$/)
  })

  test('throws on characters outside the base64url alphabet', () => {
    expect(() => base64UrlToBytes('a+b')).toThrow()
    expect(() => base64UrlToBytes('a/b')).toThrow()
    expect(() => base64UrlToBytes('a=b')).toThrow()
    expect(() => base64UrlToBytes('!!!')).toThrow()
  })

  test('throws on an impossible length', () => {
    expect(() => base64UrlToBytes('a')).toThrow()
  })
})

describe('utf8', () => {
  test('round-trips Chinese text and emoji through UTF-8 bytes', () => {
    const text = '纸随心 📄 café 中文 Emoji 🎉'
    const bytes = utf8Encode(text)
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(utf8Decode(bytes)).toBe(text)
  })

  test('decodes a UTF-8 byte sequence containing a 4-byte code point', () => {
    const bytes = new Uint8Array([0xf0, 0x9f, 0x8e, 0x89])
    expect(utf8Decode(bytes)).toBe('🎉')
  })
})
