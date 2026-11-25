/**
 * 验证 pathData 模块的 resolvePaint、polyToPath、toPathData 行为。
 * Tests pathData behavior covering resolvePaint, polyToPath, toPathData.
 */
import { describe, expect, test } from 'vitest'
import {
  arc,
  closePath,
  cubicTo,
  lineTo,
  moveTo,
  pt,
  quadTo,
} from '../scene/builders'
import type { Paint, PathCommand, Pt, Stroke } from '../scene/types'
import { arcToPath, polyToPath, resolvePaint, toPathData } from './pathData'

const ink: Stroke = { color: '#000000', width: 0.3 }
const red: Paint = { color: '#ff0000' }
const BLACK = { r: 0, g: 0, b: 0 }

/** Expects a point to be at (x, y) within 1e-6. */
function expectPoint(p: Pt, x: number, y: number) {
  expect(p.x).toBeCloseTo(x, 6)
  expect(p.y).toBeCloseTo(y, 6)
}

/** The cubic segments of a path, each as `[p0, p1, p2, p3]`. */
function segments(commands: readonly PathCommand[]): Pt[][] {
  const out: Pt[][] = []
  let current: Pt | undefined
  for (const c of commands) {
    if (c.op === 'M') current = c.p
    if (c.op === 'C' && current) {
      out.push([current, c.c1, c.c2, c.p])
      current = c.p
    }
  }
  return out
}

describe('resolvePaint', () => {
  test('gives null for an absent stroke and an absent fill', () => {
    expect(resolvePaint(undefined, undefined)).toEqual({
      stroke: null,
      fill: null,
    })
  })

  test('fills in the defaults of a stroke and a fill', () => {
    expect(resolvePaint(ink, red)).toEqual({
      stroke: { color: BLACK, width: 0.3, dash: [], opacity: 1 },
      fill: { color: { r: 255, g: 0, b: 0 }, opacity: 1 },
    })
  })

  test('drops a stroke whose width is not a positive finite number', () => {
    for (const width of [0, -1, NaN, Infinity]) {
      expect(resolvePaint({ color: '#000000', width }, red).stroke).toBeNull()
    }
  })

  test('falls back to black when the colour cannot be parsed', () => {
    expect(resolvePaint({ color: 'red', width: 1 }).stroke?.color).toEqual(
      BLACK,
    )
    expect(resolvePaint({ color: '#ABC', width: 1 }).stroke?.color).toEqual({
      r: 170,
      g: 187,
      b: 204,
    })
  })

  test('multiplies the item opacity by the inherited opacity', () => {
    const paint = resolvePaint(
      { color: '#000000', width: 1, opacity: 0.5 },
      red,
      0.5,
    )
    expect(paint.stroke?.opacity).toBe(0.25)
    expect(paint.fill?.opacity).toBe(0.5)
  })

  test('clamps the opacity into [0, 1]', () => {
    const paint = resolvePaint(
      { color: '#000000', width: 1, opacity: 2 },
      { color: '#ffffff', opacity: -1 },
      0.8,
    )
    expect(paint.stroke?.opacity).toBe(1)
    expect(paint.fill?.opacity).toBe(0)
    expect(resolvePaint(ink, red, 1.5).fill?.opacity).toBe(1)
  })

  test('removes non-positive dash entries and clears short or invalid patterns', () => {
    const dashed = { color: '#000000', width: 1, dash: [0, 3, -1, 2] }
    expect(resolvePaint(dashed).stroke?.dash).toEqual([3, 2])
    for (const dash of [[3], [0, 0], [NaN, 2], []]) {
      const pattern = { color: '#000000', width: 1, dash }
      expect(resolvePaint(pattern).stroke?.dash).toEqual([])
    }
  })
})

describe('polyToPath', () => {
  const points = [pt(0, 0), pt(1, 0), pt(1, 1)]

  test('moves to the first point and lines to each following one', () => {
    expect(polyToPath(points, false)).toEqual([
      { op: 'M', p: { x: 0, y: 0 } },
      { op: 'L', p: { x: 1, y: 0 } },
      { op: 'L', p: { x: 1, y: 1 } },
    ])
  })

  test('ends with Z when closed', () => {
    expect(polyToPath(points, true).at(-1)).toEqual({ op: 'Z' })
  })

  test('gives no commands for no points', () => {
    expect(polyToPath([], true)).toEqual([])
  })
})

describe('toPathData', () => {
  const commands = [
    moveTo(pt(1, 2)),
    lineTo(pt(3, 4)),
    quadTo(pt(5, 6), pt(7, 8)),
    cubicTo(pt(9, 10), pt(11, 12), pt(13, 14)),
    closePath(),
  ]

  test('writes absolute commands separated by spaces', () => {
    expect(toPathData(commands)).toBe(
      'M 1 2 L 3 4 Q 5 6 7 8 C 9 10 11 12 13 14 Z',
    )
  })

  test('formats numbers with the requested precision', () => {
    expect(toPathData([moveTo(pt(1 / 3, 0))])).toBe('M 0.333 0')
    expect(toPathData([moveTo(pt(1 / 3, 0))], { precision: 1 })).toBe('M 0.3 0')
  })

  test('replaces every y with flipY - y when flipY is given', () => {
    const path = [moveTo(pt(1, 20)), lineTo(pt(3, 40))]
    expect(toPathData(path, { flipY: 100 })).toBe('M 1 80 L 3 60')
  })

  test('multiplies every coordinate by scale', () => {
    const path = [moveTo(pt(1, 20)), lineTo(pt(3, 40))]
    expect(toPathData(path, { scale: 0.5 })).toBe('M 0.5 10 L 1.5 20')
  })

  test('scales before flipping when both are given', () => {
    const path = [moveTo(pt(1, 20))]
    expect(toPathData(path, { scale: 2, flipY: 100 })).toBe('M 2 60')
  })

  test('gives an empty string for no commands', () => {
    expect(toPathData([])).toBe('')
  })
})

describe('arcToPath', () => {
  const KAPPA = (4 / 3) * (Math.sqrt(2) - 1)
  const quarter = () => arcToPath(arc(0, 0, 1, 1, 0, Math.PI / 2, ink))

  test('a quarter circle is one cubic Bézier with the documented control points', () => {
    const [[p0, p1, p2, p3]] = segments(quarter())
    expectPoint(p0, 1, 0)
    expectPoint(p1, 1, KAPPA)
    expectPoint(p2, KAPPA, 1)
    expectPoint(p3, 0, 1)
  })

  test('starts with M and never closes', () => {
    const path = quarter()
    expect(path[0].op).toBe('M')
    expect(path.some((c) => c.op === 'Z')).toBe(false)
  })

  test('a half circle is two segments ending on the -x axis', () => {
    const segs = segments(arcToPath(arc(0, 0, 1, 1, 0, Math.PI, ink)))
    expect(segs).toHaveLength(2)
    expectPoint(segs[1][3], -1, 0)
  })

  test('a full ellipse is four segments starting on the +x axis', () => {
    const path = arcToPath({ op: 'ellipse', cx: 0, cy: 0, rx: 1, ry: 1 })
    expect(segments(path)).toHaveLength(4)
    expectPoint(segments(path)[0][0], 1, 0)
  })

  test('an arc that spans 2π is expanded like a full ellipse', () => {
    const full = { op: 'ellipse' as const, cx: 0, cy: 0, rx: 1, ry: 1 }
    expect(arcToPath(arc(0, 0, 1, 1, 0, 2 * Math.PI, ink))).toEqual(
      arcToPath(full),
    )
  })

  test('uses rx on the horizontal and ry on the vertical axis', () => {
    const [[, p1, p2]] = segments(
      arcToPath(arc(0, 0, 2, 1, 0, Math.PI / 2, ink)),
    )
    expectPoint(p1, 2, KAPPA)
    expectPoint(p2, 2 * KAPPA, 1)
  })

  test('treats an end below the start as end + 2π', () => {
    const path = arcToPath(arc(0, 0, 1, 1, Math.PI / 2, 0, ink))
    expect(segments(path)).toHaveLength(3)
    expectPoint(segments(path)[0][0], 0, 1)
  })

  test('keeps every segment on the ellipse', () => {
    const segs = segments(
      arcToPath(arc(5, 7, 3, 2, 0.3, 0.3 + 2 * Math.PI, ink)),
    )
    expect(segs).toHaveLength(4)
    for (const [p0, p1, p2, p3] of segs) {
      // Midpoint of a cubic Bézier: (P0 + 3·P1 + 3·P2 + P3) / 8.
      const x = (p0.x + 3 * p1.x + 3 * p2.x + p3.x) / 8
      const y = (p0.y + 3 * p1.y + 3 * p2.y + p3.y) / 8
      expect(((x - 5) / 3) ** 2 + ((y - 7) / 2) ** 2).toBeCloseTo(1, 2)
    }
  })
})
