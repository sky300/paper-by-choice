/** Top bar: brand, language switch, template gallery and the mobile panel toggle. */
import type { JSX } from 'react'
import { useLocale } from '../i18n/LocaleProvider'
import type { InfoPage } from './InfoModal'

export interface HeaderProps {
  onOpenGallery?: () => void
  onOpenInfo?: (page: InfoPage) => void
  onTogglePanel?: () => void
  panelOpen?: boolean
}

export function Header(props: HeaderProps): JSX.Element {
  const { locale, setLocale, t } = useLocale()
  return (
    <header className="app-header">
      <div className="app-brand">
        <span className="app-brand-name">{t('app.name')}</span>
        <span className="app-brand-tagline">{t('app.tagline')}</span>
      </div>
      <div className="app-header-actions">
        {props.onOpenGallery ? (
          <button
            type="button"
            className="btn btn-quiet"
            onClick={props.onOpenGallery}
          >
            {t('gallery.open')}
          </button>
        ) : null}
        {props.onOpenInfo ? (
          <>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => props.onOpenInfo?.('guide')}
            >
              {t('info.guide.open')}
            </button>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => props.onOpenInfo?.('about')}
            >
              {t('info.about.open')}
            </button>
          </>
        ) : null}
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
          >
            {props.panelOpen ? t('common.close') : t('common.settings')}
          </button>
        ) : null}
      </div>
    </header>
  )
}
