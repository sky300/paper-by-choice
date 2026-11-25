/**
 * Combined staff and TAB paper.
 *
 * Each system stacks a row of blank chord grids, a five-line staff and a
 * six-line TAB group; the systems are vertically centred in the writing area.
 * The spacing parameter is the gap between lines of the staff; the TAB string
 * gap follows it, while chord grids and the blank bands are fixed or set by
 * their own options. Clef and TAB labels are drawn only when asked for.
 */
import { definePaper } from './define'
import { chordCell, clefMark, staffGroup, tabGroup } from './shared/musicStaff'
import { centeredStart } from '../scene/geometry'
import type { Box, SceneItem, Stroke } from '../scene/types'

interface GuitarStaffTabOptions {
  guitarTab: {
    chordOrientation: 'vertical' | 'horizontal'
    showChords: boolean
    showClefMarks: boolean
    chordCount: number
    staffTabGapMm: number
    systemGapMm: number
  }
}

const CHORD_UNIT = 3.5
const CLEF_RESERVE = 12
const CHORD_BAND = 5

/** The geometry of one system, in millimetres. */
interface SystemShape {
  chordHeight: number
  staffHeight: number
  staffTabGap: number
  tabGap: number
  tabHeight: number
}

/** All parts of one system, from its top edge. */
function system(
  area: Box,
  top: number,
  shape: SystemShape,
  gap: number,
  options: GuitarStaffTabOptions['guitarTab'],
  t: (key: string) => string,
  ink: { main: Stroke; bar: Stroke; nut: Stroke; thin: Stroke },
  fonts: { serif: string; mono: string },
): SceneItem[] {
  const items: SceneItem[] = []
  const x0 = area.x + (options.showClefMarks ? CLEF_RESERVE : 0)
  const width = area.x + area.w - x0
  let y = top

  if (options.showChords) {
    const slot = area.w / options.chordCount
    const chordWidth = 5 * CHORD_UNIT
    for (let j = 0; j < options.chordCount; j++) {
      const left = area.x + j * slot + (slot - chordWidth) / 2
      items.push(
        ...chordCell(
          left,
          y,
          CHORD_UNIT,
          options.chordOrientation,
          ink.main,
          ink.nut,
          ink.thin,
        ),
      )
    }
    y += shape.chordHeight + CHORD_BAND
  }

  const staffTop = y
  items.push(...staffGroup(x0, staffTop, width, gap, ink.main))
  items.push(
    ...([barLineAt(x0, staffTop, shape.staffHeight, ink.bar)].filter(
      Boolean,
    ) as SceneItem[]),
  )
  if (options.showClefMarks) {
    items.push(
      clefMark(
        area.x + 1,
        staffTop + shape.staffHeight * 0.82,
        shape.staffHeight * 1.35,
        t('text.clef'),
        ink.main.color,
        fonts.serif,
      ),
    )
  }
  y += shape.staffHeight + shape.staffTabGap

  const tabTop = y
  items.push(...tabGroup(x0, tabTop, width, shape.tabGap, ink.main, ink.bar))
  if (options.showClefMarks) {
    const labelY = tabTop + shape.tabHeight / 2
    for (let i = 0; i < 3; i++) {
      items.push(
        clefMark(
          area.x + 3,
          labelY - 3.5 + i * 3.6,
          Math.max(2.6, shape.tabGap * 0.85),
          t(`text.tab.${i}`),
          ink.main.color,
          fonts.mono,
        ),
      )
    }
  }
  return items
}

/** A left bar line; kept as a separate helper so the system reads top-down. */
function barLineAt(x: number, y: number, height: number, stroke: Stroke) {
  return { op: 'line' as const, x1: x, y1: y, x2: x, y2: y + height, stroke }
}

export default definePaper<GuitarStaffTabOptions>({
  type: 'guitar_staff_tab',
  group: 'basic',
  messages: {
    'zh-CN': {
      name: '五线谱+TAB 综合谱',
      'spacing.label': '谱线间距',
      'spacing.hint':
        '五线谱内部相邻线的距离，TAB 六线谱的弦距会同步跟着变。常用 2–3 mm；谱面想排更多组就调小，看得更清楚就调大。',
      'field.guitarTab.chordOrientation': '和弦图方向',
      'field.guitarTab.chordOrientation.vertical': '标准竖向',
      'field.guitarTab.chordOrientation.horizontal': '原横向',
      'field.guitarTab.showChords': '显示和弦图',
      'field.guitarTab.showClefMarks': '显示谱号与 TAB 标记',
      'field.guitarTab.chordCount': '和弦图数量',
      'field.guitarTab.staffTabGapMm': '五线谱与 TAB 间距',
      'field.guitarTab.systemGapMm': '系统组间距',
      'text.clef': '𝄞',
      'text.tab.0': 'T',
      'text.tab.1': 'A',
      'text.tab.2': 'B',
      'preset.guitar-staff-tab.name': '标准综合谱',
      'preset.guitar-staff-tab.description': '和弦图、五线谱与 TAB 逐组排布',
    },
    en: {
      name: 'Staff and TAB',
      'spacing.label': 'Staff line gap',
      'spacing.hint':
        'Gap between the five staff lines; the TAB string spacing follows it. 2–3 mm is typical; decrease it to fit more systems per page, increase it for legibility.',
      'field.guitarTab.chordOrientation': 'Chord diagram',
      'field.guitarTab.chordOrientation.vertical': 'Vertical',
      'field.guitarTab.chordOrientation.horizontal': 'Horizontal',
      'field.guitarTab.showChords': 'Show chord grids',
      'field.guitarTab.showClefMarks': 'Show clef and TAB marks',
      'field.guitarTab.chordCount': 'Chord grids per row',
      'field.guitarTab.staffTabGapMm': 'Staff to TAB gap',
      'field.guitarTab.systemGapMm': 'Gap between systems',
      'text.clef': '𝄞',
      'text.tab.0': 'T',
      'text.tab.1': 'A',
      'text.tab.2': 'B',
      'preset.guitar-staff-tab.name': 'Standard staff and TAB',
      'preset.guitar-staff-tab.description':
        'Chord grids, a staff and a TAB group per system',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 1.5,
    max: 5,
    step: 0.5,
    default: 2.5,
  },
  fields: [
    {
      kind: 'select',
      key: 'guitarTab.chordOrientation',
      label: 'field.guitarTab.chordOrientation',
      choices: [
        {
          value: 'vertical',
          label: 'field.guitarTab.chordOrientation.vertical',
        },
        {
          value: 'horizontal',
          label: 'field.guitarTab.chordOrientation.horizontal',
        },
      ],
      default: 'vertical',
    },
    {
      kind: 'toggle',
      key: 'guitarTab.showChords',
      label: 'field.guitarTab.showChords',
      default: true,
    },
    {
      kind: 'toggle',
      key: 'guitarTab.showClefMarks',
      label: 'field.guitarTab.showClefMarks',
      default: true,
    },
    {
      kind: 'number',
      key: 'guitarTab.chordCount',
      label: 'field.guitarTab.chordCount',
      min: 1,
      max: 6,
      step: 1,
      default: 4,
    },
    {
      kind: 'number',
      key: 'guitarTab.staffTabGapMm',
      label: 'field.guitarTab.staffTabGapMm',
      min: 3,
      max: 20,
      step: 1,
      unit: 'mm',
      default: 6,
    },
    {
      kind: 'number',
      key: 'guitarTab.systemGapMm',
      label: 'field.guitarTab.systemGapMm',
      min: 6,
      max: 40,
      step: 1,
      unit: 'mm',
      default: 14,
    },
  ],
  defaultOptions: {
    guitarTab: {
      chordOrientation: 'vertical',
      showChords: true,
      showClefMarks: true,
      chordCount: 4,
      staffTabGapMm: 6,
      systemGapMm: 14,
    },
  },
  presets: [
    {
      id: 'guitar-staff-tab',
      name: 'preset.guitar-staff-tab.name',
      description: 'preset.guitar-staff-tab.description',
      patch: {},
    },
  ],
  render: (ctx) => {
    const { area, spacing, ink, options } = ctx
    const o = options.guitarTab
    const tabGap = spacing * 0.95
    const shape: SystemShape = {
      chordHeight:
        o.chordOrientation === 'vertical' ? 4 * CHORD_UNIT : 3 * CHORD_UNIT,
      staffHeight: 4 * spacing,
      tabHeight: 5 * tabGap,
      staffTabGap: o.staffTabGapMm,
      tabGap,
    }
    const body =
      (o.showChords ? shape.chordHeight + CHORD_BAND : 0) +
      shape.staffHeight +
      shape.staffTabGap +
      shape.tabHeight
    const height = body + o.systemGapMm
    const count = Math.max(1, Math.floor((area.h + o.systemGapMm) / height))
    const top =
      area.y +
      Math.max(0, centeredStart(area.h, height, count) + o.systemGapMm / 2)
    const main = ink.main()
    const strokes = {
      main,
      bar: ink.main({ width: main.width * 1.2 }),
      nut: ink.main({ width: main.width * 2.2 }),
      thin: ink.main({ width: main.width * 0.6 }),
    }
    const fonts = {
      serif: ctx.fonts.serif(3).family,
      mono: ctx.fonts.mono(3).family,
    }
    const items: SceneItem[] = []
    for (let group = 0; group < count; group++) {
      items.push(
        ...system(
          area,
          top + group * height,
          shape,
          spacing,
          o,
          ctx.t,
          strokes,
          fonts,
        ),
      )
    }
    return items
  },
})
