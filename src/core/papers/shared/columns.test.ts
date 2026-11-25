/**
 * 验证 columns 模块的 COLUMNS_DEFAULTS、COLUMNS_FIELDS、COLUMNS_MESSAGES 行为。
 * Tests columns behavior covering COLUMNS_DEFAULTS, COLUMNS_FIELDS, COLUMNS_MESSAGES.
 */
import { resolveOptions } from '../kit'
import { describe, expect, test } from 'vitest'
import { COLUMNS_DEFAULTS, COLUMNS_FIELDS, COLUMNS_MESSAGES } from './columns'

/** `ColumnsOptions` is an interface, which TypeScript will not pass off as a `Record`; a copy of it will. */
const DEFAULTS: Record<string, unknown> = { ...COLUMNS_DEFAULTS }

describe('COLUMNS_DEFAULTS', () => {
  test('is a single column with an 8 mm gap and a solid divider', () => {
    expect(COLUMNS_DEFAULTS).toEqual({
      columns: { count: '1', gap: 8, divider: 'solid' },
    })
  })
})

describe('COLUMNS_FIELDS', () => {
  test('declares count, gap and divider under columns', () => {
    expect(COLUMNS_FIELDS.map((field) => field.key)).toEqual([
      'columns.count',
      'columns.gap',
      'columns.divider',
    ])
  })

  test('clamps the gap to 40 mm when asked for 999', () => {
    expect(
      resolveOptions(COLUMNS_FIELDS, DEFAULTS, {
        columns: { count: '2', gap: 999 },
      }),
    ).toEqual({ columns: { count: '2', gap: 40, divider: 'solid' } })
  })

  test('resolves to the defaults when nothing is set', () => {
    expect(resolveOptions(COLUMNS_FIELDS, DEFAULTS, {})).toEqual(DEFAULTS)
  })

  test('shows the gap and the divider only with two columns', () => {
    const shownWith = (count: string) =>
      COLUMNS_FIELDS.filter(
        (field) => !field.showIf || field.showIf({ columns: { count } }),
      ).map((field) => field.key)
    expect(shownWith('1')).toEqual(['columns.count'])
    expect(shownWith('2')).toEqual([
      'columns.count',
      'columns.gap',
      'columns.divider',
    ])
  })
})

describe('COLUMNS_MESSAGES', () => {
  test('labels every field and every choice in both locales', () => {
    const keys = new Set<string>()
    for (const field of COLUMNS_FIELDS) {
      keys.add(field.label)
      if (field.kind === 'select') {
        for (const choice of field.choices) keys.add(choice.label)
      }
    }
    for (const locale of ['zh-CN', 'en'] as const) {
      const missing = [...keys].filter((key) => !COLUMNS_MESSAGES[locale][key])
      expect(missing).toEqual([])
    }
  })

  test('uses the same keys in both locales', () => {
    expect(Object.keys(COLUMNS_MESSAGES.en).sort()).toEqual(
      Object.keys(COLUMNS_MESSAGES['zh-CN']).sort(),
    )
  })
})
