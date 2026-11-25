/**
 * 验证 themes 模块。对应实现定义纸张排版的配色及字体主题。
 * Tests themes, whose implementation defines paper rendering palettes and typography.
 */
import type { ThemeKey } from './types'
import { expect, test } from 'vitest'
import { THEMES, resolveTheme } from './themes'

/** Declaration order of `ThemeKey` in types.ts, which `THEMES` must follow. */
const KEY_ORDER: readonly ThemeKey[] = [
  'default',
  'night',
  'sepia',
  'vintage',
  'pastel',
  'classic',
  'minimalist',
  'ocean',
  'forest',
  'sunset',
  'tech',
  'elegant',
  'creative',
]

const SANS =
  "system-ui, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif"
const SERIF = "Georgia, 'Times New Roman', 'Songti SC', SimSun, serif"
const MONO = "ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace"

/** primary, secondary, paper, text, lines, accent */
const PALETTES: Record<ThemeKey, string[]> = {
  default: ['#2563eb', '#0ea5e9', '#ffffff', '#1f2937', '#6b7280', '#0f766e'],
  night: ['#818cf8', '#c084fc', '#111827', '#f3f4f6', '#4b5563', '#f472b6'],
  sepia: ['#8a6f4d', '#a08663', '#f4ecdd', '#43301f', '#a3835c', '#b5651d'],
  vintage: ['#7c5cbf', '#6b7280', '#faf3e0', '#4b5563', '#9ca3af', '#c2703d'],
  pastel: ['#7c9cf5', '#9ca3af', '#f3faf4', '#4b5563', '#a3b1c6', '#ec8898'],
  classic: ['#1e40af', '#4b5563', '#f7f7f5', '#111827', '#374151', '#991b1b'],
  minimalist: [
    '#111111',
    '#404040',
    '#ffffff',
    '#262626',
    '#c9c9c9',
    '#737373',
  ],
  ocean: ['#0369a1', '#0ea5e9', '#eff9ff', '#083344', '#a5d8ee', '#075985'],
  forest: ['#2f7d5b', '#5aa37a', '#f4fbf5', '#143d2b', '#9ad3ae', '#3fa66a'],
  sunset: ['#e0663d', '#f0a04b', '#fff7ef', '#5c2a1a', '#f6c9a8', '#d99a2b'],
  tech: ['#4338ca', '#2563eb', '#f2f5ff', '#111c3d', '#7dd3fc', '#7c3aed'],
  elegant: ['#6d4c41', '#a1887f', '#fdf7ef', '#4e342e', '#d7b894', '#8d6e63'],
  creative: ['#f0544f', '#f8c630', '#ffffff', '#373457', '#4d96ff', '#59b35e'],
}

/** headingFont, bodyFont */
const FONTS: Record<ThemeKey, [string, string]> = {
  default: [SANS, SANS],
  night: [SANS, SANS],
  sepia: [SERIF, SERIF],
  vintage: [
    "'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, 'Songti SC', serif",
    SANS,
  ],
  pastel: [SANS, SANS],
  classic: [SERIF, SERIF],
  minimalist: [SANS, SANS],
  ocean: [SERIF, SANS],
  forest: [SERIF, SANS],
  sunset: [SERIF, SANS],
  tech: [MONO, MONO],
  elegant: ["'EB Garamond', Garamond, 'Palatino Linotype', serif", SANS],
  creative: ["'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive", SANS],
}

function theme(key: ThemeKey) {
  const found = THEMES.find((entry) => entry.key === key)
  if (!found) throw new Error(`no theme ${key}`)
  return found
}

test('THEMES has one entry per ThemeKey, in declaration order', () => {
  expect(THEMES.map((entry) => entry.key)).toEqual(KEY_ORDER)
})

test('every theme colour is a lower-case #rrggbb value', () => {
  for (const key of KEY_ORDER) {
    const { primary, secondary, paper, text, lines, accent } = theme(key)
    for (const color of [primary, secondary, paper, text, lines, accent]) {
      expect(color, `${key}`).toMatch(/^#[0-9a-f]{6}$/)
    }
  }
})

test.each(KEY_ORDER)('theme %s uses the specified palette', (key) => {
  const { primary, secondary, paper, text, lines, accent } = theme(key)
  expect([primary, secondary, paper, text, lines, accent]).toEqual(
    PALETTES[key],
  )
})

test.each(KEY_ORDER)('theme %s uses the specified fonts', (key) => {
  const { headingFont, bodyFont } = theme(key)
  expect([headingFont, bodyFont]).toEqual(FONTS[key])
})

test('resolveTheme returns the theme with the given key', () => {
  expect(resolveTheme('night')).toBe(theme('night'))
})

test.each(['nope', '', 'DEFAULT', 'night '])(
  'resolveTheme(%j) falls back to the default theme',
  (key) => {
    expect(resolveTheme(key)).toBe(theme('default'))
  },
)
