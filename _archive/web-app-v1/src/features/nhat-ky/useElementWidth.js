import { useEffect, useRef, useState } from 'react'

/**
 * Theo dõi bề rộng thật của phần tử để vẽ SVG đúng kích thước điểm ảnh —
 * nếu chỉ co giãn viewBox thì chữ trên trục sẽ nhỏ xíu trên điện thoại.
 */
export function useElementWidth(fallback = 600) {
  const ref = useRef(null)
  const [width, setWidth] = useState(fallback)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const w = Math.round(el.getBoundingClientRect().width)
      if (w > 0) setWidth(w)
    }
    measure()
    // jsdom và trình duyệt rất cũ không có ResizeObserver → giữ bề rộng đo lần đầu
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return [ref, width]
}
