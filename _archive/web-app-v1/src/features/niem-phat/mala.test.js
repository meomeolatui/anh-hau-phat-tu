import { describe, expect, it } from 'vitest'
import { BEAD_SIZES, VIEW, beadLayout, beadState, isBeadSize } from './mala'

describe('beadLayout', () => {
  it.each(BEAD_SIZES)('xếp đủ %i hạt trên cùng một vòng tròn', (size) => {
    const { beads, center, radius } = beadLayout(size)
    expect(beads).toHaveLength(size)
    for (const b of beads) {
      expect(Math.hypot(b.x - center, b.y - center)).toBeCloseTo(radius, 0)
      expect(b.x).toBeGreaterThan(0)
      expect(b.x).toBeLessThan(VIEW)
    }
  })

  it('hạt mẫu nằm ở đỉnh, các hạt đi theo chiều kim đồng hồ', () => {
    const { guru, beads, center } = beadLayout(21)
    expect(guru.x).toBe(center)
    expect(guru.y).toBeLessThan(center)
    // Hạt đầu ở bên phải đỉnh, hạt cuối ở bên trái đỉnh
    expect(beads[0].x).toBeGreaterThan(center)
    expect(beads[20].x).toBeLessThan(center)
    expect(beads.every((b, i) => i === 0 || b.angle > beads[i - 1].angle)).toBe(true)
  })

  it('các hạt không chồng lên nhau và không đè hạt mẫu', () => {
    for (const size of BEAD_SIZES) {
      const { beads, beadR, guru } = beadLayout(size)
      const d = Math.hypot(beads[1].x - beads[0].x, beads[1].y - beads[0].y)
      expect(d).toBeGreaterThan(beadR * 2)
      const toGuru = Math.hypot(beads[0].x - guru.x, beads[0].y - guru.y)
      expect(toGuru).toBeGreaterThan(beadR + guru.r)
    }
  })

  it('chuỗi ít hạt thì hạt to hơn', () => {
    expect(beadLayout(21).beadR).toBeGreaterThan(beadLayout(108).beadR)
  })
})

describe('beadState', () => {
  it('phân biệt hạt đã lần, hạt hiện tại và hạt chưa tới', () => {
    expect(beadState(0, 0)).toBe('todo')
    expect(beadState(0, 3)).toBe('done')
    expect(beadState(2, 3)).toBe('current')
    expect(beadState(3, 3)).toBe('todo')
  })
})

describe('isBeadSize', () => {
  it('chỉ chấp nhận các loại chuỗi hỗ trợ', () => {
    expect(isBeadSize(108)).toBe(true)
    expect(isBeadSize(100)).toBe(false)
  })
})
