import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  renderPaper,
  shapesOf,
  textsOf,
} from '../testing/paperTestKit'
import meetingNote from './meetingNote'

describe('meetingNote', () => {
  test('renders a non-empty scene of finite numbers inside the area', () => {
    const { shapes, ctx } = renderPaper('meeting_note')
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('has matching zh/en message keys and a default in range', () => {
    expect(Object.keys(meetingNote.messages.en).sort()).toEqual(
      Object.keys(meetingNote.messages['zh-CN']).sort(),
    )
    expect(meetingNote.spacing.default).toBeGreaterThanOrEqual(
      meetingNote.spacing.min,
    )
    expect(meetingNote.spacing.default).toBeLessThanOrEqual(
      meetingNote.spacing.max,
    )
  })

  test('puts all paper text through i18n', () => {
    const zh = textsOf(renderPaper('meeting_note').shapes)
    const en = textsOf(renderPaper('meeting_note', { locale: 'en' }).shapes)
    expect(zh.length).toBeGreaterThan(0)
    expect(zh.length).toBe(en.length)
    expect(zh.some((value) => /[\u4e00-\u9fff]/.test(value))).toBe(true)
    expect(en.some((value) => /Meeting/.test(value))).toBe(true)
    expect(zh.join()).not.toBe(en.join())
  })

  test('spacing changes the number of rules', () => {
    const narrow = renderPaper('meeting_note', { spacing: 6 })
    const wide = renderPaper('meeting_note', { spacing: 12 })
    expect(shapesOf(narrow.shapes, 'line').length).toBeGreaterThan(
      shapesOf(wide.shapes, 'line').length,
    )
    expect(() => expectInside(wide.shapes, wide.ctx.area)).not.toThrow()
  })

  test('renders on A5 landscape without leaving the writing area', () => {
    const { shapes, ctx } = renderPaper('meeting_note', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })
})
