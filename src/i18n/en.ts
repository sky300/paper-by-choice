import type { MessageDict } from './index'

/** English UI strings. Must define exactly the keys of `zh-CN.ts`; a test enforces it. */
export const en: MessageDict = {
  'app.credit': 'Powered by skyow',
  'app.name': 'Paper by Choice',
  'app.tagline': 'Custom printable paper generator',
  'app.privacy':
    'Everything happens in your browser. Nothing you make is ever uploaded.',

  'interface.style': 'Interface style',
  'interface.style.violet': 'A · Violet',
  'interface.style.warm': 'B · Warm',
  'interface.style.teal': 'C · Teal',

  'group.basic': 'Basics',
  'group.worksheet': 'Chinese worksheets',
  'group.calligraphy': 'Calligraphy practice',
  'group.creative': 'Notes & forms',

  'size.a4': 'A4',
  'size.a5': 'A5',
  'size.a3': 'A3',
  'size.b4': 'B4',
  'size.b5': 'B5',
  'size.letter': 'Letter',
  'size.legal': 'Legal',
  'size.tabloid': 'Tabloid',
  'size.executive': 'Executive',
  'size.custom': 'Custom size',
  'size.width': 'Width',
  'size.height': 'Height',

  'orientation.label': 'Orientation',
  'orientation.portrait': 'Portrait',
  'orientation.landscape': 'Landscape',

  'columns.label': 'Columns',
  'columns.one': 'One column',
  'columns.two': 'Two columns',
  'columns.gap': 'Column gap',
  'columns.divider': 'Divider',

  'style.solid': 'Solid',
  'style.dashed': 'Dashed',
  'style.dotted': 'Dotted',

  'section.type': 'Paper type',
  'section.size': 'Paper size',
  'section.theme': 'Theme',
  'section.line': 'Lines',
  'section.options': 'Paper options',
  'section.margins': 'Margins',
  'section.background': 'Background',
  'section.decoration': 'Page decoration',
  'section.watermark': 'Watermark',
  'section.pages': 'Pages',
  'section.transfer': 'Import / export settings',

  'line.color': 'Line color',
  'line.style': 'Line style',
  'line.width': 'Line width',
  'line.recommend': 'Recommended',
  'line.unit': 'mm',
  'line.outOfRange': 'Enter a value between {min} and {max}',

  'margin.top': 'Top margin',
  'margin.right': 'Right margin',
  'margin.bottom': 'Bottom margin',
  'margin.left': 'Left margin',

  'background.color': 'Background color',
  'background.texture': 'Texture',
  'background.patternColor': 'Pattern color',
  'background.opacity': 'Pattern opacity',
  'background.chooseImage': 'Choose image',
  'background.clearImage': 'Remove image',

  'texture.none': 'None',
  'texture.grid': 'Grid',
  'texture.dots': 'Dots',
  'texture.lines': 'Lines',
  'texture.crosshatch': 'Crosshatch',
  'texture.graph': 'Graph paper',
  'texture.image': 'Custom image',

  'decoration.enable': 'Show decoration',
  'decoration.style': 'Style',
  'decoration.style.simple': 'Simple frame',
  'decoration.style.double': 'Double frame',
  'decoration.style.corner': 'Corner-ornament frame',
  'decoration.style.calligraphy': 'Calligraphy frame',
  'decoration.style.scalloped': 'Scalloped border',
  'decoration.scope': 'Apply to',
  'decoration.scope.content': 'Content area (inside margins)',
  'decoration.scope.page': 'Whole page',
  'decoration.inset': 'Inset',
  'decoration.sides': 'Sides',
  'decoration.ornaments': 'Corner ornaments',
  'decoration.pattern': 'Border pattern',
  'decoration.pattern.wave': 'Waves',
  'decoration.pattern.meander': 'Greek key',
  'decoration.pattern.beads': 'Beads',
  'decoration.opacity': 'Opacity',
  'decoration.applyCalligraphyFrame': 'Apply calligraphy frame',

  'watermark.enable': 'Show watermark',
  'watermark.text': 'Watermark text',
  'watermark.textPlaceholder': 'e.g. Internal use only',
  'watermark.opacity': 'Opacity',
  'watermark.angle': 'Angle',
  'watermark.size': 'Text size',
  'watermark.color': 'Color',

  'pages.count': 'Pages',
  'pages.numbering': 'Show page numbers',
  'pages.startNumber': 'First page number',

  'transfer.export': 'Export settings',
  'transfer.import': 'Import settings',
  'transfer.importFailed': 'Import failed: the file was not recognized',
  'transfer.imported': 'Settings imported',

  'theme.default': 'Fresh',
  'theme.night': 'Night',
  'theme.sepia': 'Sepia',
  'theme.vintage': 'Vintage',
  'theme.pastel': 'Pastel',
  'theme.classic': 'Classic',
  'theme.minimalist': 'Minimal',
  'theme.ocean': 'Ocean',
  'theme.forest': 'Forest',
  'theme.sunset': 'Sunset',
  'theme.tech': 'Tech',
  'theme.elegant': 'Elegant',
  'theme.creative': 'Playful',

  'unit.mm': 'mm',
  'unit.degree': '°',
  'unit.percent': '%',
  'common.reset': 'Reset to default',

  'common.settings': 'Settings',
  'common.close': 'Close',

  'size.label': 'Paper size',
  'size.dimensions': 'Page: {width} × {height} mm',

  'background.imageHint':
    'The image stays on this device and is never uploaded.',
  'background.imageInvalid': 'Please choose an image file.',
  'background.imageTooLarge': 'The image must be 5 MB or smaller.',
  'background.imageAlt': 'Background image preview',

  'decoration.calligraphyFrameHint':
    'A calligraphy frame is a useful finishing touch for practice sheets.',
  'decoration.color': 'Frame colour',
  'decoration.width': 'Frame width',
  'decoration.lineStyle': 'Frame line style',

  'transfer.failure.invalidJson': 'The file is not valid JSON.',
  'transfer.failure.notOurFile': 'This is not a settings file from this app.',
  'transfer.failure.invalidSettings':
    'The file does not contain valid settings.',

  'app.printTip':
    'When printing, choose "Actual size / 100%" and turn off headers and footers.',
  'gallery.open': 'Templates',

  'swatch.white': 'White',
  'swatch.cream': 'Cream',
  'swatch.grayLight': 'Light grey',
  'swatch.blueLight': 'Light blue',
  'swatch.greenLight': 'Light green',
  'swatch.pinkLight': 'Light pink',
  'swatch.yellowLight': 'Light yellow',
  'swatch.gray': 'Light grey',
  'swatch.grayMedium': 'Medium grey',
  'swatch.blue': 'Blue',
  'swatch.green': 'Green',
  'swatch.red': 'Red',
  'swatch.purple': 'Purple',
  'swatch.yellow': 'Yellow',

  'common.cancel': 'Cancel',

  'preview.label': 'Paper preview',
  'preview.zoomFit': 'Fit width',
  'preview.morePages':
    'Previewing the first {shown} of {total} pages. Exports and printing include every page.',

  'export.pdf': 'Export PDF',
  'export.svg': 'Export SVG',
  'export.png': 'Export PNG',
  'export.print': 'Print',
  'export.dpi': 'Resolution',
  'export.working': 'Generating…',
  'export.done': '{format} is ready.',
  'export.failed': 'Export failed. Please try again.',
  'export.svgNote': 'All pages are merged into one vector SVG file.',
  'export.pngNote': 'Each page is exported as a separate PNG.',

  'gallery.title': 'Templates',
  'gallery.search': 'Search templates…',
  'gallery.empty': 'No templates match your search.',

  'info.guide.open': 'Guide',
  'info.guide.title': 'How to use',
  'info.guide.lead':
    'Three steps to a ready-to-print sheet. Everything happens in your browser — no sign-up, nothing uploaded.',
  'info.guide.step1.title': 'Pick a paper',
  'info.guide.step1.body':
    'The left panel groups papers into basics, Chinese worksheets, calligraphy practice, and notes & forms. Click to switch, or open Templates in the top bar for a ready-made preset.',
  'info.guide.step2.title': 'Adjust and preview',
  'info.guide.step2.body':
    'Paper size, orientation, columns, theme, line colour and spacing, four margins, background texture, borders, watermark and page count are all editable. The right pane redraws instantly; the zoom buttons help you inspect details.',
  'info.guide.step3.title': 'Export or print',
  'info.guide.step3.body':
    'PDF keeps vector lines and is best for printing. SVG is one merged vector file for further editing. PNG exports one image per page at 150 / 300 / 600 DPI. You can also press Print directly.',
  'info.guide.step4.title': 'Two things when printing',
  'info.guide.step4.body':
    'Choose "Actual size / 100%" in the print dialog and turn off the browser headers and footers; the paper size must match your page setting. Any scaling breaks the physical millimetre spacing.',
  'info.guide.step5.title': 'Save and share',
  'info.guide.step5.body':
    'Your settings are saved locally. You can also export them as a JSON file to import later, or share the address-bar link — the settings are encoded right in the URL.',
  'info.guide.tipsTitle': 'A few tips',
  'info.guide.tip1':
    'Practice grids use real millimetres. Print one sheet at 100% on A4 and measure it once to be sure.',
  'info.guide.tip2':
    'For exam-style two-column sheets, choose a paper that supports columns (ruled, grid, etc.) and enable it under Paper size.',
  'info.guide.tip3':
    'The watermark is off by default with empty text — turn it on only when you need a "DRAFT" or "SAMPLE" mark.',
  'info.guide.tip4':
    'The few labels in the PDF are high-resolution images (to avoid bundling a large CJK font): sharp in print, but not selectable.',

  'info.about.open': 'About me',
  'info.about.title': 'About me · why this site exists',
  'info.about.lead':
    'A small tool a dad built for his own primary-school kid, open-sourced for other parents and teachers who need the same thing.',
  'info.about.p1':
    'There is a primary-school child at home, and there is always something to print: pinyin four-line guides, tianzi grids, composition paper, column arithmetic sheets, English handwriting paper, calligraphy grids, error-correction sheets… Every time it meant searching online, then cropping, resizing and nudging margins. It got old quickly.',
  'info.about.p2':
    'Plenty of similar sites and apps exist, but each has a catch: some are plastered with ads and pop-ups; some put the useful features behind a subscription; and some simply disappear one day when a domain lapses or an app is delisted, taking all your saved templates with them. Printing a worksheet for a child should not be this fragile.',
  'info.about.p3':
    'So I built my own: a purely client-side page that works the moment you open it. All rendering happens locally in the browser; no text or image is ever uploaded. Sheets are generated at true millimetre sizes, exported as PDF / SVG / PNG or sent straight to the printer, and settings can be saved or shared via a link. With no server behind it, there is no "the site shut down" — keep the files on your computer or NAS and it keeps working.',
  'info.about.p4':
    'Since it was built anyway, I open-sourced it. If you are a parent, a teacher, or just someone who wants a clean sheet of graph paper, I hope it saves you a little time. Bug reports and new paper types are welcome as issues or pull requests.',
  'info.about.featuresTitle': 'What this version offers',
  'info.about.f1':
    '41 paper types covering worksheets, calligraphy practice, notes and forms, each with sensible everyday defaults.',
  'info.about.f2':
    'Chinese and English UI (including labels printed on the sheet), with adjustable colours, themes, margins and lines.',
  'info.about.f3':
    'Fully offline: the build is plain static files that run on nginx, GitHub Pages or a home NAS.',
  'info.about.f4':
    'MIT licensed; code, interface and wording are original, free to use and modify.',
  'info.about.sign': 'Created by skyow',
}
