# Paper by Choice

[简体中文](README.md) · [Live site](https://paper-by-choice.pages.dev/) · Created by **skyow**

**Generate the printable paper you want, right in your browser.** Ruled, grid, dot, music staves, calligraphy practice grids, Chinese handwriting worksheets, Cornell notes and more. Pick a paper, adjust size, colours, spacing and margins, see a live preview, then export SVG / PNG / PDF or print.

Fully client-side. No backend, no account, no telemetry. **Everything runs in your browser; the text you type and the images you upload never leave your machine.**

## Features

- **40+ paper types**: basic grids, music and guitar tablature, Chinese school worksheets (pinyin, tianzi, composition, arithmetic, English four-line), calligraphy practice grids (mizige, huigongge, jiugongge and a parametric practice sheet with many presets), plus notes and forms (Cornell, meeting notes, project planning, error correction, bilingual vocabulary drills).
- **Page setup**: A4 / A5 / A3 / B4 / B5 / Letter / Legal / Tabloid / Executive / custom size; portrait and landscape; two-column layout for selected papers; 1–100 pages.
- **Appearance**: 13 themes, line colour / style / width / spacing, four independent margins, 7 background textures, a custom background image, 5 border decorations (including scalloped borders and a calligraphy frame), tiled watermark, page numbering.
- **Template gallery**: every paper ships with presets; settings can be exported to JSON, imported later, or shared with others.
- **Export**: SVG (all pages merged into one vector file), PNG (one file per page, 150 / 300 / 600 DPI), PDF (**vector lines**, losslessly scalable in any reader). Printing produces true vector pages with real text.
- **Bilingual UI**: Chinese and English, including the labels printed on the paper.
- **Works offline**: the build is plain static files. Host it anywhere — GitHub Pages, a NAS, or a sub-folder of an existing site.

## Quick start

```bash
pnpm install
pnpm dev          # open the URL shown in the terminal
```

Requires Node.js 20.19+ / 22.12+ and pnpm 10+.

```bash
pnpm build        # output in dist/, relative asset paths
pnpm preview      # preview the production build
pnpm check        # lint + typecheck + test + build
```

## Deployment

### Build the static site

Use Node.js 20.19+ on the 20.x line or Node.js 22.12+, with pnpm 10+. Run these commands from the repository root:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm preview --host 127.0.0.1
```

Publish the complete contents of `dist/`, keeping `index.html`, `favicon.svg` and `assets/` in their original relative locations. Rebuild and upload the full directory for each release. The app needs only static HTTP hosting. No database, secrets or Node.js runtime are needed on the host.

### Cloudflare Pages

**Direct Upload** is how the live site is hosted:

1. Build the app, then open **Workers & Pages → Create application → Pages → Upload assets** in Cloudflare.
2. Choose a project name and upload `dist/`. For an existing project, create a new production deployment in that project.
3. Open the `*.pages.dev` URL shown in the dashboard. Check the paper preview and PDF export.

**Automatic deployment with GitHub Actions.** The [deployment workflow](.github/workflows/deploy-cloudflare.yml) builds and uploads the site when `main` changes. Add `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` under **Settings → Secrets and variables → Actions**. Use a token with **Cloudflare Pages: Edit** on the target account. Keep credentials in GitHub Secrets. You can also run the workflow from **Actions → Deploy to Cloudflare Pages**.

You can also deploy with Wrangler. Run these commands from the repository root. Create the project only once:

```bash
pnpm dlx wrangler login
pnpm dlx wrangler pages project create paper-by-choice --production-branch main
pnpm dlx wrangler pages deploy dist --project-name paper-by-choice --branch main
```

For **automatic builds from Git**, create a separate Git-connected Pages project. Connect the GitHub repository and set the production branch to `main`, the root directory to the repository root, the build command to `pnpm build` and the output directory to `dist`. Use compatible Node.js and pnpm versions in the build environment. Existing Direct Upload projects can continue to deploy through Wrangler.

[Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) · [Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)

### GitHub Pages

In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. In a deployment workflow, check out the source, set up Node.js and pnpm, then run `pnpm install --frozen-lockfile` and `pnpm build`. Upload `dist/` with `actions/upload-pages-artifact` and publish it with `actions/deploy-pages`. Give the deployment job `pages: write` and `id-token: write` permissions and use the `github-pages` environment. The existing CI workflow runs project checks. Vite emits relative asset paths, so a project site can be hosted at `/<repository>/`.

[GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

### Docker, a NAS or an existing website

```bash
docker build -t paper-by-choice .
docker run -d --name paper-by-choice --restart unless-stopped -p 8080:80 paper-by-choice
```

Open `http://localhost:8080/`. On a NAS, replace `localhost` with the NAS IP and ensure port 8080 is reachable. To upgrade, rebuild the image and recreate the container. You can also copy the contents of `dist/` to an Nginx, Apache or NAS document root. When hosting in a subdirectory such as `/paper-by-choice/`, use the URL with its trailing slash.

## Printing tips

When printing (or opening the exported PDF), choose **"Actual size / 100%"**, turn off the browser's headers and footers, and set the paper size to match your page settings. Page geometry is generated in exact millimetres; any scaling breaks the physical ruling.

> Lines and grids in the PDF are vector. The few labels printed on the paper are embedded as 600 DPI transparent patches rather than a bundled multi-megabyte CJK font, so that text is not selectable in the PDF — but it stays sharp in print.

## How it works

A paper's `render()` never writes SVG, Canvas or PDF directly. It returns a list of _scene primitives_ in **millimetres** (lines, rectangles, arcs, paths, text, images). The screen preview, SVG, PNG, PDF and printing all render from the same scene, so what you see is what you get and the physical line spacing stays exact.

Adding a paper means adding one file: `src/core/papers/<name>.ts` default-exports `definePaper({...})`, declaring the spacing parameter, the schema of its type-specific options, its presets and its render function. The registry discovers files automatically and the control panel builds itself from the declaration. See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/design.zh-CN.md](docs/design.zh-CN.md).

## Stack

React 19 · TypeScript 5.9 · Vite 8 · pdf-lib · Vitest. The only runtime dependencies are React, React DOM and pdf-lib.

## English worksheets

The **English worksheets** group includes four-line handwriting, US primary handwriting, double-line placement, two-tone slanted placement, tracing, dictation, vocabulary, draw-and-write, and Chinese–English translation drills. The four-line paper includes sky/grass/ground and grayscale placement presets.

- **Paper size** defaults to A4 (210 × 297 mm) from [ISO 216](https://www.iso.org/standard/36631.html). The new worksheets use adjustable 18 mm margins on all sides and dark slate lines on white paper.
- **Four-line handwriting** uses 4 mm between adjacent rules (12 mm total), with a 9 mm compact preset. See the minimum ruling height for primary-school English exercise books in [GB 40070—2021, section 6.2.1](https://www.ndcpa.gov.cn/jbkzzx/c100202/2019681064660144128/qAABzXz4.pdf).
- **US primary handwriting** uses a 15.875 mm or 19.05 mm row pitch, inspired by [Zaner-Bloser’s nominal 5/8-inch and 3/4-inch sizes](https://media.zaner-bloser.com/pdfs/zaner-bloser-handwriting-c2020-renewal-form.pdf). This project sets the internal rule proportions.
- **Other defaults** are set by this project. Double-line placement uses a 16 mm row pitch and a 6 mm gap between rules. Dictation and vocabulary rows default to 10 mm and 14 mm. The placement bands also have a grayscale option.

## Project structure

The tables cover every TypeScript and TSX file, including tests.

### `src`

| File | Purpose |
| --- | --- |
| [`App.test.tsx`](src/App.test.tsx) | Tests the App module, which exposes the application root |
| [`App.tsx`](src/App.tsx) | Exposes the application root |
| [`main.tsx`](src/main.tsx) | Bootstraps React and global styles |

### `src/core/compose`

| File | Purpose |
| --- | --- |
| [`background.test.ts`](src/core/compose/background.test.ts) | Tests the background module, which composes paper colors, textures, and background images |
| [`background.ts`](src/core/compose/background.ts) | Composes paper colors, textures, and background images |
| [`decoration.test.ts`](src/core/compose/decoration.test.ts) | Tests the decoration module, which draws borders and page decorations |
| [`decoration.ts`](src/core/compose/decoration.ts) | Draws borders and page decorations |
| [`document.test.ts`](src/core/compose/document.test.ts) | Tests the document module, which combines the paper, background, decorations, and watermark |
| [`document.ts`](src/core/compose/document.ts) | Combines the paper, background, decorations, and watermark |
| [`watermark.test.ts`](src/core/compose/watermark.test.ts) | Tests the watermark module, which positions and renders page watermarks |
| [`watermark.ts`](src/core/compose/watermark.ts) | Positions and renders page watermarks |

### `src/core`

| File | Purpose |
| --- | --- |
| [`encoding.test.ts`](src/core/encoding.test.ts) | Tests the encoding module, which encodes and decodes shareable paper settings |
| [`encoding.ts`](src/core/encoding.ts) | Encodes and decodes shareable paper settings |
| [`paperLooks.ts`](src/core/paperLooks.ts) | Defines default line appearance, spacing, and margins for every paper |
| [`paperSizes.test.ts`](src/core/paperSizes.test.ts) | Tests the paperSizes module, which handles paper sizes, orientations, and print units |
| [`paperSizes.ts`](src/core/paperSizes.ts) | Handles paper sizes, orientations, and print units |
| [`settings.test.ts`](src/core/settings.test.ts) | Tests the settings module, which creates, merges, and validates paper settings |
| [`settings.ts`](src/core/settings.ts) | Creates, merges, and validates paper settings |
| [`themes.test.ts`](src/core/themes.test.ts) | Tests the themes module, which defines paper rendering palettes and typography |
| [`themes.ts`](src/core/themes.ts) | Defines paper rendering palettes and typography |
| [`types.ts`](src/core/types.ts) | Defines application settings and page data types |

### `src/core/papers`

| File | Purpose |
| --- | --- |
| [`arithmeticPaper.ts`](src/core/papers/arithmeticPaper.ts) | Draws arithmetic practice with name and date fields |
| [`b6Declaration.test.ts`](src/core/papers/b6Declaration.test.ts) | Tests independent paper declarations and registration |
| [`blank.test.ts`](src/core/papers/blank.test.ts) | Tests the blank module, which generates blank paper |
| [`blank.ts`](src/core/papers/blank.ts) | Generates blank paper |
| [`branded.test.ts`](src/core/papers/branded.test.ts) | Tests the branded module, which draws stationery with custom branding |
| [`branded.ts`](src/core/papers/branded.ts) | Draws stationery with custom branding |
| [`calligraphy.test.ts`](src/core/papers/calligraphy.test.ts) | Tests the calligraphy module, which draws basic calligraphy guide sheets |
| [`calligraphy.ts`](src/core/papers/calligraphy.ts) | Draws basic calligraphy guide sheets |
| [`calligraphyPractice.test.ts`](src/core/papers/calligraphyPractice.test.ts) | Tests the calligraphyPractice module, which draws calligraphy practice cells |
| [`calligraphyPractice.ts`](src/core/papers/calligraphyPractice.ts) | Draws calligraphy practice cells |
| [`childrenDrawing.test.ts`](src/core/papers/childrenDrawing.test.ts) | Tests the childrenDrawing module, which lays out drawing areas for children |
| [`childrenDrawing.ts`](src/core/papers/childrenDrawing.ts) | Lays out drawing areas for children |
| [`chineseEnglishWordPractice.test.ts`](src/core/papers/chineseEnglishWordPractice.test.ts) | Tests the chineseEnglishWordPractice module, which draws Chinese–English translation drills |
| [`chineseEnglishWordPractice.ts`](src/core/papers/chineseEnglishWordPractice.ts) | Draws Chinese–English translation drills |
| [`chinesePreviewCard.test.ts`](src/core/papers/chinesePreviewCard.test.ts) | Tests the chinesePreviewCard module, which draws Chinese language preview cards |
| [`chinesePreviewCard.ts`](src/core/papers/chinesePreviewCard.ts) | Draws Chinese language preview cards |
| [`chinesetianzi.test.ts`](src/core/papers/chinesetianzi.test.ts) | Tests the chinesetianzi module, which draws Tian character cells and internal guides |
| [`chinesetianzi.ts`](src/core/papers/chinesetianzi.ts) | Draws Tian character cells and internal guides |
| [`compositionPaper.ts`](src/core/papers/compositionPaper.ts) | Draws Chinese composition squares |
| [`contract.ts`](src/core/papers/contract.ts) | Declares interfaces for papers, options, presets, and rendering |
| [`cornell.test.ts`](src/core/papers/cornell.test.ts) | Tests the cornell module, which lays out Cornell cue, note, and summary areas |
| [`cornell.ts`](src/core/papers/cornell.ts) | Lays out Cornell cue, note, and summary areas |
| [`creativeLog.test.ts`](src/core/papers/creativeLog.test.ts) | Tests the creativeLog module, which lays out creative log areas |
| [`creativeLog.ts`](src/core/papers/creativeLog.ts) | Lays out creative log areas |
| [`crossgrid.test.ts`](src/core/papers/crossgrid.test.ts) | Tests the crossgrid module, which draws crossed calligraphy guides |
| [`crossgrid.ts`](src/core/papers/crossgrid.ts) | Draws crossed calligraphy guides |
| [`define.test.ts`](src/core/papers/define.test.ts) | Tests the define module, which adapts strongly typed definitions to the shared registry |
| [`define.ts`](src/core/papers/define.ts) | Adapts strongly typed definitions to the shared registry |
| [`dot.test.ts`](src/core/papers/dot.test.ts) | Tests the dot module, which draws dot-grid paper |
| [`dot.ts`](src/core/papers/dot.ts) | Draws dot-grid paper |
| [`englishDictation.ts`](src/core/papers/englishDictation.ts) | Lays out numbered English dictation and corrections |
| [`englishDoubleLine.ts`](src/core/papers/englishDoubleLine.ts) | Draws double-line guides for lowercase letter bodies |
| [`englishDrawWrite.ts`](src/core/papers/englishDrawWrite.ts) | Combines a drawing area with English writing guides |
| [`englishPaper.ts`](src/core/papers/englishPaper.ts) | Draws four-line handwriting and its color and grayscale presets |
| [`englishPrimary.ts`](src/core/papers/englishPrimary.ts) | Draws US primary handwriting guides with a dashed midline |
| [`englishSlanted.ts`](src/core/papers/englishSlanted.ts) | Draws English placement paper with a red baseline and pale slanted guides |
| [`englishTracing.ts`](src/core/papers/englishTracing.ts) | Lays out model, tracing, and independent writing rows |
| [`englishVocabulary.ts`](src/core/papers/englishVocabulary.ts) | Draws a word, meaning, and example table |
| [`englishWorksheets.test.ts`](src/core/papers/englishWorksheets.test.ts) | Tests English worksheet grouping, pitch, and tracing |
| [`errorCorrection.test.ts`](src/core/papers/errorCorrection.test.ts) | Tests the errorCorrection module, which lays out error-correction areas |
| [`errorCorrection.ts`](src/core/papers/errorCorrection.ts) | Lays out error-correction areas |
| [`exportVerification.test.ts`](src/core/papers/exportVerification.test.ts) | Checks paper and preset exports |
| [`geometryPapers.test.ts`](src/core/papers/geometryPapers.test.ts) | Tests geometric paper sizing and layout |
| [`grid.test.ts`](src/core/papers/grid.test.ts) | Tests the grid module, which draws a square grid |
| [`grid.ts`](src/core/papers/grid.ts) | Draws a square grid |
| [`guitarStaffTab.test.ts`](src/core/papers/guitarStaffTab.test.ts) | Tests the guitarStaffTab module, which combines musical staff and guitar tablature |
| [`guitarStaffTab.ts`](src/core/papers/guitarStaffTab.ts) | Combines musical staff and guitar tablature |
| [`guitarTab.test.ts`](src/core/papers/guitarTab.test.ts) | Tests the guitarTab module, which draws guitar tablature |
| [`guitarTab.ts`](src/core/papers/guitarTab.ts) | Draws guitar tablature |
| [`hardpenCalligraphyPaper.test.ts`](src/core/papers/hardpenCalligraphyPaper.test.ts) | Tests the hardpenCalligraphyPaper module, which lays out hard-pen calligraphy paper |
| [`hardpenCalligraphyPaper.ts`](src/core/papers/hardpenCalligraphyPaper.ts) | Lays out hard-pen calligraphy paper |
| [`hardpenHuigongge.test.ts`](src/core/papers/hardpenHuigongge.test.ts) | Tests the hardpenHuigongge module, which draws rectangular nested calligraphy cells |
| [`hardpenHuigongge.ts`](src/core/papers/hardpenHuigongge.ts) | Draws rectangular nested calligraphy cells |
| [`hexagonal.ts`](src/core/papers/hexagonal.ts) | Draws a hexagonal grid |
| [`huigongge.test.ts`](src/core/papers/huigongge.test.ts) | Tests the huigongge module, which draws nested calligraphy cells |
| [`huigongge.ts`](src/core/papers/huigongge.ts) | Draws nested calligraphy cells |
| [`huimige.test.ts`](src/core/papers/huimige.test.ts) | Tests the huimige module, which draws nested cells with diagonal guides |
| [`huimige.ts`](src/core/papers/huimige.ts) | Draws nested cells with diagonal guides |
| [`isometric.ts`](src/core/papers/isometric.ts) | Draws an isometric grid |
| [`jiugongge.test.ts`](src/core/papers/jiugongge.test.ts) | Tests the jiugongge module, which draws nine-cell calligraphy guides |
| [`jiugongge.ts`](src/core/papers/jiugongge.ts) | Draws nine-cell calligraphy guides |
| [`kit.test.ts`](src/core/papers/kit.test.ts) | Tests the kit module, which builds stroke and font helpers for paper renderers |
| [`kit.ts`](src/core/papers/kit.ts) | Builds stroke and font helpers for paper renderers |
| [`lined.test.ts`](src/core/papers/lined.test.ts) | Tests the lined module, which draws horizontal ruled paper |
| [`lined.ts`](src/core/papers/lined.ts) | Draws horizontal ruled paper |
| [`meetingNote.test.ts`](src/core/papers/meetingNote.test.ts) | Tests the meetingNote module, which lays out meeting notes |
| [`meetingNote.ts`](src/core/papers/meetingNote.ts) | Lays out meeting notes |
| [`minimalJournal.test.ts`](src/core/papers/minimalJournal.test.ts) | Tests the minimalJournal module, which draws minimalist journal paper |
| [`minimalJournal.ts`](src/core/papers/minimalJournal.ts) | Draws minimalist journal paper |
| [`mizige.ts`](src/core/papers/mizige.ts) | Draws Mi character cells with diagonal guides |
| [`music.test.ts`](src/core/papers/music.test.ts) | Tests the music module, which draws music staff paper |
| [`music.ts`](src/core/papers/music.ts) | Draws music staff paper |
| [`paperContract.test.ts`](src/core/papers/paperContract.test.ts) | Checks paper contracts and scene bounds |
| [`pinyinPaper.ts`](src/core/papers/pinyinPaper.ts) | Lays out Mandarin pinyin rows |
| [`pinyinTianzi.ts`](src/core/papers/pinyinTianzi.ts) | Combines pinyin guides with square Tian cells |
| [`practicePaper.ts`](src/core/papers/practicePaper.ts) | Draws general practice paper |
| [`projectPlanning.test.ts`](src/core/papers/projectPlanning.test.ts) | Tests the projectPlanning module, which lays out project details, a Gantt chart, and a task list |
| [`projectPlanning.ts`](src/core/papers/projectPlanning.ts) | Lays out project details, a Gantt chart, and a task list |
| [`registry.test.ts`](src/core/papers/registry.test.ts) | Tests the registry module, which registers and orders papers and resolves their presets |
| [`registry.ts`](src/core/papers/registry.ts) | Registers and orders papers and resolves their presets |
| [`seyes.ts`](src/core/papers/seyes.ts) | Draws French Séyès ruling |
| [`sketch.test.ts`](src/core/papers/sketch.test.ts) | Tests the sketch module, which draws sketch paper |
| [`sketch.ts`](src/core/papers/sketch.ts) | Draws sketch paper |
| [`storyboard.ts`](src/core/papers/storyboard.ts) | Lays out storyboard frames and notes |
| [`studentNote.test.ts`](src/core/papers/studentNote.test.ts) | Tests the studentNote module, which lays out student note sheets |
| [`studentNote.ts`](src/core/papers/studentNote.ts) | Lays out student note sheets |
| [`svgRendering.test.ts`](src/core/papers/svgRendering.test.ts) | Checks SVG output across papers |
| [`verticalLined.ts`](src/core/papers/verticalLined.ts) | Draws vertical ruled paper |
| [`vintageNote.test.ts`](src/core/papers/vintageNote.test.ts) | Tests the vintageNote module, which draws vintage note paper |
| [`vintageNote.ts`](src/core/papers/vintageNote.ts) | Draws vintage note paper |
| [`worksheetPapers.test.ts`](src/core/papers/worksheetPapers.test.ts) | Checks worksheet headers and layout |

### `src/core/papers/shared`

| File | Purpose |
| --- | --- |
| [`calligraphyLayouts.test.ts`](src/core/papers/shared/calligraphyLayouts.test.ts) | Tests the calligraphyLayouts module, which allocates shared calligraphy layouts |
| [`calligraphyLayouts.ts`](src/core/papers/shared/calligraphyLayouts.ts) | Allocates shared calligraphy layouts |
| [`cjkCells.test.ts`](src/core/papers/shared/cjkCells.test.ts) | Tests the cjkCells module, which draws shared CJK practice cells and guides |
| [`cjkCells.ts`](src/core/papers/shared/cjkCells.ts) | Draws shared CJK practice cells and guides |
| [`columns.test.ts`](src/core/papers/shared/columns.test.ts) | Tests the columns module, which splits writable areas and draws column dividers |
| [`columns.ts`](src/core/papers/shared/columns.ts) | Splits writable areas and draws column dividers |
| [`englishGuides.ts`](src/core/papers/shared/englishGuides.ts) | Shares English writing guides, headers, and tracing text wrapping |
| [`forms.test.ts`](src/core/papers/shared/forms.test.ts) | Tests the forms module, which draws form sections and fill-in rules |
| [`forms.ts`](src/core/papers/shared/forms.ts) | Draws form sections and fill-in rules |
| [`grids.test.ts`](src/core/papers/shared/grids.test.ts) | Tests the grids module, which calculates and draws reusable grid geometry |
| [`grids.ts`](src/core/papers/shared/grids.ts) | Calculates and draws reusable grid geometry |
| [`guides.test.ts`](src/core/papers/shared/guides.test.ts) | Tests the guides module, which calculates and draws shared writing guides |
| [`guides.ts`](src/core/papers/shared/guides.ts) | Calculates and draws shared writing guides |
| [`mizigeCells.test.ts`](src/core/papers/shared/mizigeCells.test.ts) | Tests the mizigeCells module, which draws reusable Mi calligraphy cells |
| [`mizigeCells.ts`](src/core/papers/shared/mizigeCells.ts) | Draws reusable Mi calligraphy cells |
| [`musicStaff.test.ts`](src/core/papers/shared/musicStaff.test.ts) | Tests the musicStaff module, which draws shared music and tablature rules |
| [`musicStaff.ts`](src/core/papers/shared/musicStaff.ts) | Draws shared music and tablature rules |
| [`worksheets.ts`](src/core/papers/shared/worksheets.ts) | Lays out shared worksheet headers and rules |

### `src/core/render`

| File | Purpose |
| --- | --- |
| [`color.test.ts`](src/core/render/color.test.ts) | Tests the color module, which parses colors for output renderers |
| [`color.ts`](src/core/render/color.ts) | Parses colors for output renderers |
| [`pathData.test.ts`](src/core/render/pathData.test.ts) | Tests the pathData module, which parses vector path commands |
| [`pathData.ts`](src/core/render/pathData.ts) | Parses vector path commands |
| [`pdf.test.ts`](src/core/render/pdf.test.ts) | Tests the pdf module, which renders scenes to PDF pages |
| [`pdf.ts`](src/core/render/pdf.ts) | Renders scenes to PDF pages |
| [`raster.test.ts`](src/core/render/raster.test.ts) | Tests the raster module, which draws scenes to canvas for PNG export |
| [`raster.ts`](src/core/render/raster.ts) | Draws scenes to canvas for PNG export |
| [`svg.test.ts`](src/core/render/svg.test.ts) | Tests the svg module, which converts a scene to SVG |
| [`svg.ts`](src/core/render/svg.ts) | Converts a scene to SVG |
| [`textRaster.test.ts`](src/core/render/textRaster.test.ts) | Tests the textRaster module, which rasterizes text that needs browser fonts in PDF |
| [`textRaster.ts`](src/core/render/textRaster.ts) | Rasterizes text that needs browser fonts in PDF |

### `src/core/scene`

| File | Purpose |
| --- | --- |
| [`builders.test.ts`](src/core/scene/builders.test.ts) | Tests the builders module, which creates shared scene primitives |
| [`builders.ts`](src/core/scene/builders.ts) | Creates shared scene primitives |
| [`geometry.test.ts`](src/core/scene/geometry.test.ts) | Tests the geometry module, which provides sizing, positioning, and rounding calculations |
| [`geometry.ts`](src/core/scene/geometry.ts) | Provides sizing, positioning, and rounding calculations |
| [`types.ts`](src/core/scene/types.ts) | Defines scene primitives, coordinates, and drawing attributes |

### `src/core/testing`

| File | Purpose |
| --- | --- |
| [`paperTestKit.test.ts`](src/core/testing/paperTestKit.test.ts) | Tests the paperTestKit module, which provides shared paper-scene fixtures and assertion helpers |
| [`paperTestKit.ts`](src/core/testing/paperTestKit.ts) | Provides shared paper-scene fixtures and assertion helpers |

### `src/i18n`

| File | Purpose |
| --- | --- |
| [`en.ts`](src/i18n/en.ts) | Supplies English interface messages |
| [`i18n.test.ts`](src/i18n/i18n.test.ts) | Tests translation dictionaries and fallback |
| [`index.ts`](src/i18n/index.ts) | Loads translation dictionaries and supplies translators |
| [`zh-CN.ts`](src/i18n/zh-CN.ts) | Supplies Simplified Chinese interface messages |

### `src/ui`

| File | Purpose |
| --- | --- |
| [`A7c.test.tsx`](src/ui/A7c.test.tsx) | Tests preview, gallery, and export integration |
| [`App.tsx`](src/ui/App.tsx) | Assembles the editor, settings, and preview |
| [`InfoModal.test.tsx`](src/ui/InfoModal.test.tsx) | Tests the InfoModal module, which displays the guide and about dialogs |
| [`interfaceStyle.ts`](src/ui/interfaceStyle.ts) | Defines switchable interface styles |
| [`palettes.ts`](src/ui/palettes.ts) | Defines selectable interface color swatches |

### `src/ui/controls`

| File | Purpose |
| --- | --- |
| [`ColorField.tsx`](src/ui/controls/ColorField.tsx) | Displays color inputs and preset swatches |
| [`controls.test.tsx`](src/ui/controls/controls.test.tsx) | Tests shared form controls |
| [`NumberField.tsx`](src/ui/controls/NumberField.tsx) | Accepts and commits bounded numbers |
| [`OptionFieldRenderer.tsx`](src/ui/controls/OptionFieldRenderer.tsx) | Maps declared paper options to form controls |
| [`Section.tsx`](src/ui/controls/Section.tsx) | Displays a collapsible settings section |
| [`SelectField.tsx`](src/ui/controls/SelectField.tsx) | Provides a select input |
| [`SliderField.tsx`](src/ui/controls/SliderField.tsx) | Provides a range slider |
| [`TextField.tsx`](src/ui/controls/TextField.tsx) | Provides a text input |
| [`ToggleField.tsx`](src/ui/controls/ToggleField.tsx) | Provides a boolean toggle |
| [`UiIcon.tsx`](src/ui/controls/UiIcon.tsx) | Draws shared interface icons |

### `src/ui/export`

| File | Purpose |
| --- | --- |
| [`download.test.ts`](src/ui/export/download.test.ts) | Tests the download module, which saves generated files through the browser |
| [`download.ts`](src/ui/export/download.ts) | Saves generated files through the browser |
| [`exporters.test.ts`](src/ui/export/exporters.test.ts) | Tests the exporters module, which orchestrates PDF, SVG, and PNG exports |
| [`exporters.ts`](src/ui/export/exporters.ts) | Orchestrates PDF, SVG, and PNG exports |

### `src/ui/gallery`

| File | Purpose |
| --- | --- |
| [`TemplateGallery.tsx`](src/ui/gallery/TemplateGallery.tsx) | Displays, filters, and applies paper templates |

### `src/ui/i18n`

| File | Purpose |
| --- | --- |
| [`LocaleProvider.test.tsx`](src/ui/i18n/LocaleProvider.test.tsx) | Tests the LocaleProvider module, which stores and provides the active interface locale |
| [`LocaleProvider.tsx`](src/ui/i18n/LocaleProvider.tsx) | Stores and provides the active interface locale |

### `src/ui/layout`

| File | Purpose |
| --- | --- |
| [`ControlPanel.tsx`](src/ui/layout/ControlPanel.tsx) | Assembles the left settings panel |
| [`ExportBar.tsx`](src/ui/layout/ExportBar.tsx) | Provides export, resolution, and print actions |
| [`Footer.tsx`](src/ui/layout/Footer.tsx) | Displays copyright and usage notes |
| [`Header.tsx`](src/ui/layout/Header.tsx) | Displays the site identity, navigation, and interface actions |
| [`InfoModal.tsx`](src/ui/layout/InfoModal.tsx) | Displays the guide and about dialogs |
| [`Workspace.tsx`](src/ui/layout/Workspace.tsx) | Arranges responsive settings and preview panels |

### `src/ui/preview`

| File | Purpose |
| --- | --- |
| [`Preview.tsx`](src/ui/preview/Preview.tsx) | Renders paper previews and handles zoom |
| [`useElementWidth.ts`](src/ui/preview/useElementWidth.ts) | Observes the available preview width |

### `src/ui/print`

| File | Purpose |
| --- | --- |
| [`printCss.test.ts`](src/ui/print/printCss.test.ts) | Tests the printCss module, which builds print CSS for the selected paper dimensions |
| [`printCss.ts`](src/ui/print/printCss.ts) | Builds print CSS for the selected paper dimensions |

### `src/ui/sections`

| File | Purpose |
| --- | --- |
| [`BackgroundSection.tsx`](src/ui/sections/BackgroundSection.tsx) | Configures paper colors and textures |
| [`DecorationSection.tsx`](src/ui/sections/DecorationSection.tsx) | Configures page borders and decorations |
| [`LineSection.tsx`](src/ui/sections/LineSection.tsx) | Configures rule color, width, pattern, and spacing |
| [`MarginsSection.tsx`](src/ui/sections/MarginsSection.tsx) | Configures the four paper margins |
| [`OptionsSection.tsx`](src/ui/sections/OptionsSection.tsx) | Displays settings specific to the current paper |
| [`PageSizeSection.tsx`](src/ui/sections/PageSizeSection.tsx) | Selects paper size and orientation |
| [`PagesSection.tsx`](src/ui/sections/PagesSection.tsx) | Configures page count and numbering |
| [`PaperTypeSection.tsx`](src/ui/sections/PaperTypeSection.tsx) | Groups and selects paper types |
| [`sections.test.tsx`](src/ui/sections/sections.test.tsx) | Tests basic paper controls |
| [`sections2.test.tsx`](src/ui/sections/sections2.test.tsx) | Tests line and margin controls |
| [`sections3.test.tsx`](src/ui/sections/sections3.test.tsx) | Tests paper appearance controls |
| [`sections4.test.tsx`](src/ui/sections/sections4.test.tsx) | Tests watermark and page controls |
| [`sections5.test.tsx`](src/ui/sections/sections5.test.tsx) | Tests settings import and export |
| [`ThemeSection.tsx`](src/ui/sections/ThemeSection.tsx) | Selects paper color and typography themes |
| [`TransferSection.tsx`](src/ui/sections/TransferSection.tsx) | Imports and exports paper settings |
| [`WatermarkSection.tsx`](src/ui/sections/WatermarkSection.tsx) | Configures watermark text and placement |

### `src/ui/store`

| File | Purpose |
| --- | --- |
| [`SettingsProvider.test.tsx`](src/ui/store/SettingsProvider.test.tsx) | Tests the SettingsProvider module, which provides paper settings state and update actions |
| [`SettingsProvider.tsx`](src/ui/store/SettingsProvider.tsx) | Provides paper settings state and update actions |
| [`settingsStorage.test.ts`](src/ui/store/settingsStorage.test.ts) | Tests the settingsStorage module, which reads and writes persisted browser settings |
| [`settingsStorage.ts`](src/ui/store/settingsStorage.ts) | Reads and writes persisted browser settings |
| [`urlState.test.ts`](src/ui/store/urlState.test.ts) | Tests the urlState module, which handles settings fragments from shared links |
| [`urlState.ts`](src/ui/store/urlState.ts) | Handles settings fragments from shared links |

### `./`

| File | Purpose |
| --- | --- |
| [`vite.config.ts`](vite.config.ts) | Configures Vite builds and Vitest |

## Privacy

Settings live in `localStorage`; during normal editing the address stays clean, and legacy `#s=…` links load their settings and clear the fragment; uploaded background images exist only as data URLs in local memory. There are no network requests, no analytics and no third-party fonts.

## License

[MIT](LICENSE) · © 2026 skyow.

## Notes

This is an independently implemented open-source tool; its code, interface, wording and colour palette are original. It offers the set of features commonly found in custom printable-paper generators and is not affiliated with any similar website.
