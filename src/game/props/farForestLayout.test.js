import { describe, expect, it } from 'vitest'
import { FAR_CENTER, FAR_RADIUS, farForest } from './farForestLayout'
import { nearestWalkable } from '../world/navigation'

describe('rừng xa phủ đều', () => {
  const trees = farForest({ spacing: 14, seed: 3 })

  it('có nhiều cây và không cây nào gần lối đi', () => {
    expect(trees.length).toBeGreaterThan(1500)
    for (const t of trees) expect(nearestWalkable(t.x, t.z).dist).toBeGreaterThan(15)
  })

  it('phủ đều: chia vùng thành 8 hướng, hướng nào cũng có nhiều cây', () => {
    const buckets = new Array(8).fill(0)
    for (const t of trees) {
      const a = Math.atan2(t.z - FAR_CENTER[1], t.x - FAR_CENTER[0])
      buckets[Math.floor(((a + Math.PI) / (Math.PI * 2)) * 8) % 8]++
    }
    const avg = trees.length / 8
    for (const b of buckets) expect(b).toBeGreaterThan(avg * 0.6)
  })

  it('nằm trong bán kính phủ rừng', () => {
    for (const t of trees) expect(Math.hypot(t.x - FAR_CENTER[0], t.z - FAR_CENTER[1])).toBeLessThanOrEqual(FAR_RADIUS + 1)
  })
})
