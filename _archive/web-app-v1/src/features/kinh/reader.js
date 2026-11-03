/**
 * Logic thuần cho trình đọc tụng: làm phẳng kinh văn thành danh sách dòng có chỉ số,
 * ước lượng nhịp tụng, cỡ chữ, tiến độ. Không phụ thuộc React để dễ test.
 */

/** Nhịp tụng: thời gian cho mỗi âm tiết + khoảng nghỉ giữa các dòng (giây). */
export const PACES = [
  { value: 'cham', label: 'Chậm', perSyllable: 0.8, gap: 1.2 },
  { value: 'vua', label: 'Vừa', perSyllable: 0.58, gap: 0.8 },
  { value: 'nhanh', label: 'Nhanh', perSyllable: 0.42, gap: 0.5 },
]

export const DEFAULT_PACE = 'vua'
const MIN_LINE_SECONDS = 1.5

export const FONT_MIN = 16
export const FONT_MAX = 34
export const FONT_STEP = 2

export function getPace(id) {
  return PACES.find((p) => p.value === id) ?? PACES.find((p) => p.value === DEFAULT_PACE)
}

const REPEAT_RE = /\((\d+)\s*lần\)/i
const PAREN_RE = /\([^)]*\)/g

/** Số lần lặp ghi ở cuối dòng, vd. "(3 lần)" → 3. Mặc định 1. */
export function repeatCount(text) {
  const m = REPEAT_RE.exec(String(text ?? ''))
  if (!m) return 1
  const n = Number(m[1])
  return n > 0 ? Math.min(n, 108) : 1
}

/** Đếm âm tiết (tiếng Việt viết rời từng âm tiết), bỏ qua ghi chú trong ngoặc. */
export function syllableCount(text) {
  return String(text ?? '')
    .replace(PAREN_RE, ' ')
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length
}

/** Số giây để tụng một dòng theo nhịp đã chọn (đã tính số lần lặp). */
export function lineSeconds(text, paceId = DEFAULT_PACE) {
  const pace = getPace(paceId)
  const syl = syllableCount(text)
  if (!syl) return MIN_LINE_SECONDS
  const once = syl * pace.perSyllable + pace.gap
  return Math.max(MIN_LINE_SECONDS, once * repeatCount(text))
}

/** Tổng thời gian ước tính (giây) từ dòng `from` đến hết. */
export function estimateSeconds(lines, paceId = DEFAULT_PACE, from = 0) {
  let total = 0
  for (let i = Math.max(0, from); i < lines.length; i++) {
    const line = lines[i]
    total += lineSeconds(typeof line === 'string' ? line : line.text, paceId)
  }
  return total
}

/**
 * Làm phẳng một bài thành danh sách dòng có chỉ số liên tục + danh sách khối (section).
 * Section có `ref` được thay bằng nội dung bài được dẫn chiếu (gộp mọi section của bài đó).
 * `resolve(id)` trả về bài kinh; chống vòng lặp dẫn chiếu bằng tập `seen`.
 *
 * @returns {{ sections: Array<{ key, heading, note, ref, start, end }>, lines: Array<{ index, text, section }> }}
 */
export function flattenSutra(sutra, resolve = () => undefined, seen = new Set()) {
  const sections = []
  const lines = []
  if (!sutra) return { sections, lines }
  const visited = new Set(seen).add(sutra.id)

  sutra.sections.forEach((sec, i) => {
    let heading = sec.heading ?? null
    let note = sec.note ?? null
    let texts = sec.lines ?? []
    let ref = null

    if (sec.ref) {
      const target = visited.has(sec.ref) ? undefined : resolve(sec.ref)
      if (!target) return
      ref = { id: target.id, title: target.title }
      heading = heading ?? target.title
      // Lấy dòng của bài được dẫn chiếu (đã phẳng, có thể chứa ref lồng nhau)
      const inner = flattenSutra(target, resolve, visited)
      texts = inner.lines.map((l) => l.text)
      note = note ?? target.sections.find((s) => s.note)?.note ?? null
    }

    const start = lines.length
    const sectionIndex = sections.length
    texts.forEach((text) => lines.push({ index: lines.length, text, section: sectionIndex }))
    sections.push({ key: `${sutra.id}-${i}`, heading, note, ref, start, end: lines.length })
  })

  return { sections, lines }
}

/** Đếm tổng số dòng tụng (đã mở rộng dẫn chiếu). */
export function countLines(sutra, resolve) {
  return flattenSutra(sutra, resolve).lines.length
}

export function clampFontSize(size) {
  const n = Number(size)
  if (!Number.isFinite(n)) return 20
  const snapped = Math.round(n / FONT_STEP) * FONT_STEP
  return Math.min(FONT_MAX, Math.max(FONT_MIN, snapped))
}

/** Chuẩn hoá chỉ số dòng về [0, total-1]; trả về 0 nếu không hợp lệ. */
export function clampIndex(index, total) {
  const n = Number(index)
  if (!Number.isInteger(n) || total <= 0) return 0
  return Math.min(total - 1, Math.max(0, n))
}

/** Đang đọc dở: đã qua dòng đầu nhưng chưa tới dòng cuối. */
export function isInProgress(index, total) {
  return Number.isInteger(index) && total > 1 && index > 0 && index < total - 1
}

/** Tiến độ 0..1 khi đang ở dòng `index` (tính cả dòng hiện tại là đã tụng). */
export function progressOf(index, total) {
  if (!total) return 0
  return Math.min(1, Math.max(0, (clampIndex(index, total) + 1) / total))
}

/** Đọc tham số "?dong=5" (đánh số từ 1 cho người dùng) → chỉ số 0-based, hoặc null. */
export function parseLineParam(value, total) {
  if (value == null || value === '') return null
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1) return null
  return clampIndex(n - 1, total)
}

/** Tách ghi chú lặp "(3 lần)" khỏi lời tụng để hiển thị nhỏ, khác màu. */
export function splitRepeat(text) {
  const s = String(text ?? '')
  const m = REPEAT_RE.exec(s)
  if (!m) return { main: s, marker: null }
  return { main: (s.slice(0, m.index) + s.slice(m.index + m[0].length)).trim(), marker: m[0].slice(1, -1) }
}
