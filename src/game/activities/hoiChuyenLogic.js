/**
 * Logic thuần cho Hội thoại NPC: ghi nhớ chủ đề đã nghe (qua cooldowns trong state, thời hạn rất dài),
 * hiệu ứng gõ chữ, chân dung chữ cái đầu.
 */

/** "Đã nghe" lưu bằng markCooldown với thời hạn ~100 năm (không cần sửa state.js) */
export const HEARD_MS = 100 * 365 * 24 * 3600 * 1000
/** Nghe lại một chủ đề: +5 công đức, mỗi chủ đề tối đa một lần / 10 phút */
export const REPEAT_COOLDOWN = 10 * 60 * 1000
export const FIRST_MERIT = 15
export const REPEAT_MERIT = 5
/** Tốc độ gõ chữ (ký tự / giây) */
export const TYPE_CPS = 48

export const heardKey = (dialogueId, topicId) => `nghe:${dialogueId}:${topicId}`
export const repeatKey = (dialogueId, topicId) => `nghe-lai:${dialogueId}:${topicId}`

/** Số ký tự đã hiện sau `elapsedMs` */
export function typedLength(text, elapsedMs, cps = TYPE_CPS) {
  const n = Math.floor((Math.max(0, elapsedMs) / 1000) * cps)
  return Math.min(String(text).length, n)
}

/** Chữ cái đầu của tên gọi (từ cuối trong tên tiếng Việt), vd. "Chú tiểu Minh An" → "A" */
export function initialOf(name) {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean)
  const last = words[words.length - 1]
  return last ? last[0].toLocaleUpperCase('vi') : '?'
}
