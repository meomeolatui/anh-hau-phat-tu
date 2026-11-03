import { describe, expect, it } from 'vitest'
import { groundAt, nearestWalkable, pushOut, stepMove } from '../world/navigation'
import { WALKABLES } from '../world/layout'
import * as duongNui from './duong-nui/data'
import * as chuaHang from './chua-hang/data'
import * as chuaHangDecor from './chua-hang/decorLayout'
import { CN1_DECOR_COLLIDERS, CN2_DECOR_COLLIDERS } from './duong-nui/decorLayout'
import { placeAt, walkDist, walkableById, worldColliders } from './duong-nui/helpers'
import { benchColliders } from './testing'

const RADIUS = 0.35

/**
 * Đi bộ bằng stepMove qua lần lượt các điểm mốc (x,z), mỗi bước 0,25 m.
 * Trả về vị trí cuối; ném lỗi nếu bị kẹt (không tới được mốc).
 */
function walk(start, waypoints, colliders, tol = 0.3) {
  let pos = { x: start[0], y: start[1], z: start[2] }
  for (const [tx, tz] of waypoints) {
    let guard = 0
    let prev = Infinity
    let stuck = 0
    while (Math.hypot(tx - pos.x, tz - pos.z) > tol) {
      const d = Math.hypot(tx - pos.x, tz - pos.z)
      const k = Math.min(0.25, d) / d
      const r = stepMove(pos, (tx - pos.x) * k, (tz - pos.z) * k, { radius: RADIUS, colliders })
      if (!r.walkable) throw new Error(`Ra khỏi mặt đi được tại (${pos.x.toFixed(2)}, ${pos.z.toFixed(2)})`)
      pos = r
      const nd = Math.hypot(tx - pos.x, tz - pos.z)
      stuck = nd > prev - 0.01 ? stuck + 1 : 0
      prev = nd
      if (stuck > 40 || ++guard > 5000) {
        throw new Error(`Kẹt tại (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}) khi tới (${tx}, ${tz})`)
      }
    }
  }
  return pos
}

const ramp = (id) => walkableById(id)
const ends = (id) => [ramp(id).from.slice(0, 2), ramp(id).to.slice(0, 2)]

describe('Đường núi — đi bộ qua các đoạn bậc với vật cản của zone', () => {
  // Vật cản của zone + đồ trang trí + ghế nghỉ (world/benches.js)
  const colliders = [
    ...duongNui.allWorldColliders(),
    ...worldColliders(CN1_DECOR_COLLIDERS, duongNui.O1),
    ...worldColliders(CN2_DECOR_COLLIDERS, duongNui.O2),
    ...benchColliders(),
  ]

  it('từ chân bậc (0,0,−20) qua chiếu nghỉ 1 lên tới sân chùa Bà (0,26,−112)', () => {
    const end = walk([0, 0, -20], [...ends('bac-1'), [0, -78], ...ends('bac-2'), [0, -112]], colliders)
    expect(end.y).toBeCloseTo(26, 0)
  })

  it('đi vòng quanh chiếu nghỉ 1 tới trước ghế đá, nhà nghỉ và lối ra', () => {
    const [cx, cy, cz] = duongNui.O1
    const npc = duongNui.INTERACTIVE.npcNghiChan.position
    walk([cx, cy, cz + 8], [[cx, cz], [npc[0] - 1.2, npc[2]], [cx - 3, cz - 4], [cx, cz - 8.5]], colliders)
  })

  it('từ sân chùa Bà qua chiếu nghỉ 2 lên tới sân đỉnh (theo toạ độ layout)', () => {
    const cn2 = walkableById('chieu-nghi-2')
    const [doc1a, doc1b] = ends('doc-1')
    const [doc2a, doc2b] = ends('doc-2')
    const end = walk([doc1a[0], 26, doc1a[1]], [doc1b, [cn2.cx - 2, cn2.cz], doc2a, doc2b], colliders)
    expect(end.y).toBeCloseTo(walkableById('doc-2').to[2], 0)
  })

  it('tới được bồ đoàn thiền ở chiếu nghỉ 2 (trong đình nhỏ)', () => {
    const cn2 = walkableById('chieu-nghi-2')
    const seat = duongNui.INTERACTIVE.seatThien.position
    expect(seat[1]).toBe(cn2.y)
    const [doc1a, doc1b] = ends('doc-1')
    // vào đình từ cạnh bên (cạnh sau có ghế đá)
    const [ex, ez] = placeAt(duongNui.VIEW, -2.0, 0.3)
    const end = walk([doc1a[0], 26, doc1a[1]], [doc1b, [cn2.cx, cn2.cz], [cn2.cx + ex, cn2.cz + ez], [seat[0], seat[2]]], colliders)
    expect(Math.hypot(end.x - seat[0], end.z - seat[2])).toBeLessThan(1.5)
  })

  it('cổng gỗ chân bậc không chặn lối (lòng cổng rộng ≥ 2 m)', () => {
    const posts = duongNui.GATE_COLLIDERS
    const gap = Math.abs(posts[1].x - posts[0].x) - posts[0].r - posts[1].r
    expect(gap).toBeGreaterThanOrEqual(2)
  })
})

describe('Chùa Hang — lối vào, điện, khe Ông Đá nứt', () => {
  const colliders = [...chuaHang.allWorldColliders(), ...worldColliders(chuaHangDecor.DECOR_COLLIDERS, chuaHang.O), ...benchColliders()]
  const O = chuaHang.O

  it('từ sân chùa Bà (−32,26,−146) vào tới tâm chùa Hang (−76,22,−150)', () => {
    const [a, b] = ends('loi-chua-hang')
    const end = walk([-32, 26, -146], [a, b, [O[0], O[2]]], colliders)
    expect(end.y).toBeCloseTo(22, 5)
    expect(Math.hypot(end.x - O[0], end.z - O[2])).toBeLessThan(0.5)
  })

  it('từ tâm sân đi vào điện tới chiếu lạy, lư hương và bồ đoàn', () => {
    const { altar, incense, seat } = chuaHang.INTERACTIVE
    const atAltar = walk([O[0], O[1], O[2]], [[altar.position[0], altar.position[2]]], colliders)
    expect(Math.hypot(atAltar.x - altar.position[0], atAltar.z - altar.position[2])).toBeLessThan(0.35)
    // Điểm đứng thắp hương (trước lư, cách 1,6·scale + 0,4 theo hướng rotY) phải tới được và nằm trong bán kính tương tác
    const sx = incense.position[0] + Math.sin(incense.rotY) * 1.2
    const sz = incense.position[2] + Math.cos(incense.rotY) * 1.2
    const atIncense = walk([atAltar.x, atAltar.y, atAltar.z], [[sx, sz]], colliders, 0.05)
    expect(Math.hypot(atIncense.x - incense.position[0], atIncense.z - incense.position[2])).toBeLessThan(2.6 * 0.5)
    const atSeat = walk([atAltar.x, atAltar.y, atAltar.z], [[seat.position[0], seat.position[2]]], colliders)
    expect(Math.hypot(atSeat.x - seat.position[0], atSeat.z - seat.position[2])).toBeLessThan(1.5)
  })

  it('đi xuyên qua khe Ông Đá nứt (khe ~1,5 m)', () => {
    const S = chuaHang.SPLIT
    const [ix, iz] = placeAt(S, 0, -2.6)
    const [ox, oz] = placeAt(S, 0, 2.6)
    const end = walk([O[0] + ix, O[1], O[2] + iz], [[O[0] + ox, O[2] + oz]], colliders)
    expect(Math.hypot(end.x - O[0] - ox, end.z - O[2] - oz)).toBeLessThan(0.35)
  })

  it('hai nửa Ông Đá thực sự chắn (không đi xuyên thân đá)', () => {
    const S = chuaHang.SPLIT
    const [hx, hz] = placeAt(S, S.gap / 2 + S.halfW, 0)
    const [px, pz] = pushOut(O[0] + hx, O[2] + hz, O[1], RADIUS, colliders)
    expect(Math.hypot(px - O[0] - hx, pz - O[2] - hz)).toBeGreaterThan(0.5)
  })
})

describe('Vị trí đồ tương tác & trang trí', () => {
  const interactive = [
    ...Object.entries(duongNui.INTERACTIVE).map(([k, v]) => [`duong-nui.${k}`, v.position]),
    ...Object.entries(chuaHang.INTERACTIVE).map(([k, v]) => [`chua-hang.${k}`, v.position]),
  ]

  it.each(interactive)('%s nằm trong 2,5 m của mặt đi được, đúng độ cao', (_, [x, y, z]) => {
    const n = nearestWalkable(x, z)
    expect(n.dist).toBeLessThanOrEqual(2.5)
    const g = groundAt(x, z, y)
    expect(g).not.toBeNull()
    expect(Math.abs(g.y - y)).toBeLessThan(0.5)
  })

  it('id vật cản không trùng và đúng tiền tố', () => {
    const keys = [...duongNui.COLLIDER_GROUPS, ...chuaHang.COLLIDER_GROUPS].map((g) => g.key)
    expect(new Set(keys).size).toBe(keys.length)
    keys.forEach((k) => expect(k.startsWith('duong-nui-') || k.startsWith('chua-hang')).toBe(true))
  })

  it('cây, đá, đèn đá, trúc dọc đường không nằm trên mặt đi được', () => {
    const d = duongNui.buildDuongNuiDecor()
    const c = chuaHang.buildChuaHangDecor()
    const pts = [
      ...d.trees.map((t) => [t.x, t.z, 1.5]),
      ...d.rocks.map((r) => [r.x, r.z, 0.3]),
      ...d.lanterns.map((l) => [l.x, l.z, 0.3]),
      ...d.bamboo.map(([x, , z]) => [x, z, 1.0]),
      ...d.bigTrees.map(([x, , z]) => [x, z, 1.0]),
      ...c.trees.map((t) => [t.x, t.z, 1.5]),
      ...c.rocks.map((r) => [r.x, r.z, 0.3]),
      ...c.lanterns.map((l) => [l.x, l.z, 0.3]),
      ...c.bamboo.map(([x, , z]) => [x + chuaHang.O[0], z + chuaHang.O[2], 1.0]),
    ]
    expect(d.trees.length).toBeGreaterThan(20)
    for (const [x, z, clear] of pts) expect(walkDist(x, z), `(${x.toFixed(1)}, ${z.toFixed(1)})`).toBeGreaterThan(clear)
  })

  it('cột lan can nằm ngoài mặt đi được', () => {
    const runs = [...duongNui.buildDuongNuiDecor().rails, ...chuaHang.buildChuaHangDecor().rails]
    expect(runs.length).toBeGreaterThan(6)
    for (const [x, , z] of runs.flat()) expect(walkDist(x, z)).toBeGreaterThan(0.2)
  })

  it('vách đá chùa Hang không lấn vào sân (trừ khung cửa hang đã có vật cản)', () => {
    const rocks = chuaHang.buildCliff().slice(0, -7)
    for (const r of rocks) {
      const inner = Math.hypot(r.x, r.z) - Math.max(r.sx, r.sz)
      expect(inner).toBeGreaterThan(chuaHang.R - 1.2)
    }
  })

  it('khe suối chảy ngoài mép sân', () => {
    for (const p of chuaHang.streamSamples()) {
      expect(walkDist(p.x + chuaHang.O[0], p.z + chuaHang.O[2])).toBeGreaterThan(chuaHang.STREAM_WIDTH / 2)
    }
  })

  it('mọi mặt đi được dùng trong test vẫn tồn tại trong layout', () => {
    for (const id of ['bac-1', 'chieu-nghi', 'bac-2', 'doc-1', 'chieu-nghi-2', 'doc-2', 'loi-chua-hang', 'san-chua-hang']) {
      expect(WALKABLES.some((w) => w.id === id)).toBe(true)
    }
  })
})
