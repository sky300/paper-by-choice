import music from './music'
import { describe, expect, test } from 'vitest'
import {
  expectInside,
  horizontalPositions,
  renderPaper,
} from '../testing/paperTestKit'

describe('music', () => {
  test('declares its type, spacing and two staff options', () => {
    expect(music.type).toBe('music')
    expect(music.spacing).toMatchObject({
      min: 2,
      max: 8,
      step: 0.5,
      default: 3,
    })
    expect(music.fields.map((f) => f.key)).toEqual([
      'music.staffCount',
      'music.staffSpacing',
    ])
    expect(music.defaultOptions).toEqual({
      music: { staffCount: 10, staffSpacing: 12 },
    })
  })

  test('keeps zh-CN and en message keys identical', () => {
    expect(Object.keys(music.messages.en).sort()).toEqual(
      Object.keys(music.messages['zh-CN']).sort(),
    )
    expect(music.presets[0].id).toBe('music-paper')
  })

  test('draws ten staffs of five lines each at 3 mm on A4', () => {
    const { shapes, ctx } = renderPaper('music')
    expect(shapes).toHaveLength(50)
    expect(horizontalPositions(shapes)).toHaveLength(50)
    expect(horizontalPositions(shapes)[0]).toBe(20)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('changes the drawn staffs with staffCount and staffSpacing', () => {
    const few = renderPaper('music', {
      options: { music: { staffCount: 2, staffSpacing: 12 } },
    })
    const dense = renderPaper('music', {
      options: { music: { staffCount: 20, staffSpacing: 4 } },
    })
    expect(few.shapes).toHaveLength(10)
    expect(dense.shapes.length).toBeGreaterThan(few.shapes.length)
    expect(() => expectInside(dense.shapes, dense.ctx.area)).not.toThrow()
  })

  test('clamps out-of-range options and renders on A5 landscape', () => {
    const { shapes, ctx } = renderPaper('music', {
      paperSize: 'a5',
      orientation: 'landscape',
      options: { music: { staffCount: 999, staffSpacing: 999 } },
      locale: 'en',
    })
    expect(ctx.options).toEqual({ music: { staffCount: 20, staffSpacing: 40 } })
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
    expect(ctx.t('spacing.label')).toBe('Staff line gap')
  })
})
