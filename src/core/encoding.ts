/**
 * Platform-independent base64url and UTF-8 codecs for share links.
 *
 * Implemented with pure JavaScript and Web-standard `TextEncoder` /
 * `TextDecoder` so the browser and Node produce byte-for-byte identical
 * output; the URL-safe alphabet keeps hashes free of `+`, `/` and `=`.
 */

const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

/** Encodes bytes as unpadded base64url, safe to place in a URL fragment. */
export function bytesToBase64Url(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0
    const n = (b0 << 16) | (b1 << 8) | b2
    out += ALPHABET[(n >> 18) & 63]
    out += ALPHABET[(n >> 12) & 63]
    if (i + 1 < bytes.length) out += ALPHABET[(n >> 6) & 63]
    if (i + 2 < bytes.length) out += ALPHABET[n & 63]
  }
  return out
}

/** Decodes unpadded base64url, throwing on any character outside the alphabet or an impossible length. */
export function base64UrlToBytes(text: string): Uint8Array {
  if (text.length % 4 === 1) throw new Error('Invalid base64url length')
  const out: number[] = []
  let buffer = 0
  let bits = 0
  for (const char of text) {
    const value = ALPHABET.indexOf(char)
    if (value === -1) throw new Error(`Invalid base64url character: ${char}`)
    buffer = (buffer << 6) | value
    bits += 6
    if (bits >= 8) {
      bits -= 8
      out.push((buffer >> bits) & 0xff)
      buffer &= (1 << bits) - 1
    }
  }
  return new Uint8Array(out)
}

/** Encodes a string as UTF-8 bytes. */
export function utf8Encode(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

/** Decodes UTF-8 bytes into a string. */
export function utf8Decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes)
}
