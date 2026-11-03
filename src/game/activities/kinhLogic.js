/**
 * Logic thuần cho Tụng kinh: dàn bài kinh thành các dòng, nhịp từng dòng, tiến trình, công đức.
 */

/** Các bài ngắn phù hợp tụng tại án thư trong game (theo thứ tự hiển thị) */
export const CHANT_IDS = [
  'bat-nha-tam-kinh',
  'chu-vang-sanh',
  'ke-khai-kinh',
  'ke-tam-quy',
  'ke-sam-hoi',
  'tan-phat-a-di-da',
  'ke-nguyen-vang-sanh',
  'ke-hoi-huong',
  'luc-tu-dai-minh',
]

/** Tụng lại cùng một bài trong 10 phút thì không cộng thêm công đức */
export const CHANT_COOLDOWN = 10 * 60 * 1000

export const SPEEDS = [
  { id: 'cham', label: 'Chậm', factor: 0.8 },
  { id: 'vua', label: 'Vừa', factor: 1 },
  { id: 'nhanh', label: 'Nhanh', factor: 1.3 },
]

/** Tách ký hiệu lặp "(3 lần)" ở cuối dòng */
export function parseLine(raw) {
  const m = String(raw).match(/^(.*?)\s*\((\d+)\s*lần\)\s*$/)
  if (!m) return { text: String(raw).trim(), repeat: 1 }
  return { text: m[1].trim(), repeat: Math.max(1, Number(m[2])) }
}

/**
 * Dàn bài kinh thành danh sách dòng. Dòng đầu mỗi đoạn mang `heading`/`note` của đoạn.
 * Đoạn `ref` được chèn nội dung bài được dẫn chiếu (một cấp).
 * @returns {Array<{ text: string, repeat: number, heading?: string, note?: string }>}
 */
export function flattenSutra(sutra, lookup = () => undefined, depth = 0) {
  if (!sutra) return []
  const out = []
  for (const sec of sutra.sections ?? []) {
    if (sec.ref) {
      if (depth > 1) continue
      const sub = flattenSutra(lookup(sec.ref), lookup, depth + 1)
      const title = lookup(sec.ref)?.title
      if (sub.length && title && !sub[0].heading) sub[0] = { ...sub[0], heading: title }
      out.push(...sub)
      continue
    }
    const lines = sec.lines ?? []
    lines.forEach((raw, i) => {
      const item = parseLine(raw)
      if (i === 0) {
        if (sec.heading) item.heading = sec.heading
        if (sec.note) item.note = sec.note
      }
      out.push(item)
    })
  }
  return out
}

/** Tổng số "nhịp" (mỗi lần tụng một dòng = 1 nhịp, kể cả lặp lại) */
export function countBeats(lines) {
  return lines.reduce((n, l) => n + l.repeat, 0)
}

/** Thời gian tụng một dòng (ms) theo số chữ */
export function lineDuration(text, speed = 1) {
  const words = String(text).split(/\s+/).filter(Boolean).length
  const ms = Math.min(9000, Math.max(2000, 1100 + words * 330))
  return Math.round(ms / speed)
}

/** Vị trí kế tiếp; null nếu đã hết bài. pos = { line, rep } (rep đếm từ 0) */
export function nextPosition(pos, lines) {
  const cur = lines[pos.line]
  if (!cur) return null
  if (pos.rep + 1 < cur.repeat) return { line: pos.line, rep: pos.rep + 1 }
  if (pos.line + 1 < lines.length) return { line: pos.line + 1, rep: 0 }
  return null
}

/** Số nhịp đã xong trước vị trí pos */
export function beatsBefore(pos, lines) {
  let n = 0
  for (let i = 0; i < pos.line && i < lines.length; i++) n += lines[i].repeat
  return n + pos.rep
}

/** Công đức theo độ dài bài: 25 (rất ngắn) → 50 (dài) */
export function chantMerit(beats) {
  const v = 25 + Math.round(((beats - 4) * 25) / 26)
  return Math.min(50, Math.max(25, v))
}
