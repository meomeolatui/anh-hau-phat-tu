import { describe, expect, it } from 'vitest'
import {
  buildBell,
  buildBellTower,
  buildBodhisattva,
  buildBodoan,
  buildIncenseBurner,
  buildIncenseSticks,
  buildLanternFrame,
  buildPond,
  buildSeatedBuddha,
  buildStoneLantern,
} from './sacredGeometry'

function finite(g) {
  expect(g).toBeTruthy()
  const a = g.attributes.position.array
  expect(a.every(Number.isFinite)).toBe(true)
  g.computeBoundingBox()
  return g.boundingBox
}

describe('hình học đồ thờ tự', { timeout: 30000 }, () => {
  it('tượng Phật ngồi cao ~2.4 (đơn vị), đầu ở khoảng y 2.05', () => {
    for (const detail of [0, 1, 2]) {
      const { body, haloAt } = buildSeatedBuddha({ color: '#d9a441', halo: true, detail })
      const b = finite(body)
      expect(b.max.y).toBeGreaterThan(2.3)
      expect(b.max.y).toBeLessThan(2.95)
      expect(b.min.y).toBeGreaterThanOrEqual(-0.01)
      expect(haloAt[1]).toBeCloseTo(2.05)
    }
  })

  it('tượng Bồ Tát đứng cao ~3 (đơn vị), không rộng quá đài sen', () => {
    const b = finite(buildBodhisattva({ color: '#9b6b3c', detail: 1 }))
    expect(b.max.y).toBeGreaterThan(2.7)
    expect(b.max.y).toBeLessThan(3.1)
    expect(b.max.x - b.min.x).toBeLessThan(1.6)
  })

  it('lư hương, que hương, bồ đoàn, đèn lồng, đèn đá, hồ sen dựng được', () => {
    const lb = buildIncenseBurner(1)
    finite(lb.stone)
    finite(lb.bronze)
    const s = buildIncenseSticks(5)
    finite(s.sticks)
    finite(s.embers)
    finite(buildBodoan('#b8862f', 1))
    finite(buildLanternFrame({ hang: 0.6, color: '#d83a2e', detail: 1 }))
    finite(buildStoneLantern(1))
    const p = buildPond(10, 6, 3, 1)
    const pb = finite(p.stone)
    expect(pb.max.x).toBeLessThanOrEqual(5.31)
    expect(pb.max.z).toBeLessThanOrEqual(3.31)
    finite(p.plants)
  })

  it('gác chuông: chuông giữ bán kính ~0.635 ở độ cao chày (y −1.0 trong nhóm treo)', () => {
    finite(buildBell(1))
    const t = buildBellTower(1)
    for (const k of ['stone', 'body', 'tile', 'trim']) finite(t[k])
    const bell = buildBell(0)
    const pos = bell.attributes.position
    let maxR = 0
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(pos.getY(i) + 1.0) < 0.02) maxR = Math.max(maxR, Math.hypot(pos.getX(i), pos.getZ(i)))
    }
    expect(maxR).toBeGreaterThan(0.6)
    expect(maxR).toBeLessThan(0.7)
  })
})
