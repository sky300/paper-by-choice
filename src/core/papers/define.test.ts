/**
 * 验证 define 模块的 definePaper 行为。
 * Tests define behavior covering definePaper.
 */
import { line } from '../scene/builders'
import type { Scene } from '../scene/types'
import { resolveTheme } from '../themes'
import type { Locale } from '../types'
import { describe, expect, test } from 'vitest'
import type { AnyPaper, PaperDef, RenderContext } from './contract'
import { definePaper } from './define'
import { createFontKit, createInkKit } from './kit'

interface Options {
  rows: number
}

const MESSAGES = { 'zh-CN': { name: '分镜纸' }, en: { name: 'Storyboard' } }

/** A context with nothing in it; each test supplies the options it cares about. */
function baseContext(): RenderContext<Record<string, unknown>> {
  const theme = resolveTheme('default')
  return {
    type: 'storyboard',
    page: { width: 210, height: 297 },
    area: { x: 20, y: 20, w: 170, h: 257 },
    spacing: 10,
    theme,
    options: {},
    ink: createInkKit({
      color: theme.lines,
      width: 0.13,
      style: 'solid',
      spacing: 10,
    }),
    fonts: createFontKit(theme),
    t: (key) => key,
    locale: 'zh-CN' satisfies Locale,
  }
}

describe('definePaper', () => {
  test('keeps every part of the definition', () => {
    const def: PaperDef<Options> = {
      type: 'storyboard',
      group: 'basic',
      messages: MESSAGES,
      spacing: {
        label: 'spacing.label',
        hint: 'spacing.hint',
        min: 5,
        max: 20,
        step: 1,
        default: 10,
      },
      fields: [
        {
          kind: 'number',
          key: 'rows',
          label: 'field.rows',
          min: 1,
          max: 12,
          step: 1,
          default: 3,
        },
      ],
      defaultOptions: { rows: 3 },
      presets: [
        {
          id: 'grid',
          name: 'preset.grid.name',
          description: 'preset.grid.description',
          patch: {},
        },
      ],
      render: () => [],
    }
    expect(definePaper(def)).toStrictEqual(def)
  })

  test('yields a paper that can be stored as AnyPaper and renders with its options passed through untouched', () => {
    const seen: unknown[] = []
    const def: PaperDef<Options> = {
      type: 'storyboard',
      group: 'basic',
      messages: MESSAGES,
      spacing: { label: 'l', hint: 'h', min: 1, max: 9, step: 1, default: 3 },
      fields: [],
      defaultOptions: { rows: 1 },
      presets: [],
      render: (ctx) => {
        seen.push(ctx.options)
        return [line(0, 0, 1, 0, ctx.ink.main())]
      },
    }
    const paper: AnyPaper = definePaper(def)
    const options = { rows: 5 }
    const scene = paper.render({ ...baseContext(), options })
    expect(seen[0]).toBe(options)
    expect(scene).toHaveLength(1)
  })

  test('hands render the options typed as the paper declared them', () => {
    const paper = definePaper({
      type: 'storyboard',
      group: 'basic',
      messages: MESSAGES,
      spacing: { label: 'l', hint: 'h', min: 1, max: 9, step: 1, default: 3 },
      fields: [],
      defaultOptions: { rows: 2 },
      presets: [],
      render: (ctx): Scene =>
        Array.from({ length: ctx.options.rows }, (_, index) =>
          line(0, index, ctx.spacing, index, ctx.ink.main()),
        ),
    })
    expect(
      paper.render({ ...baseContext(), options: { rows: 4 } }),
    ).toHaveLength(4)
  })
})
