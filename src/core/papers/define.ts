/**
 * 将带具体选项类型的纸型注册为通用纸型。
 * Adapts strongly typed definitions to the shared registry.
 */
/**
 * Paper definitions.
 *
 * A paper file spells out its own option type so that its `render()` can read
 * `ctx.options` without casts. The registry cannot keep different generic
 * shapes, so `definePaper` is the single place where that type is erased.
 */
import type { AnyPaper, PaperDef } from './contract'

/** Returns `def` unchanged, its option type erased to `AnyPaper` so the registry can store papers of every shape side by side. */
export function definePaper<O extends object>(def: PaperDef<O>): AnyPaper {
  return def as unknown as AnyPaper
}
