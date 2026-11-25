/**
 * 提供导出格式、清晰度和打印操作。
 * Provides export, resolution, and print actions.
 *
 * Export bar: PDF / SVG / PNG / print, with a PNG resolution selector.
 */
import { useEffect, useState, type JSX } from 'react'
import { UiIcon } from '../controls/UiIcon'
import { useLocale } from '../i18n/LocaleProvider'
import { useSettings } from '../store/SettingsProvider'
import { exportPdf, exportPng, exportSvg } from '../export/exporters'
import type { ComposedDocument } from '../../core/compose/document'

type Format = 'pdf' | 'svg' | 'png'

export interface ExportBarProps {
  doc: ComposedDocument
  onPrint: () => void
}

export function ExportBar(props: ExportBarProps): JSX.Element {
  const { t } = useLocale()
  const { settings } = useSettings()
  const [dpi, setDpi] = useState(300)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{
    kind: 'ok' | 'error'
    text: string
  } | null>(null)

  useEffect(() => {
    if (!status) return
    const timer = setTimeout(() => setStatus(null), 2500)
    return () => clearTimeout(timer)
  }, [status])

  const run = async (format: Format): Promise<void> => {
    setBusy(true)
    setStatus(null)
    try {
      if (format === 'pdf') await exportPdf(props.doc, settings, undefined)
      if (format === 'svg') await exportSvg(props.doc, settings)
      if (format === 'png') await exportPng(props.doc, settings, dpi)
      setStatus({
        kind: 'ok',
        text: t('export.done', { format: format.toUpperCase() }),
      })
    } catch {
      setStatus({ kind: 'error', text: t('export.failed') })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="export-bar">
      <button
        type="button"
        className="btn export-action export-pdf"
        disabled={busy}
        onClick={() => void run('pdf')}
      >
        <UiIcon name="download" />
        {t('export.pdf')}
      </button>
      <button
        type="button"
        className="btn export-action export-svg"
        disabled={busy}
        title={t('export.svgNote')}
        onClick={() => void run('svg')}
      >
        <UiIcon name="type" />
        {t('export.svg')}
      </button>
      <button
        type="button"
        className="btn export-action export-png"
        disabled={busy}
        title={t('export.pngNote')}
        onClick={() => void run('png')}
      >
        <UiIcon name="background" />
        {t('export.png')}
      </button>
      <label className="export-dpi">
        {t('export.dpi')}
        <select
          value={dpi}
          onChange={(e) => setDpi(Number(e.target.value))}
          disabled={busy}
        >
          <option value={150}>150</option>
          <option value={300}>300</option>
          <option value={600}>600</option>
        </select>
      </label>
      <button
        type="button"
        className="btn export-action export-print"
        disabled={busy}
        onClick={props.onPrint}
      >
        <UiIcon name="print" />
        {t('export.print')}
      </button>
      <div
        className="export-status"
        role={status?.kind === 'error' ? 'alert' : 'status'}
      >
        {busy ? t('export.working') : (status?.text ?? '')}
      </div>
    </div>
  )
}
