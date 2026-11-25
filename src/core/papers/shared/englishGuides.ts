/**
 * 共享英文书写格线、页眉和描红断行逻辑。
 * Shares English writing guides, headers, and tracing text wrapping.
 *
 * Shared millimetre guides for the blank and filled English handwriting papers.
 */
import { line, rect, text } from '../../scene/builders'
import type { Box, SceneItem } from '../../scene/types'
import type { OptionField, RenderContext } from '../contract'
import { twoFieldHeader } from './worksheets'

export const englishHeaderField = {
  kind: 'toggle',
  key: 'showHeader',
  label: 'field.showHeader',
  default: true,
} as const satisfies OptionField

export const englishHeaderMessages = {
  'zh-CN': {
    'field.showHeader': '显示姓名和日期',
    'text.name': '姓名',
    'text.date': '日期',
  },
  en: {
    'field.showHeader': 'Show name and date',
    'text.name': 'Name',
    'text.date': 'Date',
  },
}

export function englishHeader(ctx: RenderContext<object>, visible: boolean) {
  const area = ctx.area
  if (!visible || area.h < 21 || area.w < 35) return { area, items: [] }
  return {
    area: { ...area, y: area.y + 19, h: area.h - 19 },
    items: twoFieldHeader(
      area,
      [ctx.t('text.name'), ctx.t('text.date')],
      ctx.fonts.body(3),
      ctx.ink.main(),
    ),
  }
}

// 线的位置以格高为单位，基线固定在字母主体下缘。
// Rule positions use band-height units, with the baseline below the letter body.
type Guide = 'four' | 'primary' | 'double' | 'colour' | 'gray'

const guides: Record<
  Guide,
  {
    positions: readonly number[]
    dashed: boolean
    baseline: number
    red?: boolean
  }
> = {
  four: { positions: [0, 1, 2, 3], dashed: true, baseline: 2 },
  primary: { positions: [0, 1, 2], dashed: true, baseline: 2, red: true },
  double: { positions: [1, 2], dashed: false, baseline: 2 },
  colour: { positions: [0, 1, 2, 3], dashed: false, baseline: 2 },
  gray: { positions: [0, 1, 2, 3], dashed: false, baseline: 2 },
}

const colourBands = ['#deeffb', '#e0efdf', '#f5e8db']
const grayBands = ['#edf0f2', '#dfe4e6', '#f3f3f3']

export function handwritingGuide(
  ctx: RenderContext<object>,
  area: Box,
  y: number,
  band: number,
  type: Guide,
  baselineColor?: string,
): SceneItem[] {
  const { positions, dashed, baseline, red } = guides[type]
  const main = ctx.ink.main()
  const aux = { ...main, width: main.width * 0.8 }
  const base = ctx.ink.make(
    baselineColor ?? (red ? '#a94545' : main.color),
    main.width * 1.2,
  )
  const midline = ctx.ink.make(main.color, aux.width, [1.5, 1.1])
  const bands =
    type === 'colour' ? colourBands : type === 'gray' ? grayBands : []
  return [
    ...bands.map((color, i) =>
      rect({ x: area.x, y: y + i * band, w: area.w, h: band }, undefined, {
        color,
      }),
    ),
    ...positions.map((position) => {
      const yy = y + position * band
      return line(
        area.x,
        yy,
        area.x + area.w,
        yy,
        position === baseline ? base : position === 1 && dashed ? midline : aux,
      )
    }),
  ]
}

export function handwritingRows(
  ctx: RenderContext<object>,
  area: Box,
  pitch: number,
  band: number,
  type: Guide,
  baselineColor?: string,
): SceneItem[] {
  // 只绘制完整线组，允许毫米换算带来的微小浮点误差。
  // Draw complete groups only, allowing a small tolerance for millimetre arithmetic.
  const height = (guides[type].positions.at(-1) ?? 0) * band
  const rows: SceneItem[] = []
  for (let offset = 0; offset + height <= area.h + 1e-6; offset += pitch) {
    rows.push(
      ...handwritingGuide(
        ctx,
        area,
        area.y + offset,
        band,
        type,
        baselineColor,
      ),
    )
  }
  return rows
}

/**
 * 优先在单词边界断行，使示范文本留在书写区域内。
 * Splits examples at word boundaries when possible, keeping the type inside the rule.
 */
export function wrapTracingSample(sample: string, maxChars: number): string[] {
  const rows: string[] = []
  let rest = sample.replace(/\s+/g, ' ').trim()
  while (rest.length > maxChars) {
    const split = rest.lastIndexOf(' ', maxChars)
    const length = split > 0 ? split : maxChars
    rows.push(rest.slice(0, length))
    rest = rest.slice(length).trimStart()
  }
  if (rest) rows.push(rest)
  return rows
}

export function worksheetLabel(
  ctx: RenderContext<object>,
  label: string,
  x: number,
  y: number,
  maxWidth: number,
): SceneItem {
  const size = Math.min(3.6, maxWidth / Math.max(label.length * 0.68, 1))
  return text(
    x,
    y,
    label,
    ctx.fonts.body(size, { weight: 700 }),
    ctx.ink.main().color,
  )
}
