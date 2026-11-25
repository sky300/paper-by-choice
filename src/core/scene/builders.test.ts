/**
 * 验证 builders 模块的 pt and box、line、rect and square 行为。
 * Tests builders behavior covering pt and box, line, rect and square.
 */
import { describe, expect, test } from 'vitest'
import {
  arc,
  box,
  circle,
  closePath,
  cubicTo,
  ellipse,
  group,
  image,
  line,
  lineTo,
  moveTo,
  path,
  poly,
  polylinePath,
  pt,
  quadTo,
  rect,
  square,
  text,
} from './builders'
import type { Font, Paint, Stroke } from './types'

const ink: Stroke = { color: '#000000', width: 0.3 }
const red: Paint = { color: '#ff0000' }
const font: Font = { family: 'serif', size: 4 }

describe('pt and box', () => {
  test('pt makes a point', () => {
    expect(pt(1, 2)).toEqual({ x: 1, y: 2 })
  })

  test('box makes a rectangle', () => {
    expect(box(1, 2, 3, 4)).toEqual({ x: 1, y: 2, w: 3, h: 4 })
  })
})

describe('line', () => {
  test('keeps the endpoints and the stroke', () => {
    expect(line(1, 2, 3, 4, ink)).toEqual({
      op: 'line',
      x1: 1,
      y1: 2,
      x2: 3,
      y2: 4,
      stroke: ink,
    })
  })
})

describe('rect and square', () => {
  test('rect takes a stroke and a fill', () => {
    const b = box(1, 2, 3, 4)
    expect(rect(b, ink, red)).toEqual({
      op: 'rect',
      box: b,
      stroke: ink,
      fill: red,
    })
  })

  test('rect leaves out a stroke and fill that are not given', () => {
    expect(rect(box(1, 2, 3, 4))).toStrictEqual({
      op: 'rect',
      box: { x: 1, y: 2, w: 3, h: 4 },
    })
  })

  test('square is a rect with equal sides', () => {
    expect(square(1, 2, 5, ink)).toEqual({
      op: 'rect',
      box: { x: 1, y: 2, w: 5, h: 5 },
      stroke: ink,
    })
  })
})

describe('circle, ellipse and arc', () => {
  test('circle uses the radius on both axes', () => {
    expect(circle(1, 2, 3, ink, red)).toEqual({
      op: 'ellipse',
      cx: 1,
      cy: 2,
      rx: 3,
      ry: 3,
      stroke: ink,
      fill: red,
    })
  })

  test('ellipse leaves out a stroke and fill that are not given', () => {
    expect(ellipse(1, 2, 3, 4)).toStrictEqual({
      op: 'ellipse',
      cx: 1,
      cy: 2,
      rx: 3,
      ry: 4,
    })
  })

  test('arc carries the start and end angles', () => {
    expect(arc(0, 0, 1, 2, 0, Math.PI, ink)).toEqual({
      op: 'ellipse',
      cx: 0,
      cy: 0,
      rx: 1,
      ry: 2,
      start: 0,
      end: Math.PI,
      stroke: ink,
    })
  })
})

describe('poly and path', () => {
  const pts = [pt(0, 0), pt(1, 1)]

  test('poly keeps the points, the closed flag, stroke and fill', () => {
    expect(poly(pts, true, ink, red)).toEqual({
      op: 'poly',
      points: pts,
      closed: true,
      stroke: ink,
      fill: red,
    })
  })

  test('path records closed and leaves out paint that is not given', () => {
    expect(path([moveTo(pt(0, 0))], false)).toStrictEqual({
      op: 'path',
      d: [{ op: 'M', p: { x: 0, y: 0 } }],
      closed: false,
    })
  })
})

describe('text', () => {
  test('a string fill becomes { color }', () => {
    expect(text(1, 2, 'hi', font, '#ff0000')).toEqual({
      op: 'text',
      x: 1,
      y: 2,
      text: 'hi',
      font,
      fill: { color: '#ff0000' },
    })
  })

  test('a paint fill is kept as is', () => {
    expect(text(1, 2, 'hi', font, red).fill).toBe(red)
  })

  test('leaves out anchor, baseline and rotate that are not given', () => {
    expect(text(1, 2, 'hi', font, red)).toStrictEqual({
      op: 'text',
      x: 1,
      y: 2,
      text: 'hi',
      font,
      fill: red,
    })
  })

  test('passes anchor and baseline through', () => {
    const item = text(1, 2, 'hi', font, red, {
      anchor: 'end',
      baseline: 'middle',
    })
    expect(item.anchor).toBe('end')
    expect(item.baseline).toBe('middle')
  })

  test('keeps rotate even when it is 0', () => {
    expect(text(1, 2, 'hi', font, red, { rotate: 0 }).rotate).toBe(0)
  })
})

describe('image and group', () => {
  const b = box(0, 0, 10, 20)
  const items = [line(0, 0, 1, 1, ink)]

  test('image keeps box, src and opacity', () => {
    expect(image(b, 'data:,x', 0.5)).toEqual({
      op: 'image',
      box: b,
      src: 'data:,x',
      opacity: 0.5,
    })
  })

  test('image keeps opacity even when it is 0', () => {
    expect(image(b, 'data:,x', 0).opacity).toBe(0)
  })

  test('image leaves out an opacity that is not given', () => {
    expect(image(b, 'data:,x')).toStrictEqual({
      op: 'image',
      box: b,
      src: 'data:,x',
    })
  })

  test('group keeps its items and opacity', () => {
    expect(group(items, 0.3)).toEqual({ op: 'g', items, opacity: 0.3 })
  })

  test('group leaves out an opacity that is not given', () => {
    expect(group(items)).toStrictEqual({ op: 'g', items })
  })
})

describe('path commands', () => {
  const p0 = pt(0, 0)
  const p1 = pt(1, 1)
  const p2 = pt(2, 2)
  const p3 = pt(3, 3)

  test('moveTo', () => {
    expect(moveTo(p0)).toEqual({ op: 'M', p: p0 })
  })

  test('lineTo', () => {
    expect(lineTo(p1)).toEqual({ op: 'L', p: p1 })
  })

  test('quadTo', () => {
    expect(quadTo(p1, p2)).toEqual({ op: 'Q', c: p1, p: p2 })
  })

  test('cubicTo', () => {
    expect(cubicTo(p1, p2, p3)).toEqual({ op: 'C', c1: p1, c2: p2, p: p3 })
  })

  test('closePath', () => {
    expect(closePath()).toEqual({ op: 'Z' })
  })
})

describe('polylinePath', () => {
  const pts = [pt(0, 0), pt(1, 0), pt(1, 1)]

  test('moves to the first point and lines to each following one', () => {
    expect(polylinePath(pts, false)).toEqual([
      { op: 'M', p: pts[0] },
      { op: 'L', p: pts[1] },
      { op: 'L', p: pts[2] },
    ])
  })

  test('closes with Z when asked', () => {
    expect(polylinePath(pts, true).at(-1)).toEqual({ op: 'Z' })
  })

  test('gives no commands for no points', () => {
    expect(polylinePath([], true)).toEqual([])
  })
})
