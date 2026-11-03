/**
 * Hình học của chuỗi hạt SVG: các hạt xếp đều trên một vòng tròn,
 * chừa khoảng trống ở đỉnh cho "hạt mẫu" (hạt lớn, nơi bắt đầu và kết thúc một chuỗi).
 */

export const BEAD_SIZES = [108, 54, 27, 21]
export const DEFAULT_BEAD_SIZE = 108

/** Kích thước khung SVG (viewBox vuông) — mọi toạ độ tính theo hệ này. */
export const VIEW = 400

export function isBeadSize(n) {
  return BEAD_SIZES.includes(n)
}

function polar(center, radius, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  // Làm tròn 2 chữ số để markup SVG gọn và ổn định giữa các lần render
  const round = (v) => Math.round(v * 100) / 100
  return { x: round(center + radius * Math.sin(rad)), y: round(center - radius * Math.cos(rad)) }
}

/**
 * @param size số hạt (108 | 54 | 27 | 21)
 * @returns {{ center, radius, beadR, guru: {x,y,r}, beads: [{x,y,angle}] }}
 *  angle tính bằng độ, 0 = đỉnh, tăng theo chiều kim đồng hồ.
 */
export function beadLayout(size, { view = VIEW, padding = 26 } = {}) {
  const n = Math.max(1, Math.round(size))
  const center = view / 2
  const radius = center - padding
  const spacing = (2 * Math.PI * radius) / (n + 2)
  const beadR = Math.min(13, spacing * 0.42)
  const guruR = Math.min(20, Math.max(beadR * 1.8, 10))
  // Góc từ đỉnh tới hạt đầu/cuối sao cho hạt mẫu (to hơn) không chạm hạt thường
  const clearance = Math.min(1, (guruR + beadR + 2) / (2 * radius))
  const start = (2 * Math.asin(clearance) * 180) / Math.PI
  const step = n > 1 ? (360 - 2 * start) / (n - 1) : 0
  const beads = []
  for (let i = 0; i < n; i++) {
    const angle = start + i * step
    beads.push({ ...polar(center, radius, angle), angle })
  }
  return { center, radius, beadR, guru: { ...polar(center, radius, 0), r: guruR }, beads }
}

/**
 * Trạng thái hiển thị của hạt thứ i khi đã lần `bead` hạt trong chuỗi hiện tại.
 * 'done' = đã lần qua, 'current' = hạt vừa lần (đang giữ trong tay), 'todo' = chưa tới.
 */
export function beadState(i, bead) {
  if (bead <= 0) return 'todo'
  if (i < bead - 1) return 'done'
  if (i === bead - 1) return 'current'
  return 'todo'
}
