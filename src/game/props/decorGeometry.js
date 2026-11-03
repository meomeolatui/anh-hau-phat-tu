import { BoxGeometry, ConeGeometry, CylinderGeometry, DodecahedronGeometry, IcosahedronGeometry, SphereGeometry, TorusGeometry } from 'three'
import { PALETTE } from '../materials'
import { Parts, atAll, buildAll, cached, curve, revolve, shade, sweep } from './geom'
import { seeded } from '../../lib/random'

/**
 * Hình học (thuần, không cần WebGL) của thư viện ĐỒ TRANG TRÍ — dùng bởi <DecorSet> trong decor.jsx.
 *
 * Hiệu năng: buildDecor(items) gộp TOÀN BỘ món của một khu thành tối đa 4 lưới (màu đỉnh, đèn đỏ, đèn vàng, nước)
 * → ~4 draw call cho hàng chục món. Hình học mẫu (hộp, trụ, cầu, tấm rào…) tạo một lần và cache.
 * Dữ liệu món (toạ độ, vật cản): xem decorKinds.js. Mặt trước mỗi món hướng +Z cục bộ.
 */

const TAU = Math.PI * 2
const POT_BLUE = '#2f5f9e'
const POT_BLUE_D = '#24497a'
const POT_WHITE = '#e9eef0'
const TERRA = '#b8643c'
const TERRA_D = '#94502f'
const SOIL = '#4a3526'
const GRANITE_L = '#b9b2a2'
const GRANITE_M = '#9d9585'
const GRANITE_D = '#7c776d'
const BAMBOO = '#c9a85e'
const BAMBOO_D = '#a8893f'
const BRICK = '#a8553a'
const BRICK_L = '#b9683f'
const ROPE = '#3b2a1a'
const ROOF = '#8a4a32'
const LACQUER_RED = '#9e2a22'
/** Cờ Phật giáo năm sắc: xanh – vàng – đỏ – trắng – cam */
const FLAG_COLORS = ['#2f6db5', '#f2c230', '#c8322b', '#f5f2ea', '#e8862d']
const FLOWER_COLORS = ['#f6d33c', '#f39bbb', '#f08a4b', '#f7f3e6', '#c8322b', '#a87ad8']
const SANDALS = ['#3b3b3b', '#8a5a3b', '#c8322b', '#2f6db5', '#d9c7a0', '#5f9a52']

/* ------------------------------------------------------------------ */
/* Hình học mẫu & bộ dựng                                              */
/* ------------------------------------------------------------------ */

const tmpl = (key, fn) => cached(`decor|${key}`, fn)
const boxGeo = () => tmpl('box', () => new BoxGeometry(1, 1, 1))
const sphereGeo = (seg) => tmpl(`sph|${seg}`, () => new SphereGeometry(1, seg, Math.max(4, Math.round(seg * 0.75))))
const icoGeo = () => tmpl('ico', () => new IcosahedronGeometry(1, 0))
const dodeGeo = () => tmpl('dode', () => new DodecahedronGeometry(1, 0))
const coneGeo = (seg) => tmpl(`cone|${seg}`, () => new ConeGeometry(1, 1, seg))
const halfTubeGeo = () => tmpl('halftube', () => new CylinderGeometry(1, 1, 1, 6, 1, true, 0, Math.PI))
const halfDiscGeo = () => tmpl('halfdisc', () => new CylinderGeometry(1, 1, 1, 10, 1, false, -Math.PI / 2, Math.PI))
const hemiGeo = () => tmpl('hemi', () => new SphereGeometry(1, 8, 4, 0, TAU, Math.PI / 2, Math.PI / 2))
const ringGeo = () => tmpl('ring', () => new TorusGeometry(1, 0.08, 4, 14))
const arcGeo = () => tmpl('arc', () => new TorusGeometry(1, 0.08, 4, 8, Math.PI))

/** Trụ có hai bán kính khác nhau: chuẩn hoá về bán kính lớn nhất = 1 để cache theo tỉ lệ */
function cylGeo(rt, rb, seg) {
  const m = Math.max(rt, rb)
  const a = Math.round((rt / m) * 1000) / 1000
  const b = Math.round((rb / m) * 1000) / 1000
  return [tmpl(`cyl|${a}|${b}|${seg}`, () => new CylinderGeometry(a, b, 1, seg)), m]
}

/** Tham số một mảnh cho Parts.add (null → mặc định) */
const opt = (color, s, p, r) => ({ color, s, p: p ?? undefined, r: r ?? undefined })

/** Bộ dựng: các nhóm hình học gộp theo vật liệu + ngăn xếp biến đổi chung */
class Kit {
  constructor() {
    this.P = { base: new Parts(), lamp: new Parts(), warm: new Parts(), water: new Parts() }
  }

  at(p, r, s, fn) {
    atAll(this.P, p, fn, r ?? [0, 0, 0], s ?? 1)
  }

  add(geo, o, bucket = 'base') {
    this.P[bucket].add(geo, o)
  }

  box(color, s, p, r, bucket) {
    this.add(boxGeo(), opt(color, s, p, r), bucket)
  }

  cyl(color, rt, rb, h, p, r, seg = 8, bucket) {
    const [g, m] = cylGeo(rt, rb, seg)
    this.add(g, opt(color, [m, h, m], p, r), bucket)
  }

  ball(color, s, p, r, seg = 8, bucket) {
    this.add(sphereGeo(seg), opt(color, s, p, r), bucket)
  }

  ico(color, s, p, r) {
    this.add(icoGeo(), opt(color, s, p, r))
  }

  rock(color, s, p, r) {
    this.add(dodeGeo(), opt(color, s, p, r))
  }

  cone(color, rad, h, p, r, seg = 6, bucket) {
    this.add(coneGeo(seg), opt(color, [rad, h, rad], p, r), bucket)
  }
}

const rng = (it, salt = 0) => seeded(Math.floor(Math.abs(it.x * 73.1 + it.z * 19.7 + salt * 7.3)) + 11)

/** Dây võng giữa hai điểm (độ võng `sag` ở giữa) */
function ropePoints(A, B, sag, n) {
  return curve(n, (t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t - sag * 4 * t * (1 - t), A[2] + (B[2] - A[2]) * t])
}

/** Hai đầu của món dạng tuyến (toạ độ chân + độ cao móc dây) */
function lineEnds(it, defH) {
  const y = it.y ?? 0
  const y2 = it.y2 ?? y
  const h = it.h ?? defH
  const h2 = it.h2 ?? h
  return { A: [it.x, y + h, it.z], B: [it.x2, y2 + h2, it.z2], y, y2, h, h2 }
}

/* ------------------------------------------------------------------ */
/* Cây cảnh & chậu                                                     */
/* ------------------------------------------------------------------ */

/** Đôn kê chậu: 'stone' trống đá, 'wood' kỷ gỗ sơn son */
function addStand(k, kind) {
  if (kind === 'wood') {
    k.box(PALETTE.lacquer, [0.62, 0.05, 0.5], [0, 0.47, 0])
    k.box(PALETTE.gold, [0.56, 0.02, 0.44], [0, 0.44, 0])
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(PALETTE.lacquer, [0.05, 0.45, 0.05], [sx * 0.26, 0.22, sz * 0.2])
    k.box(PALETTE.lacquer, [0.54, 0.05, 0.42], [0, 0.06, 0])
    return 0.5
  }
  k.cyl(GRANITE_L, 0.25, 0.3, 0.42, [0, 0.21, 0], null, 8)
  k.cyl(GRANITE_M, 0.27, 0.27, 0.05, [0, 0.12, 0], null, 8)
  k.cyl(GRANITE_L, 0.33, 0.28, 0.07, [0, 0.455, 0], null, 8)
  return 0.49
}

/** Tán lá dẹt kiểu bonsai: hai lớp màu */
function pad(k, p, r) {
  k.ico(PALETTE.leafDark, [r * 1.35, r * 0.5, r], p, [0, p[0] * 3, 0])
  k.ico(PALETTE.leaf, [r * 1.05, r * 0.38, r * 0.8], [p[0], p[1] + r * 0.22, p[2]], [0, p[2] * 5, 0])
}

/** Bonsai trong chậu chữ nhật men lam viền trắng; stand: 'stone' | 'wood' */
function bonsai(k, it) {
  const v = it.v ?? 0
  const y0 = it.stand ? addStand(k, it.stand) : 0
  k.at([0, y0, 0], null, 1, () => {
    k.box(POT_BLUE, [0.7, 0.2, 0.46], [0, 0.14, 0])
    k.box(POT_WHITE, [0.72, 0.05, 0.48], [0, 0.13, 0])
    k.box(POT_BLUE, [0.76, 0.05, 0.52], [0, 0.265, 0])
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(POT_BLUE_D, [0.1, 0.05, 0.08], [sx * 0.28, 0.025, sz * 0.17])
    k.box(SOIL, [0.66, 0.03, 0.42], [0, 0.29, 0])
    k.ico('#6f9a4a', [0.12, 0.04, 0.09], [0.2, 0.305, 0.1])
    k.rock(GRANITE_M, 0.07, [-0.22, 0.32, 0.09], [0.3, v, 0])
    const bend = v % 2 ? 1 : -1
    const pts = curve(6, (t) => [Math.sin(t * 2.6 + v) * 0.12 * bend + t * 0.08 * bend, 0.3 + t * 0.6, Math.cos(t * 2.2 + v) * 0.05])
    k.add(sweep(pts, (t) => 0.065 * (1 - t * 0.6), { radial: 5 }), { color: PALETTE.trunk })
    const top = pts[6]
    pad(k, [top[0], top[1] + 0.06, top[2]], 0.24)
    pad(k, [pts[3][0] - 0.24 * bend, pts[3][1] + 0.04, pts[3][2] + 0.05], 0.18)
    pad(k, [pts[4][0] + 0.22 * bend, pts[4][1] + 0.1, pts[4][2] - 0.06], 0.16)
    // cành nối ra hai tán phụ
    k.cyl(PALETTE.trunk, 0.02, 0.03, 0.26, [pts[3][0] - 0.12 * bend, pts[3][1], pts[3][2] + 0.02], [0, 0, 1.2 * bend])
    k.cyl(PALETTE.trunk, 0.02, 0.03, 0.24, [pts[4][0] + 0.1 * bend, pts[4][1] + 0.04, pts[4][2] - 0.03], [0, 0, -1.2 * bend])
  })
}

const potProfile = [
  [0.16, 0],
  [0.2, 0.02],
  [0.3, 0.42],
  [0.34, 0.45],
  [0.34, 0.5],
  [0.3, 0.5],
]

/** Chậu sành: thân nung đỏ, đai sẫm, mặt đất */
function terracottaPot(k, scale = 1, color = TERRA) {
  k.at([0, 0, 0], null, scale, () => {
    k.add(tmpl('pot', () => revolve(potProfile, 10)), { color })
    k.cyl(TERRA_D, 0.315, 0.31, 0.04, [0, 0.3, 0], null, 10)
    k.cyl(SOIL, 0.3, 0.3, 0.02, [0, 0.47, 0], null, 10)
  })
}

/** Cây chậu: v 0 cau kiểng · 1 bụi tròn · 2 mai vàng / hoa giấy · 3 trúc cảnh */
function pottedPlant(k, it) {
  const v = it.v ?? 0
  const rand = rng(it)
  terracottaPot(k)
  if (v === 0) {
    k.cyl(PALETTE.trunk, 0.035, 0.05, 0.9, [0, 0.9, 0], null, 6)
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + rand()
      k.at([0, 1.32, 0], [0, a, 0], 1, () => {
        k.cyl('#6f8f3a', 0.012, 0.016, 0.62, [0, 0.16, 0.26], [1.0, 0, 0], 4)
        k.ico(i % 2 ? PALETTE.leaf : PALETTE.leafDark, [0.1, 0.035, 0.36], [0, 0.18, 0.5], [0.5, 0, 0])
      })
    }
    return
  }
  if (v === 3) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU
      const h = 1.1 + rand() * 0.5
      k.cyl(i % 2 ? BAMBOO : '#7da04a', 0.018, 0.022, h, [Math.sin(a) * 0.1, 0.48 + h / 2, Math.cos(a) * 0.1], [Math.cos(a) * 0.08, 0, -Math.sin(a) * 0.08], 5)
      k.ico(PALETTE.leaf, [0.16, 0.26, 0.16], [Math.sin(a) * 0.2, 0.5 + h, Math.cos(a) * 0.2])
    }
    return
  }
  const leaf = v === 2 ? '#5d8a45' : PALETTE.leafDark
  k.ico(leaf, [0.34, 0.3, 0.34], [0, 0.75, 0], [0, rand() * 3, 0])
  k.ico(PALETTE.leaf, [0.26, 0.24, 0.26], [0.08, 0.98, -0.04], [0, rand() * 3, 0])
  k.ico(PALETTE.leafLight, [0.16, 0.14, 0.16], [-0.06, 1.12, 0.05])
  if (v !== 2) return
  const bloom = it.color ?? (rand() < 0.5 ? '#f6d33c' : '#f39bbb')
  for (let i = 0; i < 14; i++) {
    const a = rand() * TAU
    const y = 0.68 + rand() * 0.5
    const r = 0.3 - Math.abs(y - 0.85) * 0.35
    k.ico(bloom, 0.05, [Math.sin(a) * r, y, Math.cos(a) * r])
  }
}

/** Cụm ba chậu hoa nhỏ (cúc vàng, hoa hồng, dạ yến thảo) */
function potCluster(k, it) {
  const rand = rng(it)
  const spots = [
    [-0.2, -0.12, 0.62],
    [0.22, -0.05, 0.5],
    [0, 0.24, 0.42],
  ]
  spots.forEach(([x, z, s], i) => {
    k.at([x, 0, z], null, s, () => {
      terracottaPot(k, 1, i === 1 ? POT_BLUE : TERRA)
      k.ico(PALETTE.leafDark, [0.34, 0.24, 0.34], [0, 0.62, 0])
      const c = FLOWER_COLORS[Math.floor(rand() * FLOWER_COLORS.length)]
      for (let j = 0; j < 9; j++) {
        const a = (j / 9) * TAU + rand()
        k.ico(c, 0.07, [Math.sin(a) * 0.24, 0.7 + rand() * 0.12, Math.cos(a) * 0.24])
      }
    })
  })
}

/** Chậu sen men lam (v 1: men nâu) có lá sen, hoa và nụ sen */
function lotusBasin(k, it) {
  const glaze = it.v === 1 ? '#7a4a33' : '#3d6f8f'
  const rand = rng(it)
  const prof = [
    [0.5, 0],
    [0.62, 0.05],
    [0.78, 0.35],
    [0.82, 0.5],
    [0.86, 0.55],
    [0.8, 0.56],
  ]
  k.add(tmpl('basin', () => revolve(prof, 14)), { color: glaze })
  k.cyl(POT_WHITE, 0.795, 0.77, 0.08, [0, 0.33, 0], null, 14)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU
    k.box(POT_BLUE_D, [0.12, 0.05, 0.02], [Math.sin(a) * 0.8, 0.33, Math.cos(a) * 0.8], [0, a, 0])
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU
    k.box(shade(glaze, 0.7), [0.12, 0.06, 0.1], [Math.sin(a) * 0.55, 0.02, Math.cos(a) * 0.55], [0, a, 0])
  }
  k.cyl(PALETTE.water, 0.78, 0.78, 0.02, [0, 0.5, 0], null, 14, 'water')
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + rand()
    const r = 0.3 + rand() * 0.25
    k.cyl(i % 2 ? PALETTE.lotusLeaf : '#3f7d4c', 0.2, 0.2, 0.015, [Math.sin(a) * r, 0.53 + i * 0.01, Math.cos(a) * r], [rand() * 0.2, 0, rand() * 0.2], 10)
  }
  for (const [x, z, h, open] of [
    [0.15, -0.1, 0.36, true],
    [-0.25, 0.2, 0.28, true],
    [-0.05, 0.32, 0.45, false],
  ]) {
    k.cyl('#4f7a3a', 0.012, 0.012, h, [x, 0.5 + h / 2, z], null, 4)
    if (!open) {
      k.cone(PALETTE.lotus, 0.06, 0.16, [x, 0.58 + h, z], null, 6)
      continue
    }
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * TAU
      k.at([x, 0.5 + h, z], [0, a, 0], 1, () => k.cone(p % 2 ? PALETTE.lotus : '#f6c3d3', 0.05, 0.16, [0, 0.06, 0.05], [0.55, 0, 0], 5))
    }
    k.cyl('#f2c230', 0.04, 0.03, 0.04, [x, 0.53 + h, z], null, 6)
  }
}

/** Lu nước sành nâu trên bệ gạch, nắp gỗ, gáo dừa cán tre */
function waterJar(k) {
  k.box(BRICK, [0.72, 0.08, 0.72], [0, 0.04, 0])
  k.at([0, 0.08, 0], null, 1, () => {
    const prof = [
      [0.01, 0],
      [0.24, 0.01],
      [0.38, 0.18],
      [0.44, 0.38],
      [0.4, 0.58],
      [0.28, 0.7],
      [0.22, 0.74],
      [0.25, 0.78],
      [0.24, 0.8],
    ]
    k.add(tmpl('jar', () => revolve(prof, 12)), { color: '#5e3a24' })
    k.cyl('#7d5232', 0.432, 0.44, 0.05, [0, 0.45, 0], null, 12)
    k.cyl('#7d5232', 0.405, 0.42, 0.03, [0, 0.27, 0], null, 12)
    k.cyl(PALETTE.wood, 0.27, 0.27, 0.04, [0, 0.81, 0], null, 12)
    k.box(PALETTE.woodDark, [0.24, 0.04, 0.05], [0, 0.85, -0.08])
    // gáo dừa úp miệng lên trên, cán tre gác ra ngoài
    k.add(hemiGeo(), { color: '#6b4a2f', s: [0.1, 0.08, 0.1], p: [0.1, 0.92, 0.08] })
    k.cyl(BAMBOO, 0.014, 0.014, 0.5, [0.32, 0.93, 0.1], [0, 0, Math.PI / 2 - 0.12], 5)
  })
}

/* ------------------------------------------------------------------ */
/* Sân vườn                                                            */
/* ------------------------------------------------------------------ */

/** Bàn đá tròn + bốn đôn đá; trên bàn có ấm chén */
function stoneTable(k) {
  k.cyl(GRANITE_M, 0.34, 0.37, 0.08, [0, 0.04, 0], null, 10)
  k.cyl(GRANITE_M, 0.19, 0.25, 0.52, [0, 0.33, 0], null, 10)
  k.cyl(GRANITE_D, 0.55, 0.6, 0.04, [0, 0.6, 0], null, 14)
  k.cyl(GRANITE_L, 0.62, 0.62, 0.09, [0, 0.665, 0], null, 14)
  k.cyl(PALETTE.wood, 0.17, 0.17, 0.015, [0.1, 0.718, 0], null, 10)
  k.ball('#7d5232', [0.08, 0.06, 0.08], [0.1, 0.78, 0])
  k.cone('#7d5232', 0.015, 0.08, [0.18, 0.79, 0], [0, 0, -1], 4)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU
    k.cyl(POT_WHITE, 0.03, 0.025, 0.04, [0.1 + Math.sin(a) * 0.12, 0.745, Math.cos(a) * 0.12], null, 6)
  }
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i / 4) * TAU
    const p = [Math.sin(a) * 0.95, 0, Math.cos(a) * 0.95]
    k.cyl(GRANITE_L, 0.18, 0.2, 0.42, [p[0], 0.21, p[2]], null, 10)
    k.cyl(GRANITE_M, 0.215, 0.215, 0.12, [p[0], 0.22, p[2]], null, 10)
    k.cyl('#c9c2b2', 0.17, 0.18, 0.03, [p[0], 0.43, p[2]], null, 10)
  }
}

/** Luống hoa viền gạch nghiêng răng cưa: w × d (m) */
function flowerBed(k, it) {
  const w = it.w ?? 3
  const d = it.d ?? 1.2
  const rand = rng(it)
  k.box('#5a4030', [w - 0.1, 0.16, d - 0.1], [0, 0.08, 0])
  const edge = (len, place) => {
    const n = Math.max(2, Math.round(len / 0.26))
    for (let i = 0; i < n; i++) place(-len / 2 + ((i + 0.5) * len) / n, i)
  }
  for (const s of [-1, 1]) {
    edge(w, (x, i) => k.box(i % 2 ? BRICK : BRICK_L, [0.24, 0.16, 0.1], [x, 0.09, s * (d / 2 - 0.05)], [0, 0, s * 0.25]))
    edge(d - 0.2, (z, i) => k.box(i % 2 ? BRICK_L : BRICK, [0.1, 0.16, 0.24], [s * (w / 2 - 0.05), 0.09, z], [s * 0.25, 0, 0]))
  }
  const cols = Math.max(1, Math.floor((w - 0.3) / 0.36))
  const rows = Math.max(1, Math.floor((d - 0.3) / 0.36))
  const palette = it.colors ?? [FLOWER_COLORS[Math.floor(rand() * 3)], FLOWER_COLORS[3 + Math.floor(rand() * 3)]]
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = -((cols - 1) * 0.36) / 2 + i * 0.36 + (rand() - 0.5) * 0.08
      const z = -((rows - 1) * 0.36) / 2 + j * 0.36 + (rand() - 0.5) * 0.08
      k.ico(j % 2 ? PALETTE.leaf : PALETTE.leafDark, [0.15, 0.12, 0.15], [x, 0.24, z], [0, rand() * 3, 0])
      k.ball(palette[(i + j) % palette.length], 0.065, [x + 0.03, 0.36 + rand() * 0.06, z - 0.02], null, 5)
    }
  }
}

/** Hòn non bộ: bể đá bát giác, núi đá chồng, thác nhỏ, tháp tí hon, cây thông lùn, cầu cong, cá chép */
function rockery(k, it) {
  const rand = rng(it)
  k.cyl(GRANITE_L, 1.33, 1.4, 0.42, [0, 0.21, 0], [0, Math.PI / 8, 0], 8)
  k.cyl(GRANITE_M, 1.44, 1.44, 0.06, [0, 0.44, 0], [0, Math.PI / 8, 0], 8)
  k.cyl(PALETTE.water, 1.26, 1.26, 0.02, [0, 0.4, 0], null, 16, 'water')
  const rocks = [
    [0, 0.65, -0.3, 0.62, 0.6, 0.52],
    [0.18, 1.15, -0.35, 0.44, 0.58, 0.38],
    [-0.06, 1.62, -0.4, 0.27, 0.48, 0.26],
    [-0.48, 0.8, -0.12, 0.4, 0.42, 0.36],
    [0.55, 0.7, 0.05, 0.34, 0.34, 0.3],
    [-0.25, 0.52, 0.35, 0.26, 0.2, 0.22],
    [0.42, 1.0, -0.55, 0.26, 0.3, 0.24],
  ]
  rocks.forEach(([x, y, z, sx, sy, sz], i) => k.rock([GRANITE_M, '#8d877b', GRANITE_D][i % 3], [sx, sy, sz], [x, y, z], [rand(), rand() * 3, rand() * 0.4]))
  // tháp ba tầng tí hon trên gờ đá
  k.at([0.5, 1.02, 0.02], null, 1, () => {
    for (let i = 0; i < 3; i++) {
      const s = 0.1 - i * 0.022
      k.box('#e6dcc6', [s, 0.08, s], [0, 0.04 + i * 0.1, 0])
      k.cone(ROOF, s * 1.05, 0.05, [0, 0.105 + i * 0.1, 0], [0, Math.PI / 4, 0], 4)
    }
    k.cone(PALETTE.gold, 0.012, 0.08, [0, 0.36, 0], null, 4)
  })
  // thông lùn
  for (const [x, y, z, s] of [
    [-0.08, 1.98, -0.42, 1],
    [-0.52, 1.12, -0.1, 0.8],
    [0.22, 1.62, -0.25, 0.7],
  ]) {
    k.cyl(PALETTE.trunk, 0.012, 0.018, 0.16 * s, [x, y + 0.06 * s, z], null, 4)
    k.cone(PALETTE.leafDark, 0.1 * s, 0.14 * s, [x, y + 0.16 * s, z], null, 6)
    k.cone('#4f8a4a', 0.07 * s, 0.11 * s, [x, y + 0.24 * s, z], null, 6)
  }
  // thác nước chảy xuống bể
  k.box(PALETTE.water, [0.16, 0.78, 0.03], [0.06, 0.88, 0.04], [-0.28, 0, 0], 'water')
  k.box('#dff1f4', [0.2, 0.05, 0.12], [0.06, 0.43, 0.2], null, 'water')
  for (const [x, z] of [
    [0, 0.24],
    [0.12, 0.22],
    [0.05, 0.3],
  ]) {
    k.ball('#f4fbfc', 0.045, [x, 0.42, z], null, 6)
  }
  // cầu cong và cá chép
  k.add(arcGeo(), { color: '#a8322d', s: [0.2, 0.16, 0.5], p: [-0.62, 0.42, 0.42], r: [0, 0.9, 0] })
  for (const [x, z, a] of [
    [0.75, 0.55, 0.4],
    [-0.4, 0.85, 2.2],
    [0.2, 0.95, 4],
  ]) {
    k.ball(a > 3 ? '#f5f2ea' : '#f08a4b', [0.07, 0.025, 0.028], [x, 0.41, z], [0, a, 0], 6)
  }
  k.cyl(PALETTE.lotusLeaf, 0.14, 0.14, 0.012, [-0.75, 0.415, -0.35], null, 8)
  k.cyl('#3f7d4c', 0.11, 0.11, 0.012, [0.85, 0.415, -0.4], null, 8)
}

/* ------------------------------------------------------------------ */
/* Dây phướn, đèn dây, chuông gió                                      */
/* ------------------------------------------------------------------ */

/** Cột treo dây: chân đá, cột sơn son (hoặc tre), chóp đồng */
function pole(k, [x, y, z], h, color) {
  k.cyl(GRANITE_M, 0.2, 0.24, 0.26, [x, y + 0.13, z], null, 8)
  k.cyl(color, 0.045, 0.065, h, [x, y + h / 2 + 0.1, z], null, 6)
  k.ball(PALETTE.gold, 0.08, [x, y + h + 0.18, z], null, 8)
  k.cyl(PALETTE.gold, 0.07, 0.07, 0.04, [x, y + h + 0.06, z], null, 6)
}

/** Dây phướn ngũ sắc nối hai cột (hoặc hai điểm móc: poles [false, false]) */
function flagLine(k, it) {
  const { A, B, y, y2, h, h2 } = lineEnds(it, 5)
  const [p0, p1] = it.poles ?? [true, true]
  if (p0) pole(k, [it.x, y, it.z], h, PALETTE.lacquer)
  if (p1) pole(k, [it.x2, y2, it.z2], h2, PALETTE.lacquer)
  const len = Math.hypot(B[0] - A[0], B[2] - A[2])
  const pts = ropePoints(A, B, it.sag ?? len * 0.06, Math.max(6, Math.round(len / 0.6)))
  k.add(sweep(pts, 0.012, { radial: 3 }), { color: ROPE })
  const yaw = Math.atan2(-(B[2] - A[2]), B[0] - A[0])
  const m = Math.max(2, Math.floor(len / 0.42))
  for (let j = 0; j < m; j++) {
    const t = (j + 0.5) / m
    const sagT = (it.sag ?? len * 0.06) * 4 * t * (1 - t)
    const p = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t - sagT, A[2] + (B[2] - A[2]) * t]
    k.at(p, [0, yaw, 0], 1, () => k.add(coneGeo(3), { color: FLAG_COLORS[j % 5], s: [0.16, 0.34, 0.035], p: [0, -0.18, 0], r: [Math.PI, 0, 0] }))
  }
}

/** Chuỗi đèn lồng treo dây (đỏ xen vàng) — phát sáng ban đêm, không kèm nguồn sáng thật */
function stringLights(k, it) {
  const { A, B, y, y2, h, h2 } = lineEnds(it, 3.4)
  const [p0, p1] = it.poles ?? [true, true]
  if (p0) pole(k, [it.x, y, it.z], h, BAMBOO_D)
  if (p1) pole(k, [it.x2, y2, it.z2], h2, BAMBOO_D)
  const len = Math.hypot(B[0] - A[0], B[2] - A[2])
  const sag = it.sag ?? len * 0.05
  k.add(sweep(ropePoints(A, B, sag, Math.max(6, Math.round(len / 0.6))), 0.01, { radial: 3 }), { color: ROPE })
  const m = Math.max(2, Math.floor(len / (it.every ?? 0.95)))
  for (let j = 0; j < m; j++) {
    const t = (j + 0.5) / m
    const p = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t - sag * 4 * t * (1 - t), A[2] + (B[2] - A[2]) * t]
    k.at(p, null, 1, () => {
      k.cyl(ROPE, 0.006, 0.006, 0.14, [0, -0.07, 0], null, 3)
      k.cyl(PALETTE.gold, 0.05, 0.065, 0.035, [0, -0.15, 0], null, 6)
      k.ball('#ffffff', [0.12, 0.14, 0.12], [0, -0.3, 0], null, 8, j % 3 === 2 ? 'warm' : 'lamp')
      k.cyl(PALETTE.gold, 0.065, 0.05, 0.035, [0, -0.45, 0], null, 6)
      k.cone('#c8322b', 0.03, 0.12, [0, -0.53, 0], [Math.PI, 0, 0], 4)
    })
  }
}

/** Chuông gió: v 0 ống đồng + lá phướn đỏ, v 1 chuông đồng nhỏ + lá bồ đề. y = điểm móc dưới mái */
function windChime(k, it) {
  k.cyl(ROPE, 0.005, 0.005, 0.24, [0, -0.12, 0], null, 3)
  if (it.v === 1) {
    k.cyl(PALETTE.bronze, 0.02, 0.02, 0.04, [0, -0.25, 0], null, 6)
    k.cone(PALETTE.bronze, 0.09, 0.16, [0, -0.33, 0], null, 10)
    k.cyl(shade(PALETTE.bronze, 0.8), 0.095, 0.095, 0.03, [0, -0.41, 0], null, 10)
    k.cyl(ROPE, 0.004, 0.004, 0.22, [0, -0.47, 0], null, 3)
    k.cone(PALETTE.gold, 0.06, 0.16, [0, -0.62, 0], [Math.PI, 0, 0], 4)
    return
  }
  k.cyl(PALETTE.woodDark, 0.08, 0.08, 0.03, [0, -0.25, 0], null, 8)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU
    const h = 0.2 + i * 0.035
    k.cyl('#c9b27a', 0.011, 0.011, h, [Math.sin(a) * 0.055, -0.28 - h / 2, Math.cos(a) * 0.055], null, 5)
  }
  k.cyl(PALETTE.woodDark, 0.03, 0.03, 0.015, [0, -0.38, 0], null, 6)
  k.cyl(ROPE, 0.004, 0.004, 0.2, [0, -0.5, 0], null, 3)
  k.box('#c8322b', [0.08, 0.14, 0.006], [0, -0.66, 0])
  k.box(PALETTE.gold, [0.08, 0.015, 0.008], [0, -0.6, 0])
}

/* ------------------------------------------------------------------ */
/* Đồ dùng chùa & chợ                                                  */
/* ------------------------------------------------------------------ */

/** Kệ dép gỗ ba tầng có dép xếp đôi, vài đôi để trước kệ */
function shoeRack(k, it) {
  const rand = rng(it)
  for (const s of [-1, 1]) k.box(PALETTE.woodDark, [0.05, 0.8, 0.42], [s * 0.7, 0.4, 0])
  k.box(PALETTE.wood, [1.5, 0.04, 0.46], [0, 0.82, 0])
  k.box(PALETTE.woodDark, [1.4, 0.3, 0.02], [0, 0.6, -0.2])
  for (const y of [0.08, 0.36, 0.62]) {
    k.box(PALETTE.wood, [1.36, 0.03, 0.4], [0, y, 0])
    for (let i = 0; i < 4; i++) {
      if (rand() < 0.2) continue
      const c = SANDALS[Math.floor(rand() * SANDALS.length)]
      const x = -0.5 + i * 0.33
      for (const o of [-0.055, 0.055]) k.box(c, [0.09, 0.025, 0.25], [x + o, y + 0.03, 0.02], [0, (rand() - 0.5) * 0.2, 0])
    }
  }
  for (const x of [-0.35, 0.3]) {
    const c = SANDALS[Math.floor(rand() * SANDALS.length)]
    for (const o of [-0.06, 0.06]) k.box(c, [0.09, 0.025, 0.25], [x + o, 0.0125, 0.42], [0, (rand() - 0.5) * 0.5, 0])
  }
}

/** Bảng gỗ nội quy có mái nhỏ: tiêu đề đỏ, giấy ngà, dòng chữ */
function rulesBoard(k, it) {
  const rand = rng(it)
  for (const s of [-1, 1]) {
    k.box(GRANITE_M, [0.22, 0.12, 0.22], [s * 0.65, 0.06, 0])
    k.box(PALETTE.woodDark, [0.1, 1.95, 0.1], [s * 0.65, 0.98, 0])
  }
  k.box(PALETTE.wood, [1.3, 0.98, 0.06], [0, 1.36, 0])
  k.box('#f5efe0', [1.12, 0.78, 0.012], [0, 1.33, 0.034])
  k.box('#a8322d', [1.12, 0.14, 0.014], [0, 1.66, 0.035])
  for (let i = 0; i < 5; i++) k.box(PALETTE.gold, [0.08, 0.07, 0.006], [-0.3 + i * 0.15, 1.66, 0.044])
  for (let i = 0; i < 7; i++) {
    const wLine = 0.6 + rand() * 0.35
    k.box('#4a3a2c', [wLine, 0.024, 0.006], [-0.5 + wLine / 2, 1.53 - i * 0.085, 0.042])
  }
  for (const s of [-1, 1]) k.box(ROOF, [1.62, 0.04, 0.3], [0, 1.95, s * 0.12], [s * 0.5, 0, 0])
  k.cyl(PALETTE.roofDark, 0.03, 0.03, 1.66, [0, 2.0, 0], [0, 0, Math.PI / 2], 5)
}

/** Thùng công đức gỗ sơn son thếp vàng trên kỷ chân cao (chỉ trang trí) */
function donationBox(k) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(PALETTE.lacquer, [0.05, 0.45, 0.05], [sx * 0.24, 0.225, sz * 0.18])
  k.box(PALETTE.lacquer, [0.56, 0.06, 0.44], [0, 0.42, 0])
  k.box(PALETTE.lacquer, [0.5, 0.04, 0.38], [0, 0.12, 0])
  k.box(LACQUER_RED, [0.52, 0.44, 0.4], [0, 0.67, 0])
  for (const y of [0.46, 0.88]) k.box(PALETTE.gold, [0.54, 0.03, 0.42], [0, y, 0])
  k.box(LACQUER_RED, [0.56, 0.04, 0.44], [0, 0.91, 0])
  k.box('#2a1a12', [0.22, 0.012, 0.03], [0, 0.935, 0])
  k.box(PALETTE.gold, [0.32, 0.2, 0.012], [0, 0.69, 0.205])
  for (let i = 0; i < 3; i++) k.box(LACQUER_RED, [0.06, 0.12, 0.006], [-0.09 + i * 0.09, 0.69, 0.213])
  k.cone(PALETTE.gold, 0.06, 0.06, [0, 0.55, 0.205], [Math.PI / 2, 0, 0], 8)
}

/** Ba giỏ tre đan (trái cây, bó nhang, hoa cúc) và một nón lá */
function basket(k, it) {
  const rand = rng(it)
  const prof = [
    [0.18, 0],
    [0.24, 0.04],
    [0.3, 0.3],
    [0.32, 0.34],
  ]
  const one = (x, z, s, kind) =>
    k.at([x, 0, z], [0, rand() * 3, 0], s, () => {
      k.add(tmpl('basket', () => revolve(prof, 10)), { color: BAMBOO })
      for (const y of [0.1, 0.2]) k.cyl(BAMBOO_D, 0.275 + y * 0.12, 0.27 + y * 0.12, 0.025, [0, y, 0], null, 10)
      k.add(ringGeo(), { color: BAMBOO_D, s: [0.32, 0.32, 0.25], p: [0, 0.34, 0], r: [Math.PI / 2, 0, 0] })
      k.cyl('#6b5030', 0.28, 0.28, 0.02, [0, 0.3, 0], null, 10)
      if (kind === 0) {
        for (let i = 0; i < 6; i++) k.ball(i % 3 ? '#e8862d' : '#9ab84a', 0.08, [(rand() - 0.5) * 0.3, 0.36 + rand() * 0.06, (rand() - 0.5) * 0.3], null, 6)
      } else if (kind === 1) {
        for (let i = 0; i < 5; i++) {
          const p = [(rand() - 0.5) * 0.24, 0.5, (rand() - 0.5) * 0.24]
          k.cyl('#d9a441', 0.035, 0.035, 0.42, p, [(rand() - 0.5) * 0.3, 0, (rand() - 0.5) * 0.3], 5)
          k.cyl('#b0442f', 0.037, 0.037, 0.05, [p[0], 0.4, p[2]], null, 5)
        }
      } else {
        for (let i = 0; i < 7; i++) k.ico(i % 2 ? '#f6d33c' : '#f2c230', 0.07, [(rand() - 0.5) * 0.32, 0.38 + rand() * 0.08, (rand() - 0.5) * 0.32])
        k.ico(PALETTE.leaf, [0.2, 0.06, 0.2], [0, 0.34, 0])
      }
    })
  one(-0.22, 0.1, 1.1, 0)
  one(0.34, -0.12, 0.9, 1)
  one(0.05, -0.42, 0.75, 2)
  k.cone('#e6cf8f', 0.3, 0.14, [0.42, 0.42, 0.28], [0.5, 0, 0.35], 14)
}

/** Chồng gạch và ngói âm dương trên pallet gỗ (công quả sửa chùa) */
function tilePile(k, it) {
  const rand = rng(it)
  k.box(PALETTE.wood, [1.34, 0.08, 0.94], [0, 0.04, 0])
  for (let l = 0; l < 6; l++) {
    const rot = l % 2 ? Math.PI / 2 : 0
    for (let i = 0; i < 3; i++) {
      const o = (i - 1) * 0.125
      const p = rot ? [-0.36, 0.12 + l * 0.08, o] : [-0.36 + o, 0.12 + l * 0.08, 0]
      k.box(rand() < 0.5 ? BRICK : BRICK_L, [0.12, 0.075, 0.36], p, [0, rot + Math.PI / 2, 0])
    }
  }
  for (let i = 0; i < 9; i++) {
    k.add(halfTubeGeo(), { color: i % 2 ? ROOF : PALETTE.roof, s: [0.13, 0.34, 0.13], p: [0.32, 0.14 + i * 0.045, -0.05 + i * 0.012], r: [Math.PI / 2, 0, 0] })
  }
  k.add(halfTubeGeo(), { color: ROOF, s: [0.13, 0.34, 0.13], p: [0.3, 0.2, 0.42], r: [Math.PI / 2 + 0.5, 0.3, 0] })
}

/** Bó củi xếp giữa bốn cọc, có rìu bổ củi dựng bên cạnh */
function firewood(k, it) {
  const rand = rng(it)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl(PALETTE.woodDark, 0.03, 0.03, 0.75, [sx * 0.58, 0.37, sz * 0.27], null, 5)
  const rows = [5, 4, 3]
  rows.forEach((n, l) => {
    for (let i = 0; i < n; i++) {
      const z = (i - (n - 1) / 2) * 0.14
      const y = 0.07 + l * 0.12
      const len = 1.0 + rand() * 0.12
      k.cyl(rand() < 0.5 ? '#7a5134' : '#6b4a2f', 0.068, 0.07, len, [0, y, z], [0, 0, Math.PI / 2], 6)
      for (const s of [-1, 1]) k.cyl('#c9a36e', 0.058, 0.058, 0.012, [s * (len / 2 + 0.003), y, z], [0, 0, Math.PI / 2], 6)
    }
  })
  k.box(ROPE, [0.03, 0.42, 0.6], [-0.3, 0.2, 0])
  k.box(ROPE, [0.03, 0.42, 0.6], [0.3, 0.2, 0])
  k.cyl(PALETTE.wood, 0.02, 0.02, 0.6, [0.75, 0.3, 0.2], [0, 0, 0.25], 5)
  k.box('#5f5b53', [0.16, 0.08, 0.03], [0.68, 0.6, 0.2], [0, 0, 0.25])
}

/** Ghế băng gỗ (len m), có tựa lưng khi back = true */
function bench(k, it) {
  const len = it.len ?? 1.8
  for (const z of [-0.14, 0, 0.14]) k.box(PALETTE.wood, [len, 0.04, 0.12], [0, 0.45, z])
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) k.box(PALETTE.woodDark, [0.06, 0.43, 0.06], [sx * (len / 2 - 0.12), 0.215, sz * 0.18])
    k.box(PALETTE.woodDark, [0.05, 0.05, 0.4], [sx * (len / 2 - 0.12), 0.15, 0])
  }
  k.box(PALETTE.woodDark, [len - 0.3, 0.05, 0.04], [0, 0.15, 0])
  if (!it.back) return
  for (const sx of [-1, 1]) k.box(PALETTE.woodDark, [0.05, 0.45, 0.05], [sx * (len / 2 - 0.12), 0.68, -0.2], [-0.12, 0, 0])
  for (const y of [0.66, 0.84]) k.box(PALETTE.wood, [len, 0.1, 0.03], [0, y, -0.22], [-0.12, 0, 0])
}

/* ------------------------------------------------------------------ */
/* Rào, cổng, tháp, bia                                                */
/* ------------------------------------------------------------------ */

/**
 * Một tấm rào tre dài L (dọc +z cục bộ): các cọc tre so le cao thấp. dark: chỉ cọc sẫm (mỗi cọc thứ ba)
 * Cache theo chiều dài → cả hàng rào chỉ thêm vài mảnh mỗi tấm (dựng nhanh).
 */
function fencePanel(L, dark) {
  return tmpl(`fence|${L}|${dark}`, () => {
    const P = new Parts()
    const n = Math.max(2, Math.round(L / 0.2))
    const [g, m] = cylGeo(0.036, 0.04, 4)
    for (let i = 0; i < n; i++) {
      if ((i % 3 === 0) !== dark) continue
      const h = 0.95 + ((i * 7) % 3) * 0.07
      P.add(g, { s: [m, h, m], p: [0, h / 2, ((i + 0.5) * L) / n], r: [0, Math.PI / 4, 0] })
    }
    return P.build()
  })
}

/** Hàng rào tre từ (x,z) tới (x2,z2): từng tấm 2,4 m giữa các trụ gỗ, hai thanh ngang */
function bambooFence(k, it) {
  const y0 = it.y ?? 0
  const y1 = it.y2 ?? y0
  const dx = it.x2 - it.x
  const dz = it.z2 - it.z
  const len = Math.hypot(dx, dz)
  const yaw = Math.atan2(dx, dz)
  const panels = Math.max(1, Math.round(len / 2.4))
  const L = Math.round((len / panels) * 20) / 20
  const at = (t) => [it.x + dx * t, y0 + (y1 - y0) * t, it.z + dz * t]
  for (let i = 0; i < panels; i++) {
    const p = at(i / panels)
    k.add(fencePanel(L, false), { color: BAMBOO, p, r: [0, yaw, 0] })
    k.add(fencePanel(L, true), { color: BAMBOO_D, p, r: [0, yaw, 0] })
    const m = at((i + 0.5) / panels)
    for (const h of [0.35, 0.8]) k.cyl(BAMBOO_D, 0.025, 0.025, L, [m[0], m[1] + h, m[2]], [Math.PI / 2, yaw, 0, 'YXZ'], 5)
  }
  for (let i = 0; i <= panels; i++) {
    const [x, y, z] = at(i / panels)
    k.cyl(PALETTE.woodDark, 0.055, 0.065, 1.22, [x, y + 0.61, z], null, 6)
    k.cone(PALETTE.woodDark, 0.065, 0.08, [x, y + 1.26, z], null, 6)
  }
}

/** Rào đá thấp: khối đá xây so le, mũ đá, trụ búp sen mỗi ~2,4 m */
function stoneWall(k, it) {
  const y0 = it.y ?? 0
  const dx = it.x2 - it.x
  const dz = it.z2 - it.z
  const len = Math.hypot(dx, dz)
  const yaw = Math.atan2(dx, dz)
  k.at([it.x, y0, it.z], [0, yaw, 0], 1, () => {
    let z = 0
    let i = 0
    while (z < len - 0.05) {
      const l = Math.min(len - z, i % 2 ? 0.55 : 0.68)
      k.box(i % 3 ? GRANITE_L : GRANITE_M, [0.4, 0.22, l - 0.02], [0, 0.11, z + l / 2])
      k.box(i % 2 ? GRANITE_M : GRANITE_L, [0.36, 0.2, l - 0.02], [0, 0.32, z + l / 2 + (i % 2 ? 0.1 : -0.1)])
      z += l
      i++
    }
    k.box('#c9c2b2', [0.46, 0.07, len], [0, 0.455, len / 2])
    const posts = Math.max(1, Math.round(len / 2.4))
    for (let j = 0; j <= posts; j++) {
      const pz = (j * len) / posts
      k.box(GRANITE_L, [0.3, 0.7, 0.3], [0, 0.35, pz])
      k.box(GRANITE_M, [0.36, 0.06, 0.36], [0, 0.72, pz])
      k.ball(GRANITE_L, [0.11, 0.15, 0.11], [0, 0.82, pz], null, 6)
    }
  })
}

/** Cổng phụ nhỏ: hai trụ son, xà kép, biển tên, mái ngói nhỏ đầu đao, đèn lồng treo. w = lòng cổng */
function sideGate(k, it) {
  const w = it.w ?? 3
  const half = w / 2 + 0.2
  const H = it.h ?? 2.7
  for (const s of [-1, 1]) {
    k.box(GRANITE_M, [0.5, 0.25, 0.5], [s * half, 0.125, 0])
    k.box(PALETTE.pillarRed, [0.3, H, 0.3], [s * half, H / 2 + 0.2, 0])
    k.box(PALETTE.gold, [0.34, 0.06, 0.34], [s * half, H + 0.12, 0])
    k.box('#f2e2b5', [0.12, 1.3, 0.012], [s * half, 1.5, 0.156])
  }
  k.box(PALETTE.lacquer, [w + 1.1, 0.18, 0.26], [0, H + 0.25, 0])
  k.box(PALETTE.lacquer, [w + 0.5, 0.12, 0.2], [0, H - 0.25, 0])
  k.box(PALETTE.lacquer, [0.9, 0.36, 0.05], [0, H, 0.12])
  k.box(PALETTE.gold, [0.76, 0.24, 0.012], [0, H, 0.15])
  for (const s of [-1, 1]) k.box(ROOF, [w + 1.6, 0.06, 0.85], [0, H + 0.6, s * 0.33], [s * 0.5, 0, 0])
  k.cyl(PALETTE.roofDark, 0.06, 0.06, w + 1.5, [0, H + 0.8, 0], [0, 0, Math.PI / 2], 6)
  for (const s of [-1, 1]) {
    k.cone(PALETTE.roofDark, 0.07, 0.36, [s * (w / 2 + 0.85), H + 0.78, 0], [0, 0, -s * 0.9], 5)
    for (const sz of [-1, 1]) k.cone(PALETTE.roofDark, 0.04, 0.26, [s * (w / 2 + 0.75), H + 0.42, sz * 0.62], [sz * 0.8, 0, -s * 0.6], 4)
  }
  k.ball(PALETTE.gold, 0.1, [0, H + 0.92, 0], null, 8)
  for (const s of [-1, 1]) {
    k.cyl(ROPE, 0.006, 0.006, 0.3, [s * (w / 2 - 0.4), H - 0.46, 0], null, 3)
    k.ball('#ffffff', [0.16, 0.19, 0.16], [s * (w / 2 - 0.4), H - 0.78, 0], null, 8, 'lamp')
    k.cyl(PALETTE.gold, 0.07, 0.09, 0.04, [s * (w / 2 - 0.4), H - 0.59, 0], null, 6)
  }
}

/** Bảo tháp nhỏ nhiều tầng mái (tháp mộ chư tăng): bệ đá, khám thờ, mái đao, chóp sen búp */
function stupa(k, it) {
  const tiers = it.tiers ?? 5
  const body = it.color ?? '#e6dcc6'
  k.box(GRANITE_M, [1.7, 0.2, 1.7], [0, 0.1, 0])
  k.box(GRANITE_L, [1.46, 0.16, 1.46], [0, 0.28, 0])
  k.cyl('#c9c2b2', 0.62 * Math.SQRT2, 0.7 * Math.SQRT2, 0.12, [0, 0.42, 0], [0, Math.PI / 4, 0], 4)
  let y = 0.48
  for (let i = 0; i < tiers; i++) {
    const size = 0.95 - i * 0.13
    const th = i === 0 ? 0.72 : 0.4
    k.box(body, [size, th, size], [0, y + th / 2, 0])
    if (i === 0) {
      k.box('#3a2a20', [0.3, 0.4, 0.02], [0, y + 0.36, size / 2 + 0.001])
      k.box(PALETTE.gold, [0.36, 0.04, 0.03], [0, y + 0.58, size / 2])
      k.ball(PALETTE.gold, [0.06, 0.07, 0.04], [0, y + 0.34, size / 2 + 0.02], null, 6)
      k.ball(PALETTE.gold, 0.035, [0, y + 0.44, size / 2 + 0.02], null, 6)
    } else {
      for (const s of [-1, 1]) k.box('#3a2a20', [0.1, 0.16, 0.02], [s * size * 0.22, y + th / 2, size / 2 + 0.001])
    }
    y += th
    const e = size / 2 + 0.2
    k.cyl(ROOF, (size / 2) * Math.SQRT2 * 0.9, e * Math.SQRT2, 0.16, [0, y + 0.08, 0], [0, Math.PI / 4, 0], 4)
    k.box('#d9c9a8', [e * 2 - 0.05, 0.04, e * 2 - 0.05], [0, y + 0.01, 0])
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) k.cone(ROOF, 0.035, 0.16, [sx * e, y + 0.06, sz * e], [sz * 0.7, 0, -sx * 0.7], 4)
    }
    y += 0.16
  }
  k.cyl(PALETTE.gold, 0.1, 0.17, 0.12, [0, y + 0.06, 0], null, 8)
  for (let i = 0; i < 3; i++) k.cyl(PALETTE.gold, 0.08 - i * 0.018, 0.09 - i * 0.018, 0.06, [0, y + 0.16 + i * 0.08, 0], null, 8)
  k.ball(PALETTE.gold, 0.06, [0, y + 0.43, 0], null, 8)
  k.cone(PALETTE.gold, 0.035, 0.2, [0, y + 0.56, 0], null, 6)
}

/** Bia đá nhỏ đầu tròn trên đế, mặt khắc chữ */
function miniStele(k) {
  k.box(GRANITE_M, [0.85, 0.22, 0.48], [0, 0.11, 0])
  k.box(GRANITE_D, [0.9, 0.04, 0.52], [0, 0.02, 0])
  k.box(GRANITE_L, [0.6, 0.8, 0.13], [0, 0.62, 0])
  k.add(halfDiscGeo(), { color: GRANITE_L, s: [0.3, 0.13, 0.3], p: [0, 1.02, 0], r: [Math.PI / 2, 0, 0] })
  k.box('#8d877b', [0.44, 0.56, 0.01], [0, 0.66, 0.066])
  for (let i = 0; i < 4; i++) k.box('#4a453d', [0.03, 0.42, 0.006], [-0.13 + i * 0.087, 0.64, 0.072])
  k.box('#a8322d', [0.22, 0.05, 0.01], [0, 1.0, 0.068])
}

const BUILDERS = {
  bonsai,
  pottedPlant,
  potCluster,
  lotusBasin,
  waterJar,
  stoneTable,
  flowerBed,
  rockery,
  flagLine,
  stringLights,
  windChime,
  shoeRack,
  rulesBoard,
  donationBox,
  basket,
  tilePile,
  firewood,
  bench,
  bambooFence,
  stoneWall,
  sideGate,
  stupa,
  miniStele,
}

/** Món dựng bằng toạ độ tuyệt đối của hai đầu (không qua biến đổi vị trí/góc của món) */
const ABSOLUTE = new Set(['flagLine', 'stringLights', 'bambooFence', 'stoneWall'])

/**
 * Dựng hình học gộp cho cả danh sách món (thuần, không cần WebGL).
 * @returns {{ base: BufferGeometry|null, lamp: BufferGeometry|null, warm: BufferGeometry|null, water: BufferGeometry|null }}
 */
export function buildDecor(items) {
  const k = new Kit()
  for (const it of items) {
    const fn = BUILDERS[it.kind]
    if (!fn) throw new Error(`Không có món trang trí "${it.kind}"`)
    if (ABSOLUTE.has(it.kind)) fn(k, it)
    else k.at([it.x, it.y ?? 0, it.z], [0, it.rot ?? 0, 0], it.s ?? 1, () => fn(k, it))
  }
  return buildAll(k.P)
}

/** Tên các bộ dựng (test đối chiếu với DECOR_KINDS trong decorKinds.js) */
export const DECOR_BUILDERS = Object.keys(BUILDERS)
