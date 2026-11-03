import { describe, expect, it } from 'vitest'
import { appendNote, humanDuration, recentThienSessions, shouldRecord, weekSummary } from './summary'

describe('shouldRecord', () => {
  it('chỉ ghi nhận buổi ngồi từ 1 phút', () => {
    expect(shouldRecord(59)).toBe(false)
    expect(shouldRecord(60)).toBe(true)
  })
})

describe('humanDuration', () => {
  it('đọc thân thiện', () => {
    expect(humanDuration(45)).toBe('45 giây')
    expect(humanDuration(60)).toBe('1 phút')
    expect(humanDuration(15 * 60 + 30)).toBe('15 phút')
    expect(humanDuration(3600)).toBe('1 giờ')
    expect(humanDuration(3900)).toBe('1 giờ 05 phút')
    expect(humanDuration(-3)).toBe('0 giây')
  })
})

describe('recentThienSessions', () => {
  it('chỉ lấy phiên thiền, giữ thứ tự, giới hạn số lượng', () => {
    const sessions = [
      { id: 'a', type: 'thien' },
      { id: 'b', type: 'niem' },
      { id: 'c', type: 'thien' },
      { id: 'd', type: 'thien' },
    ]
    expect(recentThienSessions(sessions, 2).map((s) => s.id)).toEqual(['a', 'c'])
    expect(recentThienSessions(undefined)).toEqual([])
  })
})

describe('weekSummary', () => {
  it('tổng, số ngày có ngồi và giá trị lớn nhất', () => {
    const pts = [0, 10, 0, 25, 5, 0, 15].map((value, i) => ({ key: String(i), value }))
    expect(weekSummary(pts)).toEqual({ total: 55, activeDays: 4, max: 25 })
  })
})

describe('appendNote', () => {
  const at = new Date(2026, 10, 2, 5, 30)

  it('ghi chú đầu tiên trong ngày', () => {
    expect(appendNote('', 'Tâm lắng dịu', { at, sec: 900 })).toBe('[05:30 · Thiền 15 phút] Tâm lắng dịu')
  })

  it('nối thêm, không ghi đè ghi chú cũ', () => {
    const out = appendNote('Sáng nay đi chùa.\n', 'Ngồi yên được lâu', { at, sec: 600 })
    expect(out).toBe('Sáng nay đi chùa.\n[05:30 · Thiền 10 phút] Ngồi yên được lâu')
  })

  it('nội dung trống thì giữ nguyên', () => {
    expect(appendNote('cũ', '   ', { at })).toBe('cũ')
    expect(appendNote(undefined, '', { at })).toBe('')
  })
})
