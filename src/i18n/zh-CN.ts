import type { MessageDict } from './index'

/** Simplified Chinese UI strings. This dictionary is the source of truth for the key set; `en.ts` must mirror it. */
export const zhCN: MessageDict = {
  'app.name': '纸随心',
  'app.tagline': '自定义打印纸生成器',
  'app.privacy': '一切都在你的浏览器里完成，不会上传任何数据。',

  'group.basic': '基础纸型',
  'group.worksheet': '中文作业纸',
  'group.calligraphy': '书法练习纸',
  'group.creative': '笔记与表单',

  'size.a4': 'A4',
  'size.a5': 'A5',
  'size.a3': 'A3',
  'size.b4': 'B4',
  'size.b5': 'B5',
  'size.letter': 'Letter',
  'size.legal': 'Legal',
  'size.tabloid': 'Tabloid',
  'size.executive': 'Executive',
  'size.custom': '自定义尺寸',
  'size.width': '宽度',
  'size.height': '高度',

  'orientation.label': '方向',
  'orientation.portrait': '纵向',
  'orientation.landscape': '横向',

  'columns.label': '分栏',
  'columns.one': '单栏',
  'columns.two': '左右两栏',
  'columns.gap': '栏间距',
  'columns.divider': '分隔线',

  'style.solid': '实线',
  'style.dashed': '虚线',
  'style.dotted': '点线',

  'section.type': '纸张类型',
  'section.size': '纸张尺寸',
  'section.theme': '主题',
  'section.line': '线条设置',
  'section.options': '专属配置',
  'section.margins': '页边距',
  'section.background': '背景',
  'section.decoration': '页面装饰',
  'section.watermark': '水印',
  'section.pages': '页面设置',
  'section.transfer': '导入 / 导出设置',

  'line.color': '线条颜色',
  'line.style': '线型',
  'line.width': '线宽',
  'line.recommend': '推荐',
  'line.unit': 'mm',
  'line.outOfRange': '请输入 {min}–{max} 之间的数值',

  'margin.top': '上边距',
  'margin.right': '右边距',
  'margin.bottom': '下边距',
  'margin.left': '左边距',

  'background.color': '背景色',
  'background.texture': '纹理',
  'background.patternColor': '纹理颜色',
  'background.opacity': '纹理不透明度',
  'background.chooseImage': '选择图片',
  'background.clearImage': '移除图片',

  'texture.none': '无',
  'texture.grid': '方格',
  'texture.dots': '点阵',
  'texture.lines': '横线',
  'texture.crosshatch': '交叉线',
  'texture.graph': '坐标纸',
  'texture.image': '自定义图片',

  'decoration.enable': '显示装饰',
  'decoration.style': '样式',
  'decoration.style.simple': '简约方框',
  'decoration.style.double': '双线框',
  'decoration.style.corner': '角花方框',
  'decoration.style.calligraphy': '书法框',
  'decoration.style.scalloped': '花边边框',
  'decoration.scope': '应用范围',
  'decoration.scope.content': '内容区（边距内）',
  'decoration.scope.page': '整页',
  'decoration.inset': '内缩',
  'decoration.sides': '显示的边',
  'decoration.ornaments': '四角角花',
  'decoration.pattern': '花边图案',
  'decoration.pattern.wave': '波浪',
  'decoration.pattern.meander': '回纹',
  'decoration.pattern.beads': '珠链',
  'decoration.opacity': '不透明度',
  'decoration.applyCalligraphyFrame': '应用书法框',

  'watermark.enable': '显示水印',
  'watermark.text': '水印文字',
  'watermark.textPlaceholder': '例如：内部资料',
  'watermark.opacity': '不透明度',
  'watermark.angle': '旋转角度',
  'watermark.size': '文字大小',
  'watermark.color': '颜色',

  'pages.count': '页数',
  'pages.numbering': '显示页码',
  'pages.startNumber': '起始页码',

  'transfer.export': '导出设置',
  'transfer.import': '导入设置',
  'transfer.importFailed': '导入失败：无法识别这个文件',
  'transfer.imported': '设置已导入',

  'theme.default': '清爽',
  'theme.night': '夜读',
  'theme.sepia': '旧书',
  'theme.vintage': '复古',
  'theme.pastel': '柔彩',
  'theme.classic': '经典',
  'theme.minimalist': '极简',
  'theme.ocean': '海洋',
  'theme.forest': '森林',
  'theme.sunset': '日落',
  'theme.tech': '科技',
  'theme.elegant': '雅致',
  'theme.creative': '童趣',

  'unit.mm': 'mm',
  'unit.degree': '°',
  'unit.percent': '%',
  'common.reset': '恢复默认',

  'common.settings': '设置',
  'common.close': '关闭',

  'size.label': '纸张尺寸',
  'size.dimensions': '页面：{width} × {height} mm',

  'background.imageHint': '图片只保存在本机，不会上传。',
  'background.imageInvalid': '请选择图片文件。',
  'background.imageTooLarge': '图片不能超过 5 MB。',
  'background.imageAlt': '背景图预览',

  'decoration.calligraphyFrameHint': '这类练字纸配一圈书法框更好用。',
  'decoration.color': '边框颜色',
  'decoration.width': '边框粗细',
  'decoration.lineStyle': '边框线型',

  'transfer.failure.invalidJson': '文件不是有效的 JSON。',
  'transfer.failure.notOurFile': '这不是本应用导出的设置文件。',
  'transfer.failure.invalidSettings': '文件内容不是有效的设置。',

  'app.printTip': '打印时请选择「实际大小 / 100%」并关闭页眉页脚。',
  'gallery.open': '模板库',

  'swatch.white': '白色',
  'swatch.cream': '米白',
  'swatch.grayLight': '浅灰',
  'swatch.blueLight': '浅蓝',
  'swatch.greenLight': '浅绿',
  'swatch.pinkLight': '浅粉',
  'swatch.yellowLight': '浅黄',
  'swatch.gray': '浅灰',
  'swatch.grayMedium': '中灰',
  'swatch.blue': '蓝色',
  'swatch.green': '绿色',
  'swatch.red': '红色',
  'swatch.purple': '紫色',
  'swatch.yellow': '黄色',

  'common.cancel': '取消',

  'preview.label': '纸张预览',
  'preview.zoomFit': '适应宽度',
  'preview.morePages':
    '仅预览前 {shown} 页，共 {total} 页；导出与打印包含全部页面。',

  'export.pdf': '导出 PDF',
  'export.svg': '导出 SVG',
  'export.png': '导出 PNG',
  'export.print': '打印',
  'export.dpi': '清晰度',
  'export.working': '正在生成…',
  'export.done': '{format} 已生成。',
  'export.failed': '导出失败，请重试。',
  'export.svgNote': '所有页面合并为一个矢量 SVG 文件。',
  'export.pngNote': '每一页分别导出为一张 PNG。',

  'gallery.title': '模板库',
  'gallery.search': '搜索模板…',
  'gallery.empty': '没有匹配的模板。',

  'info.guide.open': '使用指南',
  'info.guide.title': '使用指南',
  'info.guide.lead':
    '三步就能做出一张可以直接打印的纸，全程在浏览器里完成，不用注册、不上传任何内容。',
  'info.guide.step1.title': '选纸张类型',
  'info.guide.step1.body':
    '左侧按「基础纸型 / 中文作业纸 / 书法练习纸 / 笔记与表单」分组，点一下就切换。也可以点右上角「模板库」直接套用现成样式。',
  'info.guide.step2.title': '调参数、看预览',
  'info.guide.step2.body':
    '纸张尺寸、方向、分栏、主题、线条颜色与间距、四边边距、背景纹理、边框装饰、水印、页数都可以在左侧调整；右侧会实时重画，缩放按钮方便看细节。',
  'info.guide.step3.title': '导出或打印',
  'info.guide.step3.body':
    'PDF 是矢量线条，适合直接打印；SVG 是多页合并的矢量文件，方便二次编辑；PNG 每页一张，可选 150 / 300 / 600 DPI。也可以直接点「打印」。',
  'info.guide.step4.title': '打印时记得两件事',
  'info.guide.step4.body':
    '在打印对话框里选「实际大小 / 100%」，并关掉浏览器自带的页眉页脚，纸张尺寸要和页面设置一致。任何缩放都会让行距不再是标称的毫米数。',
  'info.guide.step5.title': '保存和分享',
  'info.guide.step5.body':
    '调好的样子会自动存在本机；也可以「导出设置」存成 JSON 以后再导入，或直接把地址栏链接发给别人——设置就编码在链接里。',
  'info.guide.tipsTitle': '几个小提示',
  'info.guide.tip1':
    '练字格、拼音格这类纸的格子是真实毫米尺寸，建议用 A4 纸按 100% 打印后再量一下。',
  'info.guide.tip2':
    '想做试卷分栏，选横线纸、方格纸等支持分栏的纸型，在「纸张尺寸」里打开左右两栏。',
  'info.guide.tip3':
    '水印默认关闭，文字留空；需要标注「草稿」「样张」时再打开。',
  'info.guide.tip4':
    'PDF 里的少量标签是高清图片（为了不内嵌十几兆中文字库），打印清晰但文字不可选中。',

  'info.about.open': '关于我',
  'info.about.title': '关于我 · 为什么做这个网站',
  'info.about.lead':
    '这是一个爸爸给自己家小学生做的打印纸工具，顺手开源出来给同样需要的家长和老师用。',
  'info.about.p1':
    '家里有个上小学的娃，三天两头要打印东西：拼音四线三格、田字格、作文稿纸、算术竖式纸、英语书写纸、练字格、错题本……每次都临时上网找，找到了还要先截图、裁边、调大小，很折腾。',
  'info.about.p2':
    '网上类似的网站和 App 其实不少，但用下来总有这样那样的问题：有的满屏广告、点一下就跳转；有的核心功能要开会员；还有的今天能用，明天域名过期、App 下架，之前存好的模板就全没了。给孩子打印东西这件小事，不该这么不可靠。',
  'info.about.p3':
    '所以干脆自己做一个：纯前端、打开网页就能用，所有计算都在浏览器本地完成，不上传任何文字和图片；纸张按真实毫米尺寸生成，导出 PDF / SVG / PNG 或直接打印；调好的参数能存下来、能通过链接分享。没有服务器，也就没有「哪天关站就不能用了」这回事——把网页文件保存在自己电脑或 NAS 上，它就一直在。',
  'info.about.p4':
    '既然做都做了，就顺手开源出来。如果你也是家长、老师，或者只是想要一张干净的方格纸，希望它能省下你一点时间。发现问题、想加新纸型，都欢迎提 issue 或 PR。',
  'info.about.featuresTitle': '这个版本的几个特点',
  'info.about.f1':
    '41 种纸张类型，覆盖作业纸、书法练字格、笔记与表单，每种都有常用默认样式。',
  'info.about.f2':
    '中英文界面，纸面标签也会跟着切换；配色、主题、边距、线条都能自己调。',
  'info.about.f3':
    '完全离线可用：构建产物是一堆静态文件，nginx、GitHub Pages、家里的 NAS 都能跑。',
  'info.about.f4': 'MIT 许可证，代码、界面与文案均为原创，可自由使用和修改。',
  'info.about.sign': '—— 一个不想再到处找打印纸的家长',
}
