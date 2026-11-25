/**
 * 生成适用纸张尺寸的打印样式。
 * Builds print CSS for the selected paper dimensions.
 *
 * Print stylesheet: exact @page size and rules that swap the screen UI for sheets.
 */
import { formatNumber } from '../../core/render/svg'

/** CSS text injected into a <style> element at runtime. */
export function buildPrintCss(pageSize: {
  width: number
  height: number
}): string {
  const w = formatNumber(pageSize.width)
  const h = formatNumber(pageSize.height)
  return `@page { size: ${w}mm ${h}mm; margin: 0; }
.print-root { display: none; }
@media print {
  html, body { margin: 0; padding: 0; background: #fff; }
  .app-shell { display: none !important; }
  .print-root { display: block; }
  .print-page { width: ${w}mm; height: ${h}mm; overflow: hidden; break-after: page; page-break-after: always; }
  .print-page:last-child { break-after: auto; page-break-after: auto; }
  .print-page svg { display: block; width: 100%; height: 100%; }
}
`
}
