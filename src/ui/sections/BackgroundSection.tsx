/**
 * 配置纸面底色和纹理。
 * Configures paper colors and textures.
 */
/**
 * Background colour, built-in textures and a locally-held custom image.
 *
 * Images are read as data URLs with FileReader and never leave the browser;
 * invalid type or size is reported through an alert message.
 */
import { useRef, useState } from 'react'
import type { ChangeEvent, JSX } from 'react'
import { LIMITS } from '../../core/settings'
import type { TextureKey } from '../../core/types'
import { ColorField } from '../controls/ColorField'
import { Section } from '../controls/Section'
import { SelectField } from '../controls/SelectField'
import { SliderField } from '../controls/SliderField'
import { BACKGROUND_SWATCHES, PATTERN_SWATCHES } from '../palettes'
import { useLocale } from '../i18n/LocaleProvider'
import { useSettings } from '../store/SettingsProvider'

/** The largest custom background image accepted, in bytes. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/** Ordered texture choices; `image` is handled separately below. */
const TEXTURES: readonly TextureKey[] = [
  'none',
  'grid',
  'dots',
  'lines',
  'crosshatch',
  'graph',
  'image',
]

/** Renders the background controls for the current settings. */
export function BackgroundSection(): JSX.Element {
  const { settings, setBackground } = useSettings()
  const { t } = useLocale()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const { texture, image } = settings.background
  const isBuiltIn = texture !== 'none' && texture !== 'image'
  const isImage = texture === 'image'

  /** Validates and reads one selected file into a local data URL. */
  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError(t('background.imageInvalid'))
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(t('background.imageTooLarge'))
      return
    }
    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBackground({ image: reader.result, texture: 'image' })
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <Section id="section-background" title={t('section.background')}>
      <ColorField
        label={t('background.color')}
        value={settings.background.color}
        swatches={BACKGROUND_SWATCHES.map((swatch) => ({
          ...swatch,
          label: t(swatch.label),
        }))}
        onChange={(color) => setBackground({ color })}
      />
      <SelectField
        label={t('background.texture')}
        value={texture}
        choices={TEXTURES.map((key) => ({
          value: key,
          label: t(`texture.${key}`),
        }))}
        onChange={(value) => {
          setError(null)
          setBackground({ texture: value as TextureKey })
        }}
      />

      {isBuiltIn ? (
        <>
          <ColorField
            label={t('background.patternColor')}
            value={settings.background.patternColor}
            swatches={PATTERN_SWATCHES.map((swatch) => ({
              ...swatch,
              label: t(swatch.label),
            }))}
            onChange={(patternColor) => setBackground({ patternColor })}
          />
          <SliderField
            label={t('background.opacity')}
            value={settings.background.patternOpacity}
            min={LIMITS.patternOpacity.min}
            max={LIMITS.patternOpacity.max}
            step={LIMITS.patternOpacity.step}
            unit="%"
            onChange={(patternOpacity) => setBackground({ patternOpacity })}
          />
        </>
      ) : null}

      {isImage ? (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onFile}
          />
          <button
            type="button"
            className="ctl-button"
            onClick={() => fileRef.current?.click()}
          >
            {t('background.chooseImage')}
          </button>
          {image ? (
            <div className="bg-image-row">
              <img
                className="bg-image-thumb"
                src={image}
                alt={t('background.imageAlt')}
              />
              <button
                type="button"
                className="ctl-button"
                onClick={() => setBackground({ image: null })}
              >
                {t('background.clearImage')}
              </button>
            </div>
          ) : null}
          <p className="ctl-hint">{t('background.imageHint')}</p>
          <SliderField
            label={t('background.opacity')}
            value={settings.background.patternOpacity}
            min={LIMITS.imageOpacity.min}
            max={LIMITS.imageOpacity.max}
            step={LIMITS.imageOpacity.step}
            unit="%"
            onChange={(patternOpacity) => setBackground({ patternOpacity })}
          />
        </>
      ) : null}

      {error ? (
        <p className="ctl-error" role="alert">
          {error}
        </p>
      ) : null}
    </Section>
  )
}
