import type { AnyPaper, OptionField } from './contract'
import blank from './blank'
import { paperName } from './registry'
import { COLUMNS_DEFAULTS, COLUMNS_FIELDS } from './shared/columns'
import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  renderPaper,
} from '../testing/paperTestKit'

/** Every message key the spacing, the fields and the presets of a paper refer to. */
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

describe('blank: declaration', () => {
  test('is a basic paper', () => {
    expect(blank.type).toBe('blank')
    expect(blank.group).toBe('basic')
  })

  test('declares a spacing parameter of 1–50 mm in 1 mm steps, 8 by default', () => {
    expect(blank.spacing).toMatchObject({
      label: 'spacing.label',
      hint: 'spacing.hint',
      min: 1,
      max: 50,
      step: 1,
      default: 8,
    })
    expect(blank.spacing.default).toBeGreaterThanOrEqual(blank.spacing.min)
    expect(blank.spacing.default).toBeLessThanOrEqual(blank.spacing.max)
  })

  test('adopts the shared column fields and defaults', () => {
    expect(blank.fields).toBe(COLUMNS_FIELDS)
    expect(blank.defaultOptions).toEqual(COLUMNS_DEFAULTS)
  })

  test('keeps its zh-CN and en messages in step, none of them blank', () => {
    const zh = blank.messages['zh-CN']
    const en = blank.messages.en
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
    expect(
      [...Object.values(zh), ...Object.values(en)].filter(
        (text) => !text.trim(),
      ),
    ).toEqual([])
  })

  test('defines every message it refers to, in both locales', () => {
    const keys = ['name', ...referencedKeys(blank)]
    for (const locale of ['zh-CN', 'en'] as const) {
      expect(keys.filter((key) => !blank.messages[locale][key])).toEqual([])
    }
  })

  test('starts with one default preset and keeps its ids apart', () => {
    expect(blank.presets[0]).toMatchObject({ id: 'blank', patch: {} })
    const ids = blank.presets.map((preset) => preset.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('blank: rendering', () => {
  test('draws nothing at all in the writing area', () => {
    const { shapes, ctx } = renderPaper('blank')
    expect(shapes).toEqual([])
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('draws nothing at the smallest and largest spacing', () => {
    const narrow = renderPaper('blank', { spacing: 1 })
    const wide = renderPaper('blank', { spacing: 50 })
    expect(narrow.shapes).toEqual([])
    expect(wide.shapes).toEqual([])
    expect(() => expectInside(narrow.shapes, narrow.ctx.area)).not.toThrow()
    expect(() => expectInside(wide.shapes, wide.ctx.area)).not.toThrow()
  })

  test('draws nothing on an A5 landscape page', () => {
    const { shapes, ctx } = renderPaper('blank', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(shapes).toEqual([])
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('leaves the column layout to the compose layer', () => {
    const single = renderPaper('blank')
    const two = renderPaper('blank', {
      options: { columns: { count: '2', gap: 999 } },
    })
    expect(two.ctx.options).toEqual({
      columns: { count: '2', gap: 40, divider: 'solid' },
    })
    expect(two.shapes).toEqual(single.shapes)
  })
})

describe('blank: messages', () => {
  test('names the spacing parameter in both locales', () => {
    expect(renderPaper('blank').ctx.t('spacing.label')).toBe('页面大小')
    expect(renderPaper('blank', { locale: 'en' }).ctx.t('spacing.label')).toBe(
      'Page size',
    )
  })

  test('is called by its name', () => {
    expect(paperName(blank, 'zh-CN')).toBe('空白纸')
    expect(paperName(blank, 'en')).toBe('Blank paper')
  })
})
