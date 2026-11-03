/**
 * Máy trạng thái hơi thở — thuần, không phụ thuộc React.
 * Pha hiện tại được TÍNH từ thời gian đã trôi qua (ms), không đếm dồn từng nhịp,
 * nhờ vậy vẫn đúng khi tab bị ẩn, máy chậm hoặc người dùng tạm dừng rồi tiếp tục.
 */

/** Kích thước tương đối của vòng thở: đầy khi hít vào xong, thu nhỏ khi thở ra xong. */
export const SCALE_FULL = 1
export const SCALE_EMPTY = 0.62

const PHASE_META = {
  in: { label: 'Hít vào…', hint: 'Hít vào nhẹ nhàng bằng mũi' },
  holdIn: { label: 'Giữ…', hint: 'Giữ hơi thở, buông lỏng vai' },
  out: { label: 'Thở ra…', hint: 'Thở ra chậm, dài và êm' },
  holdOut: { label: 'Giữ…', hint: 'Nghỉ yên trong khoảng lặng' },
}

/** Kích thước bắt đầu → kết thúc của từng loại pha. */
const PHASE_SCALE = {
  in: [SCALE_EMPTY, SCALE_FULL],
  holdIn: [SCALE_FULL, SCALE_FULL],
  out: [SCALE_FULL, SCALE_EMPTY],
  holdOut: [SCALE_EMPTY, SCALE_EMPTY],
}

/** phases: [[loại pha, số giây]] */
export const BREATH_PATTERNS = [
  {
    id: 'tu-nhien',
    label: 'Tự nhiên',
    desc: 'Không hướng dẫn nhịp — chỉ lặng lẽ biết mình đang thở vào, thở ra.',
    phases: [],
  },
  {
    id: 'deu-4-4',
    label: 'Thở đều 4–4',
    desc: 'Hít 4 giây, thở ra 4 giây. Nhịp cân bằng, dễ theo cho người mới.',
    phases: [['in', 4], ['out', 4]],
  },
  {
    id: 'thu-gian-4-7-8',
    label: 'Thư giãn 4–7–8',
    desc: 'Hít 4, giữ 7, thở ra 8 giây. Giúp lắng dịu, hợp buổi tối. Nếu thấy chóng mặt, hãy chuyển về thở tự nhiên.',
    phases: [['in', 4], ['holdIn', 7], ['out', 8]],
  },
  {
    id: 'hop-4-4-4-4',
    label: 'Hộp 4–4–4–4',
    desc: 'Hít – giữ – thở ra – giữ, mỗi pha 4 giây. Giúp tâm tập trung, vững vàng.',
    phases: [['in', 4], ['holdIn', 4], ['out', 4], ['holdOut', 4]],
  },
  {
    id: 'cham-5-5',
    label: 'Thở chậm 5–5',
    desc: 'Hít 5 giây, thở ra 5 giây — khoảng sáu hơi thở mỗi phút, chậm và sâu.',
    phases: [['in', 5], ['out', 5]],
  },
]

export const DEFAULT_PATTERN_ID = 'deu-4-4'

export function getPattern(id) {
  return BREATH_PATTERNS.find((p) => p.id === id) ?? BREATH_PATTERNS.find((p) => p.id === DEFAULT_PATTERN_ID)
}

/** Độ dài một chu kỳ thở (ms). 0 nếu là kiểu tự nhiên. */
export function cycleMs(pattern) {
  return (pattern?.phases ?? []).reduce((sum, [, sec]) => sum + sec * 1000, 0)
}

/**
 * Pha hơi thở tại thời điểm `elapsedMs` (tính từ lúc bắt đầu ngồi).
 * @returns null nếu kiểu tự nhiên, ngược lại
 *   { kind, label, hint, index, cycle, durationMs, phaseElapsedMs, remainingSec, progress, fromScale, toScale }
 */
export function getBreathPhase(pattern, elapsedMs) {
  const total = cycleMs(pattern)
  if (!total) return null
  const safe = Math.max(0, Number(elapsedMs) || 0)
  const cycle = Math.floor(safe / total)
  let t = safe - cycle * total
  for (let index = 0; index < pattern.phases.length; index++) {
    const [kind, sec] = pattern.phases[index]
    const durationMs = sec * 1000
    if (t < durationMs) {
      const [fromScale, toScale] = PHASE_SCALE[kind]
      return {
        kind,
        ...PHASE_META[kind],
        index,
        cycle,
        durationMs,
        phaseElapsedMs: t,
        // Đếm ngược kiểu 4-3-2-1 (không bao giờ hiện 0)
        remainingSec: Math.max(1, Math.ceil((durationMs - t) / 1000)),
        progress: t / durationMs,
        fromScale,
        toScale,
      }
    }
    t -= durationMs
  }
  return null
}

/**
 * Kích thước vòng thở đúng tại thời điểm của pha (đường cong ease-in-out giống CSS).
 * Dùng khi tạm dừng để "đóng băng" vòng tròn đúng chỗ, và khi tiếp tục để nối mượt.
 */
export function scaleAt(phase) {
  if (!phase) return SCALE_FULL
  const eased = 0.5 - Math.cos(Math.PI * phase.progress) / 2
  return phase.fromScale + (phase.toScale - phase.fromScale) * eased
}

/** Số hơi thở mỗi phút của một kiểu thở (null nếu tự nhiên). */
export function breathsPerMinute(pattern) {
  const total = cycleMs(pattern)
  return total ? Math.round((60000 / total) * 10) / 10 : null
}
