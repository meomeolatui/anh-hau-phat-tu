import { BoxGeometry, CircleGeometry, ConeGeometry, CylinderGeometry, IcosahedronGeometry, SphereGeometry, TorusGeometry } from 'three'
import { PALETTE } from '../materials'
import { Parts, curve, mix, revolve, shade, surface, sweep } from './geom'
import { addPetal } from './sacredGeometry'

/**
 * Hình học (thuần) cho khu chợ và ga cáp treo: sạp hàng (mái bạt sọc có rìa, quầy, kệ, giỏ, bó nhang, hoa,
 * đèn hoa đăng), trạm trà, ga cáp treo hiện đại (khung thép, kính, mái vòm, bánh xe cáp, cabin).
 */

const BOX = new BoxGeometry(1, 1, 1)
const CREAM = PALETTE.wallCream
const WOOD = PALETTE.wood
const WOOD_DARK = PALETTE.woodDark

/* ------------------------------------------------------------------ */
/* Hàng hoá                                                           */
/* ------------------------------------------------------------------ */

/** Bó nhang: thân đỏ, chân tre nhạt, dây buộc */
function addIncenseBundle(B, p, r = 0.045, h = 0.4, rot = [0, 0, 0]) {
  B.at(p, rot, 1, (G) => {
    G.add(new CylinderGeometry(r, r * 0.9, h * 0.7, 8), { color: PALETTE.incense, p: [0, h * 0.15, 0] })
    G.add(new CylinderGeometry(r * 0.75, r * 0.7, h * 0.3, 8), { color: '#d8b07a', p: [0, -h * 0.35, 0] })
    G.add(new TorusGeometry(r * 0.95, 0.006, 3, 10), { color: PALETTE.gold, p: [0, -h * 0.18, 0], r: [Math.PI / 2, 0, 0] })
  })
}

/** Bó hoa vạn thọ / cúc: chùm bông tròn trên cành */
function addMarigolds(B, p, n, color, rnd) {
  const ball = new IcosahedronGeometry(0.06, 0)
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd * 3
    const rr = i === 0 ? 0 : 0.07
    B.add(new CylinderGeometry(0.006, 0.006, 0.22, 3), { color: PALETTE.leafDark, p: [p[0] + Math.cos(a) * rr * 0.6, p[1] + 0.05, p[2] + Math.sin(a) * rr * 0.6] })
    B.add(ball, { color: i % 2 ? color : shade(color, 0.88), p: [p[0] + Math.cos(a) * rr, p[1] + 0.17 + (i % 3) * 0.02, p[2] + Math.sin(a) * rr], r: [a, a * 2, 0] })
  }
}

/** Đèn hoa đăng hình sen: hai lớp cánh, nến giữa */
function addLotusLantern(B, p, s = 1) {
  B.add(new CylinderGeometry(0.1 * s, 0.08 * s, 0.03 * s, 10), { color: PALETTE.lotusLeaf, p })
  for (const [n, tilt, len, col] of [
    [8, 1.0, 0.13, PALETTE.lotus],
    [6, 0.5, 0.11, mix(PALETTE.lotus, '#ffffff', 0.4)],
  ]) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + tilt
      addPetal(B, { p: [p[0] + Math.sin(a) * 0.03 * s, p[1] + 0.01 * s, p[2] + Math.cos(a) * 0.03 * s], a, tilt, size: [0.07 * s, len * s], color: col, lo: true })
    }
  }
  B.add(new CylinderGeometry(0.02 * s, 0.02 * s, 0.07 * s, 8), { color: '#f6efe0', p: [p[0], p[1] + 0.05 * s, p[2]] })
}

/** Giỏ tre đan: thân, các đai, vành miệng, đồ bên trong */
function addBasket(B, p, r, h, fill) {
  B.add(revolve([[r * 0.75, 0], [r, h * 0.6], [r * 1.05, h]], 14), { color: '#b98a4e', p })
  B.add(new CircleGeometry(r * 0.98, 14), { color: shade('#b98a4e', 0.6), p: [p[0], p[1] + h * 0.7, p[2]], r: [-Math.PI / 2, 0, 0] })
  for (const t of [0.25, 0.55]) B.add(new TorusGeometry(r * (0.82 + t * 0.3), 0.008, 3, 16), { color: '#8a6234', p: [p[0], p[1] + h * t, p[2]], r: [Math.PI / 2, 0, 0] })
  B.add(new TorusGeometry(r * 1.05, 0.018, 4, 16), { color: '#8a6234', p: [p[0], p[1] + h, p[2]], r: [Math.PI / 2, 0, 0] })
  const ball = new SphereGeometry(r * 0.32, 8, 6)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    B.add(ball, { color: i % 2 ? fill : shade(fill, 0.85), p: [p[0] + Math.cos(a) * r * 0.5, p[1] + h * 0.85, p[2] + Math.sin(a) * r * 0.5] })
  }
  B.add(ball, { color: fill, p: [p[0], p[1] + h * 1.05, p[2]] })
}

function addGoods(B, kind, x, detail) {
  if (kind === 'nhang') {
    // Ống tre cắm bó nhang + bó nằm + hộp nhang giấy
    for (const dx of [-0.25, 0, 0.25]) {
      B.add(new CylinderGeometry(0.075, 0.075, 0.22, 10), { color: '#a9b061', p: [x + dx, 1.14, 0.25] })
      B.add(new TorusGeometry(0.076, 0.008, 3, 10), { color: '#7f8a3f', p: [x + dx, 1.1, 0.25], r: [Math.PI / 2, 0, 0] })
      for (let k = 0; k < (detail > 0 ? 3 : 1); k++) addIncenseBundle(B, [x + dx + (k - 1) * 0.035, 1.42, 0.25 + (k % 2) * 0.03], 0.025, 0.42, [0, 0, (k - 1) * 0.12])
    }
    for (const dz of [0.48, 0.6]) addIncenseBundle(B, [x, 1.06, dz], 0.04, 0.5, [0, 0, Math.PI / 2])
    B.add(BOX, { color: '#b8302a', p: [x + 0.38, 1.08, 0.58], s: [0.18, 0.1, 0.12] })
    B.add(BOX, { color: PALETTE.gold, p: [x + 0.38, 1.08, 0.645], s: [0.1, 0.05, 0.005] })
    return
  }
  if (kind === 'hoa') {
    // Xô thiếc cắm hoa vạn thọ, cúc trắng, bó sen hồng
    const cols = ['#f2a516', '#f2c230', '#f4f1ea']
    ;[-0.3, 0, 0.3].forEach((dx, i) => {
      B.add(new CylinderGeometry(0.1, 0.085, 0.2, 10), { color: '#9aa3a8', p: [x + dx, 1.13, 0.3] })
      B.add(new TorusGeometry(0.1, 0.008, 3, 12), { color: '#7d868b', p: [x + dx, 1.23, 0.3], r: [Math.PI / 2, 0, 0] })
      addMarigolds(B, [x + dx, 1.15, 0.3], detail > 0 ? 7 : 4, cols[i], i)
    })
    for (let k = 0; k < 4; k++) {
      const px = x - 0.35 + k * 0.08
      B.add(new CylinderGeometry(0.008, 0.008, 0.36, 3), { color: PALETTE.leafDark, p: [px, 1.06, 0.58], r: [0, 0, Math.PI / 2 - 0.2] })
      B.add(new SphereGeometry(0.045, 8, 6), { color: PALETTE.lotus, p: [px + 0.18, 1.1, 0.58], s: [1.3, 0.75, 0.75] })
    }
    return
  }
  // Đèn hoa đăng xếp hàng + chồng đèn
  addLotusLantern(B, [x - 0.22, 1.04, 0.32], 1.2)
  addLotusLantern(B, [x + 0.22, 1.04, 0.32], 1.2)
  addLotusLantern(B, [x, 1.04, 0.58], 1)
  if (detail > 0) addLotusLantern(B, [x, 1.1, 0.32], 0.9)
}

/* ------------------------------------------------------------------ */
/* Sạp hàng                                                           */
/* ------------------------------------------------------------------ */

/**
 * Sạp hàng (gốc tại tâm nền, mặt trước +Z, footprint ±1.6 × ±1.2): cột gỗ chân đá, khung giằng,
 * mái bạt sọc võng có rìa vỏ sò, quầy ván + khăn phủ, kệ ba tầng phía sau, hàng hoá, giỏ tre, biển tên.
 * → { wood (texture gỗ), cloth (màu trơn) }
 */
export function buildStall(awning, items, detail = 1) {
  const W = new Parts()
  const C = new Parts()
  // Cột + chân đá + khung trên
  for (const [x, z] of [
    [-1.6, -0.9],
    [1.6, -0.9],
    [-1.6, 0.9],
    [1.6, 0.9],
  ]) {
    W.add(new BoxGeometry(0.12, 2.5, 0.12), { color: WOOD, p: [x, 1.25, z], tile: 0.6 })
    C.add(BOX, { color: PALETTE.stoneDark, p: [x, 0.06, z], s: [0.22, 0.12, 0.22] })
  }
  for (const z of [-0.9, 0.9]) W.add(new BoxGeometry(3.32, 0.1, 0.1), { color: WOOD_DARK, p: [0, 2.45, z], tile: 0.6 })
  for (const x of [-1.6, 1.6]) W.add(new BoxGeometry(0.1, 0.1, 1.9), { color: WOOD_DARK, p: [x, 2.45, 0], tile: 0.6 })
  for (const sx of [-1, 1]) {
    // Thanh giằng chéo góc trước
    W.add(BOX, { color: WOOD_DARK, p: [sx * 1.4, 2.25, 0.9], r: [0, 0, sx * 0.785], s: [0.06, 0.5, 0.06] })
  }
  // Mái bạt sọc: các dải võng nhẹ, mặt dưới sẫm hơn
  const back = [-1.08, 2.88]
  const front = [1.36, 2.56]
  const N = 8
  const span = 3.5
  for (let i = 0; i < N; i++) {
    const x0 = -span / 2 + (i * span) / N
    const x1 = x0 + span / N
    const col = i % 2 ? CREAM : awning
    const at = (u, v, dy = 0) => {
      const x = x0 + (x1 - x0) * u
      const z = back[0] + (front[0] - back[0]) * v
      const y = back[1] + (front[1] - back[1]) * v - Math.sin(Math.PI * v) * 0.07 + Math.sin(Math.PI * u) * 0.025 + dy
      return [x, y, z]
    }
    C.add(surface(2, 6, (u, v) => at(u, v), { flip: true }), { color: col })
    C.add(surface(2, 6, (u, v) => at(u, v, -0.012)), { color: shade(col, 0.72) })
    // Rìa vỏ sò ở mép trước + hai bên
    const nS = detail > 0 ? 2 : 1
    for (let k = 0; k < nS; k++) {
      const u = (k + 0.5) / nS
      const p = at(u, 1)
      C.add(new CircleGeometry(span / N / nS / 2, 8, Math.PI, Math.PI), { color: col, p: [p[0], p[1] - 0.005, p[2] + 0.004] })
      C.add(new CircleGeometry(span / N / nS / 2, 8, Math.PI, Math.PI), { color: shade(col, 0.8), p: [p[0], p[1] - 0.005, p[2]], r: [0, Math.PI, 0] })
    }
  }
  C.add(sweep(curve(12, (t) => [-span / 2 + t * span, front[1] + 0.005, front[0] + 0.01]), 0.018, { radial: 4 }), { color: shade(awning, 0.75) })
  // Quầy: thân ván, nẹp dọc, mặt quầy, khăn phủ trước có viền vàng
  W.add(new BoxGeometry(3, 1, 0.7), { color: WOOD, p: [0, 0.5, 0.45], tile: 0.5 })
  W.add(new BoxGeometry(3.1, 0.05, 0.82), { color: WOOD_DARK, p: [0, 1.01, 0.45], tile: 0.5 })
  W.add(new BoxGeometry(3.05, 0.08, 0.75), { color: WOOD_DARK, p: [0, 0.04, 0.45], tile: 0.5 })
  for (let i = 0; i <= 8; i++) W.add(BOX, { color: WOOD_DARK, p: [-1.5 + (i * 3) / 8, 0.5, 0.805], s: [0.03, 0.9, 0.012] })
  const drape = mix(awning, '#7a1f1b', 0.35)
  C.add(BOX, { color: drape, p: [0, 0.82, 0.815], s: [2.2, 0.36, 0.01] })
  C.add(BOX, { color: PALETTE.gold, p: [0, 0.65, 0.822], s: [2.2, 0.03, 0.006] })
  if (detail > 0) {
    for (let i = 0; i < 11; i++) {
      C.add(new ConeGeometry(0.035, 0.08, 4), { color: drape, p: [-1.0 + i * 0.2, 0.6, 0.82], r: [Math.PI, 0, 0], s: [1, 1, 0.3] })
    }
  }
  // Kệ ba tầng phía sau người bán + hàng trên kệ
  for (const x of [-1.42, 1.42]) W.add(new BoxGeometry(0.06, 1.8, 0.4), { color: WOOD_DARK, p: [x, 0.9, -0.82], tile: 0.5 })
  for (const y of [0.55, 1.05, 1.55]) W.add(new BoxGeometry(2.9, 0.04, 0.4), { color: WOOD, p: [0, y, -0.82], tile: 0.5 })
  W.add(new BoxGeometry(2.9, 1.7, 0.03), { color: shade(WOOD, 0.75), p: [0, 0.9, -1.02], tile: 0.5 })
  for (let s = 0; s < 3; s++) {
    const y = 0.57 + s * 0.5
    for (let i = 0; i < 6; i++) {
      const x = -1.15 + i * 0.46
      const k = (s + i) % 3
      if (k === 0) for (let j = 0; j < 3; j++) addIncenseBundle(C, [x - 0.06 + j * 0.06, y + 0.04, -0.82], 0.022, 0.36, [0, 0, Math.PI / 2])
      else if (k === 1) {
        C.add(revolve([[0.05, 0], [0.08, 0.06], [0.05, 0.16], [0.035, 0.2], [0.045, 0.22]], 8), { color: s % 2 ? '#3f6e8c' : '#efe8dc', p: [x, y, -0.82] })
        if (detail > 0) C.add(new IcosahedronGeometry(0.05, 0), { color: s % 2 ? '#f2a516' : PALETTE.lotus, p: [x, y + 0.27, -0.82] })
      } else {
        C.add(new CylinderGeometry(0.13, 0.1, 0.03, 10), { color: '#c9a95b', p: [x, y + 0.015, -0.82] })
        const fruit = new SphereGeometry(0.04, 7, 5)
        for (let j = 0; j < 5; j++) {
          const a = (j / 5) * Math.PI * 2
          C.add(fruit, { color: j % 2 ? '#e8902a' : '#d4b02a', p: [x + Math.cos(a) * 0.06, y + 0.06, -0.82 + Math.sin(a) * 0.06] })
        }
      }
    }
  }
  // Dây + chụp đèn sạp (bóng đèn vẽ riêng ở y 2.3)
  C.add(new CylinderGeometry(0.008, 0.008, 0.32, 3), { color: WOOD_DARK, p: [0, 2.6, 0] })
  C.add(new ConeGeometry(0.14, 0.1, 10, 1, true), { color: shade(awning, 0.8), p: [0, 2.46, 0] })
  // Hàng trên quầy theo loại
  items.forEach((k, i) => addGoods(C, k, (i - (items.length - 1) / 2) * 1.1, detail))
  // Giỏ tre dưới đất hai góc trước
  addBasket(C, [-1.25, 0, 1.05], 0.17, 0.22, items.includes('hoa') ? '#f2a516' : '#e8902a')
  if (detail > 0) addBasket(C, [1.25, 0, 1.05], 0.15, 0.2, items.includes('den') ? PALETTE.lotus : '#d4b02a')
  // Biển tên sạp: nền son, viền vàng, chữ khối, hai dây treo
  C.at([0, 2.25, 1.32], [0, 0, 0], 1, (S) => {
    S.add(BOX, { color: PALETTE.lacquer, s: [1.8, 0.4, 0.05] })
    for (const sy of [-1, 1]) S.add(BOX, { color: PALETTE.gold, p: [0, sy * 0.18, 0.02], s: [1.8, 0.03, 0.02] })
    for (let i = 0; i < 5; i++) {
      S.add(BOX, { color: PALETTE.gold, p: [-0.56 + i * 0.28, 0.03, 0.03], s: [0.18, 0.04, 0.01] })
      S.add(BOX, { color: PALETTE.gold, p: [-0.58 + i * 0.28, -0.05, 0.03], s: [0.04, 0.12, 0.01] })
    }
    for (const sx of [-0.8, 0.8]) S.add(new CylinderGeometry(0.008, 0.008, 0.3, 3), { color: WOOD_DARK, p: [sx, 0.32, 0] })
  })
  return { wood: W.build(), cloth: C.build() }
}

/** Trạm trà: bàn gỗ khăn phủ, ấm đất, khay chén, bình giữ nhiệt, biển "Trà miễn phí" có mái nhỏ */
export function buildTeaStation(detail = 1) {
  const W = new Parts()
  const C = new Parts()
  W.add(new BoxGeometry(1.8, 0.08, 0.9), { color: WOOD, p: [0, 0.42, 0], tile: 0.5 })
  for (const [x, z] of [
    [-0.8, -0.35],
    [0.8, -0.35],
    [-0.8, 0.35],
    [0.8, 0.35],
  ]) {
    W.add(new BoxGeometry(0.08, 0.4, 0.08), { color: WOOD_DARK, p: [x, 0.2, z] })
  }
  W.add(new BoxGeometry(1.6, 0.04, 0.04), { color: WOOD_DARK, p: [0, 0.12, 0.35] })
  C.add(BOX, { color: '#e9e2d0', p: [0, 0.465, 0], s: [1.5, 0.01, 0.92] })
  C.add(BOX, { color: '#2e7d6b', p: [0, 0.4, 0.46], s: [1.5, 0.12, 0.01] })
  // Ấm đất: thân, nắp, núm, vòi, quai
  const clay = '#8a4b2a'
  C.add(revolve([[0.08, 0], [0.15, 0.06], [0.16, 0.13], [0.12, 0.22], [0.07, 0.25]], 14), { color: clay, p: [-0.4, 0.46, 0] })
  C.add(new SphereGeometry(0.03, 6, 5), { color: clay, p: [-0.4, 0.73, 0] })
  C.add(sweep(curve(6, (t) => [-0.26 + t * 0.12, 0.55 + t * 0.12 + t * t * 0.02, 0]), (t) => 0.028 - 0.012 * t, { radial: 6 }), { color: clay })
  C.add(sweep(curve(8, (t) => [-0.53 - Math.sin(t * Math.PI) * 0.08, 0.53 + t * 0.14, 0]), 0.012, { radial: 4 }), { color: clay })
  // Khay + chén
  C.add(new CylinderGeometry(0.28, 0.28, 0.02, 16), { color: WOOD_DARK, p: [0.2, 0.47, 0.05] })
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    C.add(new CylinderGeometry(0.045, 0.035, 0.06, 10), { color: '#efe8dc', p: [0.2 + Math.cos(a) * 0.17, 0.51, 0.05 + Math.sin(a) * 0.17] })
    if (detail > 0) C.add(new TorusGeometry(0.045, 0.004, 3, 10), { color: '#5f9ab0', p: [0.2 + Math.cos(a) * 0.17, 0.525, 0.05 + Math.sin(a) * 0.17], r: [Math.PI / 2, 0, 0] })
  }
  // Bình giữ nhiệt
  C.add(new CylinderGeometry(0.08, 0.08, 0.36, 12), { color: '#c0392b', p: [0.65, 0.64, -0.15] })
  C.add(new CylinderGeometry(0.05, 0.07, 0.06, 12), { color: '#d9d4c8', p: [0.65, 0.85, -0.15] })
  // Biển "Trà miễn phí" có mái ngói nhỏ
  W.add(new BoxGeometry(0.06, 1.1, 0.06), { color: WOOD_DARK, p: [-0.55, 0.95, -0.4] })
  W.add(new BoxGeometry(0.06, 1.1, 0.06), { color: WOOD_DARK, p: [0.55, 0.95, -0.4] })
  C.add(BOX, { color: '#2e7d6b', p: [0, 1.15, -0.4], s: [1.2, 0.36, 0.05] })
  for (let i = 0; i < 4; i++) {
    C.add(BOX, { color: '#f3e6c8', p: [-0.39 + i * 0.26, 1.18, -0.37], s: [0.16, 0.04, 0.01] })
    C.add(BOX, { color: '#f3e6c8', p: [-0.41 + i * 0.26, 1.11, -0.37], s: [0.04, 0.1, 0.01] })
  }
  C.add(new ConeGeometry(0.8, 0.22, 4, 1), { color: PALETTE.roof, p: [0, 1.48, -0.4], r: [0, Math.PI / 4, 0], s: [1, 1, 0.35] })
  return { wood: W.build(), cloth: C.build() }
}

/* ------------------------------------------------------------------ */
/* Ga cáp treo                                                        */
/* ------------------------------------------------------------------ */

const STEEL = '#d9dcdf'
const STEEL_DARK = '#6d747a'
const TEAL = '#1a6055'

/**
 * Ga cáp treo hiện đại (gốc tâm sàn, cửa +Z): sàn bê tông vạch an toàn, khung thép (cột, dầm, giằng chéo),
 * mái vòm cong, bánh xe cáp + nhà máy, ray dẫn cabin, cửa soát vé, ghế chờ, biển ga.
 * → { frame, roof, glass } (glass: tấm kính trong mờ — vẽ bằng vật liệu trong suốt riêng)
 */
export function buildCableStation(detail = 1) {
  const F = new Parts()
  const R = new Parts()
  const G = new Parts()
  // Sàn
  F.add(new BoxGeometry(7.4, 0.2, 6.4), { color: PALETTE.stoneDark, p: [0, 0.1, 0], tile: 1 })
  F.add(new BoxGeometry(7.0, 0.02, 0.12), { color: '#e2b422', p: [0, 0.21, 2.6] })
  F.add(new BoxGeometry(3.6, 0.12, 0.4), { color: PALETTE.stone, p: [0, 0.06, 3.4] })
  // Cột thép + dầm mái + giằng chéo hai bên
  const cols = [
    [-3.2, -2.7],
    [3.2, -2.7],
    [-3.2, 2.7],
    [3.2, 2.7],
    [-3.2, 0],
    [3.2, 0],
  ]
  for (const [x, z] of cols) {
    F.add(new BoxGeometry(0.26, 4, 0.26), { color: STEEL, p: [x, 2.2, z] })
    F.add(new BoxGeometry(0.4, 0.1, 0.4), { color: STEEL_DARK, p: [x, 0.25, z] })
  }
  for (const z of [-2.7, 0, 2.7]) F.add(new BoxGeometry(6.7, 0.24, 0.22), { color: STEEL, p: [0, 4.15, z] })
  for (const x of [-3.2, 3.2]) F.add(new BoxGeometry(0.22, 0.24, 5.6), { color: STEEL, p: [x, 4.15, 0] })
  for (const x of [-3.2, 3.2]) {
    for (const [z0, z1] of [
      [-2.7, 0],
      [0, 2.7],
    ]) {
      if (detail === 0) break
      for (const s of [-1, 1]) {
        const len = Math.hypot(z1 - z0, 3.6)
        F.add(BOX, { color: STEEL_DARK, p: [x, 2.2, (z0 + z1) / 2], r: [s * Math.atan2(z1 - z0, 3.6), 0, 0], s: [0.06, len, 0.06] })
      }
    }
  }
  // Mái vòm cong: mặt trên xanh, mặt dưới sáng, viền mái
  const roofAt = (u, v, dy = 0) => {
    const x = -4 + u * 8
    const z = -3.4 + v * 6.8
    return [x, 4.3 + Math.sin(Math.PI * u) * 0.55 + dy, z]
  }
  R.add(surface(16, 4, (u, v) => roofAt(u, v), { flip: true }), { color: PALETTE.roofGreen })
  R.add(surface(16, 4, (u, v) => roofAt(u, v, -0.1)), { color: '#e9e4d8' })
  for (const z of [-3.4, 3.4]) {
    R.add(sweep(curve(16, (t) => roofAt(t, z > 0 ? 1 : 0, -0.05)), 0.07, { radial: 4, sx: 1, sy: 0.6 }), { color: TEAL })
  }
  for (let i = 1; i < 8; i++) {
    R.add(sweep(curve(4, (t) => roofAt(i / 8, t, 0.02)), 0.025, { radial: 4 }), { color: shade(PALETTE.roofGreen, 0.8) })
  }
  // Tường kính: sau + hai bên nửa sau, có đố kính
  G.add(new BoxGeometry(6.2, 3, 0.06), { color: '#9cc9d6', p: [0, 1.7, -2.7] })
  for (const x of [-3.2, 3.2]) G.add(new BoxGeometry(0.06, 3, 2.5), { color: '#9cc9d6', p: [x, 1.7, -1.35] })
  for (let i = 0; i <= 6; i++) F.add(BOX, { color: STEEL_DARK, p: [-3.1 + (i * 6.2) / 6, 1.7, -2.68], s: [0.05, 3, 0.08] })
  for (const y of [0.25, 1.7, 3.2]) F.add(BOX, { color: STEEL_DARK, p: [0, y, -2.68], s: [6.2, 0.06, 0.08] })
  for (const x of [-3.2, 3.2]) for (const y of [0.25, 1.7, 3.2]) F.add(BOX, { color: STEEL_DARK, p: [x, y, -1.35], s: [0.08, 0.06, 2.5] })
  // Bánh xe cáp (bullwheel) + nhà máy phía sau
  F.add(BOX, { color: '#c9ccd0', p: [0, 3.0, -1.9], s: [1.4, 0.9, 0.9] })
  F.add(new CylinderGeometry(0.12, 0.12, 0.6, 10), { color: STEEL_DARK, p: [0, 3.65, -1.4] })
  F.add(new TorusGeometry(1.2, 0.07, 6, 32), { color: '#e2b422', p: [0, 3.9, -1.4], r: [Math.PI / 2, 0, 0] })
  for (let i = 0; i < (detail > 0 ? 8 : 4); i++) {
    const a = (i / (detail > 0 ? 8 : 4)) * Math.PI
    F.add(BOX, { color: STEEL_DARK, p: [0, 3.9, -1.4], r: [0, a, 0], s: [2.4, 0.05, 0.05] })
  }
  // Ray dẫn cabin chữ U
  const rail = [
    ...curve(6, (t) => [-1.5, 3.55, -1.6 + t * 3.4]),
    ...curve(10, (t) => [-1.5 * Math.cos(t * Math.PI), 3.55, 1.8 + Math.sin(t * Math.PI) * 0.6]).slice(1),
    ...curve(6, (t) => [1.5, 3.55, 1.8 - t * 3.4]).slice(1),
  ]
  F.add(sweep(rail, 0.05, { radial: 5 }), { color: STEEL_DARK })
  // Cửa soát vé (3 trụ + tay chắn), ghế chờ
  for (let i = 0; i < 3; i++) {
    const x = -1.2 + i * 1.2
    F.add(BOX, { color: STEEL, p: [x, 0.65, 2.2], s: [0.18, 0.9, 0.5] })
    F.add(BOX, { color: '#3aa36a', p: [x, 1.1, 2.4], s: [0.12, 0.06, 0.02] })
    F.add(new CylinderGeometry(0.02, 0.02, 0.5, 5), { color: STEEL_DARK, p: [x + 0.32, 0.85, 2.2], r: [0, 0, Math.PI / 2] })
  }
  for (const x of [-2.6, 2.6]) {
    F.add(BOX, { color: '#3f7d62', p: [x, 0.62, 1.9], s: [0.5, 0.06, 1.2] })
    F.add(BOX, { color: '#3f7d62', p: [x + Math.sign(x) * 0.22, 0.9, 1.9], s: [0.06, 0.5, 1.2] })
    for (const z of [1.4, 2.4]) F.add(BOX, { color: STEEL_DARK, p: [x, 0.4, z], s: [0.45, 0.4, 0.06] })
  }
  // Biển ga: nền xanh, chữ trắng, logo hoa sen
  F.at([0, 3.4, 3.2], [0, 0, 0], 1, (S) => {
    S.add(BOX, { color: TEAL, s: [3, 0.6, 0.1] })
    for (let i = 0; i < 6; i++) S.add(BOX, { color: '#f3efe4', p: [-0.7 + i * 0.3, 0, 0.06], s: [0.2, 0.18, 0.01] })
    S.add(new CircleGeometry(0.2, 12), { color: '#f3efe4', p: [-1.2, 0, 0.056] })
    S.add(new CircleGeometry(0.12, 8), { color: PALETTE.lotus, p: [-1.2, 0, 0.058] })
    for (const sx of [-1.3, 1.3]) S.add(new BoxGeometry(0.06, 0.8, 0.06), { color: STEEL_DARK, p: [sx, 0.6, -0.05] })
  })
  return { frame: F.build(), roof: R.build(), glass: G.build() }
}

/** Cabin cáp treo đang đậu (gốc tâm cabin): thân bo tròn, dải kính, sàn, tay treo + kẹp cáp */
export function buildCabin(color = PALETTE.lotus, detail = 1) {
  const B = new Parts()
  const prof = [
    [0.0, -0.8],
    [0.72, -0.8],
    [0.85, -0.65],
    [0.9, -0.1],
    [0.88, 0.45],
    [0.75, 0.72],
    [0.3, 0.8],
    [0.0, 0.8],
  ]
  B.add(revolve(prof, detail > 0 ? 16 : 8, { sz: 0.9 }), { color })
  B.add(new TorusGeometry(0.89, 0.03, 4, 24), { color: '#f3efe4', p: [0, -0.35, 0], r: [Math.PI / 2, 0, 0], s: [1, 0.9, 1] })
  B.add(new CylinderGeometry(0.05, 0.05, 1.0, 6), { color: STEEL_DARK, p: [0, 1.3, 0] })
  B.add(BOX, { color: STEEL_DARK, p: [0, 1.82, 0], s: [0.5, 0.12, 0.2] })
  B.add(new CylinderGeometry(0.09, 0.09, 0.18, 8), { color: STEEL, p: [0, 1.82, 0], r: [Math.PI / 2, 0, 0] })
  return B.build()
}

/** Dải kính quanh cabin (vẽ trong suốt) */
export function cabinGlassGeo() {
  return revolve(
    [
      [0.905, -0.25],
      [0.9, 0.1],
      [0.88, 0.42],
    ],
    16,
    { sz: 0.9 },
  )
}

