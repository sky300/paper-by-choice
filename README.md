# 纸随心 Paper by Choice

[English](README.en.md) · [在线使用](https://sky300.github.io/paper-by-choice/) · 创建者 **skyow**

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

**GitHub Actions 自动发布**：现有直接上传项目可通过 [发布工作流](.github/workflows/deploy-cloudflare.yml) 随 `main` 更新自动构建并部署。到仓库 **Settings → Secrets and variables → Actions** 添加 `CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_API_TOKEN`。令牌只需目标 Cloudflare 账户的 **Cloudflare Pages: Edit** 权限。凭证只保存在 GitHub Secrets。也可在 **Actions → Deploy to Cloudflare Pages** 手动运行。

也可以使用 Wrangler。以下命令在项目根目录运行；创建项目的命令只需首次运行：

```bash
pnpm dlx wrangler login
pnpm dlx wrangler pages project create paper-by-choice --production-branch main
pnpm dlx wrangler pages deploy dist --project-name paper-by-choice --branch main
```

**从 Git 自动构建**：需新建一个连接 Git 的 Pages 项目。连接 GitHub 仓库后，设置生产分支为 `main`、根目录为仓库根目录、构建命令为 `pnpm build`、输出目录为 `dist`。在构建环境选用匹配的 Node.js 与 pnpm 版本。已有的直接上传项目可以继续通过 Wrangler 更新。

[Cloudflare Pages 直接上传文档](https://developers.cloudflare.com/pages/get-started/direct-upload/) · [Git 集成文档](https://developers.cloudflare.com/pages/get-started/git-integration/)

### GitHub Pages

在仓库 **Settings → Pages → Build and deployment** 中将来源设为 **GitHub Actions**。仓库自带的 [GitHub Pages 发布工作流](.github/workflows/deploy-github-pages.yml) 会在推送到 `main` 后自动构建并发布 `dist/`，也可以在 **Actions → Deploy to GitHub Pages → Run workflow** 手动触发。Vite 使用相对资源路径，可直接部署到 `/<仓库名>/`。

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

## 英文作业纸

左侧「英文作业纸」包含四线三格、美式三线、双线定位、双色斜线定位、英文描红、英文听写、英文词汇积累、英语图文写作和汉英互译。天空、草地、泥土三色定位和灰阶定位放在四线三格的预设里。

- **纸幅**默认 A4（210 × 297 mm），依据 [ISO 216](https://www.iso.org/standard/36631.html)。新英文纸型采用 18 mm 等宽页边距、白底和深蓝灰线，边距和颜色可调。
- **四线三格**相邻线默认相距 4 mm，整组高 12 mm，紧凑预设为 9 mm。参考 [GB 40070—2021 第 6.2.1 条](https://www.ndcpa.gov.cn/jbkzzx/c100202/2019681064660144128/qAABzXz4.pdf) 对小学英语练习簿格线高度的下限。
- **美式三线**行组节距为 15.875 mm 或 19.05 mm，取自 [Zaner-Bloser](https://media.zaner-bloser.com/pdfs/zaner-bloser-handwriting-c2020-renewal-form.pdf) 的 5/8 英寸和 3/4 英寸标称规格。这里将标称尺寸应用为行组节距，内部格线比例由本项目设定。
- **其他默认值**由本项目按练习用途设定。双线定位默认行组节距 16 mm、双线间距 6 mm，听写行高 10 mm，词汇积累行高 14 mm。浅色定位色带可切换为灰阶。

## 项目结构

下表按目录列出每个 TypeScript 和 TSX 文件，包括测试。

### `src`

| 文件                               | 用途                                      |
| ---------------------------------- | ----------------------------------------- |
| [`App.test.tsx`](src/App.test.tsx) | 验证 App 模块的行为（挂载应用的对外入口） |
| [`App.tsx`](src/App.tsx)           | 挂载应用的对外入口                        |
| [`main.tsx`](src/main.tsx)         | 初始化 React 根节点并加载全局样式         |

### `src/core/compose`

| 文件                                                        | 用途                                                       |
| ----------------------------------------------------------- | ---------------------------------------------------------- |
| [`background.test.ts`](src/core/compose/background.test.ts) | 验证 background 模块的行为（生成纸张底色、纹理与背景图片） |
| [`background.ts`](src/core/compose/background.ts)           | 生成纸张底色、纹理与背景图片                               |
| [`decoration.test.ts`](src/core/compose/decoration.test.ts) | 验证 decoration 模块的行为（绘制边框及纸面装饰）           |
| [`decoration.ts`](src/core/compose/decoration.ts)           | 绘制边框及纸面装饰                                         |
| [`document.test.ts`](src/core/compose/document.test.ts)     | 验证 document 模块的行为（组合纸型、背景、装饰和水印场景） |
| [`document.ts`](src/core/compose/document.ts)               | 组合纸型、背景、装饰和水印场景                             |
| [`watermark.test.ts`](src/core/compose/watermark.test.ts)   | 验证 watermark 模块的行为（布局并绘制纸张水印）            |
| [`watermark.ts`](src/core/compose/watermark.ts)             | 布局并绘制纸张水印                                         |

### `src/core`

| 文件                                                | 用途                                                       |
| --------------------------------------------------- | ---------------------------------------------------------- |
| [`encoding.test.ts`](src/core/encoding.test.ts)     | 验证 encoding 模块的行为（编解码可分享的纸张设置）         |
| [`encoding.ts`](src/core/encoding.ts)               | 编解码可分享的纸张设置                                     |
| [`paperLooks.ts`](src/core/paperLooks.ts)           | 集中定义各纸型的默认线条、间距和页边距                     |
| [`paperSizes.test.ts`](src/core/paperSizes.test.ts) | 验证 paperSizes 模块的行为（管理纸张规格、方向和打印单位） |
| [`paperSizes.ts`](src/core/paperSizes.ts)           | 管理纸张规格、方向和打印单位                               |
| [`settings.test.ts`](src/core/settings.test.ts)     | 验证 settings 模块的行为（创建、合并与校验纸张设置）       |
| [`settings.ts`](src/core/settings.ts)               | 创建、合并与校验纸张设置                                   |
| [`themes.test.ts`](src/core/themes.test.ts)         | 验证 themes 模块的行为（定义纸张排版的配色及字体主题）     |
| [`themes.ts`](src/core/themes.ts)                   | 定义纸张排版的配色及字体主题                               |
| [`types.ts`](src/core/types.ts)                     | 定义纸张设置与页面数据类型                                 |

### `src/core/papers`

| 文件                                                                                       | 用途                                                                 |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| [`arithmeticPaper.ts`](src/core/papers/arithmeticPaper.ts)                                 | 绘制带姓名栏与日期栏的算术纸                                         |
| [`b6Declaration.test.ts`](src/core/papers/b6Declaration.test.ts)                           | 验证纸型的独立声明与注册                                             |
| [`blank.test.ts`](src/core/papers/blank.test.ts)                                           | 验证 blank 模块的行为（生成无格线的空白纸）                          |
| [`blank.ts`](src/core/papers/blank.ts)                                                     | 生成无格线的空白纸                                                   |
| [`branded.test.ts`](src/core/papers/branded.test.ts)                                       | 验证 branded 模块的行为（生成带品牌信息的定制纸）                    |
| [`branded.ts`](src/core/papers/branded.ts)                                                 | 生成带品牌信息的定制纸                                               |
| [`calligraphy.test.ts`](src/core/papers/calligraphy.test.ts)                               | 验证 calligraphy 模块的行为（绘制基础书法练习纸）                    |
| [`calligraphy.ts`](src/core/papers/calligraphy.ts)                                         | 绘制基础书法练习纸                                                   |
| [`calligraphyPractice.test.ts`](src/core/papers/calligraphyPractice.test.ts)               | 验证 calligraphyPractice 模块的行为（绘制书法练字格）                |
| [`calligraphyPractice.ts`](src/core/papers/calligraphyPractice.ts)                         | 绘制书法练字格                                                       |
| [`childrenDrawing.test.ts`](src/core/papers/childrenDrawing.test.ts)                       | 验证 childrenDrawing 模块的行为（生成儿童涂鸦纸的绘画区域）          |
| [`childrenDrawing.ts`](src/core/papers/childrenDrawing.ts)                                 | 生成儿童涂鸦纸的绘画区域                                             |
| [`chineseEnglishWordPractice.test.ts`](src/core/papers/chineseEnglishWordPractice.test.ts) | 验证 chineseEnglishWordPractice 模块的行为（生成汉英互译单词练习纸） |
| [`chineseEnglishWordPractice.ts`](src/core/papers/chineseEnglishWordPractice.ts)           | 生成汉英互译单词练习纸                                               |
| [`chinesePreviewCard.test.ts`](src/core/papers/chinesePreviewCard.test.ts)                 | 验证 chinesePreviewCard 模块的行为（生成语文预习卡）                 |
| [`chinesePreviewCard.ts`](src/core/papers/chinesePreviewCard.ts)                           | 生成语文预习卡                                                       |
| [`chinesetianzi.test.ts`](src/core/papers/chinesetianzi.test.ts)                           | 验证 chinesetianzi 模块的行为（绘制田字格及内部辅助线）              |
| [`chinesetianzi.ts`](src/core/papers/chinesetianzi.ts)                                     | 绘制田字格及内部辅助线                                               |
| [`compositionPaper.ts`](src/core/papers/compositionPaper.ts)                               | 生成分行排列的作文方格                                               |
| [`contract.ts`](src/core/papers/contract.ts)                                               | 声明纸型、选项、预设及渲染接口                                       |
| [`cornell.test.ts`](src/core/papers/cornell.test.ts)                                       | 验证 cornell 模块的行为（布局康奈尔笔记的线索、笔记和总结区）        |
| [`cornell.ts`](src/core/papers/cornell.ts)                                                 | 布局康奈尔笔记的线索、笔记和总结区                                   |
| [`creativeLog.test.ts`](src/core/papers/creativeLog.test.ts)                               | 验证 creativeLog 模块的行为（布局创意记录区）                        |
| [`creativeLog.ts`](src/core/papers/creativeLog.ts)                                         | 布局创意记录区                                                       |
| [`crossgrid.test.ts`](src/core/papers/crossgrid.test.ts)                                   | 验证 crossgrid 模块的行为（绘制交叉格书写辅助线）                    |
| [`crossgrid.ts`](src/core/papers/crossgrid.ts)                                             | 绘制交叉格书写辅助线                                                 |
| [`define.test.ts`](src/core/papers/define.test.ts)                                         | 验证 define 模块的行为（将带具体选项类型的纸型注册为通用纸型）       |
| [`define.ts`](src/core/papers/define.ts)                                                   | 将带具体选项类型的纸型注册为通用纸型                                 |
| [`dot.test.ts`](src/core/papers/dot.test.ts)                                               | 验证 dot 模块的行为（绘制点阵纸）                                    |
| [`dot.ts`](src/core/papers/dot.ts)                                                         | 绘制点阵纸                                                           |
| [`englishDictation.ts`](src/core/papers/englishDictation.ts)                               | 布局英文听写编号和订正栏                                             |
| [`englishDoubleLine.ts`](src/core/papers/englishDoubleLine.ts)                             | 绘制标出字母主体区域的双线定位纸                                     |
| [`englishDrawWrite.ts`](src/core/papers/englishDrawWrite.ts)                               | 组合绘画区和英文书写区                                               |
| [`englishPaper.ts`](src/core/papers/englishPaper.ts)                                       | 绘制四线三格及彩色、灰阶定位预设                                     |
| [`englishPrimary.ts`](src/core/papers/englishPrimary.ts)                                   | 绘制美式三线练习格和虚线中线                                         |
| [`englishSlanted.ts`](src/core/papers/englishSlanted.ts)                                   | 绘制带红色基线和浅色斜线的英语定位纸                                 |
| [`englishTracing.ts`](src/core/papers/englishTracing.ts)                                   | 将示例分成示范、描红和独写行                                         |
| [`englishVocabulary.ts`](src/core/papers/englishVocabulary.ts)                             | 绘制单词、释义和例句三栏表格                                         |
| [`englishWorksheets.test.ts`](src/core/papers/englishWorksheets.test.ts)                   | 验证英文作业纸的分组、节距和描红                                     |
| [`errorCorrection.test.ts`](src/core/papers/errorCorrection.test.ts)                       | 验证 errorCorrection 模块的行为（布局错题整理区）                    |
| [`errorCorrection.ts`](src/core/papers/errorCorrection.ts)                                 | 布局错题整理区                                                       |
| [`exportVerification.test.ts`](src/core/papers/exportVerification.test.ts)                 | 验证各纸型和预设的导出                                               |
| [`geometryPapers.test.ts`](src/core/papers/geometryPapers.test.ts)                         | 验证几何纸型的尺寸与布局                                             |
| [`grid.test.ts`](src/core/papers/grid.test.ts)                                             | 验证 grid 模块的行为（生成等距方格）                                 |
| [`grid.ts`](src/core/papers/grid.ts)                                                       | 生成等距方格                                                         |
| [`guitarStaffTab.test.ts`](src/core/papers/guitarStaffTab.test.ts)                         | 验证 guitarStaffTab 模块的行为（组合五线谱和吉他六线谱）             |
| [`guitarStaffTab.ts`](src/core/papers/guitarStaffTab.ts)                                   | 组合五线谱和吉他六线谱                                               |
| [`guitarTab.test.ts`](src/core/papers/guitarTab.test.ts)                                   | 验证 guitarTab 模块的行为（绘制吉他六线谱）                          |
| [`guitarTab.ts`](src/core/papers/guitarTab.ts)                                             | 绘制吉他六线谱                                                       |
| [`hardpenCalligraphyPaper.test.ts`](src/core/papers/hardpenCalligraphyPaper.test.ts)       | 验证 hardpenCalligraphyPaper 模块的行为（布局硬笔书法练习纸）        |
| [`hardpenCalligraphyPaper.ts`](src/core/papers/hardpenCalligraphyPaper.ts)                 | 布局硬笔书法练习纸                                                   |
| [`hardpenHuigongge.test.ts`](src/core/papers/hardpenHuigongge.test.ts)                     | 验证 hardpenHuigongge 模块的行为（绘制长方回宫格）                   |
| [`hardpenHuigongge.ts`](src/core/papers/hardpenHuigongge.ts)                               | 绘制长方回宫格                                                       |
| [`hexagonal.ts`](src/core/papers/hexagonal.ts)                                             | 绘制六边形网格                                                       |
| [`huigongge.test.ts`](src/core/papers/huigongge.test.ts)                                   | 验证 huigongge 模块的行为（绘制回宫格）                              |
| [`huigongge.ts`](src/core/papers/huigongge.ts)                                             | 绘制回宫格                                                           |
| [`huimige.test.ts`](src/core/papers/huimige.test.ts)                                       | 验证 huimige 模块的行为（绘制回米格）                                |
| [`huimige.ts`](src/core/papers/huimige.ts)                                                 | 绘制回米格                                                           |
| [`isometric.ts`](src/core/papers/isometric.ts)                                             | 绘制等距网格                                                         |
| [`jiugongge.test.ts`](src/core/papers/jiugongge.test.ts)                                   | 验证 jiugongge 模块的行为（绘制九宫格）                              |
| [`jiugongge.ts`](src/core/papers/jiugongge.ts)                                             | 绘制九宫格                                                           |
| [`kit.test.ts`](src/core/papers/kit.test.ts)                                               | 验证 kit 模块的行为（构造纸型渲染所用的线条与字体工具）              |
| [`kit.ts`](src/core/papers/kit.ts)                                                         | 构造纸型渲染所用的线条与字体工具                                     |
| [`lined.test.ts`](src/core/papers/lined.test.ts)                                           | 验证 lined 模块的行为（绘制横线纸）                                  |
| [`lined.ts`](src/core/papers/lined.ts)                                                     | 绘制横线纸                                                           |
| [`meetingNote.test.ts`](src/core/papers/meetingNote.test.ts)                               | 验证 meetingNote 模块的行为（布局会议记录区）                        |
| [`meetingNote.ts`](src/core/papers/meetingNote.ts)                                         | 布局会议记录区                                                       |
| [`minimalJournal.test.ts`](src/core/papers/minimalJournal.test.ts)                         | 验证 minimalJournal 模块的行为（生成简约手账纸）                     |
| [`minimalJournal.ts`](src/core/papers/minimalJournal.ts)                                   | 生成简约手账纸                                                       |
| [`mizige.ts`](src/core/papers/mizige.ts)                                                   | 绘制带对角辅助线的米字格                                             |
| [`music.test.ts`](src/core/papers/music.test.ts)                                           | 验证 music 模块的行为（绘制五线谱）                                  |
| [`music.ts`](src/core/papers/music.ts)                                                     | 绘制五线谱                                                           |
| [`paperContract.test.ts`](src/core/papers/paperContract.test.ts)                           | 验证纸型选项及渲染约束                                               |
| [`pinyinPaper.ts`](src/core/papers/pinyinPaper.ts)                                         | 布局汉语拼音练习行                                                   |
| [`pinyinTianzi.ts`](src/core/papers/pinyinTianzi.ts)                                       | 组合拼音行与等宽等高的田字格                                         |
| [`practicePaper.ts`](src/core/papers/practicePaper.ts)                                     | 绘制通用练习纸                                                       |
| [`projectPlanning.test.ts`](src/core/papers/projectPlanning.test.ts)                       | 验证 projectPlanning 模块的行为（组合项目信息、甘特图和任务列表）    |
| [`projectPlanning.ts`](src/core/papers/projectPlanning.ts)                                 | 组合项目信息、甘特图和任务列表                                       |
| [`registry.test.ts`](src/core/papers/registry.test.ts)                                     | 验证 registry 模块的行为（注册全部纸型、排序并解析纸型预设）         |
| [`registry.ts`](src/core/papers/registry.ts)                                               | 注册全部纸型、排序并解析纸型预设                                     |
| [`seyes.ts`](src/core/papers/seyes.ts)                                                     | 绘制法式 Séyès 练习格                                                |
| [`sketch.test.ts`](src/core/papers/sketch.test.ts)                                         | 验证 sketch 模块的行为（生成草图纸）                                 |
| [`sketch.ts`](src/core/papers/sketch.ts)                                                   | 生成草图纸                                                           |
| [`storyboard.ts`](src/core/papers/storyboard.ts)                                           | 布局分镜框与注释区                                                   |
| [`studentNote.test.ts`](src/core/papers/studentNote.test.ts)                               | 验证 studentNote 模块的行为（布局学生笔记纸）                        |
| [`studentNote.ts`](src/core/papers/studentNote.ts)                                         | 布局学生笔记纸                                                       |
| [`svgRendering.test.ts`](src/core/papers/svgRendering.test.ts)                             | 验证各纸型的 SVG 输出                                                |
| [`verticalLined.ts`](src/core/papers/verticalLined.ts)                                     | 绘制竖线纸                                                           |
| [`vintageNote.test.ts`](src/core/papers/vintageNote.test.ts)                               | 验证 vintageNote 模块的行为（生成复古笔记纸）                        |
| [`vintageNote.ts`](src/core/papers/vintageNote.ts)                                         | 生成复古笔记纸                                                       |
| [`worksheetPapers.test.ts`](src/core/papers/worksheetPapers.test.ts)                       | 验证作业纸页眉与排版                                                 |

### `src/core/papers/shared`

| 文件                                                                              | 用途                                                           |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [`calligraphyLayouts.test.ts`](src/core/papers/shared/calligraphyLayouts.test.ts) | 验证 calligraphyLayouts 模块的行为（分配书法练习纸的共用布局） |
| [`calligraphyLayouts.ts`](src/core/papers/shared/calligraphyLayouts.ts)           | 分配书法练习纸的共用布局                                       |
| [`cjkCells.test.ts`](src/core/papers/shared/cjkCells.test.ts)                     | 验证 cjkCells 模块的行为（绘制汉字练习方格和常用辅助线）       |
| [`cjkCells.ts`](src/core/papers/shared/cjkCells.ts)                               | 绘制汉字练习方格和常用辅助线                                   |
| [`columns.test.ts`](src/core/papers/shared/columns.test.ts)                       | 验证 columns 模块的行为（拆分可写区域并绘制分栏线）            |
| [`columns.ts`](src/core/papers/shared/columns.ts)                                 | 拆分可写区域并绘制分栏线                                       |
| [`englishGuides.ts`](src/core/papers/shared/englishGuides.ts)                     | 共享英文书写格线、页眉和描红断行逻辑                           |
| [`forms.test.ts`](src/core/papers/shared/forms.test.ts)                           | 验证 forms 模块的行为（绘制表单分区与填空线）                  |
| [`forms.ts`](src/core/papers/shared/forms.ts)                                     | 绘制表单分区与填空线                                           |
| [`grids.test.ts`](src/core/papers/shared/grids.test.ts)                           | 验证 grids 模块的行为（计算并绘制可复用的网格几何）            |
| [`grids.ts`](src/core/papers/shared/grids.ts)                                     | 计算并绘制可复用的网格几何                                     |
| [`guides.test.ts`](src/core/papers/shared/guides.test.ts)                         | 验证 guides 模块的行为（计算并绘制共用书写辅助线）             |
| [`guides.ts`](src/core/papers/shared/guides.ts)                                   | 计算并绘制共用书写辅助线                                       |
| [`mizigeCells.test.ts`](src/core/papers/shared/mizigeCells.test.ts)               | 验证 mizigeCells 模块的行为（绘制可复用的米字格单元）          |
| [`mizigeCells.ts`](src/core/papers/shared/mizigeCells.ts)                         | 绘制可复用的米字格单元                                         |
| [`musicStaff.test.ts`](src/core/papers/shared/musicStaff.test.ts)                 | 验证 musicStaff 模块的行为（绘制五线谱与吉他谱的共用线组）     |
| [`musicStaff.ts`](src/core/papers/shared/musicStaff.ts)                           | 绘制五线谱与吉他谱的共用线组                                   |
| [`worksheets.ts`](src/core/papers/shared/worksheets.ts)                           | 布局作业纸页眉与共用格线                                       |

### `src/core/render`

| 文件                                                       | 用途                                                            |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| [`color.test.ts`](src/core/render/color.test.ts)           | 验证 color 模块的行为（解析渲染器所需的颜色值）                 |
| [`color.ts`](src/core/render/color.ts)                     | 解析渲染器所需的颜色值                                          |
| [`pathData.test.ts`](src/core/render/pathData.test.ts)     | 验证 pathData 模块的行为（解析形状的矢量路径指令）              |
| [`pathData.ts`](src/core/render/pathData.ts)               | 解析形状的矢量路径指令                                          |
| [`pdf.test.ts`](src/core/render/pdf.test.ts)               | 验证 pdf 模块的行为（将场景渲染为 PDF 页面）                    |
| [`pdf.ts`](src/core/render/pdf.ts)                         | 将场景渲染为 PDF 页面                                           |
| [`raster.test.ts`](src/core/render/raster.test.ts)         | 验证 raster 模块的行为（将场景绘制到 Canvas 供 PNG 导出）       |
| [`raster.ts`](src/core/render/raster.ts)                   | 将场景绘制到 Canvas 供 PNG 导出                                 |
| [`svg.test.ts`](src/core/render/svg.test.ts)               | 验证 svg 模块的行为（将场景转换为 SVG）                         |
| [`svg.ts`](src/core/render/svg.ts)                         | 将场景转换为 SVG                                                |
| [`textRaster.test.ts`](src/core/render/textRaster.test.ts) | 验证 textRaster 模块的行为（栅格化 PDF 中需要浏览器字体的文本） |
| [`textRaster.ts`](src/core/render/textRaster.ts)           | 栅格化 PDF 中需要浏览器字体的文本                               |

### `src/core/scene`

| 文件                                                  | 用途                                                 |
| ----------------------------------------------------- | ---------------------------------------------------- |
| [`builders.test.ts`](src/core/scene/builders.test.ts) | 验证 builders 模块的行为（创建统一的场景图元）       |
| [`builders.ts`](src/core/scene/builders.ts)           | 创建统一的场景图元                                   |
| [`geometry.test.ts`](src/core/scene/geometry.test.ts) | 验证 geometry 模块的行为（提供尺寸、定位和取整运算） |
| [`geometry.ts`](src/core/scene/geometry.ts)           | 提供尺寸、定位和取整运算                             |
| [`types.ts`](src/core/scene/types.ts)                 | 定义场景图元、坐标及绘制属性                         |

### `src/core/testing`

| 文件                                                            | 用途                                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------------------- |
| [`paperTestKit.test.ts`](src/core/testing/paperTestKit.test.ts) | 验证 paperTestKit 模块的行为（提供纸型测试的共享场景与断言辅助函数） |
| [`paperTestKit.ts`](src/core/testing/paperTestKit.ts)           | 提供纸型测试的共享场景与断言辅助函数                                 |

### `src/i18n`

| 文件                                    | 用途                       |
| --------------------------------------- | -------------------------- |
| [`en.ts`](src/i18n/en.ts)               | 提供应用的英文界面文案     |
| [`i18n.test.ts`](src/i18n/i18n.test.ts) | 验证翻译字典与语言回退     |
| [`index.ts`](src/i18n/index.ts)         | 加载翻译字典并创建翻译函数 |
| [`zh-CN.ts`](src/i18n/zh-CN.ts)         | 提供应用的简体中文界面文案 |

### `src/ui`

| 文件                                              | 用途                                                |
| ------------------------------------------------- | --------------------------------------------------- |
| [`A7c.test.tsx`](src/ui/A7c.test.tsx)             | 验证预览、模板库和导出集成                          |
| [`App.tsx`](src/ui/App.tsx)                       | 组合编辑器、设置和预览界面                          |
| [`InfoModal.test.tsx`](src/ui/InfoModal.test.tsx) | 验证 InfoModal 模块的行为（显示使用指南或关于信息） |
| [`interfaceStyle.ts`](src/ui/interfaceStyle.ts)   | 定义可切换的界面风格                                |
| [`palettes.ts`](src/ui/palettes.ts)               | 定义界面可选颜色预设                                |

### `src/ui/controls`

| 文件                                                                 | 用途                       |
| -------------------------------------------------------------------- | -------------------------- |
| [`ColorField.tsx`](src/ui/controls/ColorField.tsx)                   | 显示颜色选择器与预设色板   |
| [`controls.test.tsx`](src/ui/controls/controls.test.tsx)             | 验证通用表单控件           |
| [`NumberField.tsx`](src/ui/controls/NumberField.tsx)                 | 接收和提交带范围约束的数值 |
| [`OptionFieldRenderer.tsx`](src/ui/controls/OptionFieldRenderer.tsx) | 按纸型选项声明映射控件     |
| [`Section.tsx`](src/ui/controls/Section.tsx)                         | 显示可展开的配置区块       |
| [`SelectField.tsx`](src/ui/controls/SelectField.tsx)                 | 提供下拉选择控件           |
| [`SliderField.tsx`](src/ui/controls/SliderField.tsx)                 | 提供滑动范围控件           |
| [`TextField.tsx`](src/ui/controls/TextField.tsx)                     | 提供文本输入控件           |
| [`ToggleField.tsx`](src/ui/controls/ToggleField.tsx)                 | 提供布尔开关               |
| [`UiIcon.tsx`](src/ui/controls/UiIcon.tsx)                           | 绘制界面通用线性图标       |

### `src/ui/export`

| 文件                                                   | 用途                                                             |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| [`download.test.ts`](src/ui/export/download.test.ts)   | 验证 download 模块的行为（通过浏览器保存导出文件）               |
| [`download.ts`](src/ui/export/download.ts)             | 通过浏览器保存导出文件                                           |
| [`exporters.test.ts`](src/ui/export/exporters.test.ts) | 验证 exporters 模块的行为（调用渲染器并组织 PDF、SVG、PNG 导出） |
| [`exporters.ts`](src/ui/export/exporters.ts)           | 调用渲染器并组织 PDF、SVG、PNG 导出                              |

### `src/ui/gallery`

| 文件                                                        | 用途                     |
| ----------------------------------------------------------- | ------------------------ |
| [`TemplateGallery.tsx`](src/ui/gallery/TemplateGallery.tsx) | 显示、筛选并应用纸张模板 |

### `src/ui/i18n`

| 文件                                                             | 用途                                                     |
| ---------------------------------------------------------------- | -------------------------------------------------------- |
| [`LocaleProvider.test.tsx`](src/ui/i18n/LocaleProvider.test.tsx) | 验证 LocaleProvider 模块的行为（保存和提供当前界面语言） |
| [`LocaleProvider.tsx`](src/ui/i18n/LocaleProvider.tsx)           | 保存和提供当前界面语言                                   |

### `src/ui/layout`

| 文件                                                 | 用途                           |
| ---------------------------------------------------- | ------------------------------ |
| [`ControlPanel.tsx`](src/ui/layout/ControlPanel.tsx) | 组合左侧配置区块               |
| [`ExportBar.tsx`](src/ui/layout/ExportBar.tsx)       | 提供导出格式、清晰度和打印操作 |
| [`Footer.tsx`](src/ui/layout/Footer.tsx)             | 显示版权信息及使用提示         |
| [`Header.tsx`](src/ui/layout/Header.tsx)             | 显示站点标题、导航及界面入口   |
| [`InfoModal.tsx`](src/ui/layout/InfoModal.tsx)       | 显示使用指南或关于信息         |
| [`Workspace.tsx`](src/ui/layout/Workspace.tsx)       | 组织设置区与预览区的响应式布局 |

### `src/ui/preview`

| 文件                                                      | 用途                   |
| --------------------------------------------------------- | ---------------------- |
| [`Preview.tsx`](src/ui/preview/Preview.tsx)               | 生成纸页预览并处理缩放 |
| [`useElementWidth.ts`](src/ui/preview/useElementWidth.ts) | 观察预览容器的可用宽度 |

### `src/ui/print`

| 文件                                                | 用途                                                   |
| --------------------------------------------------- | ------------------------------------------------------ |
| [`printCss.test.ts`](src/ui/print/printCss.test.ts) | 验证 printCss 模块的行为（生成适用纸张尺寸的打印样式） |
| [`printCss.ts`](src/ui/print/printCss.ts)           | 生成适用纸张尺寸的打印样式                             |

### `src/ui/sections`

| 文件                                                             | 用途                           |
| ---------------------------------------------------------------- | ------------------------------ |
| [`BackgroundSection.tsx`](src/ui/sections/BackgroundSection.tsx) | 配置纸面底色和纹理             |
| [`DecorationSection.tsx`](src/ui/sections/DecorationSection.tsx) | 配置纸张边框与装饰             |
| [`LineSection.tsx`](src/ui/sections/LineSection.tsx)             | 配置格线颜色、宽度、样式和间距 |
| [`MarginsSection.tsx`](src/ui/sections/MarginsSection.tsx)       | 配置纸张四边的页边距           |
| [`OptionsSection.tsx`](src/ui/sections/OptionsSection.tsx)       | 展示当前纸型的专属设置         |
| [`PageSizeSection.tsx`](src/ui/sections/PageSizeSection.tsx)     | 切换纸张尺寸和方向             |
| [`PagesSection.tsx`](src/ui/sections/PagesSection.tsx)           | 设置页数和页码                 |
| [`PaperTypeSection.tsx`](src/ui/sections/PaperTypeSection.tsx)   | 按分类展示并切换纸型           |
| [`sections.test.tsx`](src/ui/sections/sections.test.tsx)         | 验证基本纸型配置               |
| [`sections2.test.tsx`](src/ui/sections/sections2.test.tsx)       | 验证线条和页边距配置           |
| [`sections3.test.tsx`](src/ui/sections/sections3.test.tsx)       | 验证纸面外观配置               |
| [`sections4.test.tsx`](src/ui/sections/sections4.test.tsx)       | 验证水印和页面配置             |
| [`sections5.test.tsx`](src/ui/sections/sections5.test.tsx)       | 验证设置导入和导出             |
| [`ThemeSection.tsx`](src/ui/sections/ThemeSection.tsx)           | 切换纸张配色和字体主题         |
| [`TransferSection.tsx`](src/ui/sections/TransferSection.tsx)     | 导入和导出纸张设置             |
| [`WatermarkSection.tsx`](src/ui/sections/WatermarkSection.tsx)   | 配置水印文字与位置             |

### `src/ui/store`

| 文件                                                                  | 用途                                                           |
| --------------------------------------------------------------------- | -------------------------------------------------------------- |
| [`SettingsProvider.test.tsx`](src/ui/store/SettingsProvider.test.tsx) | 验证 SettingsProvider 模块的行为（提供纸张设置状态和修改操作） |
| [`SettingsProvider.tsx`](src/ui/store/SettingsProvider.tsx)           | 提供纸张设置状态和修改操作                                     |
| [`settingsStorage.test.ts`](src/ui/store/settingsStorage.test.ts)     | 验证 settingsStorage 模块的行为（读写浏览器中的持久化设置）    |
| [`settingsStorage.ts`](src/ui/store/settingsStorage.ts)               | 读写浏览器中的持久化设置                                       |
| [`urlState.test.ts`](src/ui/store/urlState.test.ts)                   | 验证 urlState 模块的行为（处理旧分享链接里的设置片段）         |
| [`urlState.ts`](src/ui/store/urlState.ts)                             | 处理旧分享链接里的设置片段                                     |

### `./`

| 文件                               | 用途                             |
| ---------------------------------- | -------------------------------- |
| [`vite.config.ts`](vite.config.ts) | 配置 Vite 应用构建及 Vitest 测试 |

## 隐私

设置保存在浏览器的 `localStorage`；日常编辑保持短网址，旧的 `#s=…` 链接载入设置后会自动清除片段；上传的背景图只作为 data URL 存在于本机内存。项目没有网络请求、没有分析脚本、没有第三方字体。

## 许可证

[MIT](LICENSE) · © 2026 skyow。

## 致谢与说明

本项目是独立实现的开源工具，代码、界面、文案与配色均为原创。它提供的是「自定义打印纸生成器」这一类工具常见功能的集合，与任何同类网站没有关联。
