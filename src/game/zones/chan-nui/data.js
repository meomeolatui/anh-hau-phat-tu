import { ZONES, toWorld } from '../../world/layout'
import { gateColliders } from '../../props/colliders'
import { MAPLE } from '../../props/foliage'
import { decorColliders } from '../../props/decorKinds'

/**
 * Dữ liệu bố cục khu Chân núi — chợ nhang & công quả (thuần JS — test import được).
 * Quảng trường 76×54 m (cục bộ x −38..38, z −27..27) ở độ cao 0. Cổng ở mép +Z, lối lên bậc đá ở mép −Z (|x| ≤ 3.5).
 */
export const O = ZONES['chan-nui'].origin
export const w = (p) => toWorld(O, p)

// Dãy sạp bên trái lối chính, mặt quầy quay về phía lối đi (+X)
export const STALL_X = -17
export const STALLS_AT = [
  { id: 'sap-nhang', z: 10 },
  { id: 'sap-hoa', z: 3 },
  { id: 'sap-den', z: -4 },
  { id: 'sap-y-phuc', z: -11 }, // cà sa, áo Tây Du Ký, nón lá, mũ mão
]
export const TEA = { x: 8, z: -8, rot: -Math.PI / 2 }
export const PILGRIMS = [
  { id: 'khach-1', name: 'Bà Tư', x: 16, z: -4, rot: -Math.PI / 2, look: { role: 'phat-tu', outfit: 'nau', hair: 'bui', skin: '#d9a27a' } },
  { id: 'khach-2', name: 'Anh Lộc', x: 16, z: -11, rot: -Math.PI / 2, look: { role: 'phat-tu', outfit: 'xam', hair: 'ngan', skin: '#eec09a' } },
  { id: 'khach-3', name: 'Chị Hạnh', x: -9, z: -17, rot: Math.PI / 2, look: { role: 'phat-tu', outfit: 'lam', hair: 'dai', skin: '#f5d3b3' } },
]
export const NOTICE = { x: -6.5, z: 12, rot: 0.6 }
export const BROOM = { x: 9, z: 17, rot: -0.4 }
export const GUIDE_NPC = { x: 4.5, z: 17.5, rot: Math.PI }
export const POND = { x: 20, z: 10, w: 10, d: 6 }
/** Điểm thả hoa đăng (bờ nam hồ sen) */
export const HOA_DANG = { x: 20, z: 6.2, stand: [20, 5.4] }
// Khớp CABLE_STATIONS['chan-nui'] trong world/layout.js
export const CABLE = { x: 30, z: -16, rotY: -Math.PI / 2 }
export const TRASH_BINS = [
  [5, 18.5],
  [-5, -22],
]

// Cây toả bóng trên các sân lá (lá rụng dồn dưới tán các cây này)
export const LEAF_TREES = {
  san: [
    { x: 18.5, z: 18.5, scale: 1, color: MAPLE.do },
    { x: 11, z: 13.5, scale: 0.8, color: MAPLE.vang },
  ],
  cayDa: [
    { x: -24, z: 18, scale: 1.1 },
    { x: -16, z: 21, scale: 0.85, color: MAPLE.cam },
  ],
}
export const BODHI = { x: 24, z: -4 }
export const BAMBOO = [
  { x: 33, z: 20, seed: 4 },
  { x: -33, z: 20, seed: 9 },
  { x: -35, z: -20, seed: 13, height: 7 },
]

/** Sân lá & bãi rác (tâm cục bộ, kích thước) — không bày đồ trong các vùng này */
export const LEAF_FIELDS = [
  { id: 'chan-nui-san', x: 14, z: 16, w: 14, d: 8, count: 45, seed: 11, trees: 'san' },
  { id: 'chan-nui-cay-da', x: -20, z: 18, w: 12, d: 7, count: 35, seed: 23, trees: 'cayDa' },
]
export const TRASH_FIELDS = [
  { id: 'chan-nui-giua', x: 2, z: 6, w: 16, d: 14, count: 10, seed: 31 },
  { id: 'chan-nui-ben-bac', x: 4, z: -16, w: 14, d: 8, count: 8, seed: 47 },
  { id: 'chan-nui-goc', x: -24, z: -14, w: 10, d: 10, count: 6, seed: 59 },
]

export const COLLIDERS = [
  ...gateColliders({ w: 12, x: 0, z: 22 }),
  ...STALLS_AT.map((s) => ({ type: 'box', x: STALL_X, z: s.z, w: 2.4, d: 3.6 })),
  { type: 'box', x: TEA.x, z: TEA.z, w: 1.1, d: 2 }, // bàn trà
  ...PILGRIMS.map((p) => ({ type: 'circle', x: p.x, z: p.z, r: 0.9 })),
  { type: 'box', x: NOTICE.x, z: NOTICE.z, w: 2.1, d: 0.4, rot: NOTICE.rot }, // bảng công quả
  { type: 'box', x: POND.x, z: POND.z, w: POND.w + 0.8, d: POND.d + 0.8 }, // hồ sen
  ...[...LEAF_TREES.san, ...LEAF_TREES.cayDa].map((t) => ({ type: 'circle', x: t.x, z: t.z, r: 0.85 * t.scale })), // gốc cây
  { type: 'circle', x: BODHI.x, z: BODHI.z, r: 0.9 }, // cây bồ đề
  { type: 'box', x: CABLE.x, z: CABLE.z, w: 6.4, d: 7.4 }, // nhà ga cáp treo (xoay 90°)
  ...BAMBOO.map((b) => ({ type: 'circle', x: b.x, z: b.z, r: 1.2 })), // khóm trúc
  ...TRASH_BINS.map(([x, z]) => ({ type: 'box', x, z, w: 1.3, d: 0.6 })), // thùng rác
]

/* ---------------- Đồ có tương tác (cục bộ) — dùng cho test bố cục ---------------- */

const front = (x, z, rot, d) => [x + Math.sin(rot) * d, z + Math.cos(rot) * d]

/** Điểm tương tác và điểm đứng (cục bộ x, z) */
export const INTERACT_POINTS = {
  ...Object.fromEntries(STALLS_AT.map((s) => [s.id, front(STALL_X, s.z, Math.PI / 2, 1.8)])),
  tra: front(TEA.x, TEA.z, TEA.rot, 1.4),
  ...Object.fromEntries(PILGRIMS.map((p) => [p.id, [p.x, p.z]])),
  bangCongQua: front(NOTICE.x, NOTICE.z, NOTICE.rot, 1.4),
  bangCongQuaGoc: [NOTICE.x, NOTICE.z],
  choi: [BROOM.x, BROOM.z],
  chuTieu: [GUIDE_NPC.x, GUIDE_NPC.z],
  hoaDang: [HOA_DANG.x, HOA_DANG.z],
  hoaDangDung: HOA_DANG.stand,
  capTreo: front(CABLE.x, CABLE.z, CABLE.rotY, 4.2),
}

/* ---------------- Đồ trang trí (cục bộ) — props/decor.jsx ---------------- */

/**
 * Chợ & công quả: rào tre quanh mép quảng trường, bonsai hai bên cổng, bảng nội quy, đèn lồng dây trên dãy sạp,
 * giỏ hàng & lu nước sau sạp, lu nước cạnh trạm trà, bàn ghế đá, chậu sen, luống hoa viền gạch hai bên chân bậc,
 * chậu cây quanh ga cáp treo, góc công quả (chồng ngói gạch, bó củi, giỏ tre).
 * Tránh: điểm tương tác ±2.5 m, ghế nghỉ (world/benches.js), bia, sân lá, bãi rác — xem test decor-layout.
 */
export const DECOR = [
  // Rào tre mép quảng trường (chừa lối cổng và lối lên bậc)
  { kind: 'bambooFence', x: -37.4, z: 26.6, x2: -9, z2: 26.6 },
  { kind: 'bambooFence', x: 9, z: 26.6, x2: 37.4, z2: 26.6 },
  { kind: 'bambooFence', x: -37.6, z: 25, x2: -37.6, z2: -2 },
  { kind: 'bambooFence', x: 37.6, z: 25, x2: 37.6, z2: -2 },
  { kind: 'bambooFence', x: -37.4, z: -26.7, x2: -13, z2: -26.7 },
  { kind: 'bambooFence', x: 13, z: -26.7, x2: 37.4, z2: -26.7 },
  // Bonsai trên đôn đá hai bên cổng tam quan (trong và ngoài cổng)
  { kind: 'bonsai', x: -8.2, z: 20.8, stand: 'stone', v: 0 },
  { kind: 'bonsai', x: 8.2, z: 20.8, stand: 'stone', v: 1 },
  { kind: 'bonsai', x: -8.2, z: 23.4, stand: 'stone', v: 2 },
  { kind: 'bonsai', x: 8.2, z: 23.4, stand: 'stone', v: 3 },
  { kind: 'rulesBoard', x: -11.2, z: 24.2, rot: 0 },
  // Chợ nhang: giỏ hàng, lu nước, chậu hoa sau dãy sạp
  { kind: 'basket', x: -20.6, z: 11.4, rot: 0.4 },
  { kind: 'waterJar', x: -20.6, z: 7.4 },
  { kind: 'basket', x: -20.8, z: 0.4, rot: 2.1 },
  { kind: 'potCluster', x: -20.6, z: -5.6, rot: 1 },
  // Đèn lồng dây: dọc dãy sạp, nối về hai trụ cổng
  { kind: 'stringLights', x: -12.4, z: 13, x2: -12.4, z2: 2.5, h: 3.4 },
  { kind: 'stringLights', x: -12.4, z: 2.5, x2: -12.4, z2: -8, h: 3.4, poles: [false, true] },
  { kind: 'stringLights', x: -12.4, z: 13, x2: -6.5, z2: 21.55, h: 3.4, h2: 3.9, poles: [false, false] },
  { kind: 'stringLights', x: 6.5, z: 21.55, x2: 14.5, z2: 22.8, h: 3.9, h2: 3.4, poles: [false, true] },
  { kind: 'stringLights', x: 14.5, z: 22.8, x2: 25, z2: 22.8, h: 3.4, poles: [false, true] },
  // Trạm trà: hai lu nước có gáo
  { kind: 'waterJar', x: 10, z: -9.6 },
  { kind: 'waterJar', x: 10.2, z: -6.4 },
  // Góc nghỉ phía đông & tây: bàn ghế đá, chậu sen, luống hoa
  { kind: 'stoneTable', x: 31, z: 2.5 },
  { kind: 'stoneTable', x: -31, z: -3 },
  { kind: 'lotusBasin', x: 27.8, z: 10 },
  { kind: 'lotusBasin', x: 13, z: 3.8, v: 1 },
  { kind: 'flowerBed', x: 31, z: 15.5, w: 4, d: 1.2 },
  // Chậu cây quanh ga cáp treo
  { kind: 'pottedPlant', x: 27.4, z: -10.6, v: 0 },
  { kind: 'pottedPlant', x: 26.2, z: -21.4, v: 1 },
  { kind: 'pottedPlant', x: 33.6, z: -21.6, v: 3 },
  // Hai bên chân bậc đá: luống hoa viền gạch, bonsai trên đôn
  { kind: 'flowerBed', x: -9.8, z: -25.3, w: 5, d: 1.2 },
  { kind: 'flowerBed', x: 9.8, z: -25.3, w: 5, d: 1.2 },
  { kind: 'bonsai', x: -6.0, z: -23.8, stand: 'stone', v: 1 },
  { kind: 'bonsai', x: 5.8, z: -23.6, stand: 'stone', v: 0 },
  // Góc công quả tây nam: vật liệu sửa chùa, củi, giỏ tre
  { kind: 'tilePile', x: -31.5, z: -25, rot: 0.2 },
  { kind: 'firewood', x: -28, z: -25.2, rot: -0.1 },
  { kind: 'basket', x: -24.6, z: -25.1, rot: 1.3 },
  // Mép tây: chậu cây, lu nước, chậu hoa
  { kind: 'pottedPlant', x: -35.6, z: 9, v: 2 },
  { kind: 'pottedPlant', x: -35.6, z: -7, v: 0 },
  { kind: 'waterJar', x: -35.4, z: 3 },
  { kind: 'potCluster', x: -35.4, z: 14.6 },
]

export const DECOR_COLLIDERS = decorColliders(DECOR)
