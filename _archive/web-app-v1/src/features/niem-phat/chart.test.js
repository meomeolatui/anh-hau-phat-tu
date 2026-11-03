import { describe, expect, it } from 'vitest'
import { chartScale, countNiemSessions, dayLabel, recentNiemSessions, weekSummary } from './chart'

const data = (values) => values.map((value, i) => ({ key: `2026-11-0${i + 1}`, value }))

describe('chartScale', () => {
  it('vẽ đường mục tiêu khi số liệu đủ gần', () => {
    expect(chartScale(data([500, 1200]), 1080)).toEqual({ max: 1200 * 1.08, showGoal: true })
    expect(chartScale(data([500, 600]), 1080).showGoal).toBe(true)
  })

  it('ẩn đường mục tiêu khi số liệu còn quá thấp', () => {
    expect(chartScale(data([10, 20]), 1080)).toEqual({ max: 20 * 1.08, showGoal: false })
  })

  it('không chia cho 0 khi chưa có số liệu', () => {
    expect(chartScale(data([0, 0]), 0).max).toBeGreaterThan(0)
  })
})

describe('weekSummary', () => {
  it('tính tổng và trung bình trên những ngày có niệm', () => {
    expect(weekSummary(data([0, 100, 0, 300]))).toEqual({ total: 400, activeDays: 2, average: 200 })
    expect(weekSummary(data([0, 0]))).toEqual({ total: 0, activeDays: 0, average: 0 })
  })
})

describe('phiên gần đây', () => {
  const sessions = [
    { id: 'a', type: 'niem' },
    { id: 'b', type: 'thien' },
    { id: 'c', type: 'niem' },
    { id: 'd', type: 'niem' },
  ]
  it('chỉ lấy phiên niệm Phật, giữ thứ tự mới → cũ', () => {
    expect(recentNiemSessions(sessions, 2).map((s) => s.id)).toEqual(['a', 'c'])
    expect(countNiemSessions(sessions)).toBe(3)
  })
})

describe('dayLabel', () => {
  it('gọi tên hôm nay / hôm qua / ngày cụ thể', () => {
    expect(dayLabel(new Date(2026, 10, 2, 9), '2026-11-02')).toBe('Hôm nay')
    expect(dayLabel(new Date(2026, 10, 1, 21), '2026-11-02')).toBe('Hôm qua')
    expect(dayLabel(new Date(2026, 9, 20), '2026-11-02')).toBe('20/10')
    expect(dayLabel(new Date(2025, 9, 20), '2026-11-02')).toBe('20/10/2025')
  })
})
