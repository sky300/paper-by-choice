/**
 * 绘制边框及纸面装饰。
 * Draws borders and page decorations.
 */
/**
 * Page decoration: an optional frame around the page or the writing area.
 * Styles are built from independent edges so each side can be switched off,
 * and the whole layer is wrapped in one group with the decoration opacity.
 */
import {
  circle,
  group,
  line,
  moveTo,
  path,
  poly,
  pt,
  quadTo,
} from '../scene/builders'
import type {
  Box,
  LineItem,
  Pt,
  Scene,
  SceneItem,
  Stroke,
} from '../scene/types'
import { EPS } from '../scene/geometry'
import type { LineStyle, Settings } from '../types'
import type { PageSize } from './document'

/** Hard cap on the iterations of a generated scallop loop. */
const MAX_STEPS = 20000

/** Inward offset of the inner frame of the `double` style, in millimetres. */
const DOUBLE_INSET = 2

/** Target length of one scallop segment, in millimetres. */
const SCALLOP_SEGMENT = 6

/** Thickness caps of the scallop pattern and its faint baseline, in millimetres. */
const SCALLOP_WIDTH_CAP = 0.185
const BASELINE_WIDTH_CAP = 0.13

/** A stroke with only the fields that are actually present. */
function strokeOf(opts: {
  color: string
  width: number
  dash?: readonly number[]
  opacity?: number
}): Stroke {
  const stroke: Stroke = { color: opts.color, width: opts.width }
  if (opts.dash !== undefined) stroke.dash = opts.dash
  if (opts.opacity !== undefined) stroke.opacity = opts.opacity
  return stroke
}

/** Dash pattern (mm) of a decoration line style. */
export function decorationDash(
  style: LineStyle,
  width: number,
): readonly number[] | undefined {
  if (style === 'dashed') return [1.3, 1.3]
  if (style === 'dotted') return [Math.max(0.25, width * 1.2), 0.55]
  return undefined
}

/** The rectangle the decoration is based on after applying scope and inset. */
function scopeBox(
  settings: Settings,
  pageSize: PageSize,
  contentArea: Box,
): Box {
  const inset = settings.decoration.inset
  if (settings.decoration.scope === 'page') {
    return {
      x: inset,
      y: inset,
      w: pageSize.width - 2 * inset,
      h: pageSize.height - 2 * inset,
    }
  }
  return {
    x: contentArea.x + inset,
    y: contentArea.y + inset,
    w: contentArea.w - 2 * inset,
    h: contentArea.h - 2 * inset,
  }
}

/** Reserves space for the enabled frame edges before the paper is laid out. */
export function framedContentArea(
  settings: Settings,
  pageSize: PageSize,
  area: Box,
): Box {
  const d = settings.decoration
  if (!d.enabled) return area

  const frame = scopeBox(settings, pageSize, area)
  if (frame.w <= 0 || frame.h <= 0) return area

  let clearance = 1 + (d.width + settings.line.width) / 2
  if (
    d.style === 'double' &&
    frame.w > 2 * DOUBLE_INSET &&
    frame.h > 2 * DOUBLE_INSET
  ) {
    clearance += DOUBLE_INSET
  }
  if (d.style === 'scalloped') {
    const amplitude = Math.max(1, 0.15 * d.inset)
    clearance += d.scallopPattern === 'meander' ? 1.6 * amplitude : amplitude
  }

  const hasCorners = d.style === 'corner' && d.cornerOrnaments
  const left =
    d.sides.left || hasCorners ? Math.max(area.x, frame.x + clearance) : area.x
  const top =
    d.sides.top || hasCorners ? Math.max(area.y, frame.y + clearance) : area.y
  const right = area.x + area.w
  const bottom = area.y + area.h
  const innerRight =
    d.sides.right || hasCorners
      ? Math.min(right, frame.x + frame.w - clearance)
      : right
  const innerBottom =
    d.sides.bottom || hasCorners
      ? Math.min(bottom, frame.y + frame.h - clearance)
      : bottom
  return { x: left, y: top, w: innerRight - left, h: innerBottom - top }
}

/** The four independent edges of `b`, each only when its side is enabled. */
function frameLines(
  b: Box,
  sides: { top: boolean; right: boolean; bottom: boolean; left: boolean },
  stroke: Stroke,
): LineItem[] {
  const x2 = b.x + b.w
  const y2 = b.y + b.h
  const out: LineItem[] = []
  if (sides.top) out.push(line(b.x, b.y, x2, b.y, stroke))
  if (sides.right) out.push(line(x2, b.y, x2, y2, stroke))
  if (sides.bottom) out.push(line(x2, y2, b.x, y2, stroke))
  if (sides.left) out.push(line(b.x, y2, b.x, b.y, stroke))
  return out
}

/** The four mirrored L-shaped corner ornaments; each is an open three-point polyline. */
function cornerOrnaments(b: Box, a: number, stroke: Stroke): SceneItem[] {
  const x2 = b.x + b.w
  const y2 = b.y + b.h
  const corners: Pt[][] = [
    [pt(b.x, b.y + a), pt(b.x, b.y), pt(b.x + a, b.y)],
    [pt(x2, b.y + a), pt(x2, b.y), pt(x2 - a, b.y)],
    [pt(x2, y2 - a), pt(x2, y2), pt(x2 - a, y2)],
    [pt(b.x, y2 - a), pt(b.x, y2), pt(b.x + a, y2)],
  ]
  return corners.map((points) => poly(points, false, stroke))
}

interface SideSpec {
  start: Pt
  along: Pt
  length: number
  enabled: boolean
}

/** The four sides clockwise; their inward normal is the right-hand of `along`. */
function sideSpecs(b: Box, sides: Settings['decoration']['sides']): SideSpec[] {
  return [
    { start: pt(b.x, b.y), along: pt(1, 0), length: b.w, enabled: sides.top },
    {
      start: pt(b.x + b.w, b.y),
      along: pt(0, 1),
      length: b.h,
      enabled: sides.right,
    },
    {
      start: pt(b.x + b.w, b.y + b.h),
      along: pt(-1, 0),
      length: b.w,
      enabled: sides.bottom,
    },
    {
      start: pt(b.x, b.y + b.h),
      along: pt(0, -1),
      length: b.h,
      enabled: sides.left,
    },
  ]
}

/** Maps a local scallop point `(u, v)` into page coordinates. */
function toPage(u: number, v: number, side: SideSpec): Pt {
  const { x: ax, y: ay } = side.along
  return pt(side.start.x + u * ax - v * ay, side.start.y + u * ay + v * ax)
}

interface Segment {
  u0: number
  length: number
}

/** Divides `A … sideLength − A` into target-length segments, last one shortened. */
function segments(sideLength: number, amplitude: number): Segment[] {
  const end = sideLength - amplitude
  if (end - amplitude <= 0) return []
  const out: Segment[] = []
  let u = amplitude
  for (let k = 0; k < MAX_STEPS && u < end - EPS; k++) {
    const length = Math.min(SCALLOP_SEGMENT, end - u)
    out.push({ u0: u, length })
    u += length
  }
  return out
}

/** The scallop shapes of one side, in the chosen pattern. */
function sideScallops(
  side: SideSpec,
  amplitude: number,
  pattern: Settings['decoration']['scallopPattern'],
  stroke: Stroke,
): SceneItem[] {
  const out: SceneItem[] = []
  for (const seg of segments(side.length, amplitude)) {
    const { u0, length: l } = seg
    const at = (u: number, v: number) => toPage(u, v, side)
    switch (pattern) {
      case 'wave':
        out.push(
          path(
            [
              moveTo(at(u0, 0)),
              quadTo(at(u0 + l / 4, -amplitude), at(u0 + l / 2, 0)),
              quadTo(at(u0 + (3 * l) / 4, amplitude), at(u0 + l, 0)),
            ],
            false,
            stroke,
          ),
        )
        break
      case 'meander':
        out.push(
          poly(
            [
              at(u0, 0),
              at(u0, 1.6 * amplitude),
              at(u0 + l / 2, 1.6 * amplitude),
              at(u0 + l / 2, 0),
              at(u0 + l, 0),
              at(u0 + l, 1.6 * amplitude),
            ],
            false,
            stroke,
          ),
        )
        break
      case 'beads': {
        const centre = at(u0 + l / 2, 0)
        out.push(circle(centre.x, centre.y, Math.min(amplitude, l / 3), stroke))
        break
      }
    }
  }
  return out
}

/** Decoration layer, or an empty scene when disabled or too small to draw. */
export function decorationScene(
  settings: Settings,
  pageSize: PageSize,
  contentArea: Box,
): Scene {
  const d = settings.decoration
  if (!d.enabled) return []

  const b = scopeBox(settings, pageSize, contentArea)
  if (b.w <= 0 || b.h <= 0) return []

  const dash = decorationDash(d.lineStyle, d.width)
  const main = strokeOf({ color: d.color, width: d.width, dash })
  const items: SceneItem[] = []

  switch (d.style) {
    case 'simple':
    case 'calligraphy':
      items.push(...frameLines(b, d.sides, main))
      break
    case 'double': {
      items.push(...frameLines(b, d.sides, main))
      const inner: Box = {
        x: b.x + DOUBLE_INSET,
        y: b.y + DOUBLE_INSET,
        w: b.w - 2 * DOUBLE_INSET,
        h: b.h - 2 * DOUBLE_INSET,
      }
      if (inner.w > 0 && inner.h > 0)
        items.push(...frameLines(inner, d.sides, main))
      break
    }
    case 'corner': {
      items.push(...frameLines(b, d.sides, main))
      if (d.cornerOrnaments) {
        const arm = Math.min(6, Math.max(3, 0.75 * d.inset), b.w / 4, b.h / 4)
        items.push(...cornerOrnaments(b, arm, main))
      }
      break
    }
    case 'scalloped': {
      const baseline = strokeOf({
        color: d.color,
        width: Math.min(0.8 * d.width, BASELINE_WIDTH_CAP),
        dash,
        opacity: 0.85,
      })
      const scallopStroke = strokeOf({
        color: d.color,
        width: Math.min(d.width, SCALLOP_WIDTH_CAP),
        dash,
      })
      const amplitude = Math.max(1, 0.15 * d.inset)
      items.push(...frameLines(b, d.sides, baseline))
      for (const side of sideSpecs(b, d.sides)) {
        if (!side.enabled) continue
        items.push(
          ...sideScallops(side, amplitude, d.scallopPattern, scallopStroke),
        )
      }
      break
    }
  }

  return [group(items, d.opacity)]
}
