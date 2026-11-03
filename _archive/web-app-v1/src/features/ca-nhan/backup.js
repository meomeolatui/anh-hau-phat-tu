import { toKey } from '../../lib/date'

/** "anh-hau-phat-tu-2026-11-02.json" */
export function backupFileName(date = new Date()) {
  return `anh-hau-phat-tu-${toKey(date)}.json`
}

/** Tải chuỗi JSON xuống máy dưới dạng file. */
export function downloadJson(json, fileName) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Thu hồi URL sau một nhịp để trình duyệt kịp bắt đầu tải
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Kích thước dễ đọc: "820 B", "12,4 KB", "1,2 MB". */
export function formatBytes(bytes) {
  const n = Math.max(0, Number(bytes) || 0)
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} KB`
  return `${(n / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB`
}

export const RESET_CONFIRM_WORD = 'XOA'

/**
 * Người dùng phải gõ "XOA" để xác nhận xoá. Chấp nhận cả chữ thường và có dấu ("xoá")
 * vì bàn phím tiếng Việt hay tự thêm dấu.
 */
export function isResetConfirmed(text) {
  const plain = String(text ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toUpperCase()
  return plain === RESET_CONFIRM_WORD
}

/** Mô tả ngắn gọn dữ liệu đang lưu để người dùng biết mình sắp sao lưu/xoá gì. */
export function dataSummary(state) {
  return {
    days: Object.keys(state.logs ?? {}).length,
    sessions: state.sessions?.length ?? 0,
    vows: state.vows?.length ?? 0,
    visited: Object.keys(state.pilgrimage?.visited ?? {}).length,
  }
}
