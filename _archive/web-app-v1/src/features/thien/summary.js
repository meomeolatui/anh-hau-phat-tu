/**
 * Dữ liệu dẫn xuất cho phần thống kê & màn hình kết thúc buổi ngồi — thuần.
 */
import { formatTime } from '../../lib/date'

/** Ngưỡng tối thiểu để ghi nhận một buổi ngồi vào nhật ký. */
export const MIN_RECORD_SEC = 60

export function shouldRecord(sec) {
  return Number(sec) >= MIN_RECORD_SEC
}

/** Các phiên thiền gần nhất (sessions đã sắp mới → cũ). */
export function recentThienSessions(sessions, limit = 6) {
  const out = []
  for (const s of sessions ?? []) {
    if (s.type !== 'thien') continue
    out.push(s)
    if (out.length >= limit) break
  }
  return out
}

/** Tổng hợp tuần từ series(logs, 'thienMin', 7). */
export function weekSummary(points) {
  const total = points.reduce((sum, p) => sum + (p.value || 0), 0)
  const activeDays = points.filter((p) => p.value > 0).length
  const max = points.reduce((m, p) => Math.max(m, p.value || 0), 0)
  return { total, activeDays, max }
}

/** "12 phút" / "1 giờ 05 phút" / "45 giây" — cách đọc thân thiện cho người lớn tuổi. */
export function humanDuration(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0))
  if (s < 60) return `${s} giây`
  const totalMin = Math.floor(s / 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (!h) return `${m} phút`
  return m ? `${h} giờ ${String(m).padStart(2, '0')} phút` : `${h} giờ`
}

/** Nối một dòng ghi chú vào nhật ký ngày — KHÔNG ghi đè ghi chú cũ. */
export function appendNote(prevNote, text, { at = new Date(), sec = 0 } = {}) {
  const clean = String(text ?? '').trim()
  const prev = String(prevNote ?? '')
  if (!clean) return prev
  const line = `[${formatTime(at)} · Thiền ${humanDuration(sec)}] ${clean}`
  return prev.trim() ? `${prev.replace(/\s+$/, '')}\n${line}` : line
}
