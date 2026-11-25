/**
 * 管理纸张规格、方向和打印单位。
 * Handles paper sizes, orientations, and print units.
 */
/**
 * Built-in paper sizes. Pure data and lookups; sanitising of the custom size
 * lives in `settings.ts`.
 */
import type { Orientation, PaperSize, PaperSizeKey } from './types'

/** Menu order for the size picker. Dimensions are portrait, in millimetres; `custom` is not listed. */
export const PAPER_SIZES: readonly PaperSize[] = [
  { key: 'a4', width: 210, height: 297 },
  { key: 'a5', width: 148, height: 210 },
  { key: 'a3', width: 297, height: 420 },
  { key: 'b4', width: 250, height: 353 },
  { key: 'b5', width: 176, height: 250 },
  { key: 'letter', width: 215.9, height: 279.4 },
  { key: 'legal', width: 215.9, height: 355.6 },
  { key: 'tabloid', width: 279.4, height: 431.8 },
  { key: 'executive', width: 184.15, height: 266.7 },
]

/** Allowed width and height of a custom size, in millimetres. */
export const CUSTOM_SIZE_LIMITS = { min: 50, max: 1000 } as const

/** Placeholder dimensions returned for `custom`, whose real size lives in `Settings.customSize`. */
const CUSTOM_PLACEHOLDER: PaperSize = { key: 'custom', width: 210, height: 297 }

/** Returns the portrait size of a key; `custom` yields a placeholder and `pageSizeMm` must be given the real one. */
export function getPaperSize(key: PaperSizeKey): PaperSize {
  if (key === 'custom') return { ...CUSTOM_PLACEHOLDER }
  const size = PAPER_SIZES.find((entry) => entry.key === key)
  if (!size) throw new Error(`Unknown paper size: ${key}`)
  return size
}

/**
 * Page size in millimetres after applying the orientation. A custom size is
 * taken as given and never swapped: the user enters the final width and height.
 */
export function pageSizeMm(
  key: PaperSizeKey,
  orientation: Orientation,
  custom?: { width: number; height: number },
): { width: number; height: number } {
  const size =
    key === 'custom' ? (custom ?? CUSTOM_PLACEHOLDER) : getPaperSize(key)
  const { width, height } = size
  if (key !== 'custom' && orientation === 'landscape')
    return { width: height, height: width }
  return { width, height }
}
