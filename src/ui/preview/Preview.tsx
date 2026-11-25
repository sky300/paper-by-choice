/** Live preview of the composed pages, with a zoom control. */
import { useMemo, useState, type JSX } from 'react'
import { useLocale } from '../i18n/LocaleProvider'
import { useElementWidth } from './useElementWidth'
import { sceneToSvg } from '../../core/render/svg'
import type { ComposedDocument } from '../../core/compose/document'

/** The preview shows at most this many pages; exports and print use all of them. */
export const PREVIEW_PAGE_CAP = 12

const MM_TO_CSS_PX = 96 / 25.4
const ZOOMS = [0.5, 0.75, 1, 1.5] as const

export interface PreviewProps {
  doc: ComposedDocument
}

export function Preview(props: PreviewProps): JSX.Element {
  const { t } = useLocale()
  const [ref, containerWidth] = useElementWidth<HTMLDivElement>()
  const [zoom, setZoom] = useState<number | 'fit'>('fit')

  const svgStrings = useMemo(
    () =>
      props.doc.pages.map((page) =>
        sceneToSvg(page.scene, page.width, page.height),
      ),
    [props.doc],
  )

  const pageWidth = props.doc.pageSize.width
  const widthPx =
    zoom === 'fit'
      ? Math.max(
          160,
          Math.min(containerWidth - 32 || 640, pageWidth * MM_TO_CSS_PX * 1.5),
        )
      : pageWidth * MM_TO_CSS_PX * zoom

  const shown = Math.min(svgStrings.length, PREVIEW_PAGE_CAP)

  return (
    <div className="preview-pane" ref={ref}>
      <div className="zoom-bar" role="group" aria-label={t('preview.label')}>
        <button
          type="button"
          className="btn btn-quiet zoom-option"
          aria-pressed={zoom === 'fit'}
          onClick={() => setZoom('fit')}
        >
          {t('preview.zoomFit')}
        </button>
        {ZOOMS.map((z) => (
          <button
            key={z}
            type="button"
            className="btn btn-quiet zoom-option"
            aria-pressed={zoom === z}
            onClick={() => setZoom(z)}
          >
            {Math.round(z * 100)}%
          </button>
        ))}
      </div>
      <div className="sheets">
        {svgStrings.slice(0, shown).map((svg, i) => (
          <div
            key={i}
            className="sheet"
            style={{
              width: `${widthPx}px`,
              height: `${(widthPx * props.doc.pageSize.height) / pageWidth}px`,
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ))}
      </div>
      {svgStrings.length > shown ? (
        <p className="preview-more">
          {t('preview.morePages', { shown, total: svgStrings.length })}
        </p>
      ) : null}
    </div>
  )
}
