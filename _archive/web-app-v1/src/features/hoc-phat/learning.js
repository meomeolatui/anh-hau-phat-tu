/**
 * Logic thuần cho lộ trình Học Phật: tiến độ, gợi ý bài tiếp theo, điều hướng.
 * `completed` có dạng state.lessons.completed: { [lessonId]: { score: 0..1, at: ISO } }
 */

/** Điểm từ mức này trở lên được xem là "thuần thục" bài học. */
export const MASTERY_SCORE = 0.8

function clamp01(n) {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

/** Điểm cao nhất đã lưu của một bài, hoặc null nếu chưa làm. */
export function bestScore(completed, id) {
  const entry = completed?.[id]
  if (!entry || !Number.isFinite(entry.score)) return null
  return clamp01(entry.score)
}

/** 'new' (chưa học) | 'done' (đã làm trắc nghiệm) | 'mastered' (đạt từ MASTERY_SCORE). */
export function lessonStatus(completed, id) {
  const score = bestScore(completed, id)
  if (score === null) return 'new'
  return score >= MASTERY_SCORE ? 'mastered' : 'done'
}

/** 0.8 → '80%' */
export function formatPercent(score) {
  return `${Math.round(clamp01(score) * 100)}%`
}

/** Tiến độ tổng: số bài đã hoàn thành, tỉ lệ, điểm trung bình (null khi chưa có bài nào). */
export function overallProgress(lessons, completed) {
  const total = lessons.length
  const scores = lessons.map((l) => bestScore(completed, l.id)).filter((s) => s !== null)
  const done = scores.length
  const mastered = scores.filter((s) => s >= MASTERY_SCORE).length
  const avgScore = done ? scores.reduce((a, b) => a + b, 0) / done : null
  const minutesLeft = lessons.filter((l) => bestScore(completed, l.id) === null).reduce((sum, l) => sum + (l.minutes || 0), 0)
  return { total, done, mastered, ratio: total ? done / total : 0, avgScore, minutesLeft }
}

/** Tiến độ theo từng cấp độ, giữ thứ tự của `levels`. */
export function progressByLevel(lessons, completed, levels) {
  return levels.map((level) => {
    const items = lessons.filter((l) => l.level === level.id)
    const done = items.filter((l) => bestScore(completed, l.id) !== null).length
    return { level: level.id, total: items.length, done, ratio: items.length ? done / items.length : 0 }
  })
}

/**
 * Gợi ý bài nên học tiếp:
 * - Bài đầu tiên (theo thứ tự lộ trình) chưa học → { lesson, reason: 'start' | 'continue' }
 * - Học hết rồi → bài có điểm thấp nhất chưa thuần thục để ôn → reason: 'review'
 * - Tất cả đều thuần thục → null
 */
export function nextLesson(lessons, completed) {
  if (!lessons.length) return null
  const firstNew = lessons.find((l) => bestScore(completed, l.id) === null)
  if (firstNew) {
    const anyDone = lessons.some((l) => bestScore(completed, l.id) !== null)
    return { lesson: firstNew, reason: anyDone ? 'continue' : 'start' }
  }
  let weakest = null
  for (const l of lessons) {
    const s = bestScore(completed, l.id)
    if (s >= MASTERY_SCORE) continue
    if (!weakest || s < bestScore(completed, weakest.id)) weakest = l
  }
  return weakest ? { lesson: weakest, reason: 'review' } : null
}

/** Bài trước / sau trong lộ trình. */
export function adjacentLessons(lessons, id) {
  const i = lessons.findIndex((l) => l.id === id)
  if (i < 0) return { prev: null, next: null, index: -1 }
  return { prev: lessons[i - 1] ?? null, next: lessons[i + 1] ?? null, index: i }
}

/** Lọc theo cấp độ; 'all' giữ nguyên. */
export function filterByLevel(lessons, level) {
  if (!level || level === 'all') return lessons
  return lessons.filter((l) => l.level === level)
}

/**
 * Tiến độ đọc của một bài viết theo vị trí cuộn.
 * top: khoảng cách từ đỉnh bài tới đỉnh viewport (getBoundingClientRect().top)
 * height: chiều cao bài; viewport: chiều cao cửa sổ.
 */
export function readingProgress({ top, height, viewport }) {
  const scrollable = height - viewport
  if (scrollable <= 0) return top <= 0 ? 1 : 0
  return clamp01(-top / scrollable)
}

/** Mục đang đọc: mục cuối cùng có đỉnh đã vượt qua mốc `offset` (px từ đỉnh viewport). */
export function activeSectionIndex(tops, offset = 120) {
  let active = 0
  tops.forEach((t, i) => {
    if (t <= offset) active = i
  })
  return active
}

export const FONT_MIN = 16
export const FONT_MAX = 28

/** Tăng/giảm cỡ chữ đọc theo bước 2px, giới hạn trong [FONT_MIN, FONT_MAX]. */
export function stepFontSize(size, delta) {
  const base = Number.isFinite(size) ? size : 20
  return Math.min(FONT_MAX, Math.max(FONT_MIN, base + delta * 2))
}
