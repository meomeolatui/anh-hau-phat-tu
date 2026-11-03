/** Hàm tạo danh sách vật cản cho các công trình trong architecture.jsx (toạ độ cục bộ của zone) */

/**
 * Vật cản cho Hall (toạ độ cục bộ của hall + vị trí/quay của hall) — truyền vào useColliders.
 * Chặn tường sau, hai tường bên và các cột; mặt tiền để trống cho người chơi đi vào.
 */
export function hallColliders({ w = 12, d = 9, open = true, x = 0, z = 0, rot = 0 }) {
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  const at = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]
  const list = []
  const [bx, bz] = at(0, -d / 2 + 0.15)
  list.push({ type: 'box', x: bx, z: bz, w: w, d: 0.5, rot })
  for (const sgn of [-1, 1]) {
    const [sx, sz] = at(sgn * (w / 2 - 0.25), -0.6)
    list.push({ type: 'box', x: sx, z: sz, w: 0.5, d: d - 1.4, rot })
  }
  if (!open) {
    const [fx, fz] = at(0, d / 2 - 1.3)
    list.push({ type: 'box', x: fx, z: fz, w: w, d: 0.5, rot })
  }
  const cols = Math.max(2, Math.round(w / 3))
  for (let i = 0; i <= cols; i++) {
    const [px, pz] = at(-w / 2 + 0.5 + (i * (w - 1)) / cols, d / 2 - 0.35)
    list.push({ type: 'circle', x: px, z: pz, r: 0.25 })
  }
  return list
}

/** Vật cản cho cổng tam quan (4 trụ) */
export function gateColliders({ w = 10, x = 0, z = 0 }) {
  return [-w / 2, -w / 6, w / 6, w / 2].map((px) => ({ type: 'box', x: x + px, z, w: 0.9, d: 1, rot: 0 }))
}
