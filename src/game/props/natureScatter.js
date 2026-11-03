import { WALKABLES } from '../world/layout'
import { nearestWalkable, terrainHeight } from '../world/navigation'
import { TERRAIN_GRID, groundSurface } from '../world/terrainGrid'
import { seeded } from '../../lib/random'
import { hash2 } from './treeSpecies'

/**
 * Rải thiên nhiên toàn thế giới — THUẦN JS (test được), World.jsx gọi một lần trong useMemo.
 *  - scatterForest(): rừng phủ sườn núi + đá tảng (giữ chuỗi ngẫu nhiên cũ; độ cao đặt theo mặt lưới groundSurface)
 *  - scatterFlora(quality): cỏ bụi, hoa dại, bụi mai dọc mép lối đi / quanh sân / sườn gần đường
 */

/**
 * Rừng phủ sườn núi: rải cây ngẫu nhiên xác định, tránh lối đi và sân chùa.
 * farKeep: tỉ lệ giữ lại cây cách lối đi > 20 m — vùng đó FarForest đã phủ đều, bớt cho đỡ dày và nhẹ máy.
 */
export function scatterForest({ farKeep = 0.45 } = {}) {
  const rand = seeded(2026)
  const trees = []
  const rocks = []
  let placed = 0
  for (let i = 0; i < 2600 && placed < 950; i++) {
    const x = -170 + rand() * 320
    const z = -330 + rand() * 420
    const n = nearestWalkable(x, z)
    if (n.dist < 3.5) continue
    const y = terrainHeight(x, z)
    // Đỉnh núi trơ đá, ít cây; chân núi là đồng ruộng thưa cây
    if (y > 50 && rand() < 0.75) continue
    if (y < 1.5 && rand() < 0.7) continue
    const kind = y > 35 ? (rand() < 0.6 ? 'thong' : 'tron') : rand() < 0.35 ? 'cao' : rand() < 0.5 ? 'thong' : 'tron'
    const tree = { x, y: groundSurface(x, z) - 0.2, z, s: 0.8 + rand() * 0.7, rot: rand() * Math.PI * 2, kind }
    // Lọc sau khi đã rút đủ số ngẫu nhiên và vẫn tính vào hạn mức → vị trí các cây còn lại không đổi
    placed++
    if (n.dist > 20 && hash2(x, z, 91) >= farKeep) continue
    trees.push(tree)
  }
  for (let i = 0; i < 1400 && rocks.length < 260; i++) {
    const x = -150 + rand() * 280
    const z = -310 + rand() * 360
    const n = nearestWalkable(x, z)
    // Đá tảng granite: nhiều ven đường bậc và trên cao
    if (n.dist < 1.2) continue
    const y = terrainHeight(x, z)
    if (y < 4 && n.dist > 8) continue
    if (n.dist > 18 && rand() < 0.6) continue
    rocks.push({ x, y: groundSurface(x, z), z, s: 0.8 + rand() * (y > 40 ? 4 : 2.6), rot: rand() * Math.PI * 2 })
  }
  return { trees, rocks }
}

/** Mật độ theo cài đặt chất lượng: 'low' không cỏ/hoa (chỉ ít bụi), 'auto' vừa, 'high' dày */
export const FLORA_DENSITY = {
  low: { grass: 0, flowers: 0, shrubs: 24 },
  auto: { grass: 2600, flowers: 900, shrubs: 70 },
  high: { grass: 5600, flowers: 1900, shrubs: 120 },
}

/** Màu hoa dại: vàng, trắng, hồng, tím, cam đỏ */
export const FLOWER_COLORS = ['#f6d33c', '#f7f3e6', '#f39bbb', '#a87ad8', '#f08a4b']

// Khoảng cách tối thiểu tới mặt đi được (mặt lát/sân/bậc nhô ~0,2–0,3 m ra ngoài mép)
const MIN_DIST = 0.45
const G = TERRAIN_GRID

function perimeter(s) {
  if (s.type === 'circle') return 2 * Math.PI * s.r
  if (s.type === 'rect') return 2 * (s.w + s.d)
  return 2 * Math.hypot(s.to[0] - s.from[0], s.to[1] - s.from[1])
}

/** Một điểm cách mép mặt đi được `s` một đoạn `off` (m) về phía ngoài */
function pointNear(s, rand, off) {
  if (s.type === 'circle') {
    const a = rand() * Math.PI * 2
    return [s.cx + Math.cos(a) * (s.r + off), s.cz + Math.sin(a) * (s.r + off)]
  }
  if (s.type === 'rect') {
    const per = 2 * (s.w + s.d)
    let u = rand() * per
    let lx
    let lz
    if (u < s.w) [lx, lz] = [u - s.w / 2, -s.d / 2 - off]
    else if ((u -= s.w) < s.d) [lx, lz] = [s.w / 2 + off, u - s.d / 2]
    else if ((u -= s.d) < s.w) [lx, lz] = [u - s.w / 2, s.d / 2 + off]
    else [lx, lz] = [-s.w / 2 - off, u - s.w - s.d / 2]
    const r = s.rot || 0
    const c = Math.cos(r)
    const sn = Math.sin(r)
    return [s.cx + lx * c + lz * sn, s.cz - lx * sn + lz * c]
  }
  const [ax, az] = s.from
  const [bx, bz] = s.to
  const len = Math.hypot(bx - ax, bz - az)
  const t = rand()
  const side = rand() < 0.5 ? -1 : 1
  const d = s.width / 2 + off
  return [ax + (bx - ax) * t + (-(bz - az) / len) * d * side, az + (bz - az) * t + ((bx - ax) / len) * d * side]
}

/**
 * Cỏ bụi, hoa dại và bụi cây nhỏ dọc mép lối đi, quanh sân, trên sườn gần đường.
 * Không bao giờ nằm trên mặt đi được (khoảng cách tới mặt gần nhất > 0,45 m); Y bám mặt lưới địa hình.
 * @returns {{ grass: Item[], flowers: (Item & { color: string })[], shrubs: { x, y, z, s, rot, kind: 'bui' }[] }}
 *   Item = { x, y, z, s, rot }
 */
export function scatterFlora(quality = 'auto', seed = 77) {
  const dens = FLORA_DENSITY[quality] ?? FLORA_DENSITY.auto
  const rand = seeded(seed)
  const shapes = WALKABLES
  const weights = shapes.map(perimeter)
  const total = weights.reduce((a, b) => a + b, 0)
  const pickShape = () => {
    let u = rand() * total
    for (let i = 0; i < shapes.length; i++) if ((u -= weights[i]) < 0) return shapes[i]
    return shapes[shapes.length - 1]
  }
  const inGrid = (x, z) => x > G.x0 + 1 && x < G.x1 - 1 && z > G.z0 + 1 && z < G.z1 - 1

  /** Thử tối đa `tries` lần để có `n` điểm cách mép từ minOff tới maxOff (thiên về gần mép) */
  const sample = (n, minOff, maxOff, tries = n * 3) => {
    const out = []
    for (let i = 0; i < tries && out.length < n; i++) {
      const s = pickShape()
      const off = minOff + (maxOff - minOff) * rand() ** 1.8
      const [x, z] = pointNear(s, rand, off)
      if (!inGrid(x, z)) continue
      if (nearestWalkable(x, z).dist <= MIN_DIST) continue
      out.push({ x, y: groundSurface(x, z), z, s: 0.7 + rand() * 0.6, rot: rand() * Math.PI * 2 })
    }
    return out
  }

  const grass = sample(dens.grass, 0.5, 7)
  const flowers = sample(dens.flowers, 0.55, 5.5).map((f) => {
    // Hoa mọc theo khóm: cùng ô 5 m phần lớn cùng một màu
    const cell = hash2(Math.floor(f.x / 5) * 5, Math.floor(f.z / 5) * 5, 41)
    const own = hash2(f.x, f.z, 43)
    const idx = own < 0.72 ? Math.floor(cell * FLOWER_COLORS.length) : Math.floor(own * FLOWER_COLORS.length)
    return { ...f, color: FLOWER_COLORS[Math.min(idx, FLOWER_COLORS.length - 1)] }
  })
  // Mỗi bông hoa có một khóm cỏ nhỏ dưới chân (che cuống hoa)
  if (dens.grass) grass.push(...flowers.filter((_, i) => i % 2 === 0).map((f) => ({ ...f, s: f.s * 0.8, rot: f.rot + 1 })))
  const shrubs = sample(dens.shrubs, 1.6, 6).map((b) => ({ ...b, y: b.y - 0.05, s: 0.8 + (b.s - 0.7) * 0.9, kind: 'bui' }))
  return { grass, flowers, shrubs }
}
