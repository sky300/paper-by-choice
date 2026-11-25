/**
 * 布局康奈尔笔记的线索、笔记和总结区。
 * Lays out Cornell cue, note, and summary areas.
 */
/**
 * Cornell notes paper.
 *
 * A cue column on the left, a wider notes column on the right and a summary
 * band at the bottom, with a title band across the top. The spacing parameter
 * is the rule pitch of the notes and summary areas; the cue column uses a
 * wider pitch of one and a half times that. Section labels are translated
 * with the rest of the sheet.
 */
import { definePaper } from './define'
import { line, text } from '../scene/builders'
import { repeatPositions } from '../scene/geometry'
import type { SceneItem, Stroke } from '../scene/types'

interface CornellOptions {
  cornell: { cueWidth: number; summaryHeight: number }
}

/** Horizontal rules of one band, each spanning from `left` to `right`. */
function rules(
  left: number,
  right: number,
  top: number,
  height: number,
  pitch: number,
  stroke: Stroke,
): SceneItem[] {
  return repeatPositions(height, pitch, pitch).map((offset) =>
    line(left, top + offset, right, top + offset, stroke),
  )
}

export default definePaper<CornellOptions>({
  type: 'cornell',
  group: 'basic',
  messages: {
    'zh-CN': {
      name: '康奈尔笔记',
      'spacing.label': '正文行距',
      'spacing.hint':
        '正文笔记区的行距；左侧线索栏的行距是它的 1.5 倍，标题区高度是两个行距。常用 7–9 mm，字大或喜欢留白可到 10 mm 以上。',
      'field.cornell.cueWidth': '线索栏宽度',
      'field.cornell.summaryHeight': '总结区高度',
      'text.cues': '线索',
      'text.notes': '笔记',
      'text.summary': '总结',
      'preset.cornell.name': '标准康奈尔',
      'preset.cornell.description': '线索、笔记、总结三段式笔记布局',
    },
    en: {
      name: 'Cornell notes',
      'spacing.label': 'Note line spacing',
      'spacing.hint':
        'Line pitch of the notes area; the cue column uses 1.5× this value and the title band is two lines tall. 7–9 mm is typical — go above 10 mm for large handwriting or extra whitespace.',
      'field.cornell.cueWidth': 'Cue column width',
      'field.cornell.summaryHeight': 'Summary band height',
      'text.cues': 'Cues',
      'text.notes': 'Notes',
      'text.summary': 'Summary',
      'preset.cornell.name': 'Standard Cornell',
      'preset.cornell.description':
        'Cue, notes and summary sections for structured notes',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 6,
    max: 15,
    step: 0.5,
    default: 8,
  },
  fields: [
    {
      kind: 'number',
      key: 'cornell.cueWidth',
      label: 'field.cornell.cueWidth',
      min: 20,
      max: 120,
      step: 1,
      unit: 'mm',
      default: 60,
    },
    {
      kind: 'number',
      key: 'cornell.summaryHeight',
      label: 'field.cornell.summaryHeight',
      min: 20,
      max: 120,
      step: 1,
      unit: 'mm',
      default: 50,
    },
  ],
  defaultOptions: { cornell: { cueWidth: 60, summaryHeight: 50 } },
  presets: [
    {
      id: 'cornell',
      name: 'preset.cornell.name',
      description: 'preset.cornell.description',
      patch: {},
    },
  ],
  render: (ctx) => {
    const { area, spacing, ink, options, t, fonts } = ctx
    const { cueWidth, summaryHeight } = options.cornell
    const main = ink.main()
    const heavy: Stroke = ink.main({ width: main.width * 1.5 })
    const right = area.x + area.w
    const split = area.x + cueWidth
    const summaryTop = area.y + area.h - summaryHeight
    const notesHeight = summaryTop - area.y
    const inset = 1.3
    const labelFont = fonts.body(3.2)
    const labelFill = main.color

    const items: SceneItem[] = [
      line(split, area.y, split, summaryTop, heavy),
      line(area.x, summaryTop, right, summaryTop, heavy),
      line(area.x, area.y + 2 * spacing, right, area.y + 2 * spacing, main),
      ...rules(split + inset, right, area.y, notesHeight, spacing, main),
      ...rules(area.x, split - inset, area.y, notesHeight, spacing * 1.5, main),
      ...rules(area.x, right, summaryTop, summaryHeight, spacing, main),
      text(area.x + inset, area.y + 4, t('text.cues'), labelFont, labelFill),
      text(split + inset, area.y + 4, t('text.notes'), labelFont, labelFill),
      text(
        area.x + inset,
        summaryTop + 4,
        t('text.summary'),
        labelFont,
        labelFill,
      ),
    ]
    return items
  },
})
