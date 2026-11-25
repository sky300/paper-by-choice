/**
 * 绘制带姓名栏与日期栏的算术纸。
 * Draws arithmetic practice with name and date fields.
 *
 * Arithmetic practice paper: ruled rows with two narrow side columns.
 */
import { line, rect } from '../scene/builders'
import type { SceneItem } from '../scene/types'
import { definePaper } from './define'
import { referenceCellCount } from './shared/grids'
import { twoFieldHeader } from './shared/worksheets'

export default definePaper({
  type: 'arithmetic_paper',
  group: 'worksheet',
  messages: {
    'zh-CN': {
      name: '算术纸',
      'spacing.label': '格大小',
      'spacing.hint':
        '每行高度 = 间距 + 2 mm，格内做竖式演算更从容。常用 8–12 mm；数字写得大就调大一些，想多写几行就调小。',
      'preset.default.name': '算术练习纸',
      'preset.default.description': '带姓名与日期栏的竖式演算格纸',
      'text.name': '姓名',
      'text.date': '日期',
    },
    en: {
      name: 'Arithmetic paper',
      'spacing.label': 'Cell size',
      'spacing.hint':
        'Row height = spacing + 2 mm, leaving room for column arithmetic. 8–12 mm is typical; increase it for large handwriting, decrease it to fit more rows.',
      'preset.default.name': 'Arithmetic practice sheet',
      'preset.default.description':
        'Ruled rows with narrow side columns and a name / date header',
      'text.name': 'Name',
      'text.date': 'Date',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 8,
    max: 15,
    step: 0.5,
    default: 10,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'arithmetic',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  render: (ctx) => {
    const { x: L, y: T, w: AW, h: AH } = ctx.area
    const pitch = ctx.spacing + 2
    const cy = T + 30
    const ch = T + AH - cy
    if (ch <= 0) return []
    // The reference rounds the row spacing and the 2 mm gap separately.
    const pxPerMm = 96 / 25.4
    const referencePitch =
      (Math.round(ctx.spacing * pxPerMm) + Math.round(2 * pxPerMm)) / pxPerMm
    const rows = Math.min(
      Math.floor(ch / pitch),
      referenceCellCount(ch, referencePitch),
    )
    const main = ctx.ink.main()
    const thin = ctx.ink.main({ width: main.width * 0.8 })
    const items: SceneItem[] = [
      ...twoFieldHeader(
        ctx.area,
        [ctx.t('text.name'), ctx.t('text.date')],
        ctx.fonts.body(3.2),
        main,
      ),
      rect({ x: L, y: cy, w: AW, h: ch }, main),
    ]
    for (let i = 1; i < rows; i++) {
      items.push(line(L, cy + i * pitch, L + AW, cy + i * pitch, thin))
    }
    const narrow = 10
    const mid = L + AW / 2
    for (const vx of [L + narrow, mid, mid + narrow]) {
      items.push(line(vx, cy, vx, T + AH, thin))
    }
    return items
  },
})
