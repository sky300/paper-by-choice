/**
 * 验证水印和页面配置。
 * Tests watermark and page controls.
 */
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { createSettings } from '../../core/settings'
import type { Settings } from '../../core/types'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { SettingsProvider, useSettings } from '../store/SettingsProvider'
import { DecorationSection } from './DecorationSection'
import { PagesSection } from './PagesSection'
import { WatermarkSection } from './WatermarkSection'

;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function Probe() {
  const { settings } = useSettings()
  return <span data-testid="settings">{JSON.stringify(settings)}</span>
}

function current(): Settings {
  return JSON.parse(
    screen.getByTestId('settings').textContent ?? '{}',
  ) as Settings
}

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

/** Turns a disabled feature on through its first checkbox. */
function enable() {
  fireEvent.click(screen.getByRole('checkbox'))
}

describe('DecorationSection', () => {
  test('disabled shows only the master toggle', () => {
    show(<DecorationSection />)
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    expect(screen.queryByText('内缩')).toBeNull()
  })

  test('enabled reveals the common controls', () => {
    show(<DecorationSection />)
    enable()
    expect(screen.getByText('内缩')).toBeTruthy()
    expect(screen.getByRole('group', { name: '显示的边' })).toBeTruthy()
  })

  test('switching to corner enables corner ornaments', () => {
    const initial = createSettings('lined')
    const on: Settings = {
      ...initial,
      decoration: {
        ...initial.decoration,
        enabled: true,
        cornerOrnaments: false,
      },
    }
    show(<DecorationSection />, on)
    const combos = screen.getAllByRole('combobox')
    fireEvent.change(combos[0], { target: { value: 'corner' } })
    expect(current().decoration.style).toBe('corner')
    expect(current().decoration.cornerOrnaments).toBe(true)
  })

  test('switching to scalloped opens all sides and reveals the pattern', () => {
    const initial = createSettings('lined')
    const on: Settings = {
      ...initial,
      decoration: {
        ...initial.decoration,
        enabled: true,
        sides: { top: false, right: false, bottom: false, left: false },
      },
    }
    show(<DecorationSection />, on)
    fireEvent.change(screen.getAllByRole('combobox')[0], {
      target: { value: 'scalloped' },
    })
    expect(current().decoration.sides).toEqual({
      top: true,
      right: true,
      bottom: true,
      left: true,
    })
    expect(screen.getByText('花边图案')).toBeTruthy()
  })

  test('lined offers the one-click calligraphy frame', () => {
    const initial = createSettings('lined')
    const on: Settings = {
      ...initial,
      decoration: { ...initial.decoration, enabled: true },
    }
    show(<DecorationSection />, on)
    const button = screen.getByRole('button', { name: '应用书法框' })
    fireEvent.click(button)
    expect(current().decoration.style).toBe('calligraphy')
  })
})

describe('WatermarkSection', () => {
  test('controls appear only after enabling', () => {
    show(<WatermarkSection />)
    expect(screen.queryByRole('textbox')).toBeNull()
    enable()
    expect(screen.getByRole('textbox')).toBeTruthy()
  })

  test('typing watermark text updates the settings', () => {
    show(<WatermarkSection />)
    enable()
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'draft' },
    })
    expect(current().watermark.text).toBe('draft')
  })
})

describe('PagesSection', () => {
  test('changing the page count updates the settings', () => {
    show(<PagesSection />)
    fireEvent.change(screen.getByRole('spinbutton', { name: '页数' }), {
      target: { value: '4' },
    })
    expect(current().pages.count).toBe(4)
  })

  test('the start number appears only with numbering on', () => {
    show(<PagesSection />)
    expect(screen.queryByRole('spinbutton', { name: '起始页码' })).toBeNull()
    enable()
    expect(screen.getByRole('spinbutton', { name: '起始页码' })).toBeTruthy()
    expect(current().pages.numbering).toBe(true)
  })
})
