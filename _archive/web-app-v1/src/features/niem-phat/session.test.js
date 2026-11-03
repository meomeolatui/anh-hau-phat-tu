import { describe, expect, it } from 'vitest'
import {
  BPM_MAX,
  BPM_MIN,
  IDLE_CAP_MS,
  STALE_AFTER_MS,
  beatInterval,
  clampBpm,
  createSession,
  crossedGoal,
  drainPending,
  isStale,
  resetChain,
  resizeChain,
  sessionSeconds,
  stepSession,
} from './session'

function tapTimes(n, size, start = 1000, gap = 1000) {
  let s = createSession()
  const completions = []
  for (let i = 0; i < n; i++) {
    const r = stepSession(s, size, start + i * gap)
    s = r.session
    if (r.completed) completions.push(i + 1)
  }
  return { session: s, completions }
}

describe('stepSession', () => {
  it('tăng tổng, vị trí hạt và số câu chờ ghi', () => {
    const { session } = tapTimes(3, 108)
    expect(session).toMatchObject({ total: 3, bead: 3, rounds: 0, pending: 3 })
  })

  it('tròn chuỗi đúng ở hạt cuối và quay về hạt mẫu', () => {
    const { session, completions } = tapTimes(21 * 2 + 5, 21)
    expect(completions).toEqual([21, 42])
    expect(session).toMatchObject({ total: 47, bead: 5, rounds: 2 })
  })

  it('ghi nhận thời điểm bắt đầu ở hạt đầu tiên', () => {
    const { session } = tapTimes(2, 27, 5000)
    expect(session.startedAt).toBe(5000)
    expect(session.lastAt).toBe(6000)
  })

  it('chỉ tính tối đa IDLE_CAP_MS cho một khoảng nghỉ dài', () => {
    let s = stepSession(createSession(), 108, 0).session
    s = stepSession(s, 108, 2000).session
    s = stepSession(s, 108, 2000 + 10 * 60_000).session
    expect(s.activeMs).toBe(2000 + IDLE_CAP_MS)
    expect(sessionSeconds(s)).toBe(62)
  })
})

describe('đặt lại và đổi chuỗi', () => {
  it('đặt lại chuỗi giữ nguyên tổng và số vòng', () => {
    const { session } = tapTimes(30, 27)
    const r = resetChain(session)
    expect(r).toMatchObject({ total: 30, rounds: 1, bead: 0, pending: 30 })
  })

  it('không tạo object mới khi đang ở hạt mẫu', () => {
    const s = createSession()
    expect(resetChain(s)).toBe(s)
  })

  it('đổi sang chuỗi ngắn hơn vị trí hiện tại thì về hạt mẫu', () => {
    const { session } = tapTimes(60, 108)
    expect(resizeChain(session, 54).bead).toBe(0)
    expect(resizeChain(session, 108)).toBe(session)
  })
})

describe('drainPending', () => {
  it('trả về số câu chờ và xả hàng chờ', () => {
    const { session } = tapTimes(7, 108)
    const r = drainPending(session)
    expect(r.amount).toBe(7)
    expect(r.session.pending).toBe(0)
    expect(r.session.total).toBe(7)
  })

  it('không làm gì khi không có số chờ', () => {
    const s = createSession()
    expect(drainPending(s)).toEqual({ amount: 0, session: s })
  })
})

describe('isStale', () => {
  it('phiên bỏ dở quá lâu được coi là cũ', () => {
    const s = { ...createSession(), lastAt: 1000 }
    expect(isStale(s, 1000 + STALE_AFTER_MS + 1)).toBe(true)
    expect(isStale(s, 1000 + 60_000)).toBe(false)
    expect(isStale(createSession(), Date.now())).toBe(false)
  })
})

describe('crossedGoal', () => {
  it('chỉ đúng khi vừa vượt mục tiêu', () => {
    expect(crossedGoal(1079, 1080, 1080)).toBe(true)
    expect(crossedGoal(1080, 1081, 1080)).toBe(false)
    expect(crossedGoal(10, 20, 1080)).toBe(false)
    expect(crossedGoal(0, 5, 0)).toBe(false)
  })
})

describe('nhịp mõ', () => {
  it('giới hạn BPM trong khoảng cho phép', () => {
    expect(clampBpm(10)).toBe(BPM_MIN)
    expect(clampBpm(500)).toBe(BPM_MAX)
    expect(clampBpm('75')).toBe(75)
    expect(clampBpm('abc')).toBe(60)
  })

  it('tính khoảng cách giữa hai nhịp', () => {
    expect(beatInterval(60)).toBe(1000)
    expect(beatInterval(120)).toBe(500)
    expect(beatInterval(5)).toBe(2000)
  })
})
