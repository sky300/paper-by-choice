/**
 * 保存和提供当前界面语言。
 * Stores and provides the active interface locale.
 */
/**
 * UI language context.
 *
 * The saved preference wins over browser detection. Changing the locale also
 * writes the preference and keeps `<html lang>` in sync for accessibility.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { JSX, ReactNode } from 'react'
import { STORAGE_KEYS } from '../../core/settings'
import type { Locale, Translator } from '../../core/types'
import { detectLocale, uiTranslator } from '../../i18n/index'

/** Locale state and the translator of the current language. */
export interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translator
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export interface LocaleProviderProps {
  /** Test hook: start in this language instead of reading storage / navigator. */
  initialLocale?: Locale
  children: ReactNode
}

/** Reads localStorage safely, so a blocked storage never prevents rendering. */
function savedLocale(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.locale)
  } catch {
    return null
  }
}

/** Reads the browser languages safely. */
function browserLanguages(): readonly string[] {
  try {
    return window.navigator.languages ?? []
  } catch {
    return []
  }
}

/** Provides the detected locale, its translator and the persistence action. */
export function LocaleProvider(props: LocaleProviderProps): JSX.Element {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (props.initialLocale) return props.initialLocale
    return detectLocale(savedLocale(), browserLanguages())
  })

  useEffect(() => {
    try {
      document.documentElement.lang = locale
    } catch {
      // A missing document must not break the app.
    }
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      window.localStorage.setItem(STORAGE_KEYS.locale, next)
    } catch {
      // Persistence is best-effort; the in-memory locale still changes.
    }
  }, [])

  const t = useMemo(() => uiTranslator(locale), [locale])
  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  )

  return (
    <LocaleContext.Provider value={value}>
      {props.children}
    </LocaleContext.Provider>
  )
}

/** Reads the locale context; throws when used outside a `LocaleProvider`. */
export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext)
  if (!value) throw new Error('useLocale must be used inside LocaleProvider')
  return value
}
