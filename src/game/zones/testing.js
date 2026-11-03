import { BENCHES } from '../world/benches'
import { STELES } from '../world/steles'

/**
 * Tiện ích cho test bố cục các zone (thuần JS; app không import file này).
 * Ghế nghỉ (world/benches.js) và bia (world/steles.js) do World.jsx đặt — zone phải chừa chỗ cho chúng.
 */

/** Vật cản của ghế nghỉ (toạ độ thế giới) — giống RestBench: box 1.9 × 0.6, hiệu lực [y, y + 6] */
export function benchColliders() {
  return BENCHES.map((b) => ({ type: 'box', x: b.position[0], z: b.position[2], w: 1.9, d: 0.6, rot: b.rotY, y0: b.position[1], y1: b.position[1] + 6 }))
}

/** Điểm cần chừa quanh ghế & bia (toạ độ thế giới): tâm ghế, điểm đứng dậy 0.9 m phía trước, chân bia */
export function worldKeepOut() {
  return [
    ...BENCHES.flatMap((b) => {
      const [x, y, z] = b.position
      return [
        { id: `ghe:${b.id}`, x, y, z },
        { id: `ghe-dung:${b.id}`, x: x + Math.sin(b.rotY) * 0.9, y, z: z + Math.cos(b.rotY) * 0.9 },
      ]
    }),
    ...STELES.map((s) => ({ id: `bia:${s.id}`, x: s.position[0], y: s.position[1], z: s.position[2] })),
  ]
}
