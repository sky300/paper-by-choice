import type { AnyPaper, OptionField } from './contract'
import lined from './lined'
import { paperName } from './registry'
import { COLUMNS_DEFAULTS, COLUMNS_FIELDS } from './shared/columns'
import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  horizontalPositions,
  renderPaper,
  shapesOf,
  textsOf,
  verticalPositions,
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

describe('lined: declaration', () => {
  test('is a basic paper that recommends a calligraphy frame', () => {
    expect(lined.type).toBe('lined')
    expect(lined.group).toBe('basic')
    expect(lined.suggestsCalligraphyFrame).toBe(true)
  })

  test('spaces its rules 4–20 mm in 0.5 mm steps, 8 mm by default', () => {
    expect(lined.spacing).toMatchObject({
      label: 'spacing.label',
      hint: 'spacing.hint',
      min: 4,
      max: 20,
      step: 0.5,
      default: 8,
    })
  })

  test('adopts the shared column fields and defaults', () => {
    expect(lined.fields).toBe(COLUMNS_FIELDS)
    expect(lined.defaultOptions).toEqual(COLUMNS_DEFAULTS)
  })

  test('keeps its zh-CN and en messages in step, none of them blank', () => {
    const zh = lined.messages['zh-CN']
    const en = lined.messages.en
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
    expect(
      [...Object.values(zh), ...Object.values(en)].filter(
        (text) => !text.trim(),
      ),
    ).toEqual([])
  })

  test('defines every message it refers to, in both locales', () => {
    const keys = ['name', ...referencedKeys(lined)]
    for (const locale of ['zh-CN', 'en'] as const) {
      expect(keys.filter((key) => !lined.messages[locale][key])).toEqual([])
    }
  })

  test('starts with a notebook preset that changes nothing', () => {
    expect(lined.presets[0]).toMatchObject({ id: 'notebook', patch: {} })
  })

  test('offers an A3 landscape two-column exam preset', () => {
    expect(lined.presets[1]?.id).toBe('exam-two-column')
    expect(lined.presets[1]?.patch).toEqual({
      paperSize: 'a3',
      orientation: 'landscape',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      options: { columns: { count: '2', gap: 8, divider: 'solid' } },
    })
  })

  test('keeps its preset ids apart', () => {
    const ids = lined.presets.map((preset) => preset.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('lined: rendering', () => {
  test('renders a non-empty scene of finite numbers', () => {
    const { shapes } = renderPaper('lined')
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
  })

  test('draws horizontal rules and nothing else', () => {
    const { shapes } = renderPaper('lined')
    const rules = shapesOf(shapes, 'line')
    expect(rules.length).toBeGreaterThan(0)
    expect(rules).toHaveLength(shapes.length)
    expect(rules.every((rule) => rule.y1 === rule.y2)).toBe(true)
    expect(textsOf(shapes)).toEqual([])
  })

  test('keeps every rule inside the writing area', () => {
    const { shapes, ctx } = renderPaper('lined')
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('draws 33 rules at 8 mm on A4, starting at the top margin', () => {
    // A4 portrait with 20 mm margins leaves 257 mm: floor(257 / 8) + 1 = 33 rules.
    const { shapes } = renderPaper('lined')
    const ys = horizontalPositions(shapes)
    expect(ys).toHaveLength(33)
    expect(ys[0]).toBe(20)
    expect(ys.at(-1)).toBe(276)
  })

  test('runs each rule from the left edge of the writing area to its right edge', () => {
    const { shapes } = renderPaper('lined')
    const rules = shapesOf(shapes, 'line')
    expect(rules.every((rule) => rule.x1 === 20 && rule.x2 === 190)).toBe(true)
    expect(verticalPositions(shapes)).toEqual([])
  })

  test('draws 26 rules at 10 mm, the first one at y = 20', () => {
    const { shapes } = renderPaper('lined', { spacing: 10 })
    const ys = horizontalPositions(shapes)
    expect(ys).toHaveLength(26)
    expect(ys[0]).toBe(20)
  })

  test('draws more rules at the smallest spacing and fewer at the largest', () => {
    const narrow = renderPaper('lined', { spacing: 4 })
    const wide = renderPaper('lined', { spacing: 20 })
    expect(horizontalPositions(narrow.shapes)).toHaveLength(65)
    expect(horizontalPositions(wide.shapes)).toHaveLength(13)
    expect(() => expectInside(narrow.shapes, narrow.ctx.area)).not.toThrow()
    expect(() => expectInside(wide.shapes, wide.ctx.area)).not.toThrow()
  })

  test('renders on an A5 landscape page without leaving the writing area', () => {
    const { shapes, ctx } = renderPaper('lined', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(ctx.area).toEqual({ x: 20, y: 20, w: 170, h: 108 })
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('draws in the colour and at the width the user chose', () => {
    const { shapes } = renderPaper('lined', {
      line: { color: '#ff0000', width: 0.5 },
    })
    const rules = shapesOf(shapes, 'line')
    expect(rules.length).toBeGreaterThan(0)
    expect(
      rules.every(
        (rule) => rule.stroke.color === '#ff0000' && rule.stroke.width === 0.5,
      ),
    ).toBe(true)
  })

  test('dashes its rules when the line style is dashed', () => {
    const { shapes } = renderPaper('lined', { line: { style: 'dashed' } })
    const rules = shapesOf(shapes, 'line')
    expect(rules.length).toBeGreaterThan(0)
    expect(
      rules.every(
        (rule) =>
          rule.stroke.dash?.length === 2 &&
          rule.stroke.dash[0] === 3 &&
          rule.stroke.dash[1] === 2,
      ),
    ).toBe(true)
  })

  test('leaves the column layout to the compose layer', () => {
    // `render()` fills one area; splitting it into columns is not its job, so
    // the option is validated but does not change what is drawn in that area.
    const single = renderPaper('lined')
    const two = renderPaper('lined', {
      options: { columns: { count: '2', gap: 999 } },
    })
    expect(two.ctx.options).toEqual({
      columns: { count: '2', gap: 40, divider: 'solid' },
    })
    expect(two.shapes).toEqual(single.shapes)
  })
})

describe('lined: messages', () => {
  test('names its spacing parameter in both locales', () => {
    expect(renderPaper('lined').ctx.t('spacing.label')).toBe('行距')
    expect(renderPaper('lined', { locale: 'en' }).ctx.t('spacing.label')).toBe(
      'Line spacing',
    )
  })

  test('is called by its name', () => {
    expect(paperName(lined, 'zh-CN')).toBe('横线纸')
    expect(paperName(lined, 'en')).toBe('Ruled paper')
  })
})
