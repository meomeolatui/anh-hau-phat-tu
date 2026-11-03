import { BoxGeometry, CircleGeometry, ConeGeometry, CylinderGeometry, SphereGeometry, TorusGeometry } from 'three'
import { PALETTE } from '../materials'
import { Parts, atAll, buildAll, curve, revolve, shade, sweep } from './geom'
import { addRoof, ridgeHalf, roofSurfaceFn } from './roofGeometry'

/**
 * Hàm dựng hình học (thuần) cho kiến trúc chùa — dùng bởi architecture.jsx (và BellTower).
 * Mỗi builder trả về { stone, body, tile, trim } (BufferGeometry gộp theo vật liệu, có màu đỉnh):
 *   stone (texture đá) · body (texture vữa: tường, cột, xà, chạm khắc) · tile (texture ngói) · trim (viền, rồng)
 */

const GOLD = PALETTE.gold
const LAC = PALETTE.lacquer
const BOX = new BoxGeometry(1, 1, 1)

export function newSet() {
  return { stone: new Parts(), body: new Parts(), tile: new Parts(), trim: new Parts() }
}

/* ------------------------------------------------------------------ */
/* Cột                                                                */
/* ------------------------------------------------------------------ */

/** Rồng cuốn cột: thân xoắn ốc quanh trụ, đầu ngẩng gần đầu cột, vây lưng */
function addCoilDragon(B, h, r) {
  const R = r * 1.18
  const turns = 2.2
  const pts = curve(40, (t) => {
    const a = t * turns * Math.PI * 2 + Math.PI * 0.2
    return [Math.sin(a) * R, 0.55 + t * (h - 0.75), Math.cos(a) * R]
  })
  B.add(sweep(pts, (t) => r * (0.07 + 0.22 * Math.sin(Math.min(1, t * 1.3) * Math.PI * 0.5)), { radial: 6, caps: true }), { color: GOLD })
  const fin = new ConeGeometry(r * 0.12, r * 0.45, 4)
  for (let i = 6; i < pts.length - 2; i += 3) {
    const p = pts[i]
    const a = Math.atan2(p[0], p[2])
    B.add(fin, { color: shade(GOLD, 0.8), p: [p[0] * 1.18, p[1] + r * 0.1, p[2] * 1.18], r: [Math.PI / 2, a, 0, 'YXZ'], s: [1, 1, 0.4] })
  }
  // Đầu rồng quay ra phía trước
  const head = pts[pts.length - 1]
  const ha = Math.atan2(head[0], head[2])
  B.at(head, [0, ha, 0], 1, (H) => {
    H.add(new SphereGeometry(r * 0.36, 8, 6), { color: GOLD, p: [0, r * 0.1, r * 0.15], s: [0.9, 0.8, 1.4] })
    H.add(new ConeGeometry(r * 0.2, r * 0.6, 5), { color: GOLD, p: [0, r * 0.05, r * 0.65], r: [Math.PI / 2, 0, 0] })
    for (const sx of [-1, 1]) {
      H.add(new ConeGeometry(r * 0.06, r * 0.55, 4), { color: shade(GOLD, 0.8), p: [sx * r * 0.18, r * 0.4, -r * 0.05], r: [-0.7, 0, sx * 0.3] })
    }
  })
}

/** Câu đối uốn theo mặt trước thân cột: nền son, viền vàng, chữ cách điệu (vạch vàng) */
function addCouplet(B, h, r, detail) {
  const ph = h * 0.6
  const py = 0.2 + h * 0.5
  const R = r * 1.035
  B.add(new CylinderGeometry(R, R, ph, 10, 1, true, -0.62, 1.24), { color: LAC, p: [0, py, 0] })
  for (const sy of [-1, 1]) {
    B.add(new CylinderGeometry(R + 0.008, R + 0.008, 0.035, 10, 1, true, -0.66, 1.32), { color: GOLD, p: [0, py + (sy * ph) / 2, 0] })
    B.add(BOX, { color: GOLD, p: [Math.sin(sy * 0.64) * R, py, Math.cos(0.64) * R], r: [0, sy * 0.64, 0], s: [0.025, ph, 0.02] })
  }
  if (detail === 0) return
  const n = Math.max(4, Math.round(ph / 0.3))
  const step = (ph - 0.2) / n
  for (let i = 0; i < n; i++) {
    const y = py + ph / 2 - 0.1 - step * (i + 0.5)
    // Mỗi "chữ": một nét ngang + một nét dọc + chấm, so le để không đều tăm tắp
    B.add(BOX, { color: GOLD, p: [0, y + step * 0.18, R + 0.006], s: [r * 0.62, step * 0.12, 0.015] })
    B.add(BOX, { color: GOLD, p: [(i % 2 ? 0.25 : -0.2) * r, y - step * 0.05, R + 0.006], s: [r * 0.12, step * 0.42, 0.015] })
    B.add(BOX, { color: GOLD, p: [(i % 2 ? -0.22 : 0.24) * r, y - step * 0.12, R + 0.006], s: [r * 0.22, step * 0.1, 0.015] })
  }
}

/**
 * Cột son: chân tảng đá bát giác hai tầng, vành cánh sen, đai vàng, câu đối hoặc rồng cuốn, đầu cột + đấu.
 * Gốc tại chân cột; thân từ y = 0.2 tới h + 0.2 (giữ kích thước cũ).
 */
export function addPillar(P, { h = 3.2, r = 0.18, color = PALETTE.pillarRed, couplet = true, dragon = false, detail = 1 }) {
  const S = P.stone
  const B = P.body
  S.add(new CylinderGeometry(r * 1.8, r * 1.95, 0.1, 8), { color: PALETTE.stoneDark, p: [0, 0.05, 0], tile: 0.6 })
  S.add(new CylinderGeometry(r * 1.45, r * 1.65, 0.16, 8), { color: PALETTE.stone, p: [0, 0.18, 0], tile: 0.6 })
  B.add(new CylinderGeometry(r, r * 1.05, h, 12), { color, p: [0, h / 2 + 0.2, 0], tile: 1 })
  if (detail > 0) {
    // Vành cánh sen ôm chân cột
    const petal = new SphereGeometry(r * 0.34, 6, 4)
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      B.add(petal, { color: GOLD, p: [Math.sin(a) * r * 1.05, 0.34, Math.cos(a) * r * 1.05], r: [0.35, a, 0, 'YXZ'], s: [1, 1.5, 0.45] })
    }
  }
  for (const [y, t] of [
    [0.48, 0.05],
    [h - 0.02, 0.05],
    [h - 0.1, 0.025],
  ]) {
    B.add(new CylinderGeometry(r * 1.06, r * 1.06, t, 12), { color: GOLD, p: [0, y, 0] })
  }
  B.add(new CylinderGeometry(r * 1.25, r * 1.1, 0.12, 12), { color: GOLD, p: [0, h + 0.22, 0] })
  B.add(BOX, { color: LAC, p: [0, h + 0.34, 0], s: [r * 2.5, 0.12, r * 2.5] })
  if (dragon) addCoilDragon(B, h, r)
  else if (couplet) addCouplet(B, h, r, detail)
}

/* ------------------------------------------------------------------ */
/* Chi tiết chạm khắc dùng chung                                      */
/* ------------------------------------------------------------------ */

/** Hoa thị tròn (rosette) nhìn theo +Z: đĩa, vành, 8 cánh */
function addRosette(B, p, rad, detail) {
  B.at(p, [Math.PI / 2, 0, 0], 1, (R) => {
    R.add(new CylinderGeometry(rad * 0.45, rad * 0.45, 0.09, 10), { color: GOLD })
    R.add(new TorusGeometry(rad, rad * 0.12, 4, 14), { color: GOLD, r: [Math.PI / 2, 0, 0] })
  })
  if (detail === 0) return
  const petal = new SphereGeometry(rad * 0.28, 5, 3)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    B.add(petal, { color: shade(GOLD, 0.85), p: [p[0] + Math.cos(a) * rad * 0.68, p[1] + Math.sin(a) * rad * 0.68, p[2]], r: [0, 0, a - Math.PI / 2], s: [0.7, 1.4, 1.6] })
  }
}

/**
 * Cửa võng / diềm chạm: tấm son có song vàng dọc, mép dưới cong võng (arch > 0) hoặc thẳng,
 * viền vàng và hoa thị. Nằm trong mặt phẳng z, mép trên tại y = top.
 */
function addArchPanel(B, { cx = 0, width, height, arch = 0, z, top, detail }) {
  const hb = width / 2
  const N = Math.max(6, Math.round(width / (detail > 0 ? 0.16 : 0.32)))
  const hAt = (s) => height * (arch ? 1 - arch + arch * s * s : 1)
  for (let i = 0; i < N; i++) {
    const s = ((i + 0.5) / N) * 2 - 1
    const ph = hAt(s)
    B.add(BOX, { color: LAC, p: [cx + s * hb, top - ph / 2, z], s: [width / N + 0.004, ph, 0.04] })
    if (i > 0) {
      const s0 = (i / N) * 2 - 1
      const p0 = hAt(s0)
      B.add(BOX, { color: GOLD, p: [cx + s0 * hb, top - p0 / 2, z], s: [0.022, p0, 0.07] })
    }
  }
  // Thanh ngang giữa (song lá) — chỉ ở phần tấm đủ cao
  if (detail > 0) {
    const mid = height * (arch ? 0.45 * (1 - arch) + 0.12 : 0.5)
    B.add(BOX, { color: GOLD, p: [cx, top - mid, z], s: [width * (arch ? 0.98 : 1), 0.022, 0.07] })
  }
  B.add(BOX, { color: GOLD, p: [cx, top - 0.025, z], s: [width + 0.02, 0.05, 0.08] })
  if (arch) {
    const rim = curve(18, (t) => {
      const s = t * 2 - 1
      return [cx + s * hb, top - hAt(s), z]
    })
    B.add(sweep(rim, 0.03, { radial: 5 }), { color: GOLD })
    for (const s of [-0.72, 0.72]) addRosette(B, [cx + s * hb, top - hAt(s) * 0.5, z], Math.min(0.14, height * 0.22), detail)
  } else {
    B.add(BOX, { color: GOLD, p: [cx, top - height + 0.02, z], s: [width + 0.02, 0.04, 0.08] })
    addRosette(B, [cx, top - height / 2, z], Math.min(0.14, height * 0.3), detail)
  }
}

/** Cửa sổ tròn hoa sen, nhìn theo +Z cục bộ: vành vàng, nền son, song chữ thập + chéo, hoa sen tám cánh */
function addRoundWindow(B, R, detail) {
  B.add(new TorusGeometry(R, R * 0.1, 5, 24), { color: GOLD, p: [0, 0, 0.02] })
  B.add(new CircleGeometry(R * 0.95, 20), { color: shade(LAC, 0.7), p: [0, 0, 0.008] })
  for (let i = 0; i < 4; i++) {
    B.add(BOX, { color: GOLD, p: [0, 0, 0.02], r: [0, 0, (i * Math.PI) / 4], s: [R * 1.9, 0.03, 0.025] })
  }
  if (detail > 0) {
    B.add(new TorusGeometry(R * 0.55, R * 0.035, 4, 18), { color: GOLD, p: [0, 0, 0.022] })
    const petal = new SphereGeometry(R * 0.2, 6, 4)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8
      B.add(petal, { color: GOLD, p: [Math.cos(a) * R * 0.32, Math.sin(a) * R * 0.32, 0.03], r: [0, 0, a - Math.PI / 2], s: [0.6, 1.35, 0.35] })
    }
  }
  B.add(new CylinderGeometry(R * 0.14, R * 0.14, 0.06, 10), { color: GOLD, p: [0, 0, 0.03], r: [Math.PI / 2, 0, 0] })
}

/** Bảng chữ (hoành phi / biển): nền son, khung vàng, các khối chữ vàng; mặt trước +Z */
function addPlaque(B, w, hgt, chars, detail) {
  B.add(BOX, { color: LAC, s: [w, hgt, 0.08] })
  const t = Math.min(0.05, hgt * 0.1)
  for (const sy of [-1, 1]) B.add(BOX, { color: GOLD, p: [0, (sy * (hgt - t)) / 2, 0.03], s: [w, t, 0.04] })
  for (const sx of [-1, 1]) B.add(BOX, { color: GOLD, p: [(sx * (w - t)) / 2, 0, 0.03], s: [t, hgt, 0.04] })
  const cw = (w * 0.8) / chars
  for (let i = 0; i < chars; i++) {
    const x = -w * 0.4 + cw * (i + 0.5)
    B.add(BOX, { color: GOLD, p: [x, hgt * 0.12, 0.045], s: [cw * 0.62, hgt * 0.1, 0.02] })
    if (detail > 0) {
      B.add(BOX, { color: GOLD, p: [x - cw * 0.08, -hgt * 0.05, 0.045], s: [cw * 0.1, hgt * 0.42, 0.02] })
      B.add(BOX, { color: GOLD, p: [x + cw * 0.15, -hgt * 0.12, 0.045], s: [cw * 0.32, hgt * 0.08, 0.02] })
    }
  }
  // Hai đầu cuộn thư
  for (const sx of [-1, 1]) {
    B.add(new CylinderGeometry(hgt * 0.16, hgt * 0.16, hgt * 1.05, 8), { color: GOLD, p: [sx * (w / 2 + hgt * 0.1), 0, 0] })
  }
}

/** Tay vịn rồng đá: thân rồng uốn sóng chạy dọc +Z từ z0 tới z1, đầu rồng ở z1 ngẩng lên */
function addDragonRail(S, x, z0, z1, y0, y1, detail) {
  const len = z1 - z0
  const pts = curve(detail > 0 ? 20 : 10, (t) => [x, y0 + (y1 - y0) * t + 0.42 + Math.sin(t * Math.PI * 3) * 0.07 * (1 - t * 0.4), z0 + t * len])
  // Bệ đỡ (bệ tay vịn)
  S.add(BOX, { color: PALETTE.stoneDark, p: [x, (y0 + y1) / 2 + 0.12, (z0 + z1) / 2], s: [0.34, Math.max(0.2, Math.abs(y0 - y1) + 0.24), len] })
  S.add(sweep(pts, (t) => 0.075 + 0.03 * t, { radial: 6, caps: true }), { color: PALETTE.stone })
  const end = pts[pts.length - 1]
  S.add(new SphereGeometry(0.13, 8, 6), { color: PALETTE.stone, p: [x, end[1] + 0.08, end[2] + 0.04], s: [0.85, 0.9, 1.3] })
  S.add(new ConeGeometry(0.07, 0.22, 5), { color: PALETTE.stone, p: [x, end[1] + 0.05, end[2] + 0.22], r: [Math.PI / 2, 0, 0] })
  if (detail > 0) {
    const fin = new ConeGeometry(0.035, 0.16, 4)
    for (let i = 2; i < pts.length - 2; i += 3) S.add(fin, { color: PALETTE.stoneDark, p: [x, pts[i][1] + 0.08, pts[i][2]], r: [-0.5, 0, 0], s: [0.4, 1, 1] })
    for (const sx of [-1, 1]) S.add(new ConeGeometry(0.025, 0.18, 4), { color: PALETTE.stoneDark, p: [x + sx * 0.05, end[1] + 0.22, end[2] - 0.04], r: [-0.6, 0, sx * 0.25] })
    // Cuộn mây ở chân
    S.add(new TorusGeometry(0.1, 0.035, 5, 12, Math.PI * 1.5), { color: PALETTE.stone, p: [x, y0 + 0.36, z0 + 0.08], r: [0, Math.PI / 2, 0] })
  }
}

/* ------------------------------------------------------------------ */
/* Chánh điện                                                         */
/* ------------------------------------------------------------------ */

export function buildHall({ w, d, h, tiers, wall, roof, open, steps, detail }) {
  const P = newSet()
  const S = P.stone
  const B = P.body
  const wallDark = shade(wall, 0.72)
  const wallMid = shade(wall, 0.88)

  // Nền: thân nền, gờ chỉ, chân đế; sàn lát trong điện
  S.add(new BoxGeometry(w + 1.2, 0.14, d + 1.6), { color: PALETTE.stone, p: [0, 0.06, 0], tile: 1.2 })
  S.add(new BoxGeometry(w + 1.34, 0.035, d + 1.74), { color: PALETTE.stoneDark, p: [0, 0.105, 0], tile: 1.2 })
  S.add(new BoxGeometry(w + 1.4, 0.05, d + 1.8), { color: PALETTE.stoneDark, p: [0, 0.01, 0], tile: 1.2 })
  S.add(new BoxGeometry(w - 0.4, 0.04, d - 0.6), { color: PALETTE.tile, p: [0, 0.14, -0.3], tile: 0.9 })

  // Bậc thềm tuỳ chọn trước gian giữa
  const cols = Math.max(2, Math.round(w / 3))
  const pillarsX = Array.from({ length: cols + 1 }, (_, i) => -w / 2 + 0.5 + (i * (w - 1)) / cols)
  // Gian giữa: giữa hai cột trung tâm (số gian lẻ) hoặc hai cột kề cột giữa (số gian chẵn)
  const stairW = ((cols % 2 === 0 ? 2 : 1) * (w - 1)) / cols
  const front = d / 2 + 0.8
  for (let i = 0; i < steps; i++) {
    const top = 0.13 * (1 - (i + 1) / (steps + 1))
    S.add(new BoxGeometry(stairW, Math.max(0.03, top + 0.02), 0.34), { color: i % 2 ? PALETTE.stone : PALETTE.stoneDark, p: [0, top / 2 - 0.01, front + 0.17 + i * 0.34], tile: 0.8 })
  }
  // Tay vịn rồng đá: mọc ra trước chân hai cột gian giữa, đầu rồng hướng ra sân
  for (const sx of [-1, 1]) addDragonRail(S, (sx * stairW) / 2, d / 2 + 0.02, steps ? front + steps * 0.34 - 0.1 : d / 2 + 0.5, 0.13, 0.05, detail)

  // Tường sau + hai bên (vữa), chân tường sẫm, diềm tường son chỉ vàng
  B.add(new BoxGeometry(w - 0.2, h, 0.3), { color: wall, p: [0, h / 2 + 0.14, -d / 2 + 0.15], tile: 1.5 })
  B.add(new BoxGeometry(w - 0.14, 0.42, 0.36), { color: wallDark, p: [0, 0.35, -d / 2 + 0.15], tile: 1.5 })
  B.add(new BoxGeometry(w - 0.14, 0.3, 0.34), { color: LAC, p: [0, h - 0.01, -d / 2 + 0.15] })
  B.add(new BoxGeometry(w - 0.12, 0.04, 0.38), { color: GOLD, p: [0, h - 0.17, -d / 2 + 0.15] })
  const sideLen = d - 1.4
  for (const s of [-1, 1]) {
    const x = s * (w / 2 - 0.25)
    B.add(new BoxGeometry(0.3, h, sideLen), { color: wall, p: [x, h / 2 + 0.14, -0.6], tile: 1.5 })
    B.add(new BoxGeometry(0.36, 0.42, sideLen + 0.04), { color: wallDark, p: [x, 0.35, -0.6], tile: 1.5 })
    B.add(new BoxGeometry(0.34, 0.3, sideLen), { color: LAC, p: [x, h - 0.01, -0.6] })
    B.add(new BoxGeometry(0.38, 0.04, sideLen + 0.02), { color: GOLD, p: [x, h - 0.17, -0.6] })
    // Gờ chỉ ngang ngoài tường
    B.add(new BoxGeometry(0.34, 0.05, sideLen), { color: wallMid, p: [x, h * 0.36 + 0.14, -0.6] })
    // Đầu tường mặt tiền: trụ vuông có câu đối phẳng
    const zf = d / 2 - 1.3
    B.add(new BoxGeometry(0.46, h + 0.05, 0.4), { color: wallMid, p: [x, h / 2 + 0.14, zf], tile: 1.5 })
    B.add(BOX, { color: LAC, p: [x, h * 0.55, zf + 0.21], s: [0.3, h * 0.6, 0.03] })
    B.add(BOX, { color: GOLD, p: [x, h * 0.55, zf + 0.225], s: [0.24, h * 0.56, 0.01] })
    B.add(BOX, { color: LAC, p: [x, h * 0.55, zf + 0.232], s: [0.2, h * 0.52, 0.01] })
    if (detail > 0) {
      for (let i = 0; i < 5; i++) {
        B.add(BOX, { color: GOLD, p: [x, h * 0.55 + h * 0.22 - i * h * 0.11, zf + 0.24], s: [0.12, 0.04, 0.012] })
      }
    }
    // Cửa sổ tròn hoa sen trên tường hông (hai mặt)
    const nWin = Math.max(1, Math.floor(sideLen / 4))
    const R = Math.min(0.55, h * 0.13)
    for (let i = 0; i < nWin; i++) {
      const z = -0.6 - sideLen / 2 + ((i + 0.5) * sideLen) / nWin
      B.at([s * (w / 2 - 0.1 + 0.005), h * 0.58, z], [0, (s * Math.PI) / 2, 0], 1, (W) => addRoundWindow(W, R, detail))
      B.at([s * (w / 2 - 0.4 - 0.005), h * 0.58, z], [0, (-s * Math.PI) / 2, 0], 1, (W) => addRoundWindow(W, R * 0.9, 0))
    }
  }
  // Cửa sổ tròn mặt sau (ngoài)
  for (const s of [-1, 1]) {
    B.at([s * w * 0.25, h * 0.58, -d / 2 - 0.005], [0, Math.PI, 0], 1, (W) => addRoundWindow(W, Math.min(0.55, h * 0.13), detail))
  }

  // Mặt tiền đóng (open = false): vách + ba cửa bàn khoa có bậu cửa
  if (!open) {
    B.add(new BoxGeometry(w - 0.6, h, 0.25), { color: wall, p: [0, h / 2 + 0.14, d / 2 - 1.3], tile: 1.5 })
    for (const i of [-1, 0, 1]) {
      const x = i * (w / 4)
      B.add(BOX, { color: LAC, p: [x, 1.25, d / 2 - 1.15], s: [1.4, 2.2, 0.08] })
      B.add(BOX, { color: GOLD, p: [x, 0.2, d / 2 - 1.1], s: [1.6, 0.1, 0.16] })
      for (const sx of [-1, 1]) {
        B.add(BOX, { color: GOLD, p: [x + sx * 0.35, 1.25, d / 2 - 1.1], s: [0.6, 2.0, 0.015] })
        B.add(BOX, { color: LAC, p: [x + sx * 0.35, 1.25, d / 2 - 1.095], s: [0.52, 1.92, 0.015] })
        for (let k = 0; k < 4; k++) B.add(BOX, { color: GOLD, p: [x + sx * 0.35, 1.7 + k * 0.12 - 0.18, d / 2 - 1.088], s: [0.46, 0.02, 0.012] })
      }
    }
  }

  // Hàng cột hiên: hai cột biên có rồng cuốn, các cột trong có câu đối
  const pz = d / 2 - 0.35
  pillarsX.forEach((x, i) => {
    const edge = i === 0 || i === pillarsX.length - 1
    const sub = { stone: S, body: B }
    atAll(sub, [x, 0.1, pz], () => addPillar(sub, { h: h - 0.2, couplet: !edge, dragon: edge && detail > 0, detail }))
  })

  // Xà thượng, xà hạ, diềm chạm giữa hai xà, cửa võng gian giữa
  const xw = pillarsX[pillarsX.length - 1] - pillarsX[0] + 0.5
  B.add(BOX, { color: LAC, p: [0, h + 0.3, pz], s: [xw, 0.26, 0.26] })
  B.add(BOX, { color: GOLD, p: [0, h + 0.3, pz + 0.135], s: [xw, 0.04, 0.01] })
  // Xà hạ + cửa võng lùi về sau tâm cột (zone hay treo đèn ngay trước hàng cột)
  const pzb = pz - 0.19
  B.add(BOX, { color: LAC, p: [0, h - 0.56, pzb], s: [xw - 0.2, 0.16, 0.16] })
  B.add(BOX, { color: GOLD, p: [0, h - 0.56, pzb + 0.085], s: [xw - 0.2, 0.03, 0.01] })
  const midI = Math.floor(cols / 2)
  for (let i = 0; i < cols; i++) {
    const x0 = pillarsX[i] + 0.2
    const x1 = pillarsX[i + 1] - 0.2
    const cx = (x0 + x1) / 2
    addArchPanel(B, { cx, width: x1 - x0, height: 0.58, z: pzb, top: h + 0.17, detail })
    const center = cols % 2 === 0 ? i === midI - 1 || i === midI : i === midI
    addArchPanel(B, { cx, width: x1 - x0, height: center ? 0.75 : 0.38, arch: center ? 0.8 : 0.5, z: pzb, top: h - 0.64, detail })
  }

  // Bẩy hiên đỡ mái: thanh cong từ cột vươn ra đỡ diềm, đầu cuộn vàng
  const roofW = w + 2.4
  const roofD = d + 2.4
  const RS = roofSurfaceFn(roofW, roofD, 2.0)
  const roofY = h + 0.35
  const rHalf = ridgeHalf(roofW, roofD)
  // Độ cao mặt dưới mái trước tại (x, z) — để bẩy hiên và rui chạm đúng mái
  const underAt = (x, z) => {
    const v = Math.max(0, Math.min(1, 1 - z / (roofD / 2)))
    const span = roofW / 2 + (rHalf - roofW / 2) * v
    const u = Math.max(0, Math.min(1, (x / span + 1) / 2))
    return RS(0, u, v)[1] + roofY - 0.12
  }
  pillarsX.forEach((x) => {
    const z1 = d / 2 + 0.95
    const yEnd = underAt(x, z1) - 0.08
    const pts = curve(10, (t) => [x, h - 0.45 + (yEnd - (h - 0.45)) * Math.sin((t * Math.PI) / 2), pz + 0.12 + (z1 - pz - 0.12) * t])
    B.add(sweep(pts, (t) => 0.07 - 0.02 * t, { radial: 4, sx: 1.4, sy: 0.8, up: [1, 0, 0] }), { color: LAC })
    const tip = curve(8, (t) => {
      const a = t * Math.PI * 1.3
      return [x, yEnd - 0.12 + (1 - Math.cos(a)) * 0.06 - 0.06, z1 + Math.sin(a) * 0.08]
    })
    B.add(sweep(tip, (t) => 0.045 * (1 - 0.5 * t), { radial: 5, caps: true }), { color: GOLD })
    // Con sơn đỡ dưới đầu bẩy
    B.add(BOX, { color: GOLD, p: [x, h - 0.45, pz + 0.18], s: [0.14, 0.14, 0.1] })
  })
  // Rui mái dưới hiên trước (từng thanh nhỏ)
  if (detail > 0) {
    const n = Math.round(w / 0.5)
    for (let i = 0; i <= n; i++) {
      const x = -w / 2 + (i * w) / n
      const za = pz + 0.15
      const zb = d / 2 + 1.1
      const ya = underAt(x, za) - 0.05
      const yb = underAt(x, zb) - 0.05
      const len = Math.hypot(zb - za, yb - ya)
      B.add(BOX, { color: shade(PALETTE.woodDark, 1.1), p: [x, (ya + yb) / 2, (za + zb) / 2], r: [-Math.atan2(yb - ya, zb - za), 0, 0], s: [0.06, 0.06, len] })
    }
  }
  // Xà ngang trong điện (thấy khi bước vào) + xà nối cột biên vào tường
  for (const z of [-d * 0.3, d * 0.1]) {
    B.add(BOX, { color: LAC, p: [0, h + 0.06, z], s: [w - 0.5, 0.22, 0.22] })
    B.add(BOX, { color: GOLD, p: [0, h - 0.02, z], s: [w - 0.5, 0.03, 0.24] })
  }
  for (const s of [-1, 1]) {
    const zf = d / 2 - 1.3
    B.add(BOX, { color: LAC, p: [s * (w / 2 - 0.5), h - 0.56, (zf + pz - 0.19) / 2], s: [0.16, 0.16, pz - 0.19 - zf] })
  }

  // Hoành phi trên hiên
  const pw = Math.min(4, w * 0.4)
  B.at([0, h + 0.05, d / 2 - 0.2], [0, 0, 0], 1, (H) => addPlaque(H, pw, 0.55, 4, detail))

  // Mái tầng dưới
  atAll(P, [0, roofY, 0], () => addRoof(P, { w: roofW, d: roofD, h: 2.0, color: roof, ornament: tiers === 1, detail }))
  if (tiers >= 2) {
    // Cổ diêm: tường tầng trên, cột góc, hàng ô cửa song vàng, đai son
    const cw = w * 0.55
    const cd = d * 0.5
    B.add(new BoxGeometry(cw, 1.1, cd), { color: wall, p: [0, h + 1.9, 0], tile: 1.5 })
    B.add(new BoxGeometry(cw + 0.06, 0.16, cd + 0.06), { color: LAC, p: [0, h + 2.38, 0] })
    B.add(new BoxGeometry(cw + 0.08, 0.04, cd + 0.08), { color: GOLD, p: [0, h + 2.28, 0] })
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        B.add(new CylinderGeometry(0.1, 0.1, 1.1, 8), { color: PALETTE.pillarRed, p: [(sx * cw) / 2, h + 1.9, (sz * cd) / 2] })
      }
    }
    const nW = Math.max(3, Math.round(cw / 1.1))
    for (const sz of [-1, 1]) {
      for (let i = 0; i < nW; i++) {
        const x = -cw / 2 + ((i + 0.5) * cw) / nW
        B.at([x, h + 1.95, (sz * cd) / 2 + sz * 0.005], [0, sz > 0 ? 0 : Math.PI, 0], 1, (W) => {
          W.add(BOX, { color: GOLD, s: [0.62, 0.5, 0.04] })
          W.add(BOX, { color: shade(LAC, 0.7), p: [0, 0, 0.012], s: [0.52, 0.4, 0.03] })
          if (detail > 0) {
            for (let k = -2; k <= 2; k++) W.add(BOX, { color: GOLD, p: [k * 0.1, 0, 0.03], s: [0.02, 0.4, 0.02] })
            W.add(BOX, { color: GOLD, p: [0, 0, 0.032], s: [0.52, 0.02, 0.02] })
          }
        })
      }
    }
    atAll(P, [0, h + 2.35, 0], () => addRoof(P, { w: w * 0.7 + 1.4, d: d * 0.6 + 1.4, h: 1.6, color: roof, ornament: true, detail }))
  }
  return buildAll(P)
}

/* ------------------------------------------------------------------ */
/* Cổng tam quan                                                      */
/* ------------------------------------------------------------------ */

export function buildGate({ w, h, roof, detail }) {
  const P = newSet()
  const S = P.stone
  const B = P.body
  const cream = PALETTE.wallCream
  const creamDark = shade(cream, 0.82)
  const piers = [-w / 2, -w / 6, w / 6, w / 2]
  piers.forEach((x) => {
    // Chân trụ đá hai cấp
    S.add(new BoxGeometry(1.0, 0.18, 1.1), { color: PALETTE.stoneDark, p: [x, 0.09, 0], tile: 0.8 })
    S.add(new BoxGeometry(0.9, 0.22, 1.0), { color: PALETTE.stone, p: [x, 0.29, 0], tile: 0.8 })
    // Thân trụ
    B.add(new BoxGeometry(0.8, h, 0.9), { color: cream, p: [x, h / 2, 0], tile: 1.2 })
    // Gờ chỉ quanh thân, đầu trụ
    for (const y of [0.55, h - 0.35]) B.add(new BoxGeometry(0.86, 0.06, 0.96), { color: creamDark, p: [x, y, 0] })
    B.add(new BoxGeometry(0.92, 0.12, 1.02), { color: GOLD, p: [x, h - 0.06, 0] })
    // Câu đối hai mặt
    for (const sz of [-1, 1]) {
      B.at([x, h * 0.5 + 0.1, sz * 0.455], [0, sz > 0 ? 0 : Math.PI, 0], 1, (C) => {
        C.add(BOX, { color: LAC, s: [0.4, h * 0.56, 0.03] })
        C.add(BOX, { color: GOLD, p: [0, 0, 0.012], s: [0.34, h * 0.52, 0.012] })
        C.add(BOX, { color: LAC, p: [0, 0, 0.018], s: [0.3, h * 0.5, 0.012] })
        if (detail > 0) {
          const n = 6
          for (let k = 0; k < n; k++) {
            const y = h * 0.22 - (k * h * 0.44) / (n - 1)
            C.add(BOX, { color: GOLD, p: [0, y, 0.026], s: [0.18, 0.04, 0.01] })
            C.add(BOX, { color: GOLD, p: [(k % 2 ? 0.04 : -0.04), y - 0.07, 0.026], s: [0.04, 0.12, 0.01] })
          }
        }
      })
    }
  })
  // Xà đầu cổng (khối diềm ngang) + bảng tên
  B.add(new BoxGeometry(w + 0.8, 0.6, 1), { color: cream, p: [0, h + 0.3, 0], tile: 1.2 })
  for (const y of [h + 0.03, h + 0.57]) B.add(new BoxGeometry(w + 0.86, 0.06, 1.06), { color: LAC, p: [0, y, 0] })
  B.at([0, h + 0.3, 0.51], [0, 0, 0], 1, (H) => addPlaque(H, w * 0.32, 0.5, 4, detail))
  B.at([0, h + 0.3, -0.51], [0, Math.PI, 0], 1, (H) => addPlaque(H, w * 0.26, 0.42, 3, detail))
  // Cửa võng ba lối (hai mặt)
  for (let i = 0; i < 3; i++) {
    const x0 = piers[i] + 0.42
    const x1 = piers[i + 1] - 0.42
    const center = i === 1
    for (const z of [-0.3, 0.3]) {
      addArchPanel(B, { cx: (x0 + x1) / 2, width: x1 - x0, height: center ? 0.7 : 0.5, arch: 0.75, z, top: h - 0.02, detail })
    }
  }
  // Tầng mái: hai mái bên trên xà, gác giữa hai tầng mái
  for (const s of [-1, 1]) atAll(P, [s * (w / 3), h + 0.6, 0], () => addRoof(P, { w: w / 3, d: 1.8, h: 0.75, color: roof, ornament: false, detail }))
  const cw = w / 3 + 0.2
  B.add(new BoxGeometry(cw, 0.55, 1.0), { color: cream, p: [0, h + 0.875, 0], tile: 1.2 })
  for (const sz of [-1, 1]) addArchPanel(B, { cx: 0, width: cw - 0.4, height: 0.36, z: sz * 0.505, top: h + 1.06, detail })
  atAll(P, [0, h + 1.15, 0], () => addRoof(P, { w: w / 3 + 1.6, d: 2.2, h: 0.95, color: roof, ornament: false, detail }))
  const uw = Math.max(1.2, w / 3 * 0.5)
  B.add(new BoxGeometry(uw, 0.62, 0.8), { color: cream, p: [0, h + 1.95, 0], tile: 1.2 })
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.add(new CylinderGeometry(0.06, 0.06, 0.62, 8), { color: PALETTE.pillarRed, p: [(sx * uw) / 2, h + 1.95, (sz * 0.8) / 2] })
  for (const sz of [-1, 1]) B.at([0, h + 1.95, sz * 0.405], [0, sz > 0 ? 0 : Math.PI, 0], 1, (W) => addRoundWindow(W, 0.2, detail))
  atAll(P, [0, h + 2.2, 0], () => addRoof(P, { w: uw + 1.5, d: 1.7, h: 0.8, color: roof, ornament: true, detail }))
  return buildAll(P)
}

/* ------------------------------------------------------------------ */
/* Lan can                                                            */
/* ------------------------------------------------------------------ */

const BALUSTER = [
  [0.05, 0],
  [0.05, 0.04],
  [0.035, 0.07],
  [0.055, 0.16],
  [0.06, 0.22],
  [0.03, 0.3],
  [0.042, 0.36],
  [0.042, 0.4],
]

/** Lan can dài len (m) chạy theo +Z từ gốc */
export function buildRailing(len, detail) {
  const P = newSet()
  const S = P.stone
  const posts = Math.max(2, Math.round(len / 2.2))
  const stone = PALETTE.stoneDark
  const light = PALETTE.stone
  // Tay vịn trên hai lớp + thanh dưới
  S.add(new BoxGeometry(0.2, 0.08, len), { color: stone, p: [0, 0.7, len / 2], tile: 0.8 })
  S.add(new BoxGeometry(0.14, 0.06, len), { color: light, p: [0, 0.77, len / 2], tile: 0.8 })
  S.add(new BoxGeometry(0.16, 0.08, len), { color: stone, p: [0, 0.2, len / 2], tile: 0.8 })
  // Trụ vuông có mũ búp sen
  const cap = revolve([[0, 0], [0.1, 0.01], [0.12, 0.06], [0.09, 0.13], [0.04, 0.19], [0, 0.22]], 8)
  for (let i = 0; i <= posts; i++) {
    const z = (i * len) / posts
    S.add(new BoxGeometry(0.24, 0.82, 0.24), { color: stone, p: [0, 0.41, z], tile: 0.8 })
    S.add(new BoxGeometry(0.28, 0.06, 0.28), { color: light, p: [0, 0.85, z] })
    S.add(cap, { color: light, p: [0, 0.88, z] })
  }
  // Con tiện giữa các trụ
  if (detail > 0) {
    const bal = revolve(BALUSTER, 6)
    const spans = posts
    const per = Math.max(2, Math.floor(len / posts / 0.26))
    for (let i = 0; i < spans; i++) {
      for (let k = 1; k < per; k++) {
        const z = ((i + k / per) * len) / posts
        S.add(bal, { color: light, p: [0, 0.24, z], s: [1, 1.07, 1] })
      }
    }
  } else {
    S.add(new BoxGeometry(0.1, 0.42, len), { color: light, p: [0, 0.45, len / 2] })
  }
  return buildAll(P)
}

/** Mái độc lập: { tile, trim } */
export function buildRoof(opts) {
  const P = { tile: new Parts(), trim: new Parts() }
  addRoof(P, opts)
  return buildAll(P)
}

/** Cột độc lập: { stone, body } */
export function buildPillar(opts) {
  const P = newSet()
  addPillar(P, opts)
  return buildAll(P)
}
