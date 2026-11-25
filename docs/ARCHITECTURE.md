# Architecture

This document is the English companion to [`design.zh-CN.md`](design.zh-CN.md). It describes the shape of the code for contributors who want to understand or extend the renderer.

## Goal

A fully client-side generator for custom printable paper. Pick a paper type, adjust its settings, see a live preview, then export SVG / PNG / PDF or print. No server, no account, no telemetry; nothing the user types or uploads ever leaves the browser.

## Layers

```
src/
  main.tsx, App.tsx               entry
  i18n/                           zh-CN / en dictionaries, translator, locale detection
  core/                           pure TypeScript, no React and no DOM
    types.ts                      settings data model
    paperSizes.ts, themes.ts      lookup tables
    settings.ts, encoding.ts      defaults, switching papers, validation, import/export, URL hash
    scene/
      types.ts                    scene primitives (millimetres)
      builders.ts, geometry.ts    constructors, cell/grid layout, bounds
    papers/
      contract.ts                 the PaperDef contract and option-field schema
      kit.ts, define.ts           ink / font kits, option resolution, type erasure
      registry.ts                 import.meta.glob auto-discovery
      shared/                     reusable drawing helpers
      <type>.ts                   one file per paper type
    compose/
      background.ts               paper colour, textures, custom image
      decoration.ts               page borders and ornaments
      watermark.ts                tiled watermark
      document.ts                 page assembly: background + paper + decoration + watermark + page number
    render/
      color.ts, svg.ts            palette helpers, SVG serialisation
      pathData.ts, pdf.ts         arc→Bézier, vector PDF via pdf-lib
      raster.ts, textRaster.ts    Canvas rasterisation, text patches for PDF
  ui/                             the only layer that touches React
    store/                        settings state, localStorage, URL sync
    i18n/                         locale context
    controls/                     form controls generated from the field schema
    sections/                     one component per panel section
    layout/                       header, control panel, workspace, footer
    preview/, export/, gallery/, print/
```

Dependency rule: `scene/` depends on nothing; `papers/` depends on `scene/` and `i18n/` types; `compose/` depends on `papers/` and `settings.ts`; `render/` depends only on `scene/`; `ui/` may use anything below it. Nothing in `core/` imports React or reads the DOM.

## The scene

A paper's `render()` returns a `Scene`: a flat list of drawing primitives with millimetre coordinates, origin at the page's top-left corner, `y` pointing down.

```ts
type SceneItem =
  | { op: 'line'; x1; y1; x2; y2; stroke }
  | { op: 'rect'; box; stroke?; fill? }
  | { op: 'ellipse'; cx; cy; rx; ry; start?; end?; stroke?; fill? }
  | { op: 'poly'; points; closed; stroke?; fill? }
  | { op: 'path'; d: PathCommand[]; closed?; stroke?; fill? }
  | { op: 'text'; x; y; text; font; fill; anchor?; baseline?; rotate? }
  | { op: 'image'; box; src; opacity? }
  | { op: 'g'; opacity?; items: SceneItem[] }
```

Deliberate restrictions that keep all renderers simple:

- **No clipping.** Anything that must stay within a boundary is computed to fit when the scene is built.
- **Paths only use M / L / Q / C / Z.** Arcs are expressed with `ellipse` and `start/end` angles.
- **Dashes are explicit millimetre arrays**, so primary lines and auxiliary guides can have different rhythms.
- **Colours are `#rrggbb`**, line widths and font sizes are in millimetres.

The preview, SVG, PNG, PDF and print all render from the same scene. That is what makes the output match the screen and keeps physical sizes exact: no pixel rounding anywhere in the geometry path.

## A paper as a plug-in

Each paper is one self-contained module that default-exports `definePaper({...})`:

```ts
interface PaperDef<O> {
  type: PaperType
  group: 'basic' | 'worksheet' | 'calligraphy' | 'creative'
  messages: { 'zh-CN': Record<string, string>; en: Record<string, string> }
  spacing: { label; hint; min; max; step; default } // millimetres
  fields: readonly OptionField[] // type-specific form schema
  defaultOptions: O
  presets: readonly Preset[]
  suggestsCalligraphyFrame?: boolean
  render: (ctx: RenderContext<O>) => Scene
}
```

`RenderContext` gives the paper the page size, the writing area (page minus margins, or one column), the clamped spacing value, the theme, the resolved options, stroke and font kits, and a translator scoped to that paper. `render()` draws **only inside the writing area**; background, borders, watermark, page numbers and column splitting belong to `compose/`.

The registry discovers paper files with `import.meta.glob('./*.ts', { eager: true })` and rejects duplicate `type` keys. The control panel renders `fields` through a generic `OptionFieldRenderer`, so adding a paper means adding one module, its tests and one line in the `PaperType` union — no registry edit, no UI edit.

## Page assembly

`buildDocument({ settings, locale })` produces one `Page` per requested page:

```
background (colour + texture/image)
  + paper content (writing area; split into columns when the paper declares a column field)
  + decoration (scope rectangle, inset, style)
  + watermark (tiled, rotated text grid)
  + page number (only when enabled)
```

The base scene is computed once; each page only adds its own page number. Page numbering is `current / last`, where `last = startNumber + count - 1`.

## Renderers

| Output  | How                                                                            |
| ------- | ------------------------------------------------------------------------------ |
| Preview | `sceneToSvg()` mounted as inline SVG                                           |
| SVG     | The same string, with `width="210mm" height="297mm" viewBox="0 0 210 297"`     |
| PNG     | Scene → Canvas at 150 / 300 / 600 DPI, with a pixel-budget guard               |
| PDF     | pdf-lib: lines and curves stay vector; text is a 600 DPI transparent PNG patch |
| Print   | Browser print with `@page { size: <w>mm <h>mm; margin: 0 }`                    |

PDF text uses raster patches because embedding a CJK font would add tens of megabytes to the app. The trade-off: PDF labels are sharp but not selectable. Printed pages are fully vector with real text.

## State and i18n

`Settings` is one object: paper type, size, orientation, line settings, margins, theme, background, decoration, watermark, pages and type-specific options. `sanitizeSettings(raw)` is the single choke point — defaults, localStorage, URL hashes and imported files all pass through it, so malformed or stale data can never reach a renderer.

Switching to another paper keeps the user's page count, watermark and decoration, but adopts that paper's default line settings and margins. Selecting a theme also updates the line colour.

Dictionaries are plain objects; the Chinese and English key sets must be identical (a test enforces it). Paper-level strings live in the paper module; UI strings live in `src/i18n/`. Neither the geometry nor the UI contains hard-coded user-facing text.

## Testing

- Pure-function tests for scene builders, geometry, settings, compose and renderers.
- A shared contract test walks every registered paper and asserts: valid declaration, consistent i18n keys, spacing default within range, sane presets, non-empty scene (except blank paper), all primitives inside the writing area, finite numbers, A4 portrait / A5 landscape, and `render()` purity.
- DOM tests (happy-dom) for controls, sections, gallery and export interactions.
- A headless-browser pass renders every paper and opens the exported files for a visual check.

Run everything with `pnpm check` (lint → typecheck → test → build).

## Deliberate differences from similar tools

See §11 of the Chinese design document. In short: millimetres throughout, vector PDF, one consistent default set per paper, correct page numbering, no double-applied image opacity, no pre-filled branding in the watermark, all pages visible in the preview, plus link sharing and a template gallery.
