/**
 * Bố cục thế giới — phỏng theo núi Bà Đen (Tây Ninh), KHÔNG theo tỉ lệ thật.
 * Đơn vị: mét. Trục Y hướng lên. Đỉnh núi nằm về phía -Z.
 *
 * Người chơi chỉ đi được trên các "mặt bằng" (WALKABLES): sân phẳng (rect/circle) và đường bậc (ramp).
 * Địa hình núi (Terrain.jsx) được nắn theo các mặt bằng này.
 *
 * Mỗi khu vực (ZONES) có `origin` — các component trong zone đặt đồ vật theo toạ độ cục bộ quanh origin.
 */

export const ZONES = {
  'chan-nui': {
    id: 'chan-nui',
    name: 'Chân núi Bà Đen',
    subtitle: 'Chợ nhang · Công quả',
    origin: [0, 0, 0],
  },
  'duong-bac-da': {
    id: 'duong-bac-da',
    name: 'Đường bậc đá lên núi',
    subtitle: 'Men sườn núi qua rừng',
    origin: [0, 16, -78],
  },
  'chua-ba': {
    id: 'chua-ba',
    name: 'Chùa Bà',
    subtitle: 'Linh Sơn Tiên Thạch Tự · Điện Bà',
    origin: [0, 26, -140],
  },
  'chua-hang': {
    id: 'chua-hang',
    name: 'Chùa Hang',
    subtitle: 'Linh Sơn Long Châu Tự',
    origin: [-76, 22, -150],
  },
  'dinh-nui': {
    id: 'dinh-nui',
    name: 'Đỉnh núi Bà Đen',
    subtitle: 'Tượng Phật Bà Tây Bổ Đà Sơn',
    origin: [0, 56, -238],
  },
}

/**
 * Mặt đi được.
 *  rect:   { cx, cz, w, d, y, rot? }      — sân phẳng (rot quanh Y, radian)
 *  circle: { cx, cz, r, y }
 *  ramp:   { from: [x,z,y], to: [x,z,y], width } — đường bậc, độ cao nội suy tuyến tính
 * zone: khu vực khi đứng trên mặt này (đường nối thuộc khu vực của nó)
 */
export const WALKABLES = [
  // Chân núi: quảng trường, cổng, chùa Trung, ga cáp treo
  { id: 'san-chan-nui', zone: 'chan-nui', type: 'rect', cx: 0, cz: 0, w: 76, d: 54, y: 0 },
  // Bậc đá đoạn 1 → chiếu nghỉ → bậc đá đoạn 2
  { id: 'bac-1', zone: 'duong-bac-da', type: 'ramp', from: [0, -26, 0], to: [0, -70, 16], width: 7 },
  { id: 'chieu-nghi', zone: 'duong-bac-da', type: 'circle', cx: 0, cz: -78, r: 9.5, y: 16 },
  { id: 'bac-2', zone: 'duong-bac-da', type: 'ramp', from: [0, -86, 16], to: [0, -113, 26], width: 7 },
  // Chùa Bà: sân lớn lưng chừng núi
  { id: 'san-chua-ba', zone: 'chua-ba', type: 'rect', cx: 0, cz: -140, w: 66, d: 56, y: 26 },
  // Lối rẽ sang Chùa Hang (đi xuống nhẹ)
  { id: 'loi-chua-hang', zone: 'chua-hang', type: 'ramp', from: [-32, -146, 26], to: [-62, -150, 22], width: 5 },
  { id: 'san-chua-hang', zone: 'chua-hang', type: 'circle', cx: -76, cz: -150, r: 15, y: 22 },
  // Đường lên đỉnh: hai đoạn dốc (~30°) có chiếu nghỉ; đoạn 2 dừng đúng mép sân đỉnh (không chui dưới mặt sân)
  { id: 'doc-1', zone: 'duong-bac-da', type: 'ramp', from: [22, -167, 26], to: [42, -196, 46], width: 6 },
  { id: 'chieu-nghi-2', zone: 'duong-bac-da', type: 'circle', cx: 44, cz: -201, r: 7, y: 46 },
  { id: 'doc-2', zone: 'duong-bac-da', type: 'ramp', from: [39, -206, 46], to: [26.4, -216.6, 56], width: 6 },
  // Đỉnh núi
  { id: 'dinh', zone: 'dinh-nui', type: 'circle', cx: 0, cz: -238, r: 34, y: 56 },
]

/** Điểm xuất hiện lần đầu: ngay ngoài cổng tam quan chân núi, nhìn về phía núi */
export const SPAWN = { position: [0, 0, 25.5], rotY: Math.PI }

/** Ga cáp treo (dịch chuyển nhanh) — vị trí đứng sau khi xuống ga */
export const CABLE_STATIONS = {
  // position/rotY: đúng chỗ nhà ga được đặt trong zone (rotY = hướng cửa ga); arrive: điểm đứng khi xuống ga
  'chan-nui': { name: 'Ga chân núi', position: [30, 0, -16], rotY: -Math.PI / 2, arrive: [24, 0, -10] },
  'chua-ba': { name: 'Ga Chùa Bà', position: [26, 26, -124], rotY: -Math.PI / 2, arrive: [22, 26, -126] },
  'dinh-nui': { name: 'Ga đỉnh núi', position: [24, 56, -226], rotY: Math.atan2(-24, -12), arrive: [20, 56, -228] },
}

/** Các tuyến cáp (nối liên tiếp): chân núi ↔ chùa Bà ↔ đỉnh núi */
export const CABLE_LINES = [
  ['chan-nui', 'chua-ba'],
  ['chua-ba', 'dinh-nui'],
]

/** Hình dáng núi nền (ngoài mặt đi được): đỉnh nằm dưới sân đỉnh một chút */
export const MOUNTAIN = { center: [0, -238], peak: 54, spread: 100 }

/** Đổi toạ độ cục bộ (quanh origin của zone) sang toạ độ thế giới */
export function toWorld(origin, [x, y, z]) {
  return [origin[0] + x, origin[1] + y, origin[2] + z]
}
