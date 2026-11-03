import { describe, expect, it } from 'vitest'
import { groundAt, nearestWalkable, pushOut } from '../world/navigation'
import { CABLE_STATIONS } from '../world/layout'
import { CABLE, CLIFF_ROCKS, COLLIDERS, EXITS, LEAF_FIELDS, O, SPOTS, STAND_POINTS, w } from './chua-ba/data'
import { DECOR_COLLIDERS } from './chua-ba/decorLayout'
import { benchColliders } from './testing'

const PLAYER_R = 0.35

/** Vật cản ở toạ độ thế giới, giống cách useColliders đăng ký — gồm cả đồ trang trí và ghế nghỉ (world/benches.js) */
const WORLD_COLLIDERS = [
  ...[...COLLIDERS, ...DECOR_COLLIDERS].map((c) => ({ y0: O[1], y1: O[1] + 6, ...c, x: c.x + O[0], z: c.z + O[2] })),
  ...benchColliders(),
]

const blocked = ([lx, lz], radius = PLAYER_R) => {
  const [x, , z] = w([lx, 0, lz])
  const [px, pz] = pushOut(x, z, O[1], radius, WORLD_COLLIDERS)
  return Math.hypot(px - x, pz - z) > 1e-6
}

const INTERACT_POINTS = {
  luHuong: SPOTS.luHuong.pos,
  huongBanTho: SPOTS.huongBanTho.pos,
  huongDienBa: SPOTS.huongDienBa.pos,
  altar: SPOTS.altar.pos,
  lectern: SPOTS.lectern.pos,
  bell: SPOTS.bell.pos,
  broom: SPOTS.broom.pos,
  truTri: SPOTS.truTri.pos,
  phatTu: SPOTS.phatTu.pos,
  cable: [CABLE.x, 0, CABLE.z],
  ...Object.fromEntries(SPOTS.seats.map((s) => [s.id, s.pos])),
  ...Object.fromEntries(LEAF_FIELDS.map((f) => [f.id, f.center])),
}

describe('Chùa Bà — bố cục', () => {
  it('mọi điểm tương tác nằm trong vòng 2.5 m của mặt đi được, đúng độ cao sân', () => {
    for (const [name, p] of Object.entries(INTERACT_POINTS)) {
      const [x, y, z] = w(p)
      const n = nearestWalkable(x, z)
      expect(n.dist, name).toBeLessThanOrEqual(2.5)
      expect(Math.abs(n.y - O[1]), name).toBeLessThan(0.5)
      expect(Math.abs(y - n.y), name).toBeLessThan(0.5)
    }
  })

  it('điểm đứng khi dùng đồ nằm trên mặt đi được và không bị vật cản đẩy đi', () => {
    for (const [name, [lx, lz]] of Object.entries(STAND_POINTS)) {
      const [x, , z] = w([lx, 0, lz])
      expect(groundAt(x, z, O[1]), name).not.toBeNull()
      expect(blocked([lx, lz]), name).toBe(false)
    }
  })

  it('vật cản không đè lên ba lối ra (chừa lối rộng ≥ 2 m)', () => {
    for (const [name, p] of Object.entries(EXITS)) {
      expect(blocked(p), name).toBe(false)
      expect(blocked(p, 1), `${name} (rộng 2 m)`).toBe(false)
    }
  })

  it('điểm xuống ga cáp treo không bị chặn', () => {
    const [ax, , az] = CABLE_STATIONS['chua-ba'].arrive
    expect(blocked([ax - O[0], az - O[2]])).toBe(false)
  })

  it('lối vào chánh điện để mở giữa hai cột giữa', () => {
    expect(blocked([0, -14.85])).toBe(false)
    expect(blocked([0, -14.85], 1)).toBe(false)
  })

  it('vật cản thật sự chặn (kiểm tra phép thử)', () => {
    expect(blocked(SPOTS.luHuong.pos.filter((_, i) => i !== 1))).toBe(true)
  })

  it('từ lối vào đi tới mọi lối ra và mọi điểm đứng qua hành lang rộng ≥ 2 m', () => {
    // Lưới 0.5 m trên mặt sân; ô "thông" khi thân rộng 2 m (bán kính 1) không chạm vật cản
    const STEP = 0.5
    const key = (i, j) => `${i},${j}`
    const toCell = ([x, z]) => [Math.round(x / STEP), Math.round(z / STEP)]
    const free = (i, j) => Math.abs(i * STEP) <= 33 && Math.abs(j * STEP) <= 28 && !blocked([i * STEP, j * STEP], 1)
    const start = toCell(EXITS.bacDa)
    const seen = new Set([key(...start)])
    const queue = [start]
    while (queue.length) {
      const [i, j] = queue.shift()
      for (const [di, dj] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const n = [i + di, j + dj]
        if (seen.has(key(...n)) || !free(...n)) continue
        seen.add(key(...n))
        queue.push(n)
      }
    }
    // Điểm đứng trong nhà có thể sát đồ thờ: chỉ cần một ô thông trong vòng 1.5 m
    const reachable = ([x, z]) => {
      const [ci, cj] = toCell([x, z])
      for (let i = ci - 3; i <= ci + 3; i++) for (let j = cj - 3; j <= cj + 3; j++) if (seen.has(key(i, j))) return true
      return false
    }
    for (const [name, p] of Object.entries({ ...EXITS, ...STAND_POINTS })) expect(reachable(p), name).toBe(true)
  })

  it('vách núi nằm ngoài mặt đi được (không lấn sân, không chắn đường dốc)', () => {
    expect(CLIFF_ROCKS.length).toBeGreaterThan(8)
    for (const r of CLIFF_ROCKS) {
      // Bán kính phủ trên mặt XZ của khối đá đã xoay
      const reach = Math.max(r.sx, r.sz)
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        const [x, , z] = w([r.x + Math.cos(a) * reach, 0, r.z + Math.sin(a) * reach * (r.sz / reach)])
        const g = groundAt(x, z, O[1])
        expect(g?.walkable.id ?? null, `đá tại (${r.x}, ${r.z.toFixed(1)})`).toBeNull()
      }
      const front = r.z + r.sz + Math.abs(Math.sin(r.rot)) * r.sx
      expect(front, `đá tại x=${r.x}`).toBeLessThan(-28)
    }
  })

  it('vật cản đều nằm trong sân', () => {
    for (const c of [...COLLIDERS, ...DECOR_COLLIDERS]) {
      expect(Math.abs(c.x)).toBeLessThanOrEqual(33)
      expect(Math.abs(c.z)).toBeLessThanOrEqual(28.5)
    }
  })
})
