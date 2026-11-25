/**
 * 逐个验证纸型的 SVG 输出。
 * Checks SVG output across paper types.
 */
// @vitest-environment node
/// <reference types="node" />
import { describe, expect, test } from 'vitest'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { papers } from './registry'
import { createSettings, sanitizeSettings } from '../settings'
import { PAPER_LOOKS } from '../paperLooks'
import { buildDocument } from '../compose/document'
import { pageToSvg } from '../render/svg'
import { expectFiniteNumbers, shapesOf } from '../testing/paperTestKit'

const OUT_DIR = join(process.cwd(), '.dev', 'checks', 'svg')

/**
 * Verification of the real rendering path for every registered paper: the
 * exact same SVG the app previews and exports. Writes one file per paper so a
 * human can open them, and asserts the structure of each one.
 */
describe('SVG rendering of every paper', () => {
  test('all 48 papers produce a valid stand-alone SVG', () => {
    mkdirSync(OUT_DIR, { recursive: true })
    expect(papers).toHaveLength(48)

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

  test('renders the 20 mm pinyin row pitch after settings round-trip', () => {
    const settings = sanitizeSettings(createSettings('pinyin_paper'))
    expect(settings.line.spacing).toBe(20)
    const grid = shapesOf(
      buildDocument({ settings, locale: 'zh-CN' }).pages[0].scene,
      'rect',
    ).find((item) => item.stroke)
    expect(grid?.box).toMatchObject({ x: 25, y: 50, w: 160, h: 220 })
  })

  test('keeps the lower pinyin-tianzi writing cell square', () => {
    const settings = createSettings('pinyin_tianzi')
    const [{ scene }] = buildDocument({ settings, locale: 'zh-CN' }).pages
    const cell = shapesOf(scene, 'rect').find((item) => item.stroke)!
    const separator = shapesOf(scene, 'line')[0]
    expect(cell.box.w).toBe(20)
    expect(cell.box.y + cell.box.h - separator.y1).toBeCloseTo(cell.box.w)
  })

  test('draws 16 mm gaps between the four-line calligraphy template rules', () => {
    const settings = createSettings('calligraphy_practice', 'cp_four_row_16')
    const [{ scene }] = buildDocument({ settings, locale: 'zh-CN' }).pages
    const rules = shapesOf(scene, 'line')
    expect(rules[1].y1 - rules[0].y1).toBeCloseTo(16)
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
