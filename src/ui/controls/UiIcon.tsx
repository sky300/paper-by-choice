/**
 * 绘制界面通用线性图标。
 * Draws shared interface icons.
 */
import type { JSX } from 'react'

const icons: Readonly<Record<string, string>> = {
  type: 'M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6',
  size: 'M4 5v15h16v-6H10V5zM7 8h3m-3 3h3m2 3v3m4-3v3',
  theme:
    'M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.4-3.4 1.5 1.5 0 0 1 1-2.6H18a3 3 0 0 0 3-3 9 9 0 0 0-9-9ZM7 12h.01M9 8h.01M13 7h.01M17 10h.01',
  line: 'm4 20 4-1 11-11-3-3L5 16zM14 7l3 3',
  margins: 'M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5M8 8h8v8H8z',
  download: 'M12 4v11m-4-4 4 4 4-4M5 15v5h14v-5',
  print: 'M7 8V4h10v4M7 17H4V9h16v8h-3M7 14h10v7H7zM16 11h1',
  gallery: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  guide: 'M5 5a2 2 0 0 1 2-2h12v16H7a2 2 0 0 0 0 4h12M5 5v16m4-13h6m-6 4h6',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 8v5m0-8h.01',
  background: 'M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 4M15 9h.01',
  decoration: 'M4 4h16v16H4zM8 8h8v8H8z',
  watermark: 'M12 3c2 4 6 7 6 12a6 6 0 1 1-12 0c0-5 4-8 6-12z',
  pages: 'M8 4h12v13H8zM4 8v13h12',
  transfer: 'M4 8h15m-4-4 4 4-4 4M20 16H5m4-4-4 4 4 4',
  options: 'M4 7h16M4 17h16M8 4v6m8 4v6',
}

export function UiIcon({ name }: { name: string }): JSX.Element | null {
  const path = Object.hasOwn(icons, name) ? icons[name] : undefined
  return path ? (
    <svg
      className="ui-icon"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  ) : null
}
