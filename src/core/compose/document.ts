/**
 * Whole-document composition: writing area, paper content (with optional
 * columns), page numbers and the assembly of one finished scene per page.
 * The base scene (background, paper, decoration, watermark) is built once and
 * shared by every page; only the page number differs between pages.
 */
import { paperTranslator } from '../../i18n'
import { line, text } from '../scene/builders'
import { clamp } from '../scene/geometry'
import type { Page, Scene, SceneItem, TextItem } from '../scene/types'
import type { OptionField, RenderContext } from '../papers/contract'
import { createFontKit, createInkKit, getOption } from '../papers/kit'
import { findPaper } from '../papers/registry'
import { clampSpacing, resolveOptionsFor, resolvePageSize } from '../settings'
import { resolveTheme } from '../themes'
import type { Box } from '../scene/types'
import type { Locale, Margins, Settings } from '../types'
import { backgroundScene } from './background'
import { decorationScene, framedContentArea } from './decoration'
import { watermarkScene } from './watermark'

/** Page size in millimetres. */
export interface PageSize {
  width: number
  height: number
}

/** Inclusive bounds of the requested and rendered page count. */
const PAGE_COUNT_MIN = 1
const PAGE_COUNT_MAX = 100

/** Font size and colour of the page number. */
const PAGE_NUMBER_SIZE = 3.2
const PAGE_NUMBER_COLOR = '#666666'

/** Baseline distance of the page number from the bottom edge, in millimetres. */
const PAGE_NUMBER_BOTTOM = 2.65

/** Dash of the two-column divider when it is dashed. */
const DIVIDER_DASH: readonly number[] = [3, 2]

/** Writing area: the page minus all four margins. */
export function contentArea(pageSize: PageSize, margins: Margins): Box {
  return {
    x: margins.left,
    y: margins.top,
    w: pageSize.width - margins.left - margins.right,
    h: pageSize.height - margins.top - margins.bottom,
  }
}

/** Whether any field (including fields inside groups) declares `columns.count`. */
function declaresColumns(fields: readonly OptionField[]): boolean {
  return fields.some(
    (field) =>
      field.key === 'columns.count' ||
      (field.kind === 'group' && declaresColumns(field.fields)),
  )
}

/** Paper content layer, split into two columns when the paper and options ask for it. */
export function paperScene(settings: Settings, locale: Locale): Scene {
  const paper = findPaper(settings.paperType)
  if (!paper) return []

  const options = resolveOptionsFor(settings)
  const spacing = clampSpacing(settings.paperType, settings.line.spacing)
  const theme = resolveTheme(settings.theme)
  const page = resolvePageSize(settings)
  const area = framedContentArea(
    settings,
    page,
    contentArea(page, settings.margins),
  )
  if (area.w <= 0 || area.h <= 0) return []
  const common = {
    type: settings.paperType,
    page,
    spacing,
    theme,
    options,
    ink: createInkKit(settings.line),
    fonts: createFontKit(theme),
    t: paperTranslator(paper, locale),
    locale,
  } satisfies Omit<RenderContext<Record<string, unknown>>, 'area'>
  const render = (part: Box): Scene => paper.render({ ...common, area: part })

  const twoColumns =
    declaresColumns(paper.fields) &&
    getOption<string>(options, 'columns.count', '1') === '2'
  if (!twoColumns) return render(area)

  const gap = getOption<number>(options, 'columns.gap', 8)
  const columnWidth = (area.w - gap) / 2
  if (columnWidth <= 0) return render(area)

  const left: Box = { x: area.x, y: area.y, w: columnWidth, h: area.h }
  const right: Box = {
    x: area.x + columnWidth + gap,
    y: area.y,
    w: columnWidth,
    h: area.h,
  }
  const dividerX = area.x + columnWidth + gap / 2
  const divider =
    getOption<string>(options, 'columns.divider', 'solid') === 'dashed'
      ? {
          color: settings.line.color,
          width: settings.line.width,
          dash: DIVIDER_DASH,
        }
      : { color: settings.line.color, width: settings.line.width }

  return [
    ...render(left),
    ...render(right),
    line(dividerX, area.y, dividerX, area.y + area.h, divider),
  ]
}

/** The page-number item, or `null` when numbering is off. */
export function pageNumberItem(
  settings: Settings,
  pageSize: PageSize,
  pageIndex: number,
): TextItem | null {
  if (!settings.pages.numbering) return null
  const count = clamp(settings.pages.count, PAGE_COUNT_MIN, PAGE_COUNT_MAX)
  const start = settings.pages.startNumber
  const label = `${start + pageIndex} / ${start + count - 1}`
  const font = createFontKit(resolveTheme(settings.theme)).body(
    PAGE_NUMBER_SIZE,
  )
  return text(
    pageSize.width / 2,
    pageSize.height - PAGE_NUMBER_BOTTOM,
    label,
    font,
    PAGE_NUMBER_COLOR,
    { anchor: 'middle' },
  )
}

/** Input of `buildDocument`: the settings and the language of paper text. */
export interface ComposeInput {
  settings: Settings
  locale: Locale
}

/** A composed document: its page size and one scene per page. */
export interface ComposedDocument {
  pageSize: PageSize
  pages: Page[]
}

/** Full document: every page = background + paper + decoration + watermark (+ page number). */
export function buildDocument(input: ComposeInput): ComposedDocument {
  const { settings, locale } = input
  const pageSize = resolvePageSize(settings)
  const count = clamp(settings.pages.count, PAGE_COUNT_MIN, PAGE_COUNT_MAX)
  const area = contentArea(pageSize, settings.margins)
  const base: SceneItem[] = [
    ...backgroundScene(settings, pageSize),
    ...paperScene(settings, locale),
    ...decorationScene(settings, pageSize, area),
    ...watermarkScene(settings, pageSize),
  ]

  const pages: Page[] = []
  for (let i = 0; i < count; i++) {
    const number = pageNumberItem(settings, pageSize, i)
    pages.push({
      width: pageSize.width,
      height: pageSize.height,
      scene: number ? [...base, number] : base,
    })
  }
  return { pageSize, pages }
}
