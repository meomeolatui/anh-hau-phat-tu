/**
 * Đường SVG cho phần sáng của mặt trăng theo ngày âm lịch.
 * Ngày âm bám theo chu kỳ trăng (~29,53 ngày): mùng 1 trăng non, rằm trăng tròn.
 * Trả về chuỗi rỗng khi gần như không thấy trăng.
 */
const SYNODIC = 29.530588853

export function moonPhaseFraction(lunarDay) {
  return ((((lunarDay - 1) / SYNODIC) % 1) + 1) % 1
}

export function moonLitPath(lunarDay, cx = 50, cy = 50, r = 40) {
  const p = moonPhaseFraction(lunarDay)
  if (p < 0.02 || p > 0.98) return ''
  const rx = Math.abs(r * Math.cos(2 * Math.PI * p)).toFixed(2)
  const top = `${cx} ${cy - r}`
  const bottom = `${cx} ${cy + r}`
  const waxing = p < 0.5
  // Nửa đầu chu kỳ: sáng bên phải; nửa sau: sáng bên trái. Cung thứ hai là đường ranh sáng–tối.
  const outer = waxing ? 1 : 0
  const inner = waxing ? (p < 0.25 ? 0 : 1) : p > 0.75 ? 1 : 0
  return `M ${top} A ${r} ${r} 0 0 ${outer} ${bottom} A ${rx} ${r} 0 0 ${inner} ${top} Z`
}
