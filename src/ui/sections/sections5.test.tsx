/**
 * 验证设置导入和导出。
 * Tests settings import and export.
 */
// @vitest-environment happy-dom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { createSettings, serializeSettings } from '../../core/settings'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { SettingsProvider, useSettings } from '../store/SettingsProvider'
import * as download from '../export/download'
import { TransferSection } from './TransferSection'

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

function current() {
  return JSON.parse(screen.getByTestId('settings').textContent ?? '{}')
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

function show() {
  return render(
    <LocaleProvider initialLocale="zh-CN">
      <SettingsProvider initial={createSettings('lined')} dependencies={deps()}>
        <TransferSection />
        <Probe />
      </SettingsProvider>
    </LocaleProvider>,
  )
}

/** Fires a file at the hidden JSON input. */
function upload(text: string) {
  const input = document.querySelector(
    'input[type="file"][accept=".json"]',
  ) as HTMLInputElement
  Object.defineProperty(input, 'files', {
    value: [new File([text], 'settings.json', { type: 'application/json' })],
    configurable: true,
  })
  fireEvent.change(input)
}

describe('TransferSection', () => {
  test('export downloads a file named for the paper and today', () => {
    const spy = vi.spyOn(download, 'downloadText').mockImplementation(() => {})
    show()
    fireEvent.click(screen.getByRole('button', { name: '导出设置' }))
    expect(spy).toHaveBeenCalledOnce()
    const [text, filename] = spy.mock.calls[0] as [string, string]
    expect(text).toContain('"paper-by-choice"')
    expect(filename).toMatch(/^paper-by-choice-lined-\d{8}\.json$/)
  })

  test('a valid file replaces the settings and reports success', async () => {
    show()
    const next = createSettings('lined')
    const imported = {
      ...next,
      pages: { ...next.pages, count: 7 },
    }
    upload(serializeSettings(imported))
    await waitFor(() => expect(current().pages.count).toBe(7))
    expect(screen.getByRole('status').textContent).toContain('设置已导入')
  })

  test('a foreign JSON file reports notOurFile', async () => {
    show()
    upload(JSON.stringify({ app: 'something-else' }))
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('本应用'),
    )
  })

  test('a syntax error reports invalidJson', async () => {
    show()
    upload('{ not json')
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('JSON'),
    )
  })
})
