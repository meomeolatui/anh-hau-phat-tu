import { describe, expect, it } from 'vitest'
import { buildGate, buildHall, buildPillar, buildRailing, buildRoof } from './buildings'

/** Kiểm tra hình học gộp: không NaN, có màu đỉnh, nằm trong khung kỳ vọng */
function check(geo, box) {
  const parts = Object.values(geo).filter(Boolean)
  expect(parts.length).toBeGreaterThan(0)
  for (const g of parts) {
    const pos = g.attributes.position.array
    expect(pos.every(Number.isFinite)).toBe(true)
    expect(g.attributes.color.count).toBe(g.attributes.position.count)
    expect(g.attributes.uv.count).toBe(g.attributes.position.count)
    g.computeBoundingBox()
    const b = g.boundingBox
    if (box) {
      expect(b.min.x).toBeGreaterThanOrEqual(box.min[0])
      expect(b.max.x).toBeLessThanOrEqual(box.max[0])
      expect(b.min.z).toBeGreaterThanOrEqual(box.min[2])
      expect(b.max.z).toBeLessThanOrEqual(box.max[2])
      expect(b.min.y).toBeGreaterThanOrEqual(box.min[1])
      expect(b.max.y).toBeLessThanOrEqual(box.max[1])
    }
  }
  return parts.reduce((n, g) => n + g.attributes.position.count, 0)
}

describe('hình học kiến trúc gộp', { timeout: 30000 }, () => {
  it('mái chùa nằm gọn quanh khung w×d (đầu đao vươn ra chút ít)', () => {
    for (const detail of [0, 1, 2]) {
      const n = check(buildRoof({ w: 8, d: 6, h: 2.2, ornament: true, detail }), { min: [-5, -0.5, -4], max: [5, 4, 4] })
      expect(n).toBeGreaterThan(500)
    }
    check(buildRoof({ w: 2.5, d: 1.2, h: 0.4, ornament: false, detail: 1 }), { min: [-2, -0.3, -1.2], max: [2, 1.2, 1.2] })
  })

  it('chánh điện giữ footprint nền (w+1.2)×(d+1.6) cho phần đá', () => {
    for (const [w, d, h, tiers] of [
      [15, 11, 4.6, 2],
      [8, 6, 3, 1],
    ]) {
      const geo = buildHall({ w, d, h, tiers, wall: '#e9c46a', roof: '#9e3d27', open: true, steps: 0, detail: 1 })
      check({ stone: geo.stone }, { min: [-(w + 1.5) / 2, -0.1, -(d + 1.9) / 2], max: [(w + 1.5) / 2, 1.2, (d + 1.9) / 2] })
      check(geo, { min: [-w / 2 - 2.5, -0.1, -d / 2 - 2.5], max: [w / 2 + 2.5, h + 7, d / 2 + 2.5] })
    }
    check(buildHall({ w: 12, d: 9, h: 3.6, tiers: 2, wall: '#e9c46a', roof: '#9e3d27', open: false, steps: 3, detail: 0 }))
  })

  it('cổng tam quan, cột, lan can dựng được ở mọi mức chi tiết', () => {
    for (const detail of [0, 1, 2]) {
      check(buildGate({ w: 12, h: 4.2, roof: '#9e3d27', detail }), { min: [-8, -0.1, -2], max: [8, 9, 2] })
      check(buildPillar({ h: 3, r: 0.18, color: '#a8322d', couplet: true, dragon: detail > 0, detail }), { min: [-0.5, -0.01, -0.5], max: [0.5, 3.7, 0.5] })
      check(buildRailing(12.5, detail), { min: [-0.3, -0.01, -0.3], max: [0.3, 1.2, 12.8] })
    }
  })
})

describe('sạp hàng, trạm trà, ga cáp treo', { timeout: 30000 }, () => {
  it('dựng được, sạp nằm trong footprint ±1.8 × ±1.4', async () => {
    const { buildCabin, buildCableStation, buildStall, buildTeaStation } = await import('./marketGeometry')
    for (const items of [['nhang'], ['hoa'], ['den', 'nhang']]) {
      const g = buildStall('#c0392b', items, 1)
      check({ wood: g.wood, cloth: g.cloth }, { min: [-1.85, -0.01, -1.3], max: [1.85, 3.0, 1.45] })
    }
    check(buildTeaStation(1))
    check(buildCableStation(1), { min: [-4.1, -0.01, -3.5], max: [4.1, 5.0, 3.6] })
    check({ cabin: buildCabin('#f2a2bd', 1) })
  })
})
