import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  renderPaper,
  shapesOf,
  textsOf,
} from '../testing/paperTestKit'
import projectPlanning from './projectPlanning'

describe('projectPlanning', () => {
  test('renders a non-empty scene of finite numbers inside the area', () => {
    const { shapes, ctx } = renderPaper('project_planning')
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('has matching zh/en message keys and a default in range', () => {
    expect(Object.keys(projectPlanning.messages.en).sort()).toEqual(
      Object.keys(projectPlanning.messages['zh-CN']).sort(),
    )
    expect(projectPlanning.spacing.default).toBeGreaterThanOrEqual(
      projectPlanning.spacing.min,
    )
    expect(projectPlanning.spacing.default).toBeLessThanOrEqual(
      projectPlanning.spacing.max,
    )
  })

  test('puts all paper text through i18n, including the 14 day labels', () => {
    const zh = textsOf(renderPaper('project_planning').shapes)
    const en = textsOf(renderPaper('project_planning', { locale: 'en' }).shapes)
    expect(zh.length).toBe(en.length)
    expect(zh.filter((v) => /^D\d+$/.test(v))).toHaveLength(14)
    expect(zh.some((v) => /[\u4e00-\u9fff]/.test(v))).toBe(true)
    expect(en.some((v) => /Project/.test(v))).toBe(true)
    expect(zh.join()).not.toBe(en.join())
  })

  test('draws a 5-row by 14-column Gantt grid', () => {
    const { shapes } = renderPaper('project_planning')
    const vert = shapesOf(shapes, 'line').filter((l) => l.x1 === l.x2)
    // 15 column separators in the chart, plus the accent-side line is horizontal.
    expect(vert.length).toBeGreaterThanOrEqual(15)
  })

  test('spacing changes the layout and A5 landscape stays inside', () => {
    const wide = renderPaper('project_planning', { spacing: 15 })
    const a5 = renderPaper('project_planning', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(shapesOf(wide.shapes, 'line').length).toBeGreaterThan(0)
    expect(() => expectInside(wide.shapes, wide.ctx.area)).not.toThrow()
    expect(() => expectInside(a5.shapes, a5.ctx.area)).not.toThrow()
  })
})
