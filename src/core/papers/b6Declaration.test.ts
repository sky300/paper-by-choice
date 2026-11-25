import { describe, expect, test } from 'vitest'
import chinesetianzi from './chinesetianzi'
import crossgrid from './crossgrid'
import hardpenCalligraphyPaper from './hardpenCalligraphyPaper'
import hardpenHuigongge from './hardpenHuigongge'
import huigongge from './huigongge'
import huimige from './huimige'
import jiugongge from './jiugongge'
import { resolveOptions } from './kit'
import type { AnyPaper } from './contract'

const papers: AnyPaper[] = [
  huigongge,
  jiugongge,
  chinesetianzi,
  huimige,
  hardpenCalligraphyPaper,
  crossgrid,
  hardpenHuigongge,
]

describe('B6 calligraphy papers: declarations', () => {
  test('all seven are calligraphy papers recommending a frame', () => {
    expect(papers).toHaveLength(7)
    for (const paper of papers) {
      expect(paper.group).toBe('calligraphy')
      expect(paper.suggestsCalligraphyFrame).toBe(true)
    }
    expect(new Set(papers.map((paper) => paper.type)).size).toBe(7)
  })

  test('every zh-CN and en key matches, none blank', () => {
    for (const paper of papers) {
      expect(Object.keys(paper.messages.en).sort()).toEqual(
        Object.keys(paper.messages['zh-CN']).sort(),
      )
      expect(paper.messages['zh-CN'].name).toBeTruthy()
      expect(paper.messages.en.name).toBeTruthy()
      expect(
        [
          ...Object.values(paper.messages['zh-CN']),
          ...Object.values(paper.messages.en),
        ].filter((text) => !text.trim()),
      ).toEqual([])
    }
  })

  test('every referenced message key exists in both locales', () => {
    for (const paper of papers) {
      const keys = [
        'name',
        paper.spacing.label,
        paper.spacing.hint,
        ...paper.fields.map((field) => field.label),
        ...paper.presets.flatMap((p) => [p.name, p.description]),
      ]
      for (const locale of ['zh-CN', 'en'] as const) {
        expect(keys.filter((key) => !paper.messages[locale][key])).toEqual([])
      }
    }
  })

  test('each spacing default lies inside its range', () => {
    for (const paper of papers) {
      const { min, max, default: value } = paper.spacing
      expect(value).toBeGreaterThanOrEqual(min)
      expect(value).toBeLessThanOrEqual(max)
    }
  })

  test('defaultOptions resolve back to themselves and preset ids are unique', () => {
    for (const paper of papers) {
      expect(resolveOptions(paper.fields, paper.defaultOptions, {})).toEqual(
        paper.defaultOptions,
      )
      const ids = paper.presets.map((preset) => preset.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(ids.length).toBeGreaterThan(0)
    }
  })
})
