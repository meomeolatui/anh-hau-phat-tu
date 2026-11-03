import { useEffect, useState } from 'react'

/**
 * Giữ màn hình luôn sáng khi đang ngồi thiền (Screen Wake Lock API).
 * Trình duyệt tự nhả khoá khi tab bị ẩn, nên phải xin lại khi người dùng quay về.
 * @returns true nếu đang giữ được khoá màn hình
 */
export default function useWakeLock(enabled) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.wakeLock) return
    let sentinel = null
    let cancelled = false

    const onRelease = () => setActive(false)

    const acquire = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const s = await navigator.wakeLock.request('screen')
        if (cancelled) {
          s.release()
          return
        }
        sentinel = s
        s.addEventListener('release', onRelease)
        setActive(true)
      } catch {
        // Bị từ chối (pin yếu, trình duyệt không cho phép…): vẫn ngồi được, chỉ là màn hình có thể tự tắt
        setActive(false)
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible' && (!sentinel || sentinel.released)) acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      if (sentinel && !sentinel.released) {
        sentinel.removeEventListener('release', onRelease)
        sentinel.release().catch(onRelease)
      }
      setActive(false)
    }
  }, [enabled])

  return active
}
