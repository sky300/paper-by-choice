/**
 * 显示站点标题、导航及界面入口。
 * Displays the site identity, navigation, and interface actions.
 *
 * Top bar: brand, language switch, template gallery and the mobile panel toggle.
 */
import type { JSX, Ref } from 'react'
import { useLocale } from '../i18n/LocaleProvider'
import { UiIcon } from '../controls/UiIcon'
import { INTERFACE_STYLES, type InterfaceStyle } from '../interfaceStyle'
import type { InfoPage } from './InfoModal'

export interface HeaderProps {
  interfaceStyle: InterfaceStyle
  onInterfaceStyle: (style: InterfaceStyle) => void
  onOpenGallery?: () => void
  onOpenInfo?: (page: InfoPage) => void
  onTogglePanel?: () => void
  panelOpen?: boolean
  panelToggleRef?: Ref<HTMLButtonElement>
}

export function Header(props: HeaderProps): JSX.Element {
  const { locale, setLocale, t } = useLocale()
  return (
    <header className="app-header">
      <a
        className="app-brand"
        href={import.meta.env.BASE_URL}
        aria-label={t('app.name')}
        onClick={(event) => {
          const home = new URL(event.currentTarget.href)
          if (
            home.href !== window.location.href ||
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
          )
            return
          event.preventDefault()
          window.scrollTo(0, 0)
        }}
      >
        <span className="app-brand-mark" aria-hidden="true">
          <UiIcon name="type" />
        </span>
        <span className="app-brand-name">{t('app.name')}</span>
        <span className="app-brand-tagline">{t('app.tagline')}</span>
      </a>
      <div className="app-header-actions">
        {props.onOpenGallery ? (
          <button
            type="button"
            className="btn header-link header-gallery"
            onClick={props.onOpenGallery}
          >
            <UiIcon name="gallery" />
            <span>{t('gallery.open')}</span>
          </button>
        ) : null}
        {props.onOpenInfo ? (
          <>
            <button
              type="button"
              className="btn header-link header-guide"
              onClick={() => props.onOpenInfo?.('guide')}
            >
              <UiIcon name="guide" />
              <span>{t('info.guide.open')}</span>
            </button>
            <button
              type="button"
              className="btn header-link header-about"
              onClick={() => props.onOpenInfo?.('about')}
            >
              <UiIcon name="info" />
              <span>{t('info.about.open')}</span>
            </button>
          </>
        ) : null}
        <label className="interface-style-picker" title={t('interface.style')}>
          <UiIcon name="theme" />
          <select
            aria-label={t('interface.style')}
            value={props.interfaceStyle}
            onChange={(event) => {
              const style = INTERFACE_STYLES.find(
                (item) => item === event.target.value,
              )
              if (style) props.onInterfaceStyle(style)
            }}
          >
            {INTERFACE_STYLES.map((style) => (
              <option key={style} value={style}>
                {t(`interface.style.${style}`)}
              </option>
            ))}
          </select>
        </label>
        <div className="lang-switch" role="group" aria-label="Language">
          <button
            type="button"
            className="btn btn-quiet"
            aria-pressed={locale === 'zh-CN'}
            onClick={() => setLocale('zh-CN')}
          >
            中文
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            aria-pressed={locale === 'en'}
            onClick={() => setLocale('en')}
          >
            English
          </button>
        </div>
        {props.onTogglePanel ? (
          <button
            type="button"
            className="btn btn-quiet panel-toggle"
            onClick={props.onTogglePanel}
            ref={props.panelToggleRef}
            aria-controls="paper-settings"
            aria-expanded={props.panelOpen ?? false}
          >
            <UiIcon name="options" />
            {props.panelOpen ? t('common.close') : t('common.settings')}
          </button>
        ) : null}
      </div>
    </header>
  )
}
