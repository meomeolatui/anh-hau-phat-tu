import { addDaysKey, formatShortDate, toKey } from '../../lib/date'

/**
 * Thang đo cho biểu đồ 7 ngày. Chỉ vẽ đường mục tiêu khi số liệu đủ gần mục tiêu,
 * nếu không các cột sẽ bị ép quá thấp, khó đọc.
 */
export function chartScale(data, goal) {
  const maxVal = Math.max(0, ...data.map((d) => d.value || 0))
  const showGoal = goal > 0 && maxVal >= goal * 0.4
  const top = showGoal ? Math.max(maxVal, goal) : Math.max(maxVal, 1)
  // Chừa khoảng phía trên cho nhãn số
  return { max: top * 1.08, showGoal }
}

export function weekSummary(data) {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0)
  const activeDays = data.filter((d) => d.value > 0).length
  return { total, activeDays, average: activeDays ? Math.round(total / activeDays) : 0 }
}

/** Các phiên niệm Phật mới nhất (sessions đã được lưu mới → cũ). */
export function recentNiemSessions(sessions, limit = 6) {
  const out = []
  for (const s of sessions) {
    if (s.type !== 'niem') continue
    out.push(s)
    if (out.length >= limit) break
  }
  return out
}

export function countNiemSessions(sessions) {
  return sessions.reduce((n, s) => (s.type === 'niem' ? n + 1 : n), 0)
}

/** "Hôm nay" / "Hôm qua" / "02/11" */
export function dayLabel(date, todayK) {
  const key = toKey(date)
  if (key === todayK) return 'Hôm nay'
  if (key === addDaysKey(todayK, -1)) return 'Hôm qua'
  return formatShortDate(date, date.getFullYear() !== Number(todayK.slice(0, 4)))
}
