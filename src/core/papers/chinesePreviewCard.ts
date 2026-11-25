/**
 * Chinese preview card: an 8-column table with a coloured header and body
 * rows whose cells carry practice squares and midlines for handwriting.
 */
import { line, rect, text } from '../scene/builders'
import type { Scene, SceneItem, Stroke } from '../scene/types'
import { definePaper } from './define'

const HEADER_H = 10
const ROW_H = 20
const HEADER_FONT = 3.2

const COLUMNS = [
  { key: 'char', ratio: 0.1, style: 'square' },
  { key: 'pinyin', ratio: 0.1, style: 'rules' },
  { key: 'sequence', ratio: 0.08, style: 'none' },
  { key: 'radical', ratio: 0.08, style: 'none' },
  { key: 'structure', ratio: 0.08, style: 'none' },
  { key: 'word1', ratio: 0.186, style: 'pair' },
  { key: 'word2', ratio: 0.187, style: 'pair' },
  { key: 'word3', ratio: 0.187, style: 'pair' },
] as const

function practiceSquare(
  x: number,
  y: number,
  size: number,
  stroke: Stroke,
  guide: Stroke,
): SceneItem[] {
  return [
    rect({ x, y, w: size, h: size }, stroke),
    line(x + size / 2, y, x + size / 2, y + size, guide),
    line(x, y + size / 2, x + size, y + size / 2, guide),
  ]
}

export default definePaper({
  type: 'chinese_preview_card',
  group: 'creative',
  messages: {
    'zh-CN': {
      name: '语文预习卡',
      'spacing.label': '行距',
      'spacing.hint':
        '这个参数不改变本纸型的版面：预习卡按固定列数排布。想换更宽松/紧凑的记录空间，请调整纸张尺寸或四边边距。',
      'preset.default.name': '语文预习卡',
      'preset.default.description': '八列表格，表头彩色，生字与词组带练习方框',
      'col.char': '生字',
      'col.pinyin': '注音',
      'col.sequence': '音序',
      'col.radical': '偏旁',
      'col.structure': '结构',
      'col.word1': '词组1',
      'col.word2': '词组2',
      'col.word3': '词组3',
    },
    en: {
      name: 'Chinese preview card',
      'spacing.label': 'Line spacing',
      'spacing.hint':
        'This setting does not change this layout: the preview card uses a fixed number of columns. For a looser or tighter writing area, change the paper size or the margins.',
      'preset.default.name': 'Chinese preview card',
      'preset.default.description':
        'Eight-column table with a coloured header and practice squares',
      'col.char': 'Character',
      'col.pinyin': 'Pinyin',
      'col.sequence': 'Initial',
      'col.radical': 'Radical',
      'col.structure': 'Structure',
      'col.word1': 'Word 1',
      'col.word2': 'Word 2',
      'col.word3': 'Word 3',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 8,
    max: 20,
    step: 1,
    default: 12,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'chinese-preview-card',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  render: (ctx): Scene => {
    const a = ctx.area
    const color = ctx.ink.main().color
    const lw = ctx.ink.main().width
    const main = ctx.ink.main()
    const guide = ctx.ink.make(color, lw * 0.7, [2, 2])
    const frame = ctx.ink.make(color, lw * 1.2, undefined)
    const items: SceneItem[] = []

    // Header colours are drawn from the theme rather than fixed swatches.
    const swatches = [
      ctx.theme.primary,
      ctx.theme.secondary,
      ctx.theme.accent,
      ctx.theme.lines,
    ]
    const widths = COLUMNS.map((c) => c.ratio * a.w)
    const edges: number[] = []
    let acc = a.x
    for (const w of widths) {
      edges.push(acc)
      acc += w
    }
    edges.push(a.x + a.w)

    const rows = Math.max(0, Math.floor((a.h - HEADER_H) / ROW_H))
    const tableH = HEADER_H + rows * ROW_H
    const headerFont = ctx.fonts.body(HEADER_FONT)

    // 1. Header cells.
    COLUMNS.forEach((col, i) => {
      const x = edges[i]
      const w = widths[i]
      items.push(
        rect({ x, y: a.y, w, h: HEADER_H }, main, {
          color: swatches[i % swatches.length],
          opacity: 0.35,
        }),
      )
      items.push(
        text(
          x + w / 2,
          a.y + HEADER_H / 2 + 1.3,
          ctx.t(`col.${col.key}`),
          headerFont,
          ctx.theme.text,
          {
            anchor: 'middle',
          },
        ),
      )
    })

    // 2. Body rows.
    for (let r = 0; r < rows; r++) {
      const y0 = a.y + HEADER_H + r * ROW_H
      items.push(line(a.x, y0 + ROW_H, a.x + a.w, y0 + ROW_H, main))
      COLUMNS.forEach((col, i) => {
        if (i < 7) {
          items.push(line(edges[i + 1], y0, edges[i + 1], y0 + ROW_H, main))
        }
        const x = edges[i]
        const w = widths[i]
        if (col.style === 'rules') {
          for (let k = 1; k <= 3; k++) {
            items.push(
              line(x, y0 + (k * ROW_H) / 4, x + w, y0 + (k * ROW_H) / 4, main),
            )
          }
        } else if (col.style === 'square') {
          const size = Math.min(0.8 * w, 0.8 * ROW_H)
          items.push(
            ...practiceSquare(
              x + (w - size) / 2,
              y0 + (ROW_H - size) / 2,
              size,
              main,
              guide,
            ),
          )
        } else if (col.style === 'pair') {
          const size = Math.min(w / 2, ROW_H)
          const gap = (w - 2 * size) / 3
          for (let k = 0; k < 2; k++) {
            items.push(
              ...practiceSquare(
                x + gap + k * (size + gap),
                y0 + (ROW_H - size) / 2,
                size,
                main,
                guide,
              ),
            )
          }
        }
      })
    }
    // 3. Outer frame.
    items.push(rect({ x: a.x, y: a.y, w: a.w, h: tableH }, frame))
    return items as Scene
  },
})
