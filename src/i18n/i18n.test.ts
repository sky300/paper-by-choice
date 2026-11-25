import type { AnyPaper, PaperMessages } from '../core/papers/contract'
import type { Locale } from '../core/types'
import { expect, test } from 'vitest'
import { en } from './en'
import {
  UI_MESSAGES,
  createTranslator,
  detectLocale,
  interpolate,
  paperTranslator,
  uiTranslator,
} from './index'
import { zhCN } from './zh-CN'

/** The first batch of keys the control panel needs, grouped by prefix. */
const REQUIRED: Record<string, string[]> = {
  app: ['name', 'tagline', 'privacy'],
  group: ['basic', 'worksheet', 'calligraphy', 'creative'],
  size: [
    'a4',
    'a5',
    'a3',
    'b4',
    'b5',
    'letter',
    'legal',
    'tabloid',
    'executive',
    'custom',
    'width',
    'height',
  ],
  orientation: ['label', 'portrait', 'landscape'],
  columns: ['label', 'one', 'two', 'gap', 'divider'],
  style: ['solid', 'dashed', 'dotted'],
  section: [
    'type',
    'size',
    'theme',
    'line',
    'options',
    'margins',
    'background',
    'decoration',
    'watermark',
    'pages',
    'transfer',
  ],
  line: ['color', 'style', 'width', 'recommend', 'unit', 'outOfRange'],
  margin: ['top', 'right', 'bottom', 'left'],
  background: [
    'color',
    'texture',
    'patternColor',
    'opacity',
    'chooseImage',
    'clearImage',
  ],
  texture: ['none', 'grid', 'dots', 'lines', 'crosshatch', 'graph', 'image'],
  decoration: [
    'enable',
    'style',
    'style.simple',
    'style.double',
    'style.corner',
    'style.calligraphy',
    'style.scalloped',
    'scope',
    'scope.content',
    'scope.page',
    'inset',
    'sides',
    'ornaments',
    'pattern',
    'pattern.wave',
    'pattern.meander',
    'pattern.beads',
    'opacity',
    'applyCalligraphyFrame',
  ],
  watermark: [
    'enable',
    'text',
    'textPlaceholder',
    'opacity',
    'angle',
    'size',
    'color',
  ],
  pages: ['count', 'numbering', 'startNumber'],
  transfer: ['export', 'import', 'importFailed', 'imported'],
  theme: [
    'default',
    'night',
    'sepia',
    'vintage',
    'pastel',
    'classic',
    'minimalist',
    'ocean',
    'forest',
    'sunset',
    'tech',
    'elegant',
    'creative',
  ],
}
const REQUIRED_KEYS = Object.entries(REQUIRED).flatMap(([prefix, names]) =>
  names.map((name) => `${prefix}.${name}`),
)

/* ------------------------------------------------------------------ */
/* Dictionaries                                                        */
/* ------------------------------------------------------------------ */

test('zh-CN and en define exactly the same keys', () => {
  expect(Object.keys(en).sort()).toEqual(Object.keys(zhCN).sort())
})

test.each([
  ['zh-CN', zhCN],
  ['en', en],
])('%s has no blank messages', (_locale, dict) => {
  expect(Object.values(dict).filter((text) => text.trim() === '')).toEqual([])
})

test('both dictionaries define every key the control panel needs', () => {
  expect(REQUIRED_KEYS.filter((key) => !(key in zhCN) || !(key in en))).toEqual(
    [],
  )
})

test('UI_MESSAGES holds the dictionary of each locale', () => {
  expect(UI_MESSAGES).toEqual({ 'zh-CN': zhCN, en })
})

/* ------------------------------------------------------------------ */
/* interpolate                                                         */
/* ------------------------------------------------------------------ */

test('interpolate replaces placeholders with the matching params', () => {
  expect(interpolate('{min}–{max} mm', { min: 0.05, max: 1 })).toBe('0.05–1 mm')
})

test('interpolate keeps a placeholder that has no param', () => {
  expect(interpolate('{a} {b}', { a: 1 })).toBe('1 {b}')
})

test('interpolate leaves the template alone without params', () => {
  expect(interpolate('{a}')).toBe('{a}')
})

/* ------------------------------------------------------------------ */
/* createTranslator / uiTranslator                                     */
/* ------------------------------------------------------------------ */

test('createTranslator reads the dictionaries in the given order', () => {
  const t = createTranslator(
    { k: 'first', onlyFirst: 'one' },
    { k: 'second', onlySecond: 'two' },
  )
  expect(t('k')).toBe('first')
  expect(t('onlyFirst')).toBe('one')
  expect(t('onlySecond')).toBe('two')
})

test('createTranslator returns the key itself when no dictionary has it', () => {
  expect(createTranslator({ a: 'x' })('missing.key')).toBe('missing.key')
})

test('createTranslator interpolates params into the found message', () => {
  expect(
    createTranslator({ greeting: 'Hi {name}' })('greeting', { name: 7 }),
  ).toBe('Hi 7')
})

test('uiTranslator reads the dictionary of its locale', () => {
  expect(uiTranslator('zh-CN')('orientation.portrait')).toBe('纵向')
  expect(uiTranslator('en')('orientation.portrait')).toBe('Portrait')
})

test('uiTranslator returns the key for a missing entry', () => {
  expect(uiTranslator('en')('no.such.key')).toBe('no.such.key')
})

/* ------------------------------------------------------------------ */
/* paperTranslator                                                     */
/* ------------------------------------------------------------------ */

/** Only `messages` matters to `paperTranslator`; the rest of the contract is irrelevant here. */
function fakePaper(messages: PaperMessages): AnyPaper {
  return { messages } as unknown as AnyPaper
}

const paper = fakePaper({
  'zh-CN': {
    'spacing.label': '行距',
    'orientation.portrait': '纸型自己的纵向',
  },
  en: { 'spacing.label': 'Line spacing', 'only.english': 'Only in English' },
})

test('paperTranslator resolves from the paper’s messages in the current locale', () => {
  expect(paperTranslator(paper, 'zh-CN')('spacing.label')).toBe('行距')
  expect(paperTranslator(paper, 'en')('spacing.label')).toBe('Line spacing')
})

test('paperTranslator lets the paper override a UI key', () => {
  expect(paperTranslator(paper, 'zh-CN')('orientation.portrait')).toBe(
    '纸型自己的纵向',
  )
})

test('paperTranslator falls back to the paper’s other locale', () => {
  expect(paperTranslator(paper, 'zh-CN')('only.english')).toBe(
    'Only in English',
  )
})

test('paperTranslator falls back to the UI dictionary of the current locale', () => {
  expect(paperTranslator(paper, 'en')('columns.gap')).toBe('Column gap')
  expect(paperTranslator(paper, 'zh-CN')('columns.gap')).toBe('栏间距')
})

test('paperTranslator returns the key itself when nothing defines it', () => {
  expect(paperTranslator(paper, 'zh-CN')('nowhere.to.be.found')).toBe(
    'nowhere.to.be.found',
  )
})

/* ------------------------------------------------------------------ */
/* detectLocale                                                        */
/* ------------------------------------------------------------------ */

const LOCALE_CASES: [
  string,
  string | null | undefined,
  readonly string[],
  Locale,
][] = [
  ['a saved zh-CN wins', 'zh-CN', ['en-US'], 'zh-CN'],
  ['a saved en wins', 'en', ['zh-CN'], 'en'],
  ['an unknown saved value is ignored', 'fr', ['en-GB'], 'en'],
  ['a null saved value falls through', null, ['zh-TW'], 'zh-CN'],
  ['an undefined saved value falls through', undefined, [], 'zh-CN'],
  ['the first zh tag wins', undefined, ['fr-FR', 'zh-HK', 'en'], 'zh-CN'],
  ['the first en tag wins', null, ['en-GB', 'zh-CN'], 'en'],
  ['tags are matched case-insensitively', '', ['ZH-Hant'], 'zh-CN'],
  ['no matching tag defaults to zh-CN', 'fr', ['fr-FR', 'de'], 'zh-CN'],
]

test.each(LOCALE_CASES)(
  'detectLocale: %s',
  (_name, saved, languages, expected) => {
    expect(detectLocale(saved, languages)).toBe(expected)
  },
)
