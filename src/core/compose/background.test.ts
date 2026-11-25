/**
 * 验证 background 模块的 backgroundScene: constants、backgroundScene: base fill、backgroundScene: built-in textures 行为。
 * Tests background behavior covering backgroundScene: constants, backgroundScene: base fill, backgroundScene: built-in textures.
 */
import { describe, expect, test } from 'vitest'
import {
  GRAPH_MAJOR_EVERY,
  TEXTURE_DOT_RADIUS,
  TEXTURE_LINE_WIDTH,
  TEXTURE_PITCH,
  backgroundScene,
} from './background'
import type { PageSize } from './document'
import { createSettings } from '../settings'
import { shapesOf } from '../testing/paperTestKit'
import type { BackgroundSettings, Settings } from '../types'

const A4: PageSize = { width: 210, height: 297 }

/** Default settings with only the background section replaced. */
function withBackground(patch: Partial<BackgroundSettings>): Settings {
  const base = createSettings('lined')
  return { ...base, background: { ...base.background, ...patch } }
}

describe('backgroundScene: constants', () => {
  test('exposes the documented pitch, widths and major-line cadence', () => {
    expect(TEXTURE_PITCH).toBe(5)
    expect(TEXTURE_LINE_WIDTH).toBe(0.13)
    expect(TEXTURE_DOT_RADIUS).toBe(0.25)
    expect(GRAPH_MAJOR_EVERY).toBe(5)
  })
})

describe('backgroundScene: base fill', () => {
  test('fills the whole page with the background colour and nothing else when texture is none', () => {
    const scene = backgroundScene(
      withBackground({ texture: 'none', color: '#fff8e1' }),
      A4,
    )
    expect(scene).toHaveLength(1)
    expect(scene[0]).toMatchObject({
      op: 'rect',
      box: { x: 0, y: 0, w: 210, h: 297 },
      fill: { color: '#fff8e1' },
    })
  })

  test('keeps the full-page fill as the first item even when a texture follows', () => {
    const scene = backgroundScene(withBackground({ texture: 'grid' }), A4)
    expect(scene[0]).toMatchObject({
      op: 'rect',
      box: { x: 0, y: 0, w: 210, h: 297 },
    })
    expect(scene.length).toBeGreaterThan(1)
  })
})

describe('backgroundScene: built-in textures', () => {
  test('wraps a built-in texture in one group whose opacity is patternOpacity', () => {
    const scene = backgroundScene(
      withBackground({ texture: 'grid', patternOpacity: 0.35 }),
      A4,
    )
    const groups = scene.filter((item) => item.op === 'g')
    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ op: 'g', opacity: 0.35 })
  })

  test('draws 42 vertical and 60 horizontal grid lines at 5 mm on A4', () => {
    const scene = backgroundScene(
      withBackground({ texture: 'grid', patternColor: '#abcdef' }),
      A4,
    )
    const lines = shapesOf(scene, 'line')
    const vertical = lines.filter((item) => item.x1 === item.x2)
    const horizontal = lines.filter((item) => item.y1 === item.y2)
    expect(vertical).toHaveLength(42)
    expect(horizontal).toHaveLength(60)
    expect(vertical[0]).toMatchObject({ x1: 0, x2: 0, y1: 0, y2: 297 })
    expect(vertical.at(-1)).toMatchObject({ x1: 205, x2: 205 })
    expect(horizontal.at(-1)).toMatchObject({ y1: 295, y2: 295 })
  })

  test('uses patternColor and the fixed texture line width for grid lines', () => {
    const scene = backgroundScene(
      withBackground({ texture: 'grid', patternColor: '#abcdef' }),
      A4,
    )
    const line = shapesOf(scene, 'line')[0]
    expect(line.stroke).toEqual({ color: '#abcdef', width: TEXTURE_LINE_WIDTH })
  })

  test('drops the line hugging the right edge on a 203 mm wide page', () => {
    const scene = backgroundScene(withBackground({ texture: 'grid' }), {
      width: 203,
      height: 297,
    })
    const vertical = shapesOf(scene, 'line').filter(
      (item) => item.x1 === item.x2,
    )
    expect(vertical).toHaveLength(41)
    expect(vertical.at(-1)).toMatchObject({ x1: 200 })
  })

  test('draws horizontal lines only for the lines texture', () => {
    const scene = backgroundScene(withBackground({ texture: 'lines' }), A4)
    const lines = shapesOf(scene, 'line')
    expect(lines).toHaveLength(60)
    expect(lines.every((item) => item.y1 === item.y2 && item.x1 === 0)).toBe(
      true,
    )
  })

  test('places dots on the 2.5 + 5i grid strictly inside the page', () => {
    const scene = backgroundScene(
      withBackground({ texture: 'dots', patternColor: '#123456' }),
      { width: 20, height: 15 },
    )
    const dots = shapesOf(scene, 'ellipse')
    expect(dots).toHaveLength(12)
    expect(
      dots.every(
        (dot) =>
          dot.rx === TEXTURE_DOT_RADIUS &&
          dot.ry === TEXTURE_DOT_RADIUS &&
          dot.fill?.color === '#123456',
      ),
    ).toBe(true)
    const centres = dots.map((dot) => `${dot.cx},${dot.cy}`)
    expect(centres).toContain('2.5,2.5')
    expect(centres).toContain('17.5,12.5')
    expect(centres).not.toContain('22.5,2.5')
    expect(centres).not.toContain('2.5,17.5')
    expect(shapesOf(scene, 'line')).toHaveLength(0)
  })

  test('draws two mirrored diagonals per crosshatch step and the expected count', () => {
    const scene = backgroundScene(withBackground({ texture: 'crosshatch' }), {
      width: 20,
      height: 10,
    })
    const lines = shapesOf(scene, 'line')
    expect(lines).toHaveLength(16)
    const down = lines.find((item) => item.x1 === -10 && item.y1 === 0)
    const up = lines.find((item) => item.x1 === -10 && item.y1 === 10)
    expect(down).toMatchObject({ x2: 0, y2: 10 })
    expect(up).toMatchObject({ x2: 0, y2: 0 })
  })

  test('draws thin 5 mm lines and thick 25 mm lines for the graph texture', () => {
    const scene = backgroundScene(withBackground({ texture: 'graph' }), {
      width: 30,
      height: 30,
    })
    const lines = shapesOf(scene, 'line')
    const thin = lines.filter((item) => item.stroke.width === 0.05)
    const thick = lines.filter(
      (item) => item.stroke.width === TEXTURE_LINE_WIDTH,
    )
    expect(thin).toHaveLength(12)
    expect(thick).toHaveLength(4)
    expect(thin.every((item) => item.stroke.opacity === 0.5)).toBe(true)
    expect(thick.every((item) => item.stroke.opacity === undefined)).toBe(true)
    expect(thick.every((item) => item.stroke.color === '#e0e0e0')).toBe(true)
  })
})

describe('backgroundScene: custom image', () => {
  test('adds a single full-page image whose own opacity is patternOpacity', () => {
    const src = 'data:image/png;base64,AAAA'
    const scene = backgroundScene(
      withBackground({ texture: 'image', image: src, patternOpacity: 0.4 }),
      A4,
    )
    expect(scene).toHaveLength(2)
    const images = shapesOf(scene, 'image')
    expect(images).toHaveLength(1)
    expect(images[0]).toMatchObject({
      box: { x: 0, y: 0, w: 210, h: 297 },
      src,
      opacity: 0.4,
    })
    expect(scene.filter((item) => item.op === 'g')).toHaveLength(0)
  })

  test('falls back to the fill alone when image is selected but no image is set', () => {
    const scene = backgroundScene(
      withBackground({ texture: 'image', image: null }),
      A4,
    )
    expect(scene).toHaveLength(1)
    expect(scene[0].op).toBe('rect')
  })
})
