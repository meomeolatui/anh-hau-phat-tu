import { describe, expect, it } from 'vitest'
import { DECOR_BUILDERS, buildDecor } from './decorGeometry'
import { DECOR_KINDS, decorColliders, decorFootprint } from './decorKinds'

/** Một mẫu cho mỗi loại đồ (tham số tối thiểu) */
const SAMPLE = {
  flowerBed: { w: 3, d: 1.2 },
  bench: { len: 1.8, back: true },
  bambooFence: { x2: 6, z2: 0 },
  stoneWall: { x2: 0, z2: 5 },
  flagLine: { x2: 8, z2: 2, h: 5 },
  stringLights: { x2: 6, z2: -3, h: 3.4 },
  windChime: { y: 3 },
  sideGate: { w: 3 },
  stupa: { tiers: 5 },
}
const sample = (kind) => ({ kind, x: 1, z: 2, rot: 0.3, ...SAMPLE[kind] })

describe('thư viện đồ trang trí', () => {
  it('mỗi loại trong decorKinds có bộ dựng và ngược lại', () => {
    expect([...DECOR_BUILDERS].sort()).toEqual([...DECOR_KINDS].sort())
  })

  it.each(DECOR_KINDS)('%s dựng được hình học hữu hạn, đủ chi tiết, không quá nặng', (kind) => {
    const geo = buildDecor([sample(kind)])
    expect(geo.base).not.toBeNull()
    const pos = geo.base.attributes.position
    expect(pos.count).toBeGreaterThan(40)
    expect(pos.count).toBeLessThan(12000)
    for (let i = 0; i < pos.array.length; i++) expect(Number.isFinite(pos.array[i])).toBe(true)
    expect(geo.base.attributes.color).toBeDefined()
    Object.values(geo).forEach((g) => g?.dispose())
  })

  it('đèn lồng dây có phần phát sáng tách riêng; chậu sen và non bộ có mặt nước', () => {
    const lights = buildDecor([sample('stringLights')])
    expect(lights.lamp).not.toBeNull()
    expect(lights.warm).not.toBeNull()
    expect(buildDecor([sample('lotusBasin')]).water).not.toBeNull()
    expect(buildDecor([sample('rockery')]).water).not.toBeNull()
  })

  it('gộp cả danh sách thành tối đa 4 lưới (≤ 4 draw call)', () => {
    const geo = buildDecor(DECOR_KINDS.map(sample))
    expect(Object.keys(geo).length).toBeLessThanOrEqual(4)
  })

  it('món treo không chiếm chỗ; đồ trên sườn (slope) không sinh vật cản', () => {
    expect(decorFootprint(sample('windChime'))).toEqual([])
    expect(decorFootprint({ ...sample('flagLine'), poles: [false, false] })).toEqual([])
    expect(decorFootprint(sample('flagLine'))).toHaveLength(2)
    expect(decorColliders([{ ...sample('bonsai'), slope: true }, sample('lotusBasin')])).toHaveLength(1)
  })

  it('vật cản rào tre phủ đúng đoạn thẳng', () => {
    const [c] = decorFootprint({ kind: 'bambooFence', x: 0, z: 0, x2: 6, z2: 0 })
    expect(c.type).toBe('box')
    expect(c.x).toBeCloseTo(3)
    expect(c.d).toBeGreaterThan(6)
    expect(c.rot).toBeCloseTo(Math.PI / 2)
  })

  it('báo lỗi khi gặp loại đồ không có', () => {
    expect(() => buildDecor([{ kind: 'khong-co', x: 0, z: 0 }])).toThrow()
  })
})
