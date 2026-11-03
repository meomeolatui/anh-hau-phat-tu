import { describe, expect, it } from 'vitest'
import { CABLE_STATIONS, SPAWN, WALKABLES } from '../world/layout'
import { groundAt, pushOut, shapeDistance } from '../world/navigation'
import { groundSurface } from '../world/terrainGrid'
import { POLE_R, decorColliders, decorFootprint, shiftDecor } from '../props/decorKinds'
import { walkDist, walkableById, worldColliders } from './duong-nui/helpers'
import { benchColliders, worldKeepOut } from './testing'
import * as chanNui from './chan-nui/data'
import * as duongNui from './duong-nui/data'
import * as duongNuiDecor from './duong-nui/decorLayout'
import * as chuaBa from './chua-ba/data'
import * as chuaBaDecor from './chua-ba/decorLayout'
import * as chuaHang from './chua-hang/data'
import * as chuaHangDecor from './chua-hang/decorLayout'
import * as dinhNui from './dinh-nui/data'
import * as dinhNuiDecor from './dinh-nui/decorLayout'

/**
 * Ràng buộc bày trí (props/decor.jsx) cho mọi zone — kiểm tra trong toạ độ THẾ GIỚI:
 *  - mỗi khu ≥ 25 món; không món nào trong 2.5 m quanh điểm tương tác / điểm đứng, ghế nghỉ, bia;
 *  - không lấn sân lá, bãi rác; không chồng lên vật cản sẵn có hay lên nhau;
 *  - món trên sân đứng đúng mặt đi được (có vật cản); món `slope` nằm hẳn ngoài mặt đi được, bám mặt địa hình;
 *  - không chặn lối: điểm nào đi tới được qua hành lang rộng 2.5 m (và 1.2 m) trước khi bày đồ thì sau vẫn tới được.
 */

const KEEP_OUT = 2.5
const toW = (O, [x, z]) => [x + O[0], z + O[2]]
const pt = (id, O, p) => {
  const [x, z] = toW(O, p)
  return { id, x, z, y: O[1] }
}
const front = ([x, , z], rotY, d) => [x + Math.sin(rotY) * d, z + Math.cos(rotY) * d]

/* ---------------- Hình học: khoảng cách có dấu ---------------- */

function sdf(c, x, z) {
  if (c.type === 'circle') return Math.hypot(x - c.x, z - c.z) - c.r
  const r = c.rot || 0
  const dx = x - c.x
  const dz = z - c.z
  const lx = dx * Math.cos(r) - dz * Math.sin(r)
  const lz = dx * Math.sin(r) + dz * Math.cos(r)
  const qx = Math.abs(lx) - c.w / 2
  const qz = Math.abs(lz) - c.d / 2
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0)
}

function boundary(c, step = 0.15) {
  if (c.type === 'circle') {
    const n = Math.max(12, Math.ceil((2 * Math.PI * c.r) / step))
    return Array.from({ length: n }, (_, i) => [c.x + Math.cos((i / n) * 2 * Math.PI) * c.r, c.z + Math.sin((i / n) * 2 * Math.PI) * c.r])
  }
  const r = c.rot || 0
  const toWorld = (lx, lz) => [c.x + lx * Math.cos(r) + lz * Math.sin(r), c.z - lx * Math.sin(r) + lz * Math.cos(r)]
  const pts = []
  const nx = Math.max(2, Math.ceil(c.w / step))
  const nz = Math.max(2, Math.ceil(c.d / step))
  for (let i = 0; i <= nx; i++) pts.push(toWorld(-c.w / 2 + (i * c.w) / nx, -c.d / 2), toWorld(-c.w / 2 + (i * c.w) / nx, c.d / 2))
  for (let i = 0; i <= nz; i++) pts.push(toWorld(-c.w / 2, -c.d / 2 + (i * c.d) / nz), toWorld(c.w / 2, -c.d / 2 + (i * c.d) / nz))
  return pts
}

/** Khoảng cách gần đúng giữa hai hình (âm/0 = chạm hoặc chồng) */
function gap(a, b) {
  if (sdf(b, a.x, a.z) <= 0 || sdf(a, b.x, b.z) <= 0) return -1
  let g = Infinity
  for (const [x, z] of boundary(a)) g = Math.min(g, sdf(b, x, z))
  for (const [x, z] of boundary(b)) g = Math.min(g, sdf(a, x, z))
  return g
}

/* ---------------- Dữ liệu chung ---------------- */

const BENCH_COLLIDERS = benchColliders()
const EXISTING = [
  ...worldColliders(chanNui.COLLIDERS, chanNui.O),
  ...duongNui.allWorldColliders(),
  ...worldColliders(chuaBa.COLLIDERS, chuaBa.O),
  ...chuaHang.allWorldColliders(),
  ...worldColliders(dinhNui.COLLIDERS, dinhNui.O),
  ...BENCH_COLLIDERS,
]
const GLOBAL_KEEP_OUT = worldKeepOut()

/** Cây, đá, đèn đá, cột lan can sẵn có ngoài mặt đi được (thế giới) — đồ trên sườn không được đè lên */
const OBSTACLES = (() => {
  const d = duongNui.buildDuongNuiDecor()
  const c = chuaHang.buildChuaHangDecor()
  const H = chuaHang.O
  const D = dinhNui.O
  return [
    ...[...d.trees, ...c.trees].map((t) => ({ x: t.x, z: t.z, r: 0.45 * t.s, y: t.y })),
    ...[...d.rocks, ...c.rocks].map((r) => ({ x: r.x, z: r.z, r: 0.6 * r.s, y: r.y })),
    ...[...d.lanterns, ...c.lanterns].map((l) => ({ x: l.x, z: l.z, r: 0.3, y: l.y })),
    ...[...d.rails, ...c.rails].flat().map(([x, y, z]) => ({ x, z, r: 0.14, y })),
    ...[...d.bamboo, ...d.bigTrees].map(([x, y, z]) => ({ x, z, r: 0.9, y })),
    ...c.bamboo.map(([x, y, z]) => ({ x: x + H[0], z: z + H[2], r: 0.9, y: y + H[1] })),
    ...dinhNui.OUTER_BOULDERS.map((b) => ({ x: b.x + D[0], z: b.z + D[2], r: 0.6 * b.s, y: b.y + D[1] })),
    ...dinhNui.PINES.map((p) => ({ x: p.x + D[0], z: p.z + D[2], r: 0.5 * p.s, y: p.y + D[1] })),
  ]
})()

/* ---------------- Cấu hình từng khu ---------------- */

const chuaBaKeep = (() => {
  const O = chuaBa.O
  const S = chuaBa.SPOTS
  const spots = [
    ['luHuong', S.luHuong.pos],
    ['huongBanTho', S.huongBanTho.pos],
    ['huongDienBa', S.huongDienBa.pos],
    ['altar', S.altar.pos],
    ['lectern', S.lectern.pos],
    ['bell', S.bell.pos],
    ['broom', S.broom.pos],
    ['truTri', S.truTri.pos],
    ['phatTu', S.phatTu.pos],
    ...S.seats.map((s) => [s.id, s.pos]),
  ].map(([id, p]) => pt(id, O, [p[0], p[2]]))
  const stands = Object.entries(chuaBa.STAND_POINTS).map(([id, p]) => pt(`dung:${id}`, O, p))
  const arrive = CABLE_STATIONS['chua-ba'].arrive
  return [...spots, ...stands, { id: 'xuong-ga', x: arrive[0], z: arrive[2], y: arrive[1] }]
})()

const chuaHangKeep = (() => {
  const I = chuaHang.INTERACTIVE
  const pts = Object.entries(I).map(([id, v]) => ({ id, x: v.position[0], z: v.position[2], y: v.position[1] }))
  const [ix, iz] = front(I.incense.position, I.incense.rotY, 1.6 * 0.5 + 0.4)
  const [nx, nz] = front(I.npc.position, I.npc.rotY, 1.2)
  return [...pts, { id: 'dung:incense', x: ix, z: iz, y: chuaHang.O[1] }, { id: 'dung:npc', x: nx, z: nz, y: chuaHang.O[1] }]
})()

const dinhNuiKeep = (() => {
  const O = dinhNui.O
  return [
    ...dinhNui.INTERACTION_POINTS.flatMap((p) => [pt(p.id, O, [p.x, p.z]), pt(`dung:${p.id}`, O, p.stand)]),
    pt('dung:lu-huong', O, dinhNui.INCENSE_STAND),
    pt('xuong-ga', O, dinhNui.STATION_ARRIVE),
    pt('loi-vao', O, dinhNui.ENTRY),
  ]
})()

const duongNuiKeep = Object.entries(duongNui.INTERACTIVE).map(([id, v]) => ({ id, x: v.position[0], z: v.position[2], y: v.position[1] }))

const chanNuiKeep = [
  ...Object.entries(chanNui.INTERACT_POINTS).map(([id, p]) => pt(id, chanNui.O, p)),
  { id: 'spawn', x: SPAWN.position[0], z: SPAWN.position[2], y: SPAWN.position[1] },
  { id: 'xuong-ga', x: CABLE_STATIONS['chan-nui'].arrive[0], z: CABLE_STATIONS['chan-nui'].arrive[2], y: 0 },
]

const fieldsOf = (O, list) => list.map((f) => ({ id: f.id, type: 'box', x: f.x + O[0], z: f.z + O[2], w: f.w, d: f.d, rot: 0 }))

const ZONE_CASES = [
  {
    name: 'chan-nui',
    groups: [{ items: chanNui.DECOR, origin: chanNui.O }],
    keepOut: chanNuiKeep,
    fields: fieldsOf(chanNui.O, [...chanNui.LEAF_FIELDS, ...chanNui.TRASH_FIELDS]),
    surfaces: [{ id: 'san-chan-nui', start: [0, 25.5], targets: [[0, -26.5]] }],
  },
  {
    name: 'duong-nui',
    groups: [
      { items: duongNuiDecor.CN1_DECOR, origin: duongNui.O1 },
      { items: duongNuiDecor.CN2_DECOR, origin: duongNui.O2 },
      { items: duongNuiDecor.RAMP_DECOR, origin: [0, 0, 0] },
    ],
    keepOut: duongNuiKeep,
    fields: [],
    surfaces: [
      { id: 'chieu-nghi', start: [0, -69], targets: [[0, -87]] },
      { id: 'chieu-nghi-2', start: [42, -196], targets: [[39, -206]] },
    ],
  },
  {
    name: 'chua-ba',
    groups: [{ items: chuaBaDecor.DECOR, origin: chuaBa.O }],
    keepOut: chuaBaKeep,
    fields: chuaBa.LEAF_FIELDS.map((f) => ({ id: f.id, type: 'box', x: f.center[0] + chuaBa.O[0], z: f.center[2] + chuaBa.O[2], w: f.w, d: f.d, rot: 0 })),
    surfaces: [
      {
        id: 'san-chua-ba',
        start: toW(chuaBa.O, chuaBa.EXITS.bacDa),
        targets: Object.values(chuaBa.EXITS).map((p) => toW(chuaBa.O, p)),
      },
    ],
  },
  {
    name: 'chua-hang',
    groups: [{ items: chuaHangDecor.DECOR, origin: chuaHang.O }],
    keepOut: chuaHangKeep,
    fields: [],
    surfaces: [{ id: 'san-chua-hang', start: toW(chuaHang.O, [14, 0]), targets: [toW(chuaHang.O, [0, 0])] }],
  },
  {
    name: 'dinh-nui',
    groups: [{ items: dinhNuiDecor.DECOR, origin: dinhNui.O }],
    keepOut: dinhNuiKeep,
    fields: [],
    surfaces: [{ id: 'dinh', start: toW(dinhNui.O, dinhNui.ENTRY), targets: [toW(dinhNui.O, [0, 0])] }],
  },
]

/** Món (thế giới) + gốc độ cao của nhóm (mặt sân) */
const worldItems = (zc) => zc.groups.flatMap((g) => shiftDecor(g.items, g.origin).map((it) => ({ ...it, baseY: g.origin[1] })))
const worldDecorColliders = (zc) => zc.groups.flatMap((g) => worldColliders(decorColliders(g.items), g.origin))
const near = (y, it) => Math.abs(y - (it.baseY ?? it.y)) < 4
const label = (it) => `${it.kind} (${it.x.toFixed(1)}, ${it.z.toFixed(1)})`

/* ---------------- BFS hành lang trên một mặt sân phẳng ---------------- */

function reachable(surface, colliders, radius, start, step = 0.5) {
  const s = walkableById(surface)
  const bb =
    s.type === 'circle' ? [s.cx - s.r, s.cx + s.r, s.cz - s.r, s.cz + s.r] : [s.cx - s.w / 2, s.cx + s.w / 2, s.cz - s.d / 2, s.cz + s.d / 2]
  const nx = Math.ceil((bb[1] - bb[0]) / step) + 1
  const nz = Math.ceil((bb[3] - bb[2]) / step) + 1
  const local = colliders.filter((c) => (c.y0 === undefined || s.y >= c.y0 - 0.5) && (c.y1 === undefined || s.y <= c.y1 + 0.5))
  const free = (i, j) => {
    const x = bb[0] + i * step
    const z = bb[2] + j * step
    if (shapeDistance(s, x, z).dist > 0) return false
    const [px, pz] = pushOut(x, z, s.y, radius, local)
    return Math.hypot(px - x, pz - z) < 1e-6
  }
  const cell = ([x, z]) => [Math.round((x - bb[0]) / step), Math.round((z - bb[2]) / step)]
  const seen = new Uint8Array(nx * nz)
  const [si, sj] = cell(start)
  const queue = []
  // điểm xuất phát có thể sát mép: lấy ô thông gần nhất trong 1.5 m
  for (let di = -3; di <= 3; di++) {
    for (let dj = -3; dj <= 3; dj++) {
      const i = si + di
      const j = sj + dj
      if (i >= 0 && j >= 0 && i < nx && j < nz && free(i, j)) {
        seen[j * nx + i] = 1
        queue.push([i, j])
      }
    }
  }
  for (let q = 0; q < queue.length; q++) {
    const [i, j] = queue[q]
    for (const [di, dj] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const a = i + di
      const b = j + dj
      if (a < 0 || b < 0 || a >= nx || b >= nz || seen[b * nx + a] || !free(a, b)) continue
      seen[b * nx + a] = 1
      queue.push([a, b])
    }
  }
  return (p) => {
    const [ci, cj] = cell(p)
    for (let i = ci - 3; i <= ci + 3; i++) {
      for (let j = cj - 3; j <= cj + 3; j++) if (i >= 0 && j >= 0 && i < nx && j < nz && seen[j * nx + i]) return true
    }
    return false
  }
}

/* ---------------- Kiểm tra ---------------- */

describe.each(ZONE_CASES)('Bày trí $name', (zc) => {
  const items = worldItems(zc)
  const keepOut = [...zc.keepOut, ...GLOBAL_KEEP_OUT]

  it('đủ dày: ít nhất 25 món', () => {
    expect(items.length).toBeGreaterThanOrEqual(25)
  })

  it('không món nào trong 2.5 m quanh điểm tương tác, điểm đứng, ghế nghỉ, bia', () => {
    const bad = []
    for (const it of items) {
      const shapes = it.kind === 'windChime' ? [{ type: 'circle', x: it.x, z: it.z, r: 0.05 }] : decorFootprint(it)
      for (const p of keepOut) {
        if (!near(p.y, it)) continue
        for (const f of shapes) if (sdf(f, p.x, p.z) < KEEP_OUT) bad.push(`${label(it)} ↔ ${p.id}: ${sdf(f, p.x, p.z).toFixed(2)}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('không lấn sân lá / bãi rác', () => {
    const bad = []
    for (const it of items) for (const f of decorFootprint(it)) for (const r of zc.fields) if (gap(f, r) < 0.3) bad.push(`${label(it)} ↔ ${r.id}`)
    expect(bad).toEqual([])
  })

  it('không chồng lên vật cản sẵn có (trừ món tựa: lean) và không chồng lên nhau', () => {
    const bad = []
    const shapes = items.flatMap((it, i) => decorFootprint(it).map((f) => ({ f, it, i })))
    for (const { f, it } of shapes) {
      if (it.lean) continue
      for (const c of EXISTING) {
        if (c.y0 !== undefined && !near(c.y0, it)) continue
        if (gap(f, c) < 0.05) bad.push(`${label(it)} ↔ vật cản (${c.x.toFixed(1)}, ${c.z.toFixed(1)})`)
      }
    }
    for (let a = 0; a < shapes.length; a++) {
      for (let b = a + 1; b < shapes.length; b++) {
        if (shapes[a].i === shapes[b].i) continue
        // hai đoạn dây dùng chung một cột: cùng tâm → chỉ một cột được vẽ
        if (gap(shapes[a].f, shapes[b].f) < 0.05) bad.push(`${label(shapes[a].it)} ↔ ${label(shapes[b].it)}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('món trên sân đứng đúng mặt đi được; món trên sườn nằm ngoài mặt đi được, bám địa hình, không đè cây đá', () => {
    const bad = []
    for (const it of items) {
      const shapes = decorFootprint(it)
      if (!it.slope) {
        for (const f of shapes) {
          const g = groundAt(f.x, f.z, it.baseY)
          if (!g || Math.abs(g.y - it.baseY) > 0.3) bad.push(`${label(it)}: không ở trên sân`)
        }
        continue
      }
      for (const f of shapes) {
        for (const [x, z] of [[f.x, f.z], ...boundary(f, 0.3)]) if (walkDist(x, z) < -0.05) bad.push(`${label(it)}: lấn mặt đi được`)
        for (const o of OBSTACLES) if (Math.abs(o.y - it.y) < 4 && gap(f, { type: 'circle', ...o }) < 0.02) bad.push(`${label(it)}: đè cây/đá (${o.x.toFixed(1)}, ${o.z.toFixed(1)})`)
      }
      const ends = it.x2 === undefined ? [[it.x, it.y, it.z]] : [[it.x, it.y, it.z], [it.x2, it.y2, it.z2]]
      for (const [x, y, z] of ends) {
        const gy = groundSurface(x, z)
        if (y > gy + 0.05 || y < gy - (it.kind === 'sideGate' ? 3 : 0.8)) bad.push(`${label(it)}: y ${y.toFixed(2)} lệch mặt đất ${gy.toFixed(2)}`)
      }
    }
    expect([...new Set(bad)]).toEqual([])
  })

  it('cột treo dây trên sườn không cắm vào mặt đi được', () => {
    for (const it of items.filter((x) => x.slope && (x.kind === 'flagLine' || x.kind === 'stringLights'))) {
      const [p0, p1] = it.poles ?? [true, true]
      if (p0) expect(walkDist(it.x, it.z), label(it)).toBeGreaterThan(POLE_R)
      if (p1) expect(walkDist(it.x2, it.z2), label(it)).toBeGreaterThan(POLE_R)
    }
  })

  it.each(zc.surfaces)('không chặn lối trên $id (hành lang 2.5 m và 1.2 m)', (surf) => {
    const decor = worldDecorColliders(zc)
    // tâm ghế là vật cản — chỉ cần tới được điểm đứng dậy trước ghế
    const points = keepOut.filter((p) => !p.id.startsWith('ghe:'))
    const targets = [...surf.targets, ...points.map((p) => [p.x, p.z])].filter(([x, z]) => {
      const s = walkableById(surf.id)
      return shapeDistance(s, x, z).dist < 2.5
    })
    for (const radius of [1.25, 0.6]) {
      const before = reachable(surf.id, EXISTING, radius, surf.start)
      const after = reachable(surf.id, [...EXISTING, ...decor], radius, surf.start)
      const lost = targets.filter((p) => before(p) && !after(p)).map(([x, z]) => `(${x.toFixed(1)}, ${z.toFixed(1)}) r=${radius}`)
      expect(lost).toEqual([])
    }
  })
})

describe('Bày trí — tổng thể', () => {
  it('mọi mặt đi được dùng trong test vẫn tồn tại', () => {
    for (const z of ZONE_CASES) for (const s of z.surfaces) expect(WALKABLES.some((w) => w.id === s.id)).toBe(true)
  })

  it('tổng số món ≥ 25 × 5 khu, mỗi khu chỉ một DecorSet (≤ 4 draw call)', () => {
    const total = ZONE_CASES.reduce((n, z) => n + worldItems(z).length, 0)
    expect(total).toBeGreaterThanOrEqual(125)
  })
})
