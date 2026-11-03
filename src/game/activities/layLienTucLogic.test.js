import { describe, expect, it } from 'vitest'
import { AUTO_BOW_MS, BOWS_PER_XU, bowsAfter, xuGained } from './layLienTucLogic'
import { poseFor } from '../player/avatarRig'

describe('lạy liên tục', () => {
  it('đếm lạy theo thời gian thật, lạy dở chưa tính', () => {
    expect(bowsAfter(0)).toBe(0)
    expect(bowsAfter(AUTO_BOW_MS - 1)).toBe(0)
    expect(bowsAfter(AUTO_BOW_MS * 7 + 10)).toBe(7)
  })

  it('3 lạy được 1 xu, kể cả khi nhảy nhiều lạy một lúc (chuyển tab rồi quay lại)', () => {
    expect(BOWS_PER_XU).toBe(3)
    expect(xuGained(0, 2)).toBe(0)
    expect(xuGained(2, 3)).toBe(1)
    expect(xuGained(3, 5)).toBe(0)
    expect(xuGained(5, 15)).toBe(4)
  })

  it('nhịp đếm khớp đúng một chu kỳ tư thế lạy (đứng thẳng ở đầu & cuối chu kỳ)', () => {
    const s = AUTO_BOW_MS / 1000
    expect(poseFor('bow', 0).rootY).toBeCloseTo(0)
    expect(poseFor('bow', s * 0.5).torsoPitch).toBeGreaterThan(1)
    expect(poseFor('bow', s - 1e-6).rootY).toBeCloseTo(0, 3)
  })
})
