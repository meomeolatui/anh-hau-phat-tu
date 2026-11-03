import { useCallback, useEffect, useRef, useState } from 'react'
import { addNiem, recordSession } from '../../lib/actions'
import { createSession, drainPending, isStale, resetChain, resizeChain, sessionSeconds, stepSession } from './session'
import { clearSession, loadSession, saveSession } from './storage'

export const FLUSH_INTERVAL_MS = 2000

/**
 * Quản lý phiên lần hạt và đảm bảo KHÔNG mất số đếm:
 * - Mỗi hạt được lưu ngay vào key nhỏ của phiên (khôi phục khi tải lại trang).
 * - Số câu gom lại rồi ghi vào nhật ký ngày (addNiem) mỗi ~2 giây, khi tròn chuỗi,
 *   khi ẩn trang / rời trang và khi rời khỏi màn hình niệm Phật.
 *
 * `ref.current` là nguồn sự thật (đồng bộ, dùng được trong cleanup), state chỉ để render.
 */
export function useNiemSession({ size, mantra, onRound, onRestore }) {
  const [session, setSession] = useState(() => loadSession(size))
  const ref = useRef(session)
  const cb = useRef({ onRound, onRestore, mantra, size })

  useEffect(() => {
    cb.current = { onRound, onRestore, mantra, size }
  })

  const commit = useCallback((next) => {
    if (next === ref.current) return
    ref.current = next
    saveSession(next)
    setSession(next)
  }, [])

  const flush = useCallback(() => {
    const { amount, session: next } = drainPending(ref.current)
    if (!amount) return 0
    addNiem(amount)
    commit(next)
    return amount
  }, [commit])

  // Khôi phục phiên đang dở. Dùng ref nên chạy hai lần (StrictMode) vẫn không ghi trùng.
  const restored = useRef(false)
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    // Lần trước tắt đột ngột còn số chưa ghi → ghi bù ngay
    flush()
    const s = ref.current
    if (!s.total) return
    if (isStale(s)) {
      recordSession({
        type: 'niem',
        count: s.total,
        duration: sessionSeconds(s),
        ref: cb.current.mantra,
        at: new Date(s.startedAt ?? s.lastAt),
        addToDay: false,
      })
      clearSession()
      commit(createSession())
      cb.current.onRestore?.({ kind: 'archived', total: s.total })
      return
    }
    cb.current.onRestore?.({ kind: 'resumed', total: s.total })
  }, [flush, commit])

  // Ghi định kỳ + khi trang bị ẩn/đóng + khi rời màn hình
  useEffect(() => {
    const timer = setInterval(flush, FLUSH_INTERVAL_MS)
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush])

  // Đổi số hạt giữa chừng
  useEffect(() => {
    commit(resizeChain(ref.current, size))
  }, [size, commit])

  /** Lần một hạt. Trả về true nếu vừa tròn chuỗi. */
  const tap = useCallback(() => {
    const { session: next, completed } = stepSession(ref.current, cb.current.size)
    commit(next)
    if (!completed) return false
    flush()
    cb.current.onRound?.(ref.current)
    return true
  }, [commit, flush])

  const resetBeads = useCallback(() => commit(resetChain(ref.current)), [commit])

  /** Kết thúc phiên: ghi lịch sử (số câu đã cộng vào ngày qua addNiem nên addToDay=false). */
  const endSession = useCallback(() => {
    flush()
    const s = ref.current
    if (!s.total) return null
    const duration = sessionSeconds(s)
    recordSession({ type: 'niem', count: s.total, duration, ref: cb.current.mantra, addToDay: false })
    clearSession()
    ref.current = createSession()
    setSession(ref.current)
    return { count: s.total, duration, rounds: s.rounds }
  }, [flush])

  return { session, tap, resetBeads, endSession, flush }
}
