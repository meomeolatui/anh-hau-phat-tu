import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { GROVE_MOUNTS, railingLamps, treeLanterns } from './nightLightsLayout'
import { groundAt, nearestWalkable } from '../world/navigation'

describe('đèn ban đêm', () => {
  const lamps = railingLamps()

  it('có nhiều đèn lan can, tất cả nằm ngay ngoài mép mặt đi được (không chắn đường)', () => {
    expect(lamps.length).toBeGreaterThan(120)
    for (const l of lamps) {
      const d = nearestWalkable(l.x, l.z).dist
      expect(d).toBeGreaterThan(0.1)
      expect(d).toBeLessThan(1)
      expect(groundAt(l.x, l.z, l.y)).toBeNull()
    }
  })

  it('không có đèn lan can trên quảng trường chợ chân núi (độ cao 0, ngoài đường bậc)', () => {
    const plaza = lamps.filter((l) => l.y < 0.5 && Math.abs(l.x) > 6)
    expect(plaza).toHaveLength(0)
  })

  it('đèn lồng treo trên cây: đủ nhiều, màu đỏ/vàng/cam', () => {
    const list = treeLanterns()
    expect(list.length).toBeGreaterThan(80)
    for (const l of list) expect(['#e8402e', '#f2b134', '#f07a3a']).toContain(l.color)
  })

  it('thông số rặng cây khớp với các zone đang gắn ColorGrove', () => {
    for (const g of GROVE_MOUNTS) {
      const files = ['ChanNui', 'DuongNui', 'ChuaBa', 'ChuaHang', 'DinhNui'].map((f) => readFileSync(`src/game/zones/${f}.jsx`, 'utf8'))
      const found = files.some((src) => src.includes(`<ColorGrove zoneId="${g.zoneId}" count={${g.count}} seed={${g.seed}} />`))
      expect(found, g.zoneId).toBe(true)
    }
  })
})
