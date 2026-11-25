/**
 * 验证 grid 模块的 grid 行为。
 * Tests grid behavior covering grid.
 */
import grid from './grid'
import { COLUMNS_DEFAULTS, COLUMNS_FIELDS } from './shared/columns'
import { describe, expect, test } from 'vitest'
import {
  expectInside,
  horizontalPositions,
  renderPaper,
  verticalPositions,
} from '../testing/paperTestKit'

describe('grid', () => {
  test('declares its type, spacing and column schema', () => {
    expect(grid.type).toBe('grid')
    expect(grid.group).toBe('basic')
    expect(grid.spacing).toMatchObject({
      min: 3,
      max: 15,
      step: 0.5,
      default: 5,
    })
    expect(grid.fields).toBe(COLUMNS_FIELDS)
    expect(grid.defaultOptions).toEqual(COLUMNS_DEFAULTS)
  })

  test('keeps zh-CN and en message keys identical', () => {
    expect(Object.keys(grid.messages.en).sort()).toEqual(
      Object.keys(grid.messages['zh-CN']).sort(),
    )
    expect(grid.presets[0].id).toBe('math')
  })

  test('lays out 33 × 51 centred cells of 5 mm on A4', () => {
    const { shapes, ctx } = renderPaper('grid')
    expect(verticalPositions(shapes)).toHaveLength(34)
    expect(horizontalPositions(shapes)).toHaveLength(52)
    expect(horizontalPositions(shapes)[0]).toBe(21)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('changes the cell count with min and max spacing', () => {
    const narrow = renderPaper('grid', { spacing: 3 })
    const wide = renderPaper('grid', { spacing: 15 })
    expect(horizontalPositions(narrow.shapes)).toHaveLength(86)
    expect(horizontalPositions(wide.shapes)).toHaveLength(18)
    expect(() => expectInside(wide.shapes, wide.ctx.area)).not.toThrow()
  })

  test('renders on A5 landscape and translates its spacing label', () => {
    const { shapes, ctx } = renderPaper('grid', {
      paperSize: 'a5',
      orientation: 'landscape',
      locale: 'en',
    })
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
    expect(ctx.t('spacing.label')).toBe('Cell size')
  })
})
