// @vitest-environment happy-dom
import { cleanup, renderHook } from '@testing-library/react'
import { type ReactNode } from 'react'
import { act } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { getPaper, papers } from '../../core/papers/registry'
import { STORAGE_KEYS, createSettings } from '../../core/settings'
import { resolveTheme } from '../../core/themes'
import type { Settings } from '../../core/types'
import { storeSettings } from './settingsStorage'
import { SettingsProvider, useSettings } from './SettingsProvider'
import { formatSettingsHash } from './urlState'

type ProviderProps = Omit<Parameters<typeof SettingsProvider>[0], 'children'>

// Let @testing-library/react know `act` is available in this environment.
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

/** Injectable, isolated stand-ins for the three browser objects. */
function makeDeps() {
  const store = new Map<string, string>()
  const location = {
    hash: '',
    pathname: '/paper-by-choice/',
    search: '?lang=zh',
  }
  const history = {
    replaceState: vi.fn(
      (_state: unknown, _title: string, _url: string | null) => {},
    ),
  }
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  }
  return {
    store,
    location,
    history,
    storage,
    deps: { location, history, storage },
  }
}

function renderWith(props: ProviderProps) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <SettingsProvider {...props}>{children}</SettingsProvider>
  }
  return renderHook(() => useSettings(), { wrapper: Wrapper })
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('SettingsProvider: initial value', () => {
  test('defaults to lined when there is no link and no archive', () => {
    const h = makeDeps()
    const { result } = renderWith({ dependencies: h.deps })
    expect(result.current.settings).toEqual(createSettings('lined'))
    expect(result.current.paper.type).toBe('lined')
  })

  test('initial prop wins over the link and the archive', () => {
    const h = makeDeps()
    const initial = {
      ...createSettings('lined'),
      pages: { ...createSettings('lined').pages, count: 9 },
    }
    h.location.hash = formatSettingsHash(createSettings('lined'))
    storeSettings(createSettings('lined'), h.storage)
    const { result } = renderWith({ initial, dependencies: h.deps })
    expect(result.current.settings.pages.count).toBe(9)
  })

  test('a link takes priority over the archive', () => {
    const h = makeDeps()
    const linked = createSettings('lined', 'exam-two-column')
    const archived = {
      ...createSettings('lined'),
      pages: { count: 7, numbering: true, startNumber: 3 },
    }
    h.location.hash = formatSettingsHash(linked)
    storeSettings(archived, h.storage)
    const { result } = renderWith({ dependencies: h.deps })
    expect(result.current.settings).toEqual(linked)
  })

  test('the archive is used when there is no link', () => {
    const h = makeDeps()
    const archived = {
      ...createSettings('lined'),
      pages: { count: 7, numbering: true, startNumber: 3 },
    }
    storeSettings(archived, h.storage)
    const { result } = renderWith({ dependencies: h.deps })
    expect(result.current.settings).toEqual(archived)
  })
})

describe('SettingsProvider: actions', () => {
  function setup(initial?: Settings) {
    const h = makeDeps()
    return { h, ...renderWith({ initial, dependencies: h.deps }) }
  }

  test('switchPaperType changes the type, keeps pages and watermark, and resets decoration', () => {
    const base = createSettings('lined')
    const initial: Settings = {
      ...base,
      pages: { ...base.pages, count: 4, numbering: true },
      watermark: { ...base.watermark, enabled: true, text: 'draft' },
      decoration: { ...base.decoration, enabled: true },
    }
    const { result } = setup(initial)
    // The paper catalogue grows in parallel; pick whatever other type exists.
    const target =
      papers.find((paper) => paper.type !== 'lined')?.type ?? 'lined'
    act(() => result.current.switchPaperType(target))
    expect(result.current.settings.paperType).toBe(target)
    expect(result.current.settings.pages).toEqual(initial.pages)
    expect(result.current.settings.watermark).toEqual(initial.watermark)
    expect(result.current.settings.decoration).toEqual(
      createSettings(target).decoration,
    )
  })

  test('applyPreset(exam-two-column) gives A3 landscape with two columns', () => {
    const { result } = setup()
    act(() => result.current.applyPreset('exam-two-column'))
    expect(result.current.settings.paperSize).toBe('a3')
    expect(result.current.settings.orientation).toBe('landscape')
    expect(result.current.options.columns).toMatchObject({ count: '2' })
  })

  test('selectTheme(night) repaints the line color', () => {
    const { result } = setup()
    act(() => result.current.selectTheme('night'))
    expect(result.current.settings.theme).toBe('night')
    expect(result.current.settings.line.color).toBe(resolveTheme('night').lines)
  })

  test('applyCalligraphyFrame turns on the calligraphy decoration', () => {
    const { result } = setup()
    act(() => result.current.applyCalligraphyFrame())
    expect(result.current.settings.decoration.style).toBe('calligraphy')
  })

  test('setSpacing clamps to the paper maximum', () => {
    const { result } = setup()
    act(() => result.current.setSpacing(999))
    const max = getPaper(result.current.settings.paperType).spacing.max
    expect(result.current.settings.line.spacing).toBe(max)
  })

  test('setMargins only changes the given side', () => {
    const { result } = setup()
    const before = result.current.settings.margins
    act(() => result.current.setMargins({ top: 30 }))
    expect(result.current.settings.margins).toEqual({ ...before, top: 30 })
  })

  test('setOption stores the raw value and resolves it for display', () => {
    const { result } = setup()
    act(() => result.current.setOption('columns.count', '2'))
    expect(result.current.options.columns).toMatchObject({ count: '2' })
  })

  test('setOption of an out-of-range number is clamped in the resolved options', () => {
    const { result } = setup()
    act(() => result.current.setOption('columns.gap', 999))
    expect(result.current.options.columns).toMatchObject({ gap: 40 })
    expect(result.current.settings.options.columns).toMatchObject({ gap: 999 })
  })

  test('update applies a pure function without sanitizing', () => {
    const { result } = setup()
    act(() =>
      result.current.update((s) => ({
        ...s,
        watermark: { ...s.watermark, text: '  draft  ' },
      })),
    )
    expect(result.current.settings.watermark.text).toBe('  draft  ')
  })

  test('replace swaps the whole settings object', () => {
    const { result } = setup()
    const next = createSettings('lined', 'exam-two-column')
    act(() => result.current.replace(next))
    expect(result.current.settings.paperSize).toBe('a3')
  })
})

describe('SettingsProvider: persistence and link reaction', () => {
  test('persists settings after 250 ms without adding a URL fragment', () => {
    vi.useFakeTimers()
    const h = makeDeps()
    const { result } = renderWith({ dependencies: h.deps })
    act(() => {
      result.current.setMargins({ top: 30 })
      result.current.setMargins({ top: 31 })
    })
    act(() => vi.advanceTimersByTime(250))
    expect(h.history.replaceState).not.toHaveBeenCalled()
    expect(h.store.get(STORAGE_KEYS.settings)).toBe(
      JSON.stringify(result.current.settings),
    )
  })

  test('consumes a shared link and removes only its fragment', () => {
    const h = makeDeps()
    const linked = createSettings('cornell')
    h.location.hash = formatSettingsHash(linked)
    const { result } = renderWith({ dependencies: h.deps })
    expect(result.current.settings).toEqual(linked)
    expect(h.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/paper-by-choice/?lang=zh',
    )
    expect(h.store.get(STORAGE_KEYS.settings)).toBe(JSON.stringify(linked))
  })

  test('leaves non-settings fragments alone', () => {
    const h = makeDeps()
    h.location.hash = '#guide'
    renderWith({ dependencies: h.deps })
    expect(h.history.replaceState).not.toHaveBeenCalled()
  })

  test('hashchange with different settings replaces the state', () => {
    const h = makeDeps()
    const { result } = renderWith({ dependencies: h.deps })
    const next = createSettings('lined', 'exam-two-column')
    h.location.hash = formatSettingsHash(next)
    act(() => window.dispatchEvent(new Event('hashchange')))
    expect(result.current.settings).toEqual(next)
  })

  test('hashchange with identical settings keeps the same reference', () => {
    const h = makeDeps()
    const { result } = renderWith({ dependencies: h.deps })
    const before = result.current.settings
    h.location.hash = formatSettingsHash(before)
    act(() => window.dispatchEvent(new Event('hashchange')))
    expect(Object.is(result.current.settings, before)).toBe(true)
  })

  test('useSettings throws outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(() => renderHook(() => useSettings())).toThrow()
    } finally {
      spy.mockRestore()
    }
  })
})
