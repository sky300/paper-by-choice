/**
 * Paper kit: the toolbox every paper is built from.
 *
 * Strokes and fonts derived from the user's line settings and the theme,
 * access to options by dotted path, and the validation that turns options of
 * unknown origin into values a `render()` can trust.
 */
import { clamp, roundTo } from '../scene/geometry'
import type { Font, Stroke } from '../scene/types'
import type { LineSettings, LineStyle, Theme } from '../types'
import type {
  FontKit,
  GroupField,
  InkKit,
  OptionField,
  StrokeFactory,
} from './contract'

const SERIF = "Georgia, 'Times New Roman', 'Songti SC', SimSun, serif"
const CJK =
  "'Kaiti SC', KaiTi, STKaiti, 'LXGW WenKai', 'Noto Serif CJK SC', 'Songti SC', SimSun, serif"
const MONO = "ui-monospace, 'Cascadia Mono', Consolas, 'Courier New', monospace"
const HAND =
  "'Segoe Print', 'Bradley Hand', 'Comic Sans MS', 'Marker Felt', cursive"

/** Copies `value` without the fields that are `undefined`, so an absent dash really is absent from the item. */
function compact<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, field]) => field !== undefined),
  ) as T
}

/* ------------------------------------------------------------------ */
/* Ink and fonts                                                       */
/* ------------------------------------------------------------------ */

/** Dash pattern (mm) for a user line style: `solid` has none, `dashed` is [3, 2], `dotted` dots are 1.2 × the width but at least 0.25 mm, each followed by a 1.4 mm gap. */
export function dashFor(
  style: LineStyle,
  width: number,
): readonly number[] | undefined {
  if (style === 'dashed') return [3, 2]
  if (style === 'dotted') return [Math.max(0.25, width * 1.2), 1.4]
  return undefined
}

/**
 * Stroke factories for one render. `main` follows the user's line settings,
 * `guide` draws auxiliary lines in the same colour at 0.75 of the width,
 * dashed. An override of `undefined` removes that field, which is how a
 * paper asks for a solid line while the user's style is dashed.
 */
export function createInkKit(line: LineSettings): InkKit {
  const derive =
    (base: Stroke): StrokeFactory =>
    (overrides) =>
      compact({ ...base, ...overrides })

  return {
    main: derive(
      compact({
        color: line.color,
        width: line.width,
        dash: dashFor(line.style, line.width),
      }),
    ),
    guide: derive({
      color: line.color,
      width: roundTo(line.width * 0.75),
      dash: [2.5, 1.5],
    }),
    make: (color, width, dash) => compact({ color, width, dash }),
  }
}

/** A font factory bound to one `family`; sizes are millimetres and weight or style are only set when asked for. */
function stack(family: string): FontKit['body'] {
  return (size, opts) =>
    compact<Font>({ family, size, weight: opts?.weight, style: opts?.style })
}

/** Font stacks for one render: `body` and `heading` come from the theme, the rest are fixed stacks. */
export function createFontKit(theme: Theme): FontKit {
  return {
    body: stack(theme.bodyFont),
    heading: stack(theme.headingFont),
    serif: stack(SERIF),
    cjk: stack(CJK),
    mono: stack(MONO),
    hand: stack(HAND),
  }
}

/* ------------------------------------------------------------------ */
/* Options                                                             */
/* ------------------------------------------------------------------ */

/** Whether `value` is a plain data object: not `null`, not an array, not a function. */
export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Merges `patch` over `base`. Where both hold a plain object the merge
 * recurses; any other patch value replaces the base value whole. Neither
 * argument is modified.
 */
export function deepMerge(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const kept = Object.entries(base).filter(
    ([key]) => !Object.hasOwn(patch, key),
  )
  const merged = Object.entries(patch).map(([key, value]) => {
    const current = Object.hasOwn(base, key) ? base[key] : undefined
    return [
      key,
      isPlainObject(current) && isPlainObject(value)
        ? deepMerge(current, value)
        : value,
    ]
  })
  return Object.fromEntries([...kept, ...merged])
}

/** Reads the value at a dotted `path`; returns `fallback` when the path is missing, runs through a non-object, or holds `null`. */
export function getOption<T>(
  options: Record<string, unknown>,
  path: string,
  fallback: T,
): T {
  let node: unknown = options
  for (const segment of path.split('.')) {
    if (!isPlainObject(node) || !Object.hasOwn(node, segment)) return fallback
    node = node[segment]
  }
  return (node ?? fallback) as T
}

/** Writes `value` at a dotted `path` and returns the new object; missing parents are created and the input is left as it was. */
export function setOption(
  options: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const [head, ...rest] = path.split('.')
  if (rest.length === 0) return { ...options, [head]: value }
  const child = options[head]
  return {
    ...options,
    [head]: setOption(isPlainObject(child) ? child : {}, rest.join('.'), value),
  }
}

const COLOR = /^#[0-9a-f]{6}$/i

/** An option field that holds a value of its own, i.e. any kind except `group`. */
type ValueField = Exclude<OptionField, GroupField>

/** `value` as a number: numbers pass, non-blank strings are parsed, anything else is NaN. */
function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') return Number(value)
  return NaN
}

/** Reduces `value` to what `field` can hold, falling back to the field's default when it cannot. */
function sanitize(field: ValueField, value: unknown): unknown {
  switch (field.kind) {
    case 'number':
    case 'slider': {
      const number = toNumber(value)
      return clamp(
        Number.isFinite(number) ? number : field.default,
        field.min,
        field.max,
      )
    }
    case 'toggle':
      return typeof value === 'boolean' ? value : field.default
    case 'select':
      return field.choices.some((choice) => choice.value === value)
        ? value
        : field.default
    case 'text': {
      const text = typeof value === 'string' ? value : field.default
      return text.trim().slice(0, field.maxLength)
    }
    case 'color':
      return typeof value === 'string' && COLOR.test(value)
        ? value
        : field.default
  }
}

/** Reads each field of `fields` from `source`, groups opened, validated and written at its key; returns the new object. */
function resolveFields(
  fields: readonly OptionField[],
  source: Record<string, unknown>,
  out: Record<string, unknown>,
): Record<string, unknown> {
  let result = out
  for (const field of fields) {
    result =
      field.kind === 'group'
        ? resolveFields(field.fields, source, result)
        : setOption(
            result,
            field.key,
            sanitize(field, getOption(source, field.key, undefined)),
          )
  }
  return result
}

/**
 * Turns options of unknown origin into values a `render()` can trust.
 * `defaults` and `raw` are deep-merged (a `raw` that is not an object counts
 * as empty), every declared field is checked and, if needed, reset to its
 * default, and keys no field declares are dropped.
 */
export function resolveOptions(
  fields: readonly OptionField[],
  defaults: Record<string, unknown>,
  raw: unknown,
): Record<string, unknown> {
  const source = deepMerge(defaults, isPlainObject(raw) ? raw : {})
  return resolveFields(fields, source, {})
}
