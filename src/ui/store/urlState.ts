/**
 * 处理旧分享链接里的设置片段。
 * Handles settings fragments from shared links.
 */
/**
 * Share-link state: the settings object encoded into the URL fragment.
 *
 * Encoding and validation live in `core/settings`; this module only handles
 * the `#s=` prefix and guarantees that a malformed fragment never throws.
 */
import { decodeSettingsHash, encodeSettingsHash } from '../../core/settings'
import type { Settings } from '../../core/types'

/** Prefix that marks a settings fragment in the address bar. */
export const SETTINGS_HASH_PREFIX = 's='

/** Parses `#s=…` or `s=…` into validated settings; returns `null` on any failure. */
export function parseSettingsHash(hash: string): Settings | null {
  const text = hash.startsWith('#') ? hash.slice(1) : hash
  if (!text.startsWith(SETTINGS_HASH_PREFIX)) return null
  const payload = text.slice(SETTINGS_HASH_PREFIX.length)
  if (payload === '') return null
  return decodeSettingsHash(payload)
}

/** Formats settings as an address-bar fragment of the form `#s=…`. */
export function formatSettingsHash(settings: Settings): string {
  return `#${SETTINGS_HASH_PREFIX}${encodeSettingsHash(settings)}`
}
