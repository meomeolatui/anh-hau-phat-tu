/**
 * Sao chép văn bản. Ưu tiên Clipboard API; khi không có (trình duyệt cũ, ngữ cảnh không bảo mật)
 * thì dùng textarea ẩn + execCommand để người dùng lớn tuổi trên máy đời cũ vẫn chép được.
 * Trả về true nếu thành công.
 */
export async function copyText(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Bị từ chối quyền — thử cách dự phòng bên dưới
    }
  }
  return legacyCopy(text)
}

function legacyCopy(text) {
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') return false
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    ta.remove()
  }
}
