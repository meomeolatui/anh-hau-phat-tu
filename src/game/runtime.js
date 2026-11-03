import { Vector3 } from 'three'
import { createJump } from './player/jump'

/**
 * Trạng thái "nóng" cập nhật mỗi khung hình (60 lần/giây) — để NGOÀI React để tránh re-render.
 * Component 3D đọc/ghi trực tiếp trong useFrame. UI React chỉ nhận thay đổi qua state.js / events.
 */
export const runtime = {
  player: {
    position: new Vector3(0, 0, 20),
    /** Góc quay quanh trục Y (radian): hướng nhìn = (sin rotY, cos rotY) trên mặt XZ; π = nhìn về -Z (về phía núi) */
    rotY: Math.PI,
    speed: 0,
    /** Hoạt ảnh hiện tại: idle | walk | run | sweep | pray | bow | sit | kneel | incense | bell | wave */
    anim: 'idle',
    /** Khoá di chuyển khi đang làm hoạt động (thắp hương, niệm Phật...) */
    locked: false,
    /** Đang cầm chổi quét lá */
    holding: null,
    /** Thể lực 0..100 (xem stamina.js); exhausted = kiệt sức, idleFor = số giây đứng yên */
    stamina: { value: 100, exhausted: false, idleFor: 0 },
    /** Đang ngồi ghế nghỉ chân (hồi thể lực nhanh) */
    resting: false,
    /** Mức mệt 0..1 cho nhịp thở khi anim = 'tired' */
    tiredness: 0,
    /** Chuyến cáp treo đang đi (xem ride.js) hoặc null */
    ride: null,
    /** Lực kéo dây chuông 0..1 khi anim = 'bell-pull' */
    bellPull: 0,
    /** Biểu cảm đang làm { anim, until } (net/online.js sendEmote) — di chuyển là huỷ */
    emote: null,
    /** Nhảy (Space): h = độ cao trên mặt đất, xem player/jump.js */
    jump: createJump(),
  },
  camera: {
    yaw: Math.PI, // góc ngang quanh nhân vật
    pitch: 0.38, // góc ngẩng (radian)
    distance: 7.5,
    /** Nếu khác null: camera bay tới điểm này (cảnh quay đặc biệt, vd. thiền trên đỉnh) */
    focus: null,
    /**
     * Khung hình khi đang làm hoạt động (Hud đặt/huỷ): dịch điểm nhìn để nhân vật nằm ở vùng
     * không bị bảng che, và (tuỳ chọn) xoay góc nghiêng để thấy rõ động tác.
     * { side: m dịch sang phải màn hình, up: m dịch lên, yawOffset?: rad so với hướng nhân vật, distance?: m, userRotated: bool }
     */
    frame: null,
    /** Góc nhìn thứ nhất (phím C, xem player/firstPerson.js); thirdPersonPitch = góc ngẩng cũ để trả lại */
    firstPerson: false,
    thirdPersonPitch: null,
  },
  input: {
    /** Vector di chuyển từ bàn phím/joystick, đã chuẩn hoá trong [-1,1] */
    moveX: 0,
    moveZ: 0,
    run: false,
    /** Lượng xoay camera tích luỹ từ chuột/cảm ứng, được CameraRig tiêu thụ mỗi frame */
    lookDX: 0,
    lookDY: 0,
    zoomDelta: 0,
    /** Vừa bấm nhảy (Space / nút nhảy) — Player tiêu thụ */
    jump: false,
  },
  /** Tương tác gần nhất trong tầm với (id) — Player cập nhật, HUD đọc qua state.ui.prompt */
  nearestInteractable: null,
  /** Khu vực hiện tại (id zone trong layout) */
  zoneId: null,
}

/* ---------- Event bus nhỏ: phản hồi tức thời (công đức nổi, âm thanh, rung camera...) ---------- */

const handlers = new Map()

/** Đăng ký sự kiện; trả về hàm huỷ. */
export function on(type, fn) {
  if (!handlers.has(type)) handlers.set(type, new Set())
  handlers.get(type).add(fn)
  return () => handlers.get(type)?.delete(fn)
}

/**
 * Các sự kiện đang dùng:
 *  'merit'    { amount, label, position?: [x,y,z] }  — hiện chữ "+N công đức"
 *  'toast'    { title, description?, tone? }
 *  'teleport' { position: [x,y,z], rotY? }          — dịch chuyển nhân vật (cáp treo, hồi sinh)
 *  'zone'     { id, name }                          — vừa bước vào khu vực mới
 */
export function emit(type, payload) {
  handlers.get(type)?.forEach((fn) => fn(payload))
}

export function setPlayerAnim(anim) {
  runtime.player.anim = anim
}

export function lockPlayer(locked, anim) {
  runtime.player.locked = locked
  if (anim) runtime.player.anim = anim
  if (locked) {
    runtime.input.moveX = 0
    runtime.input.moveZ = 0
  }
}

/** Chọn lại góc camera không bị che cho hoạt động đang mở (phím E / nút "Đổi góc nhìn") */
export function refreshActivityView() {
  const f = runtime.camera.frame
  if (!f) return
  f.resolved = false
  f.age = 1
  f.userRotated = false
  // Thử từ góc hiện tại sang các góc khác
  f.yawOffset = null
}

/** Xoay nhân vật nhìn về điểm (x, z). */
export function facePoint(x, z) {
  const p = runtime.player.position
  runtime.player.rotY = Math.atan2(x - p.x, z - p.z)
}
