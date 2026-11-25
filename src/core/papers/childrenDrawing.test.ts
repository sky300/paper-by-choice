import type { AnyPaper, OptionField } from './contract'
import childrenDrawing from './childrenDrawing'
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

describe('children_drawing: declaration', () => {
  test('is a creative paper that sizes its title bar 10–25 mm, 15 by default', () => {
    expect(childrenDrawing.type).toBe('children_drawing')
    expect(childrenDrawing.group).toBe('creative')
    expect(childrenDrawing.spacing).toMatchObject({
      min: 10,
      max: 25,
      step: 1,
      default: 15,
    })
    expect(childrenDrawing.fields).toEqual([])
    expect(childrenDrawing.defaultOptions).toEqual({})
  })

  test('keeps its zh-CN and en messages in step and defines every referenced key', () => {
    const zh = childrenDrawing.messages['zh-CN']
    const en = childrenDrawing.messages.en
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
    const keys = ['name', ...referencedKeys(childrenDrawing)]
    for (const locale of ['zh-CN', 'en'] as const) {
      expect(
        keys.filter((key) => !childrenDrawing.messages[locale][key]),
      ).toEqual([])
    }
    expect(
      [...Object.values(zh), ...Object.values(en)].filter((v) => !v.trim()),
    ).toEqual([])
  })

  test('starts with a named A4 template and keeps preset ids apart', () => {
    expect(childrenDrawing.presets[0]?.patch).toEqual({})
    const ids = childrenDrawing.presets.map((preset) => preset.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('children_drawing: rendering', () => {
  test('renders a non-empty scene of finite numbers inside the area', () => {
    const { shapes, ctx } = renderPaper('children_drawing')
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('draws exactly ten faint five-point stars inside the drawing area', () => {
    const { shapes } = renderPaper('children_drawing')
    const stars = shapesOf(shapes, 'poly')
    expect(stars).toHaveLength(10)
    expect(stars.every((star) => star.points.length === 10)).toBe(true)
    expect(stars.every((star) => star.closed === true)).toBe(true)
    expect(stars.every((star) => star.fill?.opacity === 0.3)).toBe(true)
    expect(stars.every((star) => star.stroke === undefined)).toBe(true)
  })

  test('makes the title bar exactly one spacing tall and outlines the drawing area', () => {
    const { shapes, ctx } = renderPaper('children_drawing', { spacing: 15 })
    const rects = shapesOf(shapes, 'rect')
    const bar = rects.find((r) => r.fill?.opacity !== undefined)
    expect(bar?.box).toEqual({
      x: ctx.area.x,
      y: ctx.area.y,
      w: ctx.area.w,
      h: ctx.spacing,
    })
    const outline = rects.find((r) => r.stroke !== undefined)
    expect(outline?.box).toEqual(ctx.area)
  })

  test('grows the title bar with the spacing', () => {
    const narrow = renderPaper('children_drawing', { spacing: 10 })
    const wide = renderPaper('children_drawing', { spacing: 25 })
    const barHeight = (r: ReturnType<typeof renderPaper>) =>
      shapesOf(r.shapes, 'rect').find(
        (rect) => rect.fill?.opacity !== undefined,
      )?.box.h
    expect(barHeight(narrow)).toBe(10)
    expect(barHeight(wide)).toBe(25)
  })

  test('prints the translated title through ctx.t()', () => {
    const zh = renderPaper('children_drawing')
    const en = renderPaper('children_drawing', { locale: 'en' })
    expect(textsOf(zh.shapes)).toContain('我的创作')
    expect(textsOf(en.shapes)).toContain('My creation')
    const title = shapesOf(zh.shapes, 'text')[0]
    expect(title?.anchor).toBe('middle')
  })

  test('renders on an A5 landscape page without leaving the writing area', () => {
    const { shapes, ctx } = renderPaper('children_drawing', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })
})

describe('children_drawing: messages', () => {
  test('is called by its name', () => {
    expect(paperName(childrenDrawing, 'zh-CN')).toBe('儿童涂鸦纸')
    expect(paperName(childrenDrawing, 'en')).toBe('Drawing paper for kids')
  })
})
