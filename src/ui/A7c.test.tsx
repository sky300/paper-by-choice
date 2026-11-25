// @vitest-environment happy-dom
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { describe, expect, test, vi, afterEach } from 'vitest'
import { LocaleProvider } from './i18n/LocaleProvider'
import { SettingsProvider } from './store/SettingsProvider'
import { createSettings } from '../core/settings'
import { buildDocument } from '../core/compose/document'
import { Preview } from './preview/Preview'
import { ExportBar } from './layout/ExportBar'
import {
  TemplateGallery,
  collectGalleryEntries,
} from './gallery/TemplateGallery'
import { Workspace } from './layout/Workspace'

const settings = createSettings('lined')
const doc = buildDocument({ settings, locale: 'zh-CN' })

afterEach(cleanup)

function wrap(ui: React.ReactNode) {
  return render(
    <LocaleProvider initialLocale="zh-CN">
      <SettingsProvider initial={settings}>{ui}</SettingsProvider>
    </LocaleProvider>,
  )
}

describe('Preview', () => {
  test('renders every page as a sheet', () => {
    const { container } = wrap(<Preview doc={doc} />)
    expect(container.querySelectorAll('.sheet')).toHaveLength(doc.pages.length)
  })

  test('caps the preview at 12 pages and explains the rest', () => {
    const many = buildDocument({
      settings: { ...settings, pages: { ...settings.pages, count: 13 } },
      locale: 'zh-CN',
    })
    const { container } = wrap(<Preview doc={many} />)
    expect(container.querySelectorAll('.sheet')).toHaveLength(12)
    expect(container.textContent).toContain('13')
  })

  test('a zoom button changes the sheet width', () => {
    const { container } = wrap(<Preview doc={doc} />)
    const sheet = container.querySelector('.sheet') as HTMLElement
    const before = sheet.style.width
    fireEvent.click(screen.getByRole('button', { name: '150%' }))
    expect(sheet.style.width).not.toBe(before)
  })
})

describe('ExportBar', () => {
  test('offers four export actions and a resolution selector', () => {
    wrap(<ExportBar doc={doc} onPrint={() => {}} />)
    expect(screen.getByRole('button', { name: /PDF/ })).toBeDefined()
    expect(screen.getByRole('button', { name: /SVG/ })).toBeDefined()
    expect(screen.getByRole('button', { name: /PNG/ })).toBeDefined()
    expect(screen.getByRole('button', { name: '打印' })).toBeDefined()
    expect(screen.getByRole('combobox')).toBeDefined()
  })

  test('calls onPrint', () => {
    const onPrint = vi.fn()
    wrap(<ExportBar doc={doc} onPrint={onPrint} />)
    fireEvent.click(screen.getByRole('button', { name: '打印' }))
    expect(onPrint).toHaveBeenCalledOnce()
  })
})

describe('TemplateGallery', () => {
  test('collects every preset of every registered paper', () => {
    expect(collectGalleryEntries().length).toBeGreaterThan(41)
  })

  test('closes on Escape', () => {
    const onClose = vi.fn()
    wrap(<TemplateGallery onChoose={() => {}} onClose={onClose} />)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(onClose).toHaveBeenCalled()
  })

  test('filters cards by search text', () => {
    const { container } = wrap(
      <TemplateGallery onChoose={() => {}} onClose={() => {}} />,
    )
    const total = container.querySelectorAll('.gallery-card').length
    const input = screen.getByPlaceholderText('搜索模板…')
    fireEvent.change(input, { target: { value: 'zzzz-no-match' } })
    expect(container.querySelectorAll('.gallery-card')).toHaveLength(0)
    expect(total).toBeGreaterThan(0)
  })
})

describe('Workspace', () => {
  test('renders header, control panel and a preview', () => {
    const { container } = wrap(<Workspace />)
    expect(container.querySelector('.app-header')).not.toBeNull()
    expect(container.querySelector('.control-panel')).not.toBeNull()
    expect(container.querySelector('.sheet')).not.toBeNull()
  })

  test('opens the template gallery', () => {
    const { container } = wrap(<Workspace />)
    fireEvent.click(screen.getByRole('button', { name: '模板库' }))
    expect(container.querySelector('[role="dialog"]')).not.toBeNull()
  })
})
