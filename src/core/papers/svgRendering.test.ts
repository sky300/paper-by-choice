// @vitest-environment node
/// <reference types="node" />
import { describe, expect, test } from 'vitest'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { papers } from './registry'
import { createSettings } from '../settings'
import { PAPER_LOOKS } from '../paperLooks'
import { buildDocument } from '../compose/document'
import { pageToSvg } from '../render/svg'
import { expectFiniteNumbers } from '../testing/paperTestKit'

const OUT_DIR = join(process.cwd(), '.dev', 'checks', 'svg')

/**
 * Verification of the real rendering path for every registered paper: the
 * exact same SVG the app previews and exports. Writes one file per paper so a
 * human can open them, and asserts the structure of each one.
 */
describe('SVG rendering of every paper', () => {
  test('all 41 papers produce a valid stand-alone SVG', () => {
    mkdirSync(OUT_DIR, { recursive: true })
    expect(papers).toHaveLength(41)

    for (const paper of papers) {
      const settings = createSettings(paper.type)
      const doc = buildDocument({ settings, locale: 'zh-CN' })
      const svg = pageToSvg(doc.pages[0])
      const file = join(OUT_DIR, `${paper.type}.svg`)
      writeFileSync(file, svg, 'utf8')

      expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(
        true,
      )
      expect(svg).toContain(
        `width="${doc.pageSize.width}mm" height="${doc.pageSize.height}mm"`,
      )
      expect(svg).toContain(
        `viewBox="0 0 ${doc.pageSize.width} ${doc.pageSize.height}"`,
      )
      expect(svg.trimEnd().endsWith('</svg>')).toBe(true)
      expect(svg).not.toContain('NaN')
      expect(svg).not.toContain('Infinity')
      // The reference default line colour must actually reach the output,
      // except for blank paper which deliberately draws no lines at all.
      if (paper.type !== 'blank') {
        expect(svg.toLowerCase()).toContain(
          PAPER_LOOKS[paper.type].lineColor.toLowerCase(),
        )
      }
      expectFiniteNumbers(doc.pages[0].scene)
    }
  })

  test('two-column and watermark settings change the exported SVG', () => {
    const base = createSettings('lined')
    const twoColumn = {
      ...base,
      options: { columns: { count: '2', gap: 8, divider: 'solid' } },
    }
    const withMark = {
      ...base,
      watermark: { ...base.watermark, enabled: true, text: 'DRAFT' },
    }
    const a = pageToSvg(
      buildDocument({ settings: base, locale: 'en' }).pages[0],
    )
    const b = pageToSvg(
      buildDocument({ settings: twoColumn, locale: 'en' }).pages[0],
    )
    const c = pageToSvg(
      buildDocument({ settings: withMark, locale: 'en' }).pages[0],
    )
    expect(b).not.toBe(a)
    expect(c).toContain('DRAFT')
    writeFileSync(join(OUT_DIR, 'lined-two-column.svg'), b, 'utf8')
    writeFileSync(join(OUT_DIR, 'lined-watermark.svg'), c, 'utf8')
  })
})
