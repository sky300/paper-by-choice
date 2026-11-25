/**
 * 验证纸面外观配置。
 * Tests paper appearance controls.
 */
// @vitest-environment happy-dom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { createSettings } from '../../core/settings'
import type { Settings } from '../../core/types'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { SettingsProvider, useSettings } from '../store/SettingsProvider'
import { BackgroundSection } from './BackgroundSection'
import { MarginsSection } from './MarginsSection'

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

/** Builds a File and fires it at the hidden image input. */
function upload(file: File) {
  const input = document.querySelector(
    'input[type="file"][accept="image/*"]',
  ) as HTMLInputElement
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  fireEvent.change(input)
}

describe('MarginsSection', () => {
  test('renders four independent margin inputs', () => {
    show(<MarginsSection />)
    expect(screen.getAllByRole('spinbutton')).toHaveLength(4)
    expect(screen.getByText('上边距')).toBeTruthy()
  })

  test('changing one side does not change the others', () => {
    show(<MarginsSection />)
    fireEvent.change(screen.getByRole('spinbutton', { name: '上边距' }), {
      target: { value: '30' },
    })
    const m = current().margins
    expect(m.top).toBe(30)
    expect(m.right).toBe(20)
    expect(m.bottom).toBe(25)
    expect(m.left).toBe(20)
  })

  test('all four map to their own setting key', () => {
    show(<MarginsSection />)
    const labels: readonly [string, 'right' | 'bottom' | 'left'][] = [
      ['右边距', 'right'],
      ['下边距', 'bottom'],
      ['左边距', 'left'],
    ]
    for (const [label, key] of labels) {
      fireEvent.change(screen.getByRole('spinbutton', { name: label }), {
        target: { value: '12' },
      })
      expect(current().margins[key]).toBe(12)
    }
  })
})

describe('BackgroundSection', () => {
  test('no texture hides pattern colour and opacity', () => {
    show(<BackgroundSection />)
    expect(screen.queryByText('纹理颜色')).toBeNull()
    expect(screen.queryByText('纹理不透明度')).toBeNull()
  })

  test('choosing grid reveals pattern colour and opacity', () => {
    show(<BackgroundSection />)
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'grid' },
    })
    expect(screen.getByText('纹理颜色')).toBeTruthy()
    expect(screen.getByText('纹理不透明度')).toBeTruthy()
    expect(current().background.texture).toBe('grid')
  })

  test('choosing image reveals the choose-image button', () => {
    show(<BackgroundSection />)
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'image' },
    })
    expect(screen.getByRole('button', { name: '选择图片' })).toBeTruthy()
  })

  test('an oversized file is rejected', () => {
    show(<BackgroundSection />)
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'image' },
    })
    const big = new File(['x'.repeat(6 * 1024 * 1024)], 'big.png', {
      type: 'image/png',
    })
    upload(big)
    expect(screen.getByRole('alert').textContent).toContain('5 MB')
  })

  test('a non-image file is rejected', () => {
    show(<BackgroundSection />)
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'image' },
    })
    upload(new File(['hello'], 'note.txt', { type: 'text/plain' }))
    expect(screen.getByRole('alert')).toBeTruthy()
  })

  test('a valid image becomes a data URL and allows opacity up to 1', async () => {
    show(<BackgroundSection />)
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'image' },
    })
    upload(new File(['img'], 'paper.png', { type: 'image/png' }))
    await waitFor(() =>
      expect(current().background.image?.startsWith('data:image/')).toBe(true),
    )
    expect((screen.getByRole('slider') as HTMLInputElement).max).toBe('1')
  })

  test('remove-image clears the stored image', () => {
    const initial = createSettings('lined')
    const withImage: Settings = {
      ...initial,
      background: {
        ...initial.background,
        texture: 'image',
        image: 'data:image/png;base64,AAAA',
      },
    }
    show(<BackgroundSection />, withImage)
    fireEvent.click(screen.getByRole('button', { name: '移除图片' }))
    expect(current().background.image).toBeNull()
  })
})
