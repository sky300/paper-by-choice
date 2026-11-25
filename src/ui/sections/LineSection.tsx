/**
 * 配置格线颜色、宽度、样式和间距。
 * Configures rule color, width, pattern, and spacing.
 */
/**
 * Line settings: spacing, colour, style and width.
 *
 * The spacing label, hint and range come from the current paper's declaration;
 * the "recommended" button jumps back to the paper's default spacing.
 */
import type { JSX } from 'react'
import { LIMITS, spacingBounds } from '../../core/settings'
import { paperTranslator } from '../../i18n'
import type { LineStyle } from '../../core/types'
import { ColorField } from '../controls/ColorField'
import { NumberField } from '../controls/NumberField'
import { Section } from '../controls/Section'
import { SelectField } from '../controls/SelectField'
import { SliderField } from '../controls/SliderField'
import { useLocale } from '../i18n/LocaleProvider'
import { useSettings } from '../store/SettingsProvider'

/** Renders the line controls for the current paper. */
export function LineSection(): JSX.Element {
  const { settings, paper, setSpacing, setLine } = useSettings()
  const { locale, t } = useLocale()
  const pt = paperTranslator(paper, locale)
  const { spacing } = paper
  const { min, max } = spacingBounds(paper.type)
  const recommended = spacing.default === settings.line.spacing

  const styles: readonly LineStyle[] = ['solid', 'dashed', 'dotted']

  return (
    <Section
      id="section-line"
      title={t('section.line')}
      actions={
        <button
          type="button"
          className="ctl-button"
          disabled={recommended}
          onClick={() => setSpacing(spacing.default)}
        >
          {t('line.recommend')}
        </button>
      }
    >
      <NumberField
        label={pt(spacing.label)}
        hint={pt(spacing.hint)}
        value={settings.line.spacing}
        min={min}
        max={max}
        step={spacing.step}
        unit={t('unit.mm')}
        onCommit={setSpacing}
      />
      <ColorField
        label={t('line.color')}
        value={settings.line.color}
        onChange={(color) => setLine({ color })}
      />
      <SelectField
        label={t('line.style')}
        value={settings.line.style}
        choices={styles.map((style) => ({
          value: style,
          label: t(`style.${style}`),
        }))}
        onChange={(style) => setLine({ style: style as LineStyle })}
      />
      <SliderField
        label={t('line.width')}
        value={settings.line.width}
        min={LIMITS.lineWidth.min}
        max={LIMITS.lineWidth.max}
        step={LIMITS.lineWidth.step}
        decimals={2}
        unit={t('unit.mm')}
        onChange={(width) => setLine({ width })}
      />
    </Section>
  )
}
