/**
 * 设置页数和页码。
 * Configures page count and numbering.
 */
/**
 * Page count and optional page numbering.
 */
import type { JSX } from 'react'
import { LIMITS } from '../../core/settings'
import { NumberField } from '../controls/NumberField'
import { Section } from '../controls/Section'
import { ToggleField } from '../controls/ToggleField'
import { useLocale } from '../i18n/LocaleProvider'
import { useSettings } from '../store/SettingsProvider'

/** Renders page count, the numbering toggle and the first page number. */
export function PagesSection(): JSX.Element {
  const { settings, setPages } = useSettings()
  const { t } = useLocale()
  const p = settings.pages

  return (
    <Section id="section-pages" title={t('section.pages')}>
      <NumberField
        label={t('pages.count')}
        value={p.count}
        min={LIMITS.pages.count.min}
        max={LIMITS.pages.count.max}
        step={1}
        onCommit={(count) => setPages({ count })}
      />
      <ToggleField
        label={t('pages.numbering')}
        checked={p.numbering}
        onChange={(numbering) => setPages({ numbering })}
      />
      {p.numbering ? (
        <NumberField
          label={t('pages.startNumber')}
          value={p.startNumber}
          min={LIMITS.pages.startNumber.min}
          max={LIMITS.pages.startNumber.max}
          step={1}
          onCommit={(startNumber) => setPages({ startNumber })}
        />
      ) : null}
    </Section>
  )
}
