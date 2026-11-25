// @vitest-environment node
/// <reference types="node" />
import { describe, expect, test } from 'vitest'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { createSettings } from '../settings'
import { buildDocument } from '../compose/document'
import { buildPdf, type TextRasterizer } from '../render/pdf'
import { mergeSvg, exportFileName } from '../../ui/export/exporters'
import { papers } from './registry'

const OUT_DIR = join(process.cwd(), '.dev', 'checks', 'export')

/** A tiny transparent PNG; the real (DOM-based) rasterizer is browser-only. */
const PNG_1X1 = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
)
const nodeRasterizer: TextRasterizer = async () => ({
  png: PNG_1X1,
  dpi: 600,
  widthPx: 1,
  heightPx: 1,
  dx: 0,
  dy: 0,
})

/**
 * End-to-end check of the real export path: a composed document is turned into
 * an actual PDF and a multi-page SVG, both written to disk for inspection.
 */
describe('real exports', () => {
  test('a two-page PDF has exact A4 pages and readable metadata', async () => {
    mkdirSync(OUT_DIR, { recursive: true })
    const settings = {
      ...createSettings('music'),
      pages: { count: 2, numbering: true, startNumber: 1 },
    }
    const doc = buildDocument({ settings, locale: 'zh-CN' })
    const bytes = await buildPdf(doc.pages, {
      textRasterizer: nodeRasterizer,
      title: 'Paper by Choice',
    })
    const file = join(OUT_DIR, exportFileName(settings, 'pdf'))
    writeFileSync(file, bytes)

    expect(new TextDecoder().decode(bytes.subarray(0, 5))).toBe('%PDF-')
    const pdf = await PDFDocument.load(bytes)
    expect(pdf.getPageCount()).toBe(2)
    for (const page of pdf.getPages()) {
      const { width, height } = page.getSize()
      expect(width).toBeCloseTo(210 * (72 / 25.4), 1)
      expect(height).toBeCloseTo(297 * (72 / 25.4), 1)
    }
    expect(pdf.getTitle()).toBe('Paper by Choice')
  })

  test('a multi-page SVG has all pages and no NaN', () => {
    const settings = {
      ...createSettings('grid'),
      pages: { count: 3, numbering: true, startNumber: 1 },
    }
    const doc = buildDocument({ settings, locale: 'en' })
    const svg = mergeSvg(doc)
    writeFileSync(join(OUT_DIR, 'grid-three-pages.svg'), svg, 'utf8')
    expect(svg).toContain('height="911mm"') // 3 × 297 + 2 × 10
    expect((svg.match(/<g transform="translate\(0, /g) ?? []).length).toBe(3)
    expect(svg).not.toContain('NaN')
    expect(svg).not.toContain('Infinity')
  })

  test('every registered paper can build a document without throwing', () => {
    expect(papers).toHaveLength(41)
    for (const paper of papers) {
      const doc = buildDocument({
        settings: createSettings(paper.type),
        locale: 'zh-CN',
      })
      expect(doc.pages.length).toBeGreaterThan(0)
      expect(doc.pageSize.width).toBeGreaterThan(0)
      expect(doc.pageSize.height).toBeGreaterThan(0)
    }
  })
})
