import { holidaysOn, isFastingDay, isSocVong } from '../../data/holidays'
import { getLunarDate, LUNAR_MONTH_NAMES } from '../../lib/lunar'
import { isActiveDay } from '../../lib/stats'
import { toKey } from '../../lib/date'

/**
 * Gom mọi thông tin cần hiển thị cho một ngày trên lịch.
 * Tách khỏi component để test được và để ô lịch, bảng chi tiết dùng chung một nguồn.
 */
export function describeDay(date, { fasting = 'none', logs = {}, today = toKey(new Date()) } = {}) {
  const key = toKey(date)
  const lunar = getLunarDate(date)
  return {
    key,
    date,
    lunar,
    holidays: holidaysOn(lunar),
    fasting: isFastingDay(lunar, fasting),
    soc: lunar.day === 1,
    vong: lunar.day === 15,
    socVong: isSocVong(lunar),
    active: isActiveDay(logs[key]),
    isToday: key === today,
  }
}

/** Nhãn âm lịch trong ô: mùng 1 ghi kèm tháng ("1/9", "1/6N") để biết đang ở tháng âm nào. */
export function cellLunarLabel(lunar) {
  if (lunar.day !== 1) return String(lunar.day)
  return `${lunar.day}/${lunar.month}${lunar.leap ? 'N' : ''}`
}

/** "mùng 5", "rằm", "ngày 23" — cách người Việt gọi ngày âm. */
export function lunarDayName(day) {
  if (day === 15) return 'rằm'
  if (day <= 10) return `mùng ${day}`
  return `ngày ${day}`
}

/** "mùng 1, mùng 8, ngày 14, rằm, ngày cuối tháng" — mô tả các ngày của một lối chay. */
export function fastingDaysText(days) {
  return days.map((d) => (d === 30 ? 'ngày cuối tháng' : lunarDayName(d))).join(', ')
}

/** "Mùng 1 tháng Chín (nhuận) năm Bính Ngọ" */
export function lunarLongLabel(lunar) {
  const dayName = lunarDayName(lunar.day)
  const head = dayName.charAt(0).toUpperCase() + dayName.slice(1)
  return `${head} tháng ${LUNAR_MONTH_NAMES[lunar.month - 1]}${lunar.leap ? ' (nhuận)' : ''} năm ${lunar.yearName}`
}

/** Mô tả đầy đủ cho trình đọc màn hình. */
export function cellAriaLabel(info, weekdayLong) {
  const d = info.date
  const parts = [
    `${weekdayLong}, ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`,
    `âm lịch ${info.lunar.day} tháng ${info.lunar.month}${info.lunar.leap ? ' nhuận' : ''}`,
  ]
  if (info.isToday) parts.push('hôm nay')
  for (const h of info.holidays) parts.push(h.short)
  if (info.soc) parts.push('ngày Sóc')
  if (info.vong) parts.push('ngày Vọng')
  if (info.fasting) parts.push('ngày chay')
  if (info.active) parts.push('có tu tập')
  return parts.join(', ')
}

/** "Hôm nay", "Ngày mai", "Còn 5 ngày", "3 ngày trước" */
export function relativeDayLabel(days) {
  if (days === 0) return 'Hôm nay'
  if (days === 1) return 'Ngày mai'
  if (days === -1) return 'Hôm qua'
  if (days === 2) return 'Ngày kia'
  return days > 0 ? `Còn ${days} ngày` : `${-days} ngày trước`
}
