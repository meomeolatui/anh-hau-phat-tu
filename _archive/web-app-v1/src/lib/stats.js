import { addDaysKey, todayKey } from './date'

/** Một ngày được tính là "có tu tập" khi có bất kỳ hoạt động nào. */
export function isActiveDay(day) {
  if (!day) return false
  return day.niem > 0 || day.thienMin > 0 || day.tung > 0 || (day.thienHanh?.length ?? 0) > 0
}

/**
 * Chuỗi ngày tu tập liên tục. Nếu hôm nay chưa tu thì vẫn tính chuỗi đến hôm qua
 * (người dùng còn cả ngày để giữ chuỗi).
 */
export function currentStreak(logs, today = todayKey()) {
  let key = isActiveDay(logs[today]) ? today : addDaysKey(today, -1)
  let n = 0
  while (isActiveDay(logs[key])) {
    n++
    key = addDaysKey(key, -1)
  }
  return n
}

export function longestStreak(logs) {
  const keys = Object.keys(logs).filter((k) => isActiveDay(logs[k])).sort()
  let best = 0
  let run = 0
  let prev = null
  for (const k of keys) {
    run = prev && addDaysKey(prev, 1) === k ? run + 1 : 1
    best = Math.max(best, run)
    prev = k
  }
  return best
}

export function totals(logs) {
  const t = { niem: 0, thienMin: 0, tung: 0, thienHanh: 0, activeDays: 0 }
  for (const day of Object.values(logs)) {
    t.niem += day.niem || 0
    t.thienMin += day.thienMin || 0
    t.tung += day.tung || 0
    t.thienHanh += day.thienHanh?.length || 0
    if (isActiveDay(day)) t.activeDays++
  }
  return t
}

/**
 * Chuỗi giá trị theo ngày cho biểu đồ.
 * @param field 'niem' | 'thienMin' | 'tung' | 'thienHanh'
 * @returns [{ key, value }] từ cũ đến mới, dài `days` phần tử, kết thúc ở endKey
 */
export function series(logs, field, days = 7, endKey = todayKey()) {
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const key = addDaysKey(endKey, -i)
    const day = logs[key]
    const value = field === 'thienHanh' ? (day?.thienHanh?.length ?? 0) : (day?.[field] ?? 0)
    out.push({ key, value })
  }
  return out
}

/** Mức độ tu tập 0..4 của một ngày — dùng cho lịch nhiệt (heatmap). */
export function intensity(day, goals) {
  if (!isActiveDay(day)) return 0
  let score = 0
  if (day.niem > 0) score += Math.min(1, day.niem / (goals?.niem || 1080))
  if (day.thienMin > 0) score += Math.min(1, day.thienMin / (goals?.thienMin || 15))
  if (day.tung > 0) score += 0.5
  if (day.thienHanh?.length) score += Math.min(1, day.thienHanh.length / (goals?.thienHanh || 1))
  if (score >= 2.5) return 4
  if (score >= 1.5) return 3
  if (score >= 0.75) return 2
  return 1
}

/** Tỉ lệ hoàn thành mục tiêu trong ngày, mỗi mục 0..1 */
export function dayProgress(day, goals) {
  const d = day ?? {}
  return {
    niem: Math.min(1, (d.niem || 0) / (goals.niem || 1)),
    thien: Math.min(1, (d.thienMin || 0) / (goals.thienMin || 1)),
    thienHanh: Math.min(1, (d.thienHanh?.length || 0) / (goals.thienHanh || 1)),
  }
}

/**
 * Cột mốc tinh tấn — ghi nhận nhẹ nhàng, không phải "điểm công đức".
 * Mỗi mốc: { id, title, desc, achieved, progress (0..1) }
 */
export function milestones(state) {
  const t = totals(state.logs)
  const best = longestStreak(state.logs)
  const visited = Object.keys(state.pilgrimage?.visited ?? {}).length
  const lessons = Object.keys(state.lessons?.completed ?? {}).length
  const defs = [
    { id: 'khoi-tam', title: 'Khởi tâm', desc: 'Ngày đầu tiên tu tập cùng ứng dụng', value: t.activeDays, target: 1 },
    { id: 'bay-ngay', title: 'Bảy ngày tinh tấn', desc: 'Giữ chuỗi tu tập 7 ngày liên tục', value: best, target: 7 },
    { id: 'ba-muoi-ngay', title: 'Một tháng bền bỉ', desc: 'Giữ chuỗi tu tập 30 ngày liên tục', value: best, target: 30 },
    { id: 'van-cau', title: 'Vạn câu Phật hiệu', desc: 'Tổng cộng 10.000 câu niệm Phật', value: t.niem, target: 10000 },
    { id: 'tram-phut', title: 'Trăm phút tĩnh lặng', desc: 'Tổng cộng 100 phút ngồi thiền', value: t.thienMin, target: 100 },
    { id: 'tung-kinh', title: 'Tụng đủ 21 thời', desc: 'Hoàn thành 21 lần tụng/đọc kinh', value: t.tung, target: 21 },
    { id: 'thien-hanh', title: 'Năm mươi việc lành', desc: 'Ghi lại 50 thiện hạnh trong đời sống', value: t.thienHanh, target: 50 },
    { id: 'hanh-huong', title: 'Chân hành hương', desc: 'Viếng thăm 5 ngôi chùa ngoài đời thực', value: visited, target: 5 },
    { id: 'hoc-phat', title: 'Văn – Tư – Tu', desc: 'Hoàn thành 5 bài học Phật pháp', value: lessons, target: 5 },
  ]
  return defs.map((d) => ({ ...d, achieved: d.value >= d.target, progress: Math.min(1, d.value / d.target) }))
}
