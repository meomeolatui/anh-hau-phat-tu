import { BackSide, Raycaster, Vector3 } from 'three'

/**
 * Chọn góc camera KHÔNG BỊ CHE khi bắt đầu một hoạt động (bấm E):
 * thử nhiều góc quanh nhân vật, bắn tia từ đầu nhân vật tới vị trí camera dự kiến, kiểm tra va chạm
 * với mọi vật thể thật trong cảnh (mái, cột, gác chuông, cây, tượng, sườn núi…).
 * Chạy MỘT lần mỗi hoạt động (không chạy mỗi frame).
 */

/** Tên nhóm chứa nhân vật người chơi (bỏ qua khi bắn tia) */
export const PLAYER_GROUP = 'nhan-vat'

/** Các góc thử (so với góc ưu tiên), theo thứ tự ưu tiên */
export function candidateOffsets(preferred) {
  const base = preferred ?? 0
  const list = [base, -base, base * 0.5, -base * 0.5, Math.PI * 0.3, -Math.PI * 0.3, Math.PI * 0.75, -Math.PI * 0.75, 0.12, -0.12, Math.PI]
  // Bỏ trùng (vd. base = 0)
  return list.filter((v, i) => list.findIndex((w) => Math.abs(w - v) < 1e-3) === i)
}

/** Vị trí camera theo góc yaw/pitch/khoảng cách quanh điểm ngắm (cùng công thức với CameraRig) */
export function cameraPosition(target, yaw, pitch, dist) {
  const horiz = Math.cos(pitch) * dist
  return [target[0] - Math.sin(yaw) * horiz, target[1] + Math.sin(pitch) * dist, target[2] - Math.cos(yaw) * horiz]
}

/** Vật thể không tính là "che": chính nhân vật, đồ trong suốt (kính, khói, sương), bầu trời, điểm/sprite */
function ignorable(obj) {
  for (let o = obj; o; o = o.parent) {
    if (o.name === PLAYER_GROUP || o.userData?.noCameraBlock) return true
  }
  if (obj.isPoints || obj.isSprite || obj.isLine) return true
  const m = obj.material
  if (!m || Array.isArray(m)) return false
  if (m.side === BackSide) return true // vòm trời
  if (m.transparent && (m.opacity ?? 1) < 0.6) return true
  return obj.visible === false
}

/**
 * Gom các mesh có thể che (bỏ nhân vật, sprite/điểm/đường — sprite cần camera để bắn tia và hay ném lỗi,
 * lại toàn là sương/quầng sáng trong suốt). Gom một lần cho cả lượt chọn góc.
 */
export function blockerList(scene) {
  const list = []
  const walk = (o) => {
    if (o.visible === false || o.name === PLAYER_GROUP || o.userData?.noCameraBlock) return
    if (o.isMesh && !o.isSprite && !ignorable(o)) list.push(o)
    for (const c of o.children) walk(c)
  }
  walk(scene)
  return list
}

const ray = new Raycaster()
const from = new Vector3()
const dir = new Vector3()

/** Khoảng cách tới vật che đầu tiên trên đoạn head→cam (Infinity nếu thông); blockers từ blockerList */
export function firstHit(blockers, head, cam, camera3d = null) {
  from.set(...head)
  dir.set(cam[0] - head[0], cam[1] - head[1], cam[2] - head[2])
  const len = dir.length()
  if (len < 1e-3) return Infinity
  dir.divideScalar(len)
  ray.set(from, dir)
  ray.camera = camera3d
  ray.near = 0.45 // bỏ qua đoạn sát người
  ray.far = len
  const hits = ray.intersectObjects(blockers, false)
  return hits.length ? hits[0].distance : Infinity
}

/** Điểm ngắm của khung hình hoạt động: dời sang phải (theo hướng camera) một đoạn side, lên một đoạn up */
export function framedTarget(head, yaw, side = 0, up = 0) {
  return [head[0] - Math.cos(yaw) * side, head[1] + up, head[2] + Math.sin(yaw) * side]
}

/**
 * side/up: độ dời điểm ngắm giống CameraRig — kiểm tra đúng vị trí camera sẽ đứng.
 * @returns {{ offset: number, distance: number, clear: boolean }} góc (so với hướng nhân vật), khoảng cách,
 *   và clear = nhìn thông hoàn toàn (CameraRig khi đó tin kết quả này, không kéo camera lại theo khối va chạm thô)
 */
export function pickClearView(scene, { head, rotY, preferred, pitch, distance, side = 0, up = 0, camera = null }) {
  const blockers = blockerList(scene)
  let best = { offset: preferred ?? 0, distance, hit: -1 }
  for (const off of candidateOffsets(preferred)) {
    const yaw = rotY + off
    const cam = cameraPosition(framedTarget(head, yaw, side, up), yaw, pitch, distance)
    const hit = firstHit(blockers, head, cam, camera)
    if (hit === Infinity) return { offset: off, distance, clear: true }
    if (hit > best.hit) best = { offset: off, distance: Math.max(1.6, hit - 0.35), hit }
  }
  return { offset: best.offset, distance: best.distance, clear: false }
}
