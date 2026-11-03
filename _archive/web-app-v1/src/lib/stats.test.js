import { describe, expect, it } from 'vitest'
import { currentStreak, intensity, longestStreak, milestones, series, totals } from './stats'
import { DEFAULT_STATE } from './store'

const day = (patch = {}) => ({ niem: 0, thienMin: 0, tung: 0, thienHanh: [], ...patch })

describe('stats', () => {
  const logs = {
    '2026-10-28': day({ niem: 108 }),
    '2026-10-30': day({ thienMin: 10 }),
    '2026-10-31': day({ tung: 1 }),
    '2026-11-01': day({ thienHanh: [{ id: 'a' }] }),
    '2026-11-02': day(),
  }

  it('chuỗi hiện tại vẫn giữ nếu hôm nay chưa tu', () => {
    expect(currentStreak(logs, '2026-11-02')).toBe(3)
  })

  it('chuỗi đứt khi hôm qua không tu', () => {
    expect(currentStreak(logs, '2026-11-03')).toBe(0)
  })

  it('chuỗi dài nhất', () => {
    expect(longestStreak(logs)).toBe(3)
  })

  it('cộng tổng các hoạt động', () => {
    expect(totals(logs)).toEqual({ niem: 108, thienMin: 10, tung: 1, thienHanh: 1, activeDays: 4 })
  })

  it('series đủ số ngày, từ cũ đến mới', () => {
    const s = series(logs, 'niem', 7, '2026-11-02')
    expect(s).toHaveLength(7)
    expect(s[0].key).toBe('2026-10-27')
    expect(s[1]).toEqual({ key: '2026-10-28', value: 108 })
  })

  it('intensity bằng 0 với ngày trống', () => {
    expect(intensity(day(), DEFAULT_STATE.profile.goals)).toBe(0)
    expect(intensity(day({ niem: 1080, thienMin: 15, thienHanh: [{}] }), DEFAULT_STATE.profile.goals)).toBe(4)
  })

  it('milestones phản ánh tiến độ', () => {
    const m = milestones({ ...DEFAULT_STATE, logs })
    expect(m.find((x) => x.id === 'khoi-tam').achieved).toBe(true)
    expect(m.find((x) => x.id === 'bay-ngay').progress).toBeCloseTo(3 / 7)
  })
})
