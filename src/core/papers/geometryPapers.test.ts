import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  horizontalPositions,
  renderPaper,
  shapesOf,
  verticalPositions,
} from '../testing/paperTestKit'
import { box } from '../scene/builders'

describe('isometric', () => {
  test('default render is non-empty and inside the writing area', () => {
    const { shapes, ctx } = renderPaper('isometric')
    expect(shapes.length).toBeGreaterThan(10)
    expectInside(shapes, box(0, 0, ctx.page.width, ctx.page.height))
    expectFiniteNumbers(shapes)
  })

  test('spacing changes the horizontal line count', () => {
    const fine = renderPaper('isometric', { spacing: 3 })
    const coarse = renderPaper('isometric', { spacing: 15 })
    expect(horizontalPositions(fine.scene).length).toBeGreaterThan(
      horizontalPositions(coarse.scene).length,
    )
  })

  test('draws two families of diagonal lines', () => {
    const { shapes } = renderPaper('isometric')
    const lines = shapesOf(shapes, 'line')
    const slanted = lines.filter(
      (l) => Math.abs(l.y2 - l.y1) > 1 && Math.abs(l.x2 - l.x1) > 1,
    )
    expect(slanted.length).toBeGreaterThan(10)
  })

  test('A5 landscape still renders inside the page', () => {
    const { shapes, ctx } = renderPaper('isometric', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expectInside(shapes, box(0, 0, ctx.page.width, ctx.page.height))
    expectFiniteNumbers(shapes)
  })
})

describe('hexagonal', () => {
  test('default render is non-empty and inside the page', () => {
    const { shapes, ctx } = renderPaper('hexagonal')
    expect(shapes.length).toBeGreaterThan(20)
    expectInside(shapes, box(0, 0, ctx.page.width, ctx.page.height))
    expectFiniteNumbers(shapes)
  })

  test('spacing changes the number of hexagons', () => {
    const fine = renderPaper('hexagonal', { spacing: 4 })
    const coarse = renderPaper('hexagonal', { spacing: 12 })
    expect(shapesOf(fine.scene, 'poly').length).toBeGreaterThan(
      shapesOf(coarse.scene, 'poly').length,
    )
  })

  test('draws a border and a label', () => {
    const { shapes } = renderPaper('hexagonal')
    expect(shapesOf(shapes, 'rect').length).toBeGreaterThan(0)
    expect(shapesOf(shapes, 'text').length).toBeGreaterThan(0)
  })
})

describe('seyes', () => {
  test('default render is non-empty and inside the writing area', () => {
    const { shapes, ctx } = renderPaper('seyes')
    expect(shapes.length).toBeGreaterThan(30)
    expectInside(shapes, box(0, 0, ctx.page.width, ctx.page.height))
    expectFiniteNumbers(shapes)
  })

  test('spacing has no effect on the fixed 8 mm grid', () => {
    const a = renderPaper('seyes', { spacing: 6 })
    const b = renderPaper('seyes', { spacing: 12 })
    expect(shapesOf(a.scene, 'line').length).toBe(
      shapesOf(b.scene, 'line').length,
    )
  })

  test('draws four lines per cell plus main lines and a frame', () => {
    const { shapes } = renderPaper('seyes')
    const lines = shapesOf(shapes, 'line')
    expect(lines.length).toBeGreaterThan(50)
    expect(shapesOf(shapes, 'rect').length).toBeGreaterThan(0)
  })
})

describe('storyboard', () => {
  test('default render draws rows × columns frames', () => {
    const { shapes, ctx } = renderPaper('storyboard')
    expect(shapesOf(shapes, 'rect')).toHaveLength(6)
    expectInside(shapes, ctx.area)
    expectFiniteNumbers(shapes)
  })

  test('spacing has no effect on frame count', () => {
    expect(
      shapesOf(renderPaper('storyboard', { spacing: 5 }).scene, 'rect'),
    ).toHaveLength(6)
    expect(
      shapesOf(renderPaper('storyboard', { spacing: 20 }).scene, 'rect'),
    ).toHaveLength(6)
  })

  test('rows and columns options change the frame count', () => {
    const changed = renderPaper('storyboard', {
      options: { storyboard: { rows: 4, columns: 3, showCaptions: false } },
    })
    expect(shapesOf(changed.scene, 'rect')).toHaveLength(12)
  })

  test('showCaptions=false makes frames taller', () => {
    const withCaptions = shapesOf(renderPaper('storyboard').scene, 'rect')[0]
    const without = shapesOf(
      renderPaper('storyboard', {
        options: { storyboard: { showCaptions: false } },
      }).scene,
      'rect',
    )[0]
    expect(without.box.h).toBeGreaterThan(withCaptions.box.h)
  })
})

describe('mizige', () => {
  test('default render is non-empty and inside the page', () => {
    const { shapes, ctx } = renderPaper('mizige')
    expect(shapes.length).toBeGreaterThan(100)
    expectInside(shapes, box(0, 0, ctx.page.width, ctx.page.height))
    expectFiniteNumbers(shapes)
  })

  test('spacing changes the number of grid lines', () => {
    const fine = renderPaper('mizige', { spacing: 15 })
    const coarse = renderPaper('mizige', { spacing: 35 })
    expect(shapesOf(fine.scene, 'line').length).toBeGreaterThan(
      shapesOf(coarse.scene, 'line').length,
    )
  })

  test('draws a frame', () => {
    expect(
      shapesOf(renderPaper('mizige').scene, 'rect').length,
    ).toBeGreaterThan(0)
  })

  test('vertical grid lines are present', () => {
    expect(
      verticalPositions(renderPaper('mizige').scene).length,
    ).toBeGreaterThan(3)
  })
})
