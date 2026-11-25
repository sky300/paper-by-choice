import { describe, expect, test } from 'vitest'
import {
  buildDocument,
  contentArea,
  pageNumberItem,
  paperScene,
} from './document'
import type { ComposeInput } from './document'
import { createSettings } from '../settings'
import { resolvePageSize } from '../settings'
import { findPaper, PAPER_ORDER } from '../papers/registry'
import { shapesOf } from '../testing/paperTestKit'
import type { Locale, PaperType, Settings } from '../types'

const A4 = { width: 210, height: 297 }

/** Lined settings with a fixed 20 mm margin, so these geometry tests do not
 * depend on the paper's default look. */
function lined(patch: Partial<Settings> = {}): Settings {
  return {
    ...createSettings('lined'),
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    ...patch,
  }
}

const input = (settings: Settings, locale: Locale = 'zh-CN'): ComposeInput => ({
  settings,
  locale,
})

describe('contentArea', () => {
  test('subtracts all four margins from the page', () => {
    expect(
      contentArea(A4, { top: 20, right: 20, bottom: 20, left: 20 }),
    ).toEqual({ x: 20, y: 20, w: 170, h: 257 })
  })

  test('uses asymmetric margins', () => {
    expect(
      contentArea(A4, { top: 5, right: 10, bottom: 15, left: 25 }),
    ).toEqual({ x: 25, y: 5, w: 175, h: 277 })
  })
})

describe('paperScene: single column', () => {
  test('draws only horizontal rules spanning the writing area', () => {
    const scene = paperScene(lined(), 'zh-CN')
    const lines = shapesOf(scene, 'line')
    expect(lines).toHaveLength(32)
    expect(scene).toHaveLength(32)
    expect(lines.every((item) => item.y1 === item.y2)).toBe(true)
    expect(lines.every((item) => item.x1 === 20 && item.x2 === 190)).toBe(true)
    expect(shapesOf(scene, 'text')).toHaveLength(0)
  })
})

describe('paperScene: two columns', () => {
  const two = (divider = 'solid') =>
    lined({
      options: { columns: { count: '2', gap: 8, divider } },
    })

  test('splits the rules into two non-overlapping groups with a divider', () => {
    const scene = paperScene(two(), 'zh-CN')
    const lines = shapesOf(scene, 'line')
    const horizontal = lines.filter((item) => item.y1 === item.y2)
    const vertical = lines.filter((item) => item.x1 === item.x2)
    // 20 mm margins leave 170 mm; column width = (170 − 8) / 2 = 81 mm.
    const left = horizontal.filter((item) => item.x1 === 20)
    const right = horizontal.filter((item) => item.x1 === 109)
    expect(horizontal).toHaveLength(64)
    expect(left).toHaveLength(32)
    expect(right).toHaveLength(32)
    expect(left.every((item) => item.x2 === 101)).toBe(true)
    expect(right.every((item) => item.x2 === 190)).toBe(true)
    expect(Math.max(...left.map((item) => item.x2))).toBeLessThan(
      Math.min(...right.map((item) => item.x1)),
    )
    expect(vertical).toHaveLength(1)
    expect(vertical[0]).toMatchObject({ x1: 105, x2: 105, y1: 20, y2: 277 })
  })

  test('dashes the divider when the option asks for it', () => {
    const scene = paperScene(two('dashed'), 'zh-CN')
    const vertical = shapesOf(scene, 'line').filter(
      (item) => item.x1 === item.x2,
    )
    expect(vertical).toHaveLength(1)
    expect(vertical[0].stroke.dash).toEqual([3, 2])
  })

  test('uses the user line colour and width on the divider', () => {
    const scene = paperScene(
      lined({
        line: { ...createSettings('lined').line, color: '#ff0000', width: 0.5 },
        options: { columns: { count: '2', gap: 8, divider: 'solid' } },
      }),
      'zh-CN',
    )
    const vertical = shapesOf(scene, 'line').filter(
      (item) => item.x1 === item.x2,
    )
    expect(vertical[0].stroke).toMatchObject({ color: '#ff0000', width: 0.5 })
  })
})

describe('paperScene: unregistered paper types', () => {
  test('returns an empty scene for a paper that is not registered yet', () => {
    const absent = PAPER_ORDER.find((type) => !findPaper(type))
    // The registry is filled in by parallel tasks; use a definitely-absent key
    // if every declared type happens to be present already.
    const type = (absent ?? '__absent_paper__') as unknown as PaperType
    expect(paperScene(lined({ paperType: type }), 'zh-CN')).toEqual([])
  })
})

describe('pageNumberItem', () => {
  const numbering = lined({
    pages: { count: 3, numbering: true, startNumber: 5 },
  })

  test('is null when numbering is off', () => {
    expect(pageNumberItem(lined(), A4, 0)).toBeNull()
  })

  test('prints current page / last page with the start-number offset', () => {
    expect(pageNumberItem(numbering, A4, 0)?.text).toBe('5 / 7')
    expect(pageNumberItem(numbering, A4, 1)?.text).toBe('6 / 7')
    expect(pageNumberItem(numbering, A4, 2)?.text).toBe('7 / 7')
  })

  test('is centred at the bottom, independent of margins', () => {
    const withMargins = lined({
      margins: { top: 40, right: 40, bottom: 40, left: 40 },
      pages: { count: 3, numbering: true, startNumber: 5 },
    })
    const item = pageNumberItem(withMargins, A4, 0)
    expect(item).toMatchObject({
      x: 105,
      y: 294.35,
      anchor: 'middle',
      fill: { color: '#666666' },
    })
    expect(item?.font.size).toBe(3.2)
  })
})

describe('buildDocument', () => {
  test('reports the resolved page size and one page per requested count', () => {
    const settings = lined({
      pages: { count: 3, numbering: false, startNumber: 1 },
    })
    const doc = buildDocument(input(settings))
    expect(doc.pageSize).toEqual(resolvePageSize(settings))
    expect(doc.pages).toHaveLength(3)
    for (const page of doc.pages) {
      expect(page.width).toBe(A4.width)
      expect(page.height).toBe(A4.height)
    }
  })

  test('shares one base scene across pages when numbering is off', () => {
    const doc = buildDocument(
      input(lined({ pages: { count: 3, numbering: false, startNumber: 1 } })),
    )
    expect(doc.pages[0].scene).toBe(doc.pages[1].scene)
    expect(doc.pages[1].scene).toBe(doc.pages[2].scene)
    expect(doc.pages[0].scene.length).toBeGreaterThan(0)
  })

  test('adds only a differing page number to each page when numbering is on', () => {
    const doc = buildDocument(
      input(lined({ pages: { count: 3, numbering: true, startNumber: 5 } })),
    )
    const [a, b, c] = doc.pages
    expect(a.scene.slice(0, -1)).toEqual(b.scene.slice(0, -1))
    expect(b.scene.slice(0, -1)).toEqual(c.scene.slice(0, -1))
    expect(shapesOf(a.scene.slice(-1), 'text')[0].text).toBe('5 / 7')
    expect(shapesOf(b.scene.slice(-1), 'text')[0].text).toBe('6 / 7')
    expect(shapesOf(c.scene.slice(-1), 'text')[0].text).toBe('7 / 7')
  })

  test('clamps the page count into 1–100', () => {
    const zero = buildDocument(
      input(lined({ pages: { count: 0, numbering: false, startNumber: 1 } })),
    )
    const many = buildDocument(
      input(lined({ pages: { count: 250, numbering: false, startNumber: 1 } })),
    )
    expect(zero.pages).toHaveLength(1)
    expect(many.pages).toHaveLength(100)
  })

  test('tolerates a paper type that is not registered yet', () => {
    const type = '__absent_paper__' as unknown as PaperType
    const doc = buildDocument(input(lined({ paperType: type })))
    expect(doc.pages).toHaveLength(1)
    // Background fill is still drawn even without a paper.
    expect(shapesOf(doc.pages[0].scene, 'rect').length).toBeGreaterThan(0)
  })
})
