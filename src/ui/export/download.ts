/**
 * Browser downloads for generated files.
 *
 * All DOM and URL access lives inside the functions, so this module is safe to
 * import from code that also runs in a non-DOM environment.
 */

/** Saves a Blob by clicking a temporary anchor and revoking its object URL. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

/** Saves text as a file; defaults to plain UTF-8 text. */
export function downloadText(
  text: string,
  filename: string,
  mimeType = 'text/plain;charset=utf-8',
): void {
  downloadBlob(new Blob([text], { type: mimeType }), filename)
}
