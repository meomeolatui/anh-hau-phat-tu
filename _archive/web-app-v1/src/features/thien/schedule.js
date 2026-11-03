/**
 * Lịch chuông nhắc giữa giờ & câu nhắc chánh niệm — thuần.
 */

/**
 * Các mốc (giây) đánh chuông nhắc. Không gồm mốc 0 (chuông mở đầu)
 * và mốc cuối (chuông kết thúc) để hai tiếng chuông không chồng lên nhau.
 */
export function bellSchedule(totalSec, intervalMin) {
  const step = Math.round(Number(intervalMin) * 60)
  if (!(step > 0) || !(totalSec > 0)) return []
  const out = []
  for (let t = step; t < totalSec; t += step) out.push(t)
  return out
}

/**
 * Những mốc chuông vừa đi qua trong khoảng (prevSec, currSec].
 * Khi tab bị ẩn lâu có thể vượt nhiều mốc một lúc — trang chỉ cần đánh một tiếng.
 */
export function dueBells(schedule, prevSec, currSec) {
  if (!(currSec > prevSec)) return []
  return schedule.filter((t) => t > prevSec && t <= currSec)
}

/** Chỉ số câu nhắc chánh niệm hiện tại: đổi câu mỗi `everySec` giây, bắt đầu từ `offset`. */
export function promptIndex(elapsedSec, count, everySec = 150, offset = 0) {
  if (!count) return -1
  const step = Math.max(1, everySec)
  const n = Math.floor(Math.max(0, elapsedSec) / step)
  return (((n + offset) % count) + count) % count
}
