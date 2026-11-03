import { useEffect } from 'react'
import { refreshActivityView, runtime } from '../runtime'
import { interactNearest } from '../interaction'
import { endActivity, getGame, openPanel, updateUi } from '../state'
import { toggleFirstPerson } from '../player/firstPerson'
import { isOnline } from '../../net/online'

/**
 * Bàn phím + chuột cho máy tính:
 *  WASD / mũi tên: đi · Shift: chạy · Space: nhảy · E / Enter: tương tác
 *  Kéo chuột: xoay camera · Lăn chuột: phóng to/thu nhỏ · C: góc nhìn thứ nhất/thứ ba · Q: nhiệm vụ · Esc: menu
 *  T: chat (online) · G: biểu cảm
 */
const KEYS = { forward: ['KeyW', 'ArrowUp'], back: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'] }

export function useKeyboard(targetRef) {
  useEffect(() => {
    const down = new Set()
    const update = () => {
      const f = KEYS.forward.some((k) => down.has(k)) ? 1 : 0
      const b = KEYS.back.some((k) => down.has(k)) ? 1 : 0
      const l = KEYS.left.some((k) => down.has(k)) ? 1 : 0
      const r = KEYS.right.some((k) => down.has(k)) ? 1 : 0
      runtime.input.moveX = r - l
      runtime.input.moveZ = f - b
      runtime.input.run = down.has('ShiftLeft') || down.has('ShiftRight')
    }
    const isTyping = (e) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) || e.target?.isContentEditable

    const onDown = (e) => {
      if (isTyping(e)) return
      const { ui } = getGame()
      if (e.code === 'Escape' && (ui.chat || ui.emotes)) {
        updateUi({ chat: false, emotes: false })
        return
      }
      if (e.code === 'Escape') {
        // Esc: đóng hoạt động đang mở → đóng bảng → mở menu
        if (ui.activity) endActivity()
        else openPanel(ui.panel ? null : 'menu')
        return
      }
      // Đang làm hoạt động: E = chọn lại góc camera không bị che
      if (ui.activity && e.code === 'KeyE') {
        refreshActivityView()
        return
      }
      // Khi đang mở hoạt động/bảng, phím thuộc về UI đó
      if (ui.activity || ui.panel) return
      if (e.code === 'KeyT' && isOnline()) {
        e.preventDefault() // không để chữ "t" lọt vào ô chat vừa mở
        updateUi({ chat: true, emotes: false })
        return
      }
      if (e.code === 'KeyG' && !e.repeat) {
        updateUi({ emotes: !ui.emotes })
        return
      }
      if (e.code === 'KeyC' && !e.repeat) {
        toggleFirstPerson()
        return
      }
      if (e.code === 'KeyE' || e.code === 'Enter') {
        e.preventDefault()
        interactNearest()
        return
      }
      if (e.code === 'KeyQ') {
        openPanel('quests')
        return
      }
      if (e.code === 'KeyM') {
        openPanel('map')
        return
      }
      if (e.code === 'Space') {
        e.preventDefault()
        if (!e.repeat) runtime.input.jump = true
        return
      }
      if (e.code.startsWith('Arrow')) e.preventDefault()
      down.add(e.code)
      update()
    }
    const onUp = (e) => {
      down.delete(e.code)
      update()
    }
    const onBlur = () => {
      down.clear()
      update()
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  // Kéo chuột để xoay camera, lăn để zoom (chỉ trên vùng canvas)
  useEffect(() => {
    const el = targetRef.current
    if (!el) return
    let dragging = false
    let lastX = 0
    let lastY = 0
    const onDown = (e) => {
      if (e.pointerType !== 'mouse') return
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
    }
    const onMove = (e) => {
      // Đã khoá chuột vào khung hình thì usePointerLock lo việc xoay camera
      if (!dragging || document.pointerLockElement) return
      runtime.input.lookDX += e.clientX - lastX
      runtime.input.lookDY += e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
    }
    const onUp = () => {
      dragging = false
    }
    const onWheel = (e) => {
      runtime.input.zoomDelta += Math.sign(e.deltaY)
    }
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    el.addEventListener('wheel', onWheel, { passive: true })
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [targetRef])
}
