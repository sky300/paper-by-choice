/**
 * 验证 settingsStorage 模块的行为（读写浏览器中的持久化设置）。
 * Tests the settingsStorage module, which reads and writes persisted browser settings.
 */
import { describe, expect, test, vi } from 'vitest'
import { STORAGE_KEYS, createSettings } from '../../core/settings'
import { loadStoredSettings, storeSettings } from './settingsStorage'

/** A minimal in-memory Storage stand-in. */
function memory(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => {
      data.delete(key)
    },
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
  } as Storage
}

describe('storeSettings / loadStoredSettings', () => {
  test('round-trips a settings object through the configured key', () => {
    const storage = memory()
    const settings = createSettings('lined', 'exam-two-column')
    storeSettings(settings, storage)
    expect(storage.getItem(STORAGE_KEYS.settings)).toBe(
      JSON.stringify(settings),
    )
    expect(loadStoredSettings(storage)).toEqual(settings)
  })

  test('returns null when there is no stored value', () => {
    expect(loadStoredSettings(memory())).toBeNull()
  })

  test('returns null for corrupted JSON', () => {
    const storage = memory()
    storage.setItem(STORAGE_KEYS.settings, '{ not json')
    expect(loadStoredSettings(storage)).toBeNull()
  })

  test('returns null when getItem throws', () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error('blocked')
      }),
    }
    expect(loadStoredSettings(storage)).toBeNull()
  })

  test('loadStoredSettings sanitizes out-of-range values', () => {
    const storage = memory()
    const settings = createSettings('lined')
    storage.setItem(
      STORAGE_KEYS.settings,
      JSON.stringify({
        ...settings,
        margins: { ...settings.margins, top: 999 },
      }),
    )
    expect(loadStoredSettings(storage)?.margins.top).toBe(40)
  })

  test('storeSettings silently swallows a throwing setItem', () => {
    const storage = {
      setItem: vi.fn(() => {
        throw new Error('quota exceeded')
      }),
    }
    expect(() => storeSettings(createSettings('lined'), storage)).not.toThrow()
  })
})
