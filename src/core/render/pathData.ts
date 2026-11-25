/**
 * Path data tools shared by the vector renderers.
 *
 * The scene expresses strokes, fills and curves in millimetres with colours
 * as strings. PDF needs numeric colours and arcs as cubic Béziers; SVG needs
 * path data strings. This module holds those conversions once, so the
 * renderers only differ in how they emit the result.
 */
import { polylinePath } from '../scene/builders'
import type {
  EllipseItem,
  Paint,
  PathCommand,
  Pt,
  Stroke,
} from '../scene/types'
import { parseHexColor, type Rgb } from './color'
import { formatNumber, pathCommandsToData } from './svg'

/** A stroke with its colour parsed and its width and opacity filled in. */
export interface ResolvedStroke {
  color: Rgb
  width: number
  dash: readonly number[]
  opacity: number
}

/** A fill with its colour parsed and its opacity filled in. */
export interface ResolvedFill {
  color: Rgb
  opacity: number
}

/** The paint of one item; `null` means "do not stroke" / "do not fill". */
export interface ResolvedPaint {
  stroke: ResolvedStroke | null
  fill: ResolvedFill | null
}

const BLACK: Rgb = { r: 0, g: 0, b: 0 }
const FULL_TURN = 2 * Math.PI
const QUARTER_TURN = Math.PI / 2

/** Fallback colour: scenes should only contain `#rrggbb`. */
function colorOf(hex: string): Rgb {
  return parseHexColor(hex) ?? BLACK
}

/** `own × inherited`, clamped into [0, 1]; a non-finite result paints nothing. */
function opacityOf(own: number | undefined, inherited: number): number {
  const value = (own ?? 1) * inherited
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
}

/** Drops non-positive entries; fewer than two left means a solid line. */
function dashOf(dash: readonly number[] | undefined): number[] {
  const kept = (dash ?? []).filter((value) => value > 0)
  return kept.length >= 2 ? kept : []
}

/**
 * Normalizes the stroke and fill of an item for the renderers.
 * - No stroke, or a width that is not a positive finite number → `stroke: null`.
 * - No fill → `fill: null`.
 * - A colour that cannot be parsed is treated as black.
 * - Opacity is the item's own (default 1) times `inheritedOpacity`, clamped.
 * - A dash pattern loses its non-positive entries; what is left of it must
 *   have at least two entries, otherwise the line is solid (`[]`).
 */
export function resolvePaint(
  stroke?: Stroke,
  fill?: Paint,
  inheritedOpacity = 1,
): ResolvedPaint {
  return {
    stroke:
      stroke && Number.isFinite(stroke.width) && stroke.width > 0
        ? {
            color: colorOf(stroke.color),
            width: stroke.width,
            dash: dashOf(stroke.dash),
            opacity: opacityOf(stroke.opacity, inheritedOpacity),
          }
        : null,
    fill: fill
      ? {
          color: colorOf(fill.color),
          opacity: opacityOf(fill.opacity, inheritedOpacity),
        }
      : null,
  }
}

/** A polygon (`closed`) or a polyline through `points`, as `M…L…` commands. */
export function polyToPath(
  points: readonly Pt[],
  closed: boolean,
): PathCommand[] {
  return polylinePath(points, closed)
}

/**
 * An ellipse or an arc as evenly sized cubic Bézier segments of at most 90°
 * each. The result starts with `M` and has no `Z`. A full ellipse (no
 * `start` / `end`) is expanded the same way.
 *
 * Center parameterization: for each segment `[θ0, θ1]`, `k = 4/3·tan((θ1−θ0)/4)`,
 * `P0 = C + (rx·cosθ0, ry·sinθ0)`, `P3 = C + (rx·cosθ1, ry·sinθ1)`,
 * `P1 = P0 + k·(−rx·sinθ0, ry·cosθ0)`, `P2 = P3 − k·(−rx·sinθ1, ry·cosθ1)`.
 */
export function arcToPath(item: EllipseItem): PathCommand[] {
  const { cx, cy, rx, ry } = item
  const start = item.start ?? 0
  let sweep = ((item.end ?? 0) - start) % FULL_TURN
  if (sweep <= 0) sweep += FULL_TURN
  const count = Math.max(1, Math.ceil(sweep / QUARTER_TURN))
  const step = sweep / count
  const k = (4 / 3) * Math.tan(step / 4)
  const onEllipse = (theta: number): Pt => ({
    x: cx + rx * Math.cos(theta),
    y: cy + ry * Math.sin(theta),
  })
  const commands: PathCommand[] = []
  for (let i = 0; i < count; i++) {
    const from = start + i * step
    const to = start + (i + 1) * step
    const p0 = onEllipse(from)
    const p3 = onEllipse(to)
    if (i === 0) commands.push({ op: 'M', p: p0 })
    commands.push({
      op: 'C',
      c1: {
        x: p0.x - k * rx * Math.sin(from),
        y: p0.y + k * ry * Math.cos(from),
      },
      c2: { x: p3.x + k * rx * Math.sin(to), y: p3.y - k * ry * Math.cos(to) },
      p: p3,
    })
  }
  return commands
}

/**
 * Path commands as SVG path data with absolute `M / L / Q / C / Z`, the
 * form pdf-lib's `drawSvgPath` reads. `precision` is the number of decimals
 * (3 by default); `scale` multiplies every coordinate (e.g. `MM_TO_PT`); when
 * `flipY` is given, every (scaled) `y` is replaced by `flipY − y`.
 */
export function toPathData(
  commands: readonly PathCommand[],
  opts: { precision?: number; scale?: number; flipY?: number } = {},
): string {
  const precision = opts.precision ?? 3
  const scale = opts.scale ?? 1
  const { flipY } = opts
  return pathCommandsToData(commands, (x, y) => {
    const sy = y * scale
    const fy = flipY === undefined ? sy : flipY - sy
    return `${formatNumber(x * scale, precision)} ${formatNumber(fy, precision)}`
  })
}
