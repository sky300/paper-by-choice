// @vitest-environment happy-dom
import { describe, expect, test, vi } from 'vitest'
import { createSettings } from '../../core/settings'
import type { ComposedDocument } from '../../core/compose/document'
import { line } from '../../core/scene/builders'
import {
  exportFileName,
  exportPdf,
  exportPng,
  exportSvg,
  mergeSvg,
} from './exporters'

const doc: ComposedDocument = {
  pageSize: { width: 210, height: 297 },
  pages: [
    {
      width: 210,
      height: 297,
      scene: [line(10, 20, 100, 20, { color: '#333333', width: 0.2 })],
    },
    {
      width: 210,
      height: 297,
      scene: [line(10, 40, 100, 40, { color: '#333333', width: 0.2 })],
    },
  ],
}
const settings = createSettings('lined')

describe('exportFileName', () => {
  test('includes the paper type, upper-case size and a date', () => {
    expect(exportFileName(settings, 'pdf', new Date(2026, 10, 24))).toBe(
      'paper-by-choice-lined-A4-20261124.pdf',
    )
  })

  test('uses width×height for a custom size', () => {
    const custom = {
      ...settings,
      paperSize: 'custom' as const,
      customSize: { width: 200, height: 280 },
    }
    expect(exportFileName(custom, 'svg', new Date(2026, 0, 3))).toBe(
      'paper-by-choice-lined-200x280mm-20260103.svg',
    )
  })
})

describe('mergeSvg', () => {
  test('stacks pages with a 10 mm gutter', () => {
    const svg = mergeSvg(doc)
    expect(svg).toContain('width="210mm" height="604mm"')
    expect(svg).toContain('viewBox="0 0 210 604"')
    expect(svg).toContain('transform="translate(0, 0)"')
    expect(svg).toContain('transform="translate(0, 307)"')
    expect(svg.match(/<line /g)).toHaveLength(2)
  })
})

describe('exports', () => {
  test('SVG downloads one file with the right mime type', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    const result = await exportSvg(doc, settings)
    expect(result.files).toBe(1)
    expect(result.filename).toMatch(/\.svg$/)
    expect(click).toHaveBeenCalledOnce()
    spy.mockRestore()
    revoke.mockRestore()
    click.mockRestore()
  })

  test('PNG downloads one file per page with a zero-padded index', async () => {
    const download = vi.fn()
    const rasterizePage = vi.fn(async () => ({
      canvas: {
        width: 10,
        height: 10,
        convertToBlob: async () => new Blob(['x'], { type: 'image/png' }),
      },
      context: {},
      widthPx: 10,
      heightPx: 10,
    })) as never
    const result = await exportPng(doc, settings, 150, {
      rasterizePage,
      download,
    })
    expect(result.files).toBe(2)
    expect(download).toHaveBeenCalledTimes(2)
    expect(download.mock.calls[0][1]).toMatch(/-1\.png$/)
    expect(download.mock.calls[1][1]).toMatch(/-2\.png$/)
  })

  test('PDF downloads one application/pdf blob', async () => {
    const download = vi.fn()
    const buildPdf = vi.fn(
      async () => new Uint8Array([37, 80, 68, 70]),
    ) as never
    const result = await exportPdf(doc, settings, { buildPdf, download })
    expect(result.files).toBe(1)
    expect(download).toHaveBeenCalledOnce()
    expect(download.mock.calls[0][0].type).toBe('application/pdf')
  })
})
