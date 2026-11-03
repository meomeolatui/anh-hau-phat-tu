/**
 * Thông số "mặt bằng" của đồ trang trí trong decor.jsx — THUẦN JS (data.js của zone và test import được).
 *
 * Một món đồ: { kind, x, y?, z, rot?, s?, slope?, ...tham số riêng }
 *  - x, y, z: chân đồ vật (y mặc định 0 = mặt sân); rot theo quy ước rotation.y; s: tỉ lệ.
 *  - slope: true khi đặt NGOÀI mặt đi được (trên sườn, y theo groundSurface) → không cần vật cản.
 *  - lean: true khi món cố ý tựa sát vào vật cản sẵn có (lan can, bệ tượng…) — test bỏ qua kiểm tra chồng lấn.
 * Món dạng tuyến (rào, dây phướn, đèn dây) có thêm điểm cuối x2, y2, z2.
 */

/** Bán kính chiếm chỗ (m, trước khi nhân s) của món dạng tròn */
const ROUND = {
  bonsai: 0.45,
  pottedPlant: 0.42,
  potCluster: 0.55,
  lotusBasin: 0.82,
  waterJar: 0.45,
  stoneTable: 1.2,
  rockery: 1.45,
  donationBox: 0.42,
  basket: 0.78,
  stupa: 1.05,
  miniStele: 0.5,
}

/** Kích thước [rộng theo x, sâu theo z] (trước khi nhân s) của món dạng hộp */
const BOXES = {
  shoeRack: [1.45, 0.45],
  rulesBoard: [1.5, 0.4],
  tilePile: [1.4, 1.0],
  firewood: [1.3, 0.8],
  bench: [null, 0.6], // rộng = len
  flowerBed: [null, null], // = w, d
}

/** Món dạng tuyến: bề dày vật cản */
const LINES = { bambooFence: 0.22, stoneWall: 0.45 }

/** Món treo (dây phướn, đèn dây): chỉ cột hai đầu chiếm chỗ */
const HUNG = new Set(['flagLine', 'stringLights'])

export const POLE_R = 0.2

/** Mọi loại đồ trang trí có trong thư viện */
export const DECOR_KINDS = [
  ...Object.keys(ROUND),
  ...Object.keys(BOXES),
  ...Object.keys(LINES),
  ...HUNG,
  'sideGate',
  'windChime',
]

const boxSize = (it) => {
  const s = it.s ?? 1
  if (it.kind === 'bench') return [it.len ?? 1.8, BOXES.bench[1]]
  if (it.kind === 'flowerBed') return [it.w ?? 3, it.d ?? 1.2]
  return BOXES[it.kind].map((v) => v * s)
}

/**
 * Hình chiếm chỗ trên mặt XZ của một món (cùng hệ toạ độ với món đó):
 * mảng các { type:'circle', x, z, r } | { type:'box', x, z, w, d, rot } — rỗng nếu món chỉ treo trên cao.
 */
export function decorFootprint(it) {
  const s = it.s ?? 1
  if (ROUND[it.kind] !== undefined) return [{ type: 'circle', x: it.x, z: it.z, r: ROUND[it.kind] * s }]
  if (BOXES[it.kind]) {
    const [w, d] = boxSize(it)
    return [{ type: 'box', x: it.x, z: it.z, w, d, rot: it.rot ?? 0 }]
  }
  if (LINES[it.kind] !== undefined) {
    const len = Math.hypot(it.x2 - it.x, it.z2 - it.z)
    return [
      {
        type: 'box',
        x: (it.x + it.x2) / 2,
        z: (it.z + it.z2) / 2,
        w: LINES[it.kind],
        d: len + LINES[it.kind],
        rot: Math.atan2(it.x2 - it.x, it.z2 - it.z),
      },
    ]
  }
  if (HUNG.has(it.kind)) {
    const [p0, p1] = it.poles ?? [true, true]
    const out = []
    if (p0) out.push({ type: 'circle', x: it.x, z: it.z, r: POLE_R })
    if (p1) out.push({ type: 'circle', x: it.x2, z: it.z2, r: POLE_R })
    return out
  }
  if (it.kind === 'sideGate') {
    const half = (it.w ?? 3) / 2 + 0.2
    const c = Math.cos(it.rot ?? 0)
    const sn = Math.sin(it.rot ?? 0)
    return [-1, 1].map((k) => ({ type: 'circle', x: it.x + k * half * c, z: it.z - k * half * sn, r: 0.3 }))
  }
  return [] // windChime: treo dưới mái
}

/** Bán kính phủ ngoài cùng của một hình chiếm chỗ (dùng cho kiểm tra khoảng cách) */
export function footprintReach(f) {
  return f.type === 'circle' ? f.r : Math.hypot(f.w, f.d) / 2
}

/**
 * Vật cản cho các món đặt TRÊN mặt đi được (bỏ qua món `slope`) — cùng hệ toạ độ với items,
 * truyền thẳng vào useColliders(key, list, origin).
 */
export function decorColliders(items) {
  return items.filter((it) => !it.slope).flatMap(decorFootprint)
}

/** Dời danh sách món sang hệ toạ độ khác (cộng gốc [ox, oy, oz]) — cả hai đầu của món dạng tuyến */
export function shiftDecor(items, [ox, oy, oz]) {
  return items.map((it) => {
    const out = { ...it, x: it.x + ox, y: (it.y ?? 0) + oy, z: it.z + oz }
    if (it.x2 !== undefined) Object.assign(out, { x2: it.x2 + ox, y2: (it.y2 ?? it.y ?? 0) + oy, z2: it.z2 + oz })
    return out
  })
}
