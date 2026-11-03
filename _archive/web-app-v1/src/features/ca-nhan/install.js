/**
 * Nhận biết khả năng cài ứng dụng (PWA) lên màn hình chính.
 * Tách thành hàm thuần để kiểm thử được mà không cần trình duyệt thật.
 */

/** iPhone/iPad (kể cả iPadOS 13+ tự nhận là Mac nhưng có màn hình cảm ứng). */
export function isIOSDevice(nav = typeof navigator !== 'undefined' ? navigator : null) {
  if (!nav) return false
  if (/iphone|ipad|ipod/i.test(nav.userAgent || '')) return true
  return nav.platform === 'MacIntel' && (nav.maxTouchPoints || 0) > 1
}

/** Ứng dụng đang chạy ở chế độ đã cài (không có thanh địa chỉ). */
export function isStandaloneDisplay(win = typeof window !== 'undefined' ? window : null) {
  if (!win) return false
  if (win.navigator?.standalone) return true
  return Boolean(win.matchMedia?.('(display-mode: standalone)').matches)
}

/**
 * @returns 'installed' | 'prompt' | 'ios' | 'manual'
 */
export function installMode({ installed, canPrompt, ios }) {
  if (installed) return 'installed'
  if (canPrompt) return 'prompt'
  if (ios) return 'ios'
  return 'manual'
}
