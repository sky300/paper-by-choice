/**
 * Per-paper default looks.
 *
 * These are the reference tool's "switch to this paper" presets: the complete
 * set of settings each paper starts with. They are the most-used look for each
 * paper and must be applied as a whole, not field by field. Colours and line
 * widths are the reference values; line widths are converted from CSS px to mm
 * (1 px = 25.4 / 96 mm) so printed geometry stays exact.
 */
import type { LineStyle, Margins, PaperType, ThemeKey } from './types'

export interface PaperLook {
  /** Default spacing on switching to this paper (mm). May differ from the "recommended" value. */
  spacing: number
  lineColor: string
  /** Line width in CSS px at 96 dpi; converted to mm when applied. */
  lineWidthPx: number
  lineStyle: LineStyle
  margins: Margins
  theme: ThemeKey
  background: { color: string; patternColor: string; patternOpacity: number }
}

const PX_TO_MM = 25.4 / 96

/** CSS px → mm, rounded to two decimals. */
export function pxToMm(px: number): number {
  return Math.round(px * PX_TO_MM * 100) / 100
}

/** The 41 paper looks in registry order. */
export const PAPER_LOOKS: Record<PaperType, PaperLook> = {
  lined: {
    spacing: 8,
    lineColor: '#808080',
    lineWidthPx: 0.5,
    lineStyle: 'solid',
    margins: { top: 25, right: 20, bottom: 25, left: 20 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  vertical_lined: {
    spacing: 8,
    lineColor: '#6b7280',
    lineWidthPx: 0.5,
    lineStyle: 'solid',
    margins: { top: 25, right: 25, bottom: 25, left: 25 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  grid: {
    spacing: 5,
    lineColor: '#a0a0a0',
    lineWidthPx: 0.3,
    lineStyle: 'solid',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  dot: {
    spacing: 5,
    lineColor: '#a0a0a0',
    lineWidthPx: 0.3,
    lineStyle: 'solid',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  blank: {
    spacing: 8,
    lineColor: '#808080',
    lineWidthPx: 0.5,
    lineStyle: 'solid',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  music: {
    spacing: 3,
    lineColor: '#505050',
    lineWidthPx: 0.5,
    lineStyle: 'solid',
    margins: { top: 25, right: 20, bottom: 25, left: 20 },
    theme: 'classic',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  guitar_tab: {
    spacing: 25,
    lineColor: '#333333',
    lineWidthPx: 0.6,
    lineStyle: 'solid',
    margins: { top: 15, right: 15, bottom: 15, left: 15 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  guitar_staff_tab: {
    spacing: 2.5,
    lineColor: '#333333',
    lineWidthPx: 0.55,
    lineStyle: 'solid',
    margins: { top: 12, right: 14, bottom: 12, left: 14 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  calligraphy: {
    spacing: 10,
    lineColor: '#c0c0c0',
    lineWidthPx: 0.4,
    lineStyle: 'dashed',
    margins: { top: 10, right: 9, bottom: 9, left: 9 },
    theme: 'vintage',
    background: {
      color: '#fff8e1',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  cornell: {
    spacing: 7,
    lineColor: '#808080',
    lineWidthPx: 0.5,
    lineStyle: 'solid',
    margins: { top: 25, right: 20, bottom: 25, left: 20 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  isometric: {
    spacing: 10,
    lineColor: '#a0a0a0',
    lineWidthPx: 0.3,
    lineStyle: 'solid',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  hexagonal: {
    spacing: 15,
    lineColor: '#a0a0a0',
    lineWidthPx: 0.3,
    lineStyle: 'solid',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  seyes: {
    spacing: 2,
    lineColor: '#9c9c9c',
    lineWidthPx: 0.3,
    lineStyle: 'solid',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    theme: 'classic',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  storyboard: {
    spacing: 8,
    lineColor: '#808080',
    lineWidthPx: 0.5,
    lineStyle: 'solid',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  pinyin_paper: {
    spacing: 20,
    lineColor: '#ff6b6b',
    lineWidthPx: 0.5,
    lineStyle: 'solid',
    margins: { top: 25, right: 25, bottom: 25, left: 25 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  pinyin_tianzi: {
    spacing: 20,
    lineColor: '#ff6b6b',
    lineWidthPx: 0.5,
    lineStyle: 'solid',
    margins: { top: 15, right: 15, bottom: 15, left: 15 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  composition_paper: {
    spacing: 8,
    lineColor: '#ff6b6b',
    lineWidthPx: 0.5,
    lineStyle: 'solid',
    margins: { top: 25, right: 25, bottom: 25, left: 25 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  arithmetic_paper: {
    spacing: 5,
    lineColor: '#ff6b6b',
    lineWidthPx: 0.5,
    lineStyle: 'solid',
    margins: { top: 25, right: 25, bottom: 25, left: 25 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  english_paper: {
    spacing: 5,
    lineColor: '#ff6b6b',
    lineWidthPx: 0.5,
    lineStyle: 'solid',
    margins: { top: 25, right: 25, bottom: 25, left: 25 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  practice_paper: {
    spacing: 8,
    lineColor: '#6b7280',
    lineWidthPx: 0.5,
    lineStyle: 'dashed',
    margins: { top: 25, right: 25, bottom: 25, left: 25 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  calligraphy_practice: {
    spacing: 15,
    lineColor: '#000000',
    lineWidthPx: 0.5,
    lineStyle: 'solid',
    margins: { top: 15, right: 15, bottom: 15, left: 15 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0,
    },
  },
  mizige: {
    spacing: 20,
    lineColor: '#8B4513',
    lineWidthPx: 0.6,
    lineStyle: 'solid',
    margins: { top: 9, right: 9, bottom: 9, left: 9 },
    theme: 'vintage',
    background: {
      color: '#FFF8E6',
      patternColor: '#E7BC91',
      patternOpacity: 0.1,
    },
  },
  huigongge: {
    spacing: 25,
    lineColor: '#8B4513',
    lineWidthPx: 0.6,
    lineStyle: 'solid',
    margins: { top: 9, right: 9, bottom: 9, left: 9 },
    theme: 'vintage',
    background: {
      color: '#FFF8E6',
      patternColor: '#E7BC91',
      patternOpacity: 0.1,
    },
  },
  jiugongge: {
    spacing: 10,
    lineColor: '#8B4513',
    lineWidthPx: 0.6,
    lineStyle: 'solid',
    margins: { top: 9, right: 9, bottom: 9, left: 9 },
    theme: 'vintage',
    background: {
      color: '#FFF8E6',
      patternColor: '#E7BC91',
      patternOpacity: 0.1,
    },
  },
  chinesetianzi: {
    spacing: 20,
    lineColor: '#8B4513',
    lineWidthPx: 0.6,
    lineStyle: 'solid',
    margins: { top: 9, right: 9, bottom: 9, left: 9 },
    theme: 'vintage',
    background: {
      color: '#FFF8E6',
      patternColor: '#E7BC91',
      patternOpacity: 0.1,
    },
  },
  huimige: {
    spacing: 20,
    lineColor: '#ff0000',
    lineWidthPx: 0.5,
    lineStyle: 'dashed',
    margins: { top: 9, right: 9, bottom: 9, left: 9 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.1,
    },
  },
  hardpen_calligraphy_paper: {
    spacing: 20,
    lineColor: '#2e7d32',
    lineWidthPx: 0.5,
    lineStyle: 'dashed',
    margins: { top: 9, right: 9, bottom: 9, left: 9 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.1,
    },
  },
  crossgrid: {
    spacing: 10,
    lineColor: '#808080',
    lineWidthPx: 0.4,
    lineStyle: 'solid',
    margins: { top: 9, right: 9, bottom: 9, left: 9 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.1,
    },
  },
  hardpen_huigongge: {
    spacing: 25,
    lineColor: '#ff0000',
    lineWidthPx: 0.4,
    lineStyle: 'solid',
    margins: { top: 9, right: 9, bottom: 9, left: 9 },
    theme: 'vintage',
    background: {
      color: '#FFF8E6',
      patternColor: '#E7BC91',
      patternOpacity: 0.1,
    },
  },
  vintage_note: {
    spacing: 8,
    lineColor: '#8B4513',
    lineWidthPx: 0.4,
    lineStyle: 'solid',
    margins: { top: 25, right: 20, bottom: 25, left: 20 },
    theme: 'vintage',
    background: {
      color: '#F8F3E6',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  children_drawing: {
    spacing: 10,
    lineColor: '#808080',
    lineWidthPx: 0.5,
    lineStyle: 'solid',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    theme: 'creative',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  minimal_journal: {
    spacing: 8,
    lineColor: '#909090',
    lineWidthPx: 0.4,
    lineStyle: 'solid',
    margins: { top: 30, right: 25, bottom: 30, left: 25 },
    theme: 'minimalist',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.1,
    },
  },
  student_note: {
    spacing: 8,
    lineColor: '#6b7280',
    lineWidthPx: 0.4,
    lineStyle: 'solid',
    margins: { top: 30, right: 20, bottom: 25, left: 40 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.1,
    },
  },
  meeting_note: {
    spacing: 8,
    lineColor: '#4b5563',
    lineWidthPx: 0.5,
    lineStyle: 'solid',
    margins: { top: 40, right: 20, bottom: 30, left: 20 },
    theme: 'elegant',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.1,
    },
  },
  project_planning: {
    spacing: 8,
    lineColor: '#7209B7',
    lineWidthPx: 0.5,
    lineStyle: 'solid',
    margins: { top: 25, right: 20, bottom: 25, left: 20 },
    theme: 'tech',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.1,
    },
  },
  sketch: {
    spacing: 10,
    lineColor: '#a0a0a0',
    lineWidthPx: 0.3,
    lineStyle: 'solid',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  creative_log: {
    spacing: 8,
    lineColor: '#6BCB77',
    lineWidthPx: 0.4,
    lineStyle: 'solid',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    theme: 'creative',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.1,
    },
  },
  branded: {
    spacing: 8,
    lineColor: '#4A6FA5',
    lineWidthPx: 0.5,
    lineStyle: 'solid',
    margins: { top: 25, right: 20, bottom: 25, left: 20 },
    theme: 'elegant',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.1,
    },
  },
  error_correction: {
    spacing: 5,
    lineColor: '#6b7280',
    lineWidthPx: 0.4,
    lineStyle: 'solid',
    margins: { top: 15, right: 15, bottom: 15, left: 15 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  chinese_preview_card: {
    spacing: 20,
    lineColor: '#6b7280',
    lineWidthPx: 0.5,
    lineStyle: 'solid',
    margins: { top: 15, right: 15, bottom: 15, left: 15 },
    theme: 'default',
    background: {
      color: '#ffffff',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
  chinese_english_word_practice: {
    spacing: 10,
    lineColor: '#6b7280',
    lineWidthPx: 0.5,
    lineStyle: 'solid',
    margins: { top: 15, right: 10, bottom: 15, left: 10 },
    theme: 'vintage',
    background: {
      color: '#FFF8E6',
      patternColor: '#e0e0e0',
      patternOpacity: 0.2,
    },
  },
}
