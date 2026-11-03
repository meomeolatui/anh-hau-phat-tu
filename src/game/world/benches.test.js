import { describe, expect, it } from 'vitest'
import { BENCHES } from './benches'
import { groundAt, nearestWalkable } from './navigation'
import { STELES } from './steles'

describe('ghế đá nghỉ chân', () => {
  it.each(BENCHES.map((b) => [b.id, b]))('%s nằm trên mặt đi được, đúng độ cao, cách mép đủ xa', (_, b) => {
    const [x, y, z] = b.position
    const g = groundAt(x, z, y)
    expect(g).not.toBeNull()
    expect(g.y).toBeCloseTo(y, 1)
    expect(nearestWalkable(x, z).dist).toBeLessThan(-1.2)
    // điểm đứng dậy phía trước ghế cũng trên mặt đi được
    expect(groundAt(x + Math.sin(b.rotY) * 0.9, z + Math.cos(b.rotY) * 0.9, y)).not.toBeNull()
  })

  it('không đè lên bia pháp ngữ và các ghế cách nhau', () => {
    for (const b of BENCHES) {
      for (const s of STELES) expect(Math.hypot(b.position[0] - s.position[0], b.position[2] - s.position[2])).toBeGreaterThan(2.5)
      for (const o of BENCHES) if (o !== b) expect(Math.hypot(b.position[0] - o.position[0], b.position[2] - o.position[2])).toBeGreaterThan(3)
    }
  })
})
