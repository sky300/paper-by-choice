/**
 * 读写浏览器中的持久化设置。
 * Reads and writes persisted browser settings.
 */
/**
 * Local persistence of the settings object.
 *
 * Reads are validated with `sanitizeSettings`, so old or hand-edited data can
 * never reach the rest of the app. Storage is optional and every failure is
 * swallowed: private browsing and quota limits must not break the UI.
 */
import { STORAGE_KEYS, sanitizeSettings } from '../../core/settings'
import type { Settings } from '../../core/types'

/** Reads `window.localStorage` from inside the function so a missing DOM is harmless. */
function defaultStorage(): Pick<Storage, 'getItem' | 'setItem'> | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** Reads and validates the local archive; returns `null` when it is missing, broken or unreadable. */
export function loadStoredSettings(
  storage?: Pick<Storage, 'getItem'>,
): Settings | null {
  const target = storage ?? defaultStorage()
  if (!target) return null
  let text: string | null
  try {
    text = target.getItem(STORAGE_KEYS.settings)
  } catch {
    return null
  }
  if (text === null) return null
  try {
    const parsed: unknown = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
      return null
    return sanitizeSettings(parsed)
  } catch {
    return null
  }
}

/** Writes the local archive; failures of an unavailable storage are silently ignored. */
export function storeSettings(
  settings: Settings,
  storage?: Pick<Storage, 'setItem'>,
): void {
  const target = storage ?? defaultStorage()
  if (!target) return
  try {
    target.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
  } catch {
    // Storage can be disabled or full; persistence is best-effort only.
  }
}
