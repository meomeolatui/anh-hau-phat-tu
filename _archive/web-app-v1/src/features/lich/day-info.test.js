import { describe, expect, it } from 'vitest'
import { cellAriaLabel, cellLunarLabel, describeDay, lunarDayName, lunarLongLabel, relativeDayLabel } from './day-info'
import { lunarToSolarSafe, solarToLunarSafe } from './convert'
import { moonLitPath, moonPhaseFraction } from './moon-phase'

describe('describeDay', () => {
  it('nhận ra Tết Bính Ngọ (17/02/2026) là mùng 1, ngày Sóc, ngày vía và ngày chay nhị trai', () => {
    const info = describeDay(new Date(2026, 1, 17), { fasting: 'nhi-trai', today: '2026-02-17' })
    expect(info.lunar).toMatchObject({ day: 1, month: 1, year: 2026 })
    expect(info.soc).toBe(true)
    expect(info.vong).toBe(false)
    expect(info.socVong).toBe(true)
    expect(info.fasting).toBe(true)
    expect(info.isToday).toBe(true)
    expect(info.holidays.map((h) => h.id)).toEqual(['di-lac'])
  })

  it('đọc hoạt động tu tập từ nhật ký', () => {
    const logs = { '2026-11-02': { niem: 108, thienMin: 0, tung: 0, thienHanh: [] } }
    expect(describeDay(new Date(2026, 10, 2), { logs }).active).toBe(true)
    expect(describeDay(new Date(2026, 10, 3), { logs }).active).toBe(false)
  })

  it('không đánh dấu ngày chay khi không theo dõi', () => {
    expect(describeDay(new Date(2026, 1, 17), { fasting: 'none' }).fasting).toBe(false)
  })
})

describe('nhãn ngày âm', () => {
  it('mùng 1 kèm tháng, tháng nhuận thêm N', () => {
    expect(cellLunarLabel({ day: 1, month: 9, leap: false })).toBe('1/9')
    expect(cellLunarLabel({ day: 1, month: 6, leap: true })).toBe('1/6N')
    expect(cellLunarLabel({ day: 14, month: 9, leap: false })).toBe('14')
  })

  it('gọi tên ngày theo cách nói quen thuộc', () => {
    expect(lunarDayName(1)).toBe('mùng 1')
    expect(lunarDayName(10)).toBe('mùng 10')
    expect(lunarDayName(15)).toBe('rằm')
    expect(lunarDayName(23)).toBe('ngày 23')
  })

  it('nhãn dài có tháng và năm can chi', () => {
    const info = describeDay(new Date(2026, 1, 17))
    expect(lunarLongLabel(info.lunar)).toBe('Mùng 1 tháng Giêng năm Bính Ngọ')
  })

  it('aria-label đọc đủ thông tin', () => {
    const info = describeDay(new Date(2026, 1, 17), { fasting: 'nhi-trai', today: '2026-02-17' })
    const label = cellAriaLabel(info, 'Thứ Ba')
    expect(label).toContain('Thứ Ba, 17 tháng 2 năm 2026')
    expect(label).toContain('âm lịch 1 tháng 1')
    expect(label).toContain('hôm nay')
    expect(label).toContain('Vía Di Lặc')
    expect(label).toContain('ngày chay')
  })

  it('đếm ngược thân thiện', () => {
    expect(relativeDayLabel(0)).toBe('Hôm nay')
    expect(relativeDayLabel(1)).toBe('Ngày mai')
    expect(relativeDayLabel(2)).toBe('Ngày kia')
    expect(relativeDayLabel(12)).toBe('Còn 12 ngày')
    expect(relativeDayLabel(-1)).toBe('Hôm qua')
    expect(relativeDayLabel(-5)).toBe('5 ngày trước')
  })
})

describe('đổi ngày Dương → Âm', () => {
  it('đổi đúng ngày Phật Đản 2025', () => {
    const r = solarToLunarSafe('2025-05-12')
    expect(r.ok).toBe(true)
    expect(r.lunar).toMatchObject({ day: 15, month: 4, year: 2025, leap: false })
  })

  it('báo lỗi khi ngày không tồn tại hoặc bỏ trống', () => {
    expect(solarToLunarSafe('2026-02-30')).toMatchObject({ ok: false })
    expect(solarToLunarSafe('')).toMatchObject({ ok: false })
    expect(solarToLunarSafe('1800-01-01').error).toMatch(/1900/)
  })
})

describe('đổi ngày Âm → Dương', () => {
  it('Tết Bính Ngọ là 17/02/2026', () => {
    const r = lunarToSolarSafe({ day: 1, month: 1, year: 2026 })
    expect(r.ok).toBe(true)
    expect(r.date).toEqual(new Date(2026, 1, 17))
  })

  it('đổi được tháng nhuận có thật (19/6 nhuận 2025 → 12/08/2025)', () => {
    const r = lunarToSolarSafe({ day: 19, month: 6, year: 2025, leap: true })
    expect(r.ok).toBe(true)
    expect(r.date).toEqual(new Date(2025, 7, 12))
    expect(r.lunar.leap).toBe(true)
  })

  it('báo lỗi tháng nhuận không tồn tại', () => {
    expect(lunarToSolarSafe({ day: 1, month: 3, year: 2025, leap: true })).toMatchObject({ ok: false })
    // Năm không nhuận
    const r = lunarToSolarSafe({ day: 1, month: 6, year: 2026, leap: true })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/nhuận/)
  })

  it('báo lỗi ngày 30 trong tháng thiếu', () => {
    // Tìm một tháng thiếu trong năm 2026 để test không phụ thuộc vào dữ liệu cứng
    let shortMonth = 0
    for (let m = 1; m <= 12 && !shortMonth; m++) {
      if (!lunarToSolarSafe({ day: 30, month: m, year: 2026 }).ok) shortMonth = m
    }
    expect(shortMonth).toBeGreaterThan(0)
    const r = lunarToSolarSafe({ day: 30, month: shortMonth, year: 2026 })
    expect(r.error).toMatch(/29 ngày/)
    expect(lunarToSolarSafe({ day: 29, month: shortMonth, year: 2026 }).ok).toBe(true)
  })

  it('kiểm tra giới hạn đầu vào', () => {
    expect(lunarToSolarSafe({ day: 0, month: 1, year: 2026 }).ok).toBe(false)
    expect(lunarToSolarSafe({ day: 31, month: 1, year: 2026 }).ok).toBe(false)
    expect(lunarToSolarSafe({ day: 1, month: 13, year: 2026 }).ok).toBe(false)
    expect(lunarToSolarSafe({ day: 1, month: 1, year: Number.NaN }).ok).toBe(false)
  })
})

describe('pha trăng', () => {
  it('mùng 1 gần như không thấy trăng, rằm gần tròn', () => {
    expect(moonLitPath(1)).toBe('')
    expect(moonPhaseFraction(15)).toBeGreaterThan(0.45)
    expect(moonPhaseFraction(15)).toBeLessThan(0.5)
    expect(moonLitPath(15)).toMatch(/^M 50 10 A 40 40 0 0 1 50 90 A [\d.]+ 40 0 0 1 50 10 Z$/)
  })

  it('trăng khuyết cuối tháng sáng bên trái', () => {
    expect(moonLitPath(26)).toMatch(/A 40 40 0 0 0 50 90 A [\d.]+ 40 0 0 1/)
  })
})
