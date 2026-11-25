/**
 * Drawing routines for the eight layouts of the parameterized calligraphy
 * practice paper. Everything here is pure arithmetic in millimetres: a layout
 * plus a render context become a flat scene that stays inside the writing area.
 */
import { arc, line, rect } from '../../scene/builders'
import { centeredStart, clamp } from '../../scene/geometry'
import type { Box, Scene, SceneItem, Stroke } from '../../scene/types'
import type { RenderContext } from '../contract'

/** The eight layout kinds, in the order the control panel lists them. */
export const CALLIGRAPHY_GRID_STYLES = [
  'horizontal_lines',
  'vertical_lines',
  'square_grid',
  'tianzi_grid',
  'poem_grid',
  'doufang',
  'zhongtang',
  'tuanshan',
] as const

export type CalligraphyGridStyle = (typeof CALLIGRAPHY_GRID_STYLES)[number]
export type LineWeight = 'thin' | 'normal' | 'bold'
export type PoemType = 'qiyan' | 'wuyan'
export type PoemDirection = 'vertical' | 'horizontal'
export type SignatureMode = 'grid' | 'blank'

/** Full description of one calligraphy layout; every field is optional in a preset. */
export interface CalligraphyLayout {
  gridStyle: CalligraphyGridStyle
  columns: number
  rows: number
  /** Preset remark only: the actual cell size comes from the context's spacing. */
  cellSizeMm: number
  /** Non-zero overrides for non-square cells, in millimetres. */
  cellWidthMm: number
  cellHeightMm: number
  blockCount: number
  blockGapMm: number
  showCenterAxis: boolean
  lineWeight: LineWeight
  guideOpacity: number
  poemType: PoemType
  poemLines: number
  poemDirection: PoemDirection
  titleRows: number
  titleColumns: number
  titleGapMm: number
  signatureRows: number
  signatureMode: SignatureMode
  signatureGapMm: number
  compositionFrame: boolean
  compositionInsetMm: number
  compositionSections: number
  sectionGapMm: number
  fanRows: number
  fanAngleDeg: number
}

/** Layout values used when a preset or the options omit a field. */
export const DEFAULT_CALLIGRAPHY_LAYOUT: CalligraphyLayout = {
  gridStyle: 'square_grid',
  columns: 4,
  rows: 7,
  cellSizeMm: 15,
  cellWidthMm: 0,
  cellHeightMm: 0,
  blockCount: 1,
  blockGapMm: 10,
  showCenterAxis: false,
  lineWeight: 'normal',
  guideOpacity: 0.5,
  poemType: 'qiyan',
  poemLines: 4,
  poemDirection: 'vertical',
  titleRows: 0,
  titleColumns: 0,
  titleGapMm: 4,
  signatureRows: 0,
  signatureMode: 'grid',
  signatureGapMm: 4,
  compositionFrame: true,
  compositionInsetMm: 8,
  compositionSections: 1,
  sectionGapMm: 10,
  fanRows: 5,
  fanAngleDeg: 140,
}

const LINE_WEIGHTS: readonly LineWeight[] = ['thin', 'normal', 'bold']
const POEM_TYPES: readonly PoemType[] = ['qiyan', 'wuyan']
const POEM_DIRECTIONS: readonly PoemDirection[] = ['vertical', 'horizontal']
const SIGNATURE_MODES: readonly SignatureMode[] = ['grid', 'blank']

function integer(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? clamp(Math.floor(value), min, max)
    : fallback
}
function finiteNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? clamp(value, min, max)
    : fallback
}
function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}
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

/** Merges a preset or user layout over the defaults and normalises every field. */
export function resolveLayout(
  raw: Partial<CalligraphyLayout>,
): CalligraphyLayout {
  const d = DEFAULT_CALLIGRAPHY_LAYOUT
  return {
    gridStyle: oneOf(raw.gridStyle, CALLIGRAPHY_GRID_STYLES, d.gridStyle),
    columns: integer(raw.columns, d.columns, 1, 30),
    rows: integer(raw.rows, d.rows, 0, 40),
    cellSizeMm: finiteNumber(raw.cellSizeMm, d.cellSizeMm, 0.5, 100),
    cellWidthMm: finiteNumber(raw.cellWidthMm, d.cellWidthMm, 0.5, 100),
    cellHeightMm: finiteNumber(raw.cellHeightMm, d.cellHeightMm, 0.5, 100),
    blockCount: integer(raw.blockCount, d.blockCount, 1, 4),
    blockGapMm: finiteNumber(raw.blockGapMm, d.blockGapMm, 0, 60),
    showCenterAxis: bool(raw.showCenterAxis, d.showCenterAxis),
    lineWeight: oneOf(raw.lineWeight, LINE_WEIGHTS, d.lineWeight),
    guideOpacity: finiteNumber(raw.guideOpacity, d.guideOpacity, 0, 1),
    poemType: oneOf(raw.poemType, POEM_TYPES, d.poemType),
    poemLines: integer(raw.poemLines, d.poemLines, 1, 8),
    poemDirection: oneOf(raw.poemDirection, POEM_DIRECTIONS, d.poemDirection),
    titleRows: integer(raw.titleRows, d.titleRows, 0, 4),
    titleColumns: integer(raw.titleColumns, d.titleColumns, 0, 40),
    titleGapMm: finiteNumber(raw.titleGapMm, d.titleGapMm, 0, 40),
    signatureRows: integer(raw.signatureRows, d.signatureRows, 0, 6),
    signatureMode: oneOf(raw.signatureMode, SIGNATURE_MODES, d.signatureMode),
    signatureGapMm: finiteNumber(raw.signatureGapMm, d.signatureGapMm, 0, 40),
    compositionFrame: bool(raw.compositionFrame, d.compositionFrame),
    compositionInsetMm: finiteNumber(
      raw.compositionInsetMm,
      d.compositionInsetMm,
      0,
      60,
    ),
    compositionSections: integer(
      raw.compositionSections,
      d.compositionSections,
      1,
      4,
    ),
    sectionGapMm: finiteNumber(raw.sectionGapMm, d.sectionGapMm, 0, 60),
    fanRows: integer(raw.fanRows, d.fanRows, 2, 12),
    fanAngleDeg: finiteNumber(raw.fanAngleDeg, d.fanAngleDeg, 90, 170),
  }
}

/** A line width multiplier for the three weight choices. */
function weightFactor(weight: LineWeight): number {
  if (weight === 'thin') return 0.7
  if (weight === 'bold') return 1.8
  return 1
}

/** Any render context, regardless of the paper's option shape. */
type AnyRenderContext = RenderContext<object>

/** The primary stroke of one render, already scaled by `lineWeight`. */
function mainStroke(
  ctx: AnyRenderContext,
  layout: CalligraphyLayout,
  extra = 1,
): Stroke {
  const base = ctx.ink.main()
  return ctx.ink.main({
    width: base.width * weightFactor(layout.lineWeight) * extra,
  })
}

/** The auxiliary stroke of one render, with its configured opacity. */
function guideStroke(
  ctx: AnyRenderContext,
  layout: CalligraphyLayout,
  extra = 1,
): Stroke {
  const base = ctx.ink.guide()
  return ctx.ink.guide({
    width: base.width * weightFactor(layout.lineWeight) * extra,
    opacity: layout.guideOpacity,
  })
}

/** A centred horizontal rule spanning the width of `box`. */
function hRule(box: Box, y: number, stroke: Stroke): SceneItem {
  return line(box.x, y, box.x + box.w, y, stroke)
}

/** A centred vertical rule spanning the height of `box`. */
function vRule(box: Box, x: number, stroke: Stroke): SceneItem {
  return line(x, box.y, x, box.y + box.h, stroke)
}

/** A closed rectangle grid of `cols × rows` cells drawn at `box`. */
function gridLines(
  box: Box,
  cellW: number,
  cellH: number,
  cols: number,
  rows: number,
  stroke: Stroke,
): SceneItem[] {
  const out: SceneItem[] = []
  for (let c = 0; c <= cols; c++)
    out.push(vRule(box, box.x + c * cellW, stroke))
  for (let r = 0; r <= rows; r++)
    out.push(hRule(box, box.y + r * cellH, stroke))
  return out
}

/** The two midlines inside one cell, dashed and translucent. */
function crossGuides(
  x: number,
  y: number,
  w: number,
  h: number,
  stroke: Stroke,
): SceneItem[] {
  return [
    line(x, y + h / 2, x + w, y + h / 2, stroke),
    line(x + w / 2, y, x + w / 2, y + h, stroke),
  ]
}

/** The cell size of a render: the spacing, unless a preset overrides it. */
function cellSize(
  ctx: AnyRenderContext,
  layout: CalligraphyLayout,
): { w: number; h: number } {
  const spacing =
    ctx.spacing > 0 && Number.isFinite(ctx.spacing) ? ctx.spacing : 15
  return {
    w: layout.cellWidthMm > 0 ? layout.cellWidthMm : spacing,
    h: layout.cellHeightMm > 0 ? layout.cellHeightMm : spacing,
  }
}

/** How many cells of `pitch` fit in `length`, at least one when possible. */
function fits(length: number, pitch: number): number {
  return pitch > 0 ? Math.max(0, Math.floor((length + 1e-6) / pitch)) : 0
}

/** Equal gaps at both ends of `count` cells of `pitch` inside `length`. */
function offset(length: number, pitch: number, count: number): number {
  return centeredStart(length, pitch, count)
}

/* ------------------------------------------------------------------ */
/* Individual styles                                                  */
/* ------------------------------------------------------------------ */

/** Equally spaced horizontal rules, optionally a fixed number of rows. */
function horizontalLines(
  ctx: AnyRenderContext,
  layout: CalligraphyLayout,
): Scene {
  const { area } = ctx
  const cell = cellSize(ctx, layout)
  const pitch = Math.max(1, cell.h)
  const stroke = mainStroke(ctx, layout)
  const out: SceneItem[] = []

  const n = layout.rows > 0 ? layout.rows : Math.max(1, fits(area.h, pitch))
  const count = Math.min(n, Math.max(1, fits(area.h, pitch)))
  const top = area.y + offset(area.h, pitch, count)
  for (let r = 0; r <= count; r++)
    out.push(hRule(area, top + r * pitch, stroke))

  if (layout.showCenterAxis) {
    const axis = ctx.ink.guide({ opacity: 0.5, dash: [4, 4] })
    const mid = area.x + area.w / 2
    const from = top
    const to = top + count * pitch
    out.push(line(mid, from, mid, to, axis))
  }
  return out
}

/** Equally spaced vertical rules; the count follows the spacing. */
function verticalLines(
  ctx: AnyRenderContext,
  layout: CalligraphyLayout,
): Scene {
  const { area } = ctx
  const cell = cellSize(ctx, layout)
  const pitch = Math.max(1, cell.w)
  const stroke = mainStroke(ctx, layout)
  const count = fits(area.w, pitch)
  const left = area.x + offset(area.w, pitch, count)
  const out: SceneItem[] = []
  for (let c = 0; c <= count; c++)
    out.push(vRule(area, left + c * pitch, stroke))

  if (layout.showCenterAxis && count > 0) {
    const axis = ctx.ink.guide({ opacity: 0.5, dash: [4, 4] })
    const mid = area.y + area.h / 2
    out.push(line(left, mid, left + count * pitch, mid, axis))
  }
  return out
}

/** A centred grid of square or rectangular cells, with optional title/signature blocks. */
function cellBlock(
  ctx: AnyRenderContext,
  layout: CalligraphyLayout,
  box: Box,
  cols: number,
  rows: number,
): Scene {
  const cell = cellSize(ctx, layout)
  const cw = cell.w
  const ch = cell.h
  const nc = Math.min(cols, fits(box.w, cw))
  const nr = Math.min(rows, fits(box.h, ch))
  if (nc === 0 || nr === 0) return []

  const usedW = nc * cw
  const usedH = nr * ch
  const bodyW = Math.max(
    usedW,
    layout.titleColumns > 0 ? layout.titleColumns * cw : usedW,
  )
  const titleH = layout.titleRows * ch
  const sigH = layout.signatureRows * ch
  const gaps =
    (layout.titleRows > 0 ? layout.titleGapMm : 0) +
    (layout.signatureRows > 0 ? layout.signatureGapMm : 0)
  const totalH = titleH + usedH + sigH + gaps
  const top = box.y + offset(box.h, totalH, 1)
  const left = box.x + offset(box.w, bodyW, 1)
  const stroke = mainStroke(ctx, layout)
  const guide = guideStroke(ctx, layout, 0.8)
  const out: SceneItem[] = []

  let y = top
  if (layout.titleRows > 0) {
    const tc = Math.min(
      layout.titleColumns > 0 ? layout.titleColumns : nc,
      fits(bodyW, cw),
    )
    const tl = left + offset(bodyW, tc * cw, 1)
    out.push(
      ...gridLines(
        { x: tl, y, w: tc * cw, h: titleH },
        cw,
        ch,
        tc,
        layout.titleRows,
        stroke,
      ),
    )
    y += titleH + layout.titleGapMm
  }
  out.push(
    ...gridLines(
      { x: left + offset(bodyW, usedW, 1), y, w: usedW, h: usedH },
      cw,
      ch,
      nc,
      nr,
      stroke,
    ),
  )
  if (layout.gridStyle === 'tianzi_grid') {
    const gl = left + offset(bodyW, usedW, 1)
    for (let r = 0; r < nr; r++) {
      for (let c = 0; c < nc; c++) {
        out.push(...crossGuides(gl + c * cw, y + r * ch, cw, ch, guide))
      }
    }
  }
  y += usedH
  if (layout.signatureRows > 0) {
    y += layout.signatureGapMm
    const sc = layout.gridStyle === 'zhongtang' ? Math.min(2, nc) : nc
    const sl = left + offset(bodyW, sc * cw, 1)
    const boxSig: Box = { x: sl, y, w: sc * cw, h: sigH }
    if (layout.signatureMode === 'blank') {
      out.push(rect(boxSig, stroke))
    } else {
      out.push(...gridLines(boxSig, cw, ch, sc, layout.signatureRows, stroke))
    }
  }
  return out
}

/** Square or tianzi grid, repeated in `blockCount` side-by-side blocks. */
function squareLayout(ctx: AnyRenderContext, layout: CalligraphyLayout): Scene {
  const { area } = ctx
  const blocks = Math.max(1, layout.blockCount)
  const gap = layout.blockGapMm
  const bw = (area.w - gap * (blocks - 1)) / blocks
  if (bw <= 0) return []
  const out: SceneItem[] = []
  for (let b = 0; b < blocks; b++) {
    out.push(
      ...cellBlock(
        ctx,
        layout,
        { x: area.x + b * (bw + gap), y: area.y, w: bw, h: area.h },
        layout.columns,
        layout.rows,
      ),
    )
  }
  return out
}

/** The body dimensions of a poem layout, from the verse and its direction. */
function poemDims(layout: CalligraphyLayout): { cols: number; rows: number } {
  const perLine = layout.poemType === 'qiyan' ? 7 : 5
  const lines = layout.poemLines
  return layout.poemDirection === 'vertical'
    ? { cols: lines, rows: perLine }
    : { cols: perLine, rows: lines }
}

/** A poem grid: title rows on top, the verse in the middle, signature below. */
function poemLayout(ctx: AnyRenderContext, layout: CalligraphyLayout): Scene {
  const dims = poemDims(layout)
  const withCells: CalligraphyLayout = {
    ...layout,
    columns: dims.cols,
    rows: dims.rows,
  }
  return cellBlock(ctx, withCells, ctx.area, dims.cols, dims.rows)
}

/** A decorative square frame around the content, used by doufang. */
function doufangFrame(
  ctx: AnyRenderContext,
  layout: CalligraphyLayout,
  inner: Scene,
): Scene {
  const { area } = ctx
  const cell = cellSize(ctx, layout)
  const dims = poemDims(layout)
  const w = dims.cols * cell.w
  const h =
    dims.rows * cell.h + (layout.titleRows + layout.signatureRows) * cell.h
  const side = Math.max(w, h) + 2 * layout.compositionInsetMm
  const size = Math.min(side, area.w, area.h)
  const stroke = mainStroke(ctx, layout, 1.2)
  const frame = rect(
    {
      x: area.x + offset(area.w, size, 1),
      y: area.y + offset(area.h, size, 1),
      w: size,
      h: size,
    },
    stroke,
  )
  return layout.compositionFrame ? [frame, ...inner] : inner
}

/** A tall frame with heavier vertical edges, used by zhongtang. */
function zhongtangFrame(
  ctx: AnyRenderContext,
  layout: CalligraphyLayout,
  inner: Scene,
): Scene {
  if (!layout.compositionFrame) return inner
  const { area } = ctx
  const inset = 6
  const x1 = area.x + inset
  const x2 = area.x + area.w - inset
  const y1 = area.y + inset
  const y2 = area.y + area.h - inset
  const vertical = mainStroke(ctx, layout, 1.4)
  const horizontal = mainStroke(ctx, layout, 1.4 * 0.8)
  return [
    line(x1, y1, x1, y2, vertical),
    line(x2, y1, x2, y2, vertical),
    line(x1, y1, x2, y1, horizontal),
    line(x1, y2, x2, y2, horizontal),
    ...inner,
  ]
}

/** Zhongtang stacks one or more poem sections vertically. */
function zhongtangLayout(
  ctx: AnyRenderContext,
  layout: CalligraphyLayout,
): Scene {
  const { area } = ctx
  const sections = Math.max(1, layout.compositionSections)
  const gap = layout.sectionGapMm
  const sh = (area.h - gap * (sections - 1)) / sections
  if (sh <= 0) return []
  const out: SceneItem[] = []
  for (let s = 0; s < sections; s++) {
    const last = s === sections - 1
    const section: CalligraphyLayout = {
      ...layout,
      signatureRows: last ? layout.signatureRows : 0,
      gridStyle: 'poem_grid',
    }
    const box: Box = { x: area.x, y: area.y + s * (sh + gap), w: area.w, h: sh }
    const saved = ctx.area
    const result = cellBlock(
      { ...ctx, area: box },
      section,
      box,
      poemDims(section).cols,
      poemDims(section).rows,
    )
    void saved
    out.push(...result)
  }
  return zhongtangFrame(ctx, layout, out)
}

/**
 * Concentric fan arcs opening upward from the centre of the area. The circle
 * behind each arc is centred in the writing area so even its bounding box fits;
 * radii shrink by `spacing` until the requested number of rows is reached.
 */
function tuanshanLayout(
  ctx: AnyRenderContext,
  layout: CalligraphyLayout,
): Scene {
  const { area } = ctx
  const spacing =
    ctx.spacing > 0 && Number.isFinite(ctx.spacing) ? ctx.spacing : 15
  const half = (layout.fanAngleDeg * Math.PI) / 180 / 2
  const cx = area.x + area.w / 2
  const cy = area.y + area.h / 2
  const maxRadius = Math.max(0, Math.min(area.w, area.h) / 2)
  const start = -Math.PI / 2 - half
  const end = -Math.PI / 2 + half
  const stroke = mainStroke(ctx, layout)
  const out: SceneItem[] = []
  const count = Math.min(
    layout.fanRows + 1,
    Math.floor(maxRadius / spacing) + 1,
  )
  for (let k = 1; k <= count; k++) {
    const r = maxRadius - (k - 1) * spacing
    if (r <= 0) break
    out.push(arc(cx, cy, r, r, start, end, stroke))
  }
  return out
}

/** Dispatches a resolved layout to its drawing routine. */
export function drawCalligraphyLayout(
  ctx: AnyRenderContext,
  layout: CalligraphyLayout,
): Scene {
  switch (layout.gridStyle) {
    case 'horizontal_lines':
      return horizontalLines(ctx, layout)
    case 'vertical_lines':
      return verticalLines(ctx, layout)
    case 'square_grid':
    case 'tianzi_grid':
      return squareLayout(ctx, layout)
    case 'poem_grid':
      return poemLayout(ctx, layout)
    case 'doufang':
      return doufangFrame(ctx, layout, poemLayout(ctx, layout))
    case 'zhongtang':
      return zhongtangLayout(ctx, layout)
    case 'tuanshan':
      return tuanshanLayout(ctx, layout)
  }
}
