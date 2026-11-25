/**
 * 声明纸型、选项、预设及渲染接口。
 * Declares interfaces for papers, options, presets, and rendering.
 */
/**
 * Paper contract.
 *
 * A paper is a self-contained module: it declares its spacing parameter, the
 * form schema of its type-specific options, its presets, its user-facing
 * strings in every locale, and a `render()` that turns a context into a scene.
 * The control panel is generated from this declaration, so adding a paper
 * means adding one file, its tests and one line in the registry.
 */
import type { Box, Font, Scene, Stroke } from '../scene/types'
import type {
  BackgroundSettings,
  LineSettings,
  Locale,
  Margins,
  Orientation,
  PaperGroup,
  PaperSizeKey,
  PaperType,
  Theme,
  ThemeKey,
  Translator,
} from '../types'

/* ------------------------------------------------------------------ */
/* Spacing parameter                                                   */
/* ------------------------------------------------------------------ */

/** The one numeric parameter every paper exposes in the "line settings" section. */
export interface SpacingSpec {
  /** Paper-relative message key of the parameter name, e.g. `spacing.label`. */
  label: string
  /** Paper-relative message key of a one-line usage hint. */
  hint: string
  /** Allowed range and step in millimetres. `default` is also the value of the "recommended" button. */
  min: number
  max: number
  step: number
  default: number
}

/* ------------------------------------------------------------------ */
/* Options (type-specific configuration)                               */
/* ------------------------------------------------------------------ */

/** Receives the paper's options; return `true` to show the field. */
export type ShowIf = (options: Record<string, unknown>) => boolean

interface FieldBase {
  /** Dotted path into the paper's options object, e.g. `layout.rows`. */
  key: string
  /** Paper-relative message key. */
  label: string
  /** Paper-relative message key of a one-line hint, if any. */
  hint?: string
  showIf?: ShowIf
}

export interface NumberField extends FieldBase {
  kind: 'number'
  min: number
  max: number
  step: number
  /** Unit shown next to the input. Use `mm` for physical sizes, omit for counts. */
  unit?: 'mm'
  default: number
}

export interface SliderField extends FieldBase {
  kind: 'slider'
  min: number
  max: number
  step: number
  /** Text appended to the value, e.g. `mm` or `%`. */
  unit?: string
  default: number
}

export interface ToggleField extends FieldBase {
  kind: 'toggle'
  default: boolean
}

export interface SelectField extends FieldBase {
  kind: 'select'
  choices: readonly { value: string; label: string }[]
  default: string
}

export interface TextField extends FieldBase {
  kind: 'text'
  default: string
  maxLength?: number
}

export interface ColorField extends FieldBase {
  kind: 'color'
  default: string
}

/** A titled box that groups other fields. It has no value of its own. */
export interface GroupField extends FieldBase {
  kind: 'group'
  fields: readonly OptionField[]
}

export type OptionField =
  | NumberField
  | SliderField
  | ToggleField
  | SelectField
  | TextField
  | ColorField
  | GroupField

/* ------------------------------------------------------------------ */
/* Messages and presets                                                */
/* ------------------------------------------------------------------ */

/** User-facing strings of one paper. Keys are paper-relative; `name` is required. */
export interface PaperMessages {
  'zh-CN': Record<string, string>
  en: Record<string, string>
}

/** Settings a preset changes on top of the app-wide defaults. */
export interface PresetPatch {
  paperSize?: PaperSizeKey
  orientation?: Orientation
  line?: Partial<LineSettings>
  margins?: Partial<Margins>
  theme?: ThemeKey
  background?: Partial<BackgroundSettings>
  /** Deep-merged into the paper's `defaultOptions`. */
  options?: Record<string, unknown>
}

/** A named template of a paper. The first preset is the paper's default look. */
export interface Preset {
  /** Unique within the paper. Lower-case letters, digits and dashes. */
  id: string
  /** Paper-relative message key. */
  name: string
  /** Paper-relative message key. */
  description: string
  patch: PresetPatch
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

export interface StrokeFactory {
  (overrides?: Partial<Stroke>): Stroke
}

/** Stroke constructors handed to every paper. */
export interface InkKit {
  /** Primary lines: the user's line colour, width and style. */
  main: StrokeFactory
  /**
   * Auxiliary lines: the user's colour, a little thinner, dashed.
   * Pass `dash` to change the rhythm, `width` for a different weight.
   */
  guide: StrokeFactory
  /** A stroke built from scratch. */
  make: (color: string, width: number, dash?: readonly number[]) => Stroke
}

export interface FontOptions {
  weight?: 400 | 700
  style?: 'normal' | 'italic'
}

/** Font stacks handed to every paper. Sizes are in millimetres. */
export interface FontKit {
  /** Theme body font. */
  body: (size: number, opts?: FontOptions) => Font
  /** Theme heading font. */
  heading: (size: number, opts?: FontOptions) => Font
  serif: (size: number, opts?: FontOptions) => Font
  /** A CJK serif / regular-script stack for Chinese practice sheets. */
  cjk: (size: number, opts?: FontOptions) => Font
  mono: (size: number, opts?: FontOptions) => Font
  /** A casual handwriting stack. */
  hand: (size: number, opts?: FontOptions) => Font
}

/** Everything a paper needs to draw one writing area. */
export interface RenderContext<O> {
  type: PaperType
  /** Full page size in millimetres, orientation already applied. */
  page: { width: number; height: number }
  /** The area to fill: the page minus its margins, or one column of it. */
  area: Box
  /** The spacing parameter, already clamped to the paper's range. */
  spacing: number
  theme: Theme
  /** Type-specific options: defaults merged with the user's values and validated against `fields`. */
  options: O
  ink: InkKit
  fonts: FontKit
  /** Translator scoped to this paper. */
  t: Translator
  locale: Locale
}

export interface PaperDef<O extends object = Record<string, unknown>> {
  /** Unique key; also the value stored in `Settings.paperType`. */
  type: PaperType
  group: PaperGroup
  messages: PaperMessages
  spacing: SpacingSpec
  /** Schema of the type-specific options. Empty when the paper has none. */
  fields: readonly OptionField[]
  /** Default values of the type-specific options. */
  defaultOptions: O
  presets: readonly Preset[]
  /**
   * The paper is a writing-practice sheet for which a frame around the
   * content area is a recommended finishing touch. The UI then offers a
   * one-click "apply calligraphy frame" action.
   */
  suggestsCalligraphyFrame?: boolean
  /** Draws the writing area. Must stay inside `ctx.area` (line width may overflow slightly). */
  render: (ctx: RenderContext<O>) => Scene
}

/** A paper whose option type has been erased, as stored in the registry. */
export type AnyPaper = PaperDef<Record<string, unknown>>

/* ------------------------------------------------------------------ */
/* Shared option shapes                                                */
/* ------------------------------------------------------------------ */

/**
 * Left / right column layout. Papers that support it declare the fields from
 * `shared/columns.ts` and read this shape from their options.
 */
export interface ColumnsOptions {
  columns: {
    /** Select-field value: `'1'` for a single column, `'2'` for two. */
    count: '1' | '2'
    /** Space between the two columns in millimetres. */
    gap: number
    divider: 'solid' | 'dashed'
  }
}
