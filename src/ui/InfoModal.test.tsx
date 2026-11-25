// @vitest-environment happy-dom
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { LocaleProvider } from './i18n/LocaleProvider'
import { InfoModal } from './layout/InfoModal'

function show(page: 'guide' | 'about', onClose = () => {}) {
  return render(
    <LocaleProvider initialLocale="zh-CN">
      <InfoModal page={page} onClose={onClose} />
    </LocaleProvider>,
  )
}

afterEach(cleanup)

describe('InfoModal', () => {
  test('renders the guide with all five steps', () => {
    show('guide')
    expect(screen.getByRole('dialog')).toBeDefined()
    expect(screen.getByText('选纸张类型')).toBeDefined()
    expect(screen.getByText('调参数、看预览')).toBeDefined()
    expect(screen.getByText('导出或打印')).toBeDefined()
    expect(screen.getByText('几个小提示')).toBeDefined()
  })

  test('renders the about story', () => {
    const { container } = show('about')
    expect(container.textContent).toContain('上小学')
    expect(container.textContent).toContain('开源')
    expect(container.textContent).toContain('MIT')
  })

  test('closes on Escape', () => {
    const onClose = vi.fn()
    show('guide', onClose)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onClose).toHaveBeenCalled()
  })

  test('closes on backdrop click', () => {
    const onClose = vi.fn()
    const { container } = show('about', onClose)
    fireEvent.click(container.querySelector('.gallery-backdrop') as Element)
    expect(onClose).toHaveBeenCalled()
  })
})
