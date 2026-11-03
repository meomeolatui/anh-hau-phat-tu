import { useSyncExternalStore } from 'react'

/**
 * Store toàn cục, lưu vào localStorage. Không có backend: dữ liệu tu tập là riêng tư
 * và nằm trên thiết bị người dùng; có thể sao lưu/khôi phục bằng file JSON (xem actions.js).
 *
 * Quy ước: KHÔNG sửa state trực tiếp — luôn đi qua setState(updater) hoặc các hàm trong actions.js.
 * Selector truyền vào useStore phải trả về tham chiếu sẵn có hoặc giá trị nguyên thủy
 * (không tạo object/array mới mỗi lần gọi) — dữ liệu dẫn xuất hãy tính bằng useMemo.
 */

export const STORAGE_KEY = 'ahpt:v1'
export const SCHEMA_VERSION = 1

export const DEFAULT_STATE = Object.freeze({
  version: SCHEMA_VERSION,
  profile: {
    name: '',
    phapDanh: '',
    createdAt: null,
    onboarded: false,
    goals: { niem: 1080, thienMin: 15, thienHanh: 1 },
    // Câu niệm mặc định cho tràng hạt
    mantra: 'Nam mô A Di Đà Phật',
  },
  settings: {
    theme: 'system', // 'system' | 'light' | 'dark'
    sound: true,
    haptics: true,
    readerFontSize: 20,
    reminderTime: '05:30',
    fasting: 'nhi-trai', // id trong FASTING_SCHEMES (data/holidays.js)
  },
  /** logs['YYYY-MM-DD'] = { niem, thienMin, tung, thienHanh: [{id,text,category,at}], note, mood } */
  logs: {},
  /** Lịch sử phiên: { id, type: 'niem'|'thien'|'tung', at (ISO), duration (giây), count, ref } */
  sessions: [],
  favorites: { quotes: [], sutras: [], temples: [] },
  bookmarks: {},
  pilgrimage: { visited: {}, wishlist: [] },
  lessons: { completed: {} },
  /** Sổ nguyện & hồi hướng: { id, type: 'nguyen'|'hoi-huong'|'sam-hoi', text, at } */
  vows: [],
})

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

/** Trộn sâu dữ liệu đã lưu với mặc định — giúp thêm field mới mà không mất dữ liệu cũ. */
export function mergeDefaults(defaults, saved) {
  if (!isPlainObject(saved)) return structuredClone(defaults)
  const out = {}
  for (const key of Object.keys(defaults)) {
    const d = defaults[key]
    const s = saved[key]
    if (s === undefined) out[key] = structuredClone(d)
    else if (isPlainObject(d) && Object.keys(d).length && isPlainObject(s)) out[key] = mergeDefaults(d, s)
    else out[key] = s
  }
  // Giữ lại các key không có trong mặc định (vd. logs theo ngày nằm trong object rỗng mặc định)
  for (const key of Object.keys(saved)) if (!(key in out)) out[key] = saved[key]
  return out
}

function load() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    return mergeDefaults(DEFAULT_STATE, raw ? JSON.parse(raw) : null)
  } catch (err) {
    console.error('[store] Không đọc được dữ liệu đã lưu, dùng mặc định.', err)
    return structuredClone(DEFAULT_STATE)
  }
}

let state = load()
const listeners = new Set()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('[store] Không lưu được dữ liệu (bộ nhớ đầy hoặc bị chặn).', err)
  }
}

function emit() {
  for (const l of listeners) l()
}

export function getState() {
  return state
}

/** updater: (prev) => next. Trả về state mới (bất biến). */
export function setState(updater) {
  const next = typeof updater === 'function' ? updater(state) : updater
  if (next === state) return
  state = next
  persist()
  emit()
}

/** Thay toàn bộ state (dùng khi khôi phục sao lưu / xoá dữ liệu). */
export function replaceState(next) {
  state = mergeDefaults(DEFAULT_STATE, next)
  persist()
  emit()
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Đồng bộ giữa các tab đang mở
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return
    state = load()
    emit()
  })
}

const identity = (s) => s

export function useStore(selector = identity) {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  )
}

/** Chỉ dùng trong test */
export function __resetForTests() {
  state = structuredClone(DEFAULT_STATE)
  emit()
}
