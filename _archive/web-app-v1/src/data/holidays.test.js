import { describe, expect, it } from 'vitest'
import { holidaysOn, isFastingDay, upcomingFastingDays, upcomingHolidays } from './holidays'
import { getLunarDate } from '../lib/lunar'

describe('holidays', () => {
  it('nhận ra Phật Đản 15/4', () => {
    const l = getLunarDate(new Date(2025, 4, 12))
    expect(holidaysOn(l).map((h) => h.id)).toEqual(['phat-dan'])
  })

  it('không tính ngày vía trong tháng nhuận', () => {
    // 19/6 nhuận năm 2025
    const l = getLunarDate(new Date(2025, 7, 12))
    expect(l.leap).toBe(true)
    expect(l.day).toBe(19)
    expect(holidaysOn(l)).toEqual([])
  })

  it('ngày chay nhị trai là mùng 1 và rằm', () => {
    expect(isFastingDay({ day: 1, month: 3, year: 2026, leap: false }, 'nhi-trai')).toBe(true)
    expect(isFastingDay({ day: 14, month: 3, year: 2026, leap: false }, 'nhi-trai')).toBe(false)
    expect(isFastingDay({ day: 14, month: 3, year: 2026, leap: false }, 'tu-trai')).toBe(true)
    expect(isFastingDay({ day: 1, month: 3, year: 2026, leap: false }, 'none')).toBe(false)
  })

  it('liệt kê ngày lễ sắp tới theo thứ tự thời gian', () => {
    const list = upcomingHolidays(new Date(2025, 0, 1), 3)
    expect(list).toHaveLength(3)
    // 8/12 năm Giáp Thìn (Phật thành đạo) rơi trước Tết Ất Tỵ 29/01/2025
    expect(list.map((h) => h.id)).toEqual(['thanh-dao', 'di-lac', 'thuong-nguyen'])
    expect(list[1].daysLeft).toBe(28)
    expect(getLunarDate(list[0].date)).toMatchObject({ day: 8, month: 12 })
  })

  it('liệt kê ngày chay sắp tới', () => {
    const list = upcomingFastingDays('nhi-trai', new Date(2026, 1, 17), 2)
    expect(list[0].daysLeft).toBe(0)
    expect(list[1].lunar.day).toBe(15)
  })
})
