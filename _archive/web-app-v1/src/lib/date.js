export const WEEKDAYS_VI = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
export const WEEKDAYS_SHORT_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

const pad = (n) => String(n).padStart(2, '0')

/** Khóa ngày theo giờ địa phương: 'YYYY-MM-DD'. Dùng làm key cho nhật ký. */
export function toKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayKey() {
  return toKey(new Date())
}

/** Ngược lại của toKey — trả về Date lúc 00:00 giờ địa phương. */
export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function addDaysKey(key, n) {
  return toKey(addDays(fromKey(key), n))
}

/** Số ngày giữa hai khóa ngày (b - a). */
export function diffDays(aKey, bKey) {
  return Math.round((fromKey(bKey) - fromKey(aKey)) / 86400000)
}

/** "Thứ Hai, 02/11/2026" */
export function formatViDate(date = new Date()) {
  return `${WEEKDAYS_VI[date.getDay()]}, ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

/** "02/11" hoặc "02/11/2026" */
export function formatShortDate(date, withYear = false) {
  const base = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`
  return withYear ? `${base}/${date.getFullYear()}` : base
}

export function formatTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Định dạng số giây thành "mm:ss" hoặc "h:mm:ss". */
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

/** Lời chào theo buổi trong ngày. */
export function greetingByHour(hour = new Date().getHours()) {
  if (hour < 4) return 'Đêm khuya an tịnh'
  if (hour < 11) return 'Buổi sáng an lành'
  if (hour < 14) return 'Buổi trưa thong thả'
  if (hour < 18) return 'Buổi chiều nhẹ nhàng'
  return 'Buổi tối bình yên'
}

export function formatNumber(n) {
  return Number(n || 0).toLocaleString('vi-VN')
}
