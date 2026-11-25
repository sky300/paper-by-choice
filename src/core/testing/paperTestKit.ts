/**
 * Test kit for papers.
 *
 * `renderPaper` assembles a complete render context the way the application
 * will, so a paper's tests can talk about its geometry instead of building
 * contexts by hand. The rest read scenes and assert on them.
 *
 * Test-only, yet plain source: the assertions throw ordinary errors rather
 * than leaning on a test framework, and the kit is tested like any module.
 */
import { paperTranslator } from '../../i18n'
import { pageSizeMm } from '../paperSizes'
import type { AnyPaper, RenderContext } from '../papers/contract'
import {
  createFontKit,
  createInkKit,
  isPlainObject,
  resolveOptions,
} from '../papers/kit'
import { getPaper } from '../papers/registry'
import { clamp, roundTo, snapToStep } from '../scene/geometry'
import type {
  Box,
  PathCommand,
  Pt,
  Scene,
  SceneItem,
  Shape,
} from '../scene/types'
import { resolveTheme } from '../themes'
import type {
  LineSettings,
  Locale,
  Margins,
  Orientation,
  PaperSizeKey,
  PaperType,
  ThemeKey,
} from '../types'

/** What `renderPaper` may be asked to change from its defaults. */
export interface RenderOverrides {
  paperSize?: PaperSizeKey
  orientation?: Orientation
  customSize?: { width: number; height: number }
  margins?: Partial<Margins>
  /** The paper's spacing parameter: snapped to the paper's step, then clamped to its range. */
  spacing?: number
  options?: Record<string, unknown>
  theme?: ThemeKey
  /** Merged over the line settings; `spacing` of the line is always the resolved spacing. */
  line?: Partial<LineSettings>
  locale?: Locale
}

/** One paper rendered by `renderPaper`. */
export interface PaperRender {
  paper: AnyPaper
  ctx: RenderContext<Record<string, unknown>>
  scene: Scene
  /** The scene with its groups opened. */
  shapes: Shape[]
}

const DEFAULT_MARGINS: Margins = { top: 20, right: 20, bottom: 20, left: 20 }
const DEFAULT_LINE_WIDTH = 0.13

/**
 * Renders a paper the way the application would. Defaults: A4 portrait,
 * 20 mm margins, theme `default`, lines in the theme's line colour at 0.13 mm
 * and solid, the paper's default spacing and options, locale `zh-CN`.
 */
export function renderPaper(
  type: PaperType,
  overrides: RenderOverrides = {},
): PaperRender {
  const paper = getPaper(type)
  const { spacing: spec } = paper
  const theme = resolveTheme(overrides.theme ?? 'default')
  const page = pageSizeMm(
    overrides.paperSize ?? 'a4',
    overrides.orientation ?? 'portrait',
    overrides.customSize,
  )
  const margins: Margins = { ...DEFAULT_MARGINS, ...overrides.margins }
  const snapped =
    overrides.spacing === undefined
      ? spec.default
      : snapToStep(overrides.spacing, spec.min, spec.max, spec.step)
  const spacing = clamp(snapped, spec.min, spec.max)
  const line: LineSettings = {
    color: theme.lines,
    width: DEFAULT_LINE_WIDTH,
    style: 'solid',
    ...(overrides.line ?? {}),
    spacing,
  }
  const locale = overrides.locale ?? 'zh-CN'

  const ctx: RenderContext<Record<string, unknown>> = {
    type: paper.type,
    page,
    area: {
      x: margins.left,
      y: margins.top,
      w: page.width - margins.left - margins.right,
      h: page.height - margins.top - margins.bottom,
    },
    spacing,
    theme,
    options: resolveOptions(
      paper.fields,
      paper.defaultOptions,
      overrides.options,
    ),
    ink: createInkKit(line),
    fonts: createFontKit(theme),
    t: paperTranslator(paper, locale),
    locale,
  }
  const scene = paper.render(ctx)
  return { paper, ctx, scene, shapes: flatten(scene) }
}

/** Every shape of `items`, groups opened, in scene order. */
function flatten(items: readonly SceneItem[]): Shape[] {
  return items.flatMap((item) =>
    item.op === 'g' ? flatten(item.items) : [item],
  )
}

/** The shapes whose `op` is `op`, groups opened, in scene order. */
export function shapesOf<T extends Shape['op']>(
  items: readonly SceneItem[],
  op: T,
): Extract<Shape, { op: T }>[] {
  return flatten(items).filter(
    (item): item is Extract<Shape, { op: T }> => item.op === op,
  )
}

/** The y of the horizontal lines among `items`, without repeats, ascending. */
export function horizontalPositions(items: readonly SceneItem[]): number[] {
  return uniqueAscending(
    shapesOf(items, 'line')
      .filter((item) => item.y1 === item.y2)
      .map((item) => item.y1),
  )
}

/** The x of the vertical lines among `items`, without repeats, ascending. */
export function verticalPositions(items: readonly SceneItem[]): number[] {
  return uniqueAscending(
    shapesOf(items, 'line')
      .filter((item) => item.x1 === item.x2)
      .map((item) => item.x1),
  )
}

/** The text of the text items among `items`, in order. */
export function textsOf(items: readonly SceneItem[]): string[] {
  return shapesOf(items, 'text').map((item) => item.text)
}

function uniqueAscending(values: readonly number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b)
}

/* ------------------------------------------------------------------ */
/* Bounding boxes                                                      */
/* ------------------------------------------------------------------ */

function bounds(x0: number, y0: number, x1: number, y1: number): Box {
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

function boundsOfPoints(points: readonly Pt[]): Box | null {
  if (points.length === 0) return null
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const left = Math.min(...xs)
  const top = Math.min(...ys)
  return bounds(left, top, Math.max(...xs), Math.max(...ys))
}

function pointsOf(commands: readonly PathCommand[]): Pt[] {
  return commands.flatMap((command) => {
    switch (command.op) {
      case 'M':
      case 'L':
        return [command.p]
      case 'Q':
        return [command.c, command.p]
      case 'C':
        return [command.c1, command.c2, command.p]
      case 'Z':
        return []
    }
  })
}

/**
 * The smallest box around an item's geometry. Curves are bounded by their
 * control points; a text item shrinks to its anchor point, since its width
 * is unknown without font metrics. `null` when the item draws nothing.
 */
function boundsOf(item: Shape): Box | null {
  switch (item.op) {
    case 'line':
      return bounds(
        Math.min(item.x1, item.x2),
        Math.min(item.y1, item.y2),
        Math.max(item.x1, item.x2),
        Math.max(item.y1, item.y2),
      )
    case 'rect':
    case 'image':
      return item.box
    case 'ellipse':
      return bounds(
        item.cx - item.rx,
        item.cy - item.ry,
        item.cx + item.rx,
        item.cy + item.ry,
      )
    case 'poly':
      return boundsOfPoints(item.points)
    case 'path':
      return boundsOfPoints(pointsOf(item.d))
    case 'text':
      return bounds(item.x, item.y, item.x, item.y)
  }
}

function fits(b: Box, outer: Box, tolerance: number): boolean {
  return (
    b.x >= outer.x - tolerance &&
    b.y >= outer.y - tolerance &&
    b.x + b.w <= outer.x + outer.w + tolerance &&
    b.y + b.h <= outer.y + outer.h + tolerance
  )
}

/* ------------------------------------------------------------------ */
/* Failure messages                                                    */
/* ------------------------------------------------------------------ */

function show(value: number): string {
  return String(roundTo(value, 3))
}

function at(x: number, y: number): string {
  return `${show(x)},${show(y)}`
}

function describeBox(b: Box): string {
  return `${at(b.x, b.y)} ${show(b.w)}×${show(b.h)}`
}

function describeItem(item: Shape): string {
  switch (item.op) {
    case 'line':
      return `line ${at(item.x1, item.y1)} → ${at(item.x2, item.y2)}`
    case 'rect':
      return `rect ${describeBox(item.box)}`
    case 'image':
      return `image ${describeBox(item.box)}`
    case 'ellipse':
      return `ellipse ${at(item.cx, item.cy)} r ${show(item.rx)}×${show(item.ry)}`
    case 'poly':
      return `poly ${item.points.length} points`
    case 'path':
      return `path ${item.d.length} commands`
    case 'text':
      return `text "${item.text}" at ${at(item.x, item.y)}`
  }
}

/* ------------------------------------------------------------------ */
/* Assertions                                                          */
/* ------------------------------------------------------------------ */

/** Fails when an item lies further than `tolerance` mm outside `box`; the message lists each offending item. */
export function expectInside(
  items: readonly SceneItem[],
  box: Box,
  tolerance = 0.6,
): void {
  const shapes = flatten(items)
  const outside = shapes
    .map((item, index) => ({ index, item, bounds: boundsOf(item) }))
    .filter(
      (entry): entry is { index: number; item: Shape; bounds: Box } =>
        entry.bounds !== null && !fits(entry.bounds, box, tolerance),
    )
  if (outside.length === 0) return

  const list = outside
    .map(
      (entry) =>
        `  #${entry.index} ${describeItem(entry.item)} → ${describeBox(entry.bounds)}`,
    )
    .join('\n')
  throw new Error(
    `${outside.length} of ${shapes.length} items lie outside ${describeBox(box)} by more than ${tolerance} mm:\n${list}`,
  )
}

/** Notes every number in `value` that is not finite, as `path = value`. */
function collectNonFinite(value: unknown, path: string, out: string[]): void {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) out.push(`${path} = ${value}`)
  } else if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      collectNonFinite(entry, `${path}[${index}]`, out),
    )
  } else if (isPlainObject(value)) {
    for (const [key, entry] of Object.entries(value)) {
      collectNonFinite(entry, path ? `${path}.${key}` : key, out)
    }
  }
}

/** Fails when any number in any item is NaN or infinite; the message names the item and the field. */
export function expectFiniteNumbers(items: readonly SceneItem[]): void {
  const shapes = flatten(items)
  const found = shapes.flatMap((item, index) => {
    const bad: string[] = []
    collectNonFinite(item, '', bad)
    return bad.map((entry) => `  #${index} ${describeItem(item)}: ${entry}`)
  })
  if (found.length === 0) return
  throw new Error(
    `${found.length} numbers in the scene are not finite:\n${found.join('\n')}`,
  )
}
