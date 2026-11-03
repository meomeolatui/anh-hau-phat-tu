import { describe, expect, it } from 'vitest'
import { countdownLabel, lunarHeading, recentDays, todayBadges } from './today'
import { getLunarDate, lunarToDate } from '../../lib/lunar'

const day = (patch = {}) => ({ niem: 0, thienMin: 0, tung: 0, thienHanh: [], ...patch })

describe('lunarHeading', () => {
  it('ghép ngày, tên tháng và năm can chi', () => {
    const lunar = { day: 12, monthLabel: 'tháng Chín', yearName: 'Bính Ngọ' }
    expect(lunarHeading(lunar)).toBe('Ngày 12 tháng Chín năm Bính Ngọ')
  })
})

describe('recentDays', () => {
  const logs = { '2026-11-01': day({ niem: 10 }), '2026-11-02': day(), '2026-10-27': day({ thienMin: 5 }) }
  const strip = recentDays(logs, '2026-11-02')

  it('trả về 7 ngày, cũ đến mới, kết thúc ở hôm nay', () => {
    expect(strip).toHaveLength(7)
    expect(strip[0].key).toBe('2026-10-27')
    expect(strip[6]).toMatchObject({ key: '2026-11-02', isToday: true, active: false })
  })

  it('đánh dấu ngày có tu tập', () => {
    expect(strip.filter((d) => d.active).map((d) => d.key)).toEqual(['2026-10-27', '2026-11-01'])
  })

  it('ghi thứ trong tuần', () => {
    // 02/11/2026 là thứ Hai
    expect(strip[6].weekday).toBe('T2')
    expect(strip[6].dayOfMonth).toBe(2)
  })
})

describe('countdownLabel', () => {
  it('hôm nay, ngày mai, còn N ngày', () => {
    expect(countdownLabel(0)).toBe('Hôm nay')
    expect(countdownLabel(1)).toBe('Ngày mai')
    expect(countdownLabel(12)).toBe('Còn 12 ngày')
  })
})

describe('todayBadges', () => {
  it('Rằm tháng Tư: Phật Đản + Rằm + ngày chay', () => {
    const lunar = getLunarDate(lunarToDate(15, 4, 2026))
    const ids = todayBadges(lunar, 'nhi-trai').map((b) => b.id)
    expect(ids).toEqual(['le-phat-dan', 'soc-vong', 'chay'])
  })

  it('không theo dõi chay thì không có nhãn ngày chay', () => {
    const lunar = getLunarDate(lunarToDate(1, 3, 2026))
    expect(todayBadges(lunar, 'none')).toEqual([{ id: 'soc-vong', label: 'Mùng Một', tone: 'lotus' }])
  })

  it('ngày thường không có nhãn', () => {
    const lunar = getLunarDate(lunarToDate(6, 3, 2026))
    expect(todayBadges(lunar, 'nhi-trai')).toEqual([])
  })

  it('nhãn ngày chay ghi tên lối chay ngắn gọn', () => {
    const lunar = getLunarDate(lunarToDate(8, 3, 2026))
    expect(todayBadges(lunar, 'luc-trai')).toEqual([{ id: 'chay', label: 'Ngày chay · Lục trai', tone: 'jade' }])
  })
})
