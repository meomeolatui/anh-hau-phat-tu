import { describe, expect, it } from 'vitest'
import { elapsedMs, isRunning, pauseClock, resumeClock, startClock } from './clock'

describe('đồng hồ theo mốc thời gian', () => {
  it('đếm theo Date.now chứ không theo số lần tick', () => {
    const c = startClock(1000)
    expect(elapsedMs(c, 1000)).toBe(0)
    expect(elapsedMs(c, 61000)).toBe(60000)
  })

  it('tạm dừng thì đóng băng thời gian', () => {
    const c = pauseClock(startClock(0), 5000)
    expect(isRunning(c)).toBe(false)
    expect(elapsedMs(c, 999999)).toBe(5000)
  })

  it('tiếp tục cộng dồn sau khi tạm dừng', () => {
    let c = startClock(0)
    c = pauseClock(c, 10000)
    c = resumeClock(c, 50000)
    expect(elapsedMs(c, 55000)).toBe(15000)
  })

  it('tạm dừng/tiếp tục hai lần không làm sai lệch', () => {
    let c = startClock(0)
    c = pauseClock(c, 1000)
    c = pauseClock(c, 9000)
    c = resumeClock(c, 10000)
    c = resumeClock(c, 20000)
    expect(elapsedMs(c, 12000)).toBe(3000)
  })

  it('đồng hồ bị lùi giờ thì không âm', () => {
    expect(elapsedMs(startClock(5000), 1000)).toBe(0)
    expect(elapsedMs(null, 1000)).toBe(0)
  })
})
