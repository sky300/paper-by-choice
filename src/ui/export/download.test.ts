// @vitest-environment happy-dom
import { afterEach, describe, expect, test, vi } from 'vitest'
import { downloadBlob, downloadText } from './download'

/** Captures anchors at click time. */
const clicked: HTMLAnchorElement[] = []

afterEach(() => {
  vi.restoreAllMocks()
  clicked.length = 0
})

/** Spies the three browser APIs a download touches. */
function spy() {
  const create = vi
    .spyOn(URL, 'createObjectURL')
    .mockReturnValue('blob:test-url')
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this)
    })
  return { create, revoke, click }
}

/** The last anchor a download clicked, or `undefined`. */
function last(): HTMLAnchorElement | undefined {
  return clicked[clicked.length - 1]
}

describe('downloadText', () => {
  test('creates an object URL and clicks a link with the right download name', () => {
    const s = spy()
    downloadText('hello', 'note.txt')
    expect(s.create).toHaveBeenCalledOnce()
    expect(s.create.mock.calls[0][0]).toBeInstanceOf(Blob)
    expect(last()?.download).toBe('note.txt')
    expect(s.click).toHaveBeenCalledOnce()
    expect(s.revoke).toHaveBeenCalledWith('blob:test-url')
  })

  test('defaults to plain UTF-8 text', () => {
    const s = spy()
    downloadText('x', 'x.txt')
    expect((s.create.mock.calls[0][0] as Blob).type).toBe(
      'text/plain;charset=utf-8',
    )
  })

  test('honours a custom mime type', () => {
    const s = spy()
    downloadText('<svg/>', 'x.svg', 'image/svg+xml')
    expect((s.create.mock.calls[0][0] as Blob).type).toBe('image/svg+xml')
  })
})

describe('downloadBlob', () => {
  test('clicks a link for the given blob and revokes the URL', () => {
    const s = spy()
    const blob = new Blob(['data'], { type: 'application/json' })
    downloadBlob(blob, 'settings.json')
    expect(s.create).toHaveBeenCalledWith(blob)
    expect(last()?.download).toBe('settings.json')
    expect(s.revoke).toHaveBeenCalledWith('blob:test-url')
  })
})
