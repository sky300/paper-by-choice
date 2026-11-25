/**
 * 定义纸张排版的配色及字体主题。
 * Defines paper rendering palettes and typography.
 */
/**
 * Theme palettes. A theme is data only: papers and the page composer pick
 * colours and font stacks from it, they never hard-code their own.
 */
import type { Theme } from './types'

const SANS =
  "system-ui, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif"
const SERIF = "Georgia, 'Times New Roman', 'Songti SC', SimSun, serif"
const MONO = "ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace"

/** All themes, in `ThemeKey` declaration order; the first one is the fallback. */
export const THEMES: readonly Theme[] = [
  {
    key: 'default',
    primary: '#2563eb',
    secondary: '#0ea5e9',
    paper: '#ffffff',
    text: '#1f2937',
    lines: '#6b7280',
    accent: '#0f766e',
    headingFont: SANS,
    bodyFont: SANS,
  },
  {
    key: 'night',
    primary: '#818cf8',
    secondary: '#c084fc',
    paper: '#111827',
    text: '#f3f4f6',
    lines: '#4b5563',
    accent: '#f472b6',
    headingFont: SANS,
    bodyFont: SANS,
  },
  {
    key: 'sepia',
    primary: '#8a6f4d',
    secondary: '#a08663',
    paper: '#f4ecdd',
    text: '#43301f',
    lines: '#a3835c',
    accent: '#b5651d',
    headingFont: SERIF,
    bodyFont: SERIF,
  },
  {
    key: 'vintage',
    primary: '#7c5cbf',
    secondary: '#6b7280',
    paper: '#faf3e0',
    text: '#4b5563',
    lines: '#9ca3af',
    accent: '#c2703d',
    headingFont:
      "'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, 'Songti SC', serif",
    bodyFont: SANS,
  },
  {
    key: 'pastel',
    primary: '#7c9cf5',
    secondary: '#9ca3af',
    paper: '#f3faf4',
    text: '#4b5563',
    lines: '#a3b1c6',
    accent: '#ec8898',
    headingFont: SANS,
    bodyFont: SANS,
  },
  {
    key: 'classic',
    primary: '#1e40af',
    secondary: '#4b5563',
    paper: '#f7f7f5',
    text: '#111827',
    lines: '#374151',
    accent: '#991b1b',
    headingFont: SERIF,
    bodyFont: SERIF,
  },
  {
    key: 'minimalist',
    primary: '#111111',
    secondary: '#404040',
    paper: '#ffffff',
    text: '#262626',
    lines: '#c9c9c9',
    accent: '#737373',
    headingFont: SANS,
    bodyFont: SANS,
  },
  {
    key: 'ocean',
    primary: '#0369a1',
    secondary: '#0ea5e9',
    paper: '#eff9ff',
    text: '#083344',
    lines: '#a5d8ee',
    accent: '#075985',
    headingFont: SERIF,
    bodyFont: SANS,
  },
  {
    key: 'forest',
    primary: '#2f7d5b',
    secondary: '#5aa37a',
    paper: '#f4fbf5',
    text: '#143d2b',
    lines: '#9ad3ae',
    accent: '#3fa66a',
    headingFont: SERIF,
    bodyFont: SANS,
  },
  {
    key: 'sunset',
    primary: '#e0663d',
    secondary: '#f0a04b',
    paper: '#fff7ef',
    text: '#5c2a1a',
    lines: '#f6c9a8',
    accent: '#d99a2b',
    headingFont: SERIF,
    bodyFont: SANS,
  },
  {
    key: 'tech',
    primary: '#4338ca',
    secondary: '#2563eb',
    paper: '#f2f5ff',
    text: '#111c3d',
    lines: '#7dd3fc',
    accent: '#7c3aed',
    headingFont: MONO,
    bodyFont: MONO,
  },
  {
    key: 'elegant',
    primary: '#6d4c41',
    secondary: '#a1887f',
    paper: '#fdf7ef',
    text: '#4e342e',
    lines: '#d7b894',
    accent: '#8d6e63',
    headingFont: "'EB Garamond', Garamond, 'Palatino Linotype', serif",
    bodyFont: SANS,
  },
  {
    key: 'creative',
    primary: '#f0544f',
    secondary: '#f8c630',
    paper: '#ffffff',
    text: '#373457',
    lines: '#4d96ff',
    accent: '#59b35e',
    headingFont: "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive",
    bodyFont: SANS,
  },
]

/** Returns the theme for a key as stored in settings or a URL; unknown keys fall back to `default`. */
export function resolveTheme(key: string): Theme {
  return THEMES.find((entry) => entry.key === key) ?? THEMES[0]
}
