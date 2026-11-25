/**
 * 验证 printCss 模块的行为（生成适用纸张尺寸的打印样式）。
 * Tests the printCss module, which builds print CSS for the selected paper dimensions.
 */
// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest'
import { buildPrintCss } from './printCss'

describe('buildPrintCss', () => {
  test('sets the exact page size in millimetres and zeroes the margin', () => {
    const css = buildPrintCss({ width: 210, height: 297 })
    expect(css).toContain('@page { size: 210mm 297mm; margin: 0; }')
  })

  test('formats fractional sizes without trailing zeros', () => {
    expect(buildPrintCss({ width: 215.9, height: 279.4 })).toContain(
      '@page { size: 215.9mm 279.4mm; margin: 0; }',
    )
  })

  test('hides the app and reveals the print root only while printing', () => {
    const css = buildPrintCss({ width: 210, height: 297 })
    expect(css).toContain('.print-root { display: none; }')
    expect(css).toContain('@media print')
    expect(css).toContain('.app-shell { display: none !important; }')
    expect(css).toContain('break-after: page')
    expect(css).toContain('.print-page:last-child')
  })
})
