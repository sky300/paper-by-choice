/**
 * 验证 calligraphyLayouts 模块的 resolveLayout、all eight styles、horizontal_lines 行为。
 * Tests calligraphyLayouts behavior covering resolveLayout, all eight styles, horizontal_lines.
 */
import type { Box } from '../../scene/types'
import type { RenderContext } from '../contract'
import { createFontKit, createInkKit } from '../kit'
import { resolveTheme } from '../../themes'
import { describe, expect, test } from 'vitest'
import {
  CALLIGRAPHY_GRID_STYLES,
  drawCalligraphyLayout,
  resolveLayout,
  type CalligraphyGridStyle,
  type CalligraphyLayout,
} from './calligraphyLayouts'
import {
  expectFiniteNumbers,
  expectInside,
  horizontalPositions,
  shapesOf,
  verticalPositions,
} from '../../testing/paperTestKit'

const AREA: Box = { x: 20, y: 20, w: 170, h: 257 }

/** A complete render context, without going through the registry. */
function makeContext(
  area: Box = AREA,
  spacing = 15,
): RenderContext<Record<string, unknown>> {
  const theme = resolveTheme('default')
  return {
    type: 'calligraphy_practice',
    page: { width: 210, height: 297 },
    area,
    spacing,
    theme,
    options: {},
    ink: createInkKit({
      color: '#334455',
      width: 0.2,
      style: 'solid',
      spacing,
    }),
    fonts: createFontKit(theme),
    t: (key) => key,
    locale: 'zh-CN',
  }
}

/** Renders one style with an optional partial layout. */
function render(
  style: CalligraphyGridStyle,
  extra: Partial<CalligraphyLayout> = {},
  area: Box = AREA,
  spacing = 15,
) {
  const ctx = makeContext(area, spacing)
  const layout = resolveLayout({
    gridStyle: style,
    cellSizeMm: spacing,
    ...extra,
  })
  return { ctx, layout, scene: drawCalligraphyLayout(ctx, layout) }
}

/** The three invariants every style must satisfy. */
function expectUsable(
  scene: ReturnType<typeof drawCalligraphyLayout>,
  area: Box,
) {
  expect(scene.length).toBeGreaterThan(0)
  expect(() => expectFiniteNumbers(scene)).not.toThrow()
  expect(() => expectInside(scene, area)).not.toThrow()
}

describe('resolveLayout', () => {
  test('fills every default when given an empty layout', () => {
    expect(resolveLayout({})).toMatchObject({
      gridStyle: 'square_grid',
      columns: 4,
      rows: 7,
      cellSizeMm: 15,
      blockCount: 1,
      blockGapMm: 10,
      showCenterAxis: false,
      lineWeight: 'normal',
      guideOpacity: 0.5,
      poemType: 'qiyan',
      poemLines: 4,
      poemDirection: 'vertical',
      titleRows: 0,
      titleGapMm: 4,
      signatureRows: 0,
      signatureMode: 'grid',
      signatureGapMm: 4,
      compositionFrame: true,
      compositionInsetMm: 8,
      compositionSections: 1,
      sectionGapMm: 10,
      fanRows: 5,
      fanAngleDeg: 140,
    })
  })

  test('keeps the values a preset supplies', () => {
    const layout = resolveLayout({
      gridStyle: 'square_grid',
      columns: 6,
      rows: 11,
      cellSizeMm: 2.2,
      cellWidthMm: 1.4,
      cellHeightMm: 2.2,
      guideOpacity: 0.5,
      poemType: 'wuyan',
      poemDirection: 'horizontal',
    })
    expect(layout).toMatchObject({
      columns: 6,
      rows: 11,
      cellWidthMm: 1.4,
      cellHeightMm: 2.2,
      poemType: 'wuyan',
      poemDirection: 'horizontal',
    })
  })

  test('leaves non-square cell sizes unset when the preset does not give them', () => {
    const layout = resolveLayout({ gridStyle: 'square_grid' })
    expect(layout.cellWidthMm).toBe(0)
    expect(layout.cellHeightMm).toBe(0)
    expect(layout.titleColumns).toBe(0)
  })

  test('falls back to square_grid for an unknown style', () => {
    expect(
      resolveLayout({ gridStyle: 'nonsense' as CalligraphyGridStyle })
        .gridStyle,
    ).toBe('square_grid')
  })

  test('replaces non-finite sizes with a safe default', () => {
    expect(resolveLayout({ cellSizeMm: Number.NaN }).cellSizeMm).toBe(15)
    expect(resolveLayout({ rows: Number.POSITIVE_INFINITY }).rows).toBe(7)
    expect(resolveLayout({ columns: -3 }).columns).toBe(1)
  })
})

describe('all eight styles', () => {
  test('exposes exactly eight styles', () => {
    expect(CALLIGRAPHY_GRID_STYLES).toHaveLength(8)
    expect(new Set(CALLIGRAPHY_GRID_STYLES).size).toBe(8)
  })

  test.each(CALLIGRAPHY_GRID_STYLES)('%s draws a usable scene', (style) => {
    const { scene } = render(style)
    expectUsable(scene, AREA)
  })

  test.each([1, 15, 25])('stays finite and inside at spacing %s', (spacing) => {
    for (const style of CALLIGRAPHY_GRID_STYLES) {
      const { scene } = render(style, {}, AREA, spacing)
      expect(() => expectFiniteNumbers(scene)).not.toThrow()
      expect(() => expectInside(scene, AREA)).not.toThrow()
    }
  })

  test('stays finite and inside on a landscape A5 area', () => {
    const area: Box = { x: 20, y: 20, w: 170, h: 108 }
    for (const style of CALLIGRAPHY_GRID_STYLES) {
      const { scene } = render(style, {}, area)
      expect(() => expectFiniteNumbers(scene)).not.toThrow()
      expect(() => expectInside(scene, area)).not.toThrow()
    }
  })

  test('never produces NaN when almost nothing fits', () => {
    const area: Box = { x: 0, y: 0, w: 2, h: 2 }
    for (const style of CALLIGRAPHY_GRID_STYLES) {
      const { scene } = render(style, {}, area)
      expect(() => expectFiniteNumbers(scene)).not.toThrow()
    }
  })
})

describe('horizontal_lines', () => {
  test('draws rows + 1 rules centred in the area', () => {
    const { scene } = render('horizontal_lines', { rows: 4 }, AREA, 16)
    const ys = horizontalPositions(scene)
    expect(ys).toHaveLength(5)
    expect(ys[0]).toBeCloseTo(20 + (257 - 4 * 16) / 2, 5)
    expect(ys.at(-1)).toBeCloseTo(ys[0]! + 4 * 16, 5)
  })

  test('runs every rule across the whole writing area', () => {
    const { scene } = render('horizontal_lines', { rows: 4 })
    const lines = shapesOf(scene, 'line')
    expect(lines.every((item) => item.y1 === item.y2)).toBe(true)
    expect(lines.every((item) => item.x1 === 20 && item.x2 === 190)).toBe(true)
  })

  test('adds one dashed vertical axis at the horizontal centre', () => {
    const plain = render('horizontal_lines', { rows: 4 })
    const axis = render('horizontal_lines', { rows: 4, showCenterAxis: true })
    const extra = shapesOf(axis.scene, 'line').filter(
      (item) => item.x1 === item.x2,
    )
    expect(shapesOf(plain.scene, 'line')).toHaveLength(5)
    expect(extra).toHaveLength(1)
    expect(extra[0]?.x1).toBe(105)
    expect(extra[0]?.x1).toBe(extra[0]?.x2)
    expect(extra[0]?.stroke.opacity).toBe(0.5)
    expect(extra[0]?.stroke.dash).toEqual([4, 4])
  })

  test('scales the rule width with lineWeight', () => {
    const thin = render('horizontal_lines', { rows: 4, lineWeight: 'thin' })
    const normal = render('horizontal_lines', { rows: 4 })
    const bold = render('horizontal_lines', { rows: 4, lineWeight: 'bold' })
    expect(shapesOf(thin.scene, 'line')[0]?.stroke.width).toBeCloseTo(0.14, 5)
    expect(shapesOf(normal.scene, 'line')[0]?.stroke.width).toBeCloseTo(0.2, 5)
    expect(shapesOf(bold.scene, 'line')[0]?.stroke.width).toBeCloseTo(0.36, 5)
  })
})

describe('vertical_lines', () => {
  test('draws full-height vertical rules at the pitch, ignoring rows', () => {
    const narrow = render('vertical_lines', { rows: 3 }, AREA, 15)
    const wide = render('vertical_lines', { rows: 3 }, AREA, 10)
    // floor(170/15)+1 = 12, floor(170/10)+1 = 18.
    expect(verticalPositions(narrow.scene)).toHaveLength(12)
    expect(verticalPositions(wide.scene)).toHaveLength(18)
    expect(verticalPositions(narrow.scene)[0]).toBe(22.5)
    expect(
      shapesOf(narrow.scene, 'line').every((item) => item.x1 === item.x2),
    ).toBe(true)
  })

  test('adds one dashed horizontal axis at the vertical centre', () => {
    const plain = render('vertical_lines')
    const axis = render('vertical_lines', { showCenterAxis: true })
    const axisLines = shapesOf(axis.scene, 'line').filter(
      (item) => item.y1 === item.y2,
    )
    expect(axisLines).toHaveLength(1)
    expect(axisLines[0]?.stroke.opacity).toBe(0.5)
    expect(
      shapesOf(plain.scene, 'line').every((item) => item.x1 === item.x2),
    ).toBe(true)
  })
})

describe('square_grid', () => {
  test('draws columns + 1 and rows + 1 lines, centred', () => {
    const { scene } = render('square_grid', { columns: 4, rows: 7 })
    expect(verticalPositions(scene)).toEqual([75, 90, 105, 120, 135])
    expect(horizontalPositions(scene)).toEqual([
      96, 111, 126, 141, 156, 171, 186, 201,
    ])
  })

  test('adds title and signature blocks above and below the body', () => {
    const plain = render('square_grid', { columns: 4, rows: 7 })
    const extra = render('square_grid', {
      columns: 4,
      rows: 7,
      titleRows: 1,
      signatureRows: 2,
    })
    expect(horizontalPositions(extra.scene).length).toBeGreaterThan(
      horizontalPositions(plain.scene).length,
    )
    expectUsable(extra.scene, AREA)
  })

  test('uses explicit cell widths and heights instead of the spacing', () => {
    const { scene } = render('square_grid', {
      columns: 6,
      rows: 11,
      cellWidthMm: 1.4,
      cellHeightMm: 2.2,
    })
    const xs = verticalPositions(scene)
    expect(xs).toHaveLength(7)
    expect(xs.at(-1)! - xs[0]!).toBeCloseTo(8.4, 5)
  })

  test('clamps the grid when the cells do not fit', () => {
    const { scene } = render('square_grid', { columns: 11, rows: 17 }, AREA, 25)
    expect(verticalPositions(scene).length).toBeLessThanOrEqual(7)
    expect(horizontalPositions(scene).length).toBeLessThanOrEqual(11)
    expectUsable(scene, AREA)
  })

  test('repeats the whole block sideways when blockCount is 2', () => {
    const one = render('square_grid', { columns: 4, rows: 7 })
    const two = render('square_grid', { columns: 4, rows: 7, blockCount: 2 })
    expect(verticalPositions(two.scene).length).toBe(
      verticalPositions(one.scene).length * 2,
    )
  })
})

describe('tianzi_grid', () => {
  test('adds two dashed cross guides to every cell', () => {
    const plain = render('square_grid', { columns: 4, rows: 7 })
    const tianzi = render('tianzi_grid', { columns: 4, rows: 7 })
    expect(shapesOf(tianzi.scene, 'line')).toHaveLength(
      shapesOf(plain.scene, 'line').length + 4 * 7 * 2,
    )
    expect(
      shapesOf(tianzi.scene, 'line').some(
        (item) => item.stroke.dash !== undefined && item.stroke.opacity === 0.5,
      ),
    ).toBe(true)
  })
})

describe('poem_grid', () => {
  test('qiyan vertical with four lines makes a 4 × 7 body', () => {
    const { scene } = render('poem_grid', {
      poemType: 'qiyan',
      poemLines: 4,
      poemDirection: 'vertical',
    })
    expect(verticalPositions(scene)).toHaveLength(5)
    expect(horizontalPositions(scene)).toHaveLength(8)
  })

  test('wuyan horizontal with four lines makes a 5 × 4 body', () => {
    const { scene } = render('poem_grid', {
      poemType: 'wuyan',
      poemLines: 4,
      poemDirection: 'horizontal',
    })
    expect(verticalPositions(scene)).toHaveLength(6)
    expect(horizontalPositions(scene)).toHaveLength(5)
  })

  test('title and signature rows add their own blocks', () => {
    const plain = render('poem_grid', { poemType: 'qiyan', poemLines: 4 })
    const full = render('poem_grid', {
      poemType: 'qiyan',
      poemLines: 4,
      titleRows: 1,
      signatureRows: 2,
      signatureMode: 'grid',
    })
    expect(horizontalPositions(full.scene).length).toBeGreaterThan(
      horizontalPositions(plain.scene).length,
    )
    expectUsable(full.scene, AREA)
  })

  test('blank signature mode draws one outline instead of small cells', () => {
    const grid = render('poem_grid', { poemLines: 4, signatureRows: 2 })
    const blank = render('poem_grid', {
      poemLines: 4,
      signatureRows: 2,
      signatureMode: 'blank',
    })
    expect(shapesOf(blank.scene, 'rect')).toHaveLength(1)
    expect(shapesOf(blank.scene, 'line').length).toBeLessThan(
      shapesOf(grid.scene, 'line').length,
    )
  })
})

describe('doufang', () => {
  test('draws one square composition frame by default', () => {
    const { scene } = render('doufang', { poemLines: 4 })
    expect(shapesOf(scene, 'rect')).toHaveLength(1)
  })

  test('omits the frame when compositionFrame is false', () => {
    const { scene } = render('doufang', {
      poemLines: 4,
      compositionFrame: false,
    })
    expect(shapesOf(scene, 'rect')).toHaveLength(0)
  })
})

describe('zhongtang', () => {
  test('draws a frame whose vertical edges are heavier', () => {
    const { scene } = render('zhongtang', { poemLines: 4 })
    expect(
      shapesOf(scene, 'line').some((item) => item.stroke.width > 0.25),
    ).toBe(true)
  })

  test('two sections produce more items than one', () => {
    const one = render('zhongtang', { poemLines: 4, compositionSections: 1 })
    const two = render('zhongtang', { poemLines: 4, compositionSections: 2 })
    expect(shapesOf(two.scene, 'line').length).toBeGreaterThan(
      shapesOf(one.scene, 'line').length,
    )
    expectUsable(two.scene, AREA)
  })
})

describe('tuanshan', () => {
  test('draws concentric arcs, omitting ones that do not fit', () => {
    const { scene } = render('tuanshan', { fanRows: 5 }, AREA, 15)
    const arcs = shapesOf(scene, 'ellipse')
    expect(arcs.length).toBeGreaterThan(0)
    expect(arcs.length).toBeLessThanOrEqual(6)
    expect(
      arcs.every((item) => item.start !== undefined && item.end !== undefined),
    ).toBe(true)
  })

  test('fanAngleDeg changes the angular span', () => {
    const wide = render('tuanshan', { fanAngleDeg: 170 })
    const narrow = render('tuanshan', { fanAngleDeg: 90 })
    const a = shapesOf(wide.scene, 'ellipse')[0]
    const b = shapesOf(narrow.scene, 'ellipse')[0]
    expect(a?.start).not.toBe(b?.start)
  })
})

describe('purity', () => {
  test('returns the same scene for the same input', () => {
    const first = render('poem_grid', { titleRows: 1, signatureRows: 2 })
    const second = render('poem_grid', { titleRows: 1, signatureRows: 2 })
    expect(second.scene).toEqual(first.scene)
  })
})
