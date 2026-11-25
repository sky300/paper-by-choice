// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { papers } from '../../core/papers/registry'
import { createSettings } from '../../core/settings'
import { resolveTheme, THEMES } from '../../core/themes'
import type { Settings } from '../../core/types'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { SettingsProvider, useSettings } from '../store/SettingsProvider'
import { PageSizeSection } from './PageSizeSection'
import { PaperTypeSection } from './PaperTypeSection'
import { ThemeSection } from './ThemeSection'

;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

/** Exposes the live settings object to assertions. */
function Probe() {
  const { settings } = useSettings()
  return <span data-testid="settings">{JSON.stringify(settings)}</span>
}

/** Reads the settings object the section is editing. */
function current(): Settings {
  return JSON.parse(
    screen.getByTestId('settings').textContent ?? '{}',
  ) as Settings
}

/** Isolated stand-ins so the provider never touches real browser state. */
function deps() {
  return {
    location: { hash: '' },
    history: {
      replaceState: (_s: unknown, _t: string, _u: string | null) => {},
    },
    storage: {
      getItem: (_k: string) => null,
      setItem: (_k: string, _v: string) => {},
    },
  }
}

/** Mounts one section inside both providers. */
function show(ui: ReactElement, settings?: Settings) {
  return render(
    <LocaleProvider initialLocale="zh-CN">
      <SettingsProvider
        initial={settings ?? createSettings('lined')}
        dependencies={deps()}
      >
        {ui}
        <Probe />
      </SettingsProvider>
    </LocaleProvider>,
  )
}

describe('PaperTypeSection', () => {
  test('renders the four groups and every registered paper', () => {
    show(<PaperTypeSection />)
    expect(screen.getByText('基础纸型')).toBeTruthy()
    expect(screen.getByText('中文作业纸')).toBeTruthy()
    expect(screen.getByText('书法练习纸')).toBeTruthy()
    expect(screen.getByText('笔记与表单')).toBeTruthy()
    expect(document.querySelectorAll('.paper-option')).toHaveLength(
      papers.length,
    )
  })

  test('the current paper is pressed; clicking another switches the type', () => {
    const target = papers.find((p) => p.type !== 'lined')!
    show(<PaperTypeSection />)
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1)
    const button = document.querySelector(
      `[data-paper="${target.type}"]`,
    ) as HTMLElement
    fireEvent.click(button)
    expect(current().paperType).toBe(target.type)
    expect(button.getAttribute('aria-pressed')).toBe('true')
  })

  test('a button title is the first preset description', () => {
    const paper = papers[0]
    show(<PaperTypeSection />)
    const button = document.querySelector(
      `[data-paper="${paper.type}"]`,
    ) as HTMLElement
    expect(button.getAttribute('title')).toBeTruthy()
  })
})

describe('PageSizeSection', () => {
  test('by default shows orientation buttons and the page dimensions', () => {
    show(<PageSizeSection />)
    expect(screen.getByRole('button', { name: '纵向' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '横向' })).toBeTruthy()
    expect(screen.getByText(/210 × 297 mm/)).toBeTruthy()
  })

  test('custom shows width and height and hides orientation', () => {
    show(<PageSizeSection />)
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'custom' },
    })
    expect(screen.getByRole('spinbutton', { name: '宽度' })).toBeTruthy()
    expect(screen.getByRole('spinbutton', { name: '高度' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '横向' })).toBeNull()
    expect(current().paperSize).toBe('custom')
  })

  test('editing the custom width updates the settings', () => {
    const initial = { ...createSettings('lined'), paperSize: 'custom' as const }
    show(<PageSizeSection />, initial)
    fireEvent.change(screen.getByRole('spinbutton', { name: '宽度' }), {
      target: { value: '250' },
    })
    expect(current().customSize.width).toBe(250)
  })

  test('clicking landscape sets the orientation', () => {
    show(<PageSizeSection />)
    fireEvent.click(screen.getByRole('button', { name: '横向' }))
    expect(current().orientation).toBe('landscape')
  })
})

describe('ThemeSection', () => {
  test('renders all 13 themes', () => {
    show(<ThemeSection />)
    expect(document.querySelectorAll('.theme-option')).toHaveLength(13)
    expect(screen.getByText('清爽')).toBeTruthy()
  })

  test('selecting a theme updates both theme and line color', () => {
    const target = THEMES.find((theme) => theme.key !== 'default')!
    show(<ThemeSection />)
    const button = document.querySelector(
      `[data-theme="${target.key}"]`,
    ) as HTMLElement
    fireEvent.click(button)
    expect(current().theme).toBe(target.key)
    expect(current().line.color).toBe(resolveTheme(target.key).lines)
    expect(button.getAttribute('aria-pressed')).toBe('true')
  })

  test('each theme card shows three colour chips', () => {
    show(<ThemeSection />)
    const card = document.querySelector('.theme-card') as HTMLElement
    expect(card.querySelectorAll('.theme-chip')).toHaveLength(3)
  })
})
