import { useEffect, useRef } from 'react'

const TYPING_TAGS = ['INPUT', 'TEXTAREA', 'SELECT']

/**
 * Phím tắt cho overlay hoạt động (lắng nghe trên window).
 * Bỏ qua khi đang gõ chữ; bỏ qua Space/Enter khi tiêu điểm đang ở một nút
 * (trình duyệt tự "bấm" nút đó — tránh tính hai lần).
 * @param {(e: KeyboardEvent, type: 'down'|'up') => void} handler
 */
export function useActivityKeys(handler) {
  const ref = useRef(handler)
  useEffect(() => {
    ref.current = handler
  })
  useEffect(() => {
    const skip = (e) => {
      const t = e.target
      if (TYPING_TAGS.includes(t?.tagName) || t?.isContentEditable) return true
      return (e.code === 'Space' || e.code === 'Enter') && t?.tagName === 'BUTTON'
    }
    const down = (e) => !skip(e) && ref.current?.(e, 'down')
    const up = (e) => !skip(e) && ref.current?.(e, 'up')
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])
}
