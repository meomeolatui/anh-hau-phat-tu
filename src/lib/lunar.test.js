import { describe, expect, it } from 'vitest'
import { getLunarDate, lunarMonthLength, lunarToDate, nextLunarOccurrence, solarToLunar } from './lunar'

describe('lunar — đổi dương lịch sang âm lịch', () => {
  it.each([
    [10, 2, 2024, [1, 1, 2024, 0]], // Tết Giáp Thìn
    [29, 1, 2025, [1, 1, 2025, 0]], // Tết Ất Tỵ
    [17, 2, 2026, [1, 1, 2026, 0]], // Tết Bính Ngọ
    [12, 5, 2025, [15, 4, 2025, 0]], // Phật Đản 2025
    [6, 9, 2025, [15, 7, 2025, 0]], // Vu Lan 2025
    [25, 6, 2025, [1, 6, 2025, 0]],
    [25, 7, 2025, [1, 6, 2025, 1]], // tháng 6 nhuận năm Ất Tỵ
    [22, 3, 2023, [1, 2, 2023, 1]], // tháng 2 nhuận năm Quý Mão
  ])('%i/%i/%i → %j', (d, m, y, expected) => {
    expect(solarToLunar(d, m, y)).toEqual(expected)
  })

  it('trả về can chi của ngày, tháng, năm', () => {
    const l = getLunarDate(new Date(2024, 1, 10))
    expect(l.yearName).toBe('Giáp Thìn')
    expect(l.dayName).toBe('Giáp Thìn')
    expect(l.monthLabel).toBe('tháng Giêng')
  })

  it('đánh dấu tháng nhuận trong nhãn', () => {
    expect(getLunarDate(new Date(2025, 6, 25)).monthLabel).toBe('tháng Sáu (nhuận)')
  })
})

describe('lunar — đổi âm lịch sang dương lịch', () => {
  it('ra đúng ngày Tết', () => {
    expect(lunarToDate(1, 1, 2026)).toEqual(new Date(2026, 1, 17))
  })

  it('phân biệt tháng nhuận', () => {
    expect(lunarToDate(1, 6, 2025, true)).toEqual(new Date(2025, 6, 25))
    expect(lunarToDate(1, 6, 2025, false)).toEqual(new Date(2025, 5, 25))
  })

  it('trả về null khi tháng nhuận không tồn tại', () => {
    expect(lunarToDate(1, 3, 2025, true)).toBeNull()
  })

  it('khứ hồi dương → âm → dương cho cả năm', () => {
    for (let i = 0; i < 400; i += 3) {
      const d = new Date(2026, 0, 1 + i)
      const l = getLunarDate(d)
      expect(lunarToDate(l.day, l.month, l.year, l.leap)).toEqual(d)
    }
  })

  it('độ dài tháng âm là 29 hoặc 30', () => {
    for (let m = 1; m <= 12; m++) expect([29, 30]).toContain(lunarMonthLength(m, 2026))
  })
})

describe('nextLunarOccurrence', () => {
  it('tìm lần tới của rằm tháng Bảy', () => {
    expect(nextLunarOccurrence(15, 7, new Date(2025, 0, 1))).toEqual(new Date(2025, 8, 6))
  })

  it('tính cả ngày hôm nay', () => {
    expect(nextLunarOccurrence(15, 4, new Date(2025, 4, 12))).toEqual(new Date(2025, 4, 12))
  })

  it('sang năm sau nếu năm nay đã qua', () => {
    const d = nextLunarOccurrence(1, 1, new Date(2025, 5, 1))
    expect(d).toEqual(new Date(2026, 1, 17))
  })
})
