import { describe, expect, it } from 'vitest'
import {
  addMonthsKey,
  buildMonthGrid,
  daysInMonth,
  isKeyInRange,
  keyAfterNavigation,
  monthOfKey,
  selectionForMonth,
  shiftMonth,
  weekdayIndex,
} from './month-grid'

describe('buildMonthGrid', () => {
  it('luôn trả về 6 tuần × 7 ngày, bắt đầu từ Thứ Hai', () => {
    const grid = buildMonthGrid(2026, 10) // tháng 11/2026
    expect(grid).toHaveLength(6)
    for (const week of grid) {
      expect(week).toHaveLength(7)
      expect(weekdayIndex(week[0].date)).toBe(0)
      expect(week[0].date.getDay()).toBe(1)
    }
  })

  it('01/11/2026 là Chủ nhật nên nằm ở cột cuối tuần đầu tiên', () => {
    const grid = buildMonthGrid(2026, 10)
    expect(grid[0][6]).toMatchObject({ key: '2026-11-01', day: 1, inMonth: true })
    expect(grid[0][0]).toMatchObject({ key: '2026-10-26', inMonth: false })
  })

  it('đánh dấu inMonth đúng số ngày của tháng', () => {
    const cells = buildMonthGrid(2024, 1).flat() // tháng 2/2024 nhuận
    expect(cells.filter((c) => c.inMonth)).toHaveLength(29)
    expect(cells.filter((c) => c.inMonth)[0].key).toBe('2024-02-01')
  })

  it('tháng bắt đầu đúng Thứ Hai thì ô đầu tiên là ngày 1', () => {
    const grid = buildMonthGrid(2026, 5) // 01/06/2026 là Thứ Hai
    expect(grid[0][0]).toMatchObject({ key: '2026-06-01', inMonth: true })
  })

  it('các ngày liên tiếp, không trùng lặp', () => {
    const keys = buildMonthGrid(2026, 2)
      .flat()
      .map((c) => c.key)
    expect(new Set(keys).size).toBe(42)
  })
})

describe('shiftMonth & daysInMonth', () => {
  it('qua năm khi cộng/trừ tháng', () => {
    expect(shiftMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 })
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 })
    expect(shiftMonth({ year: 2026, month: 5 }, -18)).toEqual({ year: 2024, month: 11 })
    expect(shiftMonth({ year: 2026, month: 5 }, 0)).toEqual({ year: 2026, month: 5 })
  })

  it('đếm đúng số ngày, kể cả năm nhuận', () => {
    expect(daysInMonth(2024, 1)).toBe(29)
    expect(daysInMonth(2026, 1)).toBe(28)
    expect(daysInMonth(2026, 10)).toBe(30)
  })

  it('monthOfKey trả về tháng 0..11', () => {
    expect(monthOfKey('2026-11-02')).toEqual({ year: 2026, month: 10 })
  })
})

describe('selectionForMonth', () => {
  it('chọn hôm nay nếu tháng chứa hôm nay', () => {
    expect(selectionForMonth({ year: 2026, month: 10 }, '2026-09-20', '2026-11-02')).toBe('2026-11-02')
  })

  it('giữ số ngày và kẹp vào cuối tháng', () => {
    expect(selectionForMonth({ year: 2026, month: 1 }, '2026-01-31', '2026-11-02')).toBe('2026-02-28')
    expect(selectionForMonth({ year: 2026, month: 3 }, '2026-01-12', '2026-11-02')).toBe('2026-04-12')
  })
})

describe('điều hướng bàn phím', () => {
  it('mũi tên di chuyển theo ngày và tuần, kể cả qua tháng', () => {
    expect(keyAfterNavigation('2026-11-01', 'ArrowLeft')).toBe('2026-10-31')
    expect(keyAfterNavigation('2026-11-30', 'ArrowRight')).toBe('2026-12-01')
    expect(keyAfterNavigation('2026-11-02', 'ArrowUp')).toBe('2026-10-26')
    expect(keyAfterNavigation('2026-11-28', 'ArrowDown')).toBe('2026-12-05')
  })

  it('Home/End về đầu/cuối tuần (Thứ Hai → Chủ nhật)', () => {
    expect(keyAfterNavigation('2026-11-05', 'Home')).toBe('2026-11-02')
    expect(keyAfterNavigation('2026-11-05', 'End')).toBe('2026-11-08')
  })

  it('PageUp/PageDown đổi tháng, Shift đổi năm', () => {
    expect(keyAfterNavigation('2026-03-31', 'PageUp')).toBe('2026-02-28')
    expect(keyAfterNavigation('2026-11-02', 'PageDown')).toBe('2026-12-02')
    expect(keyAfterNavigation('2024-02-29', 'PageDown', true)).toBe('2025-02-28')
  })

  it('bỏ qua phím không liên quan', () => {
    expect(keyAfterNavigation('2026-11-02', 'a')).toBeNull()
    expect(keyAfterNavigation('2026-11-02', 'Enter')).toBeNull()
  })

  it('addMonthsKey kẹp ngày cuối tháng', () => {
    expect(addMonthsKey('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonthsKey('2026-12-15', 1)).toBe('2027-01-15')
  })

  it('isKeyInRange chặn năm ngoài khoảng hỗ trợ', () => {
    expect(isKeyInRange('2026-11-02')).toBe(true)
    expect(isKeyInRange('1899-12-31')).toBe(false)
    expect(isKeyInRange('2101-01-01')).toBe(false)
  })
})
