import { describe, expect, test } from 'vitest'
import {
  centeredStart,
  clamp,
  countThatFit,
  layoutCells,
  layoutGrid,
  repeatPositions,
  roundTo,
  snapToStep,
} from './geometry'

describe('clamp', () => {
  test('keeps a value inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  test('pulls an out-of-range value to the nearer bound', () => {
    expect(clamp(11, 0, 10)).toBe(10)
    expect(clamp(-1, 0, 10)).toBe(0)
  })
})

describe('roundTo', () => {
  test('keeps three decimals by default', () => {
    expect(roundTo(1.23456)).toBe(1.235)
  })

  test('keeps the requested number of decimals', () => {
    expect(roundTo(1.23456, 2)).toBe(1.23)
  })

  test('yields 0 rather than -0 for a tiny negative', () => {
    expect(Object.is(roundTo(-0.0001, 2), -0)).toBe(false)
  })
})

describe('snapToStep', () => {
  test('snaps to the nearest step multiple counted from min', () => {
    expect(snapToStep(7.3, 4, 20, 0.5)).toBe(7.5)
  })

  test('clamps a snapped value into the range', () => {
    expect(snapToStep(99, 4, 20, 0.5)).toBe(20)
  })

  test('returns min for NaN', () => {
    expect(snapToStep(NaN, 4, 20, 0.5)).toBe(4)
  })

  test('only clamps when the step is not positive', () => {
    expect(snapToStep(7.3, 4, 20, 0)).toBe(7.3)
    expect(snapToStep(99, 4, 20, NaN)).toBe(20)
  })
})

describe('countThatFit', () => {
  test('floors how many pitches fit', () => {
    expect(countThatFit(100, 8)).toBe(12)
  })

  test('is never negative', () => {
    expect(countThatFit(10, 20)).toBe(0)
  })

  test('is 0 for a pitch that is not positive or is NaN', () => {
    expect(countThatFit(100, 0)).toBe(0)
    expect(countThatFit(100, NaN)).toBe(0)
  })

  test('sees through floating-point residue on an exact fit', () => {
    // 0.7 / 0.1 is 6.999999999999999 in binary floating point.
    expect(countThatFit(0.7, 0.1)).toBe(7)
  })
})

describe('centeredStart', () => {
  test('splits the leftover length evenly', () => {
    expect(centeredStart(190, 20, 9)).toBe(5)
  })

  test('is 0 when the cells fill the length exactly', () => {
    expect(centeredStart(180, 20, 9)).toBe(0)
  })
})

describe('repeatPositions', () => {
  test('steps from the offset and stops before the far end', () => {
    expect(repeatPositions(100, 8, 8)).toEqual([
      8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96,
    ])
  })

  test('gives nothing when only the start edge would be hit', () => {
    expect(repeatPositions(3, 5)).toEqual([])
  })

  test('skips a position that lies on either edge', () => {
    expect(repeatPositions(16, 8)).toEqual([8])
  })

  test('gives nothing for a pitch that is not positive', () => {
    expect(repeatPositions(100, 0)).toEqual([])
  })

  test('gives nothing for a NaN length or offset instead of looping forever', () => {
    expect(repeatPositions(100, 8, NaN)).toEqual([])
    expect(repeatPositions(NaN, 8)).toEqual([])
  })
})

describe('layoutCells', () => {
  test('fits as many cells as go in', () => {
    expect(layoutCells(190, 20)?.count).toBe(9)
  })

  test('centres the cells by default', () => {
    expect(layoutCells(190, 20)?.start).toBe(5)
  })

  test('lists one more edge than cells, running from start to the far side', () => {
    expect(layoutCells(190, 20)?.edges).toEqual([
      5, 25, 45, 65, 85, 105, 125, 145, 165, 185,
    ])
  })

  test('starts at 0 when asked', () => {
    expect(layoutCells(190, 20, 'start')?.start).toBe(0)
  })

  test('gives null when not a single cell fits', () => {
    expect(layoutCells(10, 20)).toBeNull()
  })
})

describe('layoutGrid', () => {
  test('lays out columns and rows independently', () => {
    expect(layoutGrid(190, 247, 20)).toEqual({
      cols: 9,
      rows: 12,
      offsetX: 5,
      offsetY: 3.5,
    })
  })

  test('reports 0 and no offset for an axis that fits nothing', () => {
    expect(layoutGrid(10, 190, 20)).toEqual({
      cols: 0,
      rows: 9,
      offsetX: 0,
      offsetY: 5,
    })
  })
})
