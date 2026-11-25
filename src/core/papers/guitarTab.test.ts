/**
 * 验证 guitarTab 模块的 guitarTab 行为。
 * Tests guitarTab behavior covering guitarTab.
 */
import guitarTab from './guitarTab'
import { describe, expect, test } from 'vitest'
import { expectInside, renderPaper, shapesOf } from '../testing/paperTestKit'

describe('guitarTab', () => {
  test('declares its type, spacing and chord-orientation option', () => {
    expect(guitarTab.type).toBe('guitar_tab')
    expect(guitarTab.spacing).toMatchObject({
      min: 20,
      max: 40,
      step: 1,
      default: 25,
    })
    expect(guitarTab.fields.map((f) => f.key)).toEqual([
      'guitarTab.chordOrientation',
    ])
    expect(guitarTab.defaultOptions).toEqual({
      guitarTab: { chordOrientation: 'vertical' },
    })
  })

  test('keeps zh-CN and en message keys identical', () => {
    expect(Object.keys(guitarTab.messages.en).sort()).toEqual(
      Object.keys(guitarTab.messages['zh-CN']).sort(),
    )
    expect(guitarTab.presets[0].id).toBe('guitar-tab')
  })

  test('draws four groups of chord grids plus a framed TAB staff on A4', () => {
    const { shapes, ctx } = renderPaper('guitar_tab')
    expect(shapesOf(shapes, 'line').length).toBeGreaterThan(0)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('changes the picture with the chord orientation', () => {
    const vertical = renderPaper('guitar_tab', {
      options: { guitarTab: { chordOrientation: 'vertical' } },
    })
    const horizontal = renderPaper('guitar_tab', {
      options: { guitarTab: { chordOrientation: 'horizontal' } },
    })
    expect(horizontal.shapes.length).not.toBe(vertical.shapes.length)
    expect(() =>
      expectInside(horizontal.shapes, horizontal.ctx.area),
    ).not.toThrow()
  })

  test('falls back to vertical for an invalid option and renders on A5 landscape', () => {
    const { shapes, ctx } = renderPaper('guitar_tab', {
      paperSize: 'a5',
      orientation: 'landscape',
      options: { guitarTab: { chordOrientation: 'sideways' } },
      locale: 'en',
    })
    expect(ctx.options).toEqual({ guitarTab: { chordOrientation: 'vertical' } })
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
    expect(ctx.t('spacing.label')).toBe('TAB staff height')
  })
})
