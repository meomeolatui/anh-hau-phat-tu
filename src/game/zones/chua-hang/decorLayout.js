import { decorColliders, shiftDecor } from '../../props/decorKinds'
import { across, beside, rampGate } from '../duong-nui/decorLayout'
import { placeAt } from '../duong-nui/helpers'
import { CAVE, HALL, O, SPLIT, hallAt } from './data'

/**
 * Đồ trang trí khu Chùa Hang (props/decor.jsx) — toạ độ CỤC BỘ quanh O (sân tròn r 15).
 * Hiên điện: kệ dép, thùng công đức, lu nước, chuông gió. Sau điện (nép vách đá): hai bảo tháp nhỏ.
 * Sân: dây phướn vắt ngang lối vào, đèn lồng dây từ hiên điện, bàn ghế đá, chậu sen, bonsai hai bên cửa hang,
 * bia nhỏ kể tích "Ông Đá nứt", góc người giữ chùa (bó củi, giỏ tre). Lối từ chùa Bà sang: cổng phụ, đèn, phướn.
 * Test: zones/decor-layout.test.js (khoảng cách tới điểm tương tác, ghế, bia; không chặn lối).
 */

const at = (lx, lz) => {
  const [x, z] = hallAt(lx, lz)
  return { x, z }
}
const [stringPoleX, stringPoleZ] = [-11.2, 1.8]
const eaveL = at(-4.2, 3.2)
const eaveR = at(4.2, 3.2)
const caveL = placeAt(CAVE, -2.3, 1.7)
const caveR = placeAt(CAVE, 2.3, 1.7)
const legend = placeAt(SPLIT, -3.6, -1.6)
/** Hướng mặt luống hoa theo tiếp tuyến mép sân */
const tangentRot = (x, z) => Math.atan2(-x, -z)

const YARD = [
  // Hiên điện
  { kind: 'shoeRack', ...at(-2.2, 3.7), rot: HALL.rot },
  { kind: 'donationBox', ...at(2.4, 3.6), rot: HALL.rot },
  { kind: 'waterJar', ...at(-5.0, 3.0) },
  { kind: 'windChime', ...at(-4.3, 3.35), y: 3.25, v: 1 },
  { kind: 'windChime', ...at(4.3, 3.35), y: 3.25 },
  // Hai bảo tháp nhỏ sau điện, nép vào vách đá
  { kind: 'stupa', ...at(-5.8, -1.5), rot: HALL.rot, tiers: 5 },
  { kind: 'stupa', ...at(5.6, -1.6), rot: HALL.rot, tiers: 4, color: '#d9d2c2' },
  // Dây phướn vắt ngang lối vào, đèn lồng dây từ hai góc hiên điện
  { kind: 'flagLine', x: 12.8, z: -6.4, x2: 12.4, z2: 7.0, h: 4.6 },
  { kind: 'stringLights', x: eaveR.x, y: 0, z: eaveR.z, h: 3.2, x2: 12.8, z2: -6.4, h2: 4.4, poles: [false, false] },
  { kind: 'stringLights', x: eaveL.x, y: 0, z: eaveL.z, h: 3.2, x2: stringPoleX, z2: stringPoleZ, h2: 3.4, poles: [false, true] },
  // Sân: bàn ghế đá, chậu sen, bia nhỏ kể tích Ông Đá nứt, luống hoa mép nam
  { kind: 'stoneTable', x: -1.5, z: 6.5 },
  { kind: 'lotusBasin', x: 6.5, z: 5.2 },
  { kind: 'miniStele', x: legend[0], z: legend[1], rot: SPLIT.rot + Math.PI / 2 },
  { kind: 'flowerBed', x: -8, z: 10.4, w: 3, d: 1, rot: tangentRot(-8, 10.4), colors: ['#f6d33c', '#f39bbb'] },
  { kind: 'potCluster', x: -12.6, z: 2.2 },
  // Bonsai trên đôn đá hai bên cửa hang
  { kind: 'bonsai', x: caveL[0], z: caveL[1], rot: CAVE.rot, stand: 'stone', v: 2 },
  { kind: 'bonsai', x: caveR[0], z: caveR[1], rot: CAVE.rot, stand: 'stone', v: 0 },
  // Góc người giữ chùa
  { kind: 'firewood', x: 8.2, z: -11.4, rot: 0.6 },
  { kind: 'basket', x: 10.9, z: -8.6, rot: 0.3 },
]

/** Lối từ chùa Bà sang (toạ độ thế giới, ngoài mặt đi được) */
const PATH_WORLD = [
  beside('loi-chua-hang', 0.12, 1, { kind: 'miniStele' }, 1.6),
  across('loi-chua-hang', 0.38, 'stringLights', 4),
  across('loi-chua-hang', 0.62, 'flagLine', 4.6),
  rampGate('loi-chua-hang', 0.8),
  beside('loi-chua-hang', 0.9, -1, { kind: 'pottedPlant', v: 1 }, 1.3),
  beside('loi-chua-hang', 0.9, 1, { kind: 'pottedPlant', v: 2, color: '#f39bbb' }, 1.3),
]

/** Mọi món (cục bộ O) — một DecorSet trong <group position={O}> */
export const DECOR = [...YARD, ...shiftDecor(PATH_WORLD, [-O[0], -O[1], -O[2]])]

export const DECOR_COLLIDERS = decorColliders(DECOR)
