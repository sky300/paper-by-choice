/**
 * 验证预览、模板库和导出集成。
 * Tests preview, gallery, and export integration.
 */
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
import { paperName } from '../core/papers/registry'
import { paperTranslator } from '../i18n/index'
import type { Locale } from '../core/types'
import { Workspace } from './layout/Workspace'

const settings = createSettings('lined')
const doc = buildDocument({ settings, locale: 'zh-CN' })

afterEach(cleanup)

function wrap(ui: React.ReactNode, locale: Locale = 'zh-CN') {
  return render(
    <LocaleProvider initialLocale={locale}>
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

  test('places every template card directly in the shared grid', () => {
    const { container } = wrap(
      <TemplateGallery onChoose={() => {}} onClose={() => {}} />,
    )
    expect(
      container.querySelectorAll('.gallery-grid > .gallery-card'),
    ).toHaveLength(collectGalleryEntries().length)
  })

  test.each(['zh-CN', 'en'] as const)(
    'shows the sidebar paper name and preserves variant names in %s',
    (locale) => {
      const { container } = wrap(
        <TemplateGallery onChoose={() => {}} onClose={() => {}} />,
        locale,
      )
      const entries = collectGalleryEntries()
      const titles = container.querySelectorAll('.gallery-card strong')
      expect(titles).toHaveLength(entries.length)
      entries.forEach(({ paper, preset }, index) => {
        const title = titles[index].textContent
        const name = paperName(paper, locale)
        if (preset === paper.presets[0]) {
          expect(title).toBe(name)
        } else {
          expect(title).toContain(name)
          expect(title).toContain(paperTranslator(paper, locale)(preset.name))
        }
      })
    },
  )

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
  test('links the brand home and shows project contact links', () => {
    wrap(<Workspace />)
    expect(
      screen.getByRole('link', { name: '纸随心' }).getAttribute('href'),
    ).toBe(import.meta.env.BASE_URL)
    expect(screen.getByText('© 2026 · Powered by skyow')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: '关于本项目' }))
    expect(
      screen
        .getByRole('link', { name: 'github.com/sky300/paper-by-choice' })
        .getAttribute('href'),
    ).toBe('https://github.com/sky300/paper-by-choice')
    expect(
      screen
        .getByRole('link', { name: 'skyow300@gmail.com' })
        .getAttribute('href'),
    ).toBe('mailto:skyow300@gmail.com')
    expect(screen.queryByText('创建者 skyow')).toBeNull()
  })

  test('opens the paper settings drawer and closes it with Escape', () => {
    const { container } = wrap(<Workspace />)
    const toggle = container.querySelector<HTMLButtonElement>('.panel-toggle')!
    const panel = container.querySelector('.control-panel')!
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-controls')).toBe(panel.id)
    expect(panel.getAttribute('data-open')).toBe('true')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(panel.getAttribute('data-open')).toBe('false')
    expect(document.activeElement).toBe(toggle)
  })

  test('persists interface styles independently of the paper preview', () => {
    const first = wrap(<Workspace />)
    const select = screen.getByRole('combobox', { name: '界面风格' })
    expect(
      first.container.querySelector('[data-interface-style="teal"]'),
    ).not.toBeNull()
    const paper = first.container.querySelector('.sheet')?.innerHTML
    try {
      for (const style of ['violet', 'warm']) {
        fireEvent.change(select, { target: { value: style } })
        expect(
          first.container.querySelector(`[data-interface-style="${style}"]`),
        ).not.toBeNull()
        expect(first.container.querySelector('.sheet')?.innerHTML).toBe(paper)
      }
      first.unmount()
      wrap(<Workspace />)
      expect(
        (
          screen.getByRole('combobox', {
            name: '界面风格',
          }) as HTMLSelectElement
        ).value,
      ).toBe('warm')
    } finally {
      localStorage.removeItem('paper-by-choice.interface-style')
    }
  })

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
