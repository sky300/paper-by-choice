/**
 * 验证 svg 模块的 formatNumber、escapeXml、sceneToSvg 行为。
 * Tests svg behavior covering formatNumber, escapeXml, sceneToSvg.
 */
import { describe, expect, test } from 'vitest'
import {
  arc,
  box,
  cubicTo,
  ellipse,
  group,
  image,
  line,
  lineTo,
  moveTo,
  path,
  pt,
  poly,
  quadTo,
  rect,
  text,
} from '../scene/builders'
import type { Font, Page, Stroke } from '../scene/types'
import {
  escapeXml,
  formatNumber,
  pageToSvg,
  sceneToSvg,
  sceneToSvgBody,
} from './svg'

const ink: Stroke = { color: '#000000', width: 0.3 }

describe('formatNumber', () => {
  test('writes an integer without decimals', () => {
    expect(formatNumber(8)).toBe('8')
  })

  test('drops trailing zeros', () => {
    expect(formatNumber(0.13)).toBe('0.13')
  })

  test('rounds to three decimals by default', () => {
    expect(formatNumber(28.34645669)).toBe('28.346')
  })

  test('honours the precision argument', () => {
    expect(formatNumber(1.23456, 2)).toBe('1.23')
    expect(formatNumber(2.6, 0)).toBe('3')
  })

  test('writes 0 rather than -0 for a value that rounds to zero', () => {
    expect(formatNumber(-0.0001)).toBe('0')
  })

  test('writes 0 for values that are not finite', () => {
    expect(formatNumber(NaN)).toBe('0')
    expect(formatNumber(Infinity)).toBe('0')
    expect(formatNumber(-Infinity)).toBe('0')
  })
})

describe('escapeXml', () => {
  test('escapes the five characters that are special in XML', () => {
    expect(escapeXml('&')).toBe('&amp;')
    expect(escapeXml('<')).toBe('&lt;')
    expect(escapeXml('>')).toBe('&gt;')
    expect(escapeXml('"')).toBe('&quot;')
    expect(escapeXml("'")).toBe('&apos;')
  })

  test('leaves ordinary text alone', () => {
    expect(escapeXml('Name: Zhang San (2026)')).toBe('Name: Zhang San (2026)')
  })

  test('escapes every special character in a mixed string', () => {
    expect(escapeXml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/a&gt;',
    )
  })
})

describe('sceneToSvg', () => {
  test('wraps the body in an svg root sized in millimetres', () => {
    expect(sceneToSvg([], 210, 297)).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="210mm" height="297mm" viewBox="0 0 210 297"></svg>',
    )
  })

  test('uses the given precision for the size and the viewBox', () => {
    expect(sceneToSvg([], 210.00049, 297, { precision: 1 })).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="210mm" height="297mm" viewBox="0 0 210 297"></svg>',
    )
  })
})

describe('sceneToSvgBody', () => {
  test('serializes a line with its stroke', () => {
    expect(sceneToSvgBody([line(10, 20, 30, 20, ink)])).toBe(
      '<line x1="10" y1="20" x2="30" y2="20" stroke="#000000" stroke-width="0.3" />',
    )
  })

  test('writes stroke-dasharray in millimetres separated by spaces', () => {
    const dashed: Stroke = { color: '#000000', width: 0.3, dash: [3, 2] }
    expect(sceneToSvgBody([line(10, 20, 30, 20, dashed)])).toBe(
      '<line x1="10" y1="20" x2="30" y2="20" stroke="#000000" stroke-width="0.3" stroke-dasharray="3 2" />',
    )
  })

  test('writes stroke-opacity only when it differs from 1', () => {
    const faint: Stroke = { color: '#000000', width: 0.3, opacity: 0.5 }
    expect(sceneToSvgBody([line(10, 20, 30, 20, faint)])).toContain(
      ' stroke-opacity="0.5" />',
    )
    const solid: Stroke = { color: '#000000', width: 0.3, opacity: 1 }
    expect(sceneToSvgBody([line(10, 20, 30, 20, solid)])).not.toContain(
      'stroke-opacity',
    )
  })

  test('writes fill="none" on a rectangle without a fill', () => {
    const outline: Stroke = { color: '#ff0000', width: 0.2 }
    expect(sceneToSvgBody([rect(box(5, 6.5, 7, 8), outline)])).toBe(
      '<rect x="5" y="6.5" width="7" height="8" stroke="#ff0000" stroke-width="0.2" fill="none" />',
    )
  })

  test('serializes a filled rectangle without stroke attributes', () => {
    expect(
      sceneToSvgBody([
        rect(box(0, 0, 210, 297), undefined, { color: '#ffffff' }),
      ]),
    ).toBe('<rect x="0" y="0" width="210" height="297" fill="#ffffff" />')
  })

  test('writes fill-opacity only when it differs from 1', () => {
    const tinted = rect(box(0, 0, 10, 10), undefined, {
      color: '#ff0000',
      opacity: 0.25,
    })
    expect(sceneToSvgBody([tinted])).toContain('fill-opacity="0.25"')
    const opaque = rect(box(0, 0, 10, 10), undefined, {
      color: '#ff0000',
      opacity: 1,
    })
    expect(sceneToSvgBody([opaque])).not.toContain('fill-opacity')
  })

  test('rounds coordinates to the requested precision', () => {
    expect(sceneToSvgBody([line(1 / 3, 20, 30, 20, ink)])).toContain(
      'x1="0.333"',
    )
    expect(
      sceneToSvgBody([line(1 / 3, 20, 30, 20, ink)], { precision: 1 }),
    ).toContain('x1="0.3"')
  })

  test('serializes a full ellipse as an <ellipse>', () => {
    expect(sceneToSvgBody([ellipse(50, 60, 10, 5, ink)])).toBe(
      '<ellipse cx="50" cy="60" rx="10" ry="5" stroke="#000000" stroke-width="0.3" fill="none" />',
    )
  })

  test('draws a quarter arc from the +x axis to the +y axis', () => {
    expect(sceneToSvgBody([arc(50, 60, 10, 5, 0, Math.PI / 2, ink)])).toBe(
      '<path d="M 60 60 A 10 5 0 0 1 50 65" stroke="#000000" stroke-width="0.3" fill="none" />',
    )
  })

  test('keeps large-arc at 0 for a half turn', () => {
    const svg = sceneToSvgBody([arc(50, 60, 10, 5, 0, Math.PI, ink)])
    expect(svg).toContain('d="M 60 60 A 10 5 0 0 1 40 60"')
  })

  test('sets large-arc to 1 for a three-quarter turn', () => {
    const svg = sceneToSvgBody([arc(50, 60, 10, 5, 0, (3 * Math.PI) / 2, ink)])
    expect(svg).toContain('d="M 60 60 A 10 5 0 1 1 50 55"')
  })

  test('treats an end angle below the start as end + 2π', () => {
    // From +y round to +x the long way: three quarters, start (50, 65).
    const svg = sceneToSvgBody([arc(50, 60, 10, 5, Math.PI / 2, 0, ink)])
    expect(svg).toContain('d="M 50 65 A 10 5 0 1 1 60 60"')
  })

  test('splits a full turn into two arcs, because an SVG arc whose end points coincide draws nothing', () => {
    const svg = sceneToSvgBody([arc(50, 60, 10, 5, 0, 2 * Math.PI, ink)])
    expect(svg).toContain('d="M 60 60 A 10 5 0 0 1 40 60 A 10 5 0 0 1 60 60"')
  })

  test('serializes an open polyline as a path', () => {
    const pts = [pt(1, 2), pt(3, 4), pt(5, 6)]
    expect(sceneToSvgBody([poly(pts, false, ink)])).toBe(
      '<path d="M 1 2 L 3 4 L 5 6" stroke="#000000" stroke-width="0.3" fill="none" />',
    )
  })

  test('closes a polygon with Z', () => {
    const pts = [pt(1, 2), pt(3, 4), pt(5, 6)]
    expect(sceneToSvgBody([poly(pts, true, ink)])).toContain(
      'd="M 1 2 L 3 4 L 5 6 Z"',
    )
  })

  test('serializes quadratic and cubic commands in absolute form', () => {
    const d = [
      moveTo(pt(0, 0)),
      quadTo(pt(1, 2), pt(3, 4)),
      cubicTo(pt(5, 6), pt(7, 8), pt(9, 10)),
    ]
    expect(sceneToSvgBody([path(d, false, ink)])).toContain(
      'd="M 0 0 Q 1 2 3 4 C 5 6 7 8 9 10"',
    )
  })

  test('ends a closed path with Z', () => {
    const d = [moveTo(pt(0, 0)), lineTo(pt(1, 1))]
    expect(sceneToSvgBody([path(d, true, ink)])).toContain('d="M 0 0 L 1 1 Z"')
  })

  test('draws nothing for a path without commands', () => {
    expect(sceneToSvgBody([path([], false, ink), poly([], true, ink)])).toBe('')
  })
})

describe('sceneToSvgBody: text, images and groups', () => {
  const font: Font = { family: 'serif', size: 4 }

  test('serializes a text with its font and fill', () => {
    expect(sceneToSvgBody([text(10, 20, 'Hi', font, '#123456')])).toBe(
      '<text x="10" y="20" font-family="serif" font-size="4" fill="#123456">Hi</text>',
    )
  })

  test('adds weight, italic, alignment and rotation when given', () => {
    const item = text(
      10,
      20,
      'Hi',
      {
        family: '"Times New Roman", serif',
        size: 4,
        weight: 700,
        style: 'italic',
      },
      { color: '#123456', opacity: 0.5 },
      { anchor: 'middle', baseline: 'middle', rotate: 30 },
    )
    expect(sceneToSvgBody([item])).toBe(
      '<text x="10" y="20" font-family="&quot;Times New Roman&quot;, serif" font-size="4" font-weight="700" font-style="italic" fill="#123456" fill-opacity="0.5" text-anchor="middle" dominant-baseline="central" transform="rotate(30 10 20)">Hi</text>',
    )
  })

  test('escapes the text and replaces line breaks with spaces', () => {
    const item = text(0, 0, 'Tom & Jerry\n"2026"', font, '#000000')
    expect(sceneToSvgBody([item])).toContain(
      'fill="#000000">Tom &amp; Jerry &quot;2026&quot;</text>',
    )
  })

  test('serializes an image with both href attributes and slice fitting', () => {
    expect(sceneToSvgBody([image(box(1, 2, 3, 4), 'data:,x')])).toBe(
      '<image href="data:,x" xlink:href="data:,x" x="1" y="2" width="3" height="4" preserveAspectRatio="xMidYMid slice" />',
    )
  })

  test('escapes the image source and writes opacity only below 1', () => {
    const faint = image(box(1, 2, 3, 4), 'data:image/svg+xml,<a&b>', 0.5)
    expect(sceneToSvgBody([faint])).toContain(
      'href="data:image/svg+xml,&lt;a&amp;b&gt;"',
    )
    expect(sceneToSvgBody([faint])).toContain(' opacity="0.5" />')
    const solid = image(box(1, 2, 3, 4), 'data:,x', 1)
    expect(sceneToSvgBody([solid])).not.toContain('opacity')
  })

  test('wraps a group and writes its opacity', () => {
    const g = group(
      [
        line(10, 20, 30, 20, ink),
        rect(box(0, 0, 1, 1), undefined, { color: '#ffffff' }),
      ],
      0.5,
    )
    expect(sceneToSvgBody([g])).toBe(
      '<g opacity="0.5"><line x1="10" y1="20" x2="30" y2="20" stroke="#000000" stroke-width="0.3" /><rect x="0" y="0" width="1" height="1" fill="#ffffff" /></g>',
    )
  })

  test('writes a bare <g> when the group opacity is 1 or absent', () => {
    const items = [line(10, 20, 30, 20, ink)]
    const inner =
      '<line x1="10" y1="20" x2="30" y2="20" stroke="#000000" stroke-width="0.3" />'
    expect(sceneToSvgBody([group(items)])).toBe(`<g>${inner}</g>`)
    expect(sceneToSvgBody([group(items, 1)])).toBe(`<g>${inner}</g>`)
  })
})

describe('pageToSvg', () => {
  test('is sceneToSvg with the page size', () => {
    const page: Page = {
      width: 210,
      height: 297,
      scene: [line(10, 20, 30, 20, ink)],
    }
    expect(pageToSvg(page)).toBe(sceneToSvg(page.scene, 210, 297))
    expect(pageToSvg(page, { precision: 1 })).toBe(
      sceneToSvg(page.scene, 210, 297, { precision: 1 }),
    )
  })
})
