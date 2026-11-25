/**
 * 验证 calligraphyPractice 模块的 calligraphy_practice: declaration、calligraphy_practice: rendering 行为。
 * Tests calligraphyPractice behavior covering calligraphy_practice: declaration, calligraphy_practice: rendering.
 */
import type { AnyPaper, OptionField } from './contract'
import calligraphyPractice from './calligraphyPractice'
import { CALLIGRAPHY_GRID_STYLES } from './shared/calligraphyLayouts'
import { resolveOptions } from './kit'
import { expect, describe, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  renderPaper,
  shapesOf,
  textsOf,
} from '../testing/paperTestKit'

/** Every message key the spacing, fields and presets refer to. */
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

describe('calligraphy_practice: declaration', () => {
  test('is a calligraphy paper recommending a frame', () => {
    expect(calligraphyPractice.type).toBe('calligraphy_practice')
    expect(calligraphyPractice.group).toBe('calligraphy')
    expect(calligraphyPractice.suggestsCalligraphyFrame).toBe(true)
  })

  test('spaces its rules 1–25 mm in 0.5 mm steps, 15 mm by default', () => {
    expect(calligraphyPractice.spacing).toMatchObject({
      min: 1,
      max: 25,
      step: 0.5,
      default: 15,
    })
  })

  test('keeps its zh-CN and en messages in step, none blank', () => {
    const zh = calligraphyPractice.messages['zh-CN']
    const en = calligraphyPractice.messages.en
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
    expect(
      [...Object.values(zh), ...Object.values(en)].filter(
        (text) => !text.trim(),
      ),
    ).toEqual([])
  })

  test('defines every message it refers to, in both locales', () => {
    const keys = ['name', ...referencedKeys(calligraphyPractice)]
    for (const locale of ['zh-CN', 'en'] as const) {
      expect(
        keys.filter((key) => !calligraphyPractice.messages[locale][key]),
      ).toEqual([])
    }
  })

  test('offers all eight layouts in the gridStyle select', () => {
    const field = calligraphyPractice.fields.find(
      (f) => f.key === 'layout.gridStyle',
    )
    expect(field?.kind).toBe('select')
    if (field?.kind === 'select') {
      expect(field.choices.map((choice) => choice.value)).toEqual(
        CALLIGRAPHY_GRID_STYLES,
      )
    }
  })

  test('starts with the four-line preset and has 43 unique preset ids', () => {
    expect(calligraphyPractice.presets[0]?.id).toBe('cp_four_row_16')
    expect(calligraphyPractice.presets).toHaveLength(43)
    const ids = calligraphyPractice.presets.map((preset) => preset.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('gives every preset a full layout patch and a spacing', () => {
    for (const preset of calligraphyPractice.presets) {
      expect(preset.patch.options).toBeDefined()
      const layout = (
        preset.patch.options as { layout: Record<string, unknown> }
      ).layout
      expect(layout.gridStyle).toBeDefined()
      expect(layout.presetId).toBe(preset.id)
      expect(preset.patch.line?.spacing).toBeGreaterThan(0)
    }
  })

  test('keeps defaultOptions in step with every field default', () => {
    expect(
      resolveOptions(
        calligraphyPractice.fields,
        calligraphyPractice.defaultOptions,
        {},
      ),
    ).toEqual(calligraphyPractice.defaultOptions)
  })
})

describe('calligraphy_practice: rendering', () => {
  test('renders a non-empty scene of finite numbers inside the area', () => {
    const { shapes, ctx } = renderPaper('calligraphy_practice')
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('puts a translated label on the paper', () => {
    const zh = renderPaper('calligraphy_practice')
    const en = renderPaper('calligraphy_practice', { locale: 'en' })
    expect(textsOf(zh.shapes)).toContain('静心练字')
    expect(textsOf(en.shapes)).toContain('Practise with a calm mind')
  })

  test.each([1, 15, 25])('stays inside at spacing %s', (spacing) => {
    const { shapes, ctx } = renderPaper('calligraphy_practice', { spacing })
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('renders on A5 landscape without leaving the area', () => {
    const { shapes, ctx } = renderPaper('calligraphy_practice', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('renders every one of the eight layouts', () => {
    for (const style of CALLIGRAPHY_GRID_STYLES) {
      const { shapes, ctx } = renderPaper('calligraphy_practice', {
        options: { layout: { gridStyle: style } },
      })
      expect(shapes.length).toBeGreaterThan(0)
      expect(() => expectInside(shapes, ctx.area)).not.toThrow()
      expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    }
  })

  test('is pure: the same input yields the same scene', () => {
    const a = renderPaper('calligraphy_practice', {
      options: { layout: { gridStyle: 'poem_grid', titleRows: 2 } },
    })
    const b = renderPaper('calligraphy_practice', {
      options: { layout: { gridStyle: 'poem_grid', titleRows: 2 } },
    })
    expect(b.shapes).toEqual(a.shapes)
  })

  test('clamps an out-of-range layout option', () => {
    const { ctx } = renderPaper('calligraphy_practice', {
      options: { layout: { columns: 999 } },
    })
    expect((ctx.options.layout as { columns: number }).columns).toBe(30)
  })

  test('draws the four-line sheet as five centred rules', () => {
    const { shapes } = renderPaper('calligraphy_practice', {
      options: { layout: { rows: 4 } },
      spacing: 16,
    })
    const ys = shapesOf(shapes, 'line')
      .filter((item) => item.y1 === item.y2)
      .map((item) => item.y1)
    expect(new Set(ys).size).toBe(5)
  })
})
