/**
 * Parameterized calligraphy practice paper: eight layouts driven by one
 * `layout` option object, plus 43 named presets taken from the W table.
 * The drawing itself lives in `shared/calligraphyLayouts.ts`.
 */
import { text } from '../scene/builders'
import type { SceneItem } from '../scene/types'
import type {
  NumberField,
  OptionField,
  Preset,
  SelectField,
  ToggleField,
} from './contract'
import { getOption } from './kit'
import { definePaper } from './define'
import {
  CALLIGRAPHY_GRID_STYLES,
  DEFAULT_CALLIGRAPHY_LAYOUT,
  drawCalligraphyLayout,
  resolveLayout,
  type CalligraphyGridStyle,
  type CalligraphyLayout,
} from './shared/calligraphyLayouts'

interface Options {
  layout: Record<string, unknown>
}

/** One row of the W preset table: ids, bilingual copy, spacing and the full layout object. */
interface PresetRow {
  id: string
  name: [string, string]
  description: [string, string]
  spacing: number
  layout: Record<string, unknown>
  margins?: { top: number; right: number; bottom: number; left: number }
}

/* ------------------------------------------------------------------ */
/* W table — appended in batches; keep this list in the W table's order. */
/* ------------------------------------------------------------------ */

const W_ROWS: PresetRow[] = [
  {
    id: 'cp_four_row_16',
    name: ['四行笺', 'Four-line sheet'],
    description: ['四行笺，格径 16 mm', 'Four ruled lines for short passages'],
    spacing: 16,
    layout: {
      gridStyle: 'horizontal_lines',
      rows: 4,
      cellSizeMm: 16,
    },
  },
  {
    id: 'cp_four_row_17',
    name: ['四行笺', 'Four-line sheet (17 mm)'],
    description: [
      '四行笺，格径 17 mm',
      'Four widely spaced lines for larger characters',
    ],
    spacing: 17,
    layout: {
      gridStyle: 'horizontal_lines',
      rows: 4,
      cellSizeMm: 17,
    },
  },
  {
    id: 'cp_three_row_16',
    name: ['三行笺', 'Three-line sheet'],
    description: ['三行笺，格径 16 mm', 'Three ruled lines for short practice'],
    spacing: 16,
    layout: {
      gridStyle: 'horizontal_lines',
      rows: 3,
      cellSizeMm: 16,
    },
  },
  {
    id: 'cp_hline_15',
    name: ['横线格', 'Ruled lines'],
    description: [
      '横线格，格径 15 mm',
      'A full page of evenly spaced horizontal lines',
    ],
    spacing: 15,
    layout: {
      gridStyle: 'horizontal_lines',
      cellSizeMm: 15,
    },
  },
  {
    id: 'cp_hline_thin_axis_15',
    name: ['细横线格（中轴）', 'Ruled lines, thin axis'],
    description: [
      '横线格，每行带细中轴线',
      'Horizontal lines with a thin centre guide in each band',
    ],
    spacing: 15,
    layout: {
      gridStyle: 'horizontal_lines',
      cellSizeMm: 15,
      showCenterAxis: true,
      lineWeight: 'thin',
    },
  },
  {
    id: 'cp_hline_bold_axis_15',
    name: ['粗横线格（中轴）', 'Ruled lines, bold axis'],
    description: [
      '横线格，每行带粗中轴线',
      'Horizontal lines with a bold centre guide in each band',
    ],
    spacing: 15,
    layout: {
      gridStyle: 'horizontal_lines',
      cellSizeMm: 15,
      showCenterAxis: true,
      lineWeight: 'bold',
    },
  },
  {
    id: 'cp_vline_15',
    name: ['竖线格', 'Vertical rules (15 mm)'],
    description: [
      '竖线格，格径 15 mm',
      'Evenly spaced vertical lines for column writing',
    ],
    spacing: 15,
    layout: {
      gridStyle: 'vertical_lines',
      cellSizeMm: 15,
    },
  },
  {
    id: 'cp_vline_10',
    name: ['竖线格', 'Vertical rules (10 mm)'],
    description: [
      '竖线格，10 mm 间距',
      'Denser vertical rules for smaller characters',
    ],
    spacing: 10,
    layout: {
      gridStyle: 'vertical_lines',
      cellSizeMm: 10,
    },
  },
  {
    id: 'cp_vline_12',
    name: ['竖线格', 'Vertical rules (12 mm)'],
    description: ['竖线格，12 mm 间距', 'Vertical rules at a 12 mm pitch'],
    spacing: 12,
    layout: {
      gridStyle: 'vertical_lines',
      cellSizeMm: 12,
    },
  },
  {
    id: 'cp_vline_13',
    name: ['竖线格', 'Vertical rules (13 mm)'],
    description: ['竖线格，13 mm 间距', 'Vertical rules at a 13 mm pitch'],
    spacing: 13,
    layout: {
      gridStyle: 'vertical_lines',
      cellSizeMm: 13,
    },
  },
  {
    id: 'cp_tianzi_10x15_15',
    name: ['田字格 10×15', 'Cross guides 10×15'],
    description: [
      '田字格 10×15，格径 15 mm',
      'Ten by fifteen tianzi cells with cross guides',
    ],
    spacing: 15,
    layout: {
      gridStyle: 'tianzi_grid',
      columns: 10,
      rows: 15,
      cellSizeMm: 15,
      guideOpacity: 0.5,
    },
  },
  {
    id: 'cp_grid_11x17_15',
    name: ['方格 11×17', 'Square grid 11×17'],
    description: [
      '方格 11×17，格径 15 mm',
      'Eleven by seventeen squares at 15 mm',
    ],
    spacing: 15,
    layout: {
      gridStyle: 'square_grid',
      columns: 11,
      rows: 17,
      cellSizeMm: 15,
    },
  },
  {
    id: 'cp_grid_10x15_15',
    name: ['方格 10×15', 'Square grid 10×15'],
    description: ['方格 10×15，格径 15 mm', 'Ten by fifteen squares at 15 mm'],
    spacing: 15,
    layout: {
      gridStyle: 'square_grid',
      columns: 10,
      rows: 15,
      cellSizeMm: 15,
    },
  },
  {
    id: 'cp_grid_4x7_15',
    name: ['方格 4×7', 'Square grid 4×7'],
    description: [
      '方格 4×7，格径 15 mm',
      'Four by seven large squares at 15 mm',
    ],
    spacing: 15,
    layout: {
      gridStyle: 'square_grid',
      columns: 4,
      rows: 7,
      cellSizeMm: 15,
    },
  },
  {
    id: 'cp_grid_7x4_15',
    name: ['方格 7×4', 'Square grid 7×4'],
    description: [
      '方格 7×4，格径 15 mm',
      'Seven by four large squares at 15 mm',
    ],
    spacing: 15,
    layout: {
      gridStyle: 'square_grid',
      columns: 7,
      rows: 4,
      cellSizeMm: 15,
    },
  },
  {
    id: 'cp_grid_8x5_15',
    name: ['方格 8×5', 'Square grid 8×5'],
    description: ['方格 8×5，格径 15 mm', 'Eight by five squares at 15 mm'],
    spacing: 15,
    layout: {
      gridStyle: 'square_grid',
      columns: 8,
      rows: 5,
      cellSizeMm: 15,
    },
  },
  {
    id: 'cp_grid_8x7_15',
    name: ['方格 8×7', 'Square grid 8×7'],
    description: ['方格 8×7，格径 15 mm', 'Eight by seven squares at 15 mm'],
    spacing: 15,
    layout: {
      gridStyle: 'square_grid',
      columns: 8,
      rows: 7,
      cellSizeMm: 15,
    },
  },
  {
    id: 'cp_grid_3x10_15',
    name: ['方格 3×10', 'Square grid 3×10'],
    description: ['方格 3×10，格径 15 mm', 'Three by ten squares at 15 mm'],
    spacing: 15,
    layout: {
      gridStyle: 'square_grid',
      columns: 3,
      rows: 10,
      cellSizeMm: 15,
    },
  },
  {
    id: 'cp_grid_4x14_15',
    name: ['方格 4×14', 'Square grid 4×14'],
    description: [
      '方格 4×14，格径 15 mm',
      'Four by fourteen squares with a signature row',
    ],
    spacing: 15,
    layout: {
      gridStyle: 'square_grid',
      columns: 4,
      rows: 14,
      cellSizeMm: 15,
      signatureRows: 2,
    },
  },
  {
    id: 'cp_grid_4x14_15_no_sig',
    name: ['方格 4×14（无落款）', 'Square grid 4×14, no signature'],
    description: [
      '方格 4×14（无落款），格径 15 mm',
      'Four by fourteen squares without a signature row',
    ],
    spacing: 15,
    layout: {
      gridStyle: 'square_grid',
      columns: 4,
      rows: 14,
      cellSizeMm: 15,
      signatureRows: 0,
    },
  },
  {
    id: 'cp_grid_4x7_17',
    name: ['方格 4×7', 'Square grid 4×7 (17 mm)'],
    description: [
      '方格 4×7，格径 17 mm',
      'Four by seven larger squares at 17 mm',
    ],
    spacing: 17,
    layout: {
      gridStyle: 'square_grid',
      columns: 4,
      rows: 7,
      cellSizeMm: 17,
    },
  },
  {
    id: 'cp_grid_7x4_17',
    name: ['方格 7×4', 'Square grid 7×4 (17 mm)'],
    description: [
      '方格 7×4，格径 17 mm',
      'Seven by four larger squares at 17 mm',
    ],
    spacing: 17,
    layout: {
      gridStyle: 'square_grid',
      columns: 7,
      rows: 4,
      cellSizeMm: 17,
    },
  },
  {
    id: 'cp_grid_8x5_17',
    name: ['方格 8×5', 'Square grid 8×5 (17 mm)'],
    description: [
      '方格 8×5，格径 17 mm',
      'Eight by five larger squares at 17 mm',
    ],
    spacing: 17,
    layout: {
      gridStyle: 'square_grid',
      columns: 8,
      rows: 5,
      cellSizeMm: 17,
    },
  },
  {
    id: 'cp_grid_8x7_17',
    name: ['方格 8×7', 'Square grid 8×7 (17 mm)'],
    description: [
      '方格 8×7，格径 17 mm',
      'Eight by seven larger squares at 17 mm',
    ],
    spacing: 17,
    layout: {
      gridStyle: 'square_grid',
      columns: 8,
      rows: 7,
      cellSizeMm: 17,
    },
  },
  {
    id: 'cp_grid_3x10_17',
    name: ['方格 3×10', 'Square grid 3×10 (17 mm)'],
    description: [
      '方格 3×10，格径 17 mm',
      'Three by ten larger squares at 17 mm',
    ],
    spacing: 17,
    layout: {
      gridStyle: 'square_grid',
      columns: 3,
      rows: 10,
      cellSizeMm: 17,
    },
  },
  {
    id: 'cp_grid_4x14_17',
    name: ['方格 4×14', 'Square grid 4×14 (17 mm)'],
    description: [
      '方格 4×14，格径 17 mm',
      'Four by fourteen larger squares with a signature row',
    ],
    spacing: 17,
    layout: {
      gridStyle: 'square_grid',
      columns: 4,
      rows: 14,
      cellSizeMm: 17,
      signatureRows: 2,
    },
  },
  {
    id: 'cp_grid_4x14_17_no_sig',
    name: ['方格 4×14（无落款）', 'Square grid 4×14 (17 mm), no signature'],
    description: [
      '方格 4×14（无落款），格径 17 mm',
      'Four by fourteen larger squares without a signature row',
    ],
    spacing: 17,
    layout: {
      gridStyle: 'square_grid',
      columns: 4,
      rows: 14,
      cellSizeMm: 17,
      signatureRows: 0,
    },
  },
  {
    id: 'cp_word_6x11',
    name: ['词语练习 6×11', 'Word practice 6×11'],
    description: [
      '窄长小格，适合词语抄写',
      'Narrow cells for practising words',
    ],
    spacing: 2.2,
    layout: {
      gridStyle: 'square_grid',
      columns: 6,
      rows: 11,
      cellWidthMm: 1.4,
      cellHeightMm: 2.2,
    },
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
  },
  {
    id: 'cp_poem_qiyan_17',
    name: ['七言诗', 'Seven-character poem'],
    description: [
      '七言诗，格径 17 mm',
      'Four seven-character lines, vertical, with title and signature',
    ],
    spacing: 17,
    layout: {
      gridStyle: 'poem_grid',
      poemType: 'qiyan',
      poemLines: 4,
      poemDirection: 'vertical',
      titleRows: 1,
      signatureRows: 2,
      signatureMode: 'grid',
      titleGapMm: 4,
      signatureGapMm: 4,
    },
  },
  {
    id: 'cp_poem_qiyan_17_v2',
    name: ['七言诗', 'Seven-character poem (2 title rows)'],
    description: [
      '四句七言，竖排，两行标题与落款',
      'Vertical seven-character poem with two title rows',
    ],
    spacing: 17,
    layout: {
      gridStyle: 'poem_grid',
      poemType: 'qiyan',
      poemLines: 4,
      poemDirection: 'vertical',
      titleRows: 2,
      signatureRows: 2,
      signatureMode: 'grid',
      titleGapMm: 6,
      signatureGapMm: 4,
    },
  },
  {
    id: 'cp_poem_wuyan_17',
    name: ['五言诗', 'Five-character poem'],
    description: [
      '四句五言，竖排，带标题与落款',
      'Four five-character lines, vertical, with title and signature',
    ],
    spacing: 17,
    layout: {
      gridStyle: 'poem_grid',
      poemType: 'wuyan',
      poemLines: 4,
      poemDirection: 'vertical',
      titleRows: 1,
      signatureRows: 2,
      signatureMode: 'grid',
      titleGapMm: 4,
      signatureGapMm: 4,
    },
  },
  {
    id: 'cp_poem_wuyan_17_h',
    name: ['五言诗（横排）', 'Five-character poem (horizontal)'],
    description: [
      '四句五言，横排，带标题与落款',
      'Five-character poem arranged horizontally',
    ],
    spacing: 17,
    layout: {
      gridStyle: 'poem_grid',
      poemType: 'wuyan',
      poemLines: 4,
      poemDirection: 'horizontal',
      titleRows: 1,
      signatureRows: 2,
      signatureMode: 'grid',
      titleGapMm: 4,
      signatureGapMm: 4,
    },
  },
  {
    id: 'cp_poem_qiyan_17_h',
    name: ['七言诗（横排）', 'Seven-character poem (horizontal)'],
    description: [
      '四句七言，横排，带标题与落款',
      'Seven-character poem arranged horizontally',
    ],
    spacing: 17,
    layout: {
      gridStyle: 'poem_grid',
      poemType: 'qiyan',
      poemLines: 4,
      poemDirection: 'horizontal',
      titleRows: 1,
      signatureRows: 2,
      signatureMode: 'grid',
      titleGapMm: 4,
      signatureGapMm: 4,
    },
  },
  {
    id: 'cp_grid_3x10_17_x2',
    name: ['方格 3×10 双栏', 'Square grid 3×10, two blocks'],
    description: [
      '双栏方格，每栏 3×10，无落款',
      'Two blocks of three by ten squares',
    ],
    spacing: 17,
    layout: {
      gridStyle: 'square_grid',
      columns: 3,
      rows: 10,
      cellSizeMm: 17,
      blockCount: 2,
      blockGapMm: 10,
      signatureRows: 0,
    },
  },
  {
    id: 'cp_grid_4x14_17_x2',
    name: ['方格 4×14 双栏（无落款）', 'Square grid 4×14, two blocks'],
    description: [
      '双栏方格，每栏 4×14，无落款',
      'Two blocks of four by fourteen squares, no signature',
    ],
    spacing: 17,
    layout: {
      gridStyle: 'square_grid',
      columns: 4,
      rows: 14,
      cellSizeMm: 17,
      blockCount: 2,
      blockGapMm: 8,
      signatureRows: 0,
    },
  },
  {
    id: 'cp_grid_4x14_15_x2',
    name: ['方格 4×14 双栏', 'Square grid 4×14, two blocks'],
    description: [
      '双栏方格，每栏 4×14，带落款行',
      'Two blocks of four by fourteen squares with signature rows',
    ],
    spacing: 15,
    layout: {
      gridStyle: 'square_grid',
      columns: 4,
      rows: 14,
      cellSizeMm: 15,
      blockCount: 2,
      blockGapMm: 10,
      signatureRows: 2,
      signatureGapMm: 3,
    },
  },
  {
    id: 'cp_doufang_wuyan_15',
    name: ['斗方（五言绝句）', 'Square composition, five-character quatrain'],
    description: [
      '五言绝句斗方，带作品外框',
      'Five-character quatrain in a framed square composition',
    ],
    spacing: 15,
    layout: {
      gridStyle: 'doufang',
      poemType: 'wuyan',
      poemLines: 4,
      poemDirection: 'vertical',
      compositionFrame: true,
      compositionInsetMm: 8,
      titleRows: 1,
      signatureRows: 2,
      signatureMode: 'grid',
      titleGapMm: 4,
      signatureGapMm: 4,
    },
    margins: {
      top: 18,
      right: 18,
      bottom: 18,
      left: 18,
    },
  },
  {
    id: 'cp_doufang_qiyan_long_15',
    name: ['斗方（七言长诗）', 'Square composition, long seven-character poem'],
    description: [
      '七言长诗斗方，带作品外框',
      'Eight seven-character lines in a framed square composition',
    ],
    spacing: 15,
    layout: {
      gridStyle: 'doufang',
      poemType: 'qiyan',
      poemLines: 8,
      poemDirection: 'vertical',
      compositionFrame: true,
      compositionInsetMm: 10,
      titleRows: 2,
      signatureRows: 2,
      signatureMode: 'grid',
      titleGapMm: 4,
      signatureGapMm: 4,
    },
    margins: {
      top: 18,
      right: 18,
      bottom: 18,
      left: 18,
    },
  },
  {
    id: 'cp_zhongtang_18',
    name: ['中堂', 'Hanging scroll'],
    description: [
      '七言中堂，带标题与落款',
      'Seven-character poem in a hanging-scroll layout',
    ],
    spacing: 18,
    layout: {
      gridStyle: 'zhongtang',
      poemType: 'qiyan',
      poemLines: 4,
      poemDirection: 'vertical',
      compositionFrame: true,
      compositionSections: 1,
      sectionGapMm: 10,
      titleRows: 1,
      signatureRows: 2,
      signatureMode: 'grid',
      titleGapMm: 5,
      signatureGapMm: 6,
    },
    margins: {
      top: 22,
      right: 28,
      bottom: 22,
      left: 28,
    },
  },
  {
    id: 'cp_zhongtang_18_v2',
    name: ['中堂', 'Hanging scroll (2 title rows)'],
    description: ['七言中堂，两行标题', 'Hanging scroll with two title rows'],
    spacing: 18,
    layout: {
      gridStyle: 'zhongtang',
      poemType: 'qiyan',
      poemLines: 4,
      poemDirection: 'vertical',
      compositionFrame: true,
      compositionSections: 1,
      sectionGapMm: 10,
      titleRows: 2,
      signatureRows: 2,
      signatureMode: 'grid',
      titleGapMm: 6,
      signatureGapMm: 6,
    },
    margins: {
      top: 22,
      right: 28,
      bottom: 22,
      left: 28,
    },
  },
  {
    id: 'cp_zhongtang_dual_18',
    name: ['中堂（双篇）', 'Hanging scroll, two sections'],
    description: [
      '双篇七言中堂',
      'Two seven-character poems stacked in one scroll',
    ],
    spacing: 18,
    layout: {
      gridStyle: 'zhongtang',
      poemType: 'qiyan',
      poemLines: 4,
      poemDirection: 'vertical',
      compositionFrame: true,
      compositionSections: 2,
      sectionGapMm: 12,
      titleRows: 1,
      signatureRows: 2,
      signatureMode: 'grid',
      titleGapMm: 5,
      signatureGapMm: 6,
    },
    margins: {
      top: 22,
      right: 28,
      bottom: 22,
      left: 28,
    },
  },
  {
    id: 'cp_tuanshan_16',
    name: ['团扇', 'Round fan'],
    description: [
      '五行弧形行格，扇面 140 度',
      'Five curved writing rows on a 140-degree fan',
    ],
    spacing: 16,
    layout: {
      gridStyle: 'tuanshan',
      fanRows: 5,
      fanAngleDeg: 140,
      compositionFrame: false,
    },
    margins: {
      top: 20,
      right: 20,
      bottom: 35,
      left: 20,
    },
  },
  {
    id: 'cp_tuanshan_16_dense',
    name: ['团扇（密行）', 'Round fan, dense rows'],
    description: [
      '七行弧形行格，扇面 150 度',
      'Seven curved writing rows on a 150-degree fan',
    ],
    spacing: 16,
    layout: {
      gridStyle: 'tuanshan',
      fanRows: 7,
      fanAngleDeg: 150,
      compositionFrame: false,
    },
    margins: {
      top: 20,
      right: 20,
      bottom: 35,
      left: 20,
    },
  },
]

/* ------------------------------------------------------------------ */
/* Labels                                                             */
/* ------------------------------------------------------------------ */

const GRID_STYLE_LABELS: Record<CalligraphyGridStyle, [string, string]> = {
  horizontal_lines: ['横线格 / 行笺', 'Ruled lines'],
  vertical_lines: ['竖线格', 'Vertical rules'],
  square_grid: ['方格', 'Square grid'],
  tianzi_grid: ['田字格', 'Cross guides'],
  poem_grid: ['诗稿格', 'Poem grid'],
  doufang: ['斗方', 'Square composition'],
  zhongtang: ['中堂', 'Hanging scroll'],
  tuanshan: ['团扇', 'Round fan'],
}

const FIELD_LABELS: Record<string, [string, string]> = {
  presetId: ['预设样板', 'Preset'],
  gridStyle: ['格型', 'Layout'],
  lineWeight: ['行线粗细', 'Line weight'],
  poemType: ['诗体', 'Verse length'],
  poemLines: ['句数', 'Lines'],
  poemDirection: ['排列方向', 'Direction'],
  columns: ['列数', 'Columns'],
  rows: ['行数', 'Rows'],
  showCenterAxis: ['显示中轴线', 'Centre axis'],
  compositionSections: ['诗文段数', 'Sections'],
  fanRows: ['弧行数', 'Fan rows'],
  fanAngleDeg: ['扇面角度', 'Fan angle'],
  compositionFrame: ['显示作品外框', 'Composition frame'],
  titleRows: ['标题行', 'Title rows'],
  signatureRows: ['落款行', 'Signature rows'],
  blockCount: ['栏数', 'Blocks'],
  signatureMode: ['落款样式', 'Signature style'],
  cellSizeMm: ['格径备注', 'Cell size note'],
  cellWidthMm: ['格宽', 'Cell width'],
  cellHeightMm: ['格高', 'Cell height'],
  blockGapMm: ['栏间距', 'Block gap'],
  titleColumns: ['标题列数', 'Title columns'],
  titleGapMm: ['标题间距', 'Title gap'],
  signatureGapMm: ['落款间距', 'Signature gap'],
  compositionInsetMm: ['外框内缩', 'Frame inset'],
  sectionGapMm: ['段间距', 'Section gap'],
  guideOpacity: ['辅助线透明度', 'Guide opacity'],
}

const OPTION_LABELS: Record<string, [string, string]> = {
  'weight.thin': ['细线', 'Thin'],
  'weight.normal': ['标准', 'Normal'],
  'weight.bold': ['粗线', 'Bold'],
  'poem.qiyan': ['七言', 'Seven characters'],
  'poem.wuyan': ['五言', 'Five characters'],
  'direction.vertical': ['竖排', 'Vertical'],
  'direction.horizontal': ['横排', 'Horizontal'],
  'signature.grid': ['格线落款', 'Ruled signature'],
  'signature.blank': ['空白落款框', 'Blank signature box'],
}

/** Builds both message dictionaries from the shared label tables and the W rows. */
function buildMessages(): {
  'zh-CN': Record<string, string>
  en: Record<string, string>
} {
  const zh: Record<string, string> = {
    name: '书法练字格',
    'spacing.label': '格径 / 线距',
    'spacing.hint':
      '决定格子边长或横竖线之间的距离，是这类练字纸最核心的参数。日常练字常用 15–17 mm；写行笺可用 16–17 mm，词语练习约 2 mm。',
    'text.practice': '静心练字',
  }
  const en: Record<string, string> = {
    name: 'Calligraphy practice',
    'spacing.label': 'Cell / line pitch',
    'spacing.hint':
      'The cell size or line pitch — the key setting for these practice sheets. 15–17 mm suits everyday practice; 16–17 mm for short passages, about 2 mm for word drills.',
    'text.practice': 'Practise with a calm mind',
  }
  const put = (key: string, pair: [string, string]): void => {
    zh[key] = pair[0]
    en[key] = pair[1]
  }
  for (const [style, pair] of Object.entries(GRID_STYLE_LABELS)) {
    put(`style.${style}`, pair)
  }
  for (const [key, pair] of Object.entries(FIELD_LABELS)) {
    put(`field.${key}`, pair)
  }
  for (const [key, pair] of Object.entries(OPTION_LABELS)) {
    put(key, pair)
  }
  for (const row of W_ROWS) {
    put(`preset.${row.id}.name`, row.name)
    put(`preset.${row.id}.description`, row.description)
  }
  return { 'zh-CN': zh, en }
}

/* ------------------------------------------------------------------ */
/* Fields                                                             */
/* ------------------------------------------------------------------ */

type ShowIfFn = (options: Record<string, unknown>) => boolean

/** Shows a field only for the given layouts. */
function forStyles(...styles: CalligraphyGridStyle[]): ShowIfFn {
  return (options) =>
    styles.includes(
      getOption<string>(
        options,
        'layout.gridStyle',
        '',
      ) as CalligraphyGridStyle,
    )
}

const POEM_STYLES: CalligraphyGridStyle[] = [
  'poem_grid',
  'doufang',
  'zhongtang',
]
const GRID_STYLES: CalligraphyGridStyle[] = ['square_grid', 'tianzi_grid']

function numberField(
  key: string,
  min: number,
  max: number,
  step: number,
  fallback: number,
  showIf?: ShowIfFn,
): NumberField {
  return {
    kind: 'number',
    key: `layout.${key}`,
    label: `field.${key}`,
    min,
    max,
    step,
    default: fallback,
    ...(showIf ? { showIf } : {}),
  }
}

function selectField(
  key: string,
  choices: readonly { value: string; label: string }[],
  fallback: string,
  showIf?: ShowIfFn,
): SelectField {
  return {
    kind: 'select',
    key: `layout.${key}`,
    label: `field.${key}`,
    choices,
    default: fallback,
    ...(showIf ? { showIf } : {}),
  }
}

function toggleField(
  key: string,
  fallback: boolean,
  showIf?: ShowIfFn,
): ToggleField {
  return {
    kind: 'toggle',
    key: `layout.${key}`,
    label: `field.${key}`,
    default: fallback,
    ...(showIf ? { showIf } : {}),
  }
}

const PRESET_CHOICES = W_ROWS.map((row) => ({
  value: row.id,
  label: `preset.${row.id}.name`,
}))

const GRID_STYLE_CHOICES = CALLIGRAPHY_GRID_STYLES.map((style) => ({
  value: style,
  label: `style.${style}`,
}))

const FIELDS: readonly OptionField[] = [
  selectField('presetId', PRESET_CHOICES, 'cp_hline_15'),
  selectField('gridStyle', GRID_STYLE_CHOICES, 'horizontal_lines'),
  selectField(
    'lineWeight',
    [
      { value: 'thin', label: 'weight.thin' },
      { value: 'normal', label: 'weight.normal' },
      { value: 'bold', label: 'weight.bold' },
    ],
    'normal',
  ),
  selectField(
    'poemType',
    [
      { value: 'qiyan', label: 'poem.qiyan' },
      { value: 'wuyan', label: 'poem.wuyan' },
    ],
    'qiyan',
    forStyles(...POEM_STYLES),
  ),
  numberField('poemLines', 1, 8, 1, 4, forStyles(...POEM_STYLES)),
  selectField(
    'poemDirection',
    [
      { value: 'vertical', label: 'direction.vertical' },
      { value: 'horizontal', label: 'direction.horizontal' },
    ],
    'vertical',
    forStyles(...POEM_STYLES),
  ),
  numberField('columns', 1, 30, 1, 4, forStyles(...GRID_STYLES)),
  numberField(
    'rows',
    1,
    30,
    1,
    7,
    forStyles('horizontal_lines', ...GRID_STYLES),
  ),
  toggleField(
    'showCenterAxis',
    false,
    forStyles('horizontal_lines', 'vertical_lines'),
  ),
  numberField('compositionSections', 1, 3, 1, 1, forStyles('zhongtang')),
  numberField('fanRows', 2, 12, 1, 5, forStyles('tuanshan')),
  numberField('fanAngleDeg', 90, 170, 1, 140, forStyles('tuanshan')),
  toggleField('compositionFrame', true, forStyles('doufang', 'zhongtang')),
  numberField(
    'titleRows',
    0,
    4,
    1,
    0,
    forStyles(...GRID_STYLES, ...POEM_STYLES),
  ),
  numberField(
    'signatureRows',
    0,
    6,
    1,
    0,
    forStyles(...GRID_STYLES, ...POEM_STYLES),
  ),
  numberField(
    'blockCount',
    1,
    4,
    1,
    1,
    forStyles(...GRID_STYLES, ...POEM_STYLES),
  ),
  selectField(
    'signatureMode',
    [
      { value: 'grid', label: 'signature.grid' },
      { value: 'blank', label: 'signature.blank' },
    ],
    'grid',
    forStyles(...GRID_STYLES, ...POEM_STYLES),
  ),
  numberField('cellSizeMm', 1, 25, 0.5, 15),
  numberField('cellWidthMm', 0, 25, 0.1, 0),
  numberField('cellHeightMm', 0, 25, 0.1, 0),
  numberField('blockGapMm', 0, 60, 1, 10),
  numberField('titleColumns', 0, 40, 1, 0),
  numberField('titleGapMm', 0, 40, 1, 4),
  numberField('signatureGapMm', 0, 40, 1, 4),
  numberField('compositionInsetMm', 0, 60, 1, 8),
  numberField('sectionGapMm', 0, 60, 1, 10),
  numberField('guideOpacity', 0, 1, 0.05, 0.5),
]

const DEFAULT_OPTIONS: Options = {
  layout: {
    ...DEFAULT_CALLIGRAPHY_LAYOUT,
    gridStyle: 'horizontal_lines',
    presetId: 'cp_hline_15',
  },
}

/** Turns each W row into a preset whose patch carries the full layout object. */
function buildPresets(): Preset[] {
  return W_ROWS.map((row) => ({
    id: row.id,
    name: `preset.${row.id}.name`,
    description: `preset.${row.id}.description`,
    patch: {
      line: { spacing: row.spacing },
      ...(row.margins ? { margins: row.margins } : {}),
      options: { layout: { ...row.layout, presetId: row.id } },
    },
  }))
}

export default definePaper<Options>({
  type: 'calligraphy_practice',
  group: 'calligraphy',
  messages: buildMessages(),
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 1,
    max: 25,
    step: 0.5,
    default: 15,
  },
  fields: FIELDS,
  defaultOptions: DEFAULT_OPTIONS,
  presets: buildPresets(),
  suggestsCalligraphyFrame: true,
  render: (ctx) => {
    const layout = resolveLayout(
      ctx.options.layout as Partial<CalligraphyLayout>,
    )
    const items: SceneItem[] = [...drawCalligraphyLayout(ctx, layout)]
    items.push(
      text(
        ctx.area.x + 1,
        ctx.area.y + ctx.area.h - 1,
        ctx.t('text.practice'),
        ctx.fonts.cjk(2.8),
        ctx.ink.main().color,
      ),
    )
    return items
  },
})
