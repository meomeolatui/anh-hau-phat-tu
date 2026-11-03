import { decorColliders } from '../../props/decorKinds'
import { DIEN_BA, HALL, at } from './data'

/**
 * Đồ trang trí khu Chùa Bà (props/decor.jsx) — toạ độ CỤC BỘ quanh O; sân x −33..33, z −28..28.
 *  - Hiên chánh điện: kệ dép, thùng công đức, chuông gió bốn góc mái.
 *  - Trục chính: dây phướn ngũ sắc giăng giữa các cột (kể cả hai cột cờ Phật giáo sẵn có), bonsai trên đôn đá,
 *    chậu sen hai bên lư hương; hòn non bộ hai bên lối vào; luống hoa viền gạch dọc lan can mép trước.
 *  - Sau chùa (hai góc tựa vách núi): vườn bảo tháp nhỏ. Góc sân: bàn ghế đá; góc đông nam: ngói gạch, củi.
 * Test: zones/decor-layout.test.js + chua-ba.test.js (BFS hành lang 2 m tính cả vật cản của đồ trang trí).
 */

const FLAG_TOP = 6.15 // móc dây ngay dưới chóp cột cờ Phật giáo (cao 6.2, lá cờ tới 5.95)
const POLE_H = 5.2
const eaveY = HALL.h + 0.25
const eaveZ = HALL.z + HALL.d / 2 + 0.6
const dienBa = (lx, lz) => {
  const [x, z] = at(DIEN_BA, lx, lz)
  return { x, z }
}

export const DECOR = [
  // Hiên chánh điện
  { kind: 'shoeRack', x: 6.1, z: -13.6 },
  { kind: 'shoeRack', x: -6.1, z: -13.6 },
  { kind: 'donationBox', x: 6.0, z: -15.7 },
  { kind: 'donationBox', x: -6.0, z: -15.7 },
  { kind: 'windChime', x: HALL.w / 2 + 0.6, y: eaveY, z: eaveZ },
  { kind: 'windChime', x: -(HALL.w / 2 + 0.6), y: eaveY, z: eaveZ, v: 1 },
  { kind: 'windChime', x: 5.6, y: eaveY, z: eaveZ, v: 1 },
  { kind: 'windChime', x: -5.6, y: eaveY, z: eaveZ },
  // Dây phướn ngũ sắc giăng trên trục chính
  { kind: 'flagLine', x: -5.6, z: 24.5, x2: 5.6, z2: 24.5, h: FLAG_TOP, poles: [false, false] },
  { kind: 'flagLine', x: -5.6, z: 15.5, x2: 5.6, z2: 15.5, h: POLE_H },
  { kind: 'flagLine', x: 5.6, z: 24.5, x2: 5.6, z2: 15.5, h: FLAG_TOP, h2: POLE_H, poles: [false, false] },
  { kind: 'flagLine', x: -5.6, z: 24.5, x2: -5.6, z2: 15.5, h: FLAG_TOP, h2: POLE_H, poles: [false, false] },
  { kind: 'flagLine', x: 5.6, z: 15.5, x2: 5.6, z2: 6.5, h: POLE_H, poles: [false, true] },
  { kind: 'flagLine', x: -5.6, z: 15.5, x2: -5.6, z2: 6.5, h: POLE_H, poles: [false, true] },
  // Bonsai trên đôn đá hai bên lối chính, chậu sen hai bên lư hương
  { kind: 'bonsai', x: 4.6, z: 20.8, stand: 'stone', v: 0 },
  { kind: 'bonsai', x: -4.6, z: 20.8, stand: 'stone', v: 1 },
  { kind: 'bonsai', x: 4.4, z: 12.6, stand: 'wood', v: 2 },
  { kind: 'bonsai', x: -4.4, z: 12.6, stand: 'wood', v: 3 },
  { kind: 'lotusBasin', x: 6.8, z: 2.2 },
  { kind: 'lotusBasin', x: -6.8, z: 2.2 },
  { kind: 'lotusBasin', x: -10.8, z: -9.6, v: 1 },
  { kind: 'lotusBasin', x: 12.5, z: -4, v: 1 },
  // Hòn non bộ hai bên lối vào, bảng nội quy & bia nhỏ đầu sân
  { kind: 'rockery', x: -8.8, z: 20.6, rot: 0.4 },
  { kind: 'rockery', x: 8.8, z: 20.6, rot: -2.2 },
  { kind: 'rulesBoard', x: -8.6, z: 26.2, rot: Math.PI },
  { kind: 'miniStele', x: 8.6, z: 26.2, rot: Math.PI },
  // Luống hoa viền gạch dọc lan can mép trước
  { kind: 'flowerBed', x: 18.5, z: 26.6, w: 6, d: 1.2, colors: ['#f6d33c', '#f08a4b'] },
  { kind: 'flowerBed', x: -18.5, z: 26.6, w: 6, d: 1.2, colors: ['#f39bbb', '#f7f3e6'] },
  { kind: 'flowerBed', x: 26, z: 26.6, w: 4, d: 1.2 },
  { kind: 'flowerBed', x: -26, z: 26.6, w: 4, d: 1.2 },
  // Bàn ghế đá hai góc sân
  { kind: 'stoneTable', x: -24.5, z: 0.5 },
  { kind: 'stoneTable', x: 25, z: 8 },
  // Vườn bảo tháp sau chùa (góc trái tựa vách núi, góc phải sau Điện Bà)
  { kind: 'stupa', x: -19, z: -26.2, tiers: 4 },
  { kind: 'stupa', x: -22.2, z: -25.9, tiers: 5, s: 1.1 },
  { kind: 'stupa', x: -25.4, z: -26.2, tiers: 4, color: '#d9d2c2' },
  { kind: 'stupa', x: 29.4, z: -25.8, tiers: 5 },
  { kind: 'stupa', x: 26.6, z: -26.4, tiers: 3, s: 0.85, color: '#d9d2c2' },
  // Điện Bà: thùng công đức và bonsai hai bên miệng hang
  { kind: 'donationBox', ...dienBa(-3.3, 3.6), rot: DIEN_BA.rot },
  { kind: 'bonsai', ...dienBa(3.3, 3.6), rot: DIEN_BA.rot, stand: 'wood', v: 1 },
  // Gác chuông: chậu cây hai bên
  { kind: 'pottedPlant', x: -18.6, z: -18.4, v: 3 },
  { kind: 'pottedPlant', x: -12, z: -20.6, v: 2, color: '#f39bbb' },
  // Ga cáp treo: chậu cây
  { kind: 'pottedPlant', x: 22.3, z: 20.9, v: 0 },
  { kind: 'pottedPlant', x: 22.3, z: 10.6, v: 1 },
  // Góc công quả sửa chùa
  { kind: 'tilePile', x: 26, z: -14.5, rot: 0.3 },
  { kind: 'firewood', x: 28.5, z: -17.2, rot: -0.5 },
]

export const DECOR_COLLIDERS = decorColliders(DECOR)
