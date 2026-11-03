import { afterEach, describe, expect, it } from 'vitest'
import { __ambienceRunning, ambienceEnabled, ambienceMix, nextCallDelay, setAmbienceTime, startAmbience, stopAmbience } from './ambience'

describe('Âm thanh nền', () => {
  afterEach(() => stopAmbience())

  it('ban ngày có chim, ban đêm có dế', () => {
    const noon = ambienceMix(8)
    const night = ambienceMix(22)
    expect(noon.birds).toBeGreaterThan(0.8)
    expect(noon.crickets).toBeLessThan(0.05)
    expect(night.birds).toBe(0)
    expect(night.crickets).toBeGreaterThan(0.95)
    expect(ambienceMix(2).crickets).toBeGreaterThan(0.95)
  })

  it('chim hót buổi sáng rộn hơn buổi chiều; gió luôn có', () => {
    expect(ambienceMix(7.5).birds).toBeGreaterThan(ambienceMix(15).birds)
    for (const h of [0, 6, 12, 18, 23.9, -1, 30]) {
      const m = ambienceMix(h)
      expect(m.wind).toBeGreaterThan(0.5)
      expect(m.birds).toBeGreaterThanOrEqual(0)
      expect(m.crickets).toBeLessThanOrEqual(1)
    }
  })

  it('chỉ bật khi cả âm thanh và nhạc nền đều bật', () => {
    expect(ambienceEnabled({ sound: true, music: true })).toBe(true)
    expect(ambienceEnabled({ sound: false, music: true })).toBe(false)
    expect(ambienceEnabled({ sound: true, music: false })).toBe(false)
    expect(ambienceEnabled(null)).toBe(false)
  })

  it('khoảng nghỉ giữa các tiếng gọi nằm trong giới hạn', () => {
    expect(nextCallDelay('bird', () => 0)).toBe(2200)
    expect(nextCallDelay('bird', () => 0.999)).toBeLessThan(8300)
    expect(nextCallDelay('cricket', () => 0.5)).toBeCloseTo(1150)
  })

  it('bật/tắt an toàn khi trình duyệt không có Web Audio', () => {
    startAmbience()
    startAmbience()
    expect(__ambienceRunning()).toBe(true)
    setAmbienceTime(21)
    stopAmbience()
    expect(__ambienceRunning()).toBe(false)
  })
})
