import type { AnyPaper, OptionField } from './contract'
import vintageNote from './vintageNote'
import { paperName } from './registry'
import { resolveOptions } from './kit'
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

describe('vintage_note: declaration', () => {
  test('is a creative paper', () => {
    expect(vintageNote.type).toBe('vintage_note')
    expect(vintageNote.group).toBe('creative')
  })

  test('spaces its rules 6–15 mm in 0.5 mm steps, 9 mm by default', () => {
    expect(vintageNote.spacing).toMatchObject({
      label: 'spacing.label',
      hint: 'spacing.hint',
      min: 6,
      max: 15,
      step: 0.5,
      default: 9,
    })
  })

  test('declares one vertical-line position field with a consistent default', () => {
    expect(vintageNote.fields).toMatchObject([
      {
        kind: 'number',
        key: 'vintageNote.verticalLinePosition',
        min: 5,
        max: 100,
        default: 15,
      },
    ])
    expect(vintageNote.defaultOptions).toEqual({
      vintageNote: { verticalLinePosition: 15 },
    })
    expect(
      resolveOptions(vintageNote.fields, vintageNote.defaultOptions, {}),
    ).toEqual(vintageNote.defaultOptions)
  })

  test('keeps its zh-CN and en messages in step, none of them blank', () => {
    const zh = vintageNote.messages['zh-CN']
    const en = vintageNote.messages.en
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
    expect(
      [...Object.values(zh), ...Object.values(en)].filter(
        (text) => !text.trim(),
      ),
    ).toEqual([])
  })

  test('defines every message it refers to, in both locales', () => {
    const keys = ['name', ...referencedKeys(vintageNote)]
    for (const locale of ['zh-CN', 'en'] as const) {
      expect(keys.filter((key) => !vintageNote.messages[locale][key])).toEqual(
        [],
      )
    }
  })

  test('starts with a named vintage template and keeps its preset ids apart', () => {
    expect(vintageNote.presets[0]).toMatchObject({ id: 'vintage-note' })
    const ids = vintageNote.presets.map((preset) => preset.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('sets the vintage theme and classic margins on its named template', () => {
    expect(vintageNote.presets[0]?.patch).toMatchObject({
      theme: 'vintage',
      margins: { top: 25, right: 20, bottom: 25, left: 25 },
    })
  })
})

describe('vintage_note: rendering', () => {
  test('renders a non-empty scene of finite numbers inside the area', () => {
    const { shapes, ctx } = renderPaper('vintage_note')
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('draws no printed text, as the spec leaves the page blank for handwriting', () => {
    const { shapes } = renderPaper('vintage_note')
    expect(textsOf(shapes)).toEqual([])
  })

  test('places one accent-coloured title line 3 spacings below the top edge', () => {
    const { shapes, ctx } = renderPaper('vintage_note')
    const accent = ctx.theme.accent
    const titleLines = shapesOf(shapes, 'line').filter(
      (item) => item.y1 === item.y2 && item.stroke.color === accent,
    )
    expect(titleLines).toHaveLength(1)
    expect(titleLines[0]?.y1).toBe(ctx.area.y + 3 * ctx.spacing)
    expect(titleLines[0]?.x1).toBe(ctx.area.x)
    expect(titleLines[0]?.x2).toBe(ctx.area.x + ctx.area.w)
  })

  test('draws the body rules from 4 spacings down at the line colour and width', () => {
    const { shapes, ctx } = renderPaper('vintage_note')
    const main = ctx.ink.main()
    const body = shapesOf(shapes, 'line').filter(
      (item) => item.y1 === item.y2 && item.stroke.color === main.color,
    )
    expect(body.length).toBeGreaterThan(0)
    expect(body[0]?.y1).toBe(ctx.area.y + 4 * ctx.spacing)
    // A4 with 20 mm margins: h = 257, offset 36, step 9 -> 25 rules.
    expect(body).toHaveLength(25)
    expect(body.every((item) => item.stroke.width === main.width)).toBe(true)
    expect(body.every((item) => item.x1 === 20 && item.x2 === 190)).toBe(true)
  })

  test('draws the vertical guide 15 mm from the left edge in the accent colour', () => {
    const { shapes, ctx } = renderPaper('vintage_note')
    const accent = ctx.theme.accent
    const verticals = shapesOf(shapes, 'line').filter(
      (item) => item.x1 === item.x2 && item.stroke.color === accent,
    )
    expect(verticals).toHaveLength(1)
    expect(verticals[0]?.x1).toBe(ctx.area.x + 15)
    expect(verticals[0]?.y1).toBe(ctx.area.y)
    expect(verticals[0]?.y2).toBe(ctx.area.y + ctx.area.h)
  })

  test('draws four L-shaped corner brackets, each 5.3 mm on a side', () => {
    const { shapes, ctx } = renderPaper('vintage_note')
    const brackets = shapesOf(shapes, 'poly')
    expect(brackets).toHaveLength(4)
    expect(brackets.every((item) => item.closed === false)).toBe(true)
    expect(brackets.every((item) => item.points.length === 3)).toBe(true)
    expect(brackets.every((item) => item.fill === undefined)).toBe(true)
    expect(
      brackets.every((item) => item.stroke?.color === ctx.theme.accent),
    ).toBe(true)
    const { x: L, y: T, w: AW, h: AH } = ctx.area
    const R = L + AW
    const B = T + AH
    const arm = 5.3
    expect(brackets[0]?.points[1]).toEqual({ x: L, y: T })
    expect(brackets[1]?.points[1]).toEqual({ x: R, y: T })
    expect(brackets[2]?.points[1]).toEqual({ x: L, y: B })
    expect(brackets[3]?.points[1]).toEqual({ x: R, y: B })
    expect(brackets[0]?.points[2]).toEqual({ x: L + arm, y: T })
  })

  test('makes more body rules at the smallest spacing and fewer at the largest', () => {
    const narrow = renderPaper('vintage_note', { spacing: 6 })
    const wide = renderPaper('vintage_note', { spacing: 15 })
    const bodyCount = (shapes: ReturnType<typeof renderPaper>['shapes']) =>
      horizontalPositions(
        shapesOf(shapes, 'line').filter(
          (item) => item.stroke.color === narrow.ctx.ink.main().color,
        ),
      ).length
    expect(bodyCount(narrow.shapes)).toBeGreaterThan(bodyCount(wide.shapes))
    expect(() => expectInside(narrow.shapes, narrow.ctx.area)).not.toThrow()
    expect(() => expectInside(wide.shapes, wide.ctx.area)).not.toThrow()
  })

  test('moves the title line with the spacing', () => {
    const { shapes, ctx } = renderPaper('vintage_note', { spacing: 12 })
    const accent = ctx.theme.accent
    const title = shapesOf(shapes, 'line').find(
      (item) => item.y1 === item.y2 && item.stroke.color === accent,
    )
    expect(title?.y1).toBe(ctx.area.y + 36)
  })

  test('renders on an A5 landscape page without leaving the writing area', () => {
    const { shapes, ctx } = renderPaper('vintage_note', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(ctx.area).toEqual({ x: 20, y: 20, w: 170, h: 108 })
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('moves the vertical guide when its position option changes', () => {
    const { shapes, ctx } = renderPaper('vintage_note', {
      options: { vintageNote: { verticalLinePosition: 40 } },
    })
    expect(verticalPositions(shapes)).toEqual([ctx.area.x + 40])
  })

  test('clamps an out-of-range position through resolveOptions', () => {
    const { shapes, ctx } = renderPaper('vintage_note', {
      options: { vintageNote: { verticalLinePosition: 999 } },
    })
    expect(ctx.options).toEqual({ vintageNote: { verticalLinePosition: 100 } })
    expect(verticalPositions(shapes)).toEqual([ctx.area.x + 100])
  })

  test('keeps the vertical guide inside the area even when the position exceeds its width', () => {
    const { shapes, ctx } = renderPaper('vintage_note', {
      paperSize: 'a5',
      orientation: 'landscape',
      options: { vintageNote: { verticalLinePosition: 100 } },
    })
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('uses the user line colour only for the body rules', () => {
    const { shapes, ctx } = renderPaper('vintage_note', {
      line: { color: '#ff0000' },
    })
    const body = shapesOf(shapes, 'line').filter(
      (item) => item.y1 === item.y2 && item.stroke.color === '#ff0000',
    )
    expect(body.length).toBeGreaterThan(0)
    const accentLines = shapesOf(shapes, 'line').filter(
      (item) => item.stroke.color === ctx.theme.accent,
    )
    expect(accentLines.length).toBeGreaterThan(0)
  })

  test('keeps the accent emphasis at 1.5 times the body line width', () => {
    const { shapes, ctx } = renderPaper('vintage_note')
    const mainWidth = ctx.ink.main().width
    const emphasis = [
      ...shapesOf(shapes, 'line').filter(
        (item) => item.stroke.color === ctx.theme.accent,
      ),
      ...shapesOf(shapes, 'poly'),
    ]
    expect(emphasis.length).toBeGreaterThan(0)
    expect(
      emphasis.every((item) => item.stroke?.width === mainWidth * 1.5),
    ).toBe(true)
  })
})

describe('vintage_note: messages', () => {
  test('names its spacing parameter in both locales', () => {
    expect(renderPaper('vintage_note').ctx.t('spacing.label')).toBe('行距')
    expect(
      renderPaper('vintage_note', { locale: 'en' }).ctx.t('spacing.label'),
    ).toBe('Line spacing')
  })

  test('is called by its name', () => {
    expect(paperName(vintageNote, 'zh-CN')).toBe('复古笔记纸')
    expect(paperName(vintageNote, 'en')).toBe('Vintage notes')
  })
})
