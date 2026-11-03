import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Chế độ tập trung: thử Fullscreen API trên phần tử; nếu trình duyệt không hỗ trợ
 * (vd. Safari iOS) thì vẫn bật chế độ "phủ toàn màn hình" bằng CSS, ẩn thanh điều hướng.
 */
export function useFocusMode(targetRef) {
  const [active, setActive] = useState(false)
  const usingFullscreen = useRef(false)

  const enter = useCallback(async () => {
    setActive(true)
    const el = targetRef.current
    if (!el?.requestFullscreen || !document.fullscreenEnabled) return
    try {
      await el.requestFullscreen({ navigationUI: 'hide' })
      usingFullscreen.current = true
    } catch {
      // Bị từ chối (iframe, quyền) → giữ chế độ phủ CSS đã bật ở trên
      usingFullscreen.current = false
    }
  }, [targetRef])

  const exit = useCallback(() => {
    setActive(false)
    if (!usingFullscreen.current || !document.fullscreenElement) return
    usingFullscreen.current = false
    document.exitFullscreen?.().catch(() => {
      // Trình duyệt đã tự thoát toàn màn hình — trạng thái đã đúng
    })
  }, [])

  useEffect(() => {
    const onChange = () => {
      // Người dùng thoát toàn màn hình bằng Esc/cử chỉ hệ thống → tắt luôn chế độ tập trung
      if (!document.fullscreenElement && usingFullscreen.current) {
        usingFullscreen.current = false
        setActive(false)
      }
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    if (!active) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') exit()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [active, exit])

  // Rời trang khi đang toàn màn hình → trả lại trạng thái bình thường
  useEffect(
    () => () => {
      if (!usingFullscreen.current || !document.fullscreenElement) return
      document.exitFullscreen?.().catch(() => {
        // Đã thoát sẵn — không cần làm gì thêm
      })
    },
    [],
  )

  return { active, enter, exit }
}

/**
 * Giữ màn hình sáng khi đang niệm theo nhịp hoặc ở chế độ tập trung (Screen Wake Lock API).
 * Không hỗ trợ thì bỏ qua — việc đếm không phụ thuộc vào tính năng này.
 */
export function useWakeLock(enabled) {
  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.wakeLock) return undefined
    let lock = null
    let cancelled = false
    const request = () => {
      navigator.wakeLock
        .request('screen')
        .then((l) => {
          if (cancelled) l.release()
          else lock = l
        })
        .catch(() => {
          // Pin yếu hoặc trình duyệt từ chối — màn hình sẽ tắt theo cài đặt hệ thống
          lock = null
        })
    }
    // Wake lock tự nhả khi tab bị ẩn → xin lại khi người dùng quay về
    const onVisible = () => {
      if (document.visibilityState === 'visible') request()
    }
    request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release()
    }
  }, [enabled])
}
