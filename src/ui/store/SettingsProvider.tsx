/**
 * Reactive settings state for the React layer.
 *
 * A single settings object is the source of truth. Actions are thin wrappers
 * over the pure functions in `core/settings`; only `replace`, link reads and
 * storage reads sanitize, so typing in a text field is never truncated.
 * Changes are debounced into the local archive and the address-bar fragment.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { JSX, ReactNode } from 'react'
import { getPaper } from '../../core/papers/registry'
import { setOption as writeOption } from '../../core/papers/kit'
import {
  applyCalligraphyFrame as pureApplyCalligraphyFrame,
  applyPreset as pureApplyPreset,
  clampSpacing,
  createSettings,
  resolveOptionsFor,
  sanitizeSettings,
  selectTheme as pureSelectTheme,
  switchPaperType as pureSwitchPaperType,
} from '../../core/settings'
import type {
  BackgroundSettings,
  DecorationSettings,
  LineSettings,
  Margins,
  Orientation,
  PagesSettings,
  PaperSizeKey,
  PaperType,
  Settings,
  ThemeKey,
  WatermarkSettings,
} from '../../core/types'
import type { AnyPaper } from '../../core/papers/contract'
import { loadStoredSettings, storeSettings } from './settingsStorage'
import { SETTINGS_HASH_PREFIX, parseSettingsHash } from './urlState'

/** How long after the last change the archive and address bar are updated. */
const PERSIST_DELAY_MS = 250

/** Everything the control panel and preview need from the settings store. */
export interface SettingsContextValue {
  /** The current, un-sanitized settings object. */
  settings: Settings
  /** The current paper from the registry. */
  paper: AnyPaper
  /** Validated, paper-specific options for form display and rendering. */
  options: Record<string, unknown>
  /** Applies a pure update function; the result is not sanitized. */
  update: (fn: (s: Settings) => Settings) => void
  /** Replaces the whole settings object, e.g. after an import. */
  replace: (next: Settings) => void
  switchPaperType: (type: PaperType) => void
  applyPreset: (presetId: string) => void
  selectTheme: (theme: ThemeKey) => void
  applyCalligraphyFrame: () => void
  setPaperSize: (key: PaperSizeKey) => void
  setOrientation: (orientation: Orientation) => void
  setCustomSize: (patch: Partial<{ width: number; height: number }>) => void
  setSpacing: (value: number) => void
  setLine: (patch: Partial<LineSettings>) => void
  setMargins: (patch: Partial<Margins>) => void
  setBackground: (patch: Partial<BackgroundSettings>) => void
  setDecoration: (patch: Partial<DecorationSettings>) => void
  setWatermark: (patch: Partial<WatermarkSettings>) => void
  setPages: (patch: Partial<PagesSettings>) => void
  /** Writes one raw option value; the displayed options are always resolved. */
  setOption: (path: string, value: unknown) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

/** Injectable browser objects, used by tests and by the real app alike. */
export interface SettingsProviderDependencies {
  location?: Pick<Location, 'hash'> &
    Partial<Pick<Location, 'pathname' | 'search'>>
  history?: {
    readonly state?: unknown
    replaceState(state: unknown, title: string, url: string | null): void
  }
  storage?: Pick<Storage, 'getItem' | 'setItem'>
}

export interface SettingsProviderProps {
  /** Test hook: start from these settings instead of reading the link or archive. */
  initial?: Settings
  /** Test hook: replace the browser objects on `window`. */
  dependencies?: SettingsProviderDependencies
  children: ReactNode
}

/** Reads a `window` member without throwing when the DOM is unavailable. */
function browser<K extends 'location' | 'history' | 'localStorage'>(
  key: K,
): (Window & typeof globalThis)[K] | undefined {
  try {
    return window[key]
  } catch {
    return undefined
  }
}

/** Resolves the initial settings with the documented priority. */
function initialSettings(props: SettingsProviderProps): Settings {
  const deps = props.dependencies
  if (props.initial) return props.initial
  const location = deps?.location ?? browser('location')
  const fromLink = parseSettingsHash(location?.hash ?? '')
  if (fromLink) return fromLink
  return (
    loadStoredSettings(deps?.storage ?? browser('localStorage')) ??
    createSettings('lined')
  )
}

/** Provides the settings state, actions, debounced persistence and link reaction. */
export function SettingsProvider(props: SettingsProviderProps): JSX.Element {
  const { children } = props
  const [settings, setSettings] = useState<Settings>(() =>
    initialSettings(props),
  )
  const settingsRef = useRef(settings)

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  /* Actions ------------------------------------------------------------ */

  const update = useCallback((fn: (s: Settings) => Settings) => {
    setSettings((current) => fn(current))
  }, [])

  const replace = useCallback((next: Settings) => {
    setSettings(sanitizeSettings(next))
  }, [])

  const switchPaperType = useCallback((type: PaperType) => {
    setSettings((current) => pureSwitchPaperType(current, type))
  }, [])

  const applyPreset = useCallback((presetId: string) => {
    setSettings((current) => pureApplyPreset(current, presetId))
  }, [])

  const selectTheme = useCallback((theme: ThemeKey) => {
    setSettings((current) => pureSelectTheme(current, theme))
  }, [])

  const applyCalligraphyFrame = useCallback(() => {
    setSettings((current) => pureApplyCalligraphyFrame(current))
  }, [])

  const setPaperSize = useCallback((key: PaperSizeKey) => {
    setSettings((current) => ({ ...current, paperSize: key }))
  }, [])

  const setOrientation = useCallback((orientation: Orientation) => {
    setSettings((current) => ({ ...current, orientation }))
  }, [])

  const setCustomSize = useCallback(
    (patch: Partial<{ width: number; height: number }>) => {
      setSettings((current) => ({
        ...current,
        customSize: { ...current.customSize, ...patch },
      }))
    },
    [],
  )

  const setSpacing = useCallback((value: number) => {
    setSettings((current) => ({
      ...current,
      line: {
        ...current.line,
        spacing: clampSpacing(current.paperType, value),
      },
    }))
  }, [])

  const setLine = useCallback((patch: Partial<LineSettings>) => {
    setSettings((current) => ({
      ...current,
      line: { ...current.line, ...patch },
    }))
  }, [])

  const setMargins = useCallback((patch: Partial<Margins>) => {
    setSettings((current) => ({
      ...current,
      margins: { ...current.margins, ...patch },
    }))
  }, [])

  const setBackground = useCallback((patch: Partial<BackgroundSettings>) => {
    setSettings((current) => ({
      ...current,
      background: { ...current.background, ...patch },
    }))
  }, [])

  const setDecoration = useCallback((patch: Partial<DecorationSettings>) => {
    setSettings((current) => ({
      ...current,
      decoration: { ...current.decoration, ...patch },
    }))
  }, [])

  const setWatermark = useCallback((patch: Partial<WatermarkSettings>) => {
    setSettings((current) => ({
      ...current,
      watermark: { ...current.watermark, ...patch },
    }))
  }, [])

  const setPages = useCallback((patch: Partial<PagesSettings>) => {
    setSettings((current) => ({
      ...current,
      pages: { ...current.pages, ...patch },
    }))
  }, [])

  const setOption = useCallback((path: string, value: unknown) => {
    setSettings((current) => ({
      ...current,
      options: writeOption(current.options, path, value),
    }))
  }, [])

  /* Persistence -------------------------------------------------------- */

  useEffect(() => {
    const storage = props.dependencies?.storage ?? browser('localStorage')
    const timer = setTimeout(
      () => storeSettings(settings, storage),
      PERSIST_DELAY_MS,
    )
    return () => clearTimeout(timer)
  }, [settings, props.dependencies])

  /* Link reaction ------------------------------------------------------ */

  useEffect(() => {
    const location = props.dependencies?.location ?? browser('location')
    const history = props.dependencies?.history ?? browser('history')
    const storage = props.dependencies?.storage ?? browser('localStorage')

    function consumeSettingsLink(next: Settings | null) {
      if (!location?.hash.startsWith(`#${SETTINGS_HASH_PREFIX}`)) return
      if (next) storeSettings(next, storage)
      try {
        history?.replaceState(
          history.state ?? null,
          '',
          (location.pathname ?? browser('location')?.pathname ?? '/') +
            (location.search ?? browser('location')?.search ?? ''),
        )
      } catch {
        // Reading a link still works when the browser restricts history.
      }
    }

    if (!props.initial)
      consumeSettingsLink(parseSettingsHash(location?.hash ?? ''))

    function onHashChange() {
      const next = parseSettingsHash(location?.hash ?? '')
      consumeSettingsLink(next)
      if (
        next &&
        JSON.stringify(next) !== JSON.stringify(settingsRef.current)
      ) {
        setSettings(next)
      }
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [props.dependencies, props.initial])

  /* Context value ------------------------------------------------------ */

  const paper = useMemo(
    () => getPaper(settings.paperType),
    [settings.paperType],
  )
  const options = useMemo(() => resolveOptionsFor(settings), [settings])
  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      paper,
      options,
      update,
      replace,
      switchPaperType,
      applyPreset,
      selectTheme,
      applyCalligraphyFrame,
      setPaperSize,
      setOrientation,
      setCustomSize,
      setSpacing,
      setLine,
      setMargins,
      setBackground,
      setDecoration,
      setWatermark,
      setPages,
      setOption,
    }),
    [
      settings,
      paper,
      options,
      update,
      replace,
      switchPaperType,
      applyPreset,
      selectTheme,
      applyCalligraphyFrame,
      setPaperSize,
      setOrientation,
      setCustomSize,
      setSpacing,
      setLine,
      setMargins,
      setBackground,
      setDecoration,
      setWatermark,
      setPages,
      setOption,
    ],
  )

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

/** Reads the settings context; throws when used outside a `SettingsProvider`. */
export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext)
  if (!value)
    throw new Error('useSettings must be used inside SettingsProvider')
  return value
}
