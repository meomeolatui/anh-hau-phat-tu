import {
  BoxGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  SphereGeometry,
  TorusGeometry,
} from 'three'
import { PALETTE } from '../materials'
import { seeded } from '../../lib/random'
import { Parts, atAll, buildAll, curve, mix, revolve, shade, surface, sweep } from './geom'
import { addRoof } from './roofGeometry'
import { addPillar, newSet } from './buildings'

/**
 * Hình học (thuần) cho đồ thờ tự: đài sen, tượng Phật ngồi, tượng Bồ Tát đứng, lư hương, đèn lồng,
 * đèn đá, bồ đoàn, hồ sen, gác chuông. Tượng luôn TRANG NGHIÊM: mắt khép hiền, chân mày cong, môi mỉm nhẹ.
 * Mỗi builder trả về geometry gộp (màu đỉnh) — component trong sacred.jsx chỉ việc vẽ.
 */

const GOLD = PALETTE.gold
const BOX = new BoxGeometry(1, 1, 1)

/* ------------------------------------------------------------------ */
/* Cánh sen                                                           */
/* ------------------------------------------------------------------ */

const petalCache = {}

/**
 * Cánh sen đơn vị (rộng 1, dài 1, gốc tại 0, mọc theo +Y, mặt ngoài +Z): mặt ngoài, mặt trong, viền.
 * lo: bản ít đỉnh cho hoa nhỏ (hồ sen, đèn hoa đăng).
 */
export function petalGeo(lo = false) {
  const key = lo ? 'lo' : 'hi'
  if (petalCache[key]) return petalCache[key]
  const [nu, nv] = lo ? [3, 4] : [6, 7]
  const hw = (v) => 0.5 * (Math.sin(Math.PI * v ** 0.8) * (1 - 0.1 * v) + 0.12 * (1 - v))
  const z = (s, v) => 0.2 * (1 - s * s) * (hw(v) / 0.5) * Math.sqrt(Math.sin(Math.PI * Math.min(0.999, v))) + 0.16 * v ** 3
  const thick = 0.05
  const outer = surface(nu, nv, (u, v) => {
    const s = u * 2 - 1
    return [s * hw(v), v, z(s, v)]
  }, { flip: true })
  const inner = surface(nu, nv, (u, v) => {
    const s = u * 2 - 1
    return [s * hw(v) * 0.96, v * 0.98, z(s, v) - thick * (1 - 0.7 * v)]
  })
  const edge = [
    ...curve(7, (t) => [-hw(t), t, z(-1, t) - thick * 0.4]),
    ...curve(7, (t) => [hw(1 - t), 1 - t, z(1, 1 - t) - thick * 0.4]).slice(1),
  ]
  const rim = sweep(edge, thick * 0.55, { radial: 3 })
  petalCache[key] = { outer, inner, rim }
  return petalCache[key]
}

/**
 * Thêm một cánh sen: vị trí gốc p, góc phương vị a (hướng ra ngoài), nghiêng ngả tilt (0 = đứng thẳng),
 * kích thước [rộng, dài]; down = cánh úp (chúc xuống).
 */
export function addPetal(B, { p, a, tilt, size, color, inner, rim, down = false, lo = false }) {
  const g = petalGeo(lo)
  const r = down ? [-(Math.PI - tilt), a + Math.PI, 0, 'YXZ'] : [tilt, a, 0, 'YXZ']
  const s = [size[0], size[1], size[0]]
  B.add(g.outer, { color, p, r, s })
  B.add(g.inner, { color: inner ?? shade(color, 0.85), p, r, s })
  if (rim) B.add(g.rim, { color: rim, p, r, s })
}

/* ------------------------------------------------------------------ */
/* Đài sen                                                            */
/* ------------------------------------------------------------------ */

/**
 * Đài sen nhiều tầng (đơn vị r = 1, gốc tại đáy): đế tròn, vành sen úp, eo thắt có chuỗi hạt,
 * `layers` lớp sen ngửa cong có viền, mặt đài viền hạt. Mặt đài cao 0.32 + (layers−1)·0.22 (+0.08) như bản cũ.
 */
export function addLotusThrone(B, { layers = 2, color = GOLD, detail = 1 }) {
  const dark = shade(color, 0.78)
  const light = shade(color, 1.15)
  const top = 0.32 + (layers - 1) * 0.22
  // Đế hai tầng
  B.add(new CylinderGeometry(0.92, 0.96, 0.05, 24), { color: dark, p: [0, 0.025, 0] })
  B.add(new CylinderGeometry(0.86, 0.9, 0.05, 24), { color, p: [0, 0.07, 0] })
  // Sen úp
  const nDown = detail > 0 ? 16 : 10
  for (let i = 0; i < nDown; i++) {
    const a = (i / nDown) * Math.PI * 2
    addPetal(B, { p: [Math.sin(a) * 0.74, 0.2, Math.cos(a) * 0.74], a, tilt: 0.55, size: [0.3, 0.17], color: shade(color, 0.92), rim: detail > 0 ? light : null, down: true })
  }
  // Eo thắt + chuỗi hạt
  B.add(new CylinderGeometry(0.7, 0.74, 0.08, 24), { color: dark, p: [0, 0.22, 0] })
  if (detail > 0) {
    const bead = new IcosahedronGeometry(0.022, 0)
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2
      B.add(bead, { color: light, p: [Math.sin(a) * 0.73, 0.22, Math.cos(a) * 0.73] })
    }
  }
  // Các lớp sen ngửa (ngoài → trong)
  for (let l = 0; l < layers; l++) {
    const n = (detail > 0 ? 16 : 10) - l * 2
    const R = 0.8 - l * 0.15
    const y = 0.22 + l * 0.22
    const len = 0.34 - l * 0.03
    const tilt = 0.85 - l * 0.2
    for (let i = 0; i < n; i++) {
      const a = ((i + (l % 2) * 0.5) / n) * Math.PI * 2
      addPetal(B, { p: [Math.sin(a) * R, y, Math.cos(a) * R], a, tilt, size: [0.36 - l * 0.03, len], color, rim: detail > 0 ? light : null })
    }
  }
  // Mặt đài + viền hạt
  B.add(new CylinderGeometry(0.7, 0.75, 0.16, 24), { color, p: [0, top, 0] })
  B.add(new TorusGeometry(0.72, 0.025, 4, 32), { color: light, p: [0, top + 0.08, 0], r: [Math.PI / 2, 0, 0] })
  if (detail > 0) {
    B.add(new TorusGeometry(0.5, 0.012, 4, 28), { color: dark, p: [0, top + 0.081, 0], r: [Math.PI / 2, 0, 0] })
  }
}

/* ------------------------------------------------------------------ */
/* Khuôn mặt & tóc tượng                                              */
/* ------------------------------------------------------------------ */

/**
 * Khuôn mặt hiền tĩnh trên đầu bán kính R tâm c (nhìn +Z): mắt khép (mí cong), chân mày cong dài,
 * sống mũi, môi mỉm, bạch hào; tai dài.
 */
function addSereneFace(B, c, R, col, detail) {
  const [cx, cy, cz] = c
  const onFace = (x, y, out = 0) => {
    const zz = Math.sqrt(Math.max(0, R * R - x * x - y * y))
    return [cx + x, cy + y, cz + zz * 0.97 + out]
  }
  for (const sx of [-1, 1]) {
    // Mí mắt khép: cung cong xuống (nhìn xuống hiền từ), hai nét song song
    const eye = curve(8, (t) => {
      const x = sx * (R * 0.13 + t * R * 0.26)
      return onFace(x, R * 0.05 - Math.sin(t * Math.PI) * R * 0.045 - t * R * 0.02, 0.004)
    })
    B.add(sweep(eye, R * 0.018, { radial: 4 }), { color: col.eye })
    if (detail > 0) {
      const lid = curve(8, (t) => {
        const x = sx * (R * 0.13 + t * R * 0.26)
        return onFace(x, R * 0.085 - Math.sin(t * Math.PI) * R * 0.03 - t * R * 0.02, 0.006)
      })
      B.add(sweep(lid, R * 0.014, { radial: 4 }), { color: col.fold })
    }
    // Chân mày cong dài nối sống mũi
    const brow = curve(10, (t) => {
      const x = sx * (R * 0.05 + t * R * 0.42)
      return onFace(x, R * 0.2 + Math.sin(t * Math.PI * 0.85) * R * 0.07 - t * R * 0.08, 0.006)
    })
    B.add(sweep(brow, (t) => R * 0.022 * (1 - 0.5 * t), { radial: 4 }), { color: col.fold })
    // Tai dài (dái tai chảy xuống)
    B.add(new SphereGeometry(R * 0.5, 8, 6), { color: col.main, p: [cx + sx * R * 0.97, cy - R * 0.18, cz - R * 0.05], s: [0.28, 1.15, 0.55] })
    B.add(new SphereGeometry(R * 0.2, 6, 4), { color: col.fold, p: [cx + sx * R * 1.0, cy - R * 0.05, cz + R * 0.02], s: [0.25, 1.3, 0.5] })
  }
  // Mũi: sống thẳng + cánh mũi
  B.add(new SphereGeometry(R * 0.17, 8, 6), { color: col.main, p: onFace(0, -R * 0.12, -R * 0.02), s: [0.7, 1.5, 0.8] })
  B.add(new SphereGeometry(R * 0.1, 6, 4), { color: col.main, p: onFace(0, -R * 0.27, 0), s: [1.4, 0.8, 0.9] })
  // Môi mỉm: môi trên, môi dưới, khoé môi hơi nhếch
  B.add(new SphereGeometry(R * 0.1, 8, 5), { color: col.lip, p: onFace(0, -R * 0.43, -R * 0.015), s: [1.6, 0.42, 0.6] })
  B.add(new SphereGeometry(R * 0.1, 8, 5), { color: col.lip, p: onFace(0, -R * 0.5, -R * 0.02), s: [1.3, 0.45, 0.6] })
  if (detail > 0) {
    const smile = curve(8, (t) => onFace((t * 2 - 1) * R * 0.2, -R * 0.465 + (t * 2 - 1) ** 2 * R * 0.04, 0.003))
    B.add(sweep(smile, R * 0.008, { radial: 3 }), { color: col.eye })
  }
  // Bạch hào giữa hai chân mày
  B.add(new SphereGeometry(R * 0.04, 6, 4), { color: col.light, p: onFace(0, R * 0.22, 0) })
  // Cằm tròn
  B.add(new SphereGeometry(R * 0.3, 8, 6), { color: col.main, p: [cx, cy - R * 0.62, cz + R * 0.55], s: [1.2, 0.8, 0.8] })
}

/** Tóc xoắn ốc (phân bố Fibonacci trên mặt cầu, chỉ giữ vùng tóc theo `keep(x,y,z)` chuẩn hoá) */
function addCurls(B, c, R, count, curlR, color, keep) {
  const ico = new IcosahedronGeometry(curlR, 0)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - ((i + 0.5) / count) * 2
    const rr = Math.sqrt(1 - y * y)
    const th = golden * i
    const x = Math.cos(th) * rr
    const z = Math.sin(th) * rr
    if (!keep(x, y, z)) continue
    B.add(ico, { color, p: [c[0] + x * R, c[1] + y * R, c[2] + z * R], r: [th, y * 2, 0] })
  }
}

function statueColors(color) {
  const isGold = color === GOLD
  return {
    main: color,
    fold: shade(color, 0.84),
    deep: shade(color, 0.68),
    light: shade(color, 1.14),
    hair: isGold ? '#2f3b55' : shade(color, 0.55),
    lip: mix(color, '#9b3b2a', 0.3),
    eye: shade(color, 0.45),
    jewel: isGold ? '#e8c35e' : mix(color, GOLD, 0.6),
  }
}

/** Hàm bán kính nội suy theo biên dạng [[r, y], ...] */
function radiusAt(profile, y) {
  for (let i = 0; i < profile.length - 1; i++) {
    const [r0, y0] = profile[i]
    const [r1, y1] = profile[i + 1]
    if (y >= y0 && y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0 || 1)
  }
  return profile[profile.length - 1][0]
}

/** Đường cong trên mặt thân (biên dạng tròn xoay dẹt sz) theo (góc φ, y) — để đặt nếp áo/viền áo sát thân */
function onBody(profile, sz, phi, y, out = 0.012, dz = 0) {
  const r = radiusAt(profile, y) + out
  return [Math.sin(phi) * r, y, Math.cos(phi) * r * sz + dz]
}

/* ------------------------------------------------------------------ */
/* Tượng Phật ngồi                                                    */
/* ------------------------------------------------------------------ */

const TORSO = [
  [0.4, 0.22],
  [0.37, 0.45],
  [0.35, 0.68],
  [0.41, 0.92],
  [0.45, 1.04],
  [0.38, 1.14],
  [0.2, 1.24],
  [0.11, 1.3],
]
const LAP = [
  [0.0, 0.0],
  [0.62, 0.0],
  [0.72, 0.08],
  [0.7, 0.18],
  [0.58, 0.28],
  [0.36, 0.32],
  [0.0, 0.33],
]

/**
 * Tượng Phật ngồi kiết già, tay kết ấn thiền định (đơn vị: size 2.4, gốc tại đáy đài sen).
 * Thân ở nhóm y = 0.55 như bản cũ (đầu tâm 2.05). Trả về Parts body (màu đỉnh) + toạ độ hào quang.
 */
export function buildSeatedBuddha({ color = GOLD, halo = true, detail = 1 }) {
  const B = new Parts()
  const col = statueColors(color)
  // Đài sen bán kính 0.95 như bản cũ
  B.at([0, 0, 0], [0, 0, 0], 0.95, (T) => addLotusThrone(T, { layers: 2, color, detail }))

  B.at([0, 0.55, 0], [0, 0, 0], 1, (S) => {
    // Hai chân xếp bằng phủ áo
    S.add(revolve(LAP, 20, { sz: 0.72 }), { color: col.main, p: [0, 0, 0.1] })
    for (const sx of [-1, 1]) {
      S.add(new SphereGeometry(0.17, 10, 8), { color: col.main, p: [sx * 0.6, 0.13, 0.28], s: [1, 0.65, 0.95] })
      // Bàn chân ngửa trên đùi (kiết già)
      S.add(new SphereGeometry(0.11, 10, 6), { color: col.main, p: [sx * 0.3, 0.3, 0.32], r: [0, sx * 0.5, sx * 0.2], s: [1.5, 0.42, 0.75] })
      if (detail > 0) {
        const toe = new SphereGeometry(0.022, 5, 4)
        for (let k = 0; k < 4; k++) S.add(toe, { color: col.main, p: [sx * (0.43 + k * 0.012), 0.33, 0.28 + k * 0.035] })
      }
    }
    // Nếp áo võng trên lòng (nhiều lớp)
    const nFold = detail > 0 ? 5 : 3
    for (let i = 0; i < nFold; i++) {
      const y0 = 0.06 + i * 0.05
      const pts = curve(14, (t) => {
        const phi = (t * 2 - 1) * (0.95 - i * 0.08)
        return onBody(LAP, 0.72, phi, Math.max(0.01, y0 - 0.045 * Math.cos(phi * 1.6)), 0.006, 0.1)
      })
      S.add(sweep(pts, 0.018, { radial: 4 }), { color: col.fold })
    }
    // Vạt áo buông trước đài sen (xếp nếp, mép răng cưa nhẹ)
    for (const side of [0, 1]) {
      S.add(
        surface(16, 3, (u, v) => {
          const s = u * 2 - 1
          return [s * 0.42, 0.02 - v * 0.2, 0.6 + v * 0.07 + Math.sin(s * 12) * 0.018 * v - side * 0.025]
        }, { flip: side === 0 }),
        { color: side ? col.fold : col.main },
      )
    }
    S.add(sweep(curve(16, (t) => [(t * 2 - 1) * 0.42, -0.18 + Math.abs(Math.sin((t * 2 - 1) * 6)) * 0.02, 0.67]), 0.014, { radial: 4 }), { color: col.light })

    // Thân + cổ áo cà sa vắt vai trái, hai lớp viền chéo ngực, dải thắt ngang ngực
    S.add(revolve(TORSO, 20, { sz: 0.72 }), { color: col.main })
    for (const [dy, c] of [
      [0, col.light],
      [-0.07, col.fold],
    ]) {
      const hem = curve(16, (t) => onBody(TORSO, 0.72, -1.25 + t * 2.15, 1.1 - t * 0.62 + dy, 0.014))
      S.add(sweep(hem, 0.022, { radial: 4 }), { color: c })
    }
    S.add(sweep(curve(12, (t) => onBody(TORSO, 0.72, -0.9 + t * 1.6, 0.7, 0.012)), 0.018, { radial: 4 }), { color: col.fold })
    S.add(new SphereGeometry(0.035, 6, 4), { color: col.light, p: onBody(TORSO, 0.72, 0.45, 0.7, 0.03) })
    if (detail > 0) {
      // Nếp áo trên vai trái và lưng
      for (let i = 0; i < 4; i++) {
        const pts = curve(8, (t) => onBody(TORSO, 0.72, -1.6 - i * 0.35, 1.08 - t * 0.7, 0.01))
        S.add(sweep(pts, 0.014, { radial: 3 }), { color: col.fold })
      }
    }

    // Hai tay: cánh tay, cẳng tay, bàn tay kết ấn thiền định trên lòng
    for (const sx of [-1, 1]) {
      const sh = [sx * 0.42, 1.04, -0.02]
      const el = [sx * 0.52, 0.62, 0.12]
      const wr = [sx * 0.17, 0.42, 0.36]
      const upper = curve(6, (t) => [sh[0] + (el[0] - sh[0]) * t + sx * Math.sin(t * Math.PI) * 0.04, sh[1] + (el[1] - sh[1]) * t, sh[2] + (el[2] - sh[2]) * t])
      S.add(sweep(upper, (t) => (sx < 0 ? 0.14 : 0.12) - 0.025 * t, { radial: 8, caps: true }), { color: col.main })
      const fore = curve(6, (t) => [el[0] + (wr[0] - el[0]) * t, el[1] + (wr[1] - el[1]) * t - Math.sin(t * Math.PI) * 0.03, el[2] + (wr[2] - el[2]) * t])
      S.add(sweep(fore, (t) => 0.1 - 0.025 * t, { radial: 8, caps: true }), { color: col.main })
      if (sx < 0 && detail > 0) {
        // Vạt áo phủ cánh tay trái: các nếp vòng
        for (let k = 1; k < 4; k++) {
          const c0 = upper[k * 1 + 1]
          S.add(new TorusGeometry(0.135, 0.012, 4, 12), { color: col.fold, p: c0, r: [Math.PI / 2 + 0.3, 0, -0.3] })
        }
      }
    }
    // Bàn tay: tay phải đặt trên tay trái, ngón khép (gộp), hai đầu ngón cái chạm nhau thành vòng
    S.add(new SphereGeometry(0.1, 10, 6), { color: col.main, p: [0, 0.4, 0.42], s: [1.55, 0.42, 1.0] })
    S.add(new SphereGeometry(0.1, 10, 6), { color: col.main, p: [0, 0.44, 0.43], s: [1.45, 0.38, 0.95] })
    if (detail > 0) {
      const finger = new SphereGeometry(0.024, 6, 4)
      for (let k = 0; k < 4; k++) {
        S.add(finger, { color: col.main, p: [0.12, 0.41, 0.36 + k * 0.035], s: [1.8, 0.8, 0.9] })
        S.add(finger, { color: col.main, p: [-0.12, 0.45, 0.37 + k * 0.034], s: [1.8, 0.8, 0.9] })
      }
    }
    const thumbs = curve(10, (t) => [(t * 2 - 1) * 0.07, 0.46 + Math.sin(t * Math.PI) * 0.06, 0.5])
    S.add(sweep(thumbs, 0.021, { radial: 5, caps: true }), { color: col.main })

    // Cổ ba ngấn (tam đạo)
    S.add(new CylinderGeometry(0.11, 0.13, 0.2, 12), { color: col.main, p: [0, 1.3, 0] })
    for (const y of [1.25, 1.3, 1.35]) S.add(new TorusGeometry(0.115, 0.007, 3, 16), { color: col.fold, p: [0, y, 0.005], r: [Math.PI / 2, 0, 0] })

    // Đầu: mặt hiền, tóc xoắn ốc, nhục kế, minh châu
    const R = 0.26
    const hc = [0, 1.5, 0]
    S.add(new SphereGeometry(R, 18, 14), { color: col.main, p: hc, s: [0.94, 1.08, 0.98] })
    addSereneFace(S, [0, 1.5, 0], R * 1.0, col, detail)
    S.add(new SphereGeometry(R * 1.02, 16, 10, 0, Math.PI * 2, 0, 1.75), { color: col.hair, p: [0, 1.5, -0.01], r: [-0.42, 0, 0], s: [0.95, 1.08, 0.99] })
    addCurls(S, [0, 1.5, -0.01], R * 1.04, detail > 0 ? 220 : 90, detail > 0 ? 0.03 : 0.045, col.hair, (x, y, z) => y > 0.1 + 0.26 * z)
    S.add(new SphereGeometry(0.15, 12, 8), { color: col.hair, p: [0, 1.76, -0.03] })
    addCurls(S, [0, 1.76, -0.03], 0.155, detail > 0 ? 70 : 30, detail > 0 ? 0.028 : 0.04, col.hair, (x, y) => y > -0.25)
    S.add(new SphereGeometry(0.045, 8, 6), { color: col.jewel, p: [0, 1.93, -0.01], s: [1, 1.3, 1] })
    S.add(new ConeGeometry(0.03, 0.08, 6), { color: col.jewel, p: [0, 1.99, -0.01] })
  })

  // Hào quang có hoa văn (vòng ngoài, vòng trong, cánh sen, lưỡi lửa)
  const haloAt = [0, 2.05, -0.35]
  if (halo) {
    B.at(haloAt, [0, 0, 0], 1, (H) => {
      H.add(new TorusGeometry(0.64, 0.022, 4, 40), { color: col.jewel })
      H.add(new TorusGeometry(0.44, 0.016, 4, 32), { color: col.jewel })
      H.add(new TorusGeometry(0.3, 0.01, 4, 28), { color: col.jewel })
      if (detail > 0) {
        const pet = new SphereGeometry(0.06, 6, 4)
        const flame = new ConeGeometry(0.035, 0.13, 4)
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2
          H.add(pet, { color: col.jewel, p: [Math.cos(a) * 0.54, Math.sin(a) * 0.54, 0], r: [0, 0, a - Math.PI / 2], s: [0.55, 1.4, 0.3] })
        }
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2
          H.add(flame, { color: col.jewel, p: [Math.cos(a) * 0.71, Math.sin(a) * 0.71, 0], r: [0, 0, a - Math.PI / 2], s: [1, i % 2 ? 0.8 : 1.2, 0.4] })
        }
      }
    })
  }
  return { body: B.build(), haloAt }
}

/* ------------------------------------------------------------------ */
/* Tượng Bồ Tát đứng                                                  */
/* ------------------------------------------------------------------ */

const ROBE = [
  [0.5, 0.0],
  [0.52, 0.06],
  [0.47, 0.4],
  [0.4, 0.85],
  [0.33, 1.2],
  [0.31, 1.3],
]
const CHEST = [
  [0.31, 1.26],
  [0.29, 1.45],
  [0.33, 1.72],
  [0.37, 1.9],
  [0.3, 2.0],
  [0.12, 2.1],
  [0.1, 2.16],
]
const CLOAK = [
  [0.6, 0.14],
  [0.56, 0.55],
  [0.47, 1.15],
  [0.43, 1.65],
  [0.42, 1.9],
  [0.32, 2.04],
  [0.15, 2.12],
]
const VEIL = [
  [0.5, 1.96],
  [0.42, 2.04],
  [0.32, 2.2],
  [0.29, 2.38],
  [0.27, 2.55],
  [0.18, 2.7],
  [0.0, 2.76],
]

/**
 * Tượng Bồ Tát (Quán Âm) đứng (đơn vị size 3, gốc tại chân tượng): xiêm y xếp nếp, áo choàng mở trước,
 * khăn trùm, búi tóc + mũ miện, tay chắp trước ngực, chuỗi anh lạc, dải lụa hai bên.
 */
export function buildBodhisattva({ color = PALETTE.bronze, detail = 1 }) {
  const S = new Parts()
  const col = statueColors(color)
  // Chân (mũi chân lộ dưới gấu áo)
  for (const sx of [-1, 1]) S.add(new SphereGeometry(0.08, 8, 6), { color: col.main, p: [sx * 0.11, 0.04, 0.4], s: [1, 0.6, 1.5] })
  // Xiêm y trong: xếp nếp dọc, gấu áo viền
  S.add(revolve(ROBE, 32, { sz: 0.82, mod: (a, v) => 1 + 0.035 * Math.sin(a * 14) * (1 - v) }), { color: col.main })
  S.add(new TorusGeometry(0.5, 0.025, 4, 32), { color: col.light, p: [0, 0.06, 0], r: [Math.PI / 2, 0, 0], s: [1, 0.82, 1] })
  // Thắt lưng + dải buông trước
  S.add(new TorusGeometry(0.315, 0.03, 4, 24), { color: col.light, p: [0, 1.27, 0], r: [Math.PI / 2, 0, 0], s: [1, 0.82, 1] })
  S.add(new SphereGeometry(0.05, 8, 6), { color: col.light, p: [0, 1.25, 0.27] })
  for (const sx of [-1, 1]) {
    const band = curve(10, (t) => [sx * (0.04 + t * 0.05), 1.23 - t * 0.75, onBody(ROBE, 0.82, 0, 1.23 - t * 0.75, 0.02)[2]])
    S.add(sweep(band, 0.04, { radial: 4, sx: 0.3, sy: 1, up: [0, 0, 1] }), { color: col.fold })
  }
  // Thân trên
  S.add(revolve(CHEST, 24, { sz: 0.78 }), { color: col.main })
  // Áo choàng: mở phía trước, hai lớp (ngoài/lót), nếp gấp, nẹp viền hai mép
  const fold = (a, v) => 1 + 0.04 * Math.sin(a * 9) * (1 - v * 0.7)
  S.add(revolve(CLOAK, 30, { sz: 0.85, phi0: 0.5, phiLen: Math.PI * 2 - 1.0, mod: fold }), { color: col.main })
  S.add(revolve(CLOAK.map(([r, y]) => [r * 0.96, y]), 30, { sz: 0.85, phi0: 0.5, phiLen: Math.PI * 2 - 1.0, mod: fold, flip: true }), { color: col.deep })
  for (const sx of [-1, 1]) {
    const edge = curve(12, (t) => {
      const y = 0.14 + t * 1.9
      const r = radiusAt(CLOAK, y) * fold(sx * 0.5, (y - 0.14) / 1.98)
      return [Math.sin(sx * 0.5) * r, y, Math.cos(0.5) * r * 0.85]
    })
    S.add(sweep(edge, 0.03, { radial: 4 }), { color: col.light })
  }
  // Chuỗi anh lạc trước ngực
  const bead = new IcosahedronGeometry(0.03, 0)
  const nB = detail > 0 ? 22 : 12
  for (let i = 0; i <= nB; i++) {
    const t = i / nB
    const phi = (t * 2 - 1) * 0.8
    const y = 1.88 - Math.cos((t * 2 - 1) * Math.PI * 0.5) * 0.3
    S.add(bead, { color: col.jewel, p: onBody(CHEST, 0.78, phi, y, 0.02) })
  }
  S.add(new SphereGeometry(0.05, 8, 6), { color: col.jewel, p: onBody(CHEST, 0.78, 0, 1.53, 0.03), s: [1, 1.4, 0.6] })
  // Tay chắp trước ngực: cánh tay, cẳng tay, ống tay áo rộng buông, hai bàn tay áp nhau
  for (const sx of [-1, 1]) {
    const sh = [sx * 0.36, 1.9, -0.02]
    const el = [sx * 0.4, 1.45, 0.1]
    const wr = [sx * 0.05, 1.62, 0.33]
    S.add(sweep(curve(6, (t) => [sh[0] + (el[0] - sh[0]) * t + sx * Math.sin(t * Math.PI) * 0.03, sh[1] + (el[1] - sh[1]) * t, sh[2] + (el[2] - sh[2]) * t]), (t) => 0.11 - 0.02 * t, { radial: 8, caps: true }), { color: col.main })
    S.add(sweep(curve(6, (t) => [el[0] + (wr[0] - el[0]) * t, el[1] + (wr[1] - el[1]) * t, el[2] + (wr[2] - el[2]) * t]), (t) => 0.1 - 0.03 * t, { radial: 8, caps: true }), { color: col.main })
    // Ống tay áo rộng rủ xuống từ cẳng tay
    const sleeve = curve(8, (t) => [sx * (0.3 - t * 0.02), 1.5 - t * 0.55, 0.16 + Math.sin(t * Math.PI) * 0.04])
    S.add(sweep(sleeve, (t) => 0.1 + 0.06 * t, { radial: 8, sx: 0.45, sy: 1, up: [1, 0, 0], caps: true }), { color: col.main })
    if (detail > 0) S.add(sweep(curve(6, (t) => [sx * (0.3 - t * 0.02) + sx * 0.01, 1.1 - t * 0.12, 0.2 + t * 0.03]), 0.016, { radial: 3 }), { color: col.fold })
    // Bàn tay (ngón khép, gộp) chĩa lên
    S.add(new SphereGeometry(0.075, 8, 6), { color: col.main, p: [sx * 0.03, 1.72, 0.35], r: [-0.3, 0, 0], s: [0.45, 1.5, 0.9] })
    if (detail > 0) {
      for (let k = 0; k < 3; k++) S.add(new SphereGeometry(0.02, 5, 4), { color: col.fold, p: [sx * 0.05, 1.68 + k * 0.05, 0.38 - k * 0.012], s: [0.6, 1, 0.8] })
    }
  }
  // Dải lụa (thiên y) vắt hai bên vai buông dài, uốn lượn
  for (const sx of [-1, 1]) {
    const scarf = curve(14, (t) => [sx * (0.46 + Math.sin(t * Math.PI * 1.5) * 0.06 + t * 0.06), 1.85 - t * 1.45, 0.05 + Math.sin(t * Math.PI * 2) * 0.05])
    S.add(sweep(scarf, (t) => 0.06 + 0.02 * t, { radial: 6, sx: 0.3, sy: 1, up: [1, 0, 0], caps: true }), { color: col.light })
  }
  // Cổ ba ngấn
  S.add(new CylinderGeometry(0.1, 0.12, 0.2, 12), { color: col.main, p: [0, 2.17, 0] })
  for (const y of [2.13, 2.18]) S.add(new TorusGeometry(0.105, 0.006, 3, 16), { color: col.fold, p: [0, y, 0.005], r: [Math.PI / 2, 0, 0] })
  // Đầu, mặt hiền
  const R = 0.24
  S.add(new SphereGeometry(R, 18, 14), { color: col.main, p: [0, 2.38, 0], s: [0.92, 1.08, 0.95] })
  addSereneFace(S, [0, 2.38, 0], R, col, detail)
  // Tóc rẽ ngôi + búi cao
  S.add(new SphereGeometry(R * 1.03, 16, 10, 0, Math.PI * 2, 0, 1.6), { color: col.hair, p: [0, 2.39, -0.01], r: [-0.45, 0, 0], s: [0.93, 1.06, 0.97] })
  if (detail > 0) {
    for (const sx of [-1, 1]) {
      const strand = curve(8, (t) => {
        const a = t * 1.2
        return [sx * Math.sin(a) * R * 0.95, 2.38 + Math.cos(a) * R * 1.02 * 0.98, Math.cos(a * 0.8) * R * 0.55]
      })
      S.add(sweep(strand, 0.012, { radial: 3 }), { color: shade(col.hair, 1.25) })
    }
  }
  S.add(new SphereGeometry(0.13, 10, 8), { color: col.hair, p: [0, 2.64, -0.04], s: [1, 0.9, 1] })
  S.add(new SphereGeometry(0.09, 10, 8), { color: col.hair, p: [0, 2.76, -0.04] })
  S.add(new ConeGeometry(0.06, 0.14, 8), { color: col.hair, p: [0, 2.86, -0.04] })
  // Mũ miện: vành vàng, lá miện hình lửa, hoá Phật giữa trán
  S.add(new TorusGeometry(0.23, 0.028, 4, 24), { color: col.jewel, p: [0, 2.5, 0.0], r: [Math.PI / 2 - 0.25, 0, 0], s: [0.95, 1, 1] })
  const leaf = new ConeGeometry(0.06, 0.2, 4)
  for (let i = -2; i <= 2; i++) {
    const a = i * 0.45
    S.add(leaf, { color: col.jewel, p: [Math.sin(a) * 0.22, 2.6 - Math.abs(i) * 0.02, Math.cos(a) * 0.21 - 0.02], r: [-0.25, a, 0, 'YXZ'], s: [1, i === 0 ? 1.4 : 1, 0.35] })
  }
  S.add(new SphereGeometry(0.035, 6, 4), { color: col.light, p: [0, 2.6, 0.23] })
  S.add(new SphereGeometry(0.025, 6, 4), { color: col.light, p: [0, 2.65, 0.225] })
  // Khăn trùm phủ sau đầu xuống vai (mở phía trước)
  S.add(revolve(VEIL, 24, { sz: 0.95, phi0: 1.05, phiLen: Math.PI * 2 - 2.1 }), { color: col.main, p: [0, 0, -0.03] })
  S.add(revolve(VEIL.map(([r, y]) => [r * 0.95, y]), 24, { sz: 0.95, phi0: 1.05, phiLen: Math.PI * 2 - 2.1, flip: true }), { color: col.deep, p: [0, 0, -0.03] })
  return S.build()
}

/* ------------------------------------------------------------------ */
/* Lư hương                                                           */
/* ------------------------------------------------------------------ */

const BOWL = [
  [0.0, 0.84],
  [0.22, 0.85],
  [0.38, 0.9],
  [0.48, 1.0],
  [0.5, 1.12],
  [0.47, 1.2],
  [0.5, 1.24],
  [0.48, 1.27],
  [0.44, 1.26],
]

/** Lư hương đồng ba chân trên bệ đá chạm (đơn vị scale 1) → { stone, bronze } */
export function buildIncenseBurner(detail = 1) {
  const S = new Parts()
  const B = new Parts()
  const st = PALETTE.stoneDark
  const stLight = PALETTE.stone
  // Bệ đá: chân đế, thân, mặt bệ, ô hộc chạm hoa thị bốn mặt
  S.add(new BoxGeometry(1.42, 0.08, 1.42), { color: st, p: [0, 0.04, 0], tile: 0.7 })
  S.add(new BoxGeometry(1.3, 0.46, 1.3), { color: stLight, p: [0, 0.3, 0], tile: 0.7 })
  S.add(new BoxGeometry(1.4, 0.08, 1.4), { color: st, p: [0, 0.56, 0], tile: 0.7 })
  S.add(new BoxGeometry(1.34, 0.04, 1.34), { color: stLight, p: [0, 0.62, 0] })
  for (let f = 0; f < 4; f++) {
    const a = (f * Math.PI) / 2
    S.at([Math.sin(a) * 0.651, 0.3, Math.cos(a) * 0.651], [0, a, 0], 1, (F) => {
      F.add(BOX, { color: st, s: [0.9, 0.3, 0.02] })
      F.add(BOX, { color: stLight, p: [0, 0, 0.008], s: [0.84, 0.24, 0.02] })
      F.add(new TorusGeometry(0.08, 0.018, 4, 14), { color: st, p: [0, 0, 0.02] })
      if (detail > 0) {
        for (const sx of [-1, 1]) F.add(new TorusGeometry(0.05, 0.012, 3, 10, Math.PI * 1.4), { color: st, p: [sx * 0.24, 0, 0.02], r: [0, 0, sx > 0 ? 0 : Math.PI] })
        for (let k = 0; k < 6; k++) {
          const b = (k / 6) * Math.PI * 2
          F.add(new SphereGeometry(0.025, 5, 3), { color: st, p: [Math.cos(b) * 0.04, Math.sin(b) * 0.04, 0.02], s: [1, 1, 0.5] })
        }
      }
    })
  }
  const br = PALETTE.bronze
  const brDark = shade(br, 0.72)
  const brLight = mix(br, GOLD, 0.45)
  // Ba chân cong (chân sư tử): từ đáy bầu cong ra rồi xuống, đầu chân tròn
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6
    const dx = Math.sin(a)
    const dz = Math.cos(a)
    const leg = curve(8, (t) => {
      const r = 0.26 + Math.sin(t * Math.PI * 0.6) * 0.14
      return [dx * r, 0.92 - t * 0.27, dz * r]
    })
    B.add(sweep(leg, (t) => 0.06 - 0.015 * t, { radial: 6, caps: true }), { color: br })
    B.add(new SphereGeometry(0.06, 8, 6), { color: brDark, p: [dx * 0.39, 0.66, dz * 0.39], s: [1.2, 0.7, 1.2] })
    B.add(new SphereGeometry(0.05, 6, 5), { color: brLight, p: [dx * 0.3, 0.9, dz * 0.3] })
  }
  // Bầu lư: thân tròn, gờ miệng, mặt trong, đai hoa văn, núm nổi
  B.add(revolve(BOWL, 24), { color: br })
  B.add(revolve([[0.42, 1.22], [0.44, 1.265]], 24, { flip: true }), { color: brDark })
  for (const y of [0.98, 1.17]) B.add(new TorusGeometry(radiusAt(BOWL, y) + 0.01, 0.016, 4, 32), { color: brLight, p: [0, y, 0], r: [Math.PI / 2, 0, 0] })
  if (detail > 0) {
    const boss = new SphereGeometry(0.03, 6, 4)
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2
      B.add(boss, { color: brLight, p: [Math.sin(a) * 0.505, 1.08, Math.cos(a) * 0.505] })
    }
  }
  B.add(new CylinderGeometry(0.42, 0.42, 0.04, 20), { color: '#cfc3a8', p: [0, 1.23, 0] })
  // Tai lư đứng trên miệng (quai vuông bo tròn)
  for (const sx of [-1, 1]) {
    const ear = curve(10, (t) => {
      const a = t * Math.PI
      return [sx * (0.47 + Math.sin(a) * 0.05), 1.25 + (1 - Math.cos(a)) * 0.08 + Math.sin(a) * 0.04, 0]
    })
    B.add(sweep(ear, 0.03, { radial: 5 }), { color: br })
    B.add(new TorusGeometry(0.09, 0.028, 5, 12), { color: br, p: [sx * 0.5, 1.4, 0] })
  }
  return { stone: S.build(), bronze: B.build() }
}

/** Que hương đang cháy (n nén) → { sticks, embers } (vị trí như bản cũ) */
export function buildIncenseSticks(n) {
  const S = new Parts()
  const E = new Parts()
  const stick = new CylinderGeometry(0.008, 0.008, 0.45, 4)
  const handle = new CylinderGeometry(0.012, 0.012, 0.12, 4)
  const ember = new SphereGeometry(0.015, 6, 4)
  for (let i = 0; i < Math.min(n, 9); i++) {
    const a = i * 2.4
    const r = 0.08 + (i % 3) * 0.08
    S.at([Math.cos(a) * r, 1.45, Math.sin(a) * r], [0, 0, Math.sin(a) * 0.08], 1, (G) => {
      G.add(stick, { color: PALETTE.incense })
      G.add(handle, { color: '#c98f4a', p: [0, -0.17, 0] })
    })
    E.at([Math.cos(a) * r, 1.45, Math.sin(a) * r], [0, 0, Math.sin(a) * 0.08], 1, (G) => G.add(ember, { p: [0, 0.23, 0] }))
  }
  return { sticks: S.build(), embers: E.build() }
}

/* ------------------------------------------------------------------ */
/* Bồ đoàn, đèn lồng, đèn đá                                          */
/* ------------------------------------------------------------------ */

/** Bồ đoàn: đệm tròn xếp nếp, viền ống hai mép, nút giữa */
export function buildBodoan(color, detail = 1) {
  const B = new Parts()
  const dark = shade(color, 0.72)
  const prof = [
    [0, 0.0],
    [0.3, 0.0],
    [0.37, 0.03],
    [0.39, 0.09],
    [0.37, 0.15],
    [0.3, 0.18],
    [0.12, 0.195],
    [0, 0.19],
  ]
  B.add(revolve(prof, 28, { mod: (a, v) => (v > 0.15 && v < 0.85 ? 1 + 0.025 * Math.sin(a * 16) : 1) }), { color })
  for (const y of [0.03, 0.155]) B.add(new TorusGeometry(0.37, 0.016, 4, 28), { color: dark, p: [0, y, 0], r: [Math.PI / 2, 0, 0] })
  B.add(new SphereGeometry(0.04, 8, 6), { color: dark, p: [0, 0.19, 0], s: [1, 0.5, 1] })
  if (detail > 0) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      B.add(sweep(curve(4, (t) => [Math.sin(a) * (0.05 + t * 0.22), 0.193 - t * t * 0.01, Math.cos(a) * (0.05 + t * 0.22)]), 0.006, { radial: 3 }), { color: dark })
    }
  }
  return B.build()
}

const LANTERN = [
  [0.1, -0.28],
  [0.17, -0.25],
  [0.23, -0.15],
  [0.25, 0],
  [0.23, 0.15],
  [0.17, 0.25],
  [0.1, 0.28],
]

/** Thân đèn lồng có gân (phần đổi vật liệu sáng/tối) */
export function lanternBodyGeo() {
  return revolve(LANTERN, 24, { mod: (a) => 1 - 0.05 * Math.abs(Math.sin(a * 4)) })
}

/** Khung đèn lồng: nắp, đáy, gân vàng, dây treo, tua rua */
export function buildLanternFrame({ hang = 0, color = '#d83a2e', detail = 1 }) {
  const B = new Parts()
  const gold = GOLD
  B.add(new CylinderGeometry(0.1, 0.13, 0.06, 10), { color: gold, p: [0, 0.29, 0] })
  B.add(new CylinderGeometry(0.06, 0.1, 0.05, 10), { color: gold, p: [0, 0.34, 0] })
  B.add(new CylinderGeometry(0.13, 0.1, 0.06, 10), { color: gold, p: [0, -0.29, 0] })
  B.add(new TorusGeometry(0.035, 0.008, 4, 10), { color: gold, p: [0, 0.39, 0] })
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const rib = LANTERN.map(([r, y]) => [Math.sin(a) * (r + 0.004), y, Math.cos(a) * (r + 0.004)])
    B.add(sweep(rib, 0.008, { radial: 3 }), { color: gold })
  }
  if (detail > 0) {
    for (const y of [-0.17, 0.17]) B.add(new TorusGeometry(0.225, 0.008, 3, 24), { color: gold, p: [0, y, 0], r: [Math.PI / 2, 0, 0] })
  }
  // Dây treo từ móc (y 0.4) lên tới điểm treo y = hang như bản cũ
  if (hang > 0.42) B.add(new CylinderGeometry(0.008, 0.008, hang - 0.4, 4), { color: '#3b2a1a', p: [0, (0.4 + hang) / 2, 0] })
  // Tua rua: nút thắt, chuỗi hạt, chùm sợi
  const tassel = mix(color, GOLD, 0.25)
  B.add(new SphereGeometry(0.03, 6, 4), { color: gold, p: [0, -0.35, 0] })
  B.add(new CylinderGeometry(0.012, 0.012, 0.08, 4), { color: tassel, p: [0, -0.4, 0] })
  B.add(new CylinderGeometry(0.03, 0.022, 0.05, 6), { color: gold, p: [0, -0.46, 0] })
  const nStr = detail > 0 ? 8 : 4
  const str = new CylinderGeometry(0.006, 0.004, 0.22, 3)
  for (let i = 0; i < nStr; i++) {
    const a = (i / nStr) * Math.PI * 2
    B.add(str, { color: tassel, p: [Math.sin(a) * 0.015, -0.59, Math.cos(a) * 0.015], r: [Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08] })
  }
  return B.build()
}

/** Đèn đá (thạch đăng): đế lục giác, thân có đai, bệ đèn, buồng đèn bốn trụ, mái cong, búp sen */
export function buildStoneLantern(detail = 1) {
  const S = new Parts()
  const st = PALETTE.stoneDark
  const lt = PALETTE.stone
  S.add(new CylinderGeometry(0.3, 0.33, 0.1, 6), { color: st, p: [0, 0.05, 0], tile: 0.5 })
  S.add(new CylinderGeometry(0.24, 0.28, 0.08, 6), { color: lt, p: [0, 0.14, 0], tile: 0.5 })
  S.add(new CylinderGeometry(0.13, 0.17, 0.46, 6), { color: st, p: [0, 0.41, 0], tile: 0.5 })
  for (const y of [0.3, 0.55]) S.add(new CylinderGeometry(0.165, 0.165, 0.03, 6), { color: lt, p: [0, y, 0] })
  S.add(new CylinderGeometry(0.26, 0.18, 0.08, 6), { color: lt, p: [0, 0.68, 0] })
  S.add(new BoxGeometry(0.44, 0.04, 0.44), { color: st, p: [0, 0.73, 0] })
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) S.add(new BoxGeometry(0.07, 0.26, 0.07), { color: lt, p: [sx * 0.17, 0.86, sz * 0.17] })
  S.add(new BoxGeometry(0.46, 0.04, 0.46), { color: st, p: [0, 1.0, 0] })
  // Mái bốn mái cong + đầu đao nhỏ
  S.add(new ConeGeometry(0.4, 0.24, 4, 1), { color: st, p: [0, 1.14, 0], r: [0, Math.PI / 4, 0] })
  if (detail > 0) {
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2
      const dx = Math.sin(a)
      const dz = Math.cos(a)
      const tip = curve(6, (t) => [dx * (0.36 + t * 0.06), 1.03 + t * t * 0.1, dz * (0.36 + t * 0.06)])
      S.add(sweep(tip, (t) => 0.03 * (1 - 0.6 * t), { radial: 4, caps: true }), { color: st })
    }
  }
  S.add(new SphereGeometry(0.07, 8, 6), { color: lt, p: [0, 1.3, 0], s: [1, 1.2, 1] })
  S.add(new ConeGeometry(0.045, 0.1, 6), { color: lt, p: [0, 1.39, 0] })
  return S.build()
}

/* ------------------------------------------------------------------ */
/* Hồ sen                                                             */
/* ------------------------------------------------------------------ */

/** Lá sen: đĩa có khía, mép hơi cong lên, gân toả */
function addPad(B, p, s, rot, color, detail, cup = 0) {
  const pad = surface(14, 2, (u, v) => {
    const a = 0.2 + u * (Math.PI * 2 - 0.4)
    const r = v * 0.6
    return [Math.cos(a) * r, (v * v * 0.06 + cup * v * v) * 1, Math.sin(a) * r]
  }, { flip: true })
  B.add(pad, { color, p, r: [0, rot, 0], s })
  if (detail > 0) {
    const vein = new BoxGeometry(0.55, 0.012, 0.02)
    for (let i = 0; i < 5; i++) {
      const a = 0.6 + (i / 5) * (Math.PI * 2 - 1.2)
      B.add(vein, { color: shade(color, 1.2), p: [p[0], p[1] + 0.012 * s, p[2]], r: [0, rot - a, 0], s: [s, 1, s] })
    }
  }
}

/** Hoa sen nhiều cánh: lớp ngoài xoè, lớp trong khép, gương sen vàng + nhị */
function addFlower(B, p, s, detail) {
  const pink = PALETTE.lotus
  const light = mix(pink, '#ffffff', 0.45)
  B.add(new CylinderGeometry(0.06 * s, 0.05 * s, 0.05 * s, 10), { color: '#e2c04f', p: [p[0], p[1] + 0.09 * s, p[2]] })
  for (const [n, tilt, len, wid, y] of [
    [8, 0.95, 0.24, 0.13, 0.02],
    [7, 0.55, 0.22, 0.12, 0.04],
    ...(detail > 0 ? [[6, 0.25, 0.18, 0.1, 0.06]] : []),
  ]) {
    for (let i = 0; i < n; i++) {
      const a = ((i + y * 20) / n) * Math.PI * 2
      addPetal(B, { p: [p[0] + Math.sin(a) * 0.03 * s, p[1] + y * s, p[2] + Math.cos(a) * 0.03 * s], a, tilt, size: [wid * s, len * s], color: tilt > 0.5 ? pink : light, inner: light, lo: true })
    }
  }
}

/** Đồ trang trí hồ sen (không gồm mặt nước): bờ đá ghép, đáy hồ, lá, hoa, nụ → { stone, plants } */
export function buildPond(w, d, seed, detail = 1) {
  const S = new Parts()
  const P = new Parts()
  const rnd = seeded(seed)
  S.add(new BoxGeometry(w, 0.04, d), { color: '#3f5a4c', p: [0, 0.03, 0] })
  // Bờ đá: các khối đá ghép, cao thấp khác nhau
  const ring = (len, along) => {
    const n = Math.max(2, Math.round(len / 0.8))
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n - 0.5
      const h = 0.3 + rnd() * 0.06
      along(t * len, len / n - 0.03, h, i)
    }
  }
  for (const sz of [-1, 1]) {
    ring(w + 0.6, (x, l, h, i) => S.add(new BoxGeometry(l, h, 0.3), { color: i % 3 ? PALETTE.stoneDark : PALETTE.stone, p: [x, h / 2 - 0.02, sz * (d / 2 + 0.15)], tile: 0.6 }))
  }
  for (const sx of [-1, 1]) {
    ring(d, (z, l, h, i) => S.add(new BoxGeometry(0.3, h, l), { color: i % 3 ? PALETTE.stone : PALETTE.stoneDark, p: [sx * (w / 2 + 0.15), h / 2 - 0.02, z], tile: 0.6 }))
  }
  // Lá, hoa, nụ
  const leaf = PALETTE.lotusLeaf
  const n = Math.round((w * d) / 3)
  for (let i = 0; i < n; i++) {
    const x = (rnd() - 0.5) * (w - 0.8)
    const z = (rnd() - 0.5) * (d - 0.8)
    const s = 0.35 + rnd() * 0.3
    const kind = rnd()
    const rot = rnd() * Math.PI * 2
    addPad(P, [x, 0.225, z], s, rot, rnd() > 0.5 ? leaf : shade(leaf, 1.12), detail)
    if (kind > 0.6) addFlower(P, [x + 0.1, 0.24, z], s * 1.1, detail)
    else if (kind > 0.4) {
      // Nụ sen trên cuống
      const hgt = 0.25 + rnd() * 0.2
      P.add(new CylinderGeometry(0.012, 0.015, hgt, 4), { color: shade(leaf, 0.9), p: [x - 0.12, 0.22 + hgt / 2, z] })
      P.add(new SphereGeometry(0.06, 8, 6), { color: PALETTE.lotus, p: [x - 0.12, 0.22 + hgt + 0.04, z], s: [0.75, 1.25, 0.75] })
      P.add(new ConeGeometry(0.045, 0.08, 8), { color: mix(PALETTE.lotus, '#c0446c', 0.4), p: [x - 0.12, 0.22 + hgt + 0.13, z] })
    } else if (kind > 0.3 && detail > 0) {
      // Lá sen vươn cao, khum lòng chảo
      const hgt = 0.3 + rnd() * 0.25
      P.add(new CylinderGeometry(0.012, 0.016, hgt, 4), { color: shade(leaf, 0.9), p: [x + 0.1, 0.22 + hgt / 2, z + 0.1] })
      addPad(P, [x + 0.1, 0.22 + hgt, z + 0.1], s * 0.8, rot, shade(leaf, 0.95), detail, 0.25)
    }
  }
  return { stone: S.build(), plants: P.build() }
}

/* ------------------------------------------------------------------ */
/* Gác chuông                                                         */
/* ------------------------------------------------------------------ */

const BELL_TOP_DOWN = [
  [0.0, 0.02],
  [0.2, 0.0],
  [0.38, -0.08],
  [0.5, -0.22],
  [0.55, -0.4],
  [0.57, -0.7],
  [0.625, -1.0],
  [0.66, -1.3],
  [0.72, -1.55],
  [0.74, -1.62],
  [0.7, -1.65],
]
/** Biên dạng chuông từ dưới lên (cho revolve / radiusAt) */
const BELL = BELL_TOP_DOWN.slice().reverse()

/** Chuông đồng (gốc tại điểm treo của nhóm chuông, y = 3.4 trong gác): thân, đai, núm, toà sen thỉnh, quai bồ lao */
export function buildBell(detail = 1) {
  const B = new Parts()
  const br = PALETTE.bronze
  const dark = shade(br, 0.72)
  const light = mix(br, GOLD, 0.35)
  B.add(revolve(BELL, 28), { color: br })
  B.add(revolve([[0.7, -1.65], [0.66, -1.5], [0.6, -1.4]], 28, { flip: true }), { color: dark })
  for (const y of [-0.42, -0.5, -1.18, -1.26, -1.58]) {
    B.add(new TorusGeometry(radiusAt(BELL, y) + 0.005, 0.018, 4, 32), { color: light, p: [0, y, 0], r: [Math.PI / 2, 0, 0] })
  }
  // Bốn đai dọc chia ô
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2
    const pts = curve(8, (t) => {
      const y = -0.5 - t * 0.68
      const r = radiusAt(BELL, y) + 0.008
      return [Math.sin(a) * r, y, Math.cos(a) * r]
    })
    B.add(sweep(pts, 0.016, { radial: 4 }), { color: light })
  }
  // Núm chuông (3×3 mỗi ô phía trên)
  if (detail > 0) {
    const boss = new SphereGeometry(0.022, 6, 4)
    for (let i = 0; i < 4; i++) {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const a = (i * Math.PI) / 2 + (c - 1) * 0.28
          const y = -0.6 - r * 0.1
          const rad = radiusAt(BELL, y) + 0.012
          B.add(boss, { color: light, p: [Math.sin(a) * rad, y, Math.cos(a) * rad] })
        }
      }
    }
  }
  // Toà sen thỉnh (chỗ chày chạm) phía trước và sau
  for (const sz of [-1, 1]) {
    B.at([0, -1.0, sz * 0.632], [0, sz > 0 ? 0 : Math.PI, 0], 1, (F) => {
      F.add(new TorusGeometry(0.1, 0.018, 4, 16), { color: light })
      F.add(new CylinderGeometry(0.05, 0.05, 0.03, 10), { color: light, r: [Math.PI / 2, 0, 0] })
      if (detail > 0) {
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2
          F.add(new SphereGeometry(0.03, 5, 3), { color: light, p: [Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0], r: [0, 0, a - Math.PI / 2], s: [0.6, 1.4, 0.4] })
        }
      }
    })
  }
  // Vành cánh sen quanh miệng chuông
  if (detail > 0) {
    const pet = new SphereGeometry(0.045, 5, 3)
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2
      B.add(pet, { color: light, p: [Math.sin(a) * 0.715, -1.45, Math.cos(a) * 0.715], r: [0.2, a, 0, 'YXZ'], s: [0.8, 1.6, 0.35] })
    }
  }
  // Quai bồ lao: vòm cong hai đầu rồng ôm lấy móc treo
  const arch = curve(14, (t) => [(t * 2 - 1) * 0.2, 0.0 + Math.sin(t * Math.PI) * 0.16, 0])
  B.add(sweep(arch, (t) => 0.04 + 0.02 * Math.sin(t * Math.PI), { radial: 6, caps: true }), { color: dark })
  for (const sx of [-1, 1]) B.add(new SphereGeometry(0.05, 6, 5), { color: dark, p: [sx * 0.2, 0.02, 0], s: [1, 0.8, 1.3] })
  return B.build()
}

/** Gác chuông tĩnh (không gồm chuông/chày): nền, bốn cột son câu đối, xà, lan can ba mặt, mái hai tầng */
export function buildBellTower(detail = 1) {
  const P = newSet()
  const S = P.stone
  const B = P.body
  S.add(new BoxGeometry(3.7, 0.1, 3.7), { color: PALETTE.stone, p: [0, 0.03, 0], tile: 1 })
  S.add(new BoxGeometry(3.8, 0.03, 3.8), { color: PALETTE.stoneDark, p: [0, 0.005, 0], tile: 1 })
  for (const x of [-1.4, 1.4]) {
    for (const z of [-1.4, 1.4]) {
      atAll(P, [x, 0, z], () => addPillar(P, { h: 3.4, r: 0.15, couplet: z > 0, detail }))
    }
  }
  // Xà quanh đầu cột + xà treo chuông
  for (const sz of [-1, 1]) {
    B.add(BOX, { color: PALETTE.lacquer, p: [0, 3.68, sz * 1.4], s: [3.1, 0.2, 0.2] })
    B.add(BOX, { color: PALETTE.lacquer, p: [sz * 1.4, 3.68, 0], s: [0.2, 0.2, 3.1] })
    B.add(BOX, { color: GOLD, p: [0, 3.6, sz * 1.5], s: [3.1, 0.03, 0.01] })
  }
  B.add(BOX, { color: PALETTE.woodDark, p: [0, 3.55, 0], s: [3.2, 0.2, 0.25] })
  B.add(BOX, { color: GOLD, p: [0, 3.55, 0.13], s: [3.0, 0.04, 0.01] })
  // Lan can thấp ba mặt (trừ mặt trước)
  const rails = [
    [[-1.4, -1.4], [1.4, -1.4]],
    [[-1.4, -1.4], [-1.4, 1.4]],
    [[1.4, -1.4], [1.4, 1.4]],
  ]
  for (const [[ax, az], [bx, bz]] of rails) {
    const len = Math.hypot(bx - ax, bz - az)
    const rot = Math.atan2(bx - ax, bz - az)
    B.at([ax, 0.06, az], [0, rot, 0], 1, (R) => {
      R.add(BOX, { color: PALETTE.lacquer, p: [0, 0.55, len / 2], s: [0.08, 0.06, len - 0.3] })
      R.add(BOX, { color: PALETTE.lacquer, p: [0, 0.12, len / 2], s: [0.08, 0.06, len - 0.3] })
      const n = detail > 0 ? 12 : 5
      for (let i = 1; i < n; i++) R.add(new CylinderGeometry(0.022, 0.022, 0.42, 5), { color: PALETTE.woodDark, p: [0, 0.34, (i * len) / n] })
    })
  }
  // Mái hai tầng: mái dưới, cổ diêm có cửa sổ tròn, mái trên lưỡng long chầu nhật
  atAll(P, [0, 3.78, 0], () => addRoof(P, { w: 4.3, d: 4.3, h: 1.0, ornament: false, detail }))
  B.add(new BoxGeometry(1.8, 0.55, 1.8), { color: PALETTE.wallYellow, p: [0, 4.65, 0], tile: 1 })
  B.add(new BoxGeometry(1.86, 0.08, 1.86), { color: PALETTE.lacquer, p: [0, 4.9, 0] })
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2
    B.at([Math.sin(a) * 0.905, 4.66, Math.cos(a) * 0.905], [0, a, 0], 1, (W) => {
      W.add(new TorusGeometry(0.16, 0.025, 4, 18), { color: GOLD })
      W.add(new CircleGeometry(0.15, 16), { color: shade(PALETTE.lacquer, 0.7), p: [0, 0, -0.005] })
      W.add(BOX, { color: GOLD, s: [0.3, 0.02, 0.02] })
      W.add(BOX, { color: GOLD, s: [0.02, 0.3, 0.02] })
    })
  }
  atAll(P, [0, 4.88, 0], () => addRoof(P, { w: 2.9, d: 2.9, h: 0.85, ornament: true, detail }))
  return buildAll(P)
}
