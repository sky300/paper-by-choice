/** The whole application: header, control panel, preview, exports and print. */
import { flushSync } from 'react-dom'
import { useEffect, useMemo, useState, type JSX } from 'react'
import { useLocale } from '../i18n/LocaleProvider'
import { useSettings } from '../store/SettingsProvider'
import { buildDocument } from '../../core/compose/document'
import { sceneToSvg } from '../../core/render/svg'
import { Header } from './Header'
import { ControlPanel } from './ControlPanel'
import { Footer } from './Footer'
import { ExportBar } from './ExportBar'
import { Preview } from '../preview/Preview'
import { TemplateGallery } from '../gallery/TemplateGallery'
import { InfoModal, type InfoPage } from './InfoModal'
import { readInterfaceStyle, saveInterfaceStyle } from '../interfaceStyle'
import { buildPrintCss } from '../print/printCss'

export function Workspace(): JSX.Element {
  const { settings } = useSettings()
  const { locale, t } = useLocale()
  const [interfaceStyle, setInterfaceStyle] = useState(readInterfaceStyle)
  useEffect(() => saveInterfaceStyle(interfaceStyle), [interfaceStyle])
  const [panelOpen, setPanelOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [infoPage, setInfoPage] = useState<InfoPage | null>(null)
  const [printOpen, setPrintOpen] = useState(false)

  const doc = useMemo(
    () => buildDocument({ settings, locale }),
    [settings, locale],
  )

  useEffect(() => {
    const after = (): void => setPrintOpen(false)
    window.addEventListener('afterprint', after)
    return () => window.removeEventListener('afterprint', after)
  }, [])

  const print = (): void => {
    flushSync(() => setPrintOpen(true))
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        window.print()
      }),
    )
  }

  return (
    <div className="interface-style" data-interface-style={interfaceStyle}>
      <div className="app-shell">
        <Header
          interfaceStyle={interfaceStyle}
          onInterfaceStyle={setInterfaceStyle}
          onOpenGallery={() => setGalleryOpen(true)}
          onOpenInfo={(page) => setInfoPage(page)}
          onTogglePanel={() => setPanelOpen((open) => !open)}
          panelOpen={panelOpen}
        />
        <main className="app-main">
          <ControlPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
          <section className="preview-region" aria-label={t('preview.label')}>
            <ExportBar doc={doc} onPrint={print} />
            <Preview doc={doc} />
          </section>
        </main>
        <Footer />
        {panelOpen ? (
          <div className="panel-backdrop" onClick={() => setPanelOpen(false)} />
        ) : null}
      </div>

      {printOpen ? (
        <div className="print-root">
          {doc.pages.map((page, i) => (
            <div
              key={i}
              className="print-page"
              dangerouslySetInnerHTML={{
                __html: sceneToSvg(page.scene, page.width, page.height),
              }}
            />
          ))}
        </div>
      ) : null}
      <style>{buildPrintCss(doc.pageSize)}</style>

      {galleryOpen ? (
        <TemplateGallery
          onChoose={() => setGalleryOpen(false)}
          onClose={() => setGalleryOpen(false)}
        />
      ) : null}
      {infoPage ? (
        <InfoModal page={infoPage} onClose={() => setInfoPage(null)} />
      ) : null}
    </div>
  )
}
