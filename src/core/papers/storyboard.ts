/**
 * 布局分镜框与注释区。
 * Lays out storyboard frames and notes.
 */
/**
 * Storyboard paper: a grid of empty frames with an optional caption strip
 * beneath each frame. Frames exactly fill the writing area.
 */
import { definePaper } from './define'
import { frameGrid } from './shared/mizigeCells'

interface Options {
  storyboard: {
    rows: number
    columns: number
    showCaptions: boolean
  }
}

export default definePaper<Options>({
  type: 'storyboard',
  group: 'basic',
  messages: {
    'zh-CN': {
      name: '分镜纸',
      'spacing.label': '格子间距',
      'spacing.hint':
        '分镜纸的格子大小由「行数 / 列数 / 说明栏」三个专属配置决定，所以间距不改变画面。想让分镜框更大，请减少行数或列数。',
      'preset.default.name': '分镜纸',
      'preset.default.description': '三行两列的画面格，每格下方留有说明栏',
      'field.rows': '行数',
      'field.columns': '列数',
      'field.showCaptions': '显示说明栏',
    },
    en: {
      name: 'Storyboard',
      'spacing.label': 'Frame gap',
      'spacing.hint':
        'Storyboard frames are sized by the three options "Rows / Columns / Caption strips", so spacing has no effect. For larger frames, reduce the row or column count.',
      'preset.default.name': 'Storyboard',
      'preset.default.description':
        'Three rows by two columns, with a caption strip per frame',
      'field.rows': 'Rows',
      'field.columns': 'Columns',
      'field.showCaptions': 'Caption strips',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 5,
    max: 20,
    step: 1,
    default: 10,
  },
  fields: [
    {
      kind: 'number',
      key: 'storyboard.rows',
      label: 'field.rows',
      min: 1,
      max: 12,
      step: 1,
      default: 3,
    },
    {
      kind: 'number',
      key: 'storyboard.columns',
      label: 'field.columns',
      min: 1,
      max: 8,
      step: 1,
      default: 2,
    },
    {
      kind: 'toggle',
      key: 'storyboard.showCaptions',
      label: 'field.showCaptions',
      default: true,
    },
  ],
  defaultOptions: { storyboard: { rows: 3, columns: 2, showCaptions: true } },
  presets: [
    {
      id: 'storyboard',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  render: (ctx) => {
    const { rows, columns, showCaptions } = ctx.options.storyboard
    const r = Math.max(0, Math.floor(rows))
    const c = Math.max(0, Math.floor(columns))
    if (r === 0 || c === 0) return []
    const rowH = ctx.area.h / r
    // Caption strip is 20% of a frame's height: row = frame + 0.2·frame.
    const caption = showCaptions ? rowH / 6 : 0
    return frameGrid(ctx.area, r, c, caption, ctx.ink.main())
  },
})
