/**
 * 验证 urlState 模块的行为（处理旧分享链接里的设置片段）。
 * Tests the urlState module, which handles settings fragments from shared links.
 */
import { describe, expect, test } from 'vitest'
import { createSettings, encodeSettingsHash } from '../../core/settings'
import {
  SETTINGS_HASH_PREFIX,
  formatSettingsHash,
  parseSettingsHash,
} from './urlState'

describe('formatSettingsHash / parseSettingsHash', () => {
  test('round-trips a settings object', () => {
    const settings = createSettings('lined', 'exam-two-column')
    expect(parseSettingsHash(formatSettingsHash(settings))).toEqual(settings)
  })

  test('prefixes the fragment with #s=', () => {
    expect(formatSettingsHash(createSettings('lined'))).toMatch(/^#s=/)
  })

  test('accepts the fragment without a leading hash', () => {
    const settings = createSettings('lined')
    const formatted = formatSettingsHash(settings)
    expect(parseSettingsHash(formatted.slice(1))).toEqual(settings)
  })

  test('exposes the s= prefix', () => {
    expect(SETTINGS_HASH_PREFIX).toBe('s=')
  })

  test.each(['', '#x=1', '!!!', '#s=!!!', '#s=', '#s=e30-A', '#s=AAAAA'])(
    'returns null for an invalid fragment %j',
    (hash) => {
      expect(parseSettingsHash(hash)).toBeNull()
    },
  )

  test('parsed settings are sanitized', () => {
    const settings = createSettings('lined')
    const encoded = encodeSettingsHash({
      ...settings,
      margins: { ...settings.margins, top: 999 },
    })
    expect(parseSettingsHash(`#s=${encoded}`)?.margins.top).toBe(40)
  })
})
