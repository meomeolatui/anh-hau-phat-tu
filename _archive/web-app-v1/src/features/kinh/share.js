/**
 * Chia sẻ một bài kinh: ưu tiên bảng chia sẻ của hệ điều hành (điện thoại), không có thì chép liên kết.
 * @returns {Promise<'shared'|'cancelled'|'copied'|'unsupported'>} — lỗi chép clipboard được ném ra cho nơi gọi báo.
 */
export async function shareOrCopy(data, nav = typeof navigator !== 'undefined' ? navigator : undefined) {
  if (nav?.share) {
    try {
      await nav.share(data)
      return 'shared'
    } catch (err) {
      // Người dùng đóng bảng chia sẻ: không phải lỗi. Lỗi khác (vd. bị chặn) → thử chép liên kết bên dưới.
      if (err?.name === 'AbortError') return 'cancelled'
    }
  }
  if (nav?.clipboard?.writeText) {
    await nav.clipboard.writeText(data.url)
    return 'copied'
  }
  return 'unsupported'
}

export function sutraUrl(id, origin = typeof window !== 'undefined' ? window.location.origin : '') {
  return `${origin}/kinh/${encodeURIComponent(id)}`
}
