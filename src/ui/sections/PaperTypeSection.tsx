/**
 * Paper type picker, grouped into the four catalogue sections.
 *
 * Each button is labelled with the paper's own name and described by its
 * first preset; the pressed state comes straight from the settings store.
 */
import type { JSX } from 'react'
import { paperName, papersByGroup } from '../../core/papers/registry'
import { paperTranslator } from '../../i18n'
import type { PaperGroup, PaperType } from '../../core/types'
import { Section } from '../controls/Section'
import { useLocale } from '../i18n/LocaleProvider'
import { useSettings } from '../store/SettingsProvider'

/** The four groups in display order. */
const GROUPS: readonly { key: PaperGroup; label: string }[] = [
  { key: 'basic', label: 'group.basic' },
  { key: 'worksheet', label: 'group.worksheet' },
  { key: 'calligraphy', label: 'group.calligraphy' },
  { key: 'creative', label: 'group.creative' },
]

/** Renders the paper-type buttons, grouped by catalogue section. */
export function PaperTypeSection(): JSX.Element {
  const { settings, switchPaperType } = useSettings()
  const { locale, t } = useLocale()

  return (
    <Section id="section-type" title={t('section.type')}>
      {GROUPS.map((group) => (
        <div className="paper-group" key={group.key}>
          <h3 className="paper-group-title">{t(group.label)}</h3>
          <div className="paper-grid">
            {papersByGroup(group.key).map((paper) => {
              const pt = paperTranslator(paper, locale)
              const description = paper.presets[0]?.description
              return (
                <button
                  key={paper.type}
                  type="button"
                  className="paper-option"
                  data-paper={paper.type}
                  title={description ? pt(description) : undefined}
                  aria-pressed={settings.paperType === paper.type}
                  onClick={() => switchPaperType(paper.type as PaperType)}
                >
                  {paperName(paper, locale)}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </Section>
  )
}
