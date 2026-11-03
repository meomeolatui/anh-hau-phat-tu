import { DEFAULT_STATE, SCHEMA_VERSION, getState, replaceState, setState } from './store'
import { todayKey } from './date'

/**
 * Mọi thao tác ghi dữ liệu đi qua file này để các trang (Hôm nay, Nhật ký, Thống kê…)
 * cùng đọc một cấu trúc thống nhất.
 */

const MAX_SESSIONS = 2000

export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export const EMPTY_DAY = Object.freeze({ niem: 0, thienMin: 0, tung: 0, thienHanh: [], note: '', mood: null })

export function getDay(logs, key) {
  return logs[key] ?? EMPTY_DAY
}

function patchDay(key, fn) {
  setState((s) => {
    const prev = { ...EMPTY_DAY, ...s.logs[key] }
    return { ...s, logs: { ...s.logs, [key]: fn(prev) } }
  })
}

/* ---------- Hồ sơ & cài đặt ---------- */

export function updateProfile(patch) {
  setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }))
}

export function updateGoals(patch) {
  setState((s) => ({ ...s, profile: { ...s.profile, goals: { ...s.profile.goals, ...patch } } }))
}

export function updateSettings(patch) {
  setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
}

export function completeOnboarding({ name, phapDanh, goals }) {
  setState((s) => ({
    ...s,
    profile: {
      ...s.profile,
      name: name?.trim() || s.profile.name,
      phapDanh: phapDanh?.trim() || s.profile.phapDanh,
      goals: { ...s.profile.goals, ...goals },
      onboarded: true,
      createdAt: s.profile.createdAt ?? new Date().toISOString(),
    },
  }))
}

/* ---------- Niệm Phật / Thiền / Tụng kinh ---------- */

/** Cộng số câu niệm vào ngày (mặc định hôm nay). */
export function addNiem(count, key = todayKey()) {
  if (!Number.isFinite(count) || count <= 0) return
  patchDay(key, (d) => ({ ...d, niem: d.niem + Math.round(count) }))
}

/**
 * Ghi một phiên tu tập và cộng dồn vào nhật ký ngày.
 * - type 'niem': count = số câu niệm (đã cộng qua addNiem thì truyền addToDay=false)
 * - type 'thien': duration = số giây đã ngồi
 * - type 'tung': ref = id bài kinh
 */
export function recordSession({ type, duration = 0, count = 0, ref = null, at = new Date(), addToDay = true }) {
  const key = todayKey()
  const session = { id: uid(), type, at: at.toISOString(), duration: Math.round(duration), count: Math.round(count), ref }
  setState((s) => ({ ...s, sessions: [session, ...s.sessions].slice(0, MAX_SESSIONS) }))
  if (!addToDay) return session
  if (type === 'thien') patchDay(key, (d) => ({ ...d, thienMin: d.thienMin + Math.round(duration / 60) }))
  else if (type === 'tung') patchDay(key, (d) => ({ ...d, tung: d.tung + 1 }))
  else if (type === 'niem' && count > 0) addNiem(count, key)
  return session
}

/* ---------- Thiện hạnh & ghi chú ngày ---------- */

export function addGoodDeed({ text, category = 'khac' }, key = todayKey()) {
  const clean = String(text || '').trim()
  if (!clean) return null
  const deed = { id: uid(), text: clean.slice(0, 280), category, at: new Date().toISOString() }
  patchDay(key, (d) => ({ ...d, thienHanh: [...d.thienHanh, deed] }))
  return deed
}

export function removeGoodDeed(id, key = todayKey()) {
  patchDay(key, (d) => ({ ...d, thienHanh: d.thienHanh.filter((x) => x.id !== id) }))
}

export function setDayNote(note, key = todayKey()) {
  patchDay(key, (d) => ({ ...d, note: String(note).slice(0, 2000) }))
}

/** mood: 1..5 (1 = nặng nề, 5 = an lạc) */
export function setDayMood(mood, key = todayKey()) {
  patchDay(key, (d) => ({ ...d, mood }))
}

/* ---------- Yêu thích, đánh dấu ---------- */

/** kind: 'quotes' | 'sutras' | 'temples' */
export function toggleFavorite(kind, id) {
  setState((s) => {
    const list = s.favorites[kind] ?? []
    const next = list.includes(id) ? list.filter((x) => x !== id) : [id, ...list]
    return { ...s, favorites: { ...s.favorites, [kind]: next } }
  })
}

export function isFavorite(state, kind, id) {
  return (state.favorites[kind] ?? []).includes(id)
}

/** Lưu vị trí đang đọc của một bài kinh (chỉ số dòng/đoạn). */
export function setBookmark(sutraId, index) {
  setState((s) => ({ ...s, bookmarks: { ...s.bookmarks, [sutraId]: index } }))
}

/* ---------- Hành hương ---------- */

export function markVisited(templeId, { date = todayKey(), note = '' } = {}) {
  setState((s) => ({
    ...s,
    pilgrimage: {
      ...s.pilgrimage,
      visited: { ...s.pilgrimage.visited, [templeId]: { date, note: String(note).slice(0, 1000) } },
      wishlist: s.pilgrimage.wishlist.filter((x) => x !== templeId),
    },
  }))
}

export function unmarkVisited(templeId) {
  setState((s) => {
    const visited = { ...s.pilgrimage.visited }
    delete visited[templeId]
    return { ...s, pilgrimage: { ...s.pilgrimage, visited } }
  })
}

export function toggleWishlist(templeId) {
  setState((s) => {
    const list = s.pilgrimage.wishlist
    const wishlist = list.includes(templeId) ? list.filter((x) => x !== templeId) : [...list, templeId]
    return { ...s, pilgrimage: { ...s.pilgrimage, wishlist } }
  })
}

/* ---------- Học Phật ---------- */

export function completeLesson(lessonId, score) {
  setState((s) => {
    const prev = s.lessons.completed[lessonId]
    const best = prev ? Math.max(prev.score, score) : score
    return {
      ...s,
      lessons: { ...s.lessons, completed: { ...s.lessons.completed, [lessonId]: { score: best, at: new Date().toISOString() } } },
    }
  })
}

/* ---------- Sổ nguyện & hồi hướng ---------- */

export function addVow({ text, type = 'nguyen' }) {
  const clean = String(text || '').trim()
  if (!clean) return null
  const vow = { id: uid(), type, text: clean.slice(0, 1000), at: new Date().toISOString() }
  setState((s) => ({ ...s, vows: [vow, ...s.vows] }))
  return vow
}

export function removeVow(id) {
  setState((s) => ({ ...s, vows: s.vows.filter((v) => v.id !== id) }))
}

/* ---------- Sao lưu / khôi phục ---------- */

export function exportData() {
  return JSON.stringify({ app: 'anh-hau-phat-tu', exportedAt: new Date().toISOString(), data: getState() }, null, 2)
}

export class ImportError extends Error {}

/** Nhận chuỗi JSON từ file sao lưu. Ném ImportError nếu file không hợp lệ. */
export function importData(json) {
  let parsed
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new ImportError('File không phải định dạng JSON hợp lệ.')
  }
  const data = parsed?.app === 'anh-hau-phat-tu' ? parsed.data : null
  if (!data || typeof data !== 'object' || typeof data.logs !== 'object') {
    throw new ImportError('File này không phải bản sao lưu của Anh Hậu Phật Tử.')
  }
  if (Number(data.version) > SCHEMA_VERSION) {
    throw new ImportError('Bản sao lưu được tạo từ phiên bản mới hơn, hãy cập nhật ứng dụng.')
  }
  replaceState(data)
}

export function resetAll() {
  replaceState(structuredClone(DEFAULT_STATE))
}
