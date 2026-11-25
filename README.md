# 纸随心 Paper by Choice

[English](README.en.md) · [在线使用](https://paper-by-choice.pages.dev/) · 创建者 **skyow**

**在浏览器里生成你想要的打印纸。** 横线纸、方格纸、点阵纸、乐谱纸、书法练字格、中文作业纸、康奈尔笔记……选一种纸，调好尺寸、颜色、间距、边距，实时预览，然后导出 SVG / PNG / PDF 或直接打印。

纯前端、零后端、零账号、零遥测。**所有计算都在你的浏览器里完成，你输入的文字和上传的图片不会离开本机。**

## 功能

- **40+ 种纸张类型**：基础格纸、乐谱与吉他谱、中文作业纸（拼音 / 田字格 / 作文 / 算术 / 英语四线三格）、书法练习格（米字格 / 回宫格 / 九宫格 / 回米格 / 硬笔书法纸 / 参数化书法练字格）、笔记与表单（康奈尔、会议记录、项目规划、错题整理、汉英互译等）。
- **页面设置**：A4 / A5 / A3 / B4 / B5 / Letter / Legal / Tabloid / Executive / 自定义尺寸；纵向与横向；部分纸型支持左右两栏（试卷分栏）；1–100 页。
- **外观**：13 套主题色板、线条颜色 / 线型 / 粗细 / 间距、四边独立边距、7 种背景纹理、自定义背景图、5 种页面边框装饰（含花边与书法框）、重复文字水印、页码。
- **模板库**：每种纸都有预设模板，一点即用；也可以把自己调好的设置导出成 JSON，下次导入或分享给其他人。
- **导出**：SVG（多页合并为一个矢量文件）、PNG（每页一张，可选 150 / 300 / 600 DPI）、PDF（**矢量线条**，任何阅读器都能无损缩放）；打印为真正的矢量页面，文字保持字体。
- **中英双语**：界面与纸面上的标签都随语言切换。
- **离线可用**：构建产物是一堆静态文件，可以放在任何静态托管、GitHub Pages、NAS 上，不需要服务器。

## 快速开始

```bash
pnpm install
pnpm dev          # 打开终端里给出的地址
```

要求 Node.js 20.19+ 或 22.12+，pnpm 10+。

构建与检查：

```bash
pnpm build        # 产物在 dist/，相对路径，可放在任何子目录
pnpm preview      # 本地预览构建产物
pnpm check        # lint + typecheck + test + build
```

## 部署

### 构建静态站点

使用 Node.js 20.19+（20.x）或 22.12+、pnpm 10+。在仓库根目录运行：

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm preview --host 127.0.0.1
```

发布整个 `dist/` 的内容，保留 `index.html`、`favicon.svg` 和 `assets/` 的相对位置。每次更新都重新构建并上传完整目录。应用只需要静态 HTTP 托管，无需数据库、环境密钥或运行时 Node.js。

### Cloudflare Pages

**直接上传**（本项目线上采用此方式）：

1. 构建后在 Cloudflare 控制台打开 **Workers & Pages → Create application → Pages → Upload assets**。
2. 输入项目名，上传 `dist/`。已有项目直接在项目中创建生产部署，无需重建项目。
3. 发布后访问面板给出的 `*.pages.dev` 地址，检查纸张预览和 PDF 导出。

也可以使用 Wrangler。以下命令在项目根目录运行；创建项目的命令只需首次运行：

```bash
pnpm dlx wrangler login
pnpm dlx wrangler pages project create paper-by-choice --production-branch main
pnpm dlx wrangler pages deploy dist --project-name paper-by-choice --branch main
```

**从 Git 自动构建**：需新建一个连接 Git 的 Pages 项目。连接 GitHub 仓库后，设置生产分支为 `main`、根目录为仓库根目录、构建命令为 `pnpm build`、输出目录为 `dist`。在构建环境选用匹配的 Node.js 与 pnpm 版本。已有的直接上传项目可以继续通过 Wrangler 更新。

[Cloudflare Pages 直接上传文档](https://developers.cloudflare.com/pages/get-started/direct-upload/) · [Git 集成文档](https://developers.cloudflare.com/pages/get-started/git-integration/)

### GitHub Pages

在仓库 **Settings → Pages → Build and deployment** 中将来源设为 **GitHub Actions**。在发布工作流中签出源码，配置 Node.js 和 pnpm，运行 `pnpm install --frozen-lockfile` 与 `pnpm build`。使用 `actions/upload-pages-artifact` 上传 `dist/`，再用 `actions/deploy-pages` 发布。部署作业需有 `pages: write` 和 `id-token: write` 权限，并使用 `github-pages` 环境。现有 CI 工作流只负责检查。Vite 使用相对资源路径，项目网站可部署在 `/<仓库名>/` 下。

[GitHub Pages 自定义工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

### Docker、NAS 或现有网站

```bash
docker build -t paper-by-choice .
docker run -d --name paper-by-choice --restart unless-stopped -p 8080:80 paper-by-choice
```

访问 `http://localhost:8080/`。在 NAS 上用 NAS 的 IP 替换 `localhost`，并确保 8080 端口可访问。升级时重建镜像并重建容器。也可以直接把 `dist/` 里的文件放到 Nginx、Apache 或 NAS 的静态目录。若部署到子目录，例如 `/paper-by-choice/`，用带末尾斜杠的地址访问。

## 打印建议

导出 PDF 或直接打印时，请在打印对话框里选择 **「实际大小 / 100%」**，关闭浏览器自带的页眉页脚，并把纸张尺寸设成与页面设置一致。页面尺寸按毫米精确生成，缩放会破坏物理行距。

> PDF 里的线条与格纸是矢量的；页面上的少量标签文字为了不内嵌十几兆的中文字库，以 600 DPI 的透明贴片嵌入，因此 PDF 中的文字不可选中，但清晰度足够打印。

## 工作原理

每种纸的渲染函数不直接写 SVG 或 Canvas，而是返回一组以**毫米**为坐标的「场景」图元（线、矩形、圆弧、路径、文字、图片）。屏幕预览、SVG、PNG、PDF 和打印全部从同一份场景渲染，所以所见即所得，且打印出来的行距、格径是真实物理尺寸。

新增一种纸只需要加一个文件：`src/core/papers/<名字>.ts` 默认导出 `definePaper({...})`，声明间距参数、专属配置的表单、预设与渲染函数。注册表自动发现，控制面板自动生成。详见 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [docs/design.zh-CN.md](docs/design.zh-CN.md)。

## 技术栈

React 19 · TypeScript 5.9 · Vite 8 · pdf-lib · Vitest。运行时依赖只有 React、React DOM 与 pdf-lib。

## 隐私

设置保存在浏览器的 `localStorage`；日常编辑保持短网址，旧的 `#s=…` 链接载入设置后会自动清除片段；上传的背景图只作为 data URL 存在于本机内存。项目没有网络请求、没有分析脚本、没有第三方字体。

## 许可证

[MIT](LICENSE) · © 2026 skyow。

## 致谢与说明

本项目是独立实现的开源工具，代码、界面、文案与配色均为原创。它提供的是「自定义打印纸生成器」这一类工具常见功能的集合，与任何同类网站没有关联。
