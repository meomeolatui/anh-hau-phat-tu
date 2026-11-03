/**
 * Ghế đá nghỉ chân (ngồi để hồi thể lực nhanh). Toạ độ THẾ GIỚI trên mặt đất; rotY = hướng người ngồi nhìn ra.
 * Thêm ghế mới: thêm vào danh sách này (World.jsx tự đặt). Ghế phải nằm trên mặt đi được,
 * cách mép ≥ 1.2 m, không chắn lối đi và cách các điểm tương tác khác ≥ 2.5 m (test kiểm tra).
 */
export const BENCHES = [
  // Chân núi: cạnh sạp đèn và góc sân gần khóm trúc
  { id: 'chan-nui-1', position: [-10, 0, -10], rotY: Math.PI / 2 },
  { id: 'chan-nui-2', position: [26, 0, 18], rotY: -Math.PI / 2 },
  // Chùa Bà: góc trước bên trái và mép đông của sân
  { id: 'chua-ba-1', position: [-25, 26, -118], rotY: Math.PI / 2 },
  { id: 'chua-ba-2', position: [26, 26, -146], rotY: -Math.PI / 2 },
  // Chân núi: mép đông (nhìn vào quảng trường) và góc tây nam gần chân bậc
  { id: 'chan-nui-3', position: [34.8, 0, 9], rotY: -Math.PI / 2 },
  { id: 'chan-nui-4', position: [-18, 0, -23.6], rotY: 0 },
  // Chiếu nghỉ 1 (y 16): hai ghế đá bên trái lối bậc, quay mặt vào lối đi
  { id: 'chieu-nghi-1a', position: [-5.8, 16, -83.5], rotY: Math.PI / 2 },
  { id: 'chieu-nghi-1b', position: [-5.6, 16, -72.8], rotY: Math.PI / 2 },
  // Chiếu nghỉ 2 (y 46): cạnh lối lên, nhìn ra vực
  { id: 'chieu-nghi-2', position: [44.6, 46, -195.9], rotY: 0.87 },
  // Chùa Bà: hai ghế gần mép trước sân, nhìn về chánh điện
  { id: 'chua-ba-3', position: [12, 26, -114.5], rotY: Math.PI },
  { id: 'chua-ba-4', position: [-12, 26, -114.5], rotY: Math.PI },
  // Chùa Hang: mép nam sân, nhìn về điện
  { id: 'chua-hang-1', position: [-79, 22, -137.5], rotY: Math.PI },
  // Đỉnh núi: hai ghế nhìn về tượng Phật Bà
  { id: 'dinh-nui-1', position: [10, 56, -214], rotY: Math.PI },
  { id: 'dinh-nui-2', position: [-12, 56, -214], rotY: Math.PI },
]
