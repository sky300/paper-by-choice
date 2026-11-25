/**
 * 验证 kit 模块的 dashFor、createInkKit、createFontKit 行为。
 * Tests kit behavior covering dashFor, createInkKit, createFontKit.
 */
import { resolveTheme } from '../themes'
import type { LineSettings } from '../types'
import { describe, expect, test } from 'vitest'
import type { OptionField } from './contract'
import {
  createFontKit,
  createInkKit,
  dashFor,
  deepMerge,
  getOption,
  isPlainObject,
  resolveOptions,
  setOption,
} from './kit'

const SOLID: LineSettings = {
  color: '#6b7280',
  width: 0.4,
  style: 'solid',
  spacing: 8,
}

describe('dashFor', () => {
  test('solid lines carry no dash array', () => {
    expect(dashFor('solid', 0.4)).toBeUndefined()
  })

  test('dashed lines use a 3 mm dash and a 2 mm gap, whatever the width', () => {
    expect(dashFor('dashed', 0.13)).toEqual([3, 2])
    expect(dashFor('dashed', 0.8)).toEqual([3, 2])
  })

  test('dotted lines use dots 1.2 times the line width and a 1.4 mm gap', () => {
    expect(dashFor('dotted', 0.5)).toEqual([0.6, 1.4])
  })

  test('dotted dots never get shorter than 0.25 mm', () => {
    expect(dashFor('dotted', 0.13)).toEqual([0.25, 1.4])
  })

  test('hands out a fresh array on every call', () => {
    expect(dashFor('dashed', 0.4)).not.toBe(dashFor('dashed', 0.4))
  })
})

describe('createInkKit', () => {
  test('main() takes colour and width from the line settings and adds no dash to a solid line', () => {
    expect(createInkKit(SOLID).main()).toStrictEqual({
      color: '#6b7280',
      width: 0.4,
    })
  })

  test('main() follows a dashed or dotted line style', () => {
    expect(createInkKit({ ...SOLID, style: 'dashed' }).main().dash).toEqual([
      3, 2,
    ])
    expect(createInkKit({ ...SOLID, style: 'dotted' }).main().dash).toEqual([
      0.48, 1.4,
    ])
  })

  test('main() overrides only the fields it is given', () => {
    expect(
      createInkKit({ ...SOLID, style: 'dashed' }).main({
        width: 0.8,
        opacity: 0.5,
      }),
    ).toStrictEqual({
      color: '#6b7280',
      width: 0.8,
      dash: [3, 2],
      opacity: 0.5,
    })
  })

  test('main() drops the dash when overridden with undefined, which is how a paper stays solid under a dashed style', () => {
    const stroke = createInkKit({ ...SOLID, style: 'dashed' }).main({
      dash: undefined,
    })
    expect(stroke.dash).toBeUndefined()
    expect(Object.hasOwn(stroke, 'dash')).toBe(false)
  })

  test('guide() keeps the colour, uses 0.75 of the width rounded to 3 decimals, and is dashed [2.5, 1.5]', () => {
    expect(createInkKit(SOLID).guide()).toStrictEqual({
      color: '#6b7280',
      width: 0.3,
      dash: [2.5, 1.5],
    })
    expect(createInkKit({ ...SOLID, width: 0.13 }).guide().width).toBe(0.098)
  })

  test('guide() overrides only the fields it is given', () => {
    const ink = createInkKit(SOLID)
    expect(ink.guide({ dash: [1, 1] })).toStrictEqual({
      color: '#6b7280',
      width: 0.3,
      dash: [1, 1],
    })
    expect(ink.guide({ width: 0.2 }).dash).toEqual([2.5, 1.5])
  })

  test('guide() is solid when its dash is overridden with undefined', () => {
    expect(createInkKit(SOLID).guide({ dash: undefined })).toStrictEqual({
      color: '#6b7280',
      width: 0.3,
    })
  })

  test('make() builds a stroke from scratch, with a dash only when one is given', () => {
    const { make } = createInkKit(SOLID)
    expect(make('#ff0000', 0.5)).toStrictEqual({ color: '#ff0000', width: 0.5 })
    expect(make('#ff0000', 0.5, [1, 2])).toStrictEqual({
      color: '#ff0000',
      width: 0.5,
      dash: [1, 2],
    })
  })
})

describe('createFontKit', () => {
  const theme = resolveTheme('vintage')
  const fonts = createFontKit(theme)

  test('body and heading take their stacks from the theme', () => {
    expect(fonts.body(4)).toStrictEqual({ family: theme.bodyFont, size: 4 })
    expect(fonts.heading(6, { weight: 700 })).toStrictEqual({
      family: theme.headingFont,
      size: 6,
      weight: 700,
    })
  })

  test('serif, cjk, mono and hand use fixed stacks whatever the theme', () => {
    expect(fonts.serif(5).family).toBe(
      "Georgia, 'Times New Roman', 'Songti SC', SimSun, serif",
    )
    expect(fonts.cjk(5).family).toBe(
      "'Kaiti SC', KaiTi, STKaiti, 'LXGW WenKai', 'Noto Serif CJK SC', 'Songti SC', SimSun, serif",
    )
    expect(fonts.mono(5).family).toBe(
      "ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace",
    )
    expect(fonts.hand(5).family).toBe(
      "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', 'Marker Felt', cursive",
    )
  })

  test('leaves weight and style out unless they are asked for', () => {
    expect(fonts.cjk(10)).toStrictEqual({
      family: fonts.cjk(10).family,
      size: 10,
    })
    expect(fonts.hand(5, { style: 'italic' })).toStrictEqual({
      family: fonts.hand(5).family,
      size: 5,
      style: 'italic',
    })
  })
})

describe('deepMerge', () => {
  test('recurses where both sides hold an object', () => {
    expect(
      deepMerge({ a: { x: 1, y: 2 }, keep: true }, { a: { y: 3, z: 4 } }),
    ).toEqual({ a: { x: 1, y: 3, z: 4 }, keep: true })
  })

  test('recurses more than one level deep', () => {
    expect(
      deepMerge({ a: { b: { c: 1, keep: 0 } } }, { a: { b: { c: 2 } } }),
    ).toEqual({ a: { b: { c: 2, keep: 0 } } })
  })

  test('lets the patch replace whatever is not an object on both sides', () => {
    expect(
      deepMerge({ a: [1, 2], b: 1, c: null }, { a: [3], b: { n: 1 }, c: 'x' }),
    ).toEqual({ a: [3], b: { n: 1 }, c: 'x' })
    expect(deepMerge({ a: { n: 1 } }, { a: 5 })).toEqual({ a: 5 })
  })

  test('adds the keys the base did not have', () => {
    expect(deepMerge({}, { a: { b: 1 } })).toEqual({ a: { b: 1 } })
  })

  test('leaves both arguments untouched', () => {
    const base = { a: { x: 1 } }
    const patch = { a: { y: 2 } }
    const out = deepMerge(base, patch)
    ;(out.a as { x: number }).x = 99
    expect(base).toEqual({ a: { x: 1 } })
    expect(patch).toEqual({ a: { y: 2 } })
    expect(out.a).not.toBe(base.a)
  })
})

describe('isPlainObject', () => {
  test('accepts object literals and rejects null, arrays and primitives', () => {
    expect(isPlainObject({ a: 1 })).toBe(true)
    expect(isPlainObject(Object.create(null))).toBe(true)
    expect(isPlainObject(null)).toBe(false)
    expect(isPlainObject([1])).toBe(false)
    expect(isPlainObject('x')).toBe(false)
    expect(isPlainObject(() => 1)).toBe(false)
  })
})

describe('getOption', () => {
  const options = {
    columns: { count: '2', gap: 12 },
    title: 'Notes',
    none: null,
  }

  test('reads the value at a dotted path', () => {
    expect(getOption(options, 'columns.gap', 8)).toBe(12)
    expect(getOption(options, 'columns.count', '1')).toBe('2')
  })

  test('reads a top-level key', () => {
    expect(getOption(options, 'title', '')).toBe('Notes')
  })

  test('returns the fallback when the path does not exist', () => {
    expect(getOption(options, 'columns.divider', 'solid')).toBe('solid')
    expect(getOption(options, 'nope.deeper', 0)).toBe(0)
  })

  test('returns the fallback when a segment on the way is not an object', () => {
    expect(getOption(options, 'title.length', 0)).toBe(0)
    expect(getOption(options, 'columns.gap.x', 0)).toBe(0)
  })

  test('returns the fallback for a null value', () => {
    expect(getOption(options, 'none', 'fallback')).toBe('fallback')
  })
})

describe('setOption', () => {
  test('sets a top-level key', () => {
    expect(setOption({ a: 1 }, 'b', 2)).toEqual({ a: 1, b: 2 })
  })

  test('sets a nested key and creates the missing parents', () => {
    expect(setOption({ a: 1 }, 'columns.gap', 12)).toEqual({
      a: 1,
      columns: { gap: 12 },
    })
  })

  test('keeps the siblings of the value it changes', () => {
    expect(
      setOption({ columns: { count: '1', gap: 8 } }, 'columns.count', '2'),
    ).toEqual({ columns: { count: '2', gap: 8 } })
  })

  test('replaces a parent that is not an object', () => {
    expect(setOption({ columns: 2 }, 'columns.count', '1')).toEqual({
      columns: { count: '1' },
    })
  })

  test('leaves the input untouched', () => {
    const options = { columns: { gap: 8 } }
    const out = setOption(options, 'columns.gap', 12)
    expect(options).toEqual({ columns: { gap: 8 } })
    expect(out.columns).not.toBe(options.columns)
  })
})

describe('resolveOptions', () => {
  const FIELDS: readonly OptionField[] = [
    {
      kind: 'number',
      key: 'gap',
      label: 'gap',
      min: 2,
      max: 40,
      step: 1,
      unit: 'mm',
      default: 8,
    },
    {
      kind: 'slider',
      key: 'opacity',
      label: 'opacity',
      min: 0,
      max: 1,
      step: 0.05,
      unit: '%',
      default: 0.5,
    },
    { kind: 'toggle', key: 'show', label: 'show', default: true },
    {
      kind: 'select',
      key: 'style',
      label: 'style',
      choices: [
        { value: 'solid', label: 'style.solid' },
        { value: 'dashed', label: 'style.dashed' },
      ],
      default: 'solid',
    },
    {
      kind: 'text',
      key: 'title',
      label: 'title',
      default: 'Notes',
      maxLength: 12,
    },
    { kind: 'color', key: 'ink', label: 'ink', default: '#112233' },
    {
      kind: 'group',
      key: 'layout',
      label: 'layout',
      fields: [
        {
          kind: 'number',
          key: 'layout.rows',
          label: 'rows',
          min: 1,
          max: 20,
          step: 1,
          default: 3,
        },
        {
          kind: 'toggle',
          key: 'layout.captions',
          label: 'captions',
          default: false,
        },
      ],
    },
  ]
  const DEFAULTS = {
    gap: 8,
    opacity: 0.5,
    show: true,
    style: 'solid',
    title: 'Notes',
    ink: '#112233',
    layout: { rows: 3, captions: false },
  }
  const resolve = (raw: unknown) => resolveOptions(FIELDS, DEFAULTS, raw)

  test('yields the defaults when raw has nothing', () => {
    expect(resolve({})).toStrictEqual(DEFAULTS)
    expect(resolve(undefined)).toStrictEqual(DEFAULTS)
  })

  test('treats a raw value that is not an object as empty', () => {
    expect(resolve('garbage')).toStrictEqual(DEFAULTS)
    expect(resolve(null)).toStrictEqual(DEFAULTS)
  })

  test('keeps the valid values raw provides', () => {
    expect(
      resolve({
        gap: 12,
        show: false,
        style: 'dashed',
        title: 'Plan',
        ink: '#abcdef',
        layout: { rows: 5 },
      }),
    ).toStrictEqual({
      ...DEFAULTS,
      gap: 12,
      show: false,
      style: 'dashed',
      title: 'Plan',
      ink: '#abcdef',
      layout: { rows: 5, captions: false },
    })
  })

  test('clamps a number into its range', () => {
    expect(resolve({ gap: 999 }).gap).toBe(40)
    expect(resolve({ gap: 1 }).gap).toBe(2)
    expect(resolve({ layout: { rows: 0 } }).layout).toStrictEqual({
      rows: 1,
      captions: false,
    })
  })

  test('uses the default for a value that is not a finite number', () => {
    expect(
      resolve({ gap: NaN, opacity: 'abc', layout: { rows: null } }),
    ).toStrictEqual({ ...DEFAULTS, layout: { rows: 3, captions: false } })
    expect(resolve({ gap: '', opacity: true }).gap).toBe(8)
  })

  test('accepts a numeric string, as a number input delivers it', () => {
    expect(resolve({ gap: '12' }).gap).toBe(12)
  })

  test('clamps a default that lies outside its own range', () => {
    const fields: readonly OptionField[] = [
      {
        kind: 'number',
        key: 'n',
        label: 'n',
        min: 0,
        max: 40,
        step: 1,
        default: 50,
      },
    ]
    expect(resolveOptions(fields, { n: 50 }, {}).n).toBe(40)
  })

  test('keeps only true or false for a toggle', () => {
    expect(resolve({ show: false }).show).toBe(false)
    expect(resolve({ show: 'yes' }).show).toBe(true)
  })

  test('keeps a select value that is one of the choices and falls back otherwise', () => {
    expect(resolve({ style: 'dashed' }).style).toBe('dashed')
    expect(resolve({ style: 'dotted' }).style).toBe('solid')
  })

  test('trims text and cuts it at maxLength', () => {
    expect(resolve({ title: '  My Plan  ' }).title).toBe('My Plan')
    expect(resolve({ title: 'abcdefghijklmnop' }).title).toBe('abcdefghijkl')
  })

  test('uses the default for text that is not a string', () => {
    expect(resolve({ title: 42 }).title).toBe('Notes')
  })

  test('keeps a colour written as #rrggbb and falls back otherwise', () => {
    expect(resolve({ ink: '#AbCdEf' }).ink).toBe('#AbCdEf')
    expect(resolve({ ink: '#fff' }).ink).toBe('#112233')
    expect(resolve({ ink: 'red' }).ink).toBe('#112233')
    expect(resolve({ ink: '#12345g' }).ink).toBe('#112233')
  })

  test('drops the keys no field declares', () => {
    expect(
      resolve({ bogus: 1, layout: { rows: 4, extra: true } }),
    ).toStrictEqual({ ...DEFAULTS, layout: { rows: 4, captions: false } })
  })

  test('recurses into the fields of a group', () => {
    expect(
      resolve({ layout: { rows: 10, captions: true } }).layout,
    ).toStrictEqual({ rows: 10, captions: true })
  })
})
