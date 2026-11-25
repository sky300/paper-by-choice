/**
 * Internationalisation: UI dictionaries, message lookup and locale detection.
 *
 * `core` modules may import the *types* from here; the dictionaries themselves
 * are plain data so they can be used from React and from pure code alike.
 */
import type { AnyPaper } from '../core/papers/contract'
import type { Locale, Translator } from '../core/types'
import { en } from './en'
import { zhCN } from './zh-CN'

/** Flat map from dotted key to message; `{name}` placeholders are filled by `interpolate`. */
export type MessageDict = Record<string, string>

/** The UI dictionary of every supported locale. */
export const UI_MESSAGES: Record<Locale, MessageDict> = { 'zh-CN': zhCN, en }

const PLACEHOLDER = /\{(\w+)\}/g

/** Replaces every `{name}` in `template` with `params[name]`; placeholders without a param are kept as written. */
export function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template
  return template.replace(PLACEHOLDER, (placeholder, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : placeholder,
  )
}

/** Builds a translator that consults the dictionaries in order and returns the key itself when none has it. */
export function createTranslator(
  ...dictionaries: readonly MessageDict[]
): Translator {
  return (key, params) => {
    for (const dict of dictionaries) {
      if (Object.hasOwn(dict, key)) return interpolate(dict[key], params)
    }
    return key
  }
}

/** Translator over the UI dictionary of one locale. */
export function uiTranslator(locale: Locale): Translator {
  return createTranslator(UI_MESSAGES[locale])
}

/**
 * Translator handed to a paper's `render()`: the paper's own messages in the
 * current locale, then its other locale, then the UI dictionary, then the key.
 */
export function paperTranslator(paper: AnyPaper, locale: Locale): Translator {
  const other: Locale = locale === 'zh-CN' ? 'en' : 'zh-CN'
  return createTranslator(
    paper.messages[locale],
    paper.messages[other],
    UI_MESSAGES[locale],
  )
}

/**
 * Picks the UI locale: a saved preference when it is valid, otherwise the
 * first browser language starting with `zh` or `en` (case-insensitive), otherwise Chinese.
 */
export function detectLocale(
  saved: string | null | undefined,
  languages: readonly string[],
): Locale {
  if (saved === 'zh-CN' || saved === 'en') return saved
  for (const language of languages) {
    const tag = language.toLowerCase()
    if (tag.startsWith('zh')) return 'zh-CN'
    if (tag.startsWith('en')) return 'en'
  }
  return 'zh-CN'
}
