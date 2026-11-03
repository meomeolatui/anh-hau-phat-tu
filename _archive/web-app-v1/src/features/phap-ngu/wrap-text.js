/**
 * Xuống dòng văn bản theo độ rộng đo được — dùng khi vẽ pháp ngữ lên <canvas>
 * (canvas không tự xuống dòng). Hàm `measure(text) => số px` được truyền vào nên test được không cần trình duyệt.
 *
 * Tiếng Việt ngắt theo khoảng trắng giữa các tiếng; dấu gạch ngang đứng riêng ("—")
 * được dính vào tiếng đứng trước để không bao giờ mở đầu một dòng.
 */

const DASH_RE = /^[—–-]$/

export function tokenize(text) {
  const raw = String(text ?? '').split(/\s+/).filter(Boolean)
  const out = []
  for (const t of raw) {
    if (DASH_RE.test(t) && out.length) out[out.length - 1] += ` ${t}`
    else out.push(t)
  }
  return out
}

/** Bẻ một từ quá dài (hiếm gặp: đường dẫn, chuỗi liền) thành nhiều mảnh vừa độ rộng. */
function breakLongWord(word, maxWidth, measure) {
  const parts = []
  let cur = ''
  for (const ch of word) {
    if (cur && measure(cur + ch) > maxWidth) {
      parts.push(cur)
      cur = ch
    } else cur += ch
  }
  if (cur) parts.push(cur)
  return parts
}

function wrapParagraph(text, maxWidth, measure) {
  const lines = []
  let line = ''
  for (const word of tokenize(text)) {
    const candidate = line ? `${line} ${word}` : word
    if (measure(candidate) <= maxWidth) {
      line = candidate
      continue
    }
    if (line) lines.push(line)
    if (measure(word) <= maxWidth) {
      line = word
      continue
    }
    const pieces = breakLongWord(word, maxWidth, measure)
    line = pieces.pop() ?? ''
    lines.push(...pieces)
  }
  if (line) lines.push(line)
  return avoidOrphan(lines, maxWidth, measure)
}

/**
 * Tránh dòng cuối chỉ còn một tiếng lẻ loi (trông hụt hẫng trên ảnh chia sẻ):
 * kéo bớt một tiếng từ dòng trên xuống nếu dòng trên vẫn còn từ 3 tiếng trở lên.
 */
export function avoidOrphan(lines, maxWidth, measure) {
  if (lines.length < 2) return lines
  const last = lines[lines.length - 1]
  if (tokenize(last).length !== 1) return lines
  const prevWords = tokenize(lines[lines.length - 2])
  if (prevWords.length < 3) return lines
  const moved = prevWords.pop()
  const newLast = `${moved} ${last}`
  if (measure(newLast) > maxWidth) return lines
  return [...lines.slice(0, -2), prevWords.join(' '), newLast]
}

/** Trả về mảng dòng. Giữ nguyên các xuống dòng có sẵn ("\n") trong văn bản. */
export function wrapText(text, maxWidth, measure) {
  return String(text ?? '')
    .split('\n')
    .flatMap((p) => (p.trim() ? wrapParagraph(p, maxWidth, measure) : ['']))
}

/**
 * Chọn cỡ chữ lớn nhất (từ maxSize giảm dần theo step) để khối chữ nằm gọn trong maxHeight.
 * measureAt(size) => hàm measure cho cỡ chữ đó.
 * Trả về { size, lines, lineHeight (px), height (px), fits }.
 */
export function fitText(text, { maxWidth, maxHeight, minSize, maxSize, step = 2, lineHeight = 1.45, measureAt }) {
  let best = null
  for (let size = maxSize; size >= minSize; size -= step) {
    const lines = wrapText(text, maxWidth, measureAt(size))
    const lh = Math.round(size * lineHeight)
    const height = lines.length * lh
    best = { size, lines, lineHeight: lh, height, fits: height <= maxHeight }
    if (best.fits) return best
  }
  return best
}
