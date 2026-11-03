/** Phím dùng để lần hạt: Space, Enter, mũi tên xuống (giống kéo hạt về phía mình). */
export const COUNT_KEYS = new Set([' ', 'Spacebar', 'Enter', 'ArrowDown'])

const INTERACTIVE =
  'button, a[href], input, textarea, select, summary, [contenteditable="true"], [role="slider"], [role="radio"], [role="switch"], [role="button"], [role="tab"]'

/**
 * Quyết định một sự kiện keydown toàn trang có nên tính là lần hạt hay không.
 * - Không cướp phím khi đang gõ chữ, đang ở nút/ô khác hay khi có hộp thoại mở.
 * - Khi đang focus vùng chạm (là <button>), Space/Enter đã tự sinh click → chỉ xử lý ArrowDown
 *   để tránh đếm hai lần.
 */
export function shouldCountKey(e, padEl, { dialogOpen = false } = {}) {
  if (!COUNT_KEYS.has(e.key)) return false
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return false
  if (dialogOpen) return false
  const target = e.target
  if (padEl && target === padEl) return e.key === 'ArrowDown'
  if (target && typeof target.closest === 'function' && target.closest(INTERACTIVE)) return false
  return true
}
