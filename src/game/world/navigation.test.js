import { describe, expect, it } from 'vitest'
import { clearFraction, groundAt, pushOut, shapeDistance, stepMove, terrainHeight } from './navigation'
import { WALKABLES, ZONES } from './layout'

describe('navigation — mặt đi được', () => {
  it('đứng giữa sân chân núi ở độ cao 0', () => {
    expect(groundAt(0, 0, 0).y).toBe(0)
  })

  it('độ cao trên bậc đá nội suy tuyến tính', () => {
    const g = groundAt(0, -48, 8)
    expect(g.walkable.id).toBe('bac-1')
    expect(g.y).toBeCloseTo(8, 1)
  })

  it('ngoài vùng đi được trả về null', () => {
    expect(groundAt(200, 0, 0)).toBeNull()
  })

  it('mỗi origin của khu vực nằm trên một mặt đi được, đúng độ cao', () => {
    for (const z of Object.values(ZONES)) {
      const [x, y, zz] = z.origin
      const g = groundAt(x, zz, y)
      expect(g, z.id).not.toBeNull()
      expect(g.y).toBeCloseTo(y, 5)
    }
  })

  it('các đoạn nối khớp độ cao ở hai đầu (đi liền mạch từ chân núi lên đỉnh)', () => {
    for (const s of WALKABLES.filter((w) => w.type === 'ramp')) {
      for (const [x, z, y] of [s.from, s.to]) {
        const others = WALKABLES.filter((w) => w !== s).map((w) => ({ w, ...shapeDistance(w, x, z) }))
        const joined = others.find((o) => o.dist <= 0.5 && Math.abs(o.y - y) < 0.6)
        expect(joined, `${s.id} tại (${x},${z})`).toBeTruthy()
      }
    }
  })

  it('không đoạn dốc nào chui vào trong lòng một sân phẳng khác (đi khuất dưới mặt sân)', () => {
    const flats = WALKABLES.filter((w) => w.type !== 'ramp')
    for (const r of WALKABLES.filter((w) => w.type === 'ramp')) {
      for (let t = 0.05; t <= 0.95; t += 0.05) {
        const x = r.from[0] + (r.to[0] - r.from[0]) * t
        const z = r.from[1] + (r.to[1] - r.from[1]) * t
        const y = r.from[2] + (r.to[2] - r.from[2]) * t
        for (const f of flats) {
          const { dist } = shapeDistance(f, x, z)
          if (dist < -1) expect(Math.abs(f.y - y), `${r.id} trong ${f.id}`).toBeLessThan(0.6)
        }
      }
    }
  })

  it('độ dốc mọi đoạn bậc không quá 35°', () => {
    for (const r of WALKABLES.filter((w) => w.type === 'ramp')) {
      const len = Math.hypot(r.to[0] - r.from[0], r.to[1] - r.from[1])
      const deg = (Math.atan2(Math.abs(r.to[2] - r.from[2]), len) * 180) / Math.PI
      expect(deg, r.id).toBeLessThan(35)
    }
  })

  it('địa hình trùng mặt sân bên trong vùng đi được', () => {
    expect(terrainHeight(0, -140)).toBeCloseTo(26 - 0.06, 3)
  })
})

describe('navigation — di chuyển & vật cản', () => {
  it('đi thẳng trên sân', () => {
    const r = stepMove({ x: 0, y: 0, z: 0 }, 1, 0)
    expect(r.x).toBeCloseTo(1)
  })

  it('trượt dọc mép khi đi chéo ra ngoài', () => {
    const r = stepMove({ x: 37.9, y: 0, z: 0 }, 1, -1)
    expect(r.x).toBeLessThanOrEqual(38)
    expect(r.z).toBeCloseTo(-1)
  })

  it('đẩy ra khỏi cột tròn', () => {
    const [x, z] = pushOut(0.1, 0, 0, 0.35, [{ type: 'circle', x: 0, z: 0, r: 1 }])
    expect(Math.hypot(x, z)).toBeCloseTo(1.35)
  })

  it('đẩy ra khỏi hộp xoay', () => {
    const [x, z] = pushOut(0, 0.9, 0, 0.35, [{ type: 'box', x: 0, z: 0, w: 4, d: 2, rot: 0 }])
    expect(z).toBeCloseTo(1.35)
    expect(x).toBeCloseTo(0)
  })

  it('góc xoay hộp theo quy ước rotation.y của three.js', () => {
    // Hộp dài 4m theo trục x cục bộ, xoay 90° → nằm dọc theo trục z thế giới, bề ngang x chỉ 2m
    const box = { type: 'box', x: 0, z: 0, w: 4, d: 2, rot: Math.PI / 2 }
    const [x, z] = pushOut(0.9, 0, 0, 0.35, [box])
    expect(x).toBeCloseTo(1.35)
    expect(z).toBeCloseTo(0)
    // điểm (0, 1.8) nằm trong hộp theo chiều dài → bị đẩy ra theo z
    const [x2, z2] = pushOut(0.2, 1.8, 0, 0.35, [box])
    expect(Math.abs(z2) >= 2.35 || Math.abs(x2) >= 1.35).toBe(true)
  })

  it('va chạm camera: tường chắn giữa đường → chỉ còn thông một phần', () => {
    const wall = { type: 'box', x: 5, z: 0, w: 0.4, d: 6, y0: 0, y1: 6 }
    const f = clearFraction([0, 1.3, 0], [10, 2, 0], [wall])
    expect(f).toBeGreaterThan(0.3)
    expect(f).toBeLessThan(0.5)
    expect(clearFraction([0, 1.3, 0], [0, 2, 10], [wall])).toBe(1)
    // camera cao vượt hẳn đỉnh tường thì không bị chặn
    expect(clearFraction([0, 9, 0], [10, 9, 0], [wall])).toBe(1)
  })

  it('va chạm camera: bỏ qua vật cản nhân vật đang ngồi trong (ghế) để vẫn thấy người', () => {
    const bench = { type: 'box', x: 0, z: 0, w: 1.9, d: 0.6, y0: 0, y1: 6 }
    // Đầu nhân vật ở ngay trên ghế (trong hộp vật cản) → không bị chặn
    expect(clearFraction([0, 1.3, 0], [4, 2, 0], [bench])).toBe(1)
  })

  it('bỏ qua vật cản ở tầng khác', () => {
    const [x] = pushOut(0.1, 0, 26, 0.35, [{ type: 'circle', x: 0, z: 0, r: 1, y0: 0, y1: 3 }])
    expect(x).toBeCloseTo(0.1)
  })
})
