/** Footer: privacy note and a short printing tip. */
import type { JSX } from 'react'
import { useLocale } from '../i18n/LocaleProvider'

export function Footer(): JSX.Element {
  const { t } = useLocale()
  return (
    <footer className="app-footer">
      <span>{t('app.privacy')}</span>
      <span>{t('app.printTip')}</span>
    </footer>
  )
}
