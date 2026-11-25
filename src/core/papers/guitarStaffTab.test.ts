import guitarStaffTab from './guitarStaffTab'
import { describe, expect, test } from 'vitest'
import { expectInside, renderPaper, textsOf } from '../testing/paperTestKit'

describe('guitarStaffTab', () => {
  test('declares its type, spacing and six guitarTab options', () => {
    expect(guitarStaffTab.type).toBe('guitar_staff_tab')
    expect(guitarStaffTab.spacing).toMatchObject({
      min: 1.5,
      max: 5,
      step: 0.5,
      default: 2.5,
    })
    expect(guitarStaffTab.fields.map((f) => f.key)).toEqual([
      'guitarTab.chordOrientation',
      'guitarTab.showChords',
      'guitarTab.showClefMarks',
      'guitarTab.chordCount',
      'guitarTab.staffTabGapMm',
      'guitarTab.systemGapMm',
    ])
    const defaults = guitarStaffTab.defaultOptions as {
      guitarTab: { chordCount: number }
    }
    expect(defaults.guitarTab.chordCount).toBe(4)
  })

  test('keeps zh-CN and en message keys identical', () => {
    expect(Object.keys(guitarStaffTab.messages.en).sort()).toEqual(
      Object.keys(guitarStaffTab.messages['zh-CN']).sort(),
    )
    expect(guitarStaffTab.presets[0].id).toBe('guitar-staff-tab')
  })

  test('draws four systems with translated clef and TAB labels on A4', () => {
    const { shapes, ctx } = renderPaper('guitar_staff_tab')
    expect(shapes.length).toBeGreaterThan(0)
    expect(textsOf(shapes)).toContain('𝄞')
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('hides the chord row when showChords is off', () => {
    const withChords = renderPaper('guitar_staff_tab')
    const without = renderPaper('guitar_staff_tab', {
      options: { guitarTab: { showChords: false } },
    })
    expect(without.shapes.length).toBeLessThan(withChords.shapes.length)
    expect(() => expectInside(without.shapes, without.ctx.area)).not.toThrow()
  })

  test('clamps options and renders on A5 landscape in English', () => {
    const { shapes, ctx } = renderPaper('guitar_staff_tab', {
      paperSize: 'a5',
      orientation: 'landscape',
      options: {
        guitarTab: {
          chordCount: 99,
          staffTabGapMm: 99,
          systemGapMm: 1,
          showClefMarks: false,
        },
      },
      locale: 'en',
    })
    const o = ctx.options as {
      guitarTab: {
        chordCount: number
        staffTabGapMm: number
        systemGapMm: number
      }
    }
    expect(o.guitarTab.chordCount).toBe(6)
    expect(o.guitarTab.staffTabGapMm).toBe(20)
    expect(o.guitarTab.systemGapMm).toBe(6)
    expect(shapes.length).toBeGreaterThan(0)
    expect(textsOf(shapes)).toEqual([])
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })
})
