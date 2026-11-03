import { useEffect, useRef } from 'react'
import { runtime } from './runtime'

/**
 * Sổ đăng ký điểm tương tác & vật cản — component trong thế giới tự đăng ký khi mount.
 */

/** id → { id, position:[x,y,z], radius, label, verb, onInteract, enabled } */
export const interactables = new Map()

/** Danh sách vật cản hiện hành (mảng phẳng, Player đọc mỗi frame) */
export const colliders = []
const colliderGroups = new Map()

function rebuildColliders() {
  colliders.length = 0
  for (const list of colliderGroups.values()) colliders.push(...list)
}

/**
 * Đăng ký vật cản. Toạ độ trong `list` là CỤC BỘ quanh `origin` (thường là origin của zone).
 * @param {string} key  khoá duy nhất cho nhóm
 * @param {Array} list  [{ type:'circle', x, z, r } | { type:'box', x, z, w, d, rot }]
 * @param {[number,number,number]} [origin]
 */
export function useColliders(key, list, origin = [0, 0, 0]) {
  useEffect(() => {
    const [ox, oy, oz] = origin
    colliderGroups.set(
      key,
      list.map((c) => ({ y0: oy, y1: oy + 6, ...c, x: c.x + ox, z: c.z + oz })),
    )
    rebuildColliders()
    return () => {
      colliderGroups.delete(key)
      rebuildColliders()
    }
    // origin/list là hằng số khai báo trong module zone; đổi key mới cần đăng ký lại
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}

/**
 * Đăng ký một điểm tương tác.
 * @param {{ id: string, position: [number,number,number], radius?: number, label: string, verb?: string, onInteract: () => void, enabled?: boolean }} def
 *   position: toạ độ THẾ GIỚI. label: tên vật (vd. "Lư hương"), verb: hành động (vd. "Thắp hương").
 */
export function useInteractable(def) {
  const ref = useRef(def)
  // Giữ định nghĩa mới nhất (label/verb/onInteract có thể đổi theo state) mà không đăng ký lại
  useEffect(() => {
    ref.current = def
  })
  const { id, enabled = true } = def
  useEffect(() => {
    if (!enabled) return
    const entry = {
      get id() {
        return ref.current.id
      },
      get position() {
        return ref.current.position
      },
      get radius() {
        return ref.current.radius ?? 2.2
      },
      get label() {
        return ref.current.label
      },
      get verb() {
        return ref.current.verb ?? 'Tương tác'
      },
      onInteract: () => ref.current.onInteract?.(),
    }
    interactables.set(id, entry)
    return () => {
      interactables.delete(id)
      if (runtime.nearestInteractable === id) runtime.nearestInteractable = null
    }
  }, [id, enabled])
}

/** Tìm điểm tương tác gần nhất trong tầm với, ưu tiên thứ ở phía trước mặt nhân vật */
export function findNearest(pos, rotY) {
  let best = null
  let bestScore = Infinity
  const fx = Math.sin(rotY)
  const fz = Math.cos(rotY)
  for (const it of interactables.values()) {
    const [x, y, z] = it.position
    if (Math.abs(y - pos.y) > 3) continue
    const dx = x - pos.x
    const dz = z - pos.z
    const d = Math.hypot(dx, dz)
    if (d > it.radius) continue
    const facing = d > 0.01 ? (dx * fx + dz * fz) / d : 1
    const score = d - facing * 0.6
    if (score < bestScore) {
      bestScore = score
      best = it
    }
  }
  return best
}

/** Kích hoạt điểm tương tác gần nhất (phím E / nút trên màn hình) */
export function interactNearest() {
  if (runtime.player.locked) return
  const it = runtime.nearestInteractable && interactables.get(runtime.nearestInteractable)
  it?.onInteract()
}
