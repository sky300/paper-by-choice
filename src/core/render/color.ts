/**
 * Colour helpers.
 *
 * Scenes only carry `#rrggbb` colours, so parsing is strict and everything
 * else is rejected. Renderers that need numeric channels (PDF) go through
 * `parseHexColor`; renderers that need a string (SVG, Canvas) use the scene
 * colour as is.
 */

/** A colour as three 8-bit channels. */
export interface Rgb {
  r: number
  g: number
  b: number
}

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

/**
 * Parses `#rgb` or `#rrggbb` (case-insensitive, surrounding whitespace
 * allowed). Returns `null` for anything else, so callers can fall back
 * instead of throwing on a malformed colour.
 */
export function parseHexColor(color: string): Rgb | null {
  const match = HEX_COLOR.exec(color.trim())
  if (!match) return null
  const digits = match[1]
  const full =
    digits.length === 3 ? [...digits].map((d) => d + d).join('') : digits
  const value = parseInt(full, 16)
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 }
}

/** Formats an `Rgb` as a lower-case `#rrggbb` string. */
export function rgbToHex(rgb: Rgb): string {
  const channel = (value: number) =>
    Math.round(Math.min(255, Math.max(0, value)))
      .toString(16)
      .padStart(2, '0')
  return `#${channel(rgb.r)}${channel(rgb.g)}${channel(rgb.b)}`
}
