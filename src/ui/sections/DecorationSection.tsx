/**
 * 配置纸张边框与装饰。
 * Configures page borders and decorations.
 */
/**
 * Page decoration: border style, scope, geometry and per-side toggles.
 *
 * Some styles imply sensible defaults (corner ornaments, all four sides),
 * which are applied in the same update as the style change.
 */
import type { JSX } from 'react'
import { LIMITS } from '../../core/settings'
import type {
  DecorationScope,
  DecorationStyle,
  LineStyle,
  ScallopPattern,
} from '../../core/types'
import { ColorField } from '../controls/ColorField'
import { NumberField } from '../controls/NumberField'
import { Section } from '../controls/Section'
import { SelectField } from '../controls/SelectField'
import { SliderField } from '../controls/SliderField'
import { ToggleField } from '../controls/ToggleField'
import { useLocale } from '../i18n/LocaleProvider'
import { useSettings } from '../store/SettingsProvider'

/** Renders the decoration controls; only the master toggle shows when off. */
export function DecorationSection(): JSX.Element {
  const { settings, paper, setDecoration, applyCalligraphyFrame } =
    useSettings()
  const { t } = useLocale()
  const d = settings.decoration

  /** Applies a style together with the defaults that make it usable. */
  function changeStyle(style: DecorationStyle) {
    if (style === 'corner') {
      setDecoration({ style, cornerOrnaments: true })
    } else if (style === 'calligraphy' || style === 'scalloped') {
      setDecoration({
        style,
        sides: { top: true, right: true, bottom: true, left: true },
      })
    } else {
      setDecoration({ style })
    }
  }

  const styles: readonly DecorationStyle[] = [
    'simple',
    'double',
    'corner',
    'calligraphy',
    'scalloped',
  ]
  const lineStyles: readonly LineStyle[] = ['solid', 'dashed', 'dotted']
  const patterns: readonly ScallopPattern[] = ['wave', 'meander', 'beads']
  const sides: readonly {
    key: 'top' | 'right' | 'bottom' | 'left'
    label: string
  }[] = [
    { key: 'top', label: 'margin.top' },
    { key: 'right', label: 'margin.right' },
    { key: 'bottom', label: 'margin.bottom' },
    { key: 'left', label: 'margin.left' },
  ]

  return (
    <Section id="section-decoration" title={t('section.decoration')}>
      <ToggleField
        label={t('decoration.enable')}
        checked={d.enabled}
        onChange={(enabled) => setDecoration({ enabled })}
      />
      {!d.enabled ? null : (
        <>
          {paper.suggestsCalligraphyFrame ? (
            <div className="callout">
              <p>{t('decoration.calligraphyFrameHint')}</p>
              <button
                type="button"
                className="ctl-button"
                onClick={applyCalligraphyFrame}
              >
                {t('decoration.applyCalligraphyFrame')}
              </button>
            </div>
          ) : null}

          <SelectField
            label={t('decoration.style')}
            value={d.style}
            choices={styles.map((style) => ({
              value: style,
              label: t(`decoration.style.${style}`),
            }))}
            onChange={(value) => changeStyle(value as DecorationStyle)}
          />
          <SelectField
            label={t('decoration.scope')}
            value={d.scope}
            choices={(['content', 'page'] as const).map((scope) => ({
              value: scope,
              label: t(`decoration.scope.${scope}`),
            }))}
            onChange={(value) =>
              setDecoration({ scope: value as DecorationScope })
            }
          />
          <NumberField
            label={t('decoration.inset')}
            value={d.inset}
            min={0}
            max={LIMITS.decoration.insetMax}
            step={1}
            unit={t('unit.mm')}
            onCommit={(inset) => setDecoration({ inset })}
          />
          <ColorField
            label={t('decoration.color')}
            value={d.color}
            onChange={(color) => setDecoration({ color })}
          />
          <SliderField
            label={t('decoration.width')}
            value={d.width}
            min={LIMITS.decoration.width.min}
            max={LIMITS.decoration.width.max}
            step={LIMITS.decoration.width.step}
            decimals={2}
            unit={t('unit.mm')}
            onChange={(width) => setDecoration({ width })}
          />
          <SelectField
            label={t('decoration.lineStyle')}
            value={d.lineStyle}
            choices={lineStyles.map((style) => ({
              value: style,
              label: t(`style.${style}`),
            }))}
            onChange={(value) =>
              setDecoration({ lineStyle: value as LineStyle })
            }
          />

          <fieldset className="ctl-group">
            <legend className="ctl-group-legend">
              {t('decoration.sides')}
            </legend>
            <div className="margins-grid">
              {sides.map((side) => (
                <ToggleField
                  key={side.key}
                  label={t(side.label)}
                  checked={d.sides[side.key]}
                  onChange={(checked) =>
                    setDecoration({
                      sides: { ...d.sides, [side.key]: checked },
                    })
                  }
                />
              ))}
            </div>
          </fieldset>

          {d.style === 'corner' ? (
            <ToggleField
              label={t('decoration.ornaments')}
              checked={d.cornerOrnaments}
              onChange={(cornerOrnaments) => setDecoration({ cornerOrnaments })}
            />
          ) : null}

          {d.style === 'scalloped' ? (
            <>
              <SelectField
                label={t('decoration.pattern')}
                value={d.scallopPattern}
                choices={patterns.map((pattern) => ({
                  value: pattern,
                  label: t(`decoration.pattern.${pattern}`),
                }))}
                onChange={(value) =>
                  setDecoration({ scallopPattern: value as ScallopPattern })
                }
              />
              <SliderField
                label={t('decoration.opacity')}
                value={d.opacity}
                min={LIMITS.decoration.opacity.min}
                max={LIMITS.decoration.opacity.max}
                step={LIMITS.decoration.opacity.step}
                unit="%"
                onChange={(opacity) => setDecoration({ opacity })}
              />
            </>
          ) : null}
        </>
      )}
    </Section>
  )
}
