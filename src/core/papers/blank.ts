/**
 * 生成无格线的空白纸。
 * Generates blank paper.
 */
/**
 * Blank paper: deliberately nothing to draw.
 *
 * The column layout is still declared so the compose layer can split the page
 * into two empty columns for exam-style layouts.
 */
import { definePaper } from './define'
import {
  COLUMNS_DEFAULTS,
  COLUMNS_FIELDS,
  COLUMNS_MESSAGES,
} from './shared/columns'

export default definePaper({
  type: 'blank',
  group: 'basic',
  messages: {
    'zh-CN': {
      ...COLUMNS_MESSAGES['zh-CN'],
      name: '空白纸',
      'spacing.label': '页面大小',
      'spacing.hint':
        '空白纸只留一个极淡的书写区提示框，不画任何格线。这个参数对画面没有影响，可以放心跳过；需要分栏请在上方切换「左右两栏」。',
      'preset.blank.name': '空白纸',
      'preset.blank.description': '纯白纸张，适合自由书写与草图',
    },
    en: {
      ...COLUMNS_MESSAGES.en,
      name: 'Blank paper',
      'spacing.label': 'Page size',
      'spacing.hint':
        'Blank paper draws only a very faint writing-area outline and no ruling. This setting has no visual effect — feel free to skip it. Use the two-column option above if you need a divider.',
      'preset.blank.name': 'Blank paper',
      'preset.blank.description':
        'An empty sheet for free writing and sketching',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 1,
    max: 50,
    step: 1,
    default: 8,
  },
  fields: COLUMNS_FIELDS,
  defaultOptions: COLUMNS_DEFAULTS,
  presets: [
    {
      id: 'blank',
      name: 'preset.blank.name',
      description: 'preset.blank.description',
      patch: {},
    },
  ],
  render: () => [],
})
