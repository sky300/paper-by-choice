/**
 * 调用渲染器并组织 PDF、SVG、PNG 导出。
 * Orchestrates PDF, SVG, and PNG exports.
 */
/**
 * Browser-side export entry points.
 *
 * The geometry comes from `buildDocument`; this module only serialises it into
 * files. Every platform-specific operation (rasterising, building a PDF,
 * triggering a download) is injectable so the whole module is unit-testable
 * in Node.
 */
import type { Settings } from '../../core/types'
import type { ComposedDocument } from '../../core/compose/document'
import { sceneToSvgBody } from '../../core/render/svg'
import {
  rasterizePage,
  canvasToPngBlob,
  type RasterCanvas,
} from '../../core/render/raster'
import { buildPdf } from '../../core/render/pdf'
import { createTextRasterizer } from '../../core/render/textRaster'
import { pageSizeMm } from '../../core/paperSizes'

/** Triggers a browser download of a Blob without adding it to the DOM. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Triggers a browser download of a UTF-8 text file. */
export function downloadText(
  text: string,
  filename: string,
  mimeType = 'text/plain;charset=utf-8',
): void {
  downloadBlob(new Blob([text], { type: mimeType }), filename)
}

export interface ExportOutcome {
  filename: string
  files: number
}

export interface ExportDeps {
  rasterizePage: typeof rasterizePage
  buildPdf: typeof buildPdf
  download: (blob: Blob, filename: string) => void
}

/** `paper-by-choice-<type>-<size>-<yyyyMMdd>.<ext>` */
export function exportFileName(
  settings: Settings,
  extension: string,
  date: Date = new Date(),
): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const size =
    settings.paperSize === 'custom'
      ? `${Math.round(settings.customSize.width)}x${Math.round(settings.customSize.height)}mm`
      : settings.paperSize.toUpperCase()
  return `paper-by-choice-${settings.paperType}-${size}-${y}${m}${d}.${extension}`
}

const XMLNS = 'http://www.w3.org/2000/svg'
const XLINK = 'http://www.w3.org/1999/xlink'

/**
 * All pages stacked vertically in one SVG file, with a 10 mm gutter. The
 * returned string is a complete, standalone SVG document.
 */
export function mergeSvg(doc: ComposedDocument): string {
  const gap = 10
  const width = Math.max(...doc.pages.map((page) => page.width))
  const height =
    doc.pages.reduce((sum, page) => sum + page.height, 0) +
    gap * (doc.pages.length - 1)
  const parts: string[] = [
    `<svg xmlns="${XMLNS}" xmlns:xlink="${XLINK}" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}">`,
  ]
  let y = 0
  for (const page of doc.pages) {
    parts.push(`<g transform="translate(0, ${y})">`)
    parts.push(sceneToSvgBody(page.scene))
    parts.push('</g>')
    y += page.height + gap
  }
  parts.push('</svg>')
  return parts.join('')
}

const nextTask = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 0))

/** Downloads every page of the document as one multi-page SVG file. */
export async function exportSvg(
  doc: ComposedDocument,
  settings: Settings,
): Promise<ExportOutcome> {
  const filename = exportFileName(settings, 'svg')
  downloadText(mergeSvg(doc), filename, `${'image/svg+xml'};charset=utf-8`)
  return { filename, files: 1 }
}

/** Downloads one PNG per page, at the requested resolution. */
export async function exportPng(
  doc: ComposedDocument,
  settings: Settings,
  dpi = 300,
  deps?: Partial<ExportDeps>,
): Promise<ExportOutcome> {
  const rasterize = deps?.rasterizePage ?? rasterizePage
  const download = deps?.download ?? downloadBlob
  const digits = String(doc.pages.length).length
  const base = exportFileName(settings, 'png').replace(/\.png$/, '')
  for (const [i, page] of doc.pages.entries()) {
    const canvas: RasterCanvas = await rasterize(page, { dpi })
    const blob = await canvasToPngBlob(canvas.canvas)
    download(blob, `${base}-${String(i + 1).padStart(digits, '0')}.png`)
    await nextTask()
  }
  return { filename: `${base}.png`, files: doc.pages.length }
}

/** Builds one vector PDF; text is embedded as 600 DPI transparent patches. */
export async function exportPdf(
  doc: ComposedDocument,
  settings: Settings,
  deps?: Partial<ExportDeps>,
): Promise<ExportOutcome> {
  const build = deps?.buildPdf ?? buildPdf
  const download = deps?.download ?? downloadBlob
  const filename = exportFileName(settings, 'pdf')
  const bytes = await build(doc.pages, {
    textRasterizer: createTextRasterizer({ dpi: 600 }),
    title: 'Paper by Choice',
  })
  download(
    new Blob([bytes.slice().buffer as ArrayBuffer], {
      type: 'application/pdf',
    }),
    filename,
  )
  return { filename, files: 1 }
}

/** Physical page size in millimetres, for the print CSS. */
export function exportPageSize(settings: Settings): {
  width: number
  height: number
} {
  return pageSizeMm(
    settings.paperSize,
    settings.orientation,
    settings.customSize,
  )
}
