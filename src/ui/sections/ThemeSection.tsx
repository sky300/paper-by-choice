/**
 * Theme picker: one colour card per theme.
 *
 * Selecting a theme also repaints the line colour (handled by the store),
 * so the card's three chips preview the theme's lines, primary and paper.
 */
import type { JSX } from 'react'
import { THEMES } from '../../core/themes'
import { Section } from '../controls/Section'
import { useLocale } from '../i18n/LocaleProvider'
import { useSettings } from '../store/SettingsProvider'

/** Renders the 13 theme cards; the active one is pressed. */
export function ThemeSection(): JSX.Element {
  const { settings, selectTheme } = useSettings()
  const { t } = useLocale()

  return (
    <Section id="section-theme" title={t('section.theme')}>
      <div className="theme-grid">
        {THEMES.map((theme) => (
          <button
            key={theme.key}
            type="button"
            className="theme-option"
            data-theme={theme.key}
            aria-pressed={settings.theme === theme.key}
            onClick={() => selectTheme(theme.key)}
          >
            <span className="theme-card" aria-hidden="true">
              <span
                className="theme-chip"
                style={{ backgroundColor: theme.lines }}
              />
              <span
                className="theme-chip"
                style={{ backgroundColor: theme.primary }}
              />
              <span
                className="theme-chip"
                style={{ backgroundColor: theme.paper }}
              />
            </span>
            <span className="theme-name">{t(`theme.${theme.key}`)}</span>
          </button>
        ))}
      </div>
    </Section>
  )
}
