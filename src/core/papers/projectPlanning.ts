/**
 * Project-planning paper: a title band, an information box, a 5 × 14-day
 * Gantt chart and a checklist of tasks with ruled blanks.
 */
import { line, rect, text } from '../scene/builders'
import { repeatPositions } from '../scene/geometry'
import type { Scene, SceneItem } from '../scene/types'
import { definePaper } from './define'
import { checkbox, tableGrid } from './shared/forms'

const TITLE_PX = 3.7
const LABEL_PX = 3.2
const SMALL_PX = 2.1
const TASK_PX = 2.6
const INSET = 2.6
const ROW1 = 5.3
const ROW2 = 13.2
const FIELD_OFFSET = 18.5
const FIELD_LEN = 21.2
const NAME_COL = 21.2
const BOX_SIZE = 2.6
const BOX_RISE = 2.6
const GANTT_ROWS = 5
const GANTT_COLS = 14

export default definePaper({
  type: 'project_planning',
  group: 'creative',
  messages: {
    'zh-CN': {
      name: '项目规划纸',
      'spacing.label': '行距',
      'spacing.hint':
        '项目规划区横线的间距。常用 6–10 mm：需要在行间写批注就调大，只打勾或列短句可调小。甘特图网格是固定列数，不受它影响。',
      'preset.default.name': '项目规划',
      'preset.default.description': '信息框、甘特图与任务清单',
      'text.title': '项目规划',
      'text.name': '项目名称:',
      'text.start': '开始日期:',
      'text.owner': '负责人:',
      'text.due': '截止日期:',
      'text.gantt': '甘特图',
      'text.day': 'D{n}',
      'text.task': '任务{n}',
      'text.tasks': '任务列表',
    },
    en: {
      name: 'Project planning',
      'spacing.label': 'Line spacing',
      'spacing.hint':
        'Spacing of the planning rules. 6–10 mm is typical: increase it to write notes between lines, decrease it for short checklists. The Gantt grid has a fixed column count and is unaffected.',
      'preset.default.name': 'Project planning',
      'preset.default.description':
        'Info box, a Gantt chart and a task checklist',
      'text.title': 'Project planning',
      'text.name': 'Project name:',
      'text.start': 'Start date:',
      'text.owner': 'Owner:',
      'text.due': 'Due date:',
      'text.gantt': 'Gantt chart',
      'text.day': 'D{n}',
      'text.task': 'Task {n}',
      'text.tasks': 'Task list',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 6,
    max: 15,
    step: 0.5,
    default: 10,
  },
  fields: [],
  defaultOptions: {},
  presets: [
    {
      id: 'project-planning',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  render: (ctx): Scene => {
    const a = ctx.area
    const S = ctx.spacing
    // The framework spans 22 pitches from the top to the task list; cap it so
    // the whole sheet stays inside the writing area on short or large-spaced
    // pages, while rule density still follows the user's spacing.
    const L = Math.min(S, a.h / 24)
    const color = ctx.ink.main().color
    const lw = ctx.ink.main().width
    const main = ctx.ink.main()
    const thin = ctx.ink.make(color, lw * 0.5, undefined)
    const faint = ctx.ink.make(color, lw, undefined)
    const bold = ctx.ink.make(color, lw * 1.2, undefined)
    const accentFill = { color: ctx.theme.accent, opacity: 0.1 }
    const labelFont = ctx.fonts.body(LABEL_PX)
    const titleFont = ctx.fonts.heading(TITLE_PX, { weight: 700 })
    const boldFont = ctx.fonts.body(LABEL_PX, { weight: 700 })
    const smallFont = ctx.fonts.body(SMALL_PX)
    const taskFont = ctx.fonts.body(TASK_PX)
    const items: SceneItem[] = []

    // 1. Title band (3S tall) with accented wash.
    const titleH = 3 * L
    items.push(rect({ x: a.x, y: a.y, w: a.w, h: titleH }, main, accentFill))
    items.push(
      text(
        a.x + INSET,
        a.y + titleH / 2 + 1.3,
        ctx.t('text.title'),
        titleFont,
        color,
      ),
    )

    // 2. Info box (4L tall) with four labelled blanks in two columns.
    const j = a.y + 4 * L
    items.push(rect({ x: a.x, y: j, w: a.w, h: 4 * L }, main))
    const half = a.w / 2
    const fieldPairs: readonly [number, string][] = [
      [a.x + INSET, ctx.t('text.name')],
      [a.x + half + INSET, ctx.t('text.owner')],
      [a.x + INSET, ctx.t('text.start')],
      [a.x + half + INSET, ctx.t('text.due')],
    ]
    fieldPairs.forEach(([x, label], i) => {
      const y = j + (i % 2 === 0 ? ROW1 : ROW2)
      items.push(text(x, y, label, labelFont, color))
      items.push(
        line(
          x + FIELD_OFFSET,
          y + 1.3,
          x + FIELD_OFFSET + FIELD_LEN,
          y + 1.3,
          thin,
        ),
      )
    })

    // 3. Gantt chart: 5 rows × 14 columns inside a framed box.
    const M = j + 6 * L
    const z = 10 * L
    const chart: SceneItem[] = [rect({ x: a.x, y: M, w: a.w, h: z }, main)]
    items.push(text(a.x + INSET, M - 2.6, ctx.t('text.gantt'), boldFont, color))
    const grid = tableGrid(
      { x: a.x + NAME_COL, y: M, w: a.w - NAME_COL, h: z },
      GANTT_ROWS,
      GANTT_COLS,
      faint,
    )
    chart.push(...grid)
    // Name-column divider drawn last so it stays on top.
    chart.push(line(a.x + NAME_COL, M, a.x + NAME_COL, M + z, bold))
    items.push(...chart)

    // Column headers and placeholder task names.
    const colW = (a.w - NAME_COL) / GANTT_COLS
    for (let c = 0; c < GANTT_COLS; c++) {
      const cx = a.x + NAME_COL + (c + 0.5) * colW
      items.push(
        text(cx, M - 1.3, ctx.t('text.day', { n: c + 1 }), smallFont, color, {
          anchor: 'middle',
        }),
      )
    }
    const rowH = z / GANTT_ROWS
    for (let r = 0; r < GANTT_ROWS; r++) {
      items.push(
        text(
          a.x + 1.3,
          M + (r + 0.5) * rowH + 1,
          ctx.t('text.task', { n: r + 1 }),
          taskFont,
          color,
        ),
      )
    }

    // 4. Task checklist: full-width rules with a checkbox on every line but the first.
    const Rc = M + 12 * L
    const bottom = a.y + a.h
    if (Rc < bottom) {
      items.push(
        text(a.x + INSET, Rc - 2.6, ctx.t('text.tasks'), boldFont, color),
      )
      const rules = repeatPositions(bottom - Rc, S, 0)
      // Include a rule exactly at Rc (k = 0) when it fits.
      const ys = [0, ...rules]
      for (let k = 0; k < ys.length; k++) {
        const y = Rc + ys[k]
        if (y > bottom) break
        items.push(line(a.x, y, a.x + a.w, y, main))
        if (k >= 1) {
          items.push(checkbox(a.x + 1.3, y - BOX_RISE, BOX_SIZE, thin))
        }
      }
    }
    return items as Scene
  },
})
