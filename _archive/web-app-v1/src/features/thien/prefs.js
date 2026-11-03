/**
 * Tuỳ chọn buổi ngồi thiền (thời lượng, kiểu thở, chuông…) — chỉ là "lựa chọn lần trước"
 * nên lưu riêng trong localStorage, không trộn vào nhật ký tu tập.
 */
import { BREATH_PATTERNS, DEFAULT_PATTERN_ID } from './breathing'

export const PREFS_KEY = 'ahpt:thien-prefs'

export const DURATION_PRESETS = [5, 10, 15, 20, 30, 45, 60]
export const MIN_DURATION = 1
export const MAX_DURATION = 180
export const PREP_OPTIONS = [0, 10, 30]
export const INTERVAL_OPTIONS = [0, 5, 10]

export const DEFAULT_PREFS = Object.freeze({
  minutes: 15,
  pattern: DEFAULT_PATTERN_ID,
  bells: true,
  intervalMin: 0,
  prepSec: 10,
  prompts: true,
})

/** Ép số phút về khoảng hợp lệ 1–180; trả về null nếu không phải số. */
export function clampMinutes(value) {
  if (value === '' || value == null) return null
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return null
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, n))
}

/** Làm sạch dữ liệu đọc từ localStorage (có thể cũ, hỏng hoặc bị sửa tay). */
export function sanitizePrefs(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  return {
    minutes: clampMinutes(src.minutes) ?? DEFAULT_PREFS.minutes,
    pattern: BREATH_PATTERNS.some((p) => p.id === src.pattern) ? src.pattern : DEFAULT_PREFS.pattern,
    bells: typeof src.bells === 'boolean' ? src.bells : DEFAULT_PREFS.bells,
    intervalMin: INTERVAL_OPTIONS.includes(src.intervalMin) ? src.intervalMin : DEFAULT_PREFS.intervalMin,
    prepSec: PREP_OPTIONS.includes(src.prepSec) ? src.prepSec : DEFAULT_PREFS.prepSec,
    prompts: typeof src.prompts === 'boolean' ? src.prompts : DEFAULT_PREFS.prompts,
  }
}

export function loadPrefs(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(PREFS_KEY)
    return sanitizePrefs(raw ? JSON.parse(raw) : null)
  } catch {
    // JSON hỏng hoặc bộ nhớ bị chặn: dùng mặc định, không làm gián đoạn việc ngồi thiền
    return { ...DEFAULT_PREFS }
  }
}

export function savePrefs(prefs, storage = globalThis.localStorage) {
  try {
    storage?.setItem(PREFS_KEY, JSON.stringify(sanitizePrefs(prefs)))
    return true
  } catch {
    // Chế độ ẩn danh / bộ nhớ đầy: tuỳ chọn chỉ mất khi tải lại trang, chấp nhận được
    return false
  }
}
