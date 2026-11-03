import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Đồng hồ đọc: chỉ tính thời gian khi trang đang hiển thị — tránh ghi nhận cả giờ đồng hồ
 * nếu người dùng mở bài rồi tắt màn hình hoặc chuyển sang ứng dụng khác.
 */
export function useReadingClock() {
  const acc = useRef(0)
  const since = useRef(null)

  useEffect(() => {
    since.current = document.hidden ? null : Date.now()
    const onVisibility = () => {
      if (document.hidden && since.current != null) {
        acc.current += Date.now() - since.current
        since.current = null
      } else if (!document.hidden && since.current == null) {
        since.current = Date.now()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const read = useCallback(() => {
    const running = since.current != null ? Date.now() - since.current : 0
    return Math.round((acc.current + running) / 1000)
  }, [])

  const reset = useCallback(() => {
    acc.current = 0
    since.current = document.hidden ? null : Date.now()
  }, [])

  return { read, reset }
}

/** Giữ màn hình sáng khi đang "Tụng theo" (Screen Wake Lock API, nếu trình duyệt hỗ trợ). */
export function useWakeLock(enabled) {
  useEffect(() => {
    const api = typeof navigator !== 'undefined' ? navigator.wakeLock : undefined
    if (!enabled || !api?.request) return
    let lock = null
    let alive = true

    const acquire = () =>
      api
        .request('screen')
        .then((l) => {
          if (alive) lock = l
          else l.release()
        })
        // Bị từ chối (pin yếu, tab ẩn…) thì màn hình có thể tắt — không ảnh hưởng việc tụng
        .catch(() => {
          lock = null
        })

    // Khoá tự nhả khi tab bị ẩn → xin lại khi quay về
    const onVisibility = () => {
      if (!document.hidden && !lock) acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVisibility)
      lock?.release()
      lock = null
    }
  }, [enabled])
}

/**
 * Chế độ tập trung: phủ toàn trang, khoá cuộn nền, thử bật toàn màn hình thật.
 * Thoát bằng Esc, nút thoát, hoặc khi người dùng tự thoát toàn màn hình.
 */
export function useFocusMode() {
  const [focus, setFocus] = useState(false)

  const enter = useCallback(() => {
    setFocus(true)
    const el = document.documentElement
    if (!el.requestFullscreen || document.fullscreenElement) return
    // iOS Safari không cho toàn màn hình: vẫn giữ chế độ tập trung trong trang
    el.requestFullscreen().catch(() => setFocus(true))
  }, [])

  const exit = useCallback(() => setFocus(false), [])

  useEffect(() => {
    if (!focus) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    let wasFullscreen = Boolean(document.fullscreenElement)

    const onFullscreen = () => {
      if (document.fullscreenElement) wasFullscreen = true
      else if (wasFullscreen) setFocus(false)
    }
    const onKey = (e) => {
      // Để hộp thoại (Modal) tự xử lý Esc của nó
      if (e.key !== 'Escape' || document.querySelector('[role="dialog"][aria-modal="true"]:not([data-focus-root])')) return
      setFocus(false)
    }
    document.addEventListener('fullscreenchange', onFullscreen)
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('fullscreenchange', onFullscreen)
      document.removeEventListener('keydown', onKey)
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => setFocus(false))
      }
    }
  }, [focus])

  return { focus, enter, exit }
}

/** Đếm lại mỗi giây — dùng cho nhãn thời gian đang chạy. */
export function useTicker(intervalMs = 1000) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}
