/**
 * 导入和导出纸张设置。
 * Imports and exports paper settings.
 */
/**
 * Import and export of the whole settings object.
 *
 * Export writes the app's JSON envelope; import validates it and reports the
 * machine-readable failure reason, or a short success message.
 */
import { useRef, useState } from 'react'
import type { ChangeEvent, JSX } from 'react'
import {
  parseSettingsImport,
  serializeSettings,
  settingsFileName,
  SettingsImportError,
} from '../../core/settings'
import { downloadText } from '../export/download'
import { Section } from '../controls/Section'
import { useLocale } from '../i18n/LocaleProvider'
import { useSettings } from '../store/SettingsProvider'

/** One feedback message: either a success status or an error alert. */
interface Notice {
  text: string
  error: boolean
}

/** Renders the export / import buttons and their feedback message. */
export function TransferSection(): JSX.Element {
  const { settings, replace } = useSettings()
  const { t } = useLocale()
  const fileRef = useRef<HTMLInputElement>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  /** Downloads the current settings under the conventional file name. */
  function exportSettings() {
    downloadText(
      serializeSettings(settings),
      settingsFileName(settings),
      'application/json',
    )
  }

  /** Reads one JSON file, validates it and replaces the settings on success. */
  function importSettings(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = parseSettingsImport(String(reader.result ?? ''))
        replace(parsed.settings)
        setNotice({ text: t('transfer.imported'), error: false })
      } catch (cause) {
        const reason =
          cause instanceof SettingsImportError ? cause.reason : 'invalidJson'
        setNotice({ text: t(`transfer.failure.${reason}`), error: true })
      }
    }
    reader.readAsText(file)
  }

  return (
    <Section id="section-transfer" title={t('section.transfer')}>
      <div className="ctl-group ctl-button-row">
        <button type="button" className="ctl-button" onClick={exportSettings}>
          {t('transfer.export')}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          hidden
          onChange={importSettings}
        />
        <button
          type="button"
          className="ctl-button"
          onClick={() => fileRef.current?.click()}
        >
          {t('transfer.import')}
        </button>
      </div>
      {notice ? (
        <p className="ctl-notice" role={notice.error ? 'alert' : 'status'}>
          {notice.text}
        </p>
      ) : null}
    </Section>
  )
}
