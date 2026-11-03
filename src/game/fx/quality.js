/**
 * Quyết định bật hậu kỳ (PostFX) theo cài đặt chất lượng. Thuần JS để test được.
 *   'low'  → tắt hết
 *   'auto' → bật trên máy tính, tắt trên thiết bị cảm ứng (điện thoại/máy tính bảng)
 *   'high' → bật đủ
 */

/** Màn hình cảm ứng là chính (con trỏ thô) — an toàn khi không có window/matchMedia (test, SSR) */
export function isCoarsePointer() {
  try {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)')?.matches
  } catch {
    // matchMedia không hỗ trợ truy vấn → coi như máy tính
    return false
  }
}

export function postFxEnabled(quality, coarse = isCoarsePointer()) {
  if (quality === 'low') return false
  if (quality === 'high') return true
  return !coarse
}

/** Hệ số đẩy sáng HDR cho vật liệu glow() khi bật Bloom (đèn/nến vượt ngưỡng loá, tường nắng thì không) */
export const GLOW_BOOST = 2.4

/** Có hiện chỉ báo FPS không (URL có ?fps) */
export function wantsFpsMeter(search = typeof window !== 'undefined' ? window.location.search : '') {
  return new URLSearchParams(search).has('fps')
}
