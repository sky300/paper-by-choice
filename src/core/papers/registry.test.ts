/**
 * 验证 registry 模块的 PAPER_ORDER、collectPapers、papers 行为。
 * Tests registry behavior covering PAPER_ORDER, collectPapers, papers.
 */
import { describe, expect, test } from 'vitest'
import type { AnyPaper, PaperMessages } from './contract'
import {
  PAPER_ORDER,
  collectPapers,
  findPaper,
  getPaper,
  isPaperType,
  paperName,
  papers,
  papersByGroup,
} from './registry'

/** The least object the registry accepts as a paper of the given type. */
function stub(type: string, extra: Partial<AnyPaper> = {}): AnyPaper {
  return { type, group: 'basic', ...extra } as unknown as AnyPaper
}

describe('PAPER_ORDER', () => {
  test('lists every paper type once, in declaration order', () => {
    expect(PAPER_ORDER).toHaveLength(48)
    expect(new Set(PAPER_ORDER).size).toBe(48)
    expect(PAPER_ORDER.slice(0, 4)).toEqual([
      'lined',
      'vertical_lined',
      'grid',
      'dot',
    ])
    expect(PAPER_ORDER.at(-1)).toBe('chinese_preview_card')
  })
})

describe('collectPapers', () => {
  test('keeps the modules whose default export is an object with a string type', () => {
    const found = collectPapers({
      './kit.ts': { dashFor: () => undefined },
      './a.ts': { default: () => 1 },
      './b.ts': { default: { type: 7 } },
      './lined.ts': { default: stub('lined') },
    })
    expect(found.map((paper) => paper.type)).toEqual(['lined'])
  })

  test('throws, naming both files, when two modules declare the same type', () => {
    expect(() =>
      collectPapers({
        './a.ts': { default: stub('lined') },
        './b.ts': { default: stub('lined') },
      }),
    ).toThrow(/"lined".*a\.ts.*b\.ts/)
  })

  test('orders the papers by PAPER_ORDER, whatever the module order', () => {
    const found = collectPapers({
      './z.ts': { default: stub('cornell') },
      './a.ts': { default: stub('grid') },
      './m.ts': { default: stub('lined') },
    })
    expect(found.map((paper) => paper.type)).toEqual([
      'lined',
      'grid',
      'cornell',
    ])
  })

  test('throws when a type is missing from PAPER_ORDER', () => {
    expect(() =>
      collectPapers({ './x.ts': { default: stub('nope') } }),
    ).toThrow(/PAPER_ORDER/)
  })
})

describe('papers', () => {
  test('finds the paper modules of its directory without being told about them', () => {
    expect(papers.filter((paper) => paper.type === 'lined')).toHaveLength(1)
  })

  test('holds its papers in PAPER_ORDER order', () => {
    const ranks = papers.map((paper) => PAPER_ORDER.indexOf(paper.type))
    expect(ranks.every((rank) => rank >= 0)).toBe(true)
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
  })
})

describe('getPaper / findPaper / isPaperType', () => {
  test('getPaper returns the registered paper of a type', () => {
    expect(getPaper('lined').type).toBe('lined')
  })

  test('getPaper throws for a type no paper has registered', () => {
    const missing = PAPER_ORDER.find((type) => !isPaperType(type))
    if (missing === undefined) return
    expect(() => getPaper(missing)).toThrow(missing)
  })

  test('findPaper gives undefined for a type that does not exist', () => {
    expect(findPaper('nope')).toBeUndefined()
  })

  test('isPaperType accepts registered keys only', () => {
    expect(isPaperType('lined')).toBe(true)
    expect(isPaperType('nope')).toBe(false)
    expect(isPaperType(42)).toBe(false)
  })
})

describe('papersByGroup', () => {
  test('lists exactly the papers of that group', () => {
    const basic = papersByGroup('basic')
    expect(basic.map((paper) => paper.type)).toContain('lined')
    expect(basic.every((paper) => paper.group === 'basic')).toBe(true)
  })

  test('splits the registry between the five groups', () => {
    const groups = ['basic', 'worksheet', 'english', 'calligraphy', 'creative'] as const
    const counted = groups.reduce(
      (sum, group) => sum + papersByGroup(group).length,
      0,
    )
    expect(counted).toBe(papers.length)
  })
})

describe('paperName', () => {
  const messages: PaperMessages = {
    'zh-CN': { name: '方格纸' },
    en: { name: 'Grid' },
  }

  test('reads the name from the messages of the locale', () => {
    expect(paperName(stub('grid', { messages }), 'en')).toBe('Grid')
    expect(paperName(stub('grid', { messages }), 'zh-CN')).toBe('方格纸')
  })

  test('falls back to the key when the locale has no name', () => {
    const blank: PaperMessages = { 'zh-CN': {}, en: { name: 'Grid' } }
    expect(paperName(stub('grid', { messages: blank }), 'zh-CN')).toBe('grid')
  })
})
