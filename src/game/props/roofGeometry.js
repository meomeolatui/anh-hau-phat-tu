import { BoxGeometry, CircleGeometry, ConeGeometry, CylinderGeometry, IcosahedronGeometry, SphereGeometry, Vector3 } from 'three'
import { PALETTE } from '../materials'
import { curve, shade, surface, sweep } from './geom'

/**
 * Mái chùa Nam Bộ cách điệu (hàm thuần → hình học, dùng chung cho Roof/Hall/Gate/BellTower):
 *  - bốn mái chái cong võng (lõm dần về phía diềm), bốn góc cong vút lên + loe ra (đầu đao);
 *  - lớp ngói ống chạy dọc mái (nửa ống, gộp chung một geometry) + đầu ngói tròn ở diềm;
 *  - mặt dưới mái (màu gỗ), diềm mái viền vàng;
 *  - bờ nóc, bờ chảy, đầu đao cuốn lá đề, đầu kìm hai đầu nóc;
 *  - ornament: "lưỡng long chầu nhật" cách điệu (hai rồng uốn khúc chầu mặt trời lửa).
 * Gốc toạ độ: tâm đáy mái (mép diềm giữa cạnh ở y = 0), mặt tiền +Z.
 */

const GOLD = PALETTE.gold
const FLAME = '#d9622b'
const DRAGON = '#4f8a6a'

/** Hệ số cỡ chi tiết theo kích thước mái (mái nhỏ → chi tiết nhỏ) */
export function roofScale(w, d, h) {
  return Math.min(1.4, Math.max(0.22, Math.sqrt(w * d) / 8), h / 1.2)
}

/** Bán kính nửa nóc — giữ đúng công thức cũ (nóc dài w − 0.55·d) */
export function ridgeHalf(w, d) {
  return Math.max(0.2, (w - d * 0.55) / 2)
}

/**
 * Hàm mặt mái: trả về điểm trên mái theo (side, u, v).
 * side 0 trước (+Z), 1 phải (+X), 2 sau, 3 trái; u chạy dọc diềm, v từ diềm (0) lên nóc (1).
 */
export function roofSurfaceFn(w, d, h) {
  const hw = w / 2
  const hd = d / 2
  const r = ridgeHalf(w, d)
  const lift = h * 0.22
  const flare = Math.min(hw, hd) * 0.07
  const corners = [
    [-hw, hd],
    [hw, hd],
    [hw, -hd],
    [-hw, -hd],
  ]
  const ridges = [
    [
      [-r, 0],
      [r, 0],
    ],
    [
      [r, 0],
      [r, 0],
    ],
    [
      [r, 0],
      [-r, 0],
    ],
    [
      [-r, 0],
      [-r, 0],
    ],
  ]
  return (side, u, v) => {
    const A = corners[side]
    const B = corners[(side + 1) % 4]
    const [Rs, Re] = ridges[side]
    const f = Math.abs(2 * u - 1) ** 3
    const C = u < 0.5 ? A : B
    // Diềm mái loe ra ở góc theo đường chéo
    const ex = A[0] + (B[0] - A[0]) * u + Math.sign(C[0]) * flare * f
    const ez = A[1] + (B[1] - A[1]) * u + Math.sign(C[1]) * flare * f
    const rx = Rs[0] + (Re[0] - Rs[0]) * u
    const rz = Rs[1] + (Re[1] - Rs[1]) * u
    const x = ex + (rx - ex) * v
    const z = ez + (rz - ez) * v
    // Võng: dốc thoải ở diềm, dốc gắt gần nóc; góc cong vút lên
    const y = lift * f * (1 - v) ** 1.6 + h * v ** 1.3
    return [x, y, z]
  }
}

const _a = new Vector3()
const _b = new Vector3()
const _c = new Vector3()

function normalAt(S, side, u, v) {
  const e = 0.01
  const p = S(side, u, v)
  const pu = S(side, Math.min(1, u + e), v)
  const pu0 = S(side, Math.max(0, u - e), v)
  const pv = S(side, u, Math.min(1, v + e))
  const pv0 = S(side, u, Math.max(0, v - e))
  _a.set(pu[0] - pu0[0], pu[1] - pu0[1], pu[2] - pu0[2])
  _b.set(pv[0] - pv0[0], pv[1] - pv0[1], pv[2] - pv0[2])
  _c.crossVectors(_b, _a).normalize()
  if (_c.y < 0) _c.negate()
  return { p, n: [_c.x, _c.y, _c.z] }
}

/** Đầu đao / đầu kìm: đường xoắn cuộn trong mặt phẳng đứng chứa hướng `dir` */
function curl(origin, dir, R, turns, n = 14, inward = 1) {
  return curve(n, (t) => {
    const th = t * turns
    const rr = R * (1 - 0.45 * t)
    const out = Math.sin(th) * rr
    const upv = (1 - Math.cos(th)) * rr
    return [origin[0] + dir[0] * out * inward, origin[1] + upv, origin[2] + dir[2] * out * inward]
  })
}

/** Vây lá đề (lửa) dọc lưng đường cuộn — chĩa ra phía ngoài độ cong, mỏng theo phương ngang */
export function addFins(P, pts, dir, size, color, every = 3, start = Math.floor(pts.length * 0.4)) {
  const cone = new ConeGeometry(size * 0.5, size * 1.6, 4)
  const yaw = Math.atan2(dir[0], dir[2])
  for (let i = start; i < pts.length - 1; i += every) {
    const p = pts[i]
    const q = pts[i + 1]
    const dh = (q[0] - p[0]) * dir[0] + (q[2] - p[2]) * dir[2]
    const ang = Math.atan2(q[1] - p[1], dh)
    P.add(cone, { color, p, r: [Math.PI - ang, yaw, 0, 'YXZ'], s: [0.35, 1, 1] })
  }
}

/**
 * Thêm mái vào bộ Parts.
 * @param {{ tile: import('./geom').Parts, trim: import('./geom').Parts }} P  tile: mặt ngói (texture 'roof'); trim: viền, nóc, rồng
 */
export function addRoof(P, { w = 8, d = 6, h = 2.2, color = PALETTE.roof, ornament = true, detail = 1 }) {
  const S = roofSurfaceFn(w, d, h)
  const k = roofScale(w, d, h)
  const hw = w / 2
  const hd = d / 2
  const r = ridgeHalf(w, d)
  const lift = h * 0.22
  const thick = 0.05 + 0.06 * k
  const dark = shade(color, 0.78)
  const light = shade(color, 1.12)
  const under = '#6e4a32'
  const big = w * d > 40

  // 1. Mặt ngói (4 mái) + mặt dưới mái
  for (let side = 0; side < 4; side++) {
    const along = side % 2 === 0 ? w : d
    const nu = Math.max(6, Math.min(22, Math.round(along / (big ? 0.9 : 0.6))))
    const nv = big ? 9 : 6
    const slope = Math.hypot(side % 2 === 0 ? hd : hw - r, h)
    const uvScale = [along / 1.6, slope / 1.4]
    P.tile.add(surface(nu, nv, (u, v) => S(side, u, v), { uvScale, flip: true }), { color })
    P.trim.add(
      surface(nu, nv, (u, v) => {
        const p = S(side, u, v)
        return [p[0], p[1] - thick, p[2]]
      }),
      { color: under },
    )
  }

  // 2. Ngói ống: nửa ống chạy dọc dốc mái, vuông góc diềm, dừng ở bờ chảy
  const sp = 0.17 + 0.16 * k
  const rt = sp * 0.27
  const capGeo = new CircleGeometry(rt * 1.2, 7)
  for (let side = 0; side < 4 && detail > 0; side++) {
    const half = side % 2 === 0 ? hw : hd
    const rr = side % 2 === 0 ? r : 0
    const cols = Math.max(2, Math.floor((half * 2) / sp))
    for (let c = 0; c < cols; c++) {
      const x0 = -half + (c + 0.5) * ((half * 2) / cols)
      const vmax = Math.min(0.97, (half - Math.abs(x0)) / Math.max(0.01, half - rr))
      if (vmax < 0.06) continue
      const steps = Math.max(2, Math.round(vmax * (big ? 9 : 6)))
      const pts = []
      const ups = []
      for (let i = 0; i <= steps; i++) {
        const v = (i / steps) * vmax
        const span = half + (rr - half) * v
        // u sao cho toạ độ dọc diềm = x0 (đi thẳng góc với diềm)
        const sgn = side >= 2 ? -1 : 1
        const u = Math.min(1, Math.max(0, ((sgn * x0) / Math.max(0.01, span) + 1) / 2))
        const { p, n } = normalAt(S, side, u, v)
        pts.push([p[0] + n[0] * rt * 0.2, p[1] + n[1] * rt * 0.2, p[2] + n[2] * rt * 0.2])
        ups.push(n)
      }
      P.tile.add(sweep(pts, rt, { radial: 4, up: (i) => ups[i], arc0: -Math.PI / 2, arc: Math.PI }), { color: light, uv: [0.25, steps * 0.4] })
      // Đầu ngói tròn ở diềm, nhìn ra ngoài theo chiều dốc
      const p0 = pts[0]
      const p1 = pts[1]
      const yaw = Math.atan2(p0[0] - p1[0], p0[2] - p1[2])
      const pitch = Math.atan2(p1[1] - p0[1], Math.hypot(p0[0] - p1[0], p0[2] - p1[2]))
      P.trim.add(capGeo, { color: GOLD, p: p0, r: [pitch, yaw, 0, 'YXZ'] })
    }
  }

  // 3. Diềm mái nhiều tầng: dải vàng, dải son, hàng răng cưa (con sơn) nhỏ bên dưới
  const fh = 0.07 + 0.07 * k
  const band = fh * 0.7
  const dent = new BoxGeometry(1, 1, 1)
  for (let side = 0; side < 4; side++) {
    const along = side % 2 === 0 ? w : d
    const nu = Math.max(8, Math.min(24, Math.round(along / 0.6)))
    const out = (u, inset) => {
      const p = S(side, u, 0)
      const q = S(side, u, 0.04)
      const dx = p[0] - q[0]
      const dz = p[2] - q[2]
      const l = Math.hypot(dx, dz) || 1
      return [p, dx / l, dz / l, inset]
    }
    const ribbon = (y0, y1, inset, color) =>
      P.trim.add(
        surface(nu, 1, (u, t) => {
          const [p, ox, oz] = out(u)
          return [p[0] + ox * inset, p[1] - y0 - t * (y1 - y0), p[2] + oz * inset]
        }),
        { color },
      )
    ribbon(0, thick + fh, 0.015, GOLD)
    ribbon(thick + fh, thick + fh + band, -0.02, PALETTE.lacquer)
    if (detail > 0) {
      const n = Math.max(3, Math.round(along / (sp * 1.8)))
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n
        const [p, ox, oz] = out(u)
        P.trim.add(dent, {
          color: i % 2 ? GOLD : shade(GOLD, 0.8),
          p: [p[0] - ox * 0.04, p[1] - thick - fh - band - band * 0.35, p[2] - oz * 0.04],
          r: [0, Math.atan2(ox, oz), 0],
          s: [sp * 0.45, band * 0.7, 0.06],
        })
      }
    }
  }

  // 4. Bờ nóc + dải vàng
  const ridgeH = 0.16 + 0.14 * k
  const ridgeD = 0.16 + 0.14 * k
  const ridgeLen = r * 2 + 0.2 * k
  P.trim.add(new BoxGeometry(ridgeLen, ridgeH, ridgeD), { color: dark, p: [0, h + ridgeH * 0.35, 0] })
  P.trim.add(new BoxGeometry(ridgeLen + 0.02, ridgeH * 0.22, ridgeD + 0.03), { color: GOLD, p: [0, h + ridgeH * 0.45, 0] })
  P.trim.add(new CylinderGeometry(ridgeD * 0.42, ridgeD * 0.42, ridgeLen, 6), { color: dark, p: [0, h + ridgeH * 0.85, 0], r: [0, 0, Math.PI / 2] })

  // 5. Bờ chảy theo bốn đường góc + đầu đao cuốn
  const hipR = 0.05 + 0.06 * k
  for (let corner = 0; corner < 4; corner++) {
    // Đường góc = cạnh u=1 của mái `corner` (trùng u=0 của mái kế tiếp)
    const pts = curve(big ? 12 : 8, (t) => {
      const v = 1 - t
      const p = S(corner, 1, v)
      return [p[0], p[1] + hipR * 0.9, p[2]]
    })
    P.trim.add(sweep(pts, hipR, { radial: 5 }), { color: dark })
    const end = pts[pts.length - 1]
    const dir = [Math.sign(end[0]) * Math.SQRT1_2, 0, Math.sign(end[2]) * Math.SQRT1_2]
    const R = 0.08 + 0.3 * k + lift * 0.2
    const tip = curl(end, dir, R, Math.PI * 1.35, 16)
    P.trim.add(sweep(tip, (t) => hipR * (1 - 0.75 * t), { radial: 5, caps: true }), { color: dark })
    // Viền vàng chạy dọc lưng đầu đao
    P.trim.add(
      sweep(
        tip.slice(2).map((p) => [p[0], p[1] + hipR * 0.6, p[2]]),
        (t) => hipR * 0.35 * (1 - 0.6 * t),
        { radial: 4 },
      ),
      { color: GOLD },
    )
    addFins(P.trim, tip, dir, hipR * 1.6, GOLD, 3)
  }

  // 6. Đầu kìm hai đầu bờ nóc: cuộn lên, vây lửa
  for (const sx of [-1, 1]) {
    const e = [sx * (ridgeLen / 2 - 0.05 * k), h + ridgeH * 0.9, 0]
    const R = 0.06 + 0.2 * k
    const pts = curl(e, [sx, 0, 0], R, Math.PI * 1.5, 14)
    P.trim.add(sweep(pts, (t) => ridgeD * 0.42 * (1 - 0.7 * t), { radial: 6, caps: true }), { color: dark })
    addFins(P.trim, pts, [sx, 0, 0], ridgeD * 0.5, GOLD, 4)
  }

  if (!ornament) {
    // Búp sen nhỏ giữa nóc
    P.trim.add(new SphereGeometry(0.08 + 0.08 * k, 8, 6), { color: GOLD, p: [0, h + ridgeH * 1.3 + 0.05 * k, 0], s: [1, 1.4, 1] })
    return
  }

  // 7. Lưỡng long chầu nhật: mặt trời lửa giữa nóc + hai rồng uốn khúc
  const top = h + ridgeH * 1.25
  const sunR = 0.14 + 0.16 * k
  const sunY = top + sunR * 1.6
  P.trim.add(new ConeGeometry(sunR * 0.7, sunR * 1.2, 8), { color: GOLD, p: [0, top + sunR * 0.45, 0], r: [Math.PI, 0, 0] })
  P.trim.add(new IcosahedronGeometry(sunR, 1), { color: GOLD, p: [0, sunY, 0], s: [1, 1, 0.55] })
  const flame = new ConeGeometry(sunR * 0.28, sunR * 0.75, 4)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    P.trim.add(flame, {
      color: i % 2 ? FLAME : GOLD,
      p: [Math.cos(a) * sunR * 1.25, sunY + Math.sin(a) * sunR * 1.25, 0],
      r: [0, 0, a - Math.PI / 2],
      s: [1, i % 2 ? 0.8 : 1.1, 0.45],
    })
  }
  const len = Math.min(r - 0.1, 1.1 + 1.1 * k)
  if (len < 0.35) return
  const bodyR = 0.05 + 0.07 * k
  for (const sx of [-1, 1]) {
    const x0 = sx * (sunR * 1.9)
    // Thân rồng: từ đầu (gần mặt trời) uốn ba khúc ra phía ngoài, đuôi thon
    const body = curve(22, (t) => {
      const x = x0 + sx * t * len
      const y = top + bodyR * 0.4 + Math.abs(Math.sin(t * Math.PI * 2.5 + 0.4)) * (0.16 + 0.2 * k) * (1 - 0.5 * t) + (1 - t) * 0.12 * k
      const z = Math.sin(t * Math.PI * 3) * 0.05 * k
      return [x, y, z]
    })
    P.trim.add(sweep(body, (t) => bodyR * (1.1 - 0.85 * t) + (t < 0.08 ? bodyR * 0.2 : 0), { radial: 6, caps: true }), { color: DRAGON })
    // Đầu rồng: khối dài, bờm vàng, sừng; ngẩng về phía mặt trời
    const head = body[0]
    P.trim.add(new SphereGeometry(bodyR * 1.6, 8, 6), { color: DRAGON, p: [head[0] - sx * bodyR * 0.6, head[1] + bodyR * 0.6, head[2]], s: [1.5, 0.9, 0.9] })
    P.trim.add(new ConeGeometry(bodyR * 0.7, bodyR * 2.2, 5), { color: GOLD, p: [head[0] - sx * bodyR * 2.2, head[1] + bodyR * 0.5, 0], r: [0, 0, sx * Math.PI / 2] })
    for (const hz of [-1, 1]) {
      P.trim.add(new ConeGeometry(bodyR * 0.25, bodyR * 2.4, 4), {
        color: GOLD,
        p: [head[0] + sx * bodyR * 0.4, head[1] + bodyR * 2, hz * bodyR * 0.5],
        r: [hz * 0.3, 0, -sx * 0.7],
      })
    }
    // Vây lưng ở đỉnh mỗi khúc
    const fin = new ConeGeometry(bodyR * 0.45, bodyR * 1.8, 4)
    for (let i = 3; i < body.length - 2; i += 3) {
      const p = body[i]
      P.trim.add(fin, { color: GOLD, p: [p[0], p[1] + bodyR * 0.9, p[2]], r: [0, 0, -sx * 0.5], s: [1, 1, 0.4] })
    }
  }
}
