/**
 * Mizige (米字格): square practice cells with a "米" guide in every cell and
 * a heavier frame around the whole grid. Cells start at the top-left corner;
 * leftover space stays on the right and bottom.
 */
import { rect } from '../scene/builders'
import type { SceneItem } from '../scene/types'
import { definePaper } from './define'
import { gridFrame, miziGuides } from './shared/mizigeCells'

interface Options {
  calligraphy: { guideColor: string }
}

export default definePaper<Options>({
  type: 'mizige',
  group: 'calligraphy',
  messages: {
    'zh-CN': {
      name: '米字格',
      'spacing.label': '格子边长',
      'spacing.hint':
        '米字格的边长，格内十字与对角线用来把握笔画位置。常用 18–25 mm：低年级用 25 mm，练小字可降到 15 mm。',
      'preset.default.name': '米字格',
      'preset.default.description': '方格配米字辅助线，传统书法练习用纸',
      'field.guideColor': '辅助线颜色',
    },
    en: {
      name: 'Mizige grid',
      'spacing.label': 'Cell size',
      'spacing.hint':
        'Side length of each mizige cell, with cross and diagonal guides for stroke placement. 18–25 mm is typical: 25 mm for young learners, down to 15 mm for small characters.',
      'preset.default.name': 'Mizige grid',
      'preset.default.description': 'Squares with diagonal and midline guides',
      'field.guideColor': 'Guide colour',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 15,
    max: 35,
    step: 1,
    default: 20,
  },
  fields: [
    {
      kind: 'color',
      key: 'calligraphy.guideColor',
      label: 'field.guideColor',
      default: '#B4846C',
    },
  ],
  defaultOptions: { calligraphy: { guideColor: '#B4846C' } },
  presets: [
    {
      id: 'mizige',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  suggestsCalligraphyFrame: true,
  render: (ctx) => {
    const main = ctx.ink.main()
    const { cols, rows, items } = gridFrame(ctx.area, ctx.spacing, main)
    const guideColor = ctx.options.calligraphy.guideColor || main.color
    const guide = ctx.ink.make(guideColor, main.width * 0.7)
    const out: SceneItem[] = [...items]
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        out.push(
          ...miziGuides(
            {
              x: ctx.area.x + c * ctx.spacing,
              y: ctx.area.y + r * ctx.spacing,
              w: ctx.spacing,
              h: ctx.spacing,
            },
            guide,
          ),
        )
      }
    }
    out.push(
      rect(
        {
          x: ctx.area.x,
          y: ctx.area.y,
          w: cols * ctx.spacing,
          h: rows * ctx.spacing,
        },
        ctx.ink.main({ width: main.width * 1.2 }),
      ),
    )
    return out
  },
})
