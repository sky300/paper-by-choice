import { describe, expect, test } from 'vitest'
import {
  expectFiniteNumbers,
  expectInside,
  renderPaper,
  shapesOf,
  textsOf,
} from '../testing/paperTestKit'
import creativeLog from './creativeLog'

describe('creativeLog', () => {
  test('renders a non-empty scene of finite numbers inside the area', () => {
    const { shapes, ctx } = renderPaper('creative_log')
    expect(shapes.length).toBeGreaterThan(0)
    expect(() => expectFiniteNumbers(shapes)).not.toThrow()
    expect(() => expectInside(shapes, ctx.area)).not.toThrow()
  })

  test('has matching zh/en message keys and a default in range', () => {
    expect(Object.keys(creativeLog.messages.en).sort()).toEqual(
      Object.keys(creativeLog.messages['zh-CN']).sort(),
    )
    expect(creativeLog.spacing.default).toBeGreaterThanOrEqual(
      creativeLog.spacing.min,
    )
    expect(creativeLog.spacing.default).toBeLessThanOrEqual(
      creativeLog.spacing.max,
    )
  })

  test('labels the four quadrants through i18n', () => {
    const zh = textsOf(renderPaper('creative_log').shapes)
    const en = textsOf(renderPaper('creative_log', { locale: 'en' }).shapes)
    expect(zh).toHaveLength(4)
    expect(en).toHaveLength(4)
    expect(zh.join()).not.toBe(en.join())
    expect(en.some((v) => /Ideas|Sources|Problems|Solutions/.test(v))).toBe(
      true,
    )
  })

  test('draws a central cross and a dashed grid', () => {
    const { shapes } = renderPaper('creative_log')
    const lines = shapesOf(shapes, 'line')
    expect(lines.filter((l) => l.stroke.dash).length).toBeGreaterThan(0)
    expect(
      lines.filter((l) => !l.stroke.dash && (l.y1 === l.y2 || l.x1 === l.x2)),
    ).toHaveLength(2)
  })

  test('spacing changes the dashed grid and A5 landscape stays inside', () => {
    const narrow = renderPaper('creative_log', { spacing: 6 })
    const wide = renderPaper('creative_log', { spacing: 15 })
    expect(shapesOf(narrow.shapes, 'line').length).toBeGreaterThan(
      shapesOf(wide.shapes, 'line').length,
    )
    const a5 = renderPaper('creative_log', {
      paperSize: 'a5',
      orientation: 'landscape',
    })
    expect(() => expectInside(a5.shapes, a5.ctx.area)).not.toThrow()
  })
})
