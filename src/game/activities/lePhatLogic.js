/**
 * Logic thuần cho hoạt động Lễ Phật: vòng sen thu nhỏ theo nhịp, bấm "Lạy" khi vòng sen khớp vòng tròn.
 * Không gắt: lỡ nhịp không bị trừ gì, chỉ nhắc nhẹ; lỡ nhiều lần liên tiếp thì cửa sổ nhịp tự nới rộng.
 */

export const BOW_COUNTS = [1, 3, 9]
export const MERIT_PER_BOW = 5
/** Thời gian hoạt ảnh một lạy (khớp chu kỳ 3 giây của hoạt ảnh 'bow' trong Avatar) */
export const BOW_ANIM_MS = 3000

/** Vòng sen co từ RING_FROM về RING_TO (tỉ lệ so với vòng tròn đích = 1) trong một chu kỳ */
export const RING_FROM = 2.1
export const RING_TO = 0.55
/** Pha (0..1) mà vòng sen khớp đúng vòng tròn đích */
export const TARGET_PHASE = (RING_FROM - 1) / (RING_FROM - RING_TO)

/** Cấu hình nhịp: chế độ dễ chậm hơn và cửa sổ rộng hơn */
export function rhythmConfig(easy = false) {
  return easy ? { period: 3400, perfect: 0.07, good: 0.19 } : { period: 2600, perfect: 0.04, good: 0.1 }
}

/** Pha hiện tại trong chu kỳ (0..1) */
export function phaseAt(now, start, period) {
  const t = (((now - start) % period) + period) % period
  return t / period
}

/** Độ lớn vòng sen theo pha */
export function ringScale(phase) {
  return RING_FROM + (RING_TO - RING_FROM) * phase
}

/** Độ mờ vòng sen: hiện dần ở đầu chu kỳ, mờ dần sau khi qua vòng đích */
export function ringOpacity(phase) {
  if (phase < 0.12) return phase / 0.12
  if (phase > TARGET_PHASE + 0.12) return Math.max(0, 1 - (phase - TARGET_PHASE - 0.12) / 0.17)
  return 1
}

/**
 * Chấm một lần bấm.
 * @param {number} phase 0..1
 * @param {{ easy?: boolean, misses?: number }} opts misses = số lần lỡ nhịp liên tiếp (để nới cửa sổ)
 * @returns {'perfect'|'good'|'early'|'late'}
 */
export function gradeTap(phase, { easy = false, misses = 0 } = {}) {
  const cfg = rhythmConfig(easy)
  const assist = Math.min(Math.max(0, misses), 3) * 0.03
  const diff = phase - TARGET_PHASE
  const ad = Math.abs(diff)
  if (ad <= cfg.perfect + assist / 2) return 'perfect'
  if (ad <= cfg.good + assist) return 'good'
  return diff < 0 ? 'early' : 'late'
}

export const isHit = (grade) => grade === 'perfect' || grade === 'good'

export const GRADE_TEXT = {
  perfect: 'Tròn đầy — thân tâm hợp nhất',
  good: 'Thành kính',
  early: 'Hơi sớm — cứ thong thả, đợi vòng sen khớp nhé',
  late: 'Hơi muộn — hít thở nhẹ, đợi vòng sen sau',
}
