/**
 * 验证 musicStaff 模块的 shared/musicStaff 行为。
 * Tests musicStaff behavior covering shared/musicStaff.
 */
import { createInkKit } from '../kit'
import { describe, expect, test } from 'vitest'
import {
  barLine,
  chordCell,
  clefMark,
  staffGroup,
  tabGroup,
} from './musicStaff'
import { horizontalPositions, shapesOf } from '../../testing/paperTestKit'

const ink = createInkKit({
  color: '#333333',
  width: 0.3,
  style: 'solid',
  spacing: 3,
})

describe('shared/musicStaff', () => {
  test('staffGroup draws five equally spaced horizontal lines', () => {
    const items = staffGroup(20, 20, 150, 3, ink.main())
    expect(items).toHaveLength(5)
    expect(horizontalPositions(items)).toEqual([20, 23, 26, 29, 32])
  })

  test('tabGroup draws six lines and one left bar', () => {
    const items = tabGroup(
      20,
      40,
      150,
      2,
      ink.main(),
      ink.main({ width: 0.36 }),
    )
    const lines = shapesOf(items, 'line')
    expect(lines).toHaveLength(7)
    expect(horizontalPositions(items)).toEqual([40, 42, 44, 46, 48, 50])
  })

  test('chordCell draws a 6 × 5 vertical grid with a heavy nut', () => {
    const items = chordCell(
      20,
      20,
      4,
      'vertical',
      ink.main(),
      ink.main({ width: 0.66 }),
      ink.main({ width: 0.225 }),
    )
    expect(shapesOf(items, 'line')).toHaveLength(11)
    expect(
      items.filter((i) => i.op === 'line' && i.stroke.width === 0.66),
    ).toHaveLength(1)
  })

  test('barLine is one vertical line and clefMark is a translated text run', () => {
    const line = barLine(20, 20, 12, ink.main())
    expect(line.op).toBe('line')
    expect(line.x1).toBe(20)
    const clef = clefMark(20, 26, 12, '♩', ink.main().color, ink.main().color)
    expect(clef.op).toBe('text')
    expect(clef.text).toBe('♩')
  })
})
