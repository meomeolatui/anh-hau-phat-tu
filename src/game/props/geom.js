import { BufferAttribute, BufferGeometry, Color, Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PALETTE, toon } from '../materials'

/**
 * Tiện ích dựng hình học tĩnh cho kiến trúc, tượng, nhân vật:
 *  - `Parts`: gom nhiều mảnh (geometry + vị trí/quay/tỉ lệ + màu đỉnh) rồi gộp MỘT lần → 1 draw call / vật liệu.
 *  - `sweep`: ống quét theo đường cong, bán kính thay đổi (đầu đao, rồng, nếp áo, viền cánh sen…).
 *  - `surface`, `revolve`: mặt lưới tham số / mặt tròn xoay có điều biến (mái cong, áo, chuông, cánh sen).
 *  - `vcMat(map)`: vật liệu toon màu trắng dùng màu đỉnh (vertexColors), có thể kèm texture canvas.
 *  - `cached(key, fn)`: cache cấp module — hình học dùng chung giữa các instance cùng tham số.
 * Mọi hàm ở đây thuần (không cần WebGL) → kiểm thử được trong jsdom.
 */

const _pos = new Vector3()
const _scl = new Vector3()
const _q = new Quaternion()
const _e = new Euler()
const _c = new Color()

/** Ma trận biến đổi từ vị trí, góc Euler (XYZ) và tỉ lệ (số hoặc [x,y,z]) */
export function xf(p = [0, 0, 0], r = [0, 0, 0], s = 1) {
  _pos.set(p[0], p[1], p[2])
  _e.set(r[0], r[1], r[2], r[3] ?? 'XYZ')
  _q.setFromEuler(_e)
  if (typeof s === 'number') _scl.set(s, s, s)
  else _scl.set(s[0], s[1], s[2])
  return new Matrix4().compose(_pos, _q, _scl)
}

/** Pha màu: trộn a với b theo t (0..1), trả về chuỗi hex */
export function mix(a, b, t) {
  const ca = new Color(PALETTE[a] ?? a)
  ca.lerp(new Color(PALETTE[b] ?? b), t)
  return `#${ca.getHexString()}`
}

/** Làm tối/sáng màu theo hệ số k (k < 1 tối hơn) */
export function shade(color, k) {
  const c = new Color(PALETTE[color] ?? color)
  c.multiplyScalar(k)
  c.r = Math.min(1, c.r)
  c.g = Math.min(1, c.g)
  c.b = Math.min(1, c.b)
  return `#${c.getHexString()}`
}

/** Chuẩn hoá về indexed + đủ position/normal/uv (để mergeGeometries chấp nhận) */
function normalize(geo) {
  const g = geo.clone()
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name)
  }
  g.morphAttributes = {}
  g.clearGroups()
  if (!g.index) {
    const n = g.attributes.position.count
    const idx = new (n > 65535 ? Uint32Array : Uint16Array)(n)
    for (let i = 0; i < n; i++) idx[i] = i
    g.setIndex(new BufferAttribute(idx, 1))
  }
  if (!g.attributes.normal) g.computeVertexNormals()
  if (!g.attributes.uv) g.setAttribute('uv', new BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2))
  return g
}

/** UV theo mét cho hộp: mỗi mặt nhân theo kích thước thật / tile (texture không bị kéo giãn) */
function tileBoxUV(g, params, tile) {
  const { width: w, height: h, depth: d } = params
  const faces = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ]
  const uv = g.attributes.uv
  const per = uv.count / 6
  for (let f = 0; f < 6; f++) {
    const [su, sv] = faces[f]
    for (let i = f * per; i < (f + 1) * per; i++) uv.setXY(i, (uv.getX(i) * su) / tile, (uv.getY(i) * sv) / tile)
  }
}

export class Parts {
  constructor() {
    this.list = []
    this.stack = [new Matrix4()]
  }

  get matrix() {
    return this.stack[this.stack.length - 1]
  }

  /** Dựng nhóm con với biến đổi cục bộ (giống <group position rotation scale>) */
  at(p, r, s, fn) {
    this.stack.push(this.matrix.clone().multiply(xf(p, r, s)))
    fn(this)
    this.stack.pop()
    return this
  }

  /**
   * Thêm một mảnh.
   * @param {BufferGeometry} geo  hình học gốc (được sao chép, có thể dùng lại làm mẫu)
   * @param {{ color?: string, p?: number[], r?: number[], s?: number|number[], uv?: [number, number], tile?: number }} o
   *   tile: kích thước 1 ô texture (m) cho Box/Cylinder; uv: hệ số nhân uv thủ công
   */
  add(geo, o = {}) {
    const g = normalize(geo)
    const uv = g.attributes.uv
    if (o.tile && geo.type === 'BoxGeometry') tileBoxUV(g, geo.parameters, o.tile)
    else if (o.tile && geo.type === 'CylinderGeometry') {
      const { radiusTop, radiusBottom, height } = geo.parameters
      const su = (Math.PI * (radiusTop + radiusBottom)) / o.tile
      const sv = height / o.tile
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv)
    } else if (o.uv) {
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * o.uv[0], uv.getY(i) * o.uv[1])
    }
    const m = this.matrix.clone()
    if (o.p || o.r || o.s !== undefined) m.multiply(xf(o.p, o.r, o.s ?? 1))
    g.applyMatrix4(m)
    // Ma trận lật (tỉ lệ âm) → đảo chiều tam giác để mặt vẫn hướng ra ngoài
    if (m.determinant() < 0) {
      const idx = g.index.array
      for (let i = 0; i < idx.length; i += 3) {
        const t = idx[i + 1]
        idx[i + 1] = idx[i + 2]
        idx[i + 2] = t
      }
    }
    _c.set(PALETTE[o.color] ?? o.color ?? '#ffffff')
    const n = g.attributes.position.count
    const col = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      col[i * 3] = _c.r
      col[i * 3 + 1] = _c.g
      col[i * 3 + 2] = _c.b
    }
    g.setAttribute('color', new BufferAttribute(col, 3))
    this.list.push(g)
    return this
  }

  get count() {
    return this.list.length
  }

  /** Gộp tất cả mảnh thành một BufferGeometry (null nếu rỗng) */
  build() {
    if (!this.list.length) return null
    const g = mergeGeometries(this.list, false)
    this.list.forEach((x) => x.dispose())
    this.list = []
    g.computeBoundingSphere()
    g.computeBoundingBox()
    return g
  }
}

/** Chạy fn với mọi bộ Parts trong P cùng được biến đổi thêm (vị trí p, góc r, tỉ lệ s) */
export function atAll(P, p, fn, r = [0, 0, 0], s = 1) {
  const keys = Object.keys(P)
  const m = xf(p, r, s)
  keys.forEach((k) => P[k].stack.push(P[k].matrix.clone().multiply(m)))
  fn()
  keys.forEach((k) => P[k].stack.pop())
}

/** Gộp nhiều bộ Parts theo tên → { tên: geometry | null } */
export function buildAll(parts) {
  const out = {}
  for (const k of Object.keys(parts)) out[k] = parts[k].build()
  return out
}

/**
 * Mặt lưới tham số: fn(u, v) → [x, y, z], u,v ∈ [0,1]. flip: đảo mặt.
 * UV mặc định = (u, v) nhân uvScale.
 */
export function surface(nu, nv, fn, { flip = false, uvScale = [1, 1] } = {}) {
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3)
  const uv = new Float32Array((nu + 1) * (nv + 1) * 2)
  let k = 0
  for (let j = 0; j <= nv; j++) {
    for (let i = 0; i <= nu; i++) {
      const p = fn(i / nu, j / nv)
      pos[k * 3] = p[0]
      pos[k * 3 + 1] = p[1]
      pos[k * 3 + 2] = p[2]
      uv[k * 2] = (i / nu) * uvScale[0]
      uv[k * 2 + 1] = (j / nv) * uvScale[1]
      k++
    }
  }
  const idx = []
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i
      const b = a + 1
      const c = a + nu + 1
      const d = c + 1
      if (flip) idx.push(a, b, c, b, d, c)
      else idx.push(a, c, b, b, c, d)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3))
  g.setAttribute('uv', new BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/**
 * Mặt tròn xoay quanh trục Y từ biên dạng [[r, y], ...] (từ dưới lên).
 * mod(angle, t) → hệ số nhân bán kính (tạo nếp gấp, cánh hoa…); sz: dẹt theo Z; phi0/phiLen: cung quay.
 */
export function revolve(profile, segs, { mod, sz = 1, phi0 = 0, phiLen = Math.PI * 2, flip = false } = {}) {
  const n = profile.length - 1
  return surface(
    segs,
    n,
    (u, v) => {
      const i = Math.round(v * n)
      const [r, y] = profile[i]
      const a = phi0 + u * phiLen
      const k = mod ? mod(a, v) : 1
      return [Math.sin(a) * r * k, y, Math.cos(a) * r * k * sz]
    },
    { flip: !flip },
  )
}

const _t = new Vector3()
const _n = new Vector3()
const _b = new Vector3()
const _up = new Vector3()

/**
 * Ống quét theo dãy điểm (mảng [x,y,z]) với bán kính `radius` (số hoặc hàm t∈[0,1] → r).
 *  radial: số cạnh mặt cắt; sx/sy: dẹt mặt cắt theo pháp tuyến/phụ pháp tuyến;
 *  up: vector [x,y,z] hoặc hàm (i) → [x,y,z] định hướng mặt cắt (mặc định chuyển song song);
 *  arc0/arc: cung mặt cắt (vd. nửa ống ngói: arc0=-π/2, arc=π); caps: bịt hai đầu.
 */
export function sweep(points, radius, { radial = 6, sx = 1, sy = 1, up, arc0 = 0, arc = Math.PI * 2, caps = false } = {}) {
  const n = points.length
  const ring = radial + 1
  const pos = []
  const nor = []
  const uv = []
  const P = points.map((p) => new Vector3(p[0], p[1], p[2]))
  let prevN = null
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)]
    const b = P[Math.min(n - 1, i + 1)]
    _t.subVectors(b, a).normalize()
    if (up) {
      const u = typeof up === 'function' ? up(i) : up
      _up.set(u[0], u[1], u[2])
      _n.copy(_up).addScaledVector(_t, -_up.dot(_t))
      if (_n.lengthSq() < 1e-8) _n.set(1, 0, 0).addScaledVector(_t, -_t.x)
      _n.normalize()
    } else if (!prevN) {
      _up.set(0, 1, 0)
      if (Math.abs(_t.y) > 0.9) _up.set(1, 0, 0)
      _n.copy(_up).addScaledVector(_t, -_up.dot(_t)).normalize()
    } else {
      _n.copy(prevN).addScaledVector(_t, -prevN.dot(_t))
      if (_n.lengthSq() < 1e-8) _n.copy(prevN)
      _n.normalize()
    }
    prevN = _n.clone()
    _b.crossVectors(_t, _n).normalize()
    const r = typeof radius === 'function' ? radius(i / (n - 1)) : radius
    for (let j = 0; j <= radial; j++) {
      const ang = arc0 + (j / radial) * arc
      const c = Math.cos(ang)
      const s = Math.sin(ang)
      const ox = _n.x * c * r * sx + _b.x * s * r * sy
      const oy = _n.y * c * r * sx + _b.y * s * r * sy
      const oz = _n.z * c * r * sx + _b.z * s * r * sy
      pos.push(P[i].x + ox, P[i].y + oy, P[i].z + oz)
      // Pháp tuyến elip: (c/sx, s/sy)
      const nx = _n.x * c * sy + _b.x * s * sx
      const ny = _n.y * c * sy + _b.y * s * sx
      const nz = _n.z * c * sy + _b.z * s * sx
      const l = Math.hypot(nx, ny, nz) || 1
      nor.push(nx / l, ny / l, nz / l)
      uv.push(j / radial, i / (n - 1))
    }
  }
  const idx = []
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * ring + j
      const b = a + ring
      idx.push(a, a + 1, b, b, a + 1, b + 1)
    }
  }
  if (caps) {
    for (const [end, dir] of [
      [0, -1],
      [n - 1, 1],
    ]) {
      const c = pos.length / 3
      const pa = P[end]
      const pb = P[end === 0 ? 1 : n - 2]
      _t.subVectors(pa, pb).normalize()
      pos.push(pa.x, pa.y, pa.z)
      nor.push(_t.x, _t.y, _t.z)
      uv.push(0.5, 0.5)
      for (let j = 0; j < radial; j++) {
        const a = end * ring + j
        if (dir < 0) idx.push(c, a + 1, a)
        else idx.push(c, a, a + 1)
      }
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setAttribute('normal', new BufferAttribute(new Float32Array(nor), 3))
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2))
  g.setIndex(idx)
  return g
}

/** Lấy mẫu đường cong tham số f(t) → [x,y,z], t ∈ [0,1], n đoạn */
export function curve(n, f) {
  return Array.from({ length: n + 1 }, (_, i) => f(i / n))
}

const geoCache = new Map()

/** Cache cấp module theo khoá chuỗi (hình học tĩnh dùng chung giữa các instance) */
export function cached(key, fn) {
  if (!geoCache.has(key)) geoCache.set(key, fn())
  return geoCache.get(key)
}

/** Vật liệu toon dùng màu đỉnh; map: texture canvas ('roof' | 'stone' | 'plaster' | 'wood' | 'granite' | 'cloth') */
export function vcMat(map, extra = {}) {
  return toon('#ffffff', map ? { vertexColors: true, map, ...extra } : { vertexColors: true, ...extra })
}
