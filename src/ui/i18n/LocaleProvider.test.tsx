// @vitest-environment happy-dom
import { cleanup, renderHook } from '@testing-library/react'
import { type ReactNode } from 'react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { STORAGE_KEYS } from '../../core/settings'
import { LocaleProvider, useLocale } from './LocaleProvider'

;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

function wrapper(props: { initialLocale?: 'zh-CN' | 'en' }) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <LocaleProvider {...props}>{children}</LocaleProvider>
  }
}

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.lang = ''
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('LocaleProvider', () => {
  test('uses the given initial locale', () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: wrapper({ initialLocale: 'en' }),
    })
    expect(result.current.locale).toBe('en')
  })

  test('detects the locale from navigator.languages when nothing is saved', () => {
    const spy = vi
      .spyOn(window.navigator, 'languages', 'get')
      .mockReturnValue(['en-US', 'en'])
    const { result } = renderHook(() => useLocale(), { wrapper: wrapper({}) })
    expect(result.current.locale).toBe('en')
    expect(spy).toHaveBeenCalled()
  })

  test('a saved preference wins over the browser languages', () => {
    window.localStorage.setItem(STORAGE_KEYS.locale, 'zh-CN')
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(['en-US'])
    const { result } = renderHook(() => useLocale(), { wrapper: wrapper({}) })
    expect(result.current.locale).toBe('zh-CN')
  })

  test('setLocale persists the choice and updates <html lang>', () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: wrapper({ initialLocale: 'zh-CN' }),
    })
    act(() => result.current.setLocale('en'))
    expect(result.current.locale).toBe('en')
    expect(window.localStorage.getItem(STORAGE_KEYS.locale)).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })

  test('t translates an existing UI key', () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: wrapper({ initialLocale: 'en' }),
    })
    expect(result.current.t('orientation.portrait')).toBe('Portrait')
  })

  test('useLocale throws outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(() => renderHook(() => useLocale())).toThrow()
    } finally {
      spy.mockRestore()
    }
  })
})
