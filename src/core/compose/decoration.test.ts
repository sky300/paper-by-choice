import { describe, expect, test } from 'vitest'
import { decorationDash, decorationScene } from './decoration'
import type { PageSize } from './document'
import { createSettings } from '../settings'
import { shapesOf } from '../testing/paperTestKit'
import type { DecorationSettings, Settings } from '../types'
import type { Box } from '../scene/types'

const A4: PageSize = { width: 210, height: 297 }
const CONTENT: Box = { x: 20, y: 20, w: 170, h: 257 }

type DecoPatch = Partial<Omit<DecorationSettings, 'sides'>> & {
  sides?: Partial<DecorationSettings['sides']>
}

/** Default settings, decoration enabled, with the given section replaced. */
function withDecoration(patch: DecoPatch = {}): Settings {
  const base = createSettings('lined')
  const { sides, ...rest } = patch
  return {
    ...base,
    decoration: {
      ...base.decoration,
      enabled: true,
      ...rest,
      sides: { ...base.decoration.sides, ...(sides ?? {}) },
    },
  }
}

describe('decorationDash', () => {
  test('returns no dash for a solid line', () => {
    expect(decorationDash('solid', 0.4)).toBeUndefined()
  })

  test('returns [1.3, 1.3] for a dashed line', () => {
    expect(decorationDash('dashed', 0.4)).toEqual([1.3, 1.3])
  })

  test('returns a width-proportional dot with a 0.55 gap for a dotted line', () => {
    expect(decorationDash('dotted', 0.4)).toEqual([0.48, 0.55])
    expect(decorationDash('dotted', 0.1)).toEqual([0.25, 0.55])
  })
})

describe('decorationScene: enabled switch and layer', () => {
  test('returns an empty scene when decoration is disabled', () => {
    const settings = withDecoration({ enabled: false })
    expect(decorationScene(settings, A4, CONTENT)).toEqual([])
  })

  test('wraps the whole layer in one group whose opacity is decoration.opacity', () => {
    const scene = decorationScene(
      withDecoration({ opacity: 0.65 }),
      A4,
      CONTENT,
    )
    expect(scene).toHaveLength(1)
    expect(scene[0]).toMatchObject({ op: 'g', opacity: 0.65 })
  })
})

describe('decorationScene: simple / calligraphy', () => {
  test('draws one independent line per enabled side', () => {
    const scene = decorationScene(
      withDecoration({ style: 'simple', scope: 'page', inset: 3 }),
      A4,
      CONTENT,
    )
    const lines = shapesOf(scene, 'line')
    expect(lines).toHaveLength(4)
  })

  test('bases a page-scope rectangle on the page minus inset on each side', () => {
    const lines = shapesOf(
      decorationScene(
        withDecoration({ style: 'simple', scope: 'page', inset: 3 }),
        A4,
        CONTENT,
      ),
      'line',
    )
    // b = { x: 3, y: 3, w: 204, h: 291 }
    expect(lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ x1: 3, y1: 3, x2: 207, y2: 3 }),
        expect.objectContaining({ x1: 207, y1: 3, x2: 207, y2: 294 }),
        expect.objectContaining({ x1: 207, y1: 294, x2: 3, y2: 294 }),
        expect.objectContaining({ x1: 3, y1: 294, x2: 3, y2: 3 }),
      ]),
    )
  })

  test('bases a content-scope rectangle on the writing area minus inset', () => {
    const lines = shapesOf(
      decorationScene(
        withDecoration({ style: 'simple', scope: 'content', inset: 3 }),
        A4,
        CONTENT,
      ),
      'line',
    )
    // b = { x: 23, y: 23, w: 164, h: 251 }, right 187, bottom 274
    expect(lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ x1: 23, y1: 23, x2: 187, y2: 23 }),
        expect.objectContaining({ x1: 187, y1: 23, x2: 187, y2: 274 }),
        expect.objectContaining({ x1: 187, y1: 274, x2: 23, y2: 274 }),
        expect.objectContaining({ x1: 23, y1: 274, x2: 23, y2: 23 }),
      ]),
    )
  })

  test('drops exactly one line when one side is switched off', () => {
    const scene = decorationScene(
      withDecoration({
        style: 'simple',
        scope: 'page',
        inset: 3,
        sides: { right: false },
      }),
      A4,
      CONTENT,
    )
    expect(shapesOf(scene, 'line')).toHaveLength(3)
  })

  test('uses the decoration colour, width and dash on every side', () => {
    const lines = shapesOf(
      decorationScene(
        withDecoration({
          style: 'calligraphy',
          scope: 'page',
          inset: 0,
          color: '#8a6f4d',
          width: 0.4,
          lineStyle: 'dashed',
        }),
        A4,
        CONTENT,
      ),
      'line',
    )
    expect(lines.length).toBeGreaterThan(0)
    expect(
      lines.every(
        (item) =>
          item.stroke.color === '#8a6f4d' &&
          item.stroke.width === 0.4 &&
          item.stroke.dash?.[0] === 1.3,
      ),
    ).toBe(true)
  })

  test('returns an empty scene when inset collapses the rectangle', () => {
    const scene = decorationScene(
      withDecoration({ style: 'simple', scope: 'page', inset: 6 }),
      { width: 10, height: 10 },
      CONTENT,
    )
    expect(scene).toEqual([])
  })
})

describe('decorationScene: double', () => {
  test('draws an outer frame and an inner frame 2 mm inside it', () => {
    const lines = shapesOf(
      decorationScene(
        withDecoration({ style: 'double', scope: 'page', inset: 3 }),
        A4,
        CONTENT,
      ),
      'line',
    )
    // outer {3,3,204,291}, inner {5,5,200,287}
    expect(lines).toHaveLength(8)
    expect(lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ x1: 3, y1: 3, x2: 207, y2: 3 }),
        expect.objectContaining({ x1: 5, y1: 5, x2: 205, y2: 5 }),
      ]),
    )
  })

  test('skips the inner frame when it would be too small', () => {
    const lines = shapesOf(
      decorationScene(
        withDecoration({ style: 'double', scope: 'page', inset: 3 }),
        { width: 10, height: 100 },
        CONTENT,
      ),
      'line',
    )
    // outer w = 4 => inner w = 0, so only the outer four lines survive.
    expect(lines).toHaveLength(4)
  })
})

describe('decorationScene: corner', () => {
  test('draws four corner ornaments even when every side is switched off', () => {
    const scene = decorationScene(
      withDecoration({
        style: 'corner',
        scope: 'page',
        inset: 8,
        sides: { top: false, right: false, bottom: false, left: false },
        cornerOrnaments: true,
      }),
      A4,
      CONTENT,
    )
    expect(shapesOf(scene, 'line')).toHaveLength(0)
    expect(shapesOf(scene, 'poly')).toHaveLength(4)
  })

  test('uses the documented arm length a = min(6, max(3, 0.75·inset), w/4, h/4)', () => {
    const polys = shapesOf(
      decorationScene(
        withDecoration({ style: 'corner', scope: 'page', inset: 8 }),
        { width: 100, height: 100 },
        CONTENT,
      ),
      'poly',
    )
    // inset 8 => a = min(6, 6, 21, 21) = 6; top-left at (8,8).
    const topLeft = polys.find((poly) =>
      poly.points.some((p) => p.x === 8 && p.y === 8),
    )
    expect(topLeft).toBeDefined()
    expect(topLeft?.points).toEqual([
      { x: 8, y: 14 },
      { x: 8, y: 8 },
      { x: 14, y: 8 },
    ])
    expect(topLeft?.closed).toBe(false)
  })
})

describe('decorationScene: scalloped', () => {
  const thinEdge = withDecoration({
    style: 'scalloped',
    scope: 'page',
    inset: 0,
    sides: { top: true, right: false, bottom: false, left: false },
  })
  const edgePage: PageSize = { width: 180, height: 180 }

  test('draws a faint baseline and 30 scallop segments on a 180 mm edge', () => {
    const scene = decorationScene(thinEdge, edgePage, CONTENT)
    const lines = shapesOf(scene, 'line')
    const scallops = scene
      .flatMap((item) => (item.op === 'g' ? item.items : [item]))
      .filter((item) => item.op !== 'line')
    // A = max(1, 0) = 1, span 1→179 = 178, /6 => 29 full + 1 short = 30.
    expect(lines).toHaveLength(1)
    expect(lines[0].stroke.width).toBe(0.13)
    expect(lines[0].stroke.opacity).toBe(0.85)
    expect(scallops).toHaveLength(30)
  })

  test.each([
    ['wave', 'path'],
    ['meander', 'poly'],
    ['beads', 'ellipse'],
  ] as const)('%s scallops are %s items', (pattern, op) => {
    const scene = decorationScene(
      withDecoration({
        style: 'scalloped',
        scope: 'page',
        inset: 0,
        scallopPattern: pattern,
        sides: { top: true, right: false, bottom: false, left: false },
      }),
      edgePage,
      CONTENT,
    )
    const scallops = scene
      .flatMap((item) => (item.op === 'g' ? item.items : [item]))
      .filter((item) => item.op !== 'line')
    expect(scallops.length).toBeGreaterThan(0)
    expect(scallops.every((item) => item.op === op)).toBe(true)
  })
})
