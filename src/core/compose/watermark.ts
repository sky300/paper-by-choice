/**
 * Watermark layer: a grid of repeated text that covers and overhangs the
 * whole page, rotated as one group around the page centre. Scenes have no
 * transform item, so each text position is rotated explicitly and each text
 * carries its own rotation.
 */
import { group, text } from '../scene/builders'
import type { Pt, Scene, SceneItem } from '../scene/types'
import { EPS } from '../scene/geometry'
import { createFontKit } from '../papers/kit'
import { resolveTheme } from '../themes'
import type { Settings } from '../types'
import type { PageSize } from './document'

/** Hard cap on the steps of either axis loop, guarding against a zero step. */
const MAX_STEPS = 20000

/** Rotates `point` around `centre` clockwise by `degrees` (screen y points down). */
export function rotatePoint(point: Pt, centre: Pt, degrees: number): Pt {
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const dx = point.x - centre.x
  const dy = point.y - centre.y
  return {
    x: centre.x + dx * cos - dy * sin,
    y: centre.y + dx * sin + dy * cos,
  }
}

/** Values from `start` to `end` inclusive, stepping by `step`, with a hard cap. */
function axis(start: number, end: number, step: number): number[] {
  const out: number[] = []
  if (!(step > 0)) return out
  for (let k = 0, value = start; k < MAX_STEPS && value <= end + EPS; k++) {
    out.push(value)
    value = start + (k + 1) * step
  }
  return out
}

/** Watermark layer, or an empty scene when disabled or the text is blank. */
export function watermarkScene(settings: Settings, pageSize: PageSize): Scene {
  const w = settings.watermark
  if (!w.enabled || w.text.trim() === '') return []

  const flatText = w.text.replace(/\r?\n/g, ' ')
  const f = w.size
  const u = 0.6 * f * flatText.length
  if (!(u > 0) || !(f > 0)) return []

  const centre: Pt = { x: pageSize.width / 2, y: pageSize.height / 2 }
  const xs = axis(-u, pageSize.width + u, 2 * u)
  const ys = axis(-f, pageSize.height + f, 3 * f)
  const font = createFontKit(resolveTheme(settings.theme)).body(f)
  const fill = { color: w.color }
  const items: SceneItem[] = []

  for (const y of ys) {
    for (const x of xs) {
      const at = rotatePoint({ x, y }, centre, w.angle)
      items.push(
        text(at.x, at.y, flatText, font, fill, {
          anchor: 'start',
          rotate: w.angle,
        }),
      )
    }
  }

  return [group(items, w.opacity)]
}
