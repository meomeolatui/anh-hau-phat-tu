import { useEffect, useRef, useState } from 'react'
import { runtime } from '../runtime'
import { getGame, openPanel, useGame } from '../state'

/**
 * Khoá chuột vào khung hình (Pointer Lock) cho máy tính: con trỏ ẩn đi, di chuột là xoay camera ngay,
 * không cần giữ & kéo. Bật từ lúc vào game (cú bấm "Tiếp tục hành hương" còn hiệu lực là thao tác người dùng).
 *
 *  - Mở hoạt động / bảng (menu, bản đồ…) → nhả chuột để bấm giao diện; đóng lại → khoá lại.
 *  - Esc khi đang khoá: trình duyệt nhả chuột và nuốt phím → ta mở Menu (tạm dừng) như các game khác.
 *  - Alt+Tab / chuyển cửa sổ: nhả chuột để con trỏ hiện ra, KHÔNG mở Menu; quay lại bấm vào khung hình để khoá.
 *  - Chuột trái khi đang khoá → hiện con trỏ (để bấm nút HUD); bấm vào khung hình lần nữa → khoá lại.
 *  - Trình duyệt từ chối (hết hiệu lực thao tác, vừa nhả chưa lâu…) → bấm vào khung hình để khoá lại.
 *  - Thiết bị cảm ứng hoặc tắt trong cài đặt (settings.mouseLock) → không dùng.
 *
 * @returns {{ supported: boolean, locked: boolean }} để hiện gợi ý "Bấm vào khung hình…"
 */
export function usePointerLock(targetRef) {
  const enabled = useGame((s) => s.save.settings.mouseLock ?? true)
  const activity = useGame((s) => s.ui.activity)
  const panel = useGame((s) => s.ui.panel)
  // Ô chat, bảng biểu cảm cần chuột để bấm
  const overlay = useGame((s) => s.ui.chat || s.ui.emotes)
  const [supported] = useState(
    () => typeof document !== 'undefined' && 'pointerLockElement' in document && !matchMedia('(pointer: coarse)').matches,
  )
  const [locked, setLocked] = useState(false)
  const releasing = useRef(false)
  const free = !activity && !panel && !overlay
  const want = supported && enabled && free

  const request = () => {
    const el = targetRef.current
    if (!el || document.pointerLockElement === el) return
    try {
      // Bản mới trả về Promise (có thể bị từ chối) — bỏ qua lỗi, đã có gợi ý bấm để khoá
      el.requestPointerLock()?.catch?.(() => {})
    } catch {
      // Trình duyệt cũ ném lỗi đồng bộ khi chưa có thao tác người dùng — như trên
    }
  }

  // Theo dõi trạng thái khoá; tự nhả (Esc) khi đang chơi tự do → mở Menu
  useEffect(() => {
    const el = targetRef.current
    if (!supported || !el) return
    const onChange = () => {
      const now = document.pointerLockElement === el
      setLocked(now)
      // Nhả do Esc (cửa sổ vẫn đang được chọn) → Menu; nhả do Alt+Tab / chuyển cửa sổ → chỉ hiện chuột
      if (!now && !releasing.current && document.hasFocus() && !document.hidden) {
        const { ui } = getGame()
        if (!ui.activity && !ui.panel && !ui.chat && !ui.emotes && ui.screen === 'game') openPanel('menu')
      }
      releasing.current = false
    }
    // Di chuột khi đã khoá: dùng độ dời thô làm lượng xoay camera
    const onMove = (e) => {
      if (document.pointerLockElement !== el) return
      runtime.input.lookDX += e.movementX
      runtime.input.lookDY += e.movementY
    }
    // Alt+Tab: chủ động nhả chuột (phòng trình duyệt không tự nhả) để con trỏ hiện ở cửa sổ khác
    const onBlur = () => {
      if (document.pointerLockElement !== el) return
      releasing.current = true
      document.exitPointerLock()
    }
    document.addEventListener('pointerlockchange', onChange)
    document.addEventListener('mousemove', onMove)
    window.addEventListener('blur', onBlur)
    return () => {
      document.removeEventListener('pointerlockchange', onChange)
      document.removeEventListener('mousemove', onMove)
      window.removeEventListener('blur', onBlur)
      if (document.pointerLockElement === el) {
        releasing.current = true
        document.exitPointerLock()
      }
    }
  }, [supported, targetRef])

  // Khoá khi được phép, nhả khi mở giao diện / tắt tuỳ chọn
  useEffect(() => {
    if (!supported) return
    if (want) request()
    else if (document.pointerLockElement === targetRef.current) {
      releasing.current = true
      document.exitPointerLock()
    }
    // request chỉ đọc ref — không cần là phụ thuộc
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [want, supported])

  // Chuột trái bật/tắt: đang khoá → bấm là hiện con trỏ (không mở Menu); đang hiện → bấm vào khung hình là khoá lại.
  // Xét trạng thái ngay lúc nhấn nên cú bấm vừa khoá không tự nhả lại.
  useEffect(() => {
    const el = targetRef.current
    if (!el || !want) return
    const onDown = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      if (document.pointerLockElement === el) {
        releasing.current = true
        document.exitPointerLock()
        return
      }
      // Bấm trên nút/giao diện HUD thì để nút xử lý
      if (e.target instanceof Element && e.target.closest('button, a, input, select, textarea, [role=dialog], iframe')) return
      request()
    }
    el.addEventListener('pointerdown', onDown)
    return () => el.removeEventListener('pointerdown', onDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [want, targetRef])

  return { supported: supported && enabled, locked }
}
