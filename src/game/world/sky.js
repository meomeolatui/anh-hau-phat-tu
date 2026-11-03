import { Color } from 'three'

/**
 * Bầu trời theo giờ trong ngày (0..24). Thuần JS để test được.
 * Các mốc màu được nội suy tuyến tính theo giờ.
 */

const KEYS = [
  // giờ, đỉnh trời, chân trời, sương mù, cường độ nắng, màu nắng, cường độ ánh sáng trời, màu đất (ánh sáng hắt từ dưới lên)
  { h: 0, top: '#0a1430', horizon: '#1c2a4e', fog: '#1a2747', sun: 0.0, sunColor: '#8ea6ff', amb: 0.36, ground: '#1b2428' },
  { h: 4.5, top: '#131f48', horizon: '#38406e', fog: '#333a62', sun: 0.0, sunColor: '#8ea6ff', amb: 0.38, ground: '#222830' },
  { h: 5.6, top: '#4f5e9e', horizon: '#ff9c6a', fog: '#d9a08a', sun: 0.4, sunColor: '#ff9a5c', amb: 0.55, ground: '#5a4636' },
  { h: 7, top: '#78b0e6', horizon: '#ffd9a8', fog: '#e8dbc4', sun: 0.95, sunColor: '#ffcf8f', amb: 0.8, ground: '#6b6040' },
  { h: 12, top: '#4f9fe6', horizon: '#cfe8f5', fog: '#d0e4ec', sun: 1.25, sunColor: '#fff3dc', amb: 0.95, ground: '#5f6a3e' },
  { h: 16.5, top: '#5ea2df', horizon: '#f8d9ad', fog: '#e8d6bc', sun: 1.1, sunColor: '#ffd59a', amb: 0.9, ground: '#6b6040' },
  { h: 18, top: '#46579a', horizon: '#ff8b55', fog: '#d99176', sun: 0.5, sunColor: '#ff8240', amb: 0.62, ground: '#5a3c2e' },
  { h: 19.2, top: '#1d2858', horizon: '#6a4b78', fog: '#4a4365', sun: 0.0, sunColor: '#8ea6ff', amb: 0.42, ground: '#2a2633' },
  { h: 24, top: '#0a1430', horizon: '#1c2a4e', fog: '#1a2747', sun: 0.0, sunColor: '#8ea6ff', amb: 0.36, ground: '#1b2428' },
]

const ca = new Color()
const cb = new Color()

function lerpColor(a, b, t) {
  return ca.set(a).lerp(cb.set(b), t).getHexString()
}

export function skyAt(hour) {
  const h = ((hour % 24) + 24) % 24
  let i = 0
  while (i < KEYS.length - 2 && KEYS[i + 1].h <= h) i++
  const a = KEYS[i]
  const b = KEYS[i + 1]
  const t = (h - a.h) / (b.h - a.h)
  return {
    top: `#${lerpColor(a.top, b.top, t)}`,
    horizon: `#${lerpColor(a.horizon, b.horizon, t)}`,
    fog: `#${lerpColor(a.fog, b.fog, t)}`,
    sun: a.sun + (b.sun - a.sun) * t,
    sunColor: `#${lerpColor(a.sunColor, b.sunColor, t)}`,
    amb: a.amb + (b.amb - a.amb) * t,
    ground: `#${lerpColor(a.ground, b.ground, t)}`,
    /** 0 = ban ngày, 1 = đêm hẳn — dùng để bật đèn lồng, sao */
    night: h < 5 || h > 19.5 ? 1 : h < 6.2 ? (6.2 - h) / 1.2 : h > 18 ? (h - 18) / 1.5 : 0,
    /** 0..1 — sương sớm: dày nhất lúc rạng đông, tan dần trước 10 giờ; chiều tối có sương mỏng */
    mist: h >= 4.5 && h < 10 ? Math.min(1, (h - 4.5) / 1, (10 - h) / 3) : h >= 17.5 && h < 22 ? 0.35 * Math.min(1, (h - 17.5) / 1.5) : h >= 22 || h < 4.5 ? 0.3 : 0.12,
  }
}

/** Hướng mặt trời (vector đơn vị) theo giờ: mọc hướng đông (+X), lặn hướng tây (-X) */
export function sunDirection(hour) {
  const t = ((hour - 6) / 12) * Math.PI // 6h → 0, 12h → π/2, 18h → π
  const elev = Math.sin(t)
  return [Math.cos(t), Math.max(elev, -0.2) * 0.95 + 0.05, 0.35]
}

/** Hướng mặt trăng: mọc đông lúc 18h, lên cao nhất lúc nửa đêm, lặn tây lúc 6h; luôn ở trên chân trời (≥ ~14°) */
export function moonDirection(hour) {
  const h = ((hour % 24) + 24) % 24
  const t = (((h - 18 + 24) % 24) / 12) * Math.PI
  const v = [Math.cos(t) * 0.8, Math.max(Math.sin(t), 0.25), -0.45]
  const l = Math.hypot(...v)
  return [v[0] / l, v[1] / l, v[2] / l]
}

/**
 * Hướng hiển thị đĩa mặt trời trên trời (vector đơn vị): giữ phương vị thật nhưng hạ độ cao xuống tối đa ~20°
 * để người chơi thấy được mặt trời trong khung hình góc nhìn thứ ba (nắng đổ bóng vẫn theo hướng thật).
 */
export function sunDisplayDirection(hour) {
  const [x, y, z] = sunDirection(hour)
  const l = Math.hypot(x, y, z)
  const rx = x / l
  const ry = y / l
  const rz = z / l
  let hx = rx
  let hz = rz
  const hl = Math.hypot(hx, hz)
  if (hl < 1e-6) {
    hx = 0
    hz = 1
  } else {
    hx /= hl
    hz /= hl
  }
  const elev = Math.asin(Math.max(-1, Math.min(1, ry)))
  const shown = elev <= 0 ? elev : 0.04 + elev * 0.32
  const c = Math.cos(shown)
  return [hx * c, Math.sin(shown), hz * c]
}

/**
 * Hướng chiếu sáng chính (vector đơn vị, từ mặt đất hướng về nguồn sáng): pha giữa nắng và trăng theo cường độ,
 * để ban đêm ánh trăng chiếu từ trên xuống (không bao giờ hắt từ dưới chân trời lên).
 */
export function lightDirection(hour, sky = skyAt(hour)) {
  const sr = sunDirection(hour)
  const sl = Math.hypot(...sr)
  const s = [sr[0] / sl, sr[1] / sl, sr[2] / sl]
  const m = moonDirection(hour)
  const ws = sky.sun * 2.2
  const wm = sky.night * 0.5
  const k = ws + wm > 1e-6 ? ws / (ws + wm) : 0
  const v = [s[0] * k + m[0] * (1 - k), Math.max(0.12, s[1] * k + m[1] * (1 - k)), s[2] * k + m[2] * (1 - k)]
  const l = Math.hypot(...v)
  return [v[0] / l, v[1] / l, v[2] / l]
}

/** Giờ hiển thị theo cài đặt timeMode */
export function hourFor(timeMode, date = new Date()) {
  if (timeMode === 'day') return 10
  if (timeMode === 'dusk') return 17.8
  if (timeMode === 'night') return 21
  return date.getHours() + date.getMinutes() / 60
}
