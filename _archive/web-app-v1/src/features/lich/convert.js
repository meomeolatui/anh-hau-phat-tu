import { getLunarDate, lunarToDate } from '../../lib/lunar'
import { MAX_YEAR, MIN_YEAR } from './month-grid'

/**
 * Công cụ đổi ngày. Trả về { ok: true, ... } hoặc { ok: false, error } để giao diện
 * hiện lời nhắc dễ hiểu thay vì ném lỗi.
 */

function checkYear(year) {
  if (!Number.isInteger(year)) return 'Vui lòng nhập năm.'
  if (year < MIN_YEAR || year > MAX_YEAR) return `Năm cần nằm trong khoảng ${MIN_YEAR}–${MAX_YEAR}.`
  return null
}

/** Dương → Âm. Nhận chuỗi 'YYYY-MM-DD' từ ô nhập type="date". */
export function solarToLunarSafe(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return { ok: false, error: 'Vui lòng chọn một ngày dương lịch.' }
  const [y, m, d] = value.split('-').map(Number)
  const yearError = checkYear(y)
  if (yearError) return { ok: false, error: yearError }
  const date = new Date(y, m - 1, d)
  // new Date tự "tràn" ngày (31/2 → 3/3) nên phải đối chiếu lại
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return { ok: false, error: 'Ngày dương lịch này không tồn tại.' }
  }
  return { ok: true, date, lunar: getLunarDate(date) }
}

/** Âm → Dương. Kiểm tra cả tháng nhuận và tháng thiếu (không có ngày 30). */
export function lunarToSolarSafe({ day, month, year, leap = false }) {
  const yearError = checkYear(year)
  if (yearError) return { ok: false, error: yearError }
  if (!Number.isInteger(month) || month < 1 || month > 12) return { ok: false, error: 'Tháng âm lịch phải từ 1 đến 12.' }
  if (!Number.isInteger(day) || day < 1 || day > 30) return { ok: false, error: 'Ngày âm lịch phải từ 1 đến 30.' }
  const date = lunarToDate(day, month, year, leap)
  if (!date) return { ok: false, error: `Năm ${year} âm lịch không có tháng ${month} nhuận.` }
  // Đổi ngược để bắt các trường hợp thuật toán "trượt" sang tháng khác
  const back = getLunarDate(date)
  if (back.leap !== leap) return { ok: false, error: `Năm ${year} âm lịch không có tháng ${month} nhuận.` }
  if (back.day !== day || back.month !== month || back.year !== year) {
    return { ok: false, error: `Tháng ${month}${leap ? ' nhuận' : ''} năm ${year} là tháng thiếu, chỉ có 29 ngày.` }
  }
  return { ok: true, date, lunar: back }
}
