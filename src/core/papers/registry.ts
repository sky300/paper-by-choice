/**
 * Paper registry.
 *
 * A paper registers itself by existing: every `*.ts` file next to this module,
 * tests aside, whose default export looks like a paper is picked up through
 * `import.meta.glob`. Adding a paper therefore never edits this file, so the
 * papers can be written in parallel without merge conflicts.
 */
import type { AnyPaper } from './contract'
import { isPlainObject } from './kit'
import type { Locale, PaperGroup, PaperType } from '../types'

/** The 41 paper types in canonical order: the order in which `PaperType` declares them. */
export const PAPER_ORDER: readonly PaperType[] = [
  // basic
  'lined',
  'vertical_lined',
  'grid',
  'dot',
  'blank',
  'music',
  'guitar_tab',
  'guitar_staff_tab',
  'calligraphy',
  'cornell',
  'isometric',
  'hexagonal',
  'seyes',
  'storyboard',
  // Chinese school worksheets
  'pinyin_paper',
  'pinyin_tianzi',
  'composition_paper',
  'arithmetic_paper',
  'english_paper',
  'practice_paper',
  // calligraphy practice
  'calligraphy_practice',
  'mizige',
  'huigongge',
  'jiugongge',
  'chinesetianzi',
  'huimige',
  'hardpen_calligraphy_paper',
  'crossgrid',
  'hardpen_huigongge',
  // notes, planning and forms
  'vintage_note',
  'children_drawing',
  'minimal_journal',
  'student_note',
  'meeting_note',
  'project_planning',
  'sketch',
  'creative_log',
  'branded',
  'error_correction',
  'chinese_preview_card',
  'chinese_english_word_practice',
]

/** Whether a default export is shaped like a paper: an object with a string `type`. */
function looksLikePaper(value: unknown): value is AnyPaper {
  return isPlainObject(value) && typeof value.type === 'string'
}

/**
 * Turns the modules found by `import.meta.glob` into the paper list. Modules
 * whose default export is not a paper are ignored; the rest must have a type
 * that `PAPER_ORDER` knows and must not repeat one another, and come out in
 * `PAPER_ORDER` order whatever the module order was.
 */
export function collectPapers(modules: Record<string, unknown>): AnyPaper[] {
  const found: { paper: AnyPaper; file: string; rank: number }[] = []

  for (const [file, loaded] of Object.entries(modules)) {
    const candidate = isPlainObject(loaded) ? loaded.default : undefined
    if (!looksLikePaper(candidate)) continue

    const rank = PAPER_ORDER.indexOf(candidate.type)
    if (rank === -1) {
      throw new Error(
        `Paper type "${candidate.type}" (${file}) is missing from PAPER_ORDER.`,
      )
    }
    const clash = found.find((entry) => entry.rank === rank)
    if (clash) {
      throw new Error(
        `Paper type "${candidate.type}" is declared in both ${clash.file} and ${file}.`,
      )
    }
    found.push({ paper: candidate, file, rank })
  }

  return found.sort((a, b) => a.rank - b.rank).map((entry) => entry.paper)
}

/** Every registered paper, in `PAPER_ORDER` order. */
export const papers: readonly AnyPaper[] = collectPapers(
  // The negated pattern leaves the test files out; Vite itself leaves out the
  // file that carries the glob, so this module never imports itself.
  import.meta.glob(['./*.ts', '!**/*.test.ts'], { eager: true }),
)

/** The registered paper of `type`; throws when no paper of that type exists. */
export function getPaper(type: PaperType): AnyPaper {
  const paper = findPaper(type)
  if (!paper) throw new Error(`No paper is registered for type "${type}".`)
  return paper
}

/** The registered paper whose type equals `type`, or `undefined`. */
export function findPaper(type: string): AnyPaper | undefined {
  return papers.find((paper) => paper.type === type)
}

/** Whether `value` is the key of a registered paper. */
export function isPaperType(value: unknown): value is PaperType {
  return (
    typeof value === 'string' && papers.some((paper) => paper.type === value)
  )
}

/** The registered papers of one group, in `PAPER_ORDER` order. */
export function papersByGroup(group: PaperGroup): readonly AnyPaper[] {
  return papers.filter((paper) => paper.group === group)
}

/** The paper's `name` message in `locale`, or its key when there is none. */
export function paperName(paper: AnyPaper, locale: Locale): string {
  const name = paper.messages[locale]?.name
  return name ? name : paper.type
}
