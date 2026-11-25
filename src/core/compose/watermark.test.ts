import { describe, expect, test } from 'vitest'
import { rotatePoint, watermarkScene } from './watermark'
import type { PageSize } from './document'
import { createSettings } from '../settings'
import { shapesOf } from '../testing/paperTestKit'
import type { Settings, WatermarkSettings } from '../types'

/** Default settings with only the watermark section replaced. */
function withWatermark(patch: Partial<WatermarkSettings>): Settings {
  const base = createSettings('lined')
  return { ...base, watermark: { ...base.watermark, ...patch } }
}

/** Text items of a scene with the group, if any, opened. */
function texts(scene: ReturnType<typeof watermarkScene>) {
  return shapesOf(scene, 'text')
}

describe('rotatePoint', () => {
  test('rotates a point 90° clockwise: right of centre lands below centre', () => {
    const centre = { x: 8, y: 8 }
    const right = { x: 12, y: 8 }
    const rotated = rotatePoint(right, centre, 90)
    expect(rotated.x).toBeCloseTo(8)
    expect(rotated.y).toBeCloseTo(12)
  })

  test('leaves a point where it is at 0°', () => {
    const centre = { x: 50, y: 50 }
    const p = { x: 53, y: 47 }
    const rotated = rotatePoint(p, centre, 0)
    expect(rotated.x).toBeCloseTo(53)
    expect(rotated.y).toBeCloseTo(47)
  })
})

describe('watermarkScene: when it draws', () => {
  test('returns an empty scene when the watermark is disabled', () => {
    expect(
      watermarkScene(withWatermark({ enabled: false, text: 'X' }), {
        width: 20,
        height: 20,
      }),
    ).toEqual([])
  })

  test('returns an empty scene when the text is empty', () => {
    expect(
      watermarkScene(withWatermark({ enabled: true, text: '' }), {
        width: 20,
        height: 20,
      }),
    ).toEqual([])
  })

  test('returns an empty scene for whitespace-only text', () => {
    expect(
      watermarkScene(withWatermark({ enabled: true, text: '   ' }), {
        width: 20,
        height: 20,
      }),
    ).toEqual([])
  })
})

describe('watermarkScene: grid', () => {
  // 20×12 page, text "AB" (L = 2), F = 4 => U = 0.6·4·2 = 4.8.
  // x: −4.8 … 24.8 step 9.6 => −4.8, 4.8, 14.4, 24.0 (4 columns)
  // y: −4 … 16 step 12 => −4, 8 (2 rows) => 8 text items.
  const settings = withWatermark({
    enabled: true,
    text: 'AB',
    size: 4,
    angle: 0,
    opacity: 0.15,
    color: '#888888',
  })
  const page: PageSize = { width: 20, height: 12 }

  test('lays out the hand-computed text grid at 0°', () => {
    const items = texts(watermarkScene(settings, page))
    expect(items).toHaveLength(8)
    const xs = [...new Set(items.map((item) => item.x))].sort((a, b) => a - b)
    const ys = [...new Set(items.map((item) => item.y))].sort((a, b) => a - b)
    expect(xs).toHaveLength(4)
    expect(ys).toHaveLength(2)
    expect(xs[0]).toBeCloseTo(-4.8)
    expect(xs[1]).toBeCloseTo(4.8)
    expect(xs[2]).toBeCloseTo(14.4)
    expect(xs[3]).toBeCloseTo(24)
    expect(ys[0]).toBeCloseTo(-4)
    expect(ys[1]).toBeCloseTo(8)
    expect(items.every((item) => item.anchor === 'start')).toBe(true)
    expect(items.every((item) => item.text === 'AB')).toBe(true)
  })

  test('wraps all texts in one group whose opacity is watermark.opacity', () => {
    const scene = watermarkScene(settings, page)
    expect(scene).toHaveLength(1)
    expect(scene[0]).toMatchObject({ op: 'g', opacity: 0.15 })
  })

  test('uses the theme body font at the watermark size and colour', () => {
    const item = texts(watermarkScene(settings, page))[0]
    expect(item.font.size).toBe(4)
    expect(item.fill).toEqual({ color: '#888888' })
  })

  test('sets every text rotate to the watermark angle', () => {
    const items = texts(
      watermarkScene(withWatermark({ enabled: true, text: 'X', angle: 30 }), {
        width: 20,
        height: 20,
      }),
    )
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((item) => item.rotate === 30)).toBe(true)
  })

  test('turns multiline text into a single line without newlines', () => {
    const items = texts(
      watermarkScene(
        withWatermark({ enabled: true, text: 'A\nB', angle: 0 }),
        page,
      ),
    )
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((item) => item.text === 'A B')).toBe(true)
    expect(items.every((item) => !item.text.includes('\n'))).toBe(true)
  })

  test('moves a point right of centre below centre at 90°', () => {
    // 16×16 page, centre (8,8), F = 4, text "X" => U = 2.4.
    // x: −2.4 … 18.4 step 4.8 => −2.4, 2.4, 7.2, 12, 16.8
    // y: −4 … 20 step 12 => −4, 8, 20  (endpoint 20 is included)
    // grid (12, 8) is directly right of centre; at 90° it becomes (8, 12).
    const items = texts(
      watermarkScene(
        withWatermark({ enabled: true, text: 'X', size: 4, angle: 90 }),
        { width: 16, height: 16 },
      ),
    )
    expect(items).toHaveLength(15)
    const below = items.find(
      (item) => Math.abs(item.x - 8) < 1e-9 && Math.abs(item.y - 12) < 1e-9,
    )
    expect(below).toBeDefined()
    expect(items.every((item) => item.rotate === 90)).toBe(true)
  })
})
