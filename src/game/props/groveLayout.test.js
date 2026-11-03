import { describe, expect, it } from 'vitest'
import { GROVE_COLORS, groveFor, pickGroveColor } from './groveLayout'
import { nearestWalkable } from '../world/navigation'
import { ZONES } from '../world/layout'

describe('rặng cây màu quanh khu vực', () => {
  it.each(Object.keys(ZONES))('khu %s có cây, không cây nào chắn mặt đi được', (zoneId) => {
    const trees = groveFor(zoneId, { count: 20, seed: 3 })
    expect(trees.length).toBeGreaterThan(8)
    for (const t of trees) expect(nearestWalkable(t.x, t.z).dist).toBeGreaterThanOrEqual(2.5)
  })

  it('phần lớn cây có màu đỏ/cam/vàng/hồng/tím (không phải xanh)', () => {
    const trees = Object.keys(ZONES).flatMap((id) => groveFor(id, { count: 26, seed: 1 }))
    const colorful = trees.filter((t) => t.color !== '#5f9a52').length
    expect(colorful / trees.length).toBeGreaterThan(0.75)
  })

  it('mật độ gấp 3: số cây quanh mỗi khu xấp xỉ 3 lần số gốc', () => {
    for (const id of Object.keys(ZONES)) {
      const one = groveFor(id, { count: 20, seed: 5, density: 1 }).length
      const three = groveFor(id, { count: 20, seed: 5 }).length
      expect(three, id).toBeGreaterThanOrEqual(Math.min(60, one * 2.5))
    }
  })

  it('ổn định theo seed và màu nằm trong bảng màu', () => {
    expect(groveFor('chua-ba', { seed: 2 })).toEqual(groveFor('chua-ba', { seed: 2 }))
    const allowed = GROVE_COLORS.map((c) => c.color)
    for (const r of [0, 0.1, 0.5, 0.99, 1]) expect(allowed).toContain(pickGroveColor(r))
  })
})
