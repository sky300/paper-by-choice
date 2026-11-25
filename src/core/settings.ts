/**
 * Settings model: application defaults, paper/preset switching, convergent
 * validation, import/export and share-link encoding.
 *
 * Everything here is pure. Any settings object coming from storage, a link or
 * an imported file must pass through `sanitizeSettings` before it is trusted.
 */
import { pageSizeMm } from './paperSizes'
import { THEMES, resolveTheme } from './themes'
import { PAPER_LOOKS, pxToMm } from './paperLooks'
import { parseHexColor, rgbToHex } from './render/color'
import { clamp, snapToStep } from './scene/geometry'
import { isPlainObject, resolveOptions } from './papers/kit'
import { getPaper, isPaperType } from './papers/registry'
import type { AnyPaper, PresetPatch } from './papers/contract'
import type {
  DecorationScope,
  DecorationStyle,
  LineStyle,
  Orientation,
  PaperSizeKey,
  PaperType,
  ScallopPattern,
  Settings,
  TextureKey,
  ThemeKey,
} from './types'
import {
  base64UrlToBytes,
  bytesToBase64Url,
  utf8Decode,
  utf8Encode,
} from './encoding'

/** LocalStorage keys for the persisted settings and the language preference. */
export const STORAGE_KEYS = {
  settings: 'paper-by-choice.settings.v1',
  locale: 'paper-by-choice.locale',
} as const

/** Ranges, steps and defaults of the numeric controls, in millimetres unless noted. */
export const LIMITS = {
  customSize: { min: 50, max: 1000 },
  lineWidth: { min: 0.05, max: 1, step: 0.01, default: 0.13 }, // mm
  margins: { min: 0, max: 40, step: 1, default: 20 },
  patternOpacity: { min: 0.1, max: 0.5, step: 0.05, default: 0.2 },
  imageOpacity: { min: 0.1, max: 1, step: 0.05 },
  decoration: {
    insetMax: 30,
    width: { min: 0.05, max: 1, step: 0.01, default: 0.2 },
    opacity: { min: 0.25, max: 1, step: 0.05, default: 1 },
  },
  watermark: {
    opacity: { min: 0.05, max: 0.5, step: 0.05, default: 0.15 },
    angle: { min: -90, max: 90, step: 5, default: -45 },
    size: { min: 4, max: 25, step: 0.5, default: 12.7 },
    textMaxLength: 200,
  },
  pages: {
    count: { min: 1, max: 100, default: 1 },
    startNumber: { min: 1, max: 9999, default: 1 },
  },
} as const

/** Paper-independent application defaults, narrowed to their literal values. */
export const APP_DEFAULTS = {
  paperSize: 'a4',
  orientation: 'portrait',
  customSize: { width: 210, height: 297 },
  line: { color: '#6b7280', width: 0.13, style: 'solid', spacing: 8 },
  margins: { top: 20, right: 20, bottom: 20, left: 20 },
  theme: 'default',
  background: {
    color: '#ffffff',
    texture: 'none',
    patternColor: '#e0e3e8',
    patternOpacity: 0.2,
    image: null,
  },
  decoration: {
    enabled: false,
    style: 'simple',
    scope: 'content',
    inset: 3,
    color: '#8a6f4d',
    width: 0.2,
    lineStyle: 'solid',
    sides: { top: true, right: true, bottom: true, left: true },
    cornerOrnaments: true,
    scallopPattern: 'wave',
    opacity: 1,
  },
  watermark: {
    enabled: false,
    text: '',
    opacity: 0.15,
    angle: -45,
    size: 12.7,
    color: '#888888',
  },
  pages: { count: 1, numbering: false, startNumber: 1 },
} as const

/* ------------------------------------------------------------------ */
/* Allowed enumerations                                                */
/* ------------------------------------------------------------------ */

const PAPER_SIZE_KEYS: readonly PaperSizeKey[] = [
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
]
const ORIENTATIONS: readonly Orientation[] = ['portrait', 'landscape']
const THEME_KEYS: readonly ThemeKey[] = THEMES.map((theme) => theme.key)
const LINE_STYLES: readonly LineStyle[] = ['solid', 'dashed', 'dotted']
const TEXTURES: readonly TextureKey[] = [
  'none',
  'grid',
  'dots',
  'lines',
  'crosshatch',
  'graph',
  'image',
]
const DECORATION_STYLES: readonly DecorationStyle[] = [
  'simple',
  'double',
  'corner',
  'calligraphy',
  'scalloped',
]
const DECORATION_SCOPES: readonly DecorationScope[] = ['content', 'page']
const SCALLOP_PATTERNS: readonly ScallopPattern[] = ['wave', 'meander', 'beads']

/** Returns `value` when it is one of `allowed`, otherwise the fallback. */
function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === 'string' &&
    (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

/** Returns `value` when it is a finite number, otherwise the fallback, then clamps. */
function numberIn(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const numeric =
    typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return clamp(numeric, min, max)
}

/** Returns `value` rounded to the nearest integer when finite, otherwise the fallback, then clamps. */
function integerIn(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const numeric =
    typeof value === 'number' && Number.isFinite(value)
      ? Math.round(value)
      : fallback
  return clamp(numeric, min, max)
}

/** Returns `value` when it is a boolean, otherwise the fallback. */
function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/** Normalises a parseable colour to `#rrggbb`, otherwise returns the fallback. */
function colorValue(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const rgb = parseHexColor(value)
  return rgb ? rgbToHex(rgb) : fallback
}

/** Treats a plain object as a record and anything else (including arrays) as empty. */
function asObject(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? value : {}
}

/* ------------------------------------------------------------------ */
/* Building settings                                                   */
/* ------------------------------------------------------------------ */

/** Returns editable bounds that also include the paper switch default. */
export function spacingBounds(type: PaperType) {
  const { min, max } = getPaper(type).spacing
  const initial = PAPER_LOOKS[type].spacing
  return { min: Math.min(min, initial), max: Math.max(max, initial) }
}

/** Snaps a spacing value to the paper's step and clamps it into the paper's range. */
export function clampSpacing(type: PaperType, value: number): number {
  const { min, max } = spacingBounds(type)
  const { step } = getPaper(type).spacing
  return snapToStep(value, min, max, step)
}

/** Builds the full settings of one paper from `APP_DEFAULTS` and a preset patch. */
function buildSettings(
  type: PaperType,
  paper: AnyPaper,
  patch: PresetPatch,
): Settings {
  const d = APP_DEFAULTS
  const look = PAPER_LOOKS[type]
  const built: Settings = {
    version: 1,
    paperType: type,
    paperSize: patch.paperSize ?? d.paperSize,
    orientation: patch.orientation ?? d.orientation,
    customSize: { width: d.customSize.width, height: d.customSize.height },
    line: {
      color: patch.line?.color ?? look.lineColor,
      width: patch.line?.width ?? pxToMm(look.lineWidthPx),
      style: patch.line?.style ?? look.lineStyle,
      // The switch default, not the "recommended" value: the two differ for
      // many papers and the reference tool starts from the switch default.
      spacing: patch.line?.spacing ?? look.spacing,
    },
    margins: { ...look.margins, ...(patch.margins ?? {}) },
    theme: patch.theme ?? look.theme,
    background: {
      ...d.background,
      color: look.background.color,
      patternColor: look.background.patternColor,
      patternOpacity: look.background.patternOpacity,
      ...(patch.background ?? {}),
    },
    decoration: { ...d.decoration, sides: { ...d.decoration.sides } },
    watermark: { ...d.watermark },
    pages: { ...d.pages },
    options: resolveOptions(paper.fields, paper.defaultOptions, patch.options),
  }
  return built
}

/** Complete settings of a paper, optionally applying a named preset. */
export function createSettings(type: PaperType, presetId?: string): Settings {
  const paper = getPaper(type)
  const found = presetId
    ? paper.presets.find((preset) => preset.id === presetId)
    : undefined
  return buildSettings(type, paper, found?.patch ?? {})
}

/** Carries the user's page count and watermark onto a fresh base. */
function preserve(base: Settings, current: Settings): Settings {
  return {
    ...base,
    pages: { ...current.pages },
    watermark: { ...current.watermark },
  }
}

/** Switches paper type to its default preset while keeping explicit page settings. */
export function switchPaperType(current: Settings, next: PaperType): Settings {
  return preserve(createSettings(next), current)
}

/** Applies a preset of the current paper while keeping explicit page settings. */
export function applyPreset(current: Settings, presetId: string): Settings {
  return preserve(createSettings(current.paperType, presetId), current)
}

/** Selects a theme and repaints the line colour from that theme. */
export function selectTheme(current: Settings, theme: ThemeKey): Settings {
  return {
    ...current,
    theme,
    line: { ...current.line, color: resolveTheme(theme).lines },
  }
}

/** Applies the one-click calligraphy frame around the content area. */
export function applyCalligraphyFrame(current: Settings): Settings {
  return {
    ...current,
    decoration: {
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
    },
  }
}

/** Validated, type-specific options of the settings' current paper. */
export function resolveOptionsFor(settings: Settings): Record<string, unknown> {
  const paper = getPaper(settings.paperType)
  return resolveOptions(paper.fields, paper.defaultOptions, settings.options)
}

/* ------------------------------------------------------------------ */
/* Convergent validation                                               */
/* ------------------------------------------------------------------ */

/** Turns raw data of any origin into a fresh, fully trusted `Settings` object. */
export function sanitizeSettings(raw: unknown): Settings {
  if (!isPlainObject(raw)) return createSettings('lined')

  const d = APP_DEFAULTS
  const paperType: PaperType = isPaperType(raw.paperType)
    ? raw.paperType
    : 'lined'
  const paper = getPaper(paperType)
  const look = PAPER_LOOKS[paperType]
  // Missing or invalid fields fall back to this paper's reference default,
  // not to a single global default, so every paper keeps its intended look.
  const lineDefaults = {
    color: look.lineColor,
    width: pxToMm(look.lineWidthPx),
    style: look.lineStyle,
    spacing: look.spacing,
  }
  const marginDefaults = look.margins
  const backgroundDefaults = look.background

  const rLine = asObject(raw.line)
  const rMargins = asObject(raw.margins)
  const rCustom = asObject(raw.customSize)
  const rBackground = asObject(raw.background)
  const rDecoration = asObject(raw.decoration)
  const rSides = asObject(rDecoration.sides)
  const rWatermark = asObject(raw.watermark)
  const rPages = asObject(raw.pages)

  const texture = oneOf(rBackground.texture, TEXTURES, d.background.texture)
  const spacing =
    typeof rLine.spacing === 'number' && Number.isFinite(rLine.spacing)
      ? rLine.spacing
      : lineDefaults.spacing

  return {
    version: 1,
    paperType,
    paperSize: oneOf(raw.paperSize, PAPER_SIZE_KEYS, d.paperSize),
    orientation: oneOf(raw.orientation, ORIENTATIONS, d.orientation),
    customSize: {
      width: numberIn(
        rCustom.width,
        d.customSize.width,
        LIMITS.customSize.min,
        LIMITS.customSize.max,
      ),
      height: numberIn(
        rCustom.height,
        d.customSize.height,
        LIMITS.customSize.min,
        LIMITS.customSize.max,
      ),
    },
    line: {
      color: colorValue(rLine.color, lineDefaults.color),
      width: numberIn(
        rLine.width,
        lineDefaults.width,
        LIMITS.lineWidth.min,
        LIMITS.lineWidth.max,
      ),
      style: oneOf(rLine.style, LINE_STYLES, lineDefaults.style),
      spacing: clampSpacing(paperType, spacing),
    },
    margins: {
      top: numberIn(
        rMargins.top,
        marginDefaults.top,
        LIMITS.margins.min,
        LIMITS.margins.max,
      ),
      right: numberIn(
        rMargins.right,
        marginDefaults.right,
        LIMITS.margins.min,
        LIMITS.margins.max,
      ),
      bottom: numberIn(
        rMargins.bottom,
        marginDefaults.bottom,
        LIMITS.margins.min,
        LIMITS.margins.max,
      ),
      left: numberIn(
        rMargins.left,
        marginDefaults.left,
        LIMITS.margins.min,
        LIMITS.margins.max,
      ),
    },
    theme: oneOf(raw.theme, THEME_KEYS, look.theme),
    background: {
      color: colorValue(rBackground.color, backgroundDefaults.color),
      texture,
      patternColor: colorValue(
        rBackground.patternColor,
        backgroundDefaults.patternColor,
      ),
      patternOpacity: numberIn(
        rBackground.patternOpacity,
        backgroundDefaults.patternOpacity,
        LIMITS.patternOpacity.min,
        texture === 'image'
          ? LIMITS.imageOpacity.max
          : LIMITS.patternOpacity.max,
      ),
      image:
        typeof rBackground.image === 'string' &&
        rBackground.image.startsWith('data:image/')
          ? rBackground.image
          : null,
    },
    decoration: {
      enabled: booleanValue(rDecoration.enabled, d.decoration.enabled),
      style: oneOf(rDecoration.style, DECORATION_STYLES, d.decoration.style),
      scope: oneOf(rDecoration.scope, DECORATION_SCOPES, d.decoration.scope),
      inset: numberIn(
        rDecoration.inset,
        d.decoration.inset,
        0,
        LIMITS.decoration.insetMax,
      ),
      color: colorValue(rDecoration.color, d.decoration.color),
      width: numberIn(
        rDecoration.width,
        d.decoration.width,
        LIMITS.decoration.width.min,
        LIMITS.decoration.width.max,
      ),
      lineStyle: oneOf(
        rDecoration.lineStyle,
        LINE_STYLES,
        d.decoration.lineStyle,
      ),
      sides: {
        top: booleanValue(rSides.top, d.decoration.sides.top),
        right: booleanValue(rSides.right, d.decoration.sides.right),
        bottom: booleanValue(rSides.bottom, d.decoration.sides.bottom),
        left: booleanValue(rSides.left, d.decoration.sides.left),
      },
      cornerOrnaments: booleanValue(
        rDecoration.cornerOrnaments,
        d.decoration.cornerOrnaments,
      ),
      scallopPattern: oneOf(
        rDecoration.scallopPattern,
        SCALLOP_PATTERNS,
        d.decoration.scallopPattern,
      ),
      opacity: numberIn(
        rDecoration.opacity,
        d.decoration.opacity,
        LIMITS.decoration.opacity.min,
        LIMITS.decoration.opacity.max,
      ),
    },
    watermark: {
      enabled: booleanValue(rWatermark.enabled, d.watermark.enabled),
      text:
        typeof rWatermark.text === 'string'
          ? rWatermark.text.trim().slice(0, LIMITS.watermark.textMaxLength)
          : d.watermark.text,
      opacity: numberIn(
        rWatermark.opacity,
        d.watermark.opacity,
        LIMITS.watermark.opacity.min,
        LIMITS.watermark.opacity.max,
      ),
      angle: numberIn(
        rWatermark.angle,
        d.watermark.angle,
        LIMITS.watermark.angle.min,
        LIMITS.watermark.angle.max,
      ),
      size: numberIn(
        rWatermark.size,
        d.watermark.size,
        LIMITS.watermark.size.min,
        LIMITS.watermark.size.max,
      ),
      color: colorValue(rWatermark.color, d.watermark.color),
    },
    pages: {
      count: integerIn(
        rPages.count,
        d.pages.count,
        LIMITS.pages.count.min,
        LIMITS.pages.count.max,
      ),
      numbering: booleanValue(rPages.numbering, d.pages.numbering),
      startNumber: integerIn(
        rPages.startNumber,
        d.pages.startNumber,
        LIMITS.pages.startNumber.min,
        LIMITS.pages.startNumber.max,
      ),
    },
    options: resolveOptions(paper.fields, paper.defaultOptions, raw.options),
  }
}

/** Actual page size in millimetres; a custom size is never swapped by orientation. */
export function resolvePageSize(settings: Settings): {
  width: number
  height: number
} {
  return pageSizeMm(
    settings.paperSize,
    settings.orientation,
    settings.customSize,
  )
}

/* ------------------------------------------------------------------ */
/* Import / export                                                     */
/* ------------------------------------------------------------------ */

/** Envelope of an exported settings file. */
export interface SettingsExport {
  app: 'paper-by-choice'
  version: 1
  name?: string
  settings: Settings
}

/** Serialises settings as two-space-indented JSON. */
export function serializeSettings(settings: Settings, name?: string): string {
  const data: SettingsExport = {
    app: 'paper-by-choice',
    version: 1,
    settings,
  }
  if (name !== undefined) data.name = name
  return JSON.stringify(data, null, 2)
}

/** Why an imported file was rejected. */
export type ImportFailure = 'invalidJson' | 'notOurFile' | 'invalidSettings'

/** An import rejection carrying a machine-readable `reason`. */
export class SettingsImportError extends Error {
  reason: ImportFailure

  constructor(reason: ImportFailure) {
    super(reason)
    this.name = 'SettingsImportError'
    this.reason = reason
  }
}

/** Parses an exported settings file, validating its envelope and sanitising the payload. */
export function parseSettingsImport(text: string): {
  name?: string
  settings: Settings
} {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new SettingsImportError('invalidJson')
  }
  if (
    !isPlainObject(parsed) ||
    parsed.app !== 'paper-by-choice' ||
    parsed.version !== 1
  ) {
    throw new SettingsImportError('notOurFile')
  }
  if (!isPlainObject(parsed.settings)) {
    throw new SettingsImportError('invalidSettings')
  }
  const name = typeof parsed.name === 'string' ? parsed.name : undefined
  return {
    ...(name !== undefined ? { name } : {}),
    settings: sanitizeSettings(parsed.settings),
  }
}

/** File name of an export: `paper-by-choice-<paperType>-<yyyyMMdd>.json`. */
export function settingsFileName(settings: Settings, date?: Date): string {
  const day = date ?? new Date()
  const y = day.getFullYear()
  const m = String(day.getMonth() + 1).padStart(2, '0')
  const d = String(day.getDate()).padStart(2, '0')
  return `paper-by-choice-${settings.paperType}-${y}${m}${d}.json`
}

/* ------------------------------------------------------------------ */
/* Share links                                                         */
/* ------------------------------------------------------------------ */

/** Encodes settings as an unpadded, prefix-free base64url URL fragment. */
export function encodeSettingsHash(settings: Settings): string {
  return bytesToBase64Url(utf8Encode(JSON.stringify(settings)))
}

/** Decodes a share-link fragment; any failure yields `null`. */
export function decodeSettingsHash(hash: string): Settings | null {
  try {
    const parsed: unknown = JSON.parse(utf8Decode(base64UrlToBytes(hash)))
    if (!isPlainObject(parsed)) return null
    return sanitizeSettings(parsed)
  } catch {
    return null
  }
}
