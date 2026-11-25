import { circle, group, line, rect, text } from '../scene/builders'
import { THEMES } from '../themes'
import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  horizontalPositions,
  renderPaper,
  shapesOf,
  textsOf,
  verticalPositions,
} from './paperTestKit'

const ink = { color: '#000000', width: 0.3 }
const font = { family: 'serif', size: 4 }
/** The writing area of an A4 portrait page with 20 mm margins. */
const AREA = { x: 20, y: 20, w: 170, h: 257 }

describe('renderPaper', () => {
  test('renders an A4 portrait page with 20 mm margins by default', () => {
    const { ctx } = renderPaper('lined')
    expect(ctx.page).toEqual({ width: 210, height: 297 })
    expect(ctx.area).toEqual(AREA)
  })

  test('takes size, orientation and margins from the overrides', () => {
    const { ctx } = renderPaper('lined', {
      paperSize: 'a5',
      orientation: 'landscape',
      margins: { top: 10 },
    })
    expect(ctx.page).toEqual({ width: 210, height: 148 })
    expect(ctx.area).toEqual({ x: 20, y: 10, w: 170, h: 118 })
  })

  test('takes a custom size as given, whatever the orientation', () => {
    const { ctx } = renderPaper('lined', {
      paperSize: 'custom',
      orientation: 'landscape',
      customSize: { width: 100, height: 50 },
    })
    expect(ctx.page).toEqual({ width: 100, height: 50 })
  })

  test('uses the default theme, whose line colour it hands to the ink kit', () => {
    const { ctx } = renderPaper('lined')
    expect(ctx.theme).toBe(THEMES[0])
    expect(ctx.ink.main()).toStrictEqual({
      color: THEMES[0].lines,
      width: 0.13,
    })
  })

  test('takes the theme from the overrides, line colour included', () => {
    const { ctx } = renderPaper('lined', { theme: 'night' })
    expect(ctx.theme.key).toBe('night')
    expect(ctx.ink.main().color).toBe(ctx.theme.lines)
  })

  test('lets the line overrides replace colour, width and style', () => {
    const { ctx } = renderPaper('lined', {
      line: { color: '#ff0000', width: 0.5, style: 'dotted' },
    })
    expect(ctx.ink.main()).toStrictEqual({
      color: '#ff0000',
      width: 0.5,
      dash: [0.6, 1.4],
    })
  })

  test('takes the spacing from the paper by default', () => {
    const { ctx, paper } = renderPaper('lined')
    expect(ctx.spacing).toBe(paper.spacing.default)
  })

  test('snaps a spacing override to the step and clamps it to the range', () => {
    expect(renderPaper('lined', { spacing: 8.3 }).ctx.spacing).toBe(8.5)
    expect(renderPaper('lined', { spacing: 99 }).ctx.spacing).toBe(20)
    expect(renderPaper('lined', { spacing: 1 }).ctx.spacing).toBe(4)
  })

  test('starts from the paper defaults for options, type and locale', () => {
    const { ctx, paper } = renderPaper('lined')
    expect(ctx.type).toBe(paper.type)
    expect(ctx.options).toStrictEqual(paper.defaultOptions)
    expect(ctx.locale).toBe('zh-CN')
    expect(ctx.t('name')).toBe(paper.messages['zh-CN'].name)
  })

  test('switches the locale with the override', () => {
    const { ctx, paper } = renderPaper('lined', { locale: 'en' })
    expect(ctx.locale).toBe('en')
    expect(ctx.t('name')).toBe(paper.messages.en.name)
  })

  test('validates the option overrides against the fields of the paper', () => {
    const { ctx, paper } = renderPaper('lined', { options: { bogus: 1 } })
    expect(ctx.options).toStrictEqual(paper.defaultOptions)
  })

  test('hands the paper fonts built from the theme', () => {
    const { ctx } = renderPaper('lined', { theme: 'vintage' })
    expect(ctx.fonts.body(4).family).toBe(ctx.theme.bodyFont)
  })

  test('returns the paper, the scene it rendered and the shapes of that scene', () => {
    const { paper, scene, shapes } = renderPaper('lined')
    expect(paper.type).toBe('lined')
    expect(shapes).toEqual([...scene])
    expect(shapes).not.toBe(scene)
  })
})

describe('horizontalPositions', () => {
  test('lists the y of the horizontal lines, without repeats, ascending', () => {
    const items = [
      line(0, 30, 10, 30, ink),
      line(0, 10, 10, 10, ink),
      line(5, 0, 5, 40, ink),
      line(0, 30, 10, 30, ink),
    ]
    expect(horizontalPositions(items)).toEqual([10, 30])
  })

  test('looks inside groups', () => {
    expect(horizontalPositions([group([line(0, 28, 10, 28, ink)])])).toEqual([
      28,
    ])
  })
})

describe('verticalPositions', () => {
  test('lists the x of the vertical lines, without repeats, ascending', () => {
    const items = [
      line(30, 0, 30, 10, ink),
      line(10, 0, 10, 10, ink),
      line(0, 5, 40, 5, ink),
    ]
    expect(verticalPositions(items)).toEqual([10, 30])
  })

  test('looks inside groups', () => {
    expect(verticalPositions([group([line(190, 0, 190, 10, ink)])])).toEqual([
      190,
    ])
  })
})

describe('textsOf', () => {
  test('lists the text of the text items in order', () => {
    const items = [
      line(0, 0, 1, 1, ink),
      text(0, 0, '姓名', font, '#000000'),
      group([text(0, 5, 'Name', font, '#000000')]),
      rect({ x: 0, y: 0, w: 1, h: 1 }),
    ]
    expect(textsOf(items)).toEqual(['姓名', 'Name'])
  })
})

describe('shapesOf', () => {
  test('keeps the shapes of one kind, groups opened', () => {
    const items = [
      rect({ x: 0, y: 0, w: 1, h: 1 }),
      group([text(0, 5, 'a', font, '#000000')]),
      text(0, 0, 'b', font, '#000000'),
    ]
    expect(shapesOf(items, 'text').map((item) => item.text)).toEqual(['a', 'b'])
    expect(shapesOf(items, 'rect')).toHaveLength(1)
  })
})

describe('expectInside', () => {
  test('passes while every item lies within the box, edge included', () => {
    const items = [
      line(20, 28, 190, 28, ink),
      rect({ x: 20, y: 20, w: 170, h: 257 }),
      group([line(20, 277, 190, 277, ink)]),
    ]
    expect(() => expectInside(items, AREA)).not.toThrow()
  })

  test('forgives an overshoot within the tolerance', () => {
    expect(() =>
      expectInside([circle(169.8, 20.2, 0.5, ink)], AREA),
    ).not.toThrow()
  })

  test('throws, listing each offending item, when one lies further out than the tolerance', () => {
    const items = [
      line(20, 28, 190, 28, ink),
      rect({ x: 10, y: 10, w: 5, h: 5 }),
      line(20, 278, 190, 278, ink),
    ]
    expect(() => expectInside(items, AREA)).toThrow(
      /2 of 3 items[\s\S]*#1 rect[\s\S]*#2 line/,
    )
  })

  test('goes by the tolerance it is given', () => {
    // 0.5 mm past the bottom edge.
    const items = [line(20, 277.5, 190, 277.5, ink)]
    expect(() => expectInside(items, AREA, 0.5)).not.toThrow()
    expect(() => expectInside(items, AREA, 0.4)).toThrow(/1 of 1 items/)
  })

  test('measures a circle by its full extent', () => {
    expect(() => expectInside([circle(168, 20.2, 1, ink)], AREA)).toThrow(
      /ellipse/,
    )
  })
})

describe('expectFiniteNumbers', () => {
  test('passes while every number of every item is finite', () => {
    const items = [
      line(20, 28, 190, 28, { color: '#000000', width: 0.3, dash: [1, 2] }),
      group([
        circle(5, 5, 0.25, undefined, { color: '#000000', opacity: 0.5 }),
      ]),
      text(1, 2, 'abc', font, '#000000', { rotate: 0 }),
    ]
    expect(() => expectFiniteNumbers(items)).not.toThrow()
  })

  test('throws, naming the item and the field, when a number is not finite', () => {
    const items = [
      line(0, NaN, 1, 1, ink),
      line(0, 0, 1, Infinity, { color: '#000000', width: 0.3 }),
    ]
    expect(() => expectFiniteNumbers(items)).toThrow(
      /not finite[\s\S]*#0 line[\s\S]*y1 = NaN[\s\S]*#1 line[\s\S]*y2 = Infinity/,
    )
  })

  test('finds a bad number nested in a stroke', () => {
    const items = [line(0, 0, 1, 1, { color: '#000000', width: NaN })]
    expect(() => expectFiniteNumbers(items)).toThrow(/stroke\.width = NaN/)
  })
})
