# 纸随心 paper-by-choice · 设计文档

> 状态：草案，待用户确认。最后更新：2026-11-24

## 1. 目标

一个**纯前端**的自定义打印纸生成器：在浏览器里选纸型、调参数、实时预览，导出 SVG / PNG / PDF 或直接打印。不依赖服务器，不上传任何数据。功能范围对标 paperme.toolooz.com（41 种纸张类型及全部通用设置），代码、界面、文案、配色全部原创。

非目标（第一期不做）：账号与云端、移动端原生应用、导入其它网站的配置文件、自定义主题编辑器、界面深色模式。

## 2. 技术选型

| 项       | 选择                                                             | 说明                                                  |
| -------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| 构建     | Vite 8，`base: './'`                                             | 构建产物可放在任意路径下（GitHub Pages、NAS、子目录） |
| 界面     | React 19 + TypeScript 5.9（strict）                              | 用户指定                                              |
| 状态     | React Context + `useState`，无第三方状态库                       | 设置是单一对象，不需要复杂状态管理                    |
| 绘制     | 自研“场景图元”，单位毫米                                         | 见 §4，屏幕与导出共用同一份几何                       |
| PDF      | pdf-lib                                                          | 矢量线条 + 文字转高分辨率位图贴片                     |
| 测试     | Vitest（Node 环境；DOM 测试按文件用 happy-dom）+ Testing Library |                                                       |
| 代码检查 | oxlint + Prettier                                                | 与 Vite 官方模板一致                                  |
| 国际化   | 自研极简字典（中 / 英）                                          | 不引入 i18next，避免多余依赖                          |

**依赖原则**：运行时依赖只有 `react`、`react-dom`、`pdf-lib` 三个。

## 3. 目录结构

```
src/
  main.tsx, App.tsx
  i18n/            zh-CN.ts、en.ts、index.ts（Locale、t()、语言探测）
  core/            纯 TypeScript，不依赖 React 和 DOM，可单测
    types.ts       设置数据模型与基础类型
    paperSizes.ts  纸张尺寸表
    themes.ts      主题色板
    settings.ts    默认值、切换纸型、校验收敛、导入导出
    scene/         图元类型 types.ts、构造器 builders.ts、几何工具 geometry.ts
    papers/        纸型：contract.ts（契约）、registry.ts（注册表）、kit.ts（纸型工具箱）、
                   shared/（共用构件）、每种纸一个文件
    compose/       document.ts（整页组装）、background.ts、decoration.ts、watermark.ts、pageNumber.ts
    render/        svg.ts、raster.ts、pdf.ts、textRaster.ts、download.ts
  ui/              React 界面：布局、控制面板各分区、表单控件、预览、导出栏、模板库、打印视图
docs/              设计文档（本文件）与贡献者指南
```

**分层约束**：`core/scene` 不依赖任何其它模块；`core/papers` 只依赖 `scene`、`i18n` 的类型与 `kit`；`core/compose` 依赖 `papers` 与 `settings`；`core/render` 只依赖 `scene`。`ui` 是唯一接触 React 的层。

## 4. 场景图元（核心抽象）

每种纸的渲染函数不直接写 SVG 或 Canvas，而是返回一个**场景**：一组以毫米为坐标的图元。预览与三种导出都从同一份场景渲染，因此**所见即所得**，且线宽、间距的物理尺寸准确。

```ts
type Scene = readonly SceneItem[]

interface Stroke {
  color: string
  width: number /* mm */
  dash?: readonly number[] /* mm */
  opacity?: number
}
interface Paint {
  color: string
  opacity?: number
}
interface Font {
  family: string /* CSS 字体栈 */
  size: number /* mm */
  weight?: 400 | 700
  style?: 'normal' | 'italic'
}
interface Box {
  x: number
  y: number
  w: number
  h: number
}

type SceneItem =
  | {
      op: 'line'
      x1: number
      y1: number
      x2: number
      y2: number
      stroke: Stroke
    }
  | { op: 'rect'; box: Box; stroke?: Stroke; fill?: Paint }
  | {
      op: 'ellipse'
      cx: number
      cy: number
      rx: number
      ry: number
      start?: number
      end?: number /* 弧度，顺时针 */
      stroke?: Stroke
      fill?: Paint
    }
  | {
      op: 'poly'
      points: readonly Pt[]
      closed: boolean
      stroke?: Stroke
      fill?: Paint
    }
  | {
      op: 'path'
      d: readonly PathCommand[]
      closed?: boolean
      stroke?: Stroke
      fill?: Paint
    }
  | {
      op: 'text'
      x: number
      y: number
      text: string
      font: Font
      fill: Paint
      anchor?: 'start' | 'middle' | 'end'
      baseline?: 'alphabetic' | 'middle'
      rotate?: number /* 度，绕 (x, y) 顺时针 */
    }
  | { op: 'image'; box: Box; src: string; opacity?: number }
  | { op: 'g'; opacity?: number; items: readonly SceneItem[] }

type PathCommand =
  | { op: 'M'; p: Pt }
  | { op: 'L'; p: Pt }
  | { op: 'Q'; c: Pt; p: Pt }
  | { op: 'C'; c1: Pt; c2: Pt; p: Pt }
  | { op: 'Z' }
```

设计要点：

- **没有裁剪图元**。纹理、水印等需要在边界内绘制的图案，一律在生成时就把几何算在边界内，这样 PDF 渲染器不必实现裁剪路径。
- **路径只有 M / L / Q / C / Z**，不含圆弧指令。圆弧用 `ellipse` 的 `start/end` 表达，三个渲染器都能原生处理。
- **虚线用显式毫米数组**，不用 `dashed/dotted` 字样，由纸型决定虚线的长短（辅助线与主线不同）。
- 坐标原点在页面左上角，y 向下。PDF 渲染器负责翻转到 PDF 的左下角坐标系。

## 5. 设置数据模型

```ts
interface Settings {
  version: 1
  paperType: PaperType // 41 种之一
  paperSize: PaperSizeKey // a4 a5 a3 b4 b5 letter legal tabloid executive custom
  orientation: 'portrait' | 'landscape'
  customSize: { width: number; height: number } // mm，仅 paperSize = custom 时生效
  line: {
    color: string
    width: number /* mm，0.05–1 */
    style: 'solid' | 'dashed' | 'dotted'
    spacing: number /* mm */
  }
  margins: { top: number; right: number; bottom: number; left: number } // mm，各 0–40
  theme: ThemeKey
  background: {
    color: string
    texture:
      'none' | 'grid' | 'dots' | 'lines' | 'crosshatch' | 'graph' | 'image'
    patternColor: string
    patternOpacity: number
    image: string | null
  }
  decoration: {
    enabled: boolean
    style: 'simple' | 'double' | 'corner' | 'calligraphy' | 'scalloped'
    scope: 'content' | 'page'
    inset: number
    color: string
    width: number
    lineStyle: LineStyle
    sides: { top: boolean; right: boolean; bottom: boolean; left: boolean }
    cornerOrnaments: boolean
    scallopPattern: 'wave' | 'meander' | 'beads'
    opacity: number
  }
  watermark: {
    enabled: boolean
    text: string
    opacity: number
    angle: number /* 度 */
    size: number /* mm */
    color: string
  }
  pages: { count: number; numbering: boolean; startNumber: number }
  options: Record<string, unknown> // 纸型专属配置，由各纸型的字段表校验
}
```

约束与行为：

- **校验收敛 `sanitizeSettings(raw)`**：任何来源（首次默认、本地存储、链接、导入文件）的设置都经过它——字段缺失补默认值，数值夹到允许范围，非法枚举回落。LocalStorage 里的旧数据因此天然兼容。
- **首次打开**：横线纸、A4、纵向、灰色线、间距 8 mm、线宽 0.13 mm、四边边距 20 mm、默认主题、白色背景。
- **切换纸型**：`switchPaperType(current, next)` 以目标纸型的默认预设为底，**保留**当前的 `pages`、`watermark`、`decoration`（用户显式开启的功能不应因为换纸型而丢失），其余采用新纸型的默认值。
- **选主题**：同时把线条颜色设为该主题的线条色。
- **持久化**：LocalStorage 键 `paper-by-choice.settings.v1`；语言偏好键 `paper-by-choice.locale`。
- **链接分享**：当前设置以 `#s=<base64url(JSON)>` 写入地址栏（防抖），打开带参数的链接即恢复。这同时也是自动化截图核对的入口。
- **导入 / 导出设置**：一个 JSON 文件，结构为 `{ "app": "paper-by-choice", "version": 1, "name"?: string, "settings": Settings }`；导入时校验 `app` 与必需字段，再过 `sanitizeSettings`。文件名 `paper-by-choice-<纸型>-<yyyyMMdd>.json`。

## 6. 纸型契约

每种纸是一个自包含模块，声明式地给出它需要的一切；界面据此自动生成控件。

```ts
interface PaperDef<O> {
  type: PaperType
  group: 'basic' | 'worksheet' | 'calligraphy' | 'creative' // 对应四个分组
  spacing: {
    label: MessageKey
    hint: MessageKey
    min: number
    max: number
    step: number
    default: number
  } // mm
  fields: readonly OptionField[] // 专属配置的表单 schema；没有则为空数组
  defaultOptions: O
  presets: readonly Preset[] // 第一个即该纸型的默认预设
  render(ctx: RenderContext<O>): Scene
}

interface Preset {
  id: string
  name: MessageKey
  description: MessageKey
  patch: Partial<Settings>
}
```

`OptionField` 支持 `number / slider / toggle / select / text / color / group`，可带 `showIf` 条件。字段 key 在 `settings.options` 下存取。

`RenderContext` 提供给渲染函数的输入：

```ts
interface RenderContext<O> {
  type: PaperType
  page: { width: number; height: number } // 整页，已应用方向
  area: Box // 书写区 = 页面减四边边距
  spacing: number // 已夹到该纸型范围的间距值
  theme: Theme
  options: O // 已合并默认值并校验
  ink: InkKit // 主线 / 辅助线 / 自定义描边的构造器
  fonts: FontKit // 正文、标题、等宽、中文楷体、手写体的字体栈
  t: Translator // 界面与纸面上的文字都走它
  locale: Locale
}
```

渲染函数只画**书写区以内**的内容；背景、装饰、水印、页码、分栏由组装层负责。

**新增一种纸 = 新增一个文件 + 一份测试 + 在注册表登记一行。** 不需要改界面代码。

## 7. 整页组装

```
buildDocument(settings, locale) → { pages: Page[] }
  页面尺寸 = resolvePageSize(settings)
  基础场景 = 背景（底色 + 纹理或图片）
           + 纸型内容（写入区；支持分栏的纸型按栏拆分并画分隔线）
           + 页面装饰（作用范围 + 内缩后的矩形）
           + 水印（平铺文字网格，整体旋转）
  第 i 页 = 基础场景 + 页码（仅当开启）
```

多页时基础场景只计算一次；每页只多一个页码图元。页码格式为 `当前页 / 末页`，末页 = 起始页码 + 页数 − 1。

## 8. 渲染器

| 输出 | 实现                                                                     | 说明                                                                 |
| ---- | ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 预览 | `sceneToSvg()` 的输出经 `dangerouslySetInnerHTML` 挂载                   | 与 SVG 导出是同一份字符串，按场景记忆化                              |
| SVG  | `sceneToSvg(page)`，`width="210mm" height="297mm" viewBox="0 0 210 297"` | 纯矢量，可再编辑                                                     |
| PNG  | 场景 → Canvas（默认 300 DPI，可选 150 / 600）                            | 像素上限保护，避免超出浏览器画布限制                                 |
| PDF  | pdf-lib：图元画成矢量；文字用 Canvas 以 600 DPI 渲染成透明贴片后嵌入     | 线条矢量、文件小、任何阅读器都能打开。已知限制：PDF 中的文字不可选中 |
| 打印 | 浏览器打印对话框，`@page { size: 宽mm 高mm; margin: 0 }`，每页一纸       | 完全矢量且文字为真字体                                               |

PDF 文字用位图贴片的原因：矢量嵌入中文字体需要随包附带十余兆的字库，与“轻量、离线可用”冲突；而页面上的文字只是少量标签。

## 9. 界面

- **顶栏**：项目名、语言切换、模板库按钮、仓库链接。
- **左侧控制面板**（可滚动，窄屏时收进抽屉），分区依次为：纸张类型（按四组分类的选择器）、纸张尺寸 / 方向 / 分栏、主题色板、线条设置（间距 + 推荐、颜色、线型、粗细）、**专属配置**（由纸型的字段表自动生成）、边距、背景、页面装饰、水印、页面设置、导入 / 导出设置。
- **右侧预览**：页面按容器自适应缩放，多页纵向排列；顶部导出栏（PDF / SVG / PNG / 打印）。
- **页脚**：隐私说明（全部计算在本地完成）与打印小贴士。
- 视觉风格自定：浅色、克制、以纸面预览为主角。

## 10. 国际化

- 字典以简体中文为键的来源：`zh-CN` 定义全部键，`en` 必须覆盖同样的键（测试保证两边键集合一致）。
- 默认语言：已保存的偏好 → 浏览器语言（以 `zh` 开头则中文，否则英文）→ 中文。
- 纸面上的文字（如“姓名”“科目”、康奈尔笔记的分区名）同样走字典，随界面语言切换。

## 11. 与参照站点有意不同之处

以下是刻意为之的差异，实现时不照搬对方行为：

1. **以毫米为唯一单位**，不经过像素取整，打印物理尺寸更准。
2. **PDF 是矢量线条**（对方是整页位图）。
3. **每个纸型只有一套默认值**，且默认间距一定落在允许范围内。对方在“切换默认值”与“推荐值”之间有 20 处不一致，部分默认值超出自身范围。
4. **切换纸型保留页数、水印、页面装饰**。
5. **页码为正确的 `当前页 / 末页`**。对方会出现 `5 / 3`。
6. **自定义背景图的不透明度只应用一次**。对方被平方（0.2 实际约 0.04）。
7. **水印默认文字为空**，不预置任何品牌名。
8. **预览显示全部页面**（对方只显示第一页）。
9. **多出链接分享、打印视图、模板库缩略图预览**。
10. 配色、主题色板、界面文案全部自行设计。

## 12. 测试策略

| 层              | 测什么                                                                                         | 怎么测                                           |
| --------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| scene           | 构造器与几何工具                                                                               | 纯函数断言                                       |
| papers（41 种） | 每种纸的几何：图元数量、位置、间距、是否全部落在书写区内、参数如何改变结果、默认尺寸下的行列数 | 纯函数断言 + 小场景的 SVG 内联快照               |
| settings        | 默认值、切换纸型的保留规则、`sanitizeSettings` 对缺字段 / 越界 / 非法枚举的处理、导入导出往返  | 纯函数断言                                       |
| compose         | 背景纹理几何、装饰各样式、水印网格、页码、分栏                                                 | 纯函数断言                                       |
| render          | SVG 序列化（转义、数字精度）、PDF 页数与页面尺寸                                               | 字符串断言；pdf-lib 读回校验                     |
| i18n            | 中英键集合一致、插值                                                                           | 断言                                             |
| ui              | 控件改变设置、面板按纸型出现、导入导出按钮                                                     | happy-dom + Testing Library                      |
| 端到端          | 41 种纸在默认设置下的真实渲染；三种导出产物                                                    | 本机无头 Chrome 逐纸型截图人工核对；导出文件抽查 |

所有纸型测试共用一组“通用不变量”：非空、图元全部在书写区内（允许线宽带来的微小越界）、A4 纵向与 A5 横向都能生成、间距取最小 / 最大值都不产生 NaN 或 Infinity。

## 13. 开源交付物

`README.md`（中文）、`README.en.md`、`LICENSE`（MIT）、`CONTRIBUTING.md`（含“如何新增纸型”）、`docs/ARCHITECTURE.md`（英文版设计）、`.github/workflows/ci.yml`（lint → typecheck → test → build）、`.gitattributes`、`.gitignore`、可选的 `Dockerfile`（静态站点，便于在 NAS 上自托管）。
