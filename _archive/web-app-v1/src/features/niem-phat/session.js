/**
 * Logic thuần của một phiên lần hạt. Không đụng tới store hay DOM để test được dễ dàng.
 *
 * Phiên: { total, bead, rounds, pending, activeMs, startedAt, lastAt }
 * - total   : số câu đã niệm trong phiên
 * - bead    : vị trí trong chuỗi hiện tại (0 = đang ở hạt mẫu)
 * - rounds  : số chuỗi đã tròn
 * - pending : số câu chưa ghi vào nhật ký ngày (gom lại rồi ghi một lần để đỡ ghi đĩa liên tục)
 * - activeMs: thời gian thực sự đang niệm; khoảng nghỉ dài chỉ tính tối đa IDLE_CAP_MS
 */

export const IDLE_CAP_MS = 60_000
/** Phiên bị bỏ dở quá lâu thì tự lưu lại và bắt đầu phiên mới. */
export const STALE_AFTER_MS = 6 * 60 * 60 * 1000

export const BPM_MIN = 30
export const BPM_MAX = 120
export const DEFAULT_BPM = 60

export function createSession() {
  return { total: 0, bead: 0, rounds: 0, pending: 0, activeMs: 0, startedAt: null, lastAt: null }
}

/**
 * Lần thêm một hạt.
 * @returns {{ session, completed: boolean }} completed = vừa tròn một chuỗi
 */
export function stepSession(session, size, now = Date.now()) {
  const gap = session.lastAt == null ? 0 : Math.max(0, now - session.lastAt)
  const nextBead = session.bead + 1
  const completed = nextBead >= size
  return {
    completed,
    session: {
      ...session,
      total: session.total + 1,
      bead: completed ? 0 : nextBead,
      rounds: completed ? session.rounds + 1 : session.rounds,
      pending: session.pending + 1,
      activeMs: session.activeMs + Math.min(gap, IDLE_CAP_MS),
      startedAt: session.startedAt ?? now,
      lastAt: now,
    },
  }
}

/** Đưa chuỗi về hạt mẫu — giữ nguyên số câu và số vòng đã niệm. */
export function resetChain(session) {
  if (session.bead === 0) return session
  return { ...session, bead: 0 }
}

/** Đổi số hạt giữa chừng: nếu vị trí cũ vượt quá chuỗi mới thì quay về hạt mẫu. */
export function resizeChain(session, size) {
  return session.bead < size ? session : { ...session, bead: 0 }
}

/** Lấy phần số câu đang chờ ghi; trả về phiên đã xả hàng chờ. */
export function drainPending(session) {
  if (!session.pending) return { amount: 0, session }
  return { amount: session.pending, session: { ...session, pending: 0 } }
}

/** Thời lượng phiên (giây), dùng khi ghi lịch sử. */
export function sessionSeconds(session) {
  return Math.round(session.activeMs / 1000)
}

export function isStale(session, now = Date.now()) {
  return session.lastAt != null && now - session.lastAt > STALE_AFTER_MS
}

/** Vừa vượt mục tiêu ngày ở lần cộng này hay không. */
export function crossedGoal(prev, next, goal) {
  if (!goal || goal <= 0) return false
  return prev < goal && next >= goal
}

export function clampBpm(bpm) {
  const n = Math.round(Number(bpm))
  if (!Number.isFinite(n)) return DEFAULT_BPM
  return Math.min(BPM_MAX, Math.max(BPM_MIN, n))
}

/** Khoảng cách giữa hai nhịp mõ (ms). */
export function beatInterval(bpm) {
  return 60_000 / clampBpm(bpm)
}
