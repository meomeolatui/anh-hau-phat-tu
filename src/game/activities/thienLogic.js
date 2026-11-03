/**
 * Logic thuần cho Thiền định: máy trạng thái hơi thở (hít 4 giây – thở 6 giây), thời gian.
 */

export const SESSION_MINUTES = [1, 3, 5, 10]
/** Thiền đường chánh điện chùa Bà: các thời thiền dài */
export const LONG_SESSIONS = [5, 15, 30, 60]
export const INHALE_MS = 4000
export const EXHALE_MS = 6000
export const BREATH_MS = INHALE_MS + EXHALE_MS
export const MERIT_PER_MINUTE = 10

const ease = (p) => 0.5 - Math.cos(Math.PI * p) / 2

/**
 * Trạng thái hơi thở tại thời điểm `ms` kể từ lúc bắt đầu.
 * @returns {{ phase: 'hit'|'tho', progress: number, scale: number, cycle: number }}
 *   scale: độ lớn vòng hướng dẫn (0.6 khi thở ra hết → 1 khi hít vào đầy)
 */
export function breathAt(ms) {
  const t = Math.max(0, ms)
  const cycle = Math.floor(t / BREATH_MS)
  const inCycle = t - cycle * BREATH_MS
  if (inCycle < INHALE_MS) {
    const progress = inCycle / INHALE_MS
    return { phase: 'hit', progress, scale: 0.6 + 0.4 * ease(progress), cycle }
  }
  const progress = (inCycle - INHALE_MS) / EXHALE_MS
  return { phase: 'tho', progress, scale: 1 - 0.4 * ease(progress), cycle }
}

/** Số phút trọn vẹn đã ngồi (không vượt quá thời lượng đã chọn) */
export function fullMinutes(elapsedMs, durationMin) {
  const capped = Math.min(Math.max(0, elapsedMs), durationMin * 60000)
  return Math.floor(capped / 60000)
}

/** 'm:ss' */
export function formatClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
