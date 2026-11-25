# 参与贡献 / Contributing

感谢你愿意为「纸随心 Paper by Choice」出一份力。这是一个纯前端项目：所有计算都在浏览器里完成，没有后端、没有账号、没有遥测。

## 开始之前

```bash
git clone <你的仓库地址>
cd paper-by-choice
pnpm install
pnpm dev          # 本地开发服务器
pnpm check        # lint + typecheck + test + build，提交前请跑一遍
```

环境要求：Node.js 20.19+ 或 22.12+，pnpm 10+。

## 三条原则

1. **在线上不需要服务器。** 不要引入需要 API Key、云函数或远程字体的运行时依赖。现有依赖只有 React、React DOM 和 pdf-lib。
2. **用户的数据不离开本机。** 设置存在 `localStorage`，纸面文字与上传的背景图只在内存和画布里流转，绝不上传。
3. **打印尺寸必须准确。** 场景图元一律用毫米；不要在渲染路径里引入像素取整或 CSS `transform: scale()` 之类的近似。线宽、行距、页边距都以物理尺寸为准。

## 代码规范

- TypeScript `strict`，不用 `enum` / `namespace` / 参数属性（项目开了 `erasableSyntaxOnly`），用 `as const` + 联合类型。
- 纯类型导入写 `import type`（项目开了 `verbatimModuleSyntax`）。
- 提交前跑 `pnpm format`（Prettier）与 `pnpm lint`（oxlint）。
- 测试：Vitest。纯逻辑在 Node 环境跑；需要 DOM 的测试文件首行加 `// @vitest-environment happy-dom`。
- 测试驱动：先写一个会失败的测试，再写实现。请让测试描述行为，而不是实现细节。
- 界面与纸面上的文字都要走 `src/i18n/` 的字典；中文和英文字典的键集合必须一致（`src/i18n/i18n.test.ts` 会检查）。

## 如何新增一种纸张类型

这是最常见的贡献。每种纸是一个自包含模块，界面会根据它的声明自动生成控件——**不需要改注册表、不需要改界面代码**。

1. 在 `src/core/types.ts` 的 `PaperType` 联合类型里加上新的 key，并确定它属于哪个 `PaperGroup`。
2. 新建 `src/core/papers/<小驼峰名>.ts`，默认导出 `definePaper({...})`。照 `src/core/papers/lined.ts` 这个范例写，它包含一种纸该有的全部内容：

   ```ts
   export default definePaper({
     type: 'my_paper',
     group: 'basic',
     messages: { 'zh-CN': { name: '…', ... }, en: { name: '…', ... } },
     spacing: { label: 'spacing.label', hint: 'spacing.hint', min: 4, max: 20, step: 0.5, default: 8 },
     fields: [],                      // 专属配置的字段 schema
     defaultOptions: {},
     presets: [ /* 至少一个 */ ],
     render: (ctx) => { /* 返回 Scene，只画 ctx.area 以内 */ },
   })
   ```

3. 写同名 `.test.ts`。至少覆盖：默认渲染非空且所有图元都在 `ctx.area` 内；间距取最小 / 推荐 / 最大值时的数量变化；专属配置每个字段都改变画面；A5 横向也能渲染；中英字典键集合一致。
4. `src/core/papers/paperContract.test.ts` 会自动把新纸型纳入通用不变量检查（纯函数、无 NaN、不同尺寸下不越界等），不用改它。
5. `pnpm check` 全绿即可提 PR。

几个约定：

- `render()` 只画**书写区以内**。背景、纹理、边框装饰、水印、页码、分栏都由组装层负责，不要在纸型里画。
- 主线用 `ctx.ink.main()`，辅助线用 `ctx.ink.guide()`；主题色只用于标题和强调元素。
- 放不下整数个格子时用 `layoutCells` / `layoutGrid` 居中，放不下就少画；不要产生负尺寸或 NaN。
- 复用 `src/core/papers/shared/` 里的构件；如果新增共用构件，请放在自己的文件里并加测试。

## 提交 PR 之前

- [ ] `pnpm check` 全绿
- [ ] 新增或改动的行为有测试覆盖（并且你见过它先失败）
- [ ] 中英文字典键集合一致，文案自然
- [ ] 没有引入新的运行时依赖
- [ ] 生成的 PDF / SVG / PNG 在浏览器里实际打开过一遍（至少抽查一种纸型）
- [ ] 没有把 `.dev/` 目录加进提交（里面有第三方参照资料，不能公开）

## 报告问题

请在 issue 里附上：浏览器与版本、纸张类型、复现步骤、期望与实际结果。如果涉及导出文件，尽量附上一份设置 JSON（界面里「导出设置」可以生成）——它不含任何个人信息。

---

## Contributing (English)

Thanks for helping out. This is a fully client-side project: no backend, no accounts, no telemetry; all rendering happens in the browser.

Requirements: Node.js 20.19+ / 22.12+, pnpm 10+. Run `pnpm install`, then `pnpm dev` to start and `pnpm check` before every commit (lint + typecheck + tests + build).

Three rules: never add a runtime dependency that needs an API key or a remote font; never send user data anywhere; keep all geometry in millimetres so print sizes stay exact.

Every paper is a self-contained module that default-exports `definePaper({...})`; the registry discovers files via `import.meta.glob` and the control panel is generated from the declaration. See `src/core/papers/lined.ts` for a complete example and the checklist above for what a new paper needs.

UI strings and text printed on the paper both go through `src/i18n/`; the Chinese and English dictionaries must have identical key sets. Tests use Vitest (`// @vitest-environment happy-dom` for DOM tests) and follow red-green-refactor.

Before opening a PR: `pnpm check` is green, behaviour is covered by tests, no new runtime dependency, a generated PDF / SVG / PNG was actually opened, and `.dev/` is not included in the commit.
