import { describe, expect, test } from 'vitest'
import { text } from '../scene/builders'
import type { TextItem } from '../scene/types'
import type { RasterCanvas, RasterContext } from './raster'
import { canvasToPngBlob, fontOf } from './raster'
import { createTextRasterizer, patchLayout } from './textRaster'
import type { TextMetricsLike } from './textRaster'

interface Recorded {
  name: string
  args: readonly unknown[]
  font: string
  textAlign: string
  textBaseline: string
  fillStyle: string
}

const item = (
  value: string,
  anchor?: TextItem['anchor'],
  baseline?: TextItem['baseline'],
): TextItem =>
  text(
    12,
    34,
    value,
    { family: 'serif', size: 4, weight: 700, style: 'italic' },
    { color: '#123456' },
    { anchor, baseline, rotate: 15 },
  )

interface FakeCanvas extends RasterCanvas {
  recorded: Recorded[]
}

/** Canvas factory whose contexts record calls and return a chosen measureText. */
function fakeCanvases(
  metricsFor: (text: string) => TextMetrics,
  pngBytes: Uint8Array = new Uint8Array([1, 2, 3, 4]),
) {
  const made: { w: number; h: number; canvas: FakeCanvas }[] = []
  const createCanvas = (widthPx: number, heightPx: number): RasterCanvas => {
    const recorded: Recorded[] = []
    const state = {
      font: '10px sans-serif',
      textAlign: 'start' as CanvasTextAlign,
      textBaseline: 'alphabetic' as CanvasTextBaseline,
      fillStyle: '#000000',
    }
    const record = (name: string, ...args: unknown[]): void => {
      recorded.push({
        name,
        args,
        font: state.font,
        textAlign: state.textAlign,
        textBaseline: state.textBaseline,
        fillStyle: state.fillStyle,
      })
    }
    const ctx = Object.assign(state, {
      measureText(value: string): TextMetrics {
        record('measureText', value)
        return metricsFor(value)
      },
      fillText(value: string, x: number, y: number): void {
        record('fillText', value, x, y)
      },
    })
    const pngBlob = {
      arrayBuffer: async () =>
        pngBytes.buffer.slice(
          pngBytes.byteOffset,
          pngBytes.byteOffset + pngBytes.byteLength,
        ),
    } as Blob
    const canvas = {
      width: widthPx,
      height: heightPx,
      convertToBlob: async () => pngBlob,
    }
    const holder: FakeCanvas = {
      context: ctx as unknown as RasterContext,
      canvas,
      widthPx,
      heightPx,
      recorded,
    }
    made.push({ w: widthPx, h: heightPx, canvas: holder })
    return holder
  }
  return { made, createCanvas }
}

const named = (
  recorded: readonly Recorded[],
  name: string,
  index = 0,
): Recorded => {
  const hit = recorded.filter((r) => r.name === name)[index]
  if (!hit) throw new Error(`no call named ${name} (#${index})`)
  return hit
}

const metrics = (
  extra: Partial<TextMetrics> & { width?: number },
): TextMetrics => ({ width: 100, ...extra }) as TextMetrics

describe('patchLayout', () => {
  const scaleFor = (dpi: number) => dpi / 25.4

  test('derives patch size and offsets from the measured bounding box', () => {
    const m: TextMetricsLike = { left: 10, right: 20, ascent: 30, descent: 5 }
    const scale = scaleFor(600)
    const pad = 2
    expect(patchLayout(m, scale, pad)).toEqual({
      widthPx: Math.ceil(10 + 20 + 2 * pad),
      heightPx: Math.ceil(30 + 5 + 2 * pad),
      dx: -(10 + pad) / scale,
      dy: -(30 + pad) / scale,
    })
  })

  test('adds padding to every side', () => {
    const noPad = patchLayout(
      { left: 0, right: 0, ascent: 0, descent: 0 },
      1,
      0,
    )
    const withPad = patchLayout(
      { left: 0, right: 0, ascent: 0, descent: 0 },
      1,
      3,
    )
    expect(noPad.widthPx).toBe(0)
    expect(withPad.widthPx).toBe(6)
    expect(withPad.heightPx).toBe(6)
    expect(withPad.dx).toBe(-3)
    expect(withPad.dy).toBe(-3)
  })
})

describe('createTextRasterizer', () => {
  test('returns null for blank or whitespace-only text', async () => {
    const { createCanvas } = fakeCanvases(() => metrics({}))
    const rasterize = createTextRasterizer({ dpi: 600, createCanvas })
    expect(await rasterize(item(''))).toBeNull()
    expect(await rasterize(item('   \n\t '))).toBeNull()
  })

  test('uses the measured bounding box for the patch', async () => {
    const measured = metrics({
      actualBoundingBoxLeft: 10,
      actualBoundingBoxRight: 20,
      actualBoundingBoxAscent: 30,
      actualBoundingBoxDescent: 5,
    })
    const { made, createCanvas } = fakeCanvases(() => measured)
    const rasterize = createTextRasterizer({ dpi: 600, createCanvas })
    const patch = await rasterize(item('Hello'))
    expect(patch).not.toBeNull()
    const scale = 600 / 25.4
    expect(made[0]).toMatchObject({ w: 1, h: 1 })
    expect(made[1].w).toBe(Math.ceil(10 + 20 + 4))
    expect(made[1].h).toBe(Math.ceil(30 + 5 + 4))
    expect(patch).toMatchObject({
      dpi: 600,
      widthPx: Math.ceil(10 + 20 + 4),
      heightPx: Math.ceil(30 + 5 + 4),
      dx: -(10 + 2) / scale,
      dy: -(30 + 2) / scale,
    })
  })

  test('falls back to width estimation when bounding box fields are missing', async () => {
    const { made, createCanvas } = fakeCanvases(() => metrics({ width: 100 }))
    const rasterize = createTextRasterizer({ dpi: 600, createCanvas })
    const patch = await rasterize(item('Hello'))
    expect(patch).not.toBeNull()
    const scale = 600 / 25.4
    expect(patch?.widthPx).toBe(Math.ceil(100 + 4))
    expect(patch?.heightPx).toBe(Math.ceil(4 * scale * 1.1 + 4))
    expect(patch?.dx).toBeCloseTo(-2 / scale)
    expect(patch?.dy).toBeCloseTo(-(4 * scale * 0.88 + 2) / scale)
    expect(made[1].w).toBe(patch?.widthPx)
  })

  test('uses half width on the left for a middle anchor when estimating', async () => {
    const { createCanvas } = fakeCanvases(() => metrics({ width: 100 }))
    const rasterize = createTextRasterizer({ dpi: 600, createCanvas })
    const patch = await rasterize(item('Hello', 'middle'))
    expect(patch?.dx).toBeCloseTo(-(50 + 2) / (600 / 25.4))
  })

  test('uses the full width on the left for an end anchor when estimating', async () => {
    const { createCanvas } = fakeCanvases(() => metrics({ width: 100 }))
    const rasterize = createTextRasterizer({ dpi: 600, createCanvas })
    const patch = await rasterize(item('Hello', 'end'))
    expect(patch?.dx).toBeCloseTo(-(100 + 2) / (600 / 25.4))
  })

  test('exports opaque PNG bytes from the drawn canvas', async () => {
    const png = new Uint8Array([137, 80, 78, 71])
    const { createCanvas } = fakeCanvases(() => metrics({}), png)
    const rasterize = createTextRasterizer({ dpi: 600, createCanvas })
    const patch = await rasterize(item('Hi'))
    expect(Array.from(patch?.png ?? [])).toEqual([137, 80, 78, 71])
  })

  test('shares the scene text font string and alignment', async () => {
    const measured = metrics({
      actualBoundingBoxLeft: 2,
      actualBoundingBoxRight: 8,
      actualBoundingBoxAscent: 9,
      actualBoundingBoxDescent: 1,
    })
    const { made, createCanvas } = fakeCanvases(() => measured)
    const rasterize = createTextRasterizer({ dpi: 600, createCanvas })
    await rasterize(item('Hi', 'end', 'middle'))
    const measureCtx = made[0].canvas.recorded
    const drawCtx = made[1].canvas.recorded
    expect(named(measureCtx, 'measureText').args).toEqual(['Hi'])
    expect(named(measureCtx, 'measureText').font).toBe(fontOf(item('Hi').font))
    expect(named(measureCtx, 'measureText').textAlign).toBe('end')
    expect(named(measureCtx, 'measureText').textBaseline).toBe('middle')
    const fill = named(drawCtx, 'fillText')
    expect(fill.args).toEqual(['Hi', 2 + 2, 9 + 2])
    expect(fill.font).toBe(fontOf(item('Hi').font))
    expect(fill.textAlign).toBe('end')
    expect(fill.textBaseline).toBe('middle')
  })

  test('draws with the configured opaque colour, black by default', async () => {
    const measured = metrics({
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: 5,
      actualBoundingBoxAscent: 5,
      actualBoundingBoxDescent: 1,
    })
    const black = fakeCanvases(() => measured)
    await createTextRasterizer({ dpi: 600, createCanvas: black.createCanvas })(
      item('x'),
    )
    expect(named(black.made[1].canvas.recorded, 'fillText').fillStyle).toBe(
      '#000000',
    )

    const custom = fakeCanvases(() => measured)
    await createTextRasterizer({
      dpi: 600,
      createCanvas: custom.createCanvas,
      color: '#ff0000',
    })(item('x'))
    expect(named(custom.made[1].canvas.recorded, 'fillText').fillStyle).toBe(
      '#ff0000',
    )
  })

  test('honours a custom padding', async () => {
    const measured = metrics({
      actualBoundingBoxLeft: 10,
      actualBoundingBoxRight: 20,
      actualBoundingBoxAscent: 30,
      actualBoundingBoxDescent: 5,
    })
    const { made, createCanvas } = fakeCanvases(() => measured)
    await createTextRasterizer({ dpi: 600, paddingPx: 7, createCanvas })(
      item('Hi'),
    )
    expect(made[1].w).toBe(Math.ceil(10 + 20 + 14))
    expect(named(made[1].canvas.recorded, 'fillText').args).toEqual([
      'Hi',
      17,
      37,
    ])
  })

  test('canvasToPngBlob is the export path used by the rasterizer', async () => {
    const blob = await canvasToPngBlob({
      width: 1,
      height: 1,
      convertToBlob: async () =>
        ({ arrayBuffer: async () => new ArrayBuffer(0) }) as Blob,
    } as unknown as RasterCanvas['canvas'])
    expect(blob).toBeDefined()
  })
})
