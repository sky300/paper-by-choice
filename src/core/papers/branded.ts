/**
 * 生成带品牌信息的定制纸。
 * Draws stationery with custom branding.
 */
/**
 * Branded letter paper: a header band with a logo placeholder, ruled body
 * lines, a thick accent rule down the left edge and a footer band that can
 * carry a user-supplied brand line.
 */
import { circle, line, rect, text } from '../scene/builders'
import { repeatPositions } from '../scene/geometry'
import type { Scene, SceneItem } from '../scene/types'
import { definePaper } from './define'

const HEADER_H = 44.8
const LOGO_SIZE = 30
const LOGO_INSET = 5.3
const BRAND_FONT = 2.6

interface Options {
  brandText: string
}

export default definePaper<Options>({
  type: 'branded',
  group: 'creative',
  messages: {
    'zh-CN': {
      name: '品牌定制纸',
      'spacing.label': '行距',
      'spacing.hint':
        '调整正文横线的疏密，用于页眉、落款或自定义品牌文字下方的行距。常用 6–10 mm；留白多就调大，想排得更紧凑就调小。',
      'preset.default.name': '品牌信纸',
      'preset.default.description': '页眉 logo 占位、正文横线与页脚文字位',
      'field.brandText': '品牌文字',
    },
    en: {
      name: 'Branded paper',
      'spacing.label': 'Line spacing',
      'spacing.hint':
        'Sets the spacing of the body rules under your header, signature or custom brand text. 6–10 mm is typical; increase for a more open layout, decrease for a denser one.',
      'preset.default.name': 'Branded letter',
      'preset.default.description':
        'Header logo placeholder, ruled body and a footer text slot',
      'field.brandText': 'Brand line',
    },
  },
  spacing: {
    label: 'spacing.label',
    hint: 'spacing.hint',
    min: 6,
    max: 15,
    step: 0.5,
    default: 8,
  },
  fields: [
    {
      kind: 'text',
      key: 'brandText',
      label: 'field.brandText',
      default: '',
      maxLength: 60,
    },
  ],
  defaultOptions: { brandText: '' },
  presets: [
    {
      id: 'branded',
      name: 'preset.default.name',
      description: 'preset.default.description',
      patch: {},
    },
  ],
  render: (ctx): Scene => {
    const a = ctx.area
    const S = ctx.spacing
    const color = ctx.ink.main().color
    const lw = ctx.ink.main().width
    const main = ctx.ink.main()
    const accent = ctx.theme.accent
    const accentFill = { color: accent, opacity: 0.1 }
    const items: SceneItem[] = []

    // Keep the fixed header band within a short writing area (e.g. A5 landscape).
    const headerH = Math.min(HEADER_H, a.h * 0.35)
    const logo = Math.min(LOGO_SIZE, headerH * 0.66, a.w * 0.5)
    const footerH = Math.min(2 * S, a.h - headerH - S)
    const footerTop = a.y + a.h - footerH
    const bodyBottom = footerTop

    // 1. Header band with a logo placeholder (rounded square + concentric circle).
    items.push(rect({ x: a.x, y: a.y, w: a.w, h: headerH }, main, accentFill))
    const logoStroke = ctx.ink.make(accent, lw * 1.2, undefined)
    const lx = a.x + LOGO_INSET
    const ly = a.y + (headerH - logo) / 2
    items.push(rect({ x: lx, y: ly, w: logo, h: logo }, logoStroke))
    items.push(
      circle(lx + logo / 2, ly + logo / 2, logo / 4, logoStroke, undefined),
    )

    // 2. Footer band with an accent rule along its top edge.
    items.push(
      rect({ x: a.x, y: footerTop, w: a.w, h: footerH }, main, accentFill),
    )
    items.push(
      line(
        a.x,
        footerTop,
        a.x + a.w,
        footerTop,
        ctx.ink.make(accent, lw * 0.8, undefined),
      ),
    )

    // 3. Ruled body lines from one pitch below the header to the footer top.
    const bodyTop = a.y + headerH
    if (bodyBottom > bodyTop) {
      for (const dy of repeatPositions(bodyBottom - bodyTop, S, S)) {
        const y = bodyTop + dy
        items.push(line(a.x, y, a.x + a.w, y, main))
      }
    }

    // 4. Thick accent rule down the left, drawn last.
    const thick = ctx.ink.make(accent, lw * 2, undefined)
    const railX = Math.min(a.x + S, a.x + a.w)
    items.push(line(railX, bodyTop, railX, bodyBottom, thick))

    // 5. Optional brand line, centred in the footer.
    const brand = ctx.options.brandText
    if (brand) {
      items.push(
        text(
          a.x + a.w / 2,
          footerTop + footerH / 2 + 0.9,
          brand,
          ctx.fonts.body(BRAND_FONT),
          color,
          { anchor: 'middle' },
        ),
      )
    }
    return items as Scene
  },
})
