import { BEAD_SIZES, DEFAULT_BEAD_SIZE } from './mala'
import { DEFAULT_BPM, clampBpm, createSession } from './session'

/**
 * Lưu tuỳ chọn tràng hạt và phiên đang dở vào localStorage riêng (key nhỏ),
 * để mỗi lần lần hạt không phải ghi lại toàn bộ dữ liệu ứng dụng.
 * Số câu niệm chính thức vẫn được ghi vào nhật ký ngày qua actions.addNiem.
 */

export const PREFS_KEY = 'ahpt:niem-phat:prefs'
export const SESSION_KEY = 'ahpt:niem-phat:session'

export const DEFAULT_PREFS = Object.freeze({
  size: DEFAULT_BEAD_SIZE,
  mo: false,
  mode: 'tay', // 'tay' = tự lần hạt | 'mo' = theo nhịp mõ
  bpm: DEFAULT_BPM,
  celebrated: null, // khoá ngày đã chúc mừng đạt mục tiêu
})

function read(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    // Dữ liệu hỏng hoặc bị chặn truy cập — coi như chưa có, dùng mặc định
    return null
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    // Bộ nhớ đầy/chế độ riêng tư: số câu vẫn vào nhật ký qua store, chỉ mất phần khôi phục phiên
    return false
  }
}

export function sanitizePrefs(raw) {
  const p = raw && typeof raw === 'object' ? raw : {}
  return {
    size: BEAD_SIZES.includes(p.size) ? p.size : DEFAULT_PREFS.size,
    mo: p.mo === true,
    mode: p.mode === 'mo' ? 'mo' : 'tay',
    bpm: clampBpm(p.bpm ?? DEFAULT_BPM),
    celebrated: typeof p.celebrated === 'string' ? p.celebrated : null,
  }
}

const nonNeg = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0)
const time = (v) => (Number.isFinite(v) && v > 0 ? v : null)

export function sanitizeSession(raw, size = DEFAULT_BEAD_SIZE) {
  if (!raw || typeof raw !== 'object') return createSession()
  const bead = nonNeg(raw.bead)
  return {
    total: nonNeg(raw.total),
    bead: bead < size ? bead : 0,
    rounds: nonNeg(raw.rounds),
    pending: nonNeg(raw.pending),
    activeMs: nonNeg(raw.activeMs),
    startedAt: time(raw.startedAt),
    lastAt: time(raw.lastAt),
  }
}

export const loadPrefs = () => sanitizePrefs(read(PREFS_KEY))
export const savePrefs = (prefs) => write(PREFS_KEY, sanitizePrefs(prefs))
export const loadSession = (size) => sanitizeSession(read(SESSION_KEY), size)
export const saveSession = (session) => write(SESSION_KEY, session)

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // Không xoá được thì phiên rỗng kế tiếp sẽ ghi đè — không ảnh hưởng số đã lưu
  }
}
