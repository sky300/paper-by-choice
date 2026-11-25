/**
 * 验证 projectPlanning 模块的 projectPlanning 行为。
 * Tests projectPlanning behavior covering projectPlanning.
 */
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

  test.each([
    ['zh-CN', ['项目名称:', '负责人:', '开始日期:', '截止日期:']],
    ['en', ['Project name:', 'Owner:', 'Start date:', 'Due date:']],
  ] as const)(
    'lays out the four info fields in two rows in %s',
    (locale, labels) => {
      const { shapes } = renderPaper('project_planning', { locale })
      const fields = labels.map((label) =>
        shapesOf(shapes, 'text').find((item) => item.text === label)!,
      )
      const [project, owner, start, due] = fields

      expect(project.y).toBe(owner.y)
      expect(start.y).toBe(due.y)
      expect(project.y).toBeLessThan(start.y)
      expect(project.x).toBe(start.x)
      expect(owner.x).toBe(due.x)
      expect(project.x).toBeLessThan(owner.x)

      const rules = shapesOf(shapes, 'line')
      for (const field of fields) {
        expect(
          rules.some(
            (rule) =>
              rule.x1 === field.x + 18.5 &&
              rule.y1 === field.y + 1.3 &&
              rule.y1 === rule.y2 &&
              rule.x2 > rule.x1,
          ),
        ).toBe(true)
      }
    },
  )

  test('draws a 5-row by 14-column Gantt grid', () => {
    const { shapes } = renderPaper('project_planning')
    const vert = shapesOf(shapes, 'line').filter((l) => l.x1 === l.x2)
    // 15 column separators in the chart, plus the accent-side line is horizontal.
    expect(vert.length).toBeGreaterThanOrEqual(15)
  })

  test.each([6, 8, 10])(
    'centres each checkbox between the ruled lines at %s mm spacing',
    (spacing) => {
      const { shapes, ctx } = renderPaper('project_planning', { spacing })
      const boxes = shapesOf(shapes, 'rect').filter(({ box }) => box.w === 2.6)
      const rules = shapesOf(shapes, 'line').filter(
        (line) =>
          line.x1 === ctx.area.x &&
          line.x2 === ctx.area.x + ctx.area.w &&
          line.y1 === line.y2,
      )
      expect(boxes.length).toBeGreaterThan(0)
      for (const { box, stroke } of boxes) {
        const middle = box.y + box.h / 2
        const above = rules.filter((rule) => rule.y1 < middle).at(-1)!
        const below = rules.find((rule) => rule.y1 > middle)!
        const upperGap =
          box.y - above.y1 - ((stroke?.width ?? 0) + above.stroke.width) / 2
        const lowerGap =
          below.y1 -
          (box.y + box.h) -
          ((stroke?.width ?? 0) + below.stroke.width) / 2
        expect(upperGap).toBeGreaterThan(0)
        expect(lowerGap).toBeCloseTo(upperGap)
      }
    },
  )

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
