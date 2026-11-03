/**
 * Vẽ ảnh chia sẻ pháp ngữ (1080×1350 — tỉ lệ 4:5 hợp với bảng tin mạng xã hội) lên canvas.
 * Tách phần tính bố cục (layoutShareCard — thuần, test được) khỏi phần vẽ (drawShareCard).
 */
import { fitText, wrapText } from './wrap-text'

export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1350

export const SERIF = '"Noto Serif Variable", "Noto Serif", Georgia, serif'
export const SANS = '"Be Vietnam Pro", system-ui, sans-serif'

const PAD_X = 120
const CONTENT_TOP = 320
const CONTENT_BOTTOM = 1140
const GLOSS_SIZE = 30
const SOURCE_SIZE = 30

export const SHARE_TEMPLATES = [
  {
    id: 'jade',
    label: 'Ngọc bích',
    stops: ['#0b2f2a', '#1a6055', '#2a967f'],
    text: '#f3fbf8',
    muted: 'rgba(243, 251, 248, 0.78)',
    accent: '#fbc94d',
    petal: ['#fce7ef', '#f8a8c5'],
    glows: [
      { x: 0.88, y: 0.08, r: 0.55, color: 'rgba(251, 201, 77, 0.20)' },
      { x: 0.08, y: 0.96, r: 0.65, color: 'rgba(127, 207, 184, 0.25)' },
    ],
  },
  {
    id: 'lotus',
    label: 'Hoa sen',
    stops: ['#fff7fa', '#fce7ef', '#f8bfd3'],
    text: '#5b1128',
    muted: 'rgba(91, 17, 40, 0.74)',
    accent: '#d52b5c',
    petal: ['#f8a8c5', '#e8497d'],
    glows: [
      { x: 0.9, y: 0.05, r: 0.5, color: 'rgba(251, 201, 77, 0.22)' },
      { x: 0.1, y: 0.92, r: 0.6, color: 'rgba(255, 255, 255, 0.65)' },
    ],
  },
  {
    id: 'saffron',
    label: 'Nắng sớm',
    stops: ['#fffcf3', '#fef0c7', '#fbd27a'],
    text: '#4a230b',
    muted: 'rgba(74, 35, 11, 0.74)',
    accent: '#b04b0a',
    petal: ['#fbcfe0', '#e8497d'],
    glows: [
      { x: 0.15, y: 0.08, r: 0.5, color: 'rgba(255, 255, 255, 0.7)' },
      { x: 0.92, y: 0.95, r: 0.6, color: 'rgba(240, 146, 12, 0.22)' },
    ],
  },
  {
    id: 'night',
    label: 'Đêm thiền',
    stops: ['#060c0b', '#0c1614', '#1a2d29'],
    text: '#f5efe4',
    muted: 'rgba(245, 239, 228, 0.72)',
    accent: '#7fcfb8',
    petal: ['#fce7ef', '#f2739f'],
    glows: [
      { x: 0.8, y: 0.12, r: 0.4, color: 'rgba(251, 201, 77, 0.14)' },
      { x: 0.15, y: 0.9, r: 0.65, color: 'rgba(42, 150, 127, 0.22)' },
    ],
  },
]

export function getTemplate(id) {
  return SHARE_TEMPLATES.find((t) => t.id === id) ?? SHARE_TEMPLATES[0]
}

/** CSS gradient dùng cho ô chọn mẫu trong giao diện, khớp màu với ảnh. */
export function templateSwatch(template) {
  return `linear-gradient(135deg, ${template.stops.join(', ')})`
}

export const quoteFont = (size) => `500 ${size}px ${SERIF}`
export const glossFont = `400 ${GLOSS_SIZE}px ${SANS}`
export const sourceFont = `600 ${SOURCE_SIZE}px ${SANS}`
export const eyebrowFont = `600 24px ${SANS}`
export const watermarkFont = `600 26px ${SANS}`

/**
 * Tính bố cục. measure(text, font) => độ rộng px.
 * Câu chính tự chọn cỡ chữ (40–76px) sao cho cả khối (câu + lược giải + nguồn) nằm giữa vùng nội dung.
 */
export function layoutShareCard(quote, measure, { width = CARD_WIDTH } = {}) {
  const maxWidth = width - PAD_X * 2
  const glossLh = Math.round(GLOSS_SIZE * 1.5)
  const sourceLh = Math.round(SOURCE_SIZE * 1.4)
  const glossLines = quote.gloss ? wrapText(quote.gloss, maxWidth - 40, (t) => measure(t, glossFont)) : []
  const sourceLines = wrapText(`— ${quote.source}`, maxWidth, (t) => measure(t, sourceFont))

  const GAP_GLOSS = glossLines.length ? 40 : 0
  const GAP_DIVIDER = 48
  const GAP_SOURCE = 30
  const fixedHeight = glossLines.length * glossLh + GAP_GLOSS + GAP_DIVIDER + GAP_SOURCE + sourceLines.length * sourceLh
  const available = CONTENT_BOTTOM - CONTENT_TOP

  const q = fitText(quote.text, {
    maxWidth,
    maxHeight: available - fixedHeight,
    minSize: 36,
    maxSize: 76,
    lineHeight: 1.42,
    measureAt: (size) => (t) => measure(t, quoteFont(size)),
  })

  const total = q.height + fixedHeight
  const top = CONTENT_TOP + Math.max(0, (available - total) / 2)
  const glossTop = top + q.height + GAP_GLOSS
  const dividerY = glossTop + glossLines.length * glossLh + GAP_DIVIDER
  const sourceTop = dividerY + GAP_SOURCE

  return {
    maxWidth,
    top,
    total,
    quote: { size: q.size, font: quoteFont(q.size), lines: q.lines, lineHeight: q.lineHeight, top, fits: q.fits },
    gloss: { font: glossFont, lines: glossLines, lineHeight: glossLh, top: glossTop },
    dividerY,
    source: { font: sourceFont, lines: sourceLines, lineHeight: sourceLh, top: sourceTop },
  }
}

function drawLines(ctx, block, x, color) {
  ctx.font = block.font
  ctx.fillStyle = color
  block.lines.forEach((line, i) => {
    ctx.fillText(line, x, block.top + i * block.lineHeight + block.lineHeight / 2)
  })
}

/** Đoá sen đơn giản: một cánh giữa, hai cánh bên và nét đế. Vẽ bằng đường cong để không phụ thuộc Path2D. */
export function drawLotus(ctx, cx, cy, s, template) {
  const grad = ctx.createLinearGradient(cx, cy - s, cx, cy + s * 0.6)
  grad.addColorStop(0, template.petal[0])
  grad.addColorStop(1, template.petal[1])
  ctx.fillStyle = grad

  ctx.beginPath()
  ctx.moveTo(cx, cy - s)
  ctx.quadraticCurveTo(cx + s * 0.5, cy - s * 0.15, cx, cy + s * 0.55)
  ctx.quadraticCurveTo(cx - s * 0.5, cy - s * 0.15, cx, cy - s)
  ctx.fill()

  for (const dir of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(cx, cy + s * 0.55)
    ctx.quadraticCurveTo(cx + dir * s * 0.2, cy - s * 0.35, cx + dir * s * 0.95, cy - s * 0.2)
    ctx.quadraticCurveTo(cx + dir * s * 0.75, cy + s * 0.45, cx, cy + s * 0.55)
    ctx.globalAlpha = 0.9
    ctx.fill()
    ctx.globalAlpha = 1
  }

  ctx.strokeStyle = template.accent
  ctx.lineWidth = Math.max(2, s * 0.07)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.75, cy + s * 0.78)
  ctx.lineTo(cx + s * 0.75, cy + s * 0.78)
  ctx.stroke()
}

function drawBackground(ctx, template, w, h) {
  const bg = ctx.createLinearGradient(0, 0, w, h)
  template.stops.forEach((c, i) => bg.addColorStop(i / (template.stops.length - 1), c))
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  for (const g of template.glows) {
    const r = g.r * w
    const rg = ctx.createRadialGradient(g.x * w, g.y * h, 0, g.x * w, g.y * h, r)
    rg.addColorStop(0, g.color)
    rg.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = rg
    ctx.fillRect(0, 0, w, h)
  }

  // Những vòng tròn đồng tâm mờ — gợi hình ảnh mặt nước lặng, nhắc đến sự tĩnh tại
  ctx.strokeStyle = template.text
  ctx.lineWidth = 2
  for (let i = 1; i <= 5; i++) {
    ctx.globalAlpha = 0.07 - i * 0.01
    ctx.beginPath()
    ctx.arc(w * 0.92, h * 0.86, 90 * i, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // Khung viền mảnh
  ctx.globalAlpha = 0.22
  ctx.lineWidth = 2
  ctx.strokeRect(44, 44, w - 88, h - 88)
  ctx.globalAlpha = 1
}

function setSpacing(ctx, px) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`
}

/** Vẽ toàn bộ ảnh. themeLabel: tên chủ đề hiển thị ở dòng nhỏ phía trên. */
export function drawShareCard(ctx, { quote, template, themeLabel = '', width = CARD_WIDTH, height = CARD_HEIGHT }) {
  const measure = (text, font) => {
    ctx.font = font
    return ctx.measureText(text).width
  }
  const layout = layoutShareCard(quote, measure, { width })
  const cx = width / 2

  ctx.save()
  drawBackground(ctx, template, width, height)
  drawLotus(ctx, cx, 168, 46, template)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = eyebrowFont
  ctx.fillStyle = template.muted
  setSpacing(ctx, 6)
  ctx.fillText(['PHÁP NGỮ', themeLabel.toUpperCase()].filter(Boolean).join('  ·  '), cx, 258)
  setSpacing(ctx, 0)

  // Dấu ngoặc kép trang trí lớn, mờ, đặt chéo phía trên khối chữ
  ctx.save()
  ctx.globalAlpha = 0.16
  ctx.fillStyle = template.accent
  ctx.font = `700 260px ${SERIF}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('“', PAD_X - 40, layout.top - 120)
  ctx.restore()

  drawLines(ctx, layout.quote, cx, template.text)
  if (layout.gloss.lines.length) drawLines(ctx, layout.gloss, cx, template.muted)

  ctx.strokeStyle = template.accent
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - 36, layout.dividerY)
  ctx.lineTo(cx + 36, layout.dividerY)
  ctx.stroke()

  drawLines(ctx, layout.source, cx, template.text)

  // Dấu nhận diện nhỏ ở chân ảnh: hoa sen + tên ứng dụng, căn giữa theo tổng độ rộng
  const mark = 'Anh Hậu Phật Tử'
  const markWidth = 32 + 14 + measure(mark, watermarkFont)
  const startX = cx - markWidth / 2
  ctx.globalAlpha = 0.8
  drawLotus(ctx, startX + 16, height - 108, 16, template)
  ctx.globalAlpha = 0.8
  ctx.font = watermarkFont
  ctx.fillStyle = template.muted
  ctx.textAlign = 'left'
  ctx.fillText(mark, startX + 46, height - 104)
  ctx.restore()
  return layout
}

/**
 * Đợi font tiếng Việt (gồm cả bộ ký tự có dấu) tải xong trước khi vẽ —
 * nếu không canvas sẽ vẽ bằng font dự phòng rồi không tự vẽ lại.
 * Trả về false nếu trình duyệt không hỗ trợ hoặc tải lỗi (vẫn vẽ được bằng font hệ thống).
 */
export async function ensureFonts(sampleText) {
  if (typeof document === 'undefined' || !document.fonts?.load) return false
  try {
    const sample = `${sampleText} Anh Hậu Phật Tử PHÁP NGỮ`
    await Promise.all([
      document.fonts.load(quoteFont(60), sample),
      document.fonts.load(glossFont, sample),
      document.fonts.load(sourceFont, sample),
    ])
    await document.fonts.ready
    return true
  } catch {
    return false
  }
}

export function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Không tạo được ảnh từ canvas'))), 'image/png')
  })
}

export function shareFileName(quote) {
  return `phap-ngu-${quote.id}.png`
}
