/**
 * Tải một chuỗi văn bản về máy dưới dạng tệp — hoàn toàn trên thiết bị, không gửi đi đâu.
 * Trả về false nếu trình duyệt không hỗ trợ (vd. môi trường không có URL.createObjectURL).
 */
export function downloadTextFile(text, fileName, mime = 'text/plain;charset=utf-8') {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return false
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Thu hồi sau một nhịp để Safari kịp bắt đầu tải
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}
