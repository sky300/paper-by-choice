/**
 * 定义纸张设置与页面数据类型。
 * Defines application settings and page data types.
 */
/**
 * Application data model. Pure types and lookup tables of allowed values; no
 * behaviour lives here.
 */
import type { Color } from './scene/types'

export type Locale = 'zh-CN' | 'en'

/**
 * Looks a message up and interpolates `{name}` placeholders.
 *
 * Inside a paper's `render()` the translator is *scoped to that paper*: keys
 * are resolved against the paper's own messages first, then against the shared
 * UI dictionary.
 */
export type Translator = (
  key: string,
  params?: Record<string, string | number>,
) => string

/* ------------------------------------------------------------------ */
/* Paper catalogue                                                     */
/* ------------------------------------------------------------------ */

export type PaperGroup =
  'basic' | 'worksheet' | 'english' | 'calligraphy' | 'creative'

export type PaperType =
  // basic
  | 'lined'
  | 'vertical_lined'
  | 'grid'
  | 'dot'
  | 'blank'
  | 'music'
  | 'guitar_tab'
  | 'guitar_staff_tab'
  | 'calligraphy'
  | 'cornell'
  | 'isometric'
  | 'hexagonal'
  | 'seyes'
  | 'storyboard'
  // Chinese school worksheets
  | 'pinyin_paper'
  | 'pinyin_tianzi'
  | 'composition_paper'
  | 'arithmetic_paper'
  | 'practice_paper'
  // English worksheets
  | 'english_paper'
  | 'english_primary'
  | 'english_double_line'
  | 'english_slanted'
  | 'english_tracing'
  | 'english_dictation'
  | 'english_vocabulary'
  | 'english_draw_write'
  | 'chinese_english_word_practice'
  // calligraphy practice
  | 'calligraphy_practice'
  | 'mizige'
  | 'huigongge'
  | 'jiugongge'
  | 'chinesetianzi'
  | 'huimige'
  | 'hardpen_calligraphy_paper'
  | 'crossgrid'
  | 'hardpen_huigongge'
  // notes, planning and forms
  | 'vintage_note'
  | 'children_drawing'
  | 'minimal_journal'
  | 'student_note'
  | 'meeting_note'
  | 'project_planning'
  | 'sketch'
  | 'creative_log'
  | 'branded'
  | 'error_correction'
  | 'chinese_preview_card'

export type PaperSizeKey =
  | 'a4'
  | 'a5'
  | 'a3'
  | 'b4'
  | 'b5'
  | 'letter'
  | 'legal'
  | 'tabloid'
  | 'executive'
  | 'custom'

export interface PaperSize {
  key: PaperSizeKey
  /** Portrait width in millimetres. */
  width: number
  /** Portrait height in millimetres. */
  height: number
}

export type Orientation = 'portrait' | 'landscape'

/* ------------------------------------------------------------------ */
/* Look and feel                                                       */
/* ------------------------------------------------------------------ */

export type LineStyle = 'solid' | 'dashed' | 'dotted'

export type ThemeKey =
  | 'default'
  | 'night'
  | 'sepia'
  | 'vintage'
  | 'pastel'
  | 'classic'
  | 'minimalist'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'tech'
  | 'elegant'
  | 'creative'

/** A palette that paper renderers may use for headings, accents and fills. */
export interface Theme {
  key: ThemeKey
  primary: Color
  secondary: Color
  /** Suggested paper colour. */
  paper: Color
  text: Color
  /** Default line colour when the theme is selected. */
  lines: Color
  accent: Color
  headingFont: string
  bodyFont: string
}

export type TextureKey =
  'none' | 'grid' | 'dots' | 'lines' | 'crosshatch' | 'graph' | 'image'

export type DecorationStyle =
  'simple' | 'double' | 'corner' | 'calligraphy' | 'scalloped'

export type DecorationScope = 'content' | 'page'

export type ScallopPattern = 'wave' | 'meander' | 'beads'

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export interface Margins {
  top: number
  right: number
  bottom: number
  left: number
}

export interface LineSettings {
  color: Color
  /** Line width in millimetres. */
  width: number
  style: LineStyle
  /** Value of the paper's spacing parameter, in millimetres. */
  spacing: number
}

export interface BackgroundSettings {
  color: Color
  texture: TextureKey
  patternColor: Color
  /** 0.1–0.5 for built-in textures, 0.1–1 for images. */
  patternOpacity: number
  /** Data URL of a user-supplied background image, or `null`. */
  image: string | null
}

export interface DecorationSettings {
  enabled: boolean
  style: DecorationStyle
  scope: DecorationScope
  /** Extra inset in millimetres applied inside the scope rectangle. */
  inset: number
  color: Color
  /** Border line width in millimetres. */
  width: number
  lineStyle: LineStyle
  sides: { top: boolean; right: boolean; bottom: boolean; left: boolean }
  /** Draw L-shaped ornaments in the four corners (style `corner` only). */
  cornerOrnaments: boolean
  scallopPattern: ScallopPattern
  /** 0.25–1 (style `scalloped` only). */
  opacity: number
}

export interface WatermarkSettings {
  enabled: boolean
  text: string
  /** 0.05–0.5. */
  opacity: number
  /** Rotation in degrees, −90 to 90. */
  angle: number
  /** Font size in millimetres. */
  size: number
  color: Color
}

export interface PagesSettings {
  /** 1–100. */
  count: number
  numbering: boolean
  /** Number printed on the first page. */
  startNumber: number
}

export interface Settings {
  version: 1
  paperType: PaperType
  paperSize: PaperSizeKey
  orientation: Orientation
  /** Used only when `paperSize` is `custom`. */
  customSize: { width: number; height: number }
  line: LineSettings
  margins: Margins
  theme: ThemeKey
  background: BackgroundSettings
  decoration: DecorationSettings
  watermark: WatermarkSettings
  pages: PagesSettings
  /** Type-specific options. Each paper declares its own shape. */
  options: Record<string, unknown>
}
