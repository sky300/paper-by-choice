/**
 * 生成分行排列的作文方格。
 * Draws Chinese composition squares.
 *
 * Composition paper: square cells in rows separated by a small gap.
 */
import { line, rect } from '../scene/builders'
import type { SceneItem } from '../scene/types'
import { definePaper } from './define'
import { referenceCellCount } from './shared/grids'
import { twoFieldHeader } from './shared/worksheets'

export default definePaper({
  type: 'composition_paper',
  group: 'worksheet',
  messages: {
    'zh-CN': {
      name: '作文纸',
      'spacing.label': '格边长',
      'spacing.hint':
        '方格作文纸的格边长，行与行之间还留有 3 mm 空隙。常用 9–11 mm；想每页写更多字就调小，字写得大就调大。',
      'preset.default.name': '方格作文纸',
      'preset.default.description': '带姓名与日期栏的方格稿纸',
      'text.name': '姓名',
      'text.date': '日期',
    },
    en: {
      name: 'Composition paper',
      'spacing.label': 'Cell size',
      'spacing.hint':
        'The cell size of the composition grid, with a 3 mm gap between rows. 9–11 mm is typical; decrease it to fit more characters per page, increase it for larger handwriting.',
      'preset.default.name': 'Grid composition paper',
      'preset.default.description': 'Square cells with a name and date header',
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
      id: 'composition',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  render: (ctx) => {
    const { x: L, y: T, w: AW, h: AH } = ctx.area
    const g = ctx.spacing
    const v = 3
    const gy = T + 30
    const rows = Math.floor((T + AH - gy + v) / (g + v))
    const cols = referenceCellCount(AW, g)
    if (rows <= 0 || cols <= 0) return []
    const main = ctx.ink.main()
    const thin = ctx.ink.main({ width: main.width * 0.8 })
    const items: SceneItem[] = [
      ...twoFieldHeader(
        ctx.area,
        [ctx.t('text.name'), ctx.t('text.date')],
        ctx.fonts.body(3.2),
        main,
      ),
      rect({ x: L, y: gy, w: cols * g, h: rows * (g + v) - v }, main),
    ]
    for (let r = 0; r < rows; r++) {
      const y0 = gy + r * (g + v)
      items.push(line(L, y0, L + cols * g, y0, thin))
      items.push(line(L, y0 + g, L + cols * g, y0 + g, thin))
      for (let j = 1; j < cols; j++)
        items.push(line(L + j * g, y0, L + j * g, y0 + g, thin))
    }
    items.push(line(L, gy, L, gy + rows * (g + v) - v, main))
    items.push(
      line(L + cols * g, gy, L + cols * g, gy + rows * (g + v) - v, main),
    )
    return items
  },
})
