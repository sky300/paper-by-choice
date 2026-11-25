/**
 * Minimal journal paper.
 *
 * A slim header with a 40 mm date box at the top-right, ruled lines below it,
 * and a small capsule near the bottom centre. Everything is drawn inside the
 * writing area; the capsule that the reference places in the bottom margin is
 * kept just inside the lower edge instead.
 */
import { line, rect, text } from '../scene/builders'
import type { SceneItem } from '../scene/types'
import { definePaper } from './define'
import { horizontalRules } from './shared/grids'

const DATE_BOX_WIDTH = 40
const CAPSULE_WIDTH = 7.9
const CAPSULE_HEIGHT = 4.0

export default definePaper({
  type: 'minimal_journal',
  group: 'creative',
  messages: {
    'zh-CN': {
      name: '简约手账纸',
      'spacing.label': '行距',
      'spacing.hint':
        '手账横线与稀疏格线的间距。简洁的行距常用 6–8 mm；喜欢大段留白可到 10 mm 以上，喜欢密密麻麻记录就用 5 mm。',
      'text.date': '日期',
      'preset.minimal.name': '极简手账',
      'preset.minimal.description': '页眉日期框、通栏横线与底部小胶囊',
    },
    en: {
      name: 'Minimal journal',
      'spacing.label': 'Line spacing',
      'spacing.hint':
        'Spacing of the journal rules and sparse grid. A clean 6–8 mm is typical; above 10 mm gives generous whitespace, 5 mm suits dense note-taking.',
      'text.date': 'Date',
      'preset.minimal.name': 'Minimal journal',
      'preset.minimal.description':
        'A header date box, full-width rules and a small bottom capsule',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 5,
    max: 12,
    step: 0.5,
    default: 7,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'minimal',
      name: 'preset.minimal.name',
      description: 'preset.minimal.description',
      patch: {
        paperSize: 'a5',
        theme: 'minimalist',
        margins: { top: 20, right: 15, bottom: 20, left: 15 },
      },
    },
  ],
  render: (ctx) => {
    const { x: L, y: T, w: AW, h: AH } = ctx.area
    const R = L + AW
    const B = T + AH
    const S = ctx.spacing
    const main = ctx.ink.main()
    const items: SceneItem[] = []

    // Date box: 40 mm wide, two spacings tall, flush with the top-right corner.
    const boxWidth = Math.min(DATE_BOX_WIDTH, AW)
    const boxX = R - boxWidth
    items.push(rect({ x: boxX, y: T, w: boxWidth, h: 2 * S }, main))

    // Header rule at two spacings, then the body rules from three spacings down.
    items.push(line(L, T + 2 * S, R, T + 2 * S, main))
    items.push(...horizontalRules(ctx.area, S, main, 3 * S))

    // Small capsule just inside the bottom centre of the area.
    const capsuleX = L + (AW - CAPSULE_WIDTH) / 2
    const capsuleY = B - CAPSULE_HEIGHT
    items.push(
      rect(
        { x: capsuleX, y: capsuleY, w: CAPSULE_WIDTH, h: CAPSULE_HEIGHT },
        ctx.ink.main({ width: main.width * 0.5 }),
      ),
    )

    // Date label, inside the box, in the user's line colour.
    items.push(
      text(
        boxX + 1.3,
        T + S + 1.3,
        ctx.t('text.date'),
        ctx.fonts.body(2.6),
        main.color,
      ),
    )
    return items
  },
})
