import { describe, expect, it } from 'vitest'
import { TERRAIN_GRID, gridHeight, groundSurface, terrainDetail } from './terrainGrid'
import { nearestWalkable, terrainHeight } from './navigation'
import { WALKABLES } from './layout'
import { outcropSpots } from './outcrops'
import { fbm, valueNoise } from './noise'

const G = TERRAIN_GRID

describe('lưới địa hình hiển thị', () => {
  it('groundSurface trùng đúng đỉnh lưới mesh', () => {
    for (const [i, j] of [
      [10, 10],
      [80, 120],
      [100, 60],
      [150, 200],
    ]) {
      expect(groundSurface(G.x0 + i * G.cell, G.z0 + j * G.cell)).toBeCloseTo(gridHeight(i, j), 5)
    }
  })

  it('gồ ghề chi tiết không đụng tới mặt đi được và chỉ nâng mặt đất', () => {
    for (const s of WALKABLES.slice(0, 20)) {
      const x = s.x ?? s.from?.[0] ?? 0
      const z = s.z ?? s.from?.[2] ?? 0
      if (nearestWalkable(x, z).dist <= 0) expect(terrainDetail(x, z)).toBe(0)
    }
    for (let k = 0; k < 200; k++) {
      const x = G.x0 + ((k * 37) % 330)
      const z = G.z0 + ((k * 53) % 430)
      const d = terrainDetail(x, z)
      expect(d).toBeGreaterThanOrEqual(0)
      expect(d).toBeLessThan(0.8)
    }
  })

  it('mặt lưới bám sát terrainHeight (sai lệch nhỏ)', () => {
    for (let k = 0; k < 100; k++) {
      const x = G.x0 + 3 + ((k * 41.3) % 320)
      const z = G.z0 + 3 + ((k * 67.9) % 420)
      expect(Math.abs(groundSurface(x, z) - terrainHeight(x, z))).toBeLessThan(2.5)
    }
  })

  it('nhiễu xác định, trong [0,1]', () => {
    expect(valueNoise(1.3, 4.7)).toBe(valueNoise(1.3, 4.7))
    for (let k = 0; k < 50; k++) {
      const v = fbm(k * 3.1, k * 1.7)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('mỏm đá lộ nằm xa lối đi, trên mặt lưới', () => {
    const spots = outcropSpots()
    expect(spots.length).toBeGreaterThan(40)
    for (const r of spots) {
      expect(nearestWalkable(r.x, r.z).dist).toBeGreaterThanOrEqual(4)
      expect(r.y).toBeLessThanOrEqual(groundSurface(r.x, r.z))
    }
  })
})
