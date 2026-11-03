import { MOUNTAIN, WALKABLES } from './layout'

/**
 * Hình học di chuyển: tính độ cao mặt đất, chặn người chơi trong vùng đi được,
 * đẩy ra khỏi vật cản (collider). Thuần JS, không phụ thuộc three — dễ test.
 */

/* ---------------- Mặt đi được ---------------- */

/**
 * Quy ước góc xoay `rot` của rect/box = rotation.y của three.js:
 * cục bộ → thế giới: (lx·cos + lz·sin, −lx·sin + lz·cos). Hàm dưới là phép ngược.
 */
function worldToLocal(dx, dz, r) {
  const c = Math.cos(r)
  const sn = Math.sin(r)
  return [dx * c - dz * sn, dx * sn + dz * c]
}

function localToWorld(lx, lz, r) {
  const c = Math.cos(r)
  const sn = Math.sin(r)
  return [lx * c + lz * sn, -lx * sn + lz * c]
}

/** Toạ độ (x,z) trong hệ cục bộ của rect đã xoay */
function toRectLocal(s, x, z) {
  return worldToLocal(x - s.cx, z - s.cz, s.rot || 0)
}

/**
 * Khoảng cách có dấu từ điểm tới mép mặt đi được (âm = bên trong) và độ cao tại đó.
 * @returns {{ dist: number, y: number }}
 */
export function shapeDistance(s, x, z) {
  if (s.type === 'circle') {
    return { dist: Math.hypot(x - s.cx, z - s.cz) - s.r, y: s.y }
  }
  if (s.type === 'rect') {
    const [lx, lz] = toRectLocal(s, x, z)
    const qx = Math.abs(lx) - s.w / 2
    const qz = Math.abs(lz) - s.d / 2
    const outside = Math.hypot(Math.max(qx, 0), Math.max(qz, 0))
    return { dist: outside + Math.min(Math.max(qx, qz), 0), y: s.y }
  }
  // ramp: đoạn thẳng from→to, bề rộng width
  const [ax, az, ay] = s.from
  const [bx, bz, by] = s.to
  const vx = bx - ax
  const vz = bz - az
  const len2 = vx * vx + vz * vz
  const tRaw = ((x - ax) * vx + (z - az) * vz) / len2
  const t = Math.max(0, Math.min(1, tRaw))
  const px = ax + vx * t
  const pz = az + vz * t
  const len = Math.sqrt(len2)
  const side = Math.hypot(x - px, z - pz) - s.width / 2
  // Ra quá hai đầu dốc tính như ra ngoài theo chiều dọc
  const along = Math.max(0, (tRaw < 0 ? -tRaw : tRaw - 1) * len)
  const dist = along > 0 ? Math.hypot(Math.max(side, 0), along) : side
  return { dist, y: ay + (by - ay) * t }
}

/**
 * Độ cao mặt đất tại (x,z). Nếu nhiều mặt chồng nhau, chọn mặt gần độ cao hiện tại nhất
 * (tránh "nhảy tầng" ở chỗ đường dốc chồng lên sân).
 * @returns {{ y: number, walkable: object } | null}
 */
export function groundAt(x, z, currentY = 0, walkables = WALKABLES) {
  let best = null
  for (const s of walkables) {
    const { dist, y } = shapeDistance(s, x, z)
    if (dist > 0) continue
    if (!best || Math.abs(y - currentY) < Math.abs(best.y - currentY)) best = { y, walkable: s }
  }
  return best
}

/** Mặt đi được gần nhất (kể cả khi đang ở ngoài) — dùng để nắn địa hình. */
export function nearestWalkable(x, z, walkables = WALKABLES) {
  let best = null
  for (const s of walkables) {
    const r = shapeDistance(s, x, z)
    if (!best || r.dist < best.dist) best = { ...r, walkable: s }
  }
  return best
}

/* ---------------- Địa hình núi ---------------- */

/** Nhiễu giá trị nhẹ, xác định (không random) — tạo gồ ghề cho núi */
export function noise2(x, z) {
  return (
    Math.sin(x * 0.045 + z * 0.012) * 1.6 +
    Math.sin(z * 0.06 - x * 0.03) * 1.1 +
    Math.sin(x * 0.13 + z * 0.11) * 0.45 +
    Math.sin(x * 0.31 - z * 0.27) * 0.18
  )
}

/** Độ cao núi nền (chưa nắn theo đường đi) */
export function mountainHeight(x, z) {
  const [cx, cz] = MOUNTAIN.center
  const d = Math.hypot(x - cx, z - cz)
  const base = MOUNTAIN.peak * Math.exp(-((d / MOUNTAIN.spread) ** 2))
  // Càng lên cao càng gồ ghề; vùng đồng bằng chân núi gần như phẳng
  return base + noise2(x, z) * (0.4 + base / 18)
}

const smoothstep = (e0, e1, x) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

/** Độ cao địa hình hiển thị: trùng mặt đi được bên trong, chuyển mượt ra núi nền bên ngoài */
export function terrainHeight(x, z) {
  const m = mountainHeight(x, z)
  const n = nearestWalkable(x, z)
  if (!n) return m
  const surface = n.y - 0.06
  if (n.dist <= 0) return surface
  // Chênh lệch càng lớn thì vùng chuyển càng rộng → mái dốc ~40°
  const blend = Math.max(4, Math.abs(m - surface) * 1.2)
  return surface + (m - surface) * smoothstep(0, blend, n.dist)
}

/* ---------------- Vật cản ---------------- */

/**
 * collider: { type: 'circle', x, z, r, y0?, y1? } | { type: 'box', x, z, w, d, rot?, y0?, y1? }
 * y0..y1: khoảng độ cao có hiệu lực (mặc định mọi độ cao)
 */
export function pushOut(x, z, y, radius, colliders) {
  let px = x
  let pz = z
  for (const c of colliders) {
    if (c.y0 !== undefined && y < c.y0 - 0.5) continue
    if (c.y1 !== undefined && y > c.y1 + 0.5) continue
    if (c.type === 'circle') {
      const dx = px - c.x
      const dz = pz - c.z
      const d = Math.hypot(dx, dz)
      const min = c.r + radius
      if (d < min) {
        const k = d > 1e-6 ? min / d : 1
        px = c.x + (d > 1e-6 ? dx * k : min)
        pz = c.z + (d > 1e-6 ? dz * k : 0)
      }
      continue
    }
    // box xoay: đưa về hệ cục bộ, kẹp điểm gần nhất, đẩy ra
    const r = c.rot || 0
    const [lx, lz] = worldToLocal(px - c.x, pz - c.z, r)
    const hx = c.w / 2
    const hz = c.d / 2
    const cx = Math.max(-hx, Math.min(hx, lx))
    const cz = Math.max(-hz, Math.min(hz, lz))
    const ox = lx - cx
    const oz = lz - cz
    const d = Math.hypot(ox, oz)
    if (d >= radius) continue
    let nlx
    let nlz
    if (d < 1e-6) {
      // Tâm nằm trong hộp: đẩy ra cạnh gần nhất
      const pxEdge = hx - Math.abs(lx)
      const pzEdge = hz - Math.abs(lz)
      if (pxEdge < pzEdge) {
        nlx = Math.sign(lx || 1) * (hx + radius)
        nlz = lz
      } else {
        nlx = lx
        nlz = Math.sign(lz || 1) * (hz + radius)
      }
    } else {
      nlx = cx + (ox / d) * radius
      nlz = cz + (oz / d) * radius
    }
    // về lại hệ thế giới
    const [wx, wz] = localToWorld(nlx, nlz, r)
    px = c.x + wx
    pz = c.z + wz
  }
  return [px, pz]
}

/** Điểm (x,y,z) có nằm trong vật cản (nới thêm `margin`) không — dùng cho va chạm camera */
export function insideCollider(x, y, z, c, margin = 0) {
  if (c.y0 !== undefined && y < c.y0 - 0.5) return false
  if (c.y1 !== undefined && y > c.y1 + 0.5) return false
  if (c.type === 'circle') return Math.hypot(x - c.x, z - c.z) < c.r + margin
  const [lx, lz] = worldToLocal(x - c.x, z - c.z, c.rot || 0)
  return Math.abs(lx) < c.w / 2 + margin && Math.abs(lz) < c.d / 2 + margin
}

/**
 * Đi từ A tới B theo từng bước nhỏ; trả về tỉ lệ (0..1) quãng đường còn thông trước khi chạm vật cản.
 * 1 = không vướng gì. Dùng để kéo camera lại gần khi bị tường/đá che giữa camera và nhân vật.
 */
export function clearFraction(a, b, colliders, { step = 0.35, margin = 0.3, skipNear = 0.6 } = {}) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const dz = b[2] - a[2]
  const len = Math.hypot(dx, dy, dz)
  if (len < 1e-6) return 1
  // Bỏ qua vật cản mà chính nhân vật đang ở trong (ghế đang ngồi, cabin, bàn thờ sát người…)
  const relevant = colliders.filter((c) => !insideCollider(a[0], a[1], a[2], c, margin))
  const n = Math.ceil(len / step)
  for (let i = 1; i <= n; i++) {
    const t = i / n
    // Đoạn sát người (skipNear mét) không xét — tránh camera chui vào đầu nhân vật
    if (t * len < skipNear) continue
    const x = a[0] + dx * t
    const y = a[1] + dy * t
    const z = a[2] + dz * t
    for (const c of relevant) {
      if (insideCollider(x, y, z, c, margin)) return Math.max(0, (i - 1) / n)
    }
  }
  return 1
}

/**
 * Di chuyển nhân vật một bước, có trượt dọc mép và vật cản.
 * @returns {{ x, z, y, walkable }} vị trí mới (giữ nguyên nếu không đi được)
 */
export function stepMove(pos, dx, dz, { radius = 0.35, colliders = [], walkables = WALKABLES } = {}) {
  const tryAt = (nx, nz) => {
    const [cx, cz] = pushOut(nx, nz, pos.y, radius, colliders)
    const g = groundAt(cx, cz, pos.y, walkables)
    // Không cho "leo" chênh lệch lớn đột ngột (an toàn khi các mặt chồng nhau)
    if (!g || Math.abs(g.y - pos.y) > 1.5) return null
    return { x: cx, z: cz, y: g.y, walkable: g.walkable }
  }
  return (
    tryAt(pos.x + dx, pos.z + dz) ??
    tryAt(pos.x + dx, pos.z) ??
    tryAt(pos.x, pos.z + dz) ??
    tryAt(pos.x, pos.z) ?? { x: pos.x, z: pos.z, y: pos.y, walkable: null }
  )
}
