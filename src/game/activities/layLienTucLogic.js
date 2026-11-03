/**
 * Lạy liên tục (không cần thao tác): nhân vật tự lạy theo nhịp hoạt ảnh 'bow' (3 giây/lạy).
 * Cứ BOWS_PER_XU lạy được 1 xu, mỗi lạy thêm chút công đức. Đếm theo đồng hồ thật (Date.now)
 * nên chuyển tab / máy chậm vẫn tính đúng.
 */
export const AUTO_BOW_MS = 3000 // khớp chu kỳ tư thế 'bow' trong avatarRig.js
export const BOWS_PER_XU = 3
export const MERIT_PER_AUTO_BOW = 2

/** Số lạy trọn vẹn sau `elapsedMs` (lạy dở dang chưa tính) */
export function bowsAfter(elapsedMs) {
  return Math.max(0, Math.floor(elapsedMs / AUTO_BOW_MS))
}

/** Xu nhận thêm khi tổng số lạy đi từ `before` lên `after` */
export function xuGained(before, after) {
  return Math.floor(after / BOWS_PER_XU) - Math.floor(before / BOWS_PER_XU)
}
