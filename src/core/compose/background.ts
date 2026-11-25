/**
 * 生成纸张底色、纹理与背景图片。
 * Composes paper colors, textures, and background images.
 */
/**
 * Page background: a full-page colour fill plus an optional texture or a
 * user-supplied image. Built-in textures cover the whole page, ignoring the
 * margins, and live in one group so their opacity is applied exactly once.
 */
import { box, circle, group, image, line, rect } from '../scene/builders'
import type { Scene, SceneItem, Stroke } from '../scene/types'
import type { Settings, TextureKey } from '../types'
import type { PageSize } from './document'

/** Grid pitch of the built-in textures, in millimetres. */
export const TEXTURE_PITCH = 5

/** Stroke width of the built-in texture lines, in millimetres. */
export const TEXTURE_LINE_WIDTH = 0.13

/** Radius of the dots texture, in millimetres. */
export const TEXTURE_DOT_RADIUS = 0.25

/** Number of fine grid cells between two major lines of the graph texture. */
export const GRAPH_MAJOR_EVERY = 5

/** Stroke width and extra opacity of the graph texture's fine lines. */
const GRAPH_FINE_WIDTH = 0.05
const GRAPH_FINE_OPACITY = 0.5

/** Hard cap on the iterations of any generated texture loop. */
const MAX_STEPS = 20000

/** Positions `0, pitch, 2·pitch, …` that lie strictly inside `length`. */
function positions(length: number, pitch: number): number[] {
  const out: number[] = []
  if (!(pitch > 0) || !Number.isFinite(length)) return out
  for (let k = 0; k < MAX_STEPS; k++) {
    const p = k * pitch
    if (p >= length) break
    out.push(p)
  }
  return out
}

/** The shapes of one built-in texture, before they are wrapped in a group. */
function textureItems(
  texture: TextureKey,
  color: string,
  pageSize: PageSize,
): SceneItem[] {
  const { width, height } = pageSize
  const main: Stroke = { color, width: TEXTURE_LINE_WIDTH }
  const fine: Stroke = {
    color,
    width: GRAPH_FINE_WIDTH,
    opacity: GRAPH_FINE_OPACITY,
  }
  const items: SceneItem[] = []
  const xs = positions(width, TEXTURE_PITCH)
  const ys = positions(height, TEXTURE_PITCH)

  switch (texture) {
    case 'grid':
      for (const x of xs) items.push(line(x, 0, x, height, main))
      for (const y of ys) items.push(line(0, y, width, y, main))
      break
    case 'lines':
      for (const y of ys) items.push(line(0, y, width, y, main))
      break
    case 'dots':
      for (let i = 0; i < MAX_STEPS; i++) {
        const cx = TEXTURE_PITCH / 2 + i * TEXTURE_PITCH
        if (cx >= width) break
        for (let j = 0; j < MAX_STEPS; j++) {
          const cy = TEXTURE_PITCH / 2 + j * TEXTURE_PITCH
          if (cy >= height) break
          items.push(circle(cx, cy, TEXTURE_DOT_RADIUS, undefined, { color }))
        }
      }
      break
    case 'crosshatch': {
      const h = height
      for (let k = 0; k < MAX_STEPS; k++) {
        const x = -h + k * TEXTURE_PITCH
        if (x >= width + h) break
        items.push(line(x, 0, x + h, h, main))
        items.push(line(x, h, x + h, 0, main))
      }
      break
    }
    case 'graph': {
      const majorPitch = TEXTURE_PITCH * GRAPH_MAJOR_EVERY
      for (const x of xs) items.push(line(x, 0, x, height, fine))
      for (const y of ys) items.push(line(0, y, width, y, fine))
      for (const x of positions(width, majorPitch))
        items.push(line(x, 0, x, height, main))
      for (const y of positions(height, majorPitch))
        items.push(line(0, y, width, y, main))
      break
    }
    case 'none':
    case 'image':
      break
  }
  return items
}

/** Background layer: full-page fill plus the texture or image, when any. */
export function backgroundScene(settings: Settings, pageSize: PageSize): Scene {
  const { width, height } = pageSize
  const bg = settings.background
  const fill = rect(box(0, 0, width, height), undefined, { color: bg.color })

  if (bg.texture === 'image') {
    return bg.image
      ? [fill, image(box(0, 0, width, height), bg.image, bg.patternOpacity)]
      : [fill]
  }
  if (bg.texture === 'none') return [fill]

  return [
    fill,
    group(
      textureItems(bg.texture, bg.patternColor, pageSize),
      bg.patternOpacity,
    ),
  ]
}
