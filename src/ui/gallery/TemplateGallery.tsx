/** Template gallery: every preset of every paper, as a searchable modal. */
import { useEffect, useMemo, useRef, useState, type JSX } from 'react'
import { useLocale } from '../i18n/LocaleProvider'
import { useSettings } from '../store/SettingsProvider'
import { papers, paperName } from '../../core/papers/registry'
import {
  createSettings,
  applyPreset,
  switchPaperType,
} from '../../core/settings'
import { paperTranslator } from '../../i18n/index'
import { buildDocument } from '../../core/compose/document'
import { sceneToSvg } from '../../core/render/svg'
import type { AnyPaper, Preset } from '../../core/papers/contract'
import type { Locale, PaperType } from '../../core/types'

export interface GalleryEntry {
  paper: AnyPaper
  preset: Preset
}

/** All presets of all registered papers, in registry order. */
export function collectGalleryEntries(): GalleryEntry[] {
  return papers.flatMap((paper) =>
    paper.presets.map((preset) => ({ paper, preset })),
  )
}

export interface TemplateGalleryProps {
  onChoose: (paperType: PaperType, presetId: string) => void
  onClose: () => void
}

/** One cached SVG string per (paper, preset, locale); thumbnails never re-render. */
const thumbCache = new Map<string, string>()

function thumbnail(entry: GalleryEntry, locale: Locale): string {
  const key = `${entry.paper.type}:${entry.preset.id}:${locale}`
  const cached = thumbCache.get(key)
  if (cached) return cached
  const settings = createSettings(entry.paper.type, entry.preset.id)
  const doc = buildDocument({ settings, locale })
  const svg = sceneToSvg(
    doc.pages[0].scene,
    doc.pageSize.width,
    doc.pageSize.height,
  )
  thumbCache.set(key, svg)
  return svg
}

export function TemplateGallery(props: TemplateGalleryProps): JSX.Element {
  const { locale, t } = useLocale()
  const { settings, update } = useSettings()
  const [query, setQuery] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') props.onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previousFocus.current?.focus()
    }
  }, [props.onClose])

  const entries = useMemo(() => collectGalleryEntries(), [])
  const needle = query.trim().toLowerCase()
  const filtered = needle
    ? entries.filter((entry) => {
        const pt = paperTranslator(entry.paper, locale)
        const name = pt(entry.preset.name)
        const paper = paperName(entry.paper, locale)
        return `${name} ${paper}`.toLowerCase().includes(needle)
      })
    : entries

  const groups = useMemo(() => {
    const map = new Map<string, GalleryEntry[]>()
    for (const entry of filtered) {
      const key = entry.paper.type
      const list = map.get(key)
      if (list) list.push(entry)
      else map.set(key, [entry])
    }
    return [...map.entries()]
  }, [filtered])

  const choose = (entry: GalleryEntry): void => {
    update((s) =>
      applyPreset(switchPaperType(s, entry.paper.type), entry.preset.id),
    )
    props.onChoose(entry.paper.type, entry.preset.id)
  }

  return (
    <div className="gallery-backdrop" onClick={props.onClose}>
      <div
        className="gallery"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-title"
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gallery-header">
          <h2 id="gallery-title">{t('gallery.title')}</h2>
          <input
            className="gallery-search"
            type="search"
            placeholder={t('gallery.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-quiet"
            onClick={props.onClose}
          >
            {t('common.close')}
          </button>
        </div>
        {groups.length === 0 ? (
          <p className="gallery-empty">{t('gallery.empty')}</p>
        ) : (
          <div className="gallery-grid">
            {groups.map(([type, list]) => (
              <div key={type} className="gallery-group">
                <h3 className="gallery-group-title">
                  {paperName(list[0].paper, locale)}
                </h3>
                {list.map((entry) => {
                  const active =
                    settings.paperType === entry.paper.type &&
                    entry.preset.id === entry.paper.presets[0].id
                  return (
                    <button
                      key={entry.preset.id}
                      type="button"
                      className="gallery-card"
                      aria-current={active || undefined}
                      onClick={() => choose(entry)}
                    >
                      <span
                        className="gallery-thumb"
                        dangerouslySetInnerHTML={{
                          __html: thumbnail(entry, locale),
                        }}
                      />
                      <span className="gallery-meta">
                        <strong>
                          {paperTranslator(
                            entry.paper,
                            locale,
                          )(entry.preset.name)}
                        </strong>
                        <small>
                          {paperTranslator(
                            entry.paper,
                            locale,
                          )(entry.preset.description)}
                        </small>
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
