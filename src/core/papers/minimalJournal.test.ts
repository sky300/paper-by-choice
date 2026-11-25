import type { AnyPaper, OptionField } from './contract'
import minimalJournal from './minimalJournal'
import { paperName } from './registry'
import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  renderPaper,
  shapesOf,
  textsOf,
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

describe('minimal_journal: declaration', () => {
  test('is a creative paper that rules 5–12 mm, 7 mm by default', () => {
    expect(minimalJournal.type).toBe('minimal_journal')
    expect(minimalJournal.group).toBe('creative')
    expect(minimalJournal.spacing).toMatchObject({
      min: 5,
      max: 12,
      step: 0.5,
      default: 7,
    })
    expect(minimalJournal.fields).toEqual([])
    expect(minimalJournal.defaultOptions).toEqual({})
  })

  test('keeps its zh-CN and en messages in step and defines every referenced key', () => {
    const zh = minimalJournal.messages['zh-CN']
    const en = minimalJournal.messages.en
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
    const keys = ['name', ...referencedKeys(minimalJournal)]
    for (const locale of ['zh-CN', 'en'] as const) {
      expect(
        keys.filter((key) => !minimalJournal.messages[locale][key]),
      ).toEqual([])
    }
    expect(
      [...Object.values(zh), ...Object.values(en)].filter((v) => !v.trim()),
    ).toEqual([])
  })

  test('starts with a named A5 minimalist template and keeps preset ids apart', () => {
    expect(minimalJournal.presets[0]?.patch).toMatchObject({
      paperSize: 'a5',
      theme: 'minimalist',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
    })
    const ids = minimalJournal.presets.map((preset) => preset.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('minimal_journal: rendering', () => {
  test('renders a non-empty scene of finite numbers inside the area', () => {
    const { shapes, ctx } = renderPaper('minimal_journal')
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('draws the header rule two spacings below the top edge', () => {
    const { shapes, ctx } = renderPaper('minimal_journal')
    const main = ctx.ink.main()
    const header = shapesOf(shapes, 'line').filter(
      (item) => item.y1 === item.y2 && item.stroke.color === main.color,
    )
    expect(header[0]?.y1).toBe(ctx.area.y + 2 * ctx.spacing)
    expect(header[0]?.x1).toBe(ctx.area.x)
    expect(header[0]?.x2).toBe(ctx.area.x + ctx.area.w)
  })

  test('draws a 40 mm date box in the top-right corner', () => {
    const { shapes, ctx } = renderPaper('minimal_journal')
    const dateBox = shapesOf(shapes, 'rect')[0]
    expect(dateBox?.box).toEqual({
      x: ctx.area.x + ctx.area.w - 40,
      y: ctx.area.y,
      w: 40,
      h: 2 * ctx.spacing,
    })
    expect(dateBox?.fill).toBeUndefined()
  })

  test('starts the body rules three spacings down', () => {
    const { shapes, ctx } = renderPaper('minimal_journal')
    const main = ctx.ink.main()
    const body = shapesOf(shapes, 'line').filter(
      (item) => item.y1 === item.y2 && item.stroke.color === main.color,
    )
    expect(body[1]?.y1).toBe(ctx.area.y + 3 * ctx.spacing)
  })

  test('makes more body rules at the smallest spacing and fewer at the largest', () => {
    const narrow = renderPaper('minimal_journal', { spacing: 5 })
    const wide = renderPaper('minimal_journal', { spacing: 12 })
    const count = (r: ReturnType<typeof renderPaper>) =>
      shapesOf(r.shapes, 'line').filter(
        (item) =>
          item.y1 === item.y2 && item.stroke.color === r.ctx.ink.main().color,
      ).length
    expect(count(narrow)).toBeGreaterThan(count(wide))
    expect(() => expectInside(narrow.shapes, narrow.ctx.area)).not.toThrow()
    expect(() => expectInside(wide.shapes, wide.ctx.area)).not.toThrow()
  })

  test('prints the translated date label through ctx.t()', () => {
    const zh = renderPaper('minimal_journal')
    const en = renderPaper('minimal_journal', { locale: 'en' })
    expect(textsOf(zh.shapes)).toContain('日期')
    expect(textsOf(en.shapes)).toContain('Date')
  })

  test('renders on an A5 landscape page without leaving the writing area', () => {
    const { shapes, ctx } = renderPaper('minimal_journal', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })
})

describe('minimal_journal: messages', () => {
  test('is called by its name', () => {
    expect(paperName(minimalJournal, 'zh-CN')).toBe('简约手账纸')
    expect(paperName(minimalJournal, 'en')).toBe('Minimal journal')
  })
})
