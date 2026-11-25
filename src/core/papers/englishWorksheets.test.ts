/**
 * 验证英文作业纸的分类、英寸节距和描红行为。
 * Checks English worksheet grouping, imperial pitch, and tracing behavior.
 */
import { describe, expect, test } from 'vitest'
import { paperScene } from '../compose/document'
import { createSettings, sanitizeSettings } from '../settings'
import { papersByGroup } from './registry'
import { shapesOf } from '../testing/paperTestKit'

describe('English worksheets', () => {
  test('draws a 10 mm four-line group with a red baseline and bounded slanted guides', () => {
    const settings = createSettings('english_slanted')
    const rules = shapesOf(paperScene(settings, 'en'), 'line')
    const baseline = rules.find((rule) => rule.stroke.color === '#a94545')!
    const top = baseline.y1 - 20 / 3
    const bottom = top + 10
    const guide = rules.find((rule) => rule.y1 > rule.y2 && rule.x2 > rule.x1)!
    expect(guide.y1).toBeCloseTo(bottom)
    expect(guide.y2).toBeCloseTo(top)
    expect(
      rules.some((rule) => rule.y1 === guide.y1 && rule.y2 === guide.y1),
    ).toBe(true)
  })

  test('registers the English catalogue and the three-colour preset', () => {
    expect(papersByGroup('english').map((paper) => paper.type)).toEqual([
      'english_paper',
      'english_primary',
      'english_double_line',
      'english_slanted',
      'english_tracing',
      'english_dictation',
      'english_vocabulary',
      'english_draw_write',
      'chinese_english_word_practice',
    ])
    const sky = createSettings('english_paper', 'english-sky-grass-ground')
    expect(shapesOf(paperScene(sky, 'en'), 'rect').length).toBeGreaterThan(0)
  })

  test('preserves the publisher-inspired 5/8-inch pitch through saved settings', () => {
    const settings = sanitizeSettings(createSettings('english_primary'))
    expect(settings.line.spacing).toBeCloseTo(15.875, 6)
    const rules = shapesOf(paperScene(settings, 'en'), 'line').filter(
      (rule) => rule.y1 > 35,
    )
    expect(rules[3].y1 - rules[0].y1).toBeCloseTo(15.875)
  })

  test('shows the supplied tracing text twice and keeps the next guide blank', () => {
    const settings = createSettings('english_tracing')
    settings.options = { sample: 'Hello world' }
    const labels = shapesOf(paperScene(settings, 'en'), 'text').filter(
      (item) => item.text === 'Hello world',
    )
    expect(labels).toHaveLength(2)
    expect(labels[1].fill.color).not.toBe(labels[0].fill.color)
  })
})
