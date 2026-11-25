export const INTERFACE_STYLES = ['violet', 'warm', 'teal'] as const
export type InterfaceStyle = (typeof INTERFACE_STYLES)[number]

const STORAGE_KEY = 'paper-by-choice.interface-style'

export function readInterfaceStyle(): InterfaceStyle {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return INTERFACE_STYLES.find((style) => style === saved) ?? 'teal'
  } catch {
    return 'teal'
  }
}

export function saveInterfaceStyle(style: InterfaceStyle): void {
  try {
    localStorage.setItem(STORAGE_KEY, style)
  } catch {
    // The current session can still switch styles when storage is unavailable.
  }
}
