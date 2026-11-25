# Paper by Choice

**Generate the printable paper you want, right in your browser.** Ruled, grid, dot, music staves, calligraphy practice grids, Chinese handwriting worksheets, Cornell notes and more. Pick a paper, adjust size, colours, spacing and margins, see a live preview, then export SVG / PNG / PDF or print.

Fully client-side. No backend, no account, no telemetry. **Everything runs in your browser; the text you type and the images you upload never leave your machine.**

## Features

- **40+ paper types**: basic grids, music and guitar tablature, Chinese school worksheets (pinyin, tianzi, composition, arithmetic, English four-line), calligraphy practice grids (mizige, huigongge, jiugongge and a parametric practice sheet with many presets), plus notes and forms (Cornell, meeting notes, project planning, error correction, bilingual vocabulary drills).
- **Page setup**: A4 / A5 / A3 / B4 / B5 / Letter / Legal / Tabloid / Executive / custom size; portrait and landscape; two-column layout for selected papers; 1–100 pages.
- **Appearance**: 13 themes, line colour / style / width / spacing, four independent margins, 7 background textures, a custom background image, 5 border decorations (including scalloped borders and a calligraphy frame), tiled watermark, page numbering.
- **Template gallery**: every paper ships with presets; settings can be exported to JSON, imported later, or shared via a link.
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

Self-host with Docker:

```bash
docker build -t paper-by-choice .
docker run -p 8080:80 paper-by-choice
```

## Printing tips

When printing (or opening the exported PDF), choose **"Actual size / 100%"**, turn off the browser's headers and footers, and set the paper size to match your page settings. Page geometry is generated in exact millimetres; any scaling breaks the physical ruling.

> Lines and grids in the PDF are vector. The few labels printed on the paper are embedded as 600 DPI transparent patches rather than a bundled multi-megabyte CJK font, so that text is not selectable in the PDF — but it stays sharp in print.

## How it works

A paper's `render()` never writes SVG, Canvas or PDF directly. It returns a list of _scene primitives_ in **millimetres** (lines, rectangles, arcs, paths, text, images). The screen preview, SVG, PNG, PDF and printing all render from the same scene, so what you see is what you get and the physical line spacing stays exact.

Adding a paper means adding one file: `src/core/papers/<name>.ts` default-exports `definePaper({...})`, declaring the spacing parameter, the schema of its type-specific options, its presets and its render function. The registry discovers files automatically and the control panel builds itself from the declaration. See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/design.zh-CN.md](docs/design.zh-CN.md).

## Stack

React 19 · TypeScript 5.9 · Vite 8 · pdf-lib · Vitest. The only runtime dependencies are React, React DOM and pdf-lib.

## Privacy

Settings live in `localStorage`; link sharing encodes them in the URL fragment (`#s=…`, which is never sent to a server); uploaded background images exist only as data URLs in local memory. There are no network requests, no analytics and no third-party fonts.

## License

[MIT](LICENSE). Replace `<YOUR NAME>` in the copyright line before publishing.

## Notes

This is an independently implemented open-source tool; its code, interface, wording and colour palette are original. It offers the set of features commonly found in custom printable-paper generators and is not affiliated with any similar website.
