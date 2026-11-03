import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { runtime } from '../runtime'

/**
 * "Phòng thử đồ": khi mở sạp y phục, làm mờ & tối nhẹ toàn cảnh, chỉ chừa vùng elip quanh nhân vật sắc nét.
 *  - FittingFocus (trong Canvas): mỗi frame chiếu đầu & chân nhân vật ra màn hình, ghi vào biến CSS của lớp phủ.
 *  - FittingBlur (DOM, nằm giữa canvas và HUD): lớp backdrop-filter blur có mặt nạ elip theo các biến đó.
 * Dùng CSS nên chạy được ở mọi mức chất lượng (kể cả khi tắt hậu kỳ) và không phải biên dịch lại shader.
 */

export const FITTING_LAYER_ID = 'lop-thu-do'

const head = new Vector3()
const feet = new Vector3()

export function FittingFocus({ active }) {
  const el = useRef(null)
  useFrame(({ camera, size }) => {
    if (!active) return
    if (!el.current?.isConnected) el.current = document.getElementById(FITTING_LAYER_ID)
    const layer = el.current
    if (!layer) return
    const p = runtime.player.position
    head.set(p.x, p.y + 1.85, p.z).project(camera)
    feet.set(p.x, p.y - 0.05, p.z).project(camera)
    const hx = (head.x * 0.5 + 0.5) * size.width
    const hy = (-head.y * 0.5 + 0.5) * size.height
    const fy = (-feet.y * 0.5 + 0.5) * size.height
    const tall = Math.max(60, fy - hy)
    layer.style.setProperty('--fx', `${hx.toFixed(1)}px`)
    layer.style.setProperty('--fy', `${((hy + fy) / 2).toFixed(1)}px`)
    layer.style.setProperty('--rx', `${(tall * 0.5).toFixed(1)}px`)
    layer.style.setProperty('--ry', `${(tall * 0.72).toFixed(1)}px`)
  })
  return null
}
