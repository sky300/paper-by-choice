/**
 * Paper-specific options, generated from the current paper's field schema.
 *
 * Papers with no declared fields return `null` so the panel shows nothing.
 */
import type { JSX } from 'react'
import { paperTranslator } from '../../i18n'
import { OptionFieldRenderer } from '../controls/OptionFieldRenderer'
import { Section } from '../controls/Section'
import { useLocale } from '../i18n/LocaleProvider'
import { useSettings } from '../store/SettingsProvider'

/** Renders the option fields of the current paper, or `null` when it has none. */
export function OptionsSection(): JSX.Element | null {
  const { paper, options, setOption } = useSettings()
  const { locale, t } = useLocale()
  if (paper.fields.length === 0) return null

  const pt = paperTranslator(paper, locale)
  return (
    <Section id="section-options" title={t('section.options')}>
      {paper.fields.map((field) => (
        <OptionFieldRenderer
          key={field.key}
          field={field}
          options={options}
          t={pt}
          onSet={setOption}
        />
      ))}
    </Section>
  )
}
