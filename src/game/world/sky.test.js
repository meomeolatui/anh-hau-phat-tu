import { describe, expect, it } from 'vitest'
import { lightDirection, moonDirection, skyAt, sunDisplayDirection } from './sky'

const HOURS = Array.from({ length: 97 }, (_, i) => i / 4)

describe('bầu trời theo giờ', () => {
  it('ánh sáng chính luôn chiếu từ trên xuống (kể cả ban đêm)', () => {
    for (const h of HOURS) {
      const [x, y, z] = lightDirection(h)
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 5)
      expect(y).toBeGreaterThan(0.1)
    }
  })

  it('mặt trăng luôn ở trên chân trời, mọc đông lặn tây', () => {
    for (const h of HOURS) expect(moonDirection(h)[1]).toBeGreaterThan(0.2)
    expect(moonDirection(19)[0]).toBeGreaterThan(0)
    expect(moonDirection(5)[0]).toBeLessThan(0)
  })

  it('đĩa mặt trời hiển thị thấp (≤ ~20°) để thấy được trong khung hình, mọc đông lặn tây', () => {
    for (let h = 6.5; h <= 17.5; h += 0.5) {
      const [x, y] = sunDisplayDirection(h)
      expect(y).toBeGreaterThan(0)
      expect(Math.asin(y)).toBeLessThan(0.6)
      if (h < 11) expect(x).toBeGreaterThan(0)
      if (h > 13) expect(x).toBeLessThan(0)
    }
  })

  it('sương sớm dày nhất lúc rạng đông, mỏng giữa trưa, luôn trong [0,1]', () => {
    for (const h of HOURS) {
      const m = skyAt(h).mist
      expect(m).toBeGreaterThanOrEqual(0)
      expect(m).toBeLessThanOrEqual(1)
    }
    expect(skyAt(6).mist).toBeGreaterThan(skyAt(12).mist)
  })

  it('có màu đất cho ánh sáng bán cầu', () => {
    expect(skyAt(12).ground).toMatch(/^#[0-9a-f]{6}$/)
  })
})
