import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Vector3 } from 'three'
import { runtime } from '../runtime'
import { getGame } from '../state'
import { clearFraction } from '../world/navigation'
import { groundSurface } from '../world/terrainGrid'
import { colliders } from '../interaction'
import { framedTarget, pickClearView } from './cameraPicker'
import { FP_PITCH_LIMIT, firstPersonActive, firstPersonView } from './firstPerson'

/**
 * Camera góc nhìn thứ ba bám theo nhân vật.
 * yaw = hướng camera nhìn (cùng quy ước với rotY nhân vật). Tự xoay dần ra sau lưng khi đi
 * nếu người chơi không chủ động xoay; tránh chui xuống đất.
 */
// Âm = camera hạ thấp, ngước nhìn lên (ngắm trời, mặt trời, tượng Phật Bà trên đỉnh)
const MIN_PITCH = -0.55
const MAX_PITCH = 1.25
const MIN_DIST = 2.8
const MAX_DIST = 16

export default function CameraRig() {
  const look = useRef(new Vector3())
  const desired = useRef(new Vector3())
  const idleLook = useRef(0)

  useFrame((state, rawDt) => {
    const { camera } = state
    const dt = Math.min(rawDt, 0.05)
    const cam = runtime.camera
    const input = runtime.input
    const p = runtime.player
    const { save, ui } = getGame()
    const { sensitivity = 1, invertY = false } = save.settings
    const fp = firstPersonActive(cam, ui.activity)

    // Tiêu thụ lượng xoay tích luỹ từ chuột/cảm ứng
    if (input.lookDX || input.lookDY) {
      cam.yaw -= input.lookDX * 0.005 * sensitivity
      cam.pitch += input.lookDY * 0.004 * sensitivity * (invertY ? -1 : 1)
      cam.pitch = fp ? MathUtils.clamp(cam.pitch, -FP_PITCH_LIMIT, FP_PITCH_LIMIT) : MathUtils.clamp(cam.pitch, MIN_PITCH, MAX_PITCH)
      input.lookDX = 0
      input.lookDY = 0
      idleLook.current = 0
      // Người chơi tự xoay → thôi tự canh góc theo hoạt động
      if (cam.frame) cam.frame.userRotated = true
    } else {
      idleLook.current += dt
    }
    if (input.zoomDelta && fp) input.zoomDelta = 0 // nhìn bằng mắt: không phóng to/thu nhỏ
    if (input.zoomDelta) {
      cam.distance = MathUtils.clamp(cam.distance + input.zoomDelta * 0.8, MIN_DIST, MAX_DIST)
      input.zoomDelta = 0
    }

    // Khi đang đi và một lúc không chạm camera: xoay nhẹ ra sau lưng nhân vật
    if (!fp && p.speed > 1 && idleLook.current > 1.2 && Math.abs(input.moveX) < 0.3) {
      let d = (p.rotY - cam.yaw) % (Math.PI * 2)
      if (d > Math.PI) d -= Math.PI * 2
      if (d < -Math.PI) d += Math.PI * 2
      cam.yaw += d * Math.min(1, dt * 0.8)
    }

    // Góc nhìn thứ nhất: camera ở mắt nhân vật, nhìn theo yaw/pitch
    if (fp) {
      const { eye, look: at } = firstPersonView({ x: p.position.x, y: p.position.y + p.jump.h, z: p.position.z }, cam.yaw, cam.pitch)
      camera.position.x = MathUtils.damp(camera.position.x, eye[0], 22, dt)
      camera.position.y = MathUtils.damp(camera.position.y, eye[1], 22, dt)
      camera.position.z = MathUtils.damp(camera.position.z, eye[2], 22, dt)
      // Điểm nhìn đặt cùng khoảng cách tới camera thật để không bị lệch khi camera còn đang bay tới mắt
      look.current.set(camera.position.x + at[0] - eye[0], camera.position.y + at[1] - eye[1], camera.position.z + at[2] - eye[2])
      camera.lookAt(look.current)
      return
    }
    // Vừa thoát góc nhìn thứ nhất (C, hoặc bắt đầu hoạt động) mà góc ngẩng còn ngoài giới hạn góc thứ ba
    cam.pitch = MathUtils.clamp(cam.pitch, MIN_PITCH, MAX_PITCH)

    // Khung hình hoạt động: khi vừa bấm E (nhân vật đã vào chỗ ~0.3 s), chọn MỘT LẦN góc camera không bị
    // mái/cột/cây… che (bắn tia vào cảnh thật), rồi xoay tới góc đó cho tới khi người chơi tự xoay
    const frame = cam.frame
    if (frame && !frame.resolved && !cam.focus) {
      frame.age = (frame.age ?? 0) + dt
      if (frame.age > 0.3) {
        let current = (cam.yaw - p.rotY) % (Math.PI * 2)
        if (current > Math.PI) current -= Math.PI * 2
        if (current < -Math.PI) current += Math.PI * 2
        // Đánh dấu trước: dù có lỗi bất ngờ cũng không chạy lại mỗi frame (không được làm đứng vòng lặp render)
        frame.resolved = true
        frame.userRotated = false
        try {
          const res = pickClearView(state.scene, {
            head: [p.position.x, p.position.y + 1.3, p.position.z],
            rotY: p.rotY,
            preferred: frame.yawOffset ?? current,
            pitch: cam.pitch,
            distance: frame.distance ?? cam.distance,
            side: frame.side,
            up: frame.up,
            camera,
          })
          frame.yawOffset = res.offset
          frame.distance = res.distance
          frame.clear = res.clear
        } catch (err) {
          console.warn('[camera] Không chọn được góc tránh vật cản, giữ góc hiện tại.', err)
          if (frame.yawOffset == null) frame.yawOffset = current
        }
      }
    }
    // Đã tới đúng góc mà bộ chọn xác nhận nhìn thông (theo hình khối thật) → không cần kéo camera theo khối va chạm thô
    let trusted = false
    if (frame && frame.yawOffset != null && !frame.userRotated) {
      let d = (p.rotY + frame.yawOffset - cam.yaw) % (Math.PI * 2)
      if (d > Math.PI) d -= Math.PI * 2
      if (d < -Math.PI) d += Math.PI * 2
      cam.yaw += d * Math.min(1, dt * 3)
      trusted = frame.resolved && frame.clear && Math.abs(d) < 0.12
    }

    // Cảnh quay đặc biệt (vd. thiền trên đỉnh): bay tới điểm focus
    const focus = cam.focus
    // Nhảy: camera nhích theo một phần độ cao để không giật cả khung hình
    const playerLook = [p.position.x, p.position.y + 1.35 + p.jump.h * 0.4, p.position.z]
    let target = focus?.target ?? playerLook
    // Dịch điểm nhìn sang phải/lên → nhân vật hiện lệch trái/xuống, không bị bảng che
    if (frame && !focus) target = framedTarget(target, cam.yaw, frame.side, frame.up)
    const dist = focus?.distance ?? frame?.distance ?? cam.distance
    const pitch = focus?.pitch ?? cam.pitch
    const yaw = focus?.yaw ?? cam.yaw

    const horiz = Math.cos(pitch) * dist
    desired.current.set(
      target[0] - Math.sin(yaw) * horiz,
      target[1] + Math.sin(pitch) * dist,
      target[2] - Math.cos(yaw) * horiz,
    )
    // Tường/đá chắn giữa nhân vật và camera → kéo camera lại gần (không áp dụng cho cảnh quay focus)
    let blocked = false
    if (!focus && !trusted) {
      const head = [p.position.x, p.position.y + 1.3, p.position.z]
      const d = desired.current
      const f = clearFraction(head, [d.x, d.y, d.z], colliders)
      if (f < 1) {
        blocked = true
        // Luôn cách nhân vật tối thiểu ~1.6 m để vẫn thấy được người (dù có vật chắn)
        const len = Math.hypot(d.x - head[0], d.y - head[1], d.z - head[2]) || 1
        const t = Math.max(Math.min(1, 1.6 / len), f)
        d.set(head[0] + (d.x - head[0]) * t, head[1] + (d.y - head[1]) * t, head[2] + (d.z - head[2]) * t)
        // Camera bị kéo sát lại → thu điểm ngắm về phía nhân vật tương ứng, kẻo nhân vật lọt ra ngoài khung hình
        if (frame) target = target.map((v, i) => playerLook[i] + (v - playerLook[i]) * t)
      }
    }

    // Không cho camera xuống dưới mặt đất
    // Bám đúng mặt lưới địa hình đang hiển thị (có lớp gồ ghề chi tiết)
    const ground = groundSurface(desired.current.x, desired.current.z) + 0.6
    if (desired.current.y < ground) desired.current.y = ground

    // Bị che thì bám nhanh để camera không kịp xuyên qua vật cản
    const k = focus ? 2.2 : blocked ? 24 : 9
    camera.position.x = MathUtils.damp(camera.position.x, desired.current.x, k, dt)
    camera.position.y = MathUtils.damp(camera.position.y, desired.current.y, k, dt)
    camera.position.z = MathUtils.damp(camera.position.z, desired.current.z, k, dt)
    look.current.set(
      MathUtils.damp(look.current.x, target[0], k * 1.4, dt),
      MathUtils.damp(look.current.y, target[1], k * 1.4, dt),
      MathUtils.damp(look.current.z, target[2], k * 1.4, dt),
    )
    camera.lookAt(look.current)
  })

  return null
}
