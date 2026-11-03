import { addDays, fromKey, toKey } from '../../lib/date'

/** Tuần bắt đầu từ Thứ Hai — thói quen phổ biến của lịch treo tường Việt Nam. */
export const WEEK_HEADERS = [
  { short: 'T2', long: 'Thứ Hai' },
  { short: 'T3', long: 'Thứ Ba' },
  { short: 'T4', long: 'Thứ Tư' },
  { short: 'T5', long: 'Thứ Năm' },
  { short: 'T6', long: 'Thứ Sáu' },
  { short: 'T7', long: 'Thứ Bảy' },
  { short: 'CN', long: 'Chủ nhật' },
]

export const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`)

/** Giới hạn năm hợp lý cho thuật toán âm lịch (độ chính xác thiên văn giảm dần ngoài khoảng này). */
export const MIN_YEAR = 1900
export const MAX_YEAR = 2100

/** Vị trí cột (0 = Thứ Hai … 6 = Chủ nhật) của một Date. */
export function weekdayIndex(date) {
  return (date.getDay() + 6) % 7
}

/**
 * Lưới tháng cố định 6 tuần × 7 ngày, để chiều cao lịch không nhảy khi đổi tháng.
 * @param {number} year năm dương lịch
 * @param {number} month tháng 0..11
 * @returns {{ key: string, date: Date, day: number, inMonth: boolean }[][]}
 */
export function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const start = addDays(first, -weekdayIndex(first))
  const weeks = []
  for (let w = 0; w < 6; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d)
      week.push({ key: toKey(date), date, day: date.getDate(), inMonth: date.getMonth() === month })
    }
    weeks.push(week)
  }
  return weeks
}

/** Cộng/trừ tháng, chuẩn hoá về { year, month 0..11 }. */
export function shiftMonth({ year, month }, delta) {
  const total = year * 12 + month + delta
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 }
}

export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

export function clampYear(year) {
  return Math.min(MAX_YEAR, Math.max(MIN_YEAR, year))
}

/** Tháng { year, month } chứa khoá ngày. */
export function monthOfKey(key) {
  const d = fromKey(key)
  return { year: d.getFullYear(), month: d.getMonth() }
}

/**
 * Ngày được chọn sau khi chuyển sang tháng khác: nếu tháng đó chứa hôm nay thì chọn hôm nay,
 * không thì giữ nguyên số ngày (kẹp vào số ngày của tháng) để người dùng không bị "lạc".
 */
export function selectionForMonth({ year, month }, prevKey, today) {
  const t = fromKey(today)
  if (t.getFullYear() === year && t.getMonth() === month) return today
  const prevDay = prevKey ? fromKey(prevKey).getDate() : 1
  return toKey(new Date(year, month, Math.min(prevDay, daysInMonth(year, month))))
}

/** Cộng tháng cho một khoá ngày, giữ số ngày (kẹp cuối tháng: 31/1 + 1 tháng → 28/2). */
export function addMonthsKey(key, delta) {
  const d = fromKey(key)
  const { year, month } = shiftMonth({ year: d.getFullYear(), month: d.getMonth() }, delta)
  return toKey(new Date(year, month, Math.min(d.getDate(), daysInMonth(year, month))))
}

/**
 * Điều hướng bàn phím trong lưới lịch theo mẫu ARIA "date grid".
 * @returns khoá ngày mới, hoặc null nếu phím không dùng cho lịch
 */
export function keyAfterNavigation(key, eventKey, shiftKey = false) {
  const date = fromKey(key)
  switch (eventKey) {
    case 'ArrowLeft':
      return toKey(addDays(date, -1))
    case 'ArrowRight':
      return toKey(addDays(date, 1))
    case 'ArrowUp':
      return toKey(addDays(date, -7))
    case 'ArrowDown':
      return toKey(addDays(date, 7))
    case 'Home':
      return toKey(addDays(date, -weekdayIndex(date)))
    case 'End':
      return toKey(addDays(date, 6 - weekdayIndex(date)))
    case 'PageUp':
      return addMonthsKey(key, shiftKey ? -12 : -1)
    case 'PageDown':
      return addMonthsKey(key, shiftKey ? 12 : 1)
    default:
      return null
  }
}

/** Khoá ngày có nằm trong khoảng năm được hỗ trợ không. */
export function isKeyInRange(key) {
  const y = fromKey(key).getFullYear()
  return y >= MIN_YEAR && y <= MAX_YEAR
}
