/**
 * Guitar tablature paper.
 *
 * Each system is a row of four blank chord grids above a framed six-line TAB
 * staff. Systems are vertically centred as a stack of TAB staves; the spacing
 * parameter is the height of one TAB staff, while the chord grid is a fixed
 * size. The chord diagram may be vertical (strings up, frets across) or the
 * original horizontal layout.
 */
import { definePaper } from './define'
import { chordCell } from './shared/musicStaff'
import { line, rect } from '../scene/builders'
import { layoutCells } from '../scene/geometry'
import type { Box, SceneItem, Stroke } from '../scene/types'

interface GuitarTabOptions {
  guitarTab: { chordOrientation: 'vertical' | 'horizontal' }
}

/** Millimetre stand-ins for the reference's fixed pixel constants. */
const CHORD_UNIT = 4
const CHORD_BAND = 39
const CHORD_GAP = 8

/** A blank chord grid of four diagrams centred in the four quarters of `area`. */
function chordRow(
  area: Box,
  top: number,
  orientation: 'vertical' | 'horizontal',
  ink: {
    main: Stroke
    nut: Stroke
    thin: Stroke
  },
): SceneItem[] {
  const width = 5 * CHORD_UNIT
  const items: SceneItem[] = []
  for (let j = 0; j < 4; j++) {
    const slot = area.w / 4
    const left = area.x + j * slot + (slot - width) / 2
    items.push(
      ...chordCell(
        left,
        top,
        CHORD_UNIT,
        orientation,
        ink.main,
        ink.nut,
        ink.thin,
      ),
    )
  }
  return items
}

/** One framed TAB staff: its bounding box, four inner strings and the chord row above it. */
function tabSystem(
  area: Box,
  top: number,
  height: number,
  orientation: 'vertical' | 'horizontal',
  stroke: Stroke,
  nut: Stroke,
  thin: Stroke,
): SceneItem[] {
  const items: SceneItem[] = [
    rect({ x: area.x, y: top, w: area.w, h: height }, stroke),
  ]
  for (let k = 1; k <= 4; k++) {
    items.push(
      line(
        area.x,
        top + (k * height) / 5,
        area.x + area.w,
        top + (k * height) / 5,
        stroke,
      ),
    )
  }
  const chordHeight =
    orientation === 'vertical' ? 4 * CHORD_UNIT : 3 * CHORD_UNIT
  const chordTop = top - CHORD_GAP - chordHeight
  if (chordTop >= area.y - 1e-6) {
    items.push(
      ...chordRow(area, chordTop, orientation, { main: stroke, nut, thin }),
    )
  }
  return items
}

export default definePaper<GuitarTabOptions>({
  type: 'guitar_tab',
  group: 'basic',
  messages: {
    'zh-CN': {
      name: '吉他六线谱',
      'spacing.label': 'TAB 谱表高度',
      'spacing.hint':
        '每组六线谱（含和弦图）的总高度。常用 22–28 mm：调大每组更舒展、每页组数变少；调小则每页能排更多组。',
      'field.guitarTab.chordOrientation': '和弦图方向',
      'field.guitarTab.chordOrientation.vertical': '标准竖向',
      'field.guitarTab.chordOrientation.horizontal': '原横向',
      'field.guitarTab.chordOrientation.hint':
        '竖线为弦、横线为品，顶部粗线表示弦枕',
      'preset.guitar-tab.name': '标准六线谱',
      'preset.guitar-tab.description': '四组和弦图加六线谱，适合吉他练习',
    },
    en: {
      name: 'Guitar tablature',
      'spacing.label': 'TAB staff height',
      'spacing.hint':
        'Total height of one tablature system including its chord diagram. 22–28 mm is typical; larger values give each system more room and fewer systems per page, smaller values fit more systems.',
      'field.guitarTab.chordOrientation': 'Chord diagram',
      'field.guitarTab.chordOrientation.vertical': 'Vertical',
      'field.guitarTab.chordOrientation.horizontal': 'Horizontal',
      'field.guitarTab.chordOrientation.hint':
        'Strings run vertically, frets across; the heavy top line is the nut',
      'preset.guitar-tab.name': 'Standard tablature',
      'preset.guitar-tab.description': 'Four chord grids above each TAB staff',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 20,
    max: 40,
    step: 1,
    default: 25,
  },
  fields: [
    {
      kind: 'select',
      key: 'guitarTab.chordOrientation',
      label: 'field.guitarTab.chordOrientation',
      hint: 'field.guitarTab.chordOrientation.hint',
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
  ],
  defaultOptions: { guitarTab: { chordOrientation: 'vertical' } },
  presets: [
    {
      id: 'guitar-tab',
      name: 'preset.guitar-tab.name',
      description: 'preset.guitar-tab.description',
      patch: {},
    },
  ],
  render: (ctx) => {
    const { area, spacing, ink } = ctx
    const { chordOrientation } = ctx.options.guitarTab
    const period = spacing + CHORD_BAND
    const layout = layoutCells(area.h, period, 'center')
    if (!layout) return []
    const firstTop = area.y + layout.start + CHORD_BAND / 2
    const main = ink.main()
    const nut = ink.main({ width: main.width * 2.2 })
    const thin = ink.main({ width: main.width * 0.75 })
    const items: SceneItem[] = []
    for (let group = 0; group < layout.count; group++) {
      items.push(
        ...tabSystem(
          area,
          firstTop + group * period,
          spacing,
          chordOrientation,
          main,
          nut,
          thin,
        ),
      )
    }
    return items
  },
})
