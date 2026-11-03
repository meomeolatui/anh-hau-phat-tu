import { useEffect, useState } from 'react'

/**
 * Thời điểm hiện tại, tự cập nhật mỗi phút và khi người dùng quay lại tab —
 * để trang Hôm nay không còn hiện "hôm qua" nếu điện thoại để mở qua đêm.
 */
export function useNow(intervalMs = 60000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = setInterval(tick, intervalMs)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs])

  return now
}
