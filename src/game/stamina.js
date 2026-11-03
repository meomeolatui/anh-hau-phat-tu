/**
 * Thể lực (0..100) — logic thuần, cập nhật mỗi frame trong Player.jsx.
 * Tiêu hao: chạy, leo dốc. Hồi: đứng yên (chậm), ngồi/quỳ khi làm nghi thức (vừa), ngồi ghế nghỉ chân (nhanh).
 * Kiệt sức (về 0): không chạy được, đi chậm hơn cho tới khi hồi lên RECOVER_AT.
 */

export const STAMINA_MAX = 100
export const RECOVER_AT = 30

// Tiêu hao đã giảm 3 lần theo phản hồi người chơi (trước: chạy 13, leo 3) — leo núi không bị hụt hơi quá nhanh
export const RATES = {
  run: 13 / 3, // /giây khi chạy (~23 giây chạy liên tục từ đầy tới cạn)
  climb: 1, // /giây khi đi lên dốc (cộng thêm nếu vừa chạy vừa leo)
  idle: 4, // /giây khi đứng yên đủ lâu
  walk: 0.6, // /giây khi đi bộ đất bằng (hồi rất chậm)
  sit: 14, // /giây khi ngồi/quỳ làm nghi thức
  rest: 30, // /giây khi ngồi ghế nghỉ chân
}

/** Đứng yên bao lâu (giây) thì bắt đầu hồi */
export const IDLE_DELAY = 0.8

/**
 * Tính trạng thái thể lực sau `dt` giây.
 * @param {{ value: number, exhausted: boolean, idleFor: number }} s trạng thái hiện tại
 * @param {{ moving: boolean, running: boolean, climbing: boolean, sitting: boolean, resting: boolean }} act hành vi trong frame
 * @returns {{ value, exhausted, idleFor, becameExhausted: boolean }}
 */
export function stepStamina(s, act, dt) {
  let { value, exhausted, idleFor } = s
  idleFor = act.moving ? 0 : idleFor + dt
  let delta = 0
  if (act.resting) delta = RATES.rest
  else if (act.sitting) delta = RATES.sit
  else if (act.moving) {
    if (act.running) delta -= RATES.run
    if (act.climbing) delta -= RATES.climb
    if (!act.running && !act.climbing) delta = RATES.walk
  } else if (idleFor >= IDLE_DELAY) delta = RATES.idle

  value = Math.max(0, Math.min(STAMINA_MAX, value + delta * dt))
  let becameExhausted = false
  if (!exhausted && value <= 0) {
    exhausted = true
    becameExhausted = true
  } else if (exhausted && value >= RECOVER_AT) {
    exhausted = false
  }
  return { value, exhausted, idleFor, becameExhausted }
}

/** Dưới ngưỡng này mà đứng yên thì nhân vật khom người thở dốc */
export const TIRED_BELOW = 40

/** Mức mệt 0..1 (0 = vừa chạm ngưỡng TIRED_BELOW, 1 = cạn sức) — dùng cho nhịp thở */
export function tiredness(s) {
  return Math.max(0, Math.min(1, 1 - s.value / TIRED_BELOW))
}

/** Đứng yên mà mệt → hiện dáng thở dốc */
export function showTired(s, standing) {
  return standing && s.value < TIRED_BELOW
}

/** Có được chạy không (cần còn sức và không đang kiệt) */
export function canRun(s) {
  return !s.exhausted && s.value > 2
}

/** Hệ số tốc độ đi: kiệt sức thì lê bước chậm hơn */
export function speedFactor(s) {
  return s.exhausted ? 0.7 : 1
}
