import { FLOWER_COLORS, scatterFlora, scatterForest } from './natureScatter'
import { nearestWalkable } from '../world/navigation'
import { groundSurface } from '../world/terrainGrid'

describe('scatterForest', () => {
  it('xác định (cùng kết quả mỗi lần tải) và tránh lối đi', () => {
    const a = scatterForest()
    const b = scatterForest()
    expect(a.trees.length).toBe(b.trees.length)
    expect(a.trees[10]).toEqual(b.trees[10])
    a.trees.forEach((t) => expect(nearestWalkable(t.x, t.z).dist).toBeGreaterThanOrEqual(3.5))
  })

  it('cây và đá bám mặt lưới địa hình (groundSurface)', () => {
    const { trees, rocks } = scatterForest()
    trees.slice(0, 50).forEach((t) => expect(t.y).toBeCloseTo(groundSurface(t.x, t.z) - 0.2, 5))
    rocks.slice(0, 50).forEach((r) => expect(r.y).toBeCloseTo(groundSurface(r.x, r.z), 5))
  })

  it('vùng xa lối đi (> 20 m, FarForest đã phủ) thưa hơn ven đường', () => {
    const { trees } = scatterForest()
    const far = trees.filter((t) => nearestWalkable(t.x, t.z).dist > 20).length
    const all = scatterForest({ farKeep: 1 }).trees.filter((t) => nearestWalkable(t.x, t.z).dist > 20).length
    expect(far).toBeLessThan(all * 0.6)
  })
})

describe('scatterFlora', () => {
  it("mật độ theo chất lượng: 'low' không có cỏ/hoa, 'high' dày hơn 'auto'", () => {
    const low = scatterFlora('low')
    const auto = scatterFlora('auto')
    const high = scatterFlora('high')
    expect(low.grass).toHaveLength(0)
    expect(low.flowers).toHaveLength(0)
    expect(auto.grass.length).toBeGreaterThan(1000)
    expect(high.grass.length).toBeGreaterThan(auto.grass.length)
    expect(high.flowers.length).toBeGreaterThan(auto.flowers.length)
  })

  it('không đặt trên mặt đi được và bám mặt đất', () => {
    const { grass, flowers, shrubs } = scatterFlora('auto')
    for (const it of [...grass, ...flowers, ...shrubs]) {
      expect(nearestWalkable(it.x, it.z).dist).toBeGreaterThan(0.4)
    }
    flowers.slice(0, 80).forEach((f) => expect(f.y).toBeCloseTo(groundSurface(f.x, f.z), 5))
  })

  it('hoa đủ màu (vàng, trắng, hồng, tím…), bụi cây là kind "bui"', () => {
    const { flowers, shrubs } = scatterFlora('auto')
    const colors = new Set(flowers.map((f) => f.color))
    colors.forEach((c) => expect(FLOWER_COLORS).toContain(c))
    expect(colors.size).toBeGreaterThanOrEqual(4)
    expect(shrubs.length).toBeGreaterThan(20)
    shrubs.forEach((s) => expect(s.kind).toBe('bui'))
  })
})
