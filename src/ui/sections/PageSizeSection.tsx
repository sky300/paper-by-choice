/**
 * 切换纸张尺寸和方向。
 * Selects paper size and orientation.
 */
/**
 * Paper size and orientation controls.
 *
 * A custom size is entered as final width / height in millimetres, so the
 * orientation buttons are hidden for it; built-in sizes offer portrait /
 * landscape and show the resulting dimensions.
 */
import type { JSX } from 'react'
import { PAPER_SIZES, pageSizeMm } from '../../core/paperSizes'
import type { Orientation, PaperSizeKey } from '../../core/types'
import { NumberField } from '../controls/NumberField'
import { Section } from '../controls/Section'
import { SelectField } from '../controls/SelectField'
import { useLocale } from '../i18n/LocaleProvider'
import { useSettings } from '../store/SettingsProvider'

/** Renders the size selector, custom-size fields or orientation buttons. */
export function PageSizeSection(): JSX.Element {
  const { settings, setPaperSize, setCustomSize, setOrientation } =
    useSettings()
  const { t } = useLocale()
  const isCustom = settings.paperSize === 'custom'

  const choices = [
    ...PAPER_SIZES.map((size) => ({
      value: size.key,
      label: t(`size.${size.key}`),
    })),
    { value: 'custom', label: t('size.custom') },
  ]

  const dimensions = pageSizeMm(
    settings.paperSize,
    settings.orientation,
    settings.customSize,
  )

  const orientations: readonly {
    key: Orientation
    label: string
  }[] = [
    { key: 'portrait', label: 'orientation.portrait' },
    { key: 'landscape', label: 'orientation.landscape' },
  ]

  return (
    <Section id="section-size" title={t('section.size')}>
      <SelectField
        label={t('size.label')}
        value={settings.paperSize}
        choices={choices}
        onChange={(value) => setPaperSize(value as PaperSizeKey)}
      />

      {isCustom ? (
        <>
          <NumberField
            label={t('size.width')}
            value={settings.customSize.width}
            min={50}
            max={1000}
            step={1}
            unit={t('unit.mm')}
            onCommit={(width) => setCustomSize({ width })}
          />
          <NumberField
            label={t('size.height')}
            value={settings.customSize.height}
            min={50}
            max={1000}
            step={1}
            unit={t('unit.mm')}
            onCommit={(height) => setCustomSize({ height })}
          />
        </>
      ) : (
        <>
          <div className="ctl-field">
            <span className="ctl-label">{t('orientation.label')}</span>
            <div className="segmented">
              {orientations.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={settings.orientation === item.key}
                  onClick={() => setOrientation(item.key)}
                >
                  {t(item.label)}
                </button>
              ))}
            </div>
          </div>
          <p className="ctl-hint">
            {t('size.dimensions', {
              width: dimensions.width,
              height: dimensions.height,
            })}
          </p>
        </>
      )}
    </Section>
  )
}
