/**
 * 验证 cornell 模块的 cornell 行为。
 * Tests cornell behavior covering cornell.
 */
import cornell from './cornell'
import { describe, expect, test } from 'vitest'
import { expectInside, renderPaper, textsOf } from '../testing/paperTestKit'

describe('cornell', () => {
  test('declares its type, spacing and two layout options', () => {
    expect(cornell.type).toBe('cornell')
    expect(cornell.spacing).toMatchObject({
      min: 6,
      max: 15,
      step: 0.5,
      default: 8,
    })
    expect(cornell.fields.map((f) => f.key)).toEqual([
      'cornell.cueWidth',
      'cornell.summaryHeight',
    ])
    expect(cornell.defaultOptions).toEqual({
      cornell: { cueWidth: 60, summaryHeight: 50 },
    })
  })

  test('keeps zh-CN and en message keys identical', () => {
    expect(Object.keys(cornell.messages.en).sort()).toEqual(
      Object.keys(cornell.messages['zh-CN']).sort(),
    )
    expect(cornell.presets[0].id).toBe('cornell')
  })

  test('draws the three translated section labels on A4', () => {
    const { shapes, ctx } = renderPaper('cornell')
    expect(textsOf(shapes)).toEqual(['线索', '笔记', '总结'])
    expect(shapes.length).toBeGreaterThan(3)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('changes the picture with the cue width and summary height', () => {
    const narrow = renderPaper('cornell', {
      options: { cornell: { cueWidth: 20, summaryHeight: 30 } },
    })
    const wide = renderPaper('cornell', {
      options: { cornell: { cueWidth: 100, summaryHeight: 80 } },
    })
    expect(narrow.shapes.length).not.toBe(wide.shapes.length)
    expect(() => expectInside(wide.shapes, wide.ctx.area)).not.toThrow()
  })

  test('clamps options and translates its labels into English on A5 landscape', () => {
    const { shapes, ctx } = renderPaper('cornell', {
      paperSize: 'a5',
      orientation: 'landscape',
      options: { cornell: { cueWidth: 999, summaryHeight: -5 } },
      locale: 'en',
    })
    const o = ctx.options as {
      cornell: { cueWidth: number; summaryHeight: number }
    }
    expect(o.cornell.cueWidth).toBe(120)
    expect(o.cornell.summaryHeight).toBe(20)
    expect(textsOf(shapes)).toEqual(['Cues', 'Notes', 'Summary'])
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })
})
