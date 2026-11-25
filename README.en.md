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

## Privacy

Settings live in `localStorage`; during normal editing the address stays clean, and legacy `#s=…` links load their settings and clear the fragment; uploaded background images exist only as data URLs in local memory. There are no network requests, no analytics and no third-party fonts.

## License

[MIT](LICENSE) · © 2026 skyow.

## Notes

This is an independently implemented open-source tool; its code, interface, wording and colour palette are original. It offers the set of features commonly found in custom printable-paper generators and is not affiliated with any similar website.
