/**
 * Paper definitions.
 *
 * A paper file spells out its own option type so that its `render()` can read
 * `ctx.options` without casts. The registry cannot keep 41 different generic
 * shapes, so `definePaper` is the single place where that type is erased.
 */
import type { AnyPaper, PaperDef } from './contract'

/** Returns `def` unchanged, its option type erased to `AnyPaper` so the registry can store papers of every shape side by side. */
export function definePaper<O extends object>(def: PaperDef<O>): AnyPaper {
  return def as unknown as AnyPaper
}
