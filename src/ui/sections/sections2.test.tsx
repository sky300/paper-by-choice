/**
 * 验证线条和页边距配置。
 * Tests line and margin controls.
 */
// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { createSettings } from '../../core/settings'
import type { Settings } from '../../core/types'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { SettingsProvider, useSettings } from '../store/SettingsProvider'
import { LineSection } from './LineSection'
import { OptionsSection } from './OptionsSection'

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

describe('LineSection', () => {
  test('the spacing label comes from the paper', () => {
    show(<LineSection />)
    expect(screen.getByText('行距')).toBeTruthy()
  })

  test('typing a new spacing updates the settings', () => {
    show(<LineSection />)
    fireEvent.change(screen.getByRole('spinbutton', { name: '行距' }), {
      target: { value: '10' },
    })
    expect(current().line.spacing).toBe(10)
  })

  test('recommend restores the default and then disables itself', () => {
    const initial = createSettings('lined')
    const changed = { ...initial, line: { ...initial.line, spacing: 14 } }
    show(<LineSection />, changed)
    const recommend = screen.getByRole('button', { name: '推荐' })
    expect((recommend as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(recommend)
    expect(current().line.spacing).toBe(8)
    expect(
      (screen.getByRole('button', { name: '推荐' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
  })

  test('changing style, width and color updates the line', () => {
    show(<LineSection />)
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'dashed' },
    })
    expect(current().line.style).toBe('dashed')
    fireEvent.change(screen.getByRole('slider'), { target: { value: '0.5' } })
    expect(current().line.width).toBe(0.5)
    const picker = document.querySelector(
      'input[type="color"]',
    ) as HTMLInputElement
    fireEvent.change(picker, { target: { value: '#123456' } })
    expect(current().line.color).toBe('#123456')
  })
})

describe('OptionsSection', () => {
  test('lined shows the column setting', () => {
    show(<OptionsSection />)
    expect(screen.getByText('分栏')).toBeTruthy()
  })

  test('choosing two columns reveals gap and divider controls', () => {
    show(<OptionsSection />)
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: '2' },
    })
    expect(screen.getByText('栏间距')).toBeTruthy()
    expect(screen.getByText('分隔线')).toBeTruthy()
  })

  test('a paper with no fields renders nothing', () => {
    const { container } = show(<OptionsSection />, createSettings('sketch'))
    expect(container.querySelector('.ctl-section')).toBeNull()
    expect(screen.queryByText('栏间距')).toBeNull()
  })
})
