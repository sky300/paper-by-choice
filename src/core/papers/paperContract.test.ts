/**
 * Generic invariants every registered paper must satisfy. The suite walks
 * whatever papers are currently in the registry, so a paper added in another
 * batch is checked here without editing this file.
 */
import type { AnyPaper, OptionField } from './contract'
import { resolveOptions } from './kit'
import { isPaperType, papers } from './registry'
import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  renderPaper,
} from '../testing/paperTestKit'

const GROUPS = ['basic', 'worksheet', 'calligraphy', 'creative']

/** Every message key the spacing, fields and presets of a paper refer to. */
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

describe('paper contract: registry', () => {
  test('contains at least one paper', () => {
    expect(papers.length).toBeGreaterThan(0)
  })

  test.each(papers.map((paper) => [paper.type, paper] as const))(
    '%s declares a known type and group',
    (_type, paper) => {
      expect(isPaperType(paper.type)).toBe(true)
      expect(GROUPS).toContain(paper.group)
    },
  )
})

describe('paper contract: declaration', () => {
  test.each(papers.map((paper) => [paper.type, paper] as const))(
    '%s has matching, non-blank zh-CN and en messages',
    (_type, paper) => {
      const zh = paper.messages['zh-CN']
      const en = paper.messages.en
      expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
      expect(zh.name?.trim()).toBeTruthy()
      expect(
        [...Object.values(zh), ...Object.values(en)].filter(
          (text) => !text.trim(),
        ),
      ).toEqual([])
    },
  )

  test.each(papers.map((paper) => [paper.type, paper] as const))(
    '%s defines every message it refers to',
    (_type, paper) => {
      const keys = ['name', ...referencedKeys(paper)]
      for (const locale of ['zh-CN', 'en'] as const) {
        expect(keys.filter((key) => !paper.messages[locale][key])).toEqual([])
      }
    },
  )

  test.each(papers.map((paper) => [paper.type, paper] as const))(
    '%s has a sane spacing range',
    (_type, paper) => {
      const { min, max, step, default: value } = paper.spacing
      expect(min).toBeLessThan(max)
      expect(step).toBeGreaterThan(0)
      expect(value).toBeGreaterThanOrEqual(min)
      expect(value).toBeLessThanOrEqual(max)
    },
  )

  test.each(papers.map((paper) => [paper.type, paper] as const))(
    '%s has at least one preset with unique ids and defined copy',
    (_type, paper) => {
      expect(paper.presets.length).toBeGreaterThanOrEqual(1)
      const ids = paper.presets.map((preset) => preset.id)
      expect(new Set(ids).size).toBe(ids.length)
      for (const preset of paper.presets) {
        for (const locale of ['zh-CN', 'en'] as const) {
          expect(paper.messages[locale][preset.name]?.trim()).toBeTruthy()
          expect(
            paper.messages[locale][preset.description]?.trim(),
          ).toBeTruthy()
        }
      }
    },
  )

  test.each(papers.map((paper) => [paper.type, paper] as const))(
    '%s keeps defaultOptions in step with resolveOptions',
    (_type, paper) => {
      expect(resolveOptions(paper.fields, paper.defaultOptions, {})).toEqual(
        paper.defaultOptions,
      )
    },
  )
})

describe('paper contract: rendering', () => {
  test.each(papers.map((paper) => [paper.type, paper] as const))(
    '%s renders a non-empty, finite scene inside the area',
    (type) => {
      const { shapes, ctx } = renderPaper(type)
      if (type !== 'blank') expect(shapes.length).toBeGreaterThan(0)
      expect(() => expectFiniteNumbers(shapes)).not.toThrow()
      expect(() => expectInside(shapes, ctx.area)).not.toThrow()
    },
  )

  test.each(papers.map((paper) => [paper.type, paper] as const))(
    '%s stays inside at its min, default and max spacing',
    (type, paper) => {
      const { min, max, default: value } = paper.spacing
      for (const spacing of [min, value, max]) {
        const { shapes, ctx } = renderPaper(type, { spacing })
        expect(() => expectFiniteNumbers(shapes)).not.toThrow()
        expect(() => expectInside(shapes, ctx.area, 0.6)).not.toThrow()
      }
    },
  )

  test.each(papers.map((paper) => [paper.type, paper] as const))(
    '%s renders on A4 portrait and A5 landscape',
    (type) => {
      for (const overrides of [
        { paperSize: 'a4' as const, orientation: 'portrait' as const },
        { paperSize: 'a5' as const, orientation: 'landscape' as const },
      ]) {
        const { shapes, ctx } = renderPaper(type, overrides)
        expect(() => expectFiniteNumbers(shapes)).not.toThrow()
        expect(() => expectInside(shapes, ctx.area, 0.6)).not.toThrow()
      }
    },
  )

  test.each(papers.map((paper) => [paper.type, paper] as const))(
    '%s has a pure render()',
    (type) => {
      const a = renderPaper(type)
      const b = renderPaper(type)
      expect(b.scene).toEqual(a.scene)
    },
  )

  test.each(papers.map((paper) => [paper.type, paper] as const))(
    '%s renders in English without throwing',
    (type) => {
      expect(() => renderPaper(type, { locale: 'en' })).not.toThrow()
    },
  )
})
