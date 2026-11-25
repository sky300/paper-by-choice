/**
 * 配置纸张四边的页边距。
 * Configures the four paper margins.
 */
/**
 * The four page margins in a 2×2 grid.
 */
import type { JSX } from 'react'
import { LIMITS } from '../../core/settings'
import type { Margins } from '../../core/types'
import { NumberField } from '../controls/NumberField'
import { Section } from '../controls/Section'
import { useLocale } from '../i18n/LocaleProvider'
import { useSettings } from '../store/SettingsProvider'

/** Renders the four margin inputs, each writing only its own side. */
export function MarginsSection(): JSX.Element {
  const { settings, setMargins } = useSettings()
  const { t } = useLocale()

  const sides: readonly { key: keyof Margins; label: string }[] = [
    { key: 'top', label: 'margin.top' },
    { key: 'right', label: 'margin.right' },
    { key: 'bottom', label: 'margin.bottom' },
    { key: 'left', label: 'margin.left' },
  ]

  return (
    <Section id="section-margins" title={t('section.margins')}>
      <div className="margins-grid">
        {sides.map((side) => (
          <NumberField
            key={side.key}
            label={t(side.label)}
            value={settings.margins[side.key]}
            min={LIMITS.margins.min}
            max={LIMITS.margins.max}
            step={LIMITS.margins.step}
            unit={t('unit.mm')}
            onCommit={(value) => setMargins({ [side.key]: value })}
          />
        ))}
      </div>
    </Section>
  )
}
