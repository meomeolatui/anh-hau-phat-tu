/**
 * Nhảy (phím Space / nút nhảy trên màn hình cảm ứng).
 * Nhảy là độ cao h cộng thêm trên mặt đất đang đứng — va chạm & đường đi vẫn theo mặt đất,
 * nên không nhảy lọt qua tường hay lên mái được, chỉ là động tác cho vui chân.
 */

/** Vận tốc bật lên (m/s) và trọng lực (m/s²): đỉnh ≈ 0.85 m, bay ≈ 0.65 s */
export const JUMP_SPEED = 5.2
export const GRAVITY = 16
/** Thể lực tốn mỗi lần nhảy */
export const JUMP_COST = 2
/** Thời gian nhún gối khi tiếp đất (s) */
export const LAND_TIME = 0.22

export function createJump() {
  return { h: 0, vy: 0, airborne: false, land: 0 }
}

/** Được nhảy khi: đang đứng trên đất, không bị khoá (hoạt động/cáp treo), còn sức */
export function canJump(jump, { locked = false, riding = false, stamina } = {}) {
  if (locked || riding || jump.airborne) return false
  if (stamina && (stamina.exhausted || stamina.value < JUMP_COST)) return false
  return true
}

export function startJump(jump) {
  jump.airborne = true
  jump.vy = JUMP_SPEED
  jump.h = 0
  jump.land = 0
}

/**
 * Cập nhật một bước.
 * @returns {boolean} true ở đúng frame vừa tiếp đất
 */
export function stepJump(jump, dt) {
  if (jump.land > 0) jump.land = Math.max(0, jump.land - dt)
  if (!jump.airborne) return false
  jump.vy -= GRAVITY * dt
  jump.h += jump.vy * dt
  if (jump.h > 0) return false
  jump.h = 0
  jump.vy = 0
  jump.airborne = false
  jump.land = LAND_TIME
  return true
}

/** Pha động tác cho avatarRig: -1 = vừa bật lên … 0 = đỉnh … 1 = đang rơi xuống */
export function jumpPhase(jump) {
  return Math.max(-1, Math.min(1, -jump.vy / JUMP_SPEED))
}
