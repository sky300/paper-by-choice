/**
 * 显示版权信息及使用提示。
 * Displays copyright and usage notes.
 *
 * Footer: privacy note, printing guidance and project credit.
 */
import type { JSX } from 'react'
import { useLocale } from '../i18n/LocaleProvider'

export function Footer(): JSX.Element {
  const { t } = useLocale()
  return (
    <footer className="app-footer">
      <span>{t('app.privacy')}</span>
      <span>{t('app.printTip')}</span>
      <span className="app-credit">{t('app.credit')}</span>
    </footer>
  )
}
