/**
 * 配置水印文字与位置。
 * Configures watermark text and placement.
 */
/**
 * Watermark text and its appearance; the text starts empty by design.
 */
import type { JSX } from 'react'
import { LIMITS } from '../../core/settings'
import { ColorField } from '../controls/ColorField'
import { NumberField } from '../controls/NumberField'
import { Section } from '../controls/Section'
import { SliderField } from '../controls/SliderField'
import { TextField } from '../controls/TextField'
import { ToggleField } from '../controls/ToggleField'
import { useLocale } from '../i18n/LocaleProvider'
import { useSettings } from '../store/SettingsProvider'

/** Renders the watermark controls; only the master toggle shows when off. */
export function WatermarkSection(): JSX.Element {
  const { settings, setWatermark } = useSettings()
  const { t } = useLocale()
  const w = settings.watermark

  return (
    <Section id="section-watermark" title={t('section.watermark')}>
      <ToggleField
        label={t('watermark.enable')}
        checked={w.enabled}
        onChange={(enabled) => setWatermark({ enabled })}
      />
      {!w.enabled ? null : (
        <>
          <TextField
            label={t('watermark.text')}
            value={w.text}
            placeholder={t('watermark.textPlaceholder')}
            maxLength={LIMITS.watermark.textMaxLength}
            onChange={(text) => setWatermark({ text })}
          />
          <SliderField
            label={t('watermark.opacity')}
            value={w.opacity}
            min={LIMITS.watermark.opacity.min}
            max={LIMITS.watermark.opacity.max}
            step={LIMITS.watermark.opacity.step}
            unit="%"
            onChange={(opacity) => setWatermark({ opacity })}
          />
          <NumberField
            label={t('watermark.angle')}
            value={w.angle}
            min={LIMITS.watermark.angle.min}
            max={LIMITS.watermark.angle.max}
            step={LIMITS.watermark.angle.step}
            unit={t('unit.degree')}
            onCommit={(angle) => setWatermark({ angle })}
          />
          <NumberField
            label={t('watermark.size')}
            value={w.size}
            min={LIMITS.watermark.size.min}
            max={LIMITS.watermark.size.max}
            step={LIMITS.watermark.size.step}
            unit={t('unit.mm')}
            onCommit={(size) => setWatermark({ size })}
          />
          <ColorField
            label={t('watermark.color')}
            value={w.color}
            onChange={(color) => setWatermark({ color })}
          />
        </>
      )}
    </Section>
  )
}
