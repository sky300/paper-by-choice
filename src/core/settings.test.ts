import { describe, expect, test } from 'vitest'
import { resolveTheme } from './themes'
import {
  APP_DEFAULTS,
  LIMITS,
  STORAGE_KEYS,
  applyCalligraphyFrame,
  applyPreset,
  clampSpacing,
  createSettings,
  decodeSettingsHash,
  encodeSettingsHash,
  parseSettingsImport,
  resolveOptionsFor,
  resolvePageSize,
  sanitizeSettings,
  selectTheme,
  serializeSettings,
  settingsFileName,
  switchPaperType,
} from './settings'
import type { ImportFailure } from './settings'
import { SettingsImportError } from './settings'

/** Captures the `reason` a failing import throws with, or undefined when it did not throw. */
function failure(run: () => unknown): ImportFailure | undefined {
  try {
    run()
    return undefined
  } catch (error) {
    return (error as { reason?: ImportFailure }).reason
  }
}

describe('constants', () => {
  test('storage keys are namespaced', () => {
    expect(STORAGE_KEYS.settings).toBe('paper-by-choice.settings.v1')
    expect(STORAGE_KEYS.locale).toBe('paper-by-choice.locale')
  })

  test('limits carry the documented ranges and defaults', () => {
    expect(LIMITS.customSize).toEqual({ min: 50, max: 1000 })
    expect(LIMITS.lineWidth).toEqual({
      min: 0.05,
      max: 1,
      step: 0.01,
      default: 0.13,
    })
    expect(LIMITS.watermark.textMaxLength).toBe(200)
    expect(LIMITS.pages.count).toEqual({ min: 1, max: 100, default: 1 })
  })
})

describe('createSettings', () => {
  test('lined defaults match the reference tool: 8 mm spacing, 25/20/25/20 margins, 0.5 px lines', () => {
    const s = createSettings('lined')
    expect(s.version).toBe(1)
    expect(s.paperType).toBe('lined')
    expect(s.paperSize).toBe('a4')
    expect(s.orientation).toBe('portrait')
    expect(s.line.spacing).toBe(8)
    expect(s.line.width).toBeCloseTo(0.13, 2)
    expect(s.margins).toEqual({ top: 25, right: 20, bottom: 25, left: 20 })
    expect(s.theme).toBe('default')
  })

  test("lined line colour is the reference tool's #808080", () => {
    expect(createSettings('lined').line.color).toBe('#808080')
  })

  test('lined options equal the validated column defaults', () => {
    expect(createSettings('lined').options).toEqual({
      columns: { count: '1', gap: 8, divider: 'solid' },
    })
  })

  test('exam-two-column preset: A3 landscape, 15 mm margins, two columns', () => {
    const s = createSettings('lined', 'exam-two-column')
    expect(s.paperSize).toBe('a3')
    expect(s.orientation).toBe('landscape')
    expect(s.margins).toEqual({ top: 15, right: 15, bottom: 15, left: 15 })
    expect((s.options.columns as { count: string }).count).toBe('2')
  })

  test('A3 landscape resolves to a 420 x 297 mm page', () => {
    expect(resolvePageSize(createSettings('lined', 'exam-two-column'))).toEqual(
      {
        width: 420,
        height: 297,
      },
    )
  })

  test('an unknown preset id falls back to the first preset', () => {
    expect(createSettings('lined', 'does-not-exist')).toEqual(
      createSettings('lined'),
    )
  })
})

describe('clampSpacing', () => {
  test('snaps 7.3 to 7.5, clamps 99 to 20 and sends NaN to the minimum 4', () => {
    expect(clampSpacing('lined', 7.3)).toBe(7.5)
    expect(clampSpacing('lined', 99)).toBe(20)
    expect(clampSpacing('lined', NaN)).toBe(4)
  })
})

describe('switchPaperType', () => {
  test('keeps pages, watermark and decoration but resets spacing and margins', () => {
    const base = createSettings('lined')
    const current = {
      ...base,
      line: { ...base.line, spacing: 12 },
      margins: { ...base.margins, top: 5 },
      pages: { ...base.pages, count: 3, numbering: true },
      watermark: { ...base.watermark, enabled: true, text: 'draft' },
      decoration: { ...base.decoration, enabled: true },
    }
    // Only `lined` is registered so far, so the switch is lined -> lined.
    const next = switchPaperType(current, 'lined')
    expect(next.pages).toEqual({ count: 3, numbering: true, startNumber: 1 })
    expect(next.watermark.enabled).toBe(true)
    expect(next.watermark.text).toBe('draft')
    expect(next.decoration.enabled).toBe(true)
    expect(next.line.spacing).toBe(8)
    expect(next.margins).toEqual({ top: 25, right: 20, bottom: 25, left: 20 })
  })
})

describe('applyPreset', () => {
  test('applies the preset while keeping pages, watermark and decoration', () => {
    const base = createSettings('lined')
    const current = {
      ...base,
      pages: { ...base.pages, count: 5 },
      watermark: { ...base.watermark, enabled: true },
      decoration: { ...base.decoration, enabled: true },
    }
    const next = applyPreset(current, 'exam-two-column')
    expect(next.paperSize).toBe('a3')
    expect(next.orientation).toBe('landscape')
    expect(next.margins.top).toBe(15)
    expect((next.options.columns as { count: string }).count).toBe('2')
    expect(next.pages.count).toBe(5)
    expect(next.watermark.enabled).toBe(true)
    expect(next.decoration.enabled).toBe(true)
    expect(resolvePageSize(next)).toEqual({ width: 420, height: 297 })
  })
})

describe('selectTheme', () => {
  test('sets the theme and repaints the line colour from it', () => {
    const next = selectTheme(createSettings('lined'), 'sepia')
    expect(next.theme).toBe('sepia')
    expect(next.line.color).toBe(resolveTheme('sepia').lines)
  })
})

describe('applyCalligraphyFrame', () => {
  test('turns on the full calligraphy frame in the current line colour', () => {
    const current = createSettings('lined')
    const next = applyCalligraphyFrame(current)
    expect(next.decoration).toEqual({
      enabled: true,
      style: 'calligraphy',
      scope: 'content',
      inset: 5,
      color: current.line.color,
      width: 0.2,
      lineStyle: 'solid',
      sides: { top: true, right: true, bottom: true, left: true },
      cornerOrnaments: false,
      scallopPattern: 'wave',
      opacity: 1,
    })
  })
})

describe('resolveOptionsFor', () => {
  test('validates and clamps the options of the current paper', () => {
    const current = {
      ...createSettings('lined'),
      options: {
        columns: { count: '2', gap: 999, divider: 'x' },
        junk: 1,
      },
    }
    expect(resolveOptionsFor(current)).toEqual({
      columns: { count: '2', gap: 40, divider: 'solid' },
    })
  })
})

describe('resolvePageSize', () => {
  test('a custom size is used as given and never swapped for orientation', () => {
    const custom = {
      ...createSettings('lined'),
      paperSize: 'custom' as const,
      orientation: 'landscape' as const,
      customSize: { width: 300, height: 200 },
    }
    expect(resolvePageSize(custom)).toEqual({ width: 300, height: 200 })
  })
})

describe('sanitizeSettings', () => {
  const base = createSettings('lined')

  test('a non-object input converges to the lined default', () => {
    expect(sanitizeSettings(null)).toEqual(createSettings('lined'))
    expect(sanitizeSettings(42)).toEqual(createSettings('lined'))
    expect(sanitizeSettings('x')).toEqual(createSettings('lined'))
  })

  test('clamps out-of-range numbers into their limits', () => {
    const s = sanitizeSettings({
      ...base,
      line: { ...base.line, width: 99, spacing: 99 },
      margins: { ...base.margins, top: -5 },
      watermark: { ...base.watermark, opacity: 9, angle: 200, size: 999 },
      decoration: { ...base.decoration, inset: 999, width: 5, opacity: 0 },
      pages: { ...base.pages, count: 999, startNumber: 0 },
    })
    expect(s.line.width).toBe(1)
    expect(s.line.spacing).toBe(20)
    expect(s.margins.top).toBe(0)
    expect(s.watermark.opacity).toBe(0.5)
    expect(s.watermark.angle).toBe(90)
    expect(s.watermark.size).toBe(25)
    expect(s.decoration.inset).toBe(30)
    expect(s.decoration.width).toBe(1)
    expect(s.decoration.opacity).toBe(0.25)
    expect(s.pages.count).toBe(100)
    expect(s.pages.startNumber).toBe(1)
  })

  test('clamps a custom size into 50-1000 mm', () => {
    expect(
      sanitizeSettings({ ...base, customSize: { width: 1, height: 9999 } })
        .customSize,
    ).toEqual({ width: 50, height: 1000 })
  })

  test('rounds page numbers before clamping', () => {
    const s = sanitizeSettings({
      ...base,
      pages: { ...base.pages, count: 3.7, startNumber: 2.4 },
    })
    expect(s.pages.count).toBe(4)
    expect(s.pages.startNumber).toBe(2)
  })

  test('falls back for invalid enumerations', () => {
    const s = sanitizeSettings({
      ...base,
      paperSize: 'bogus',
      orientation: 'sideways',
      theme: 'bogus',
      line: { ...base.line, style: 'wavy' },
      background: { ...base.background, texture: 'bogus' },
      decoration: {
        ...base.decoration,
        style: 'bogus',
        scope: 'bogus',
        lineStyle: 'bogus',
        scallopPattern: 'bogus',
      },
    })
    expect(s.paperSize).toBe('a4')
    expect(s.orientation).toBe('portrait')
    expect(s.theme).toBe('default')
    expect(s.line.style).toBe('solid')
    expect(s.background.texture).toBe('none')
    expect(s.decoration.style).toBe('simple')
    expect(s.decoration.scope).toBe('content')
    expect(s.decoration.lineStyle).toBe('solid')
    expect(s.decoration.scallopPattern).toBe('wave')
  })

  test('falls back for colours that cannot be parsed', () => {
    const s = sanitizeSettings({
      ...base,
      line: { ...base.line, color: 'red' },
      background: { ...base.background, color: '#zzzzzz', patternColor: 123 },
      decoration: { ...base.decoration, color: 'blue' },
      watermark: { ...base.watermark, color: '#12345g' },
    })
    expect(s.line.color).toBe('#808080')
    expect(s.background.color).toBe('#ffffff')
    expect(s.background.patternColor).toBe('#e0e0e0')
    expect(s.decoration.color).toBe(APP_DEFAULTS.decoration.color)
    expect(s.watermark.color).toBe(APP_DEFAULTS.watermark.color)
  })

  test('drops a background image that is not a data:image/ URL', () => {
    expect(
      sanitizeSettings({
        ...base,
        background: { ...base.background, image: 'https://example.com/a.png' },
      }).background.image,
    ).toBeNull()
    const dataUrl = 'data:image/png;base64,AAAA'
    expect(
      sanitizeSettings({
        ...base,
        background: { ...base.background, image: dataUrl },
      }).background.image,
    ).toBe(dataUrl)
  })

  test('pattern opacity tops out at 1 for an image texture and 0.5 otherwise', () => {
    expect(
      sanitizeSettings({
        ...base,
        background: {
          ...base.background,
          texture: 'image',
          patternOpacity: 0.9,
        },
      }).background.patternOpacity,
    ).toBe(0.9)
    expect(
      sanitizeSettings({
        ...base,
        background: {
          ...base.background,
          texture: 'none',
          patternOpacity: 0.9,
        },
      }).background.patternOpacity,
    ).toBe(0.5)
  })

  test('an unknown paperType falls back to lined', () => {
    expect(sanitizeSettings({ ...base, paperType: 'bogus' }).paperType).toBe(
      'lined',
    )
  })

  test('trims watermark text and caps it at 200 characters', () => {
    expect(
      sanitizeSettings({
        ...base,
        watermark: { ...base.watermark, text: '  hello  ' },
      }).watermark.text,
    ).toBe('hello')
    expect(
      sanitizeSettings({
        ...base,
        watermark: { ...base.watermark, text: 'a'.repeat(250) },
      }).watermark.text.length,
    ).toBe(200)
  })

  test('forces four boolean decoration sides', () => {
    const s = sanitizeSettings({
      ...base,
      decoration: {
        ...base.decoration,
        sides: { top: false, right: 'yes', bottom: 0, left: null },
      },
    })
    expect(s.decoration.sides).toEqual({
      top: false,
      right: true,
      bottom: true,
      left: true,
    })
  })

  test('converges options through the paper field table', () => {
    const s = sanitizeSettings({
      ...base,
      options: { columns: { count: '2', gap: 999, divider: 'x' }, junk: 1 },
    })
    expect(s.options).toEqual({
      columns: { count: '2', gap: 40, divider: 'solid' },
    })
  })

  test('uses defaults for NaN and Infinity', () => {
    const s = sanitizeSettings({
      ...base,
      line: { ...base.line, width: NaN, spacing: NaN },
      margins: { ...base.margins, top: Infinity },
      watermark: { ...base.watermark, size: -Infinity },
    })
    expect(s.line.width).toBeCloseTo(base.line.width, 3)
    expect(s.line.spacing).toBe(8)
    expect(s.margins.top).toBe(base.margins.top)
    expect(s.watermark.size).toBe(12.7)
  })

  test('shares no references with the input object', () => {
    const raw = {
      ...base,
      margins: { ...base.margins },
      line: { ...base.line },
      decoration: {
        ...base.decoration,
        sides: { ...base.decoration.sides },
      },
    }
    const s = sanitizeSettings(raw)
    expect(s.margins).not.toBe(raw.margins)
    expect(s.line).not.toBe(raw.line)
    expect(s.decoration.sides).not.toBe(raw.decoration.sides)
    raw.margins.top = 999
    raw.line.color = 'red'
    raw.decoration.sides.top = false
    expect(s.margins.top).toBe(base.margins.top)
    expect(s.line.color).toBe(base.line.color)
    expect(s.decoration.sides.top).toBe(true)
  })
})

describe('serialization', () => {
  const s = createSettings('lined', 'exam-two-column')

  test('export/import is a lossless round trip with two-space indentation', () => {
    const text = serializeSettings(s)
    expect(text).toContain('\n  "app"')
    expect(parseSettingsImport(text).settings).toEqual(s)
  })

  test('an optional name survives the round trip', () => {
    const parsed = parseSettingsImport(serializeSettings(s, 'My Sheet'))
    expect(parsed.name).toBe('My Sheet')
    expect(parsed.settings).toEqual(s)
  })

  test('a syntax error reports invalidJson', () => {
    expect(() => parseSettingsImport('{')).toThrow(SettingsImportError)
    expect(failure(() => parseSettingsImport('{'))).toBe('invalidJson')
  })

  test('a foreign file reports notOurFile', () => {
    expect(
      failure(() =>
        parseSettingsImport('{"app":"other","version":1,"settings":{}}'),
      ),
    ).toBe('notOurFile')
  })

  test('a broken settings payload reports invalidSettings', () => {
    expect(
      failure(() =>
        parseSettingsImport(
          '{"app":"paper-by-choice","version":1,"settings":42}',
        ),
      ),
    ).toBe('invalidSettings')
  })

  test('a wrong version reports notOurFile', () => {
    expect(
      failure(() =>
        parseSettingsImport(
          '{"app":"paper-by-choice","version":2,"settings":{}}',
        ),
      ),
    ).toBe('notOurFile')
  })
})

describe('settingsFileName', () => {
  test('uses the paper type and a fixed local date', () => {
    expect(
      settingsFileName(createSettings('lined'), new Date(2026, 10, 24)),
    ).toBe('paper-by-choice-lined-20261124.json')
  })
})

describe('link encoding', () => {
  const s = createSettings('lined')

  test('round-trips a settings object and stays URL-safe', () => {
    const hash = encodeSettingsHash(s)
    expect(hash).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(hash).not.toContain('#')
    expect(decodeSettingsHash(hash)).toEqual(s)
  })

  test('returns null for a fragment that is not base64url', () => {
    expect(decodeSettingsHash('!!!')).toBeNull()
  })
})
