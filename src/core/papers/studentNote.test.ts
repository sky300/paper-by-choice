import type { AnyPaper, OptionField } from './contract'
import studentNote from './studentNote'
import { paperName } from './registry'
import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  renderPaper,
  shapesOf,
  textsOf,
  verticalPositions,
} from '../testing/paperTestKit'

function referencedKeys(paper: AnyPaper): string[] {
  const keys = [paper.spacing.label, paper.spacing.hint]
  const walk = (fields: readonly OptionField[]): void => {
    for (const field of fields) {
      keys.push(field.label)
      if (field.hint) keys.push(field.hint)
      if (field.kind === 'select') {
        for (const choice of field.choices) keys.push(choice.label)
      }
      if (field.kind === 'group') walk(field.fields)
    }
  }
  walk(paper.fields)
  for (const preset of paper.presets) keys.push(preset.name, preset.description)
  return [...new Set(keys)]
}

describe('student_note: declaration', () => {
  test('is a creative paper that rules 6–12 mm, 8 mm by default', () => {
    expect(studentNote.type).toBe('student_note')
    expect(studentNote.group).toBe('creative')
    expect(studentNote.spacing).toMatchObject({
      min: 6,
      max: 12,
      step: 0.5,
      default: 8,
    })
    expect(studentNote.fields).toEqual([])
    expect(studentNote.defaultOptions).toEqual({})
  })

  test('keeps its zh-CN and en messages in step and defines every referenced key', () => {
    const zh = studentNote.messages['zh-CN']
    const en = studentNote.messages.en
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
    const keys = ['name', ...referencedKeys(studentNote)]
    for (const locale of ['zh-CN', 'en'] as const) {
      expect(keys.filter((key) => !studentNote.messages[locale][key])).toEqual(
        [],
      )
    }
    expect(
      [...Object.values(zh), ...Object.values(en)].filter((v) => !v.trim()),
    ).toEqual([])
  })

  test('starts with a named template with a 40 mm left margin', () => {
    expect(studentNote.presets[0]?.patch).toMatchObject({
      margins: { top: 30, right: 20, bottom: 25, left: 40 },
    })
    const ids = studentNote.presets.map((preset) => preset.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('student_note: rendering', () => {
  test('renders a non-empty scene of finite numbers inside the area', () => {
    const { shapes, ctx } = renderPaper('student_note')
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('draws an empty title box three spacings tall', () => {
    const { shapes, ctx } = renderPaper('student_note')
    const box = shapesOf(shapes, 'rect')[0]
    expect(box?.box).toEqual({
      x: ctx.area.x,
      y: ctx.area.y,
      w: ctx.area.w,
      h: 3 * ctx.spacing,
    })
    expect(box?.fill).toBeUndefined()
  })

  test('draws the binding line 25 mm from the left edge, below the title box', () => {
    const { shapes, ctx } = renderPaper('student_note')
    expect(verticalPositions(shapes)).toEqual([ctx.area.x + 25])
    const binding = shapesOf(shapes, 'line').find((item) => item.x1 === item.x2)
    expect(binding?.y1).toBe(ctx.area.y + 3 * ctx.spacing)
    expect(binding?.y2).toBe(ctx.area.y + ctx.area.h)
  })

  test('starts the body rules four spacings down', () => {
    const { shapes, ctx } = renderPaper('student_note')
    const main = ctx.ink.main()
    const body = shapesOf(shapes, 'line').filter(
      (item) => item.y1 === item.y2 && item.stroke.color === main.color,
    )
    expect(body[0]?.y1).toBe(ctx.area.y + 4 * ctx.spacing)
  })

  test('makes more body rules at the smallest spacing and fewer at the largest', () => {
    const narrow = renderPaper('student_note', { spacing: 6 })
    const wide = renderPaper('student_note', { spacing: 12 })
    const count = (r: ReturnType<typeof renderPaper>) =>
      shapesOf(r.shapes, 'line').filter(
        (item) =>
          item.y1 === item.y2 && item.stroke.color === r.ctx.ink.main().color,
      ).length
    expect(count(narrow)).toBeGreaterThan(count(wide))
    expect(() => expectInside(narrow.shapes, narrow.ctx.area)).not.toThrow()
    expect(() => expectInside(wide.shapes, wide.ctx.area)).not.toThrow()
  })

  test('prints translated title and date labels through ctx.t()', () => {
    const zh = renderPaper('student_note')
    const en = renderPaper('student_note', { locale: 'en' })
    expect(textsOf(zh.shapes)).toContain('课程笔记')
    expect(textsOf(zh.shapes)).toContain('日期: ___/___/___')
    expect(textsOf(en.shapes)).toContain('Class notes')
    expect(textsOf(en.shapes)).toContain('Date: ___/___/___')
  })

  test('renders on an A5 landscape page without leaving the writing area', () => {
    const { shapes, ctx } = renderPaper('student_note', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })
})

describe('student_note: messages', () => {
  test('is called by its name', () => {
    expect(paperName(studentNote, 'zh-CN')).toBe('学生笔记纸')
    expect(paperName(studentNote, 'en')).toBe('Student notes')
  })
})
