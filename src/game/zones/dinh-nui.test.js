import { describe, expect, it } from 'vitest'
import { groundAt, nearestWalkable, pushOut, stepMove } from '../world/navigation'
import {
  COLLIDERS,
  ENTRY,
  INCENSE_STAND,
  INTERACTION_POINTS,
  O,
  PLAZA_R,
  SEATS,
  STATION_ARRIVE,
  STATION_DOOR,
} from './dinh-nui/data'
import { DECOR_COLLIDERS } from './dinh-nui/decorLayout'
import { benchColliders } from './testing'

const RADIUS = 0.35
const [OX, OY, OZ] = O
// Giống useColliders: dời sang toạ độ thế giới, hiệu lực trong [O.y, O.y + 6] — gồm đồ trang trí và ghế nghỉ
const ALL_LOCAL = [...COLLIDERS, ...DECOR_COLLIDERS]
const WORLD_COLLIDERS = [...ALL_LOCAL.map((c) => ({ y0: OY, y1: OY + 6, ...c, x: c.x + OX, z: c.z + OZ })), ...benchColliders()]

const isFree = (x, z) => {
  const wx = x + OX
  const wz = z + OZ
  const g = groundAt(wx, wz, OY)
  if (!g || Math.abs(g.y - OY) > 0.01) return false
  const [px, pz] = pushOut(wx, wz, OY, RADIUS, WORLD_COLLIDERS)
  return Math.hypot(px - wx, pz - wz) < 1e-6
}

/* Lưới BFS 0.25 m trên quảng trường để tìm lối đi rồi đi thử bằng stepMove */
const CELL = 0.25
const N = Math.ceil((PLAZA_R * 2) / CELL) + 1
const toCell = (v) => Math.round((v + PLAZA_R) / CELL)
const fromCell = (i) => i * CELL - PLAZA_R
const free = new Uint8Array(N * N)
for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) free[j * N + i] = isFree(fromCell(i), fromCell(j)) ? 1 : 0

function findPath([sx, sz], [tx, tz]) {
  const start = toCell(sz) * N + toCell(sx)
  const goal = toCell(tz) * N + toCell(tx)
  const prev = new Int32Array(N * N).fill(-1)
  prev[start] = start
  const queue = [start]
  for (let q = 0; q < queue.length; q++) {
    const k = queue[q]
    if (k === goal) break
    const i = k % N
    const j = (k - i) / N
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        const ni = i + di
        const nj = j + dj
        if ((!di && !dj) || ni < 0 || nj < 0 || ni >= N || nj >= N) continue
        const nk = nj * N + ni
        // Đi chéo chỉ khi hai ô kề cũng trống (không cắt góc vật cản)
        if (prev[nk] !== -1 || !free[nk] || !free[j * N + ni] || !free[nj * N + i]) continue
        prev[nk] = k
        queue.push(nk)
      }
    }
  }
  if (prev[goal] === -1) return null
  const path = []
  for (let k = goal; k !== start; k = prev[k]) path.push([fromCell(k % N), fromCell(Math.floor(k / N))])
  return path.reverse()
}

/** Đi theo lộ trình bằng stepMove (bước ≤ 0.1 m, như Player mỗi frame) — trả vị trí cuối (cục bộ) */
function walk([sx, sz], path) {
  let pos = { x: sx + OX, y: OY, z: sz + OZ }
  for (const [lx, lz] of path) {
    const tx = lx + OX
    const tz = lz + OZ
    for (let n = 0; n < 40 && Math.hypot(tx - pos.x, tz - pos.z) > 0.02; n++) {
      const dx = tx - pos.x
      const dz = tz - pos.z
      const k = Math.min(1, 0.1 / Math.hypot(dx, dz))
      pos = stepMove(pos, dx * k, dz * k, { radius: RADIUS, colliders: WORLD_COLLIDERS })
    }
  }
  return [pos.x - OX, pos.z - OZ, pos.y]
}

/** Khoảng cách có dấu từ điểm tới vật cản (âm = bên trong) */
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

/** Các điểm trên biên vật cản (bước ~0.1 m) */
function boundary(c) {
  const pts = []
  if (c.type === 'circle') {
    const n = Math.max(12, Math.ceil((2 * Math.PI * c.r) / 0.1))
    for (let i = 0; i < n; i++) pts.push([c.x + Math.cos((i / n) * 2 * Math.PI) * c.r, c.z + Math.sin((i / n) * 2 * Math.PI) * c.r])
    return pts
  }
  const r = c.rot || 0
  const toW = (lx, lz) => [c.x + lx * Math.cos(r) + lz * Math.sin(r), c.z - lx * Math.sin(r) + lz * Math.cos(r)]
  const nx = Math.max(2, Math.ceil(c.w / 0.1))
  const nz = Math.max(2, Math.ceil(c.d / 0.1))
  for (let i = 0; i <= nx; i++) {
    const lx = -c.w / 2 + (i * c.w) / nx
    pts.push(toW(lx, -c.d / 2), toW(lx, c.d / 2))
  }
  for (let i = 0; i <= nz; i++) {
    const lz = -c.d / 2 + (i * c.d) / nz
    pts.push(toW(-c.w / 2, lz), toW(c.w / 2, lz))
  }
  return pts
}

describe('Đỉnh núi — bố cục & vật cản', () => {
  it('mọi điểm tương tác nằm trong 2.5 m của mặt đi được, điểm đứng không bị vật cản đẩy', () => {
    for (const p of INTERACTION_POINTS) {
      const n = nearestWalkable(p.x + OX, p.z + OZ)
      expect(n.dist, p.id).toBeLessThanOrEqual(2.5)
      expect(isFree(p.stand[0], p.stand[1]), `${p.id} stand`).toBe(true)
    }
  })

  it('id điểm tương tác là duy nhất', () => {
    const ids = INTERACTION_POINTS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of SEATS) expect(s.id.startsWith('dinh-nui-')).toBe(true)
  })

  it('điểm vào từ đường dốc, cửa ga và điểm xuống ga không bị vật cản đẩy', () => {
    for (const [x, z] of [ENTRY, STATION_DOOR, STATION_ARRIVE]) {
      const [px, pz] = pushOut(x + OX, z + OZ, OY, RADIUS, WORLD_COLLIDERS)
      expect(px).toBeCloseTo(x + OX, 6)
      expect(pz).toBeCloseTo(z + OZ, 6)
    }
  })

  it('giữa hai vật cản rời nhau luôn chừa lối ≥ 2 m', () => {
    // Vật cản của zone + đồ trang trí + ghế nghỉ trên đỉnh (đổi về toạ độ cục bộ)
    const list = [
      ...ALL_LOCAL,
      ...benchColliders()
        .filter((c) => Math.abs(c.y0 - OY) < 1)
        .map((c) => ({ ...c, x: c.x - OX, z: c.z - OZ })),
    ]
    const borders = list.map(boundary)
    const tight = []
    for (let a = 0; a < list.length; a++) {
      for (let b = a + 1; b < list.length; b++) {
        let gap = Infinity
        for (const [x, z] of borders[a]) gap = Math.min(gap, sdf(list[b], x, z))
        // ≤ 0.05: chạm nhau = cùng một khối liền
        if (gap > 0.05 && gap < 2) tight.push(`${a}-${b}: ${gap.toFixed(2)}`)
      }
    }
    expect(tight).toEqual([])
  })

  it('đi được (stepMove) từ điểm vào tới lư hương và mọi điểm tương tác', () => {
    const targets = [{ id: 'lu-huong', stand: INCENSE_STAND }, ...INTERACTION_POINTS]
    for (const t of targets) {
      const path = findPath(ENTRY, t.stand)
      expect(path, `không có lối tới ${t.id}`).not.toBeNull()
      const [x, z, y] = walk(ENTRY, path)
      expect(Math.hypot(x - t.stand[0], z - t.stand[1]), t.id).toBeLessThan(0.3)
      expect(y).toBeCloseTo(OY, 3)
    }
  })
})
