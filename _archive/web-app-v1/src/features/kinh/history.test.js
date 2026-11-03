import { describe, expect, it } from 'vitest'
import { relativeDayLabel, suggestByHour, tungStats } from './history'
import { getSutra } from '../../data/sutras'

const now = new Date(2026, 10, 2, 20, 0)
const iso = (y, m, d, h = 9) => new Date(y, m, d, h).toISOString()

describe('tungStats', () => {
  it('chỉ đếm phiên tụng kinh và gom theo bài', () => {
    const sessions = [
      { type: 'tung', ref: 'a', at: iso(2026, 10, 2), duration: 120 },
      { type: 'tung', ref: 'a', at: iso(2026, 10, 1), duration: 60 },
      { type: 'tung', ref: 'b', at: iso(2026, 9, 20), duration: 30 },
      { type: 'thien', ref: null, at: iso(2026, 10, 2), duration: 600 },
      { type: 'tung', ref: null, at: 'không phải ngày', duration: 5 },
    ]
    const s = tungStats(sessions, now)
    expect(s).toMatchObject({ today: 1, week: 2, total: 3, seconds: 210 })
    expect(s.byId.a).toEqual({ count: 2, last: iso(2026, 10, 2) })
    expect(s.byId.b.count).toBe(1)
  })
  it('an toàn với dữ liệu rỗng', () => {
    expect(tungStats(undefined, now)).toEqual({ today: 0, week: 0, total: 0, seconds: 0, byId: {} })
  })
})

describe('relativeDayLabel', () => {
  it('hiển thị ngày tương đối thân thiện', () => {
    expect(relativeDayLabel(iso(2026, 10, 2), now)).toBe('hôm nay')
    expect(relativeDayLabel(iso(2026, 10, 1), now)).toBe('hôm qua')
    expect(relativeDayLabel(iso(2026, 9, 30), now)).toBe('3 ngày trước')
    expect(relativeDayLabel(iso(2026, 9, 2), now)).toBe('02/10')
    expect(relativeDayLabel('sai', now)).toBe('')
  })
})

describe('suggestByHour', () => {
  it('gợi ý bài phù hợp từng buổi và luôn trỏ tới bài có thật', () => {
    expect(suggestByHour(5).id).toBe('muoi-niem-buoi-sang')
    expect(suggestByHour(12).id).toBe('bat-nha-tam-kinh')
    expect(suggestByHour(19).id).toBe('nghi-thuc-niem-phat')
    expect(suggestByHour(23).id).toBe('kinh-tu-bi')
    expect(suggestByHour(2).id).toBe('kinh-tu-bi')
    for (let h = 0; h < 24; h++) expect(getSutra(suggestByHour(h).id)).toBeTruthy()
  })
})
