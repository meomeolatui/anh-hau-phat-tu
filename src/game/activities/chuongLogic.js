/**
 * Logic thuần cho Thỉnh chuông: thanh lực (giữ để lấy đà) và con lắc chày gỗ (BellSpot dùng để diễn hoạt).
 */

/** Mỗi lần thỉnh tối đa 3 tiếng */
export const MAX_STRIKES = 3
/** Công đức thỉnh chuông chỉ cộng lại sau 2 phút cho mỗi gác chuông */
export const BELL_COOLDOWN = 2 * 60 * 1000
export const BELL_MERIT = 10
/** Đợi tiếng chuông ngân bớt rồi mới thỉnh tiếng kế */
export const STRIKE_GAP_MS = 2400
/** Thời gian thanh lực đầy một lượt (giữ lâu hơn thì lực lùi lại — đà quá tay) */
export const FILL_MS = 1500
/** Vùng lực đẹp — chày chạm chuông vừa tay, tiếng ngân tròn */
export const SWEET = [0.5, 0.78]

/** Lực (0..1) theo thời gian giữ: tăng dần rồi lùi lại (dao động tam giác) */
export function powerFromHold(ms) {
  if (!(ms > 0)) return 0
  const x = (ms / FILL_MS) % 2
  return x <= 1 ? x : 2 - x
}

/** @returns {'nhe'|'ngan'|'manh'} */
export function gradeStrike(power) {
  if (power < SWEET[0]) return 'nhe'
  if (power > SWEET[1]) return 'manh'
  return 'ngan'
}

export const STRIKE_TEXT = {
  nhe: 'Tiếng chuông còn nhẹ — lấy đà thêm chút nữa nhé',
  ngan: 'Chuông ngân tròn đầy, vang khắp núi rừng',
  manh: 'Hơi quá tay — chuông dội mạnh, lần sau thả sớm hơn',
}

/* ---------- Con lắc chày gỗ (góc quay quanh trục X tại điểm treo) ---------- */

export const PENDULUM = {
  /** Chiều dài dây treo (m) */
  length: 1.05,
  /** Góc khi chày chạm thân chuông (dương = về phía chuông) */
  contact: 0.19,
  /** Góc kéo lùi tối đa khi lấy đà */
  maxPull: 0.35,
  stiffness: 16,
  damping: 2.2,
  /** Hệ số nảy khi chạm chuông */
  bounce: 0.35,
}

/**
 * Một bước mô phỏng con lắc.
 * @param {{ angle: number, vel: number }} s trạng thái hiện tại
 * @param {number} dt giây
 * @param {number} pull 0..1 đang kéo lùi chày (0 = thả)
 * @returns {{ angle: number, vel: number, impact: number }} impact = vận tốc lúc chạm chuông (0 nếu không chạm)
 */
export function stepPendulum(s, dt, pull = 0) {
  const P = PENDULUM
  const target = -Math.min(1, Math.max(0, pull)) * P.maxPull
  let { angle, vel } = s
  let impact = 0
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)))
  const h = dt / steps
  for (let i = 0; i < steps; i++) {
    const acc = -P.stiffness * (angle - target) - P.damping * vel
    vel += acc * h
    angle += vel * h
    if (angle >= P.contact && vel > 0) {
      impact = Math.max(impact, vel)
      angle = P.contact
      vel = -vel * P.bounce
    }
  }
  return { angle, vel, impact }
}

/** Vận tốc đẩy chày khi thả tay, theo lực */
export function releaseVelocity(power) {
  return 2.2 + 3.2 * Math.min(1, Math.max(0, power))
}
