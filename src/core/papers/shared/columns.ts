/**
 * 拆分可写区域并绘制分栏线。
 * Splits writable areas and draws column dividers.
 */
/**
 * Left / right column layout, shared by the papers that can be split in two.
 *
 * The compose layer reads these options to split the writing area and draw
 * the divider; a paper only has to adopt the fields, the defaults and the
 * messages so the control panel can offer the layout.
 */
import type { ColumnsOptions, OptionField, PaperMessages } from '../contract'
import { getOption } from '../kit'

/** A single column; the gap and divider are kept so they survive a switch back to one column. */
export const COLUMNS_DEFAULTS: ColumnsOptions = {
  columns: { count: '1', gap: 8, divider: 'solid' },
}

/** `showIf` of the fields that only make sense with two columns. */
function isTwoColumns(options: Record<string, unknown>): boolean {
  return getOption<string>(options, 'columns.count', '1') === '2'
}

/** The three column fields, stored under `columns.*`. */
export const COLUMNS_FIELDS: readonly OptionField[] = [
  {
    kind: 'select',
    key: 'columns.count',
    label: 'columns.label',
    choices: [
      { value: '1', label: 'columns.one' },
      { value: '2', label: 'columns.two' },
    ],
    default: '1',
  },
  {
    kind: 'number',
    key: 'columns.gap',
    label: 'columns.gap',
    min: 2,
    max: 40,
    step: 1,
    unit: 'mm',
    default: 8,
    showIf: isTwoColumns,
  },
  {
    kind: 'select',
    key: 'columns.divider',
    label: 'columns.divider',
    choices: [
      { value: 'solid', label: 'columns.divider.solid' },
      { value: 'dashed', label: 'columns.divider.dashed' },
    ],
    default: 'solid',
    showIf: isTwoColumns,
  },
]

/** Labels of the column fields; spread into the messages of every paper that supports columns. */
export const COLUMNS_MESSAGES: PaperMessages = {
  'zh-CN': {
    'columns.label': '分栏',
    'columns.one': '单栏',
    'columns.two': '左右两栏',
    'columns.gap': '栏间距',
    'columns.divider': '分隔线',
    'columns.divider.solid': '实线',
    'columns.divider.dashed': '虚线',
  },
  en: {
    'columns.label': 'Columns',
    'columns.one': 'Single column',
    'columns.two': 'Two columns',
    'columns.gap': 'Gap between columns',
    'columns.divider': 'Divider line',
    'columns.divider.solid': 'Solid',
    'columns.divider.dashed': 'Dashed',
  },
}
