import { describe, expect, it } from 'vitest'
import { bellSchedule, dueBells, promptIndex } from './schedule'

describe('bellSchedule', () => {
  it('chuông mỗi 5 phút cho buổi 20 phút, không trùng chuông kết thúc', () => {
    expect(bellSchedule(20 * 60, 5)).toEqual([300, 600, 900])
  })

  it('buổi lẻ phút vẫn đúng', () => {
    expect(bellSchedule(23 * 60, 10)).toEqual([600, 1200])
  })

  it('tắt chuông nhắc hoặc buổi ngắn hơn khoảng nhắc thì rỗng', () => {
    expect(bellSchedule(30 * 60, 0)).toEqual([])
    expect(bellSchedule(4 * 60, 5)).toEqual([])
    expect(bellSchedule(5 * 60, 5)).toEqual([])
    expect(bellSchedule(0, 5)).toEqual([])
  })
})

describe('dueBells', () => {
  const schedule = [300, 600, 900]

  it('chỉ báo mốc vừa đi qua', () => {
    expect(dueBells(schedule, 299, 300)).toEqual([300])
    expect(dueBells(schedule, 300, 301)).toEqual([])
  })

  it('tab ẩn lâu thì có thể vượt nhiều mốc', () => {
    expect(dueBells(schedule, 100, 950)).toEqual([300, 600, 900])
  })

  it('thời gian không tiến thì không có chuông', () => {
    expect(dueBells(schedule, 600, 600)).toEqual([])
    expect(dueBells(schedule, 700, 500)).toEqual([])
  })
})

describe('promptIndex', () => {
  it('đổi câu theo chu kỳ và quay vòng', () => {
    expect(promptIndex(0, 3, 100)).toBe(0)
    expect(promptIndex(99, 3, 100)).toBe(0)
    expect(promptIndex(100, 3, 100)).toBe(1)
    expect(promptIndex(300, 3, 100)).toBe(0)
  })

  it('áp dụng độ lệch bắt đầu', () => {
    expect(promptIndex(0, 4, 100, 3)).toBe(3)
    expect(promptIndex(100, 4, 100, 3)).toBe(0)
  })

  it('danh sách rỗng trả -1', () => {
    expect(promptIndex(50, 0)).toBe(-1)
  })
})
