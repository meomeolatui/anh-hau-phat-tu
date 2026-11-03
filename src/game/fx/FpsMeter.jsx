import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * Chỉ báo FPS nhỏ (bật khi URL có ?fps) — đặt TRONG <Canvas>. Ghi thẳng vào một thẻ DOM,
 * không gây render lại React. Hiện fps trung bình, khung chậm nhất (ms) trong 0,5 giây, trạng thái hậu kỳ.
 */
export default function FpsMeter({ fx }) {
  const el = useRef(null)
  const acc = useRef({ frames: 0, t: 0, worst: 0 })
  useEffect(() => {
    const d = document.createElement('div')
    d.style.cssText =
      'position:fixed;left:50%;top:4px;transform:translateX(-50%);z-index:9999;font:12px/1.3 ui-monospace,monospace;' +
      'color:#fff;background:rgba(0,0,0,.55);padding:2px 8px;border-radius:6px;pointer-events:none'
    document.body.appendChild(d)
    el.current = d
    return () => d.remove()
  }, [])
  useFrame((state, dt) => {
    const a = acc.current
    a.frames++
    a.t += dt
    a.worst = Math.max(a.worst, dt)
    if (a.t < 0.5 || !el.current) return
    el.current.textContent = `${Math.round(a.frames / a.t)} fps · max ${(a.worst * 1000).toFixed(0)} ms · dpr ${state.gl.getPixelRatio().toFixed(2)} · FX ${fx ? 'bật' : 'tắt'}`
    a.frames = 0
    a.t = 0
    a.worst = 0
  })
  return null
}
