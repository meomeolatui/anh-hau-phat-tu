import { describe, expect, it } from 'vitest'
import { suggestFor } from './suggest'

const goals = { niem: 1080, thienMin: 15, thienHanh: 1 }
const day = (patch = {}) => ({ niem: 0, thienMin: 0, tung: 0, thienHanh: [], ...patch })
const doneDay = day({ niem: 1080, thienMin: 15, thienHanh: [{ id: 'a' }] })
const via = { id: 'phat-dan', short: 'Phật Đản', desc: 'Đại lễ.' }

describe('suggestFor', () => {
  it('ngày vía luôn được ưu tiên, gợi ý tụng kinh', () => {
    const s = suggestFor({ hour: 21, day: doneDay, goals, holidays: [via] })
    expect(s.id).toBe('ngay-via')
    expect(s.to).toBe('/kinh')
    expect(s.title).toContain('Phật Đản')
  })

  it('sáng sớm chưa thiền → gợi ý thiền', () => {
    expect(suggestFor({ hour: 6, day: day(), goals }).id).toBe('thien-sang')
  })

  it('sáng sớm đã thiền đủ → không lặp lại gợi ý thiền', () => {
    expect(suggestFor({ hour: 6, day: day({ thienMin: 20 }), goals }).id).toBe('niem-phat')
  })

  it('buổi tối chưa có việc lành → gợi ý tự vấn', () => {
    expect(suggestFor({ hour: 21, day: day(), goals })).toMatchObject({ id: 'tu-van', to: '/nhat-ky' })
  })

  it('buổi tối đã có việc lành → gợi ý hồi hướng', () => {
    expect(suggestFor({ hour: 21, day: doneDay, goals }).id).toBe('hoi-huong')
  })

  it('đêm khuya → nhắc nghỉ ngơi', () => {
    expect(suggestFor({ hour: 1, day: day(), goals }).id).toBe('dem-khuya')
  })

  it('mùng Một/Rằm ban ngày → gợi ý đi chùa', () => {
    expect(suggestFor({ hour: 14, day: day(), goals, socVong: true }).to).toBe('/hanh-huong')
  })

  it('ban ngày chưa niệm đủ → gợi ý niệm Phật', () => {
    expect(suggestFor({ hour: 14, day: day(), goals }).id).toBe('niem-phat')
  })

  it('ngày chay khi đã niệm đủ → nhắc ăn chay', () => {
    expect(suggestFor({ hour: 12, day: day({ niem: 2000 }), goals, fasting: true }).id).toBe('an-chay')
  })

  it('còn thiếu thiện hạnh → gợi ý việc lành', () => {
    expect(suggestFor({ hour: 15, day: day({ niem: 2000, thienMin: 20 }), goals }).id).toBe('thien-hanh')
  })

  it('còn thiếu thiền ban ngày → gợi ý thiền', () => {
    expect(suggestFor({ hour: 15, day: day({ niem: 2000, thienHanh: [{ id: 'a' }] }), goals }).id).toBe('thien')
  })

  it('đã tròn thời khoá → gợi ý học Phật', () => {
    expect(suggestFor({ hour: 15, day: doneDay, goals }).to).toBe('/hoc-phat')
  })

  it('không có nhật ký ngày vẫn chạy được', () => {
    expect(suggestFor({ hour: 15, day: undefined, goals }).id).toBe('niem-phat')
  })
})
