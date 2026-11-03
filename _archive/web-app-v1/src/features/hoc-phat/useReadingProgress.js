import { useEffect, useState } from 'react'
import { activeSectionIndex, readingProgress } from './learning'

/**
 * Theo dõi tiến độ đọc và mục đang đọc theo vị trí cuộn của cửa sổ.
 * Dùng requestAnimationFrame để mỗi khung hình chỉ tính một lần — cuộn mượt trên máy yếu.
 */
export default function useReadingProgress(articleRef, sectionIds) {
  const [state, setState] = useState({ progress: 0, active: 0 })
  const idsKey = sectionIds.join('|')

  useEffect(() => {
    const ids = idsKey ? idsKey.split('|') : []
    let frame = 0

    const measure = () => {
      frame = 0
      const el = articleRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const progress = readingProgress({ top: rect.top, height: rect.height, viewport: window.innerHeight })
      const tops = ids.map((id) => document.getElementById(id)?.getBoundingClientRect().top ?? Infinity)
      const active = activeSectionIndex(tops, window.innerHeight * 0.3)
      setState((prev) => (prev.progress === progress && prev.active === active ? prev : { progress, active }))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [articleRef, idsKey])

  return state
}
