import { CABLE_LINES, CABLE_STATIONS } from './world/layout'
import { groundSurface } from './world/terrainGrid'

/**
 * Hệ cáp treo (thuần JS, test được): đường cáp giữa các ga bám địa hình (luôn cao hơn mặt đất
 * và ngọn cây), trụ đỡ ở các điểm uốn, vị trí cabin theo quãng đường, hành trình nhiều chặng.
 */

/** Bánh xe kéo cáp trong nhà ga (toạ độ cục bộ của ga — khớp CableStation.jsx) */
export const WHEEL_LOCAL = [0, 3.9, -1.4]
/** Cabin treo dưới cáp bao nhiêu mét (tâm cabin) */
export const HANG = 2.75
/** Khoảng hở tối thiểu từ mặt đất tới cáp (đủ cho cabin + ngọn cây) */
export const CLEARANCE = 13
/** Hai sợi cáp (lên/xuống) cách tâm tuyến bao nhiêu mét */
export const RAIL_OFFSET = 1.1
export const RIDE_SPEED = 7 // m/s

/**
 * Sợi cáp nào cho chiều nào (side truyền vào pointOnLine). Nhìn từ ga thấp lên ga cao:
 * BÊN PHẢI đi lên, BÊN TRÁI đi xuống. Vector lệch trong pointOnLine = (cos h, −sin h) là phía TRÁI
 * của hướng tuyến h, nên đi lên dùng side = −1.
 */
export const UP_SIDE = -1
export const DOWN_SIDE = 1

/** Điểm bánh xe của ga (toạ độ thế giới) */
export function anchorOf(stationId) {
  const st = CABLE_STATIONS[stationId]
  const r = st.rotY ?? 0
  const [lx, ly, lz] = WHEEL_LOCAL
  return [st.position[0] + lx * Math.cos(r) + lz * Math.sin(r), st.position[1] + ly, st.position[2] - lx * Math.sin(r) + lz * Math.cos(r)]
}

/**
 * Dựng một tuyến: lấy mẫu dọc đường thẳng giữa hai ga, nâng cáp lên đủ cao trên địa hình,
 * làm mượt, rồi đặt trụ ở các đỉnh uốn. Trả về điểm, độ dài tích luỹ, trụ.
 */
export function buildLine(fromId, toId, samples = 48) {
  const a = anchorOf(fromId)
  const b = anchorOf(toId)
  const raw = []
  const need = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const x = a[0] + (b[0] - a[0]) * t
    const z = a[2] + (b[2] - a[2]) * t
    // Cáp võng tự nhiên giữa hai đầu
    const sag = Math.sin(Math.PI * t) * 3
    raw.push(a[1] + (b[1] - a[1]) * t - sag)
    // Gần hai đầu ga thì chỉ cần vừa đủ (cáp chui vào nhà ga)
    const edge = Math.min(t, 1 - t)
    need.push(groundSurface(x, z) + (edge < 0.06 ? 4 : CLEARANCE))
  }
  let ys = raw.map((y, i) => Math.max(y, need[i]))
  // Làm mượt vài lượt nhưng không để thấp hơn mức cần
  for (let pass = 0; pass < 6; pass++) {
    ys = ys.map((y, i) => (i === 0 || i === samples ? y : Math.max(need[i], (ys[i - 1] + y * 2 + ys[i + 1]) / 4)))
  }
  ys[0] = a[1]
  ys[samples] = b[1]

  const points = ys.map((y, i) => {
    const t = i / samples
    return [a[0] + (b[0] - a[0]) * t, y, a[2] + (b[2] - a[2]) * t]
  })
  const cum = [0]
  for (let i = 1; i < points.length; i++) {
    const [x0, y0, z0] = points[i - 1]
    const [x1, y1, z1] = points[i]
    cum.push(cum[i - 1] + Math.hypot(x1 - x0, y1 - y0, z1 - z0))
  }
  // Trụ: tại các điểm cáp bị "đội" lên bởi địa hình (đỉnh cục bộ của phần chênh so với đường võng), cách nhau ≥ 25 m
  const towers = []
  for (let i = 3; i < samples - 3; i++) {
    const lift = ys[i] - raw[i]
    if (lift < 1.5) continue
    if (lift >= ys[i - 1] - raw[i - 1] && lift >= ys[i + 1] - raw[i + 1]) {
      const [x, y, z] = points[i]
      if (towers.some((tw) => Math.hypot(tw.x - x, tw.z - z) < 25)) continue
      towers.push({ x, z, top: y + 0.6, ground: groundSurface(x, z) })
    }
  }
  const heading = Math.atan2(b[0] - a[0], b[2] - a[2])
  return { id: `${fromId}>${toId}`, from: fromId, to: toId, points, cum, length: cum[cum.length - 1], towers, heading }
}

let lineCache = null
export function cableLines() {
  if (!lineCache) lineCache = CABLE_LINES.map(([f, t]) => buildLine(f, t))
  return lineCache
}

/** Điểm trên cáp tại quãng đường s (m) từ đầu tuyến; side = ±1 chọn sợi cáp lên/xuống */
export function pointOnLine(line, s, side = 0) {
  const d = Math.max(0, Math.min(line.length, s))
  let i = 1
  while (i < line.cum.length - 1 && line.cum[i] < d) i++
  const seg = line.cum[i] - line.cum[i - 1] || 1
  const k = (d - line.cum[i - 1]) / seg
  const p0 = line.points[i - 1]
  const p1 = line.points[i]
  const nx = Math.cos(line.heading)
  const nz = -Math.sin(line.heading)
  return [p0[0] + (p1[0] - p0[0]) * k + nx * RAIL_OFFSET * side, p0[1] + (p1[1] - p0[1]) * k, p0[2] + (p1[2] - p0[2]) * k + nz * RAIL_OFFSET * side]
}

/**
 * Hành trình từ ga này tới ga kia: danh sách chặng { line, reverse } (đi qua ga giữa không cần xuống).
 * @returns {Array<{ line, reverse: boolean }>|null}
 */
export function routeBetween(from, to, lines = cableLines()) {
  const order = [CABLE_LINES[0][0], ...CABLE_LINES.map((l) => l[1])]
  const i = order.indexOf(from)
  const j = order.indexOf(to)
  if (i < 0 || j < 0 || i === j) return null
  const legs = []
  if (i < j) for (let k = i; k < j; k++) legs.push({ line: lines[k], reverse: false })
  else for (let k = i - 1; k >= j; k--) legs.push({ line: lines[k], reverse: true })
  return legs
}

/** Tổng chiều dài hành trình (m) */
export const routeLength = (legs) => legs.reduce((s, l) => s + l.line.length, 0)

/**
 * Vị trí cabin của người chơi tại quãng đường `dist` trên hành trình.
 * Đi lên dùng sợi cáp bên phải, đi xuống dùng sợi bên trái (nhìn từ ga thấp lên) — xem UP_SIDE/DOWN_SIDE.
 * @returns {{ cabin: [x,y,z], heading: number, done: boolean }}
 */
export function cabinOnRoute(legs, dist) {
  let rest = Math.max(0, dist)
  for (let n = 0; n < legs.length; n++) {
    const { line, reverse } = legs[n]
    if (rest <= line.length || n === legs.length - 1) {
      const d = Math.min(rest, line.length)
      const s = reverse ? line.length - d : d
      const side = reverse ? DOWN_SIDE : UP_SIDE
      const [x, y, z] = pointOnLine(line, s, side)
      return {
        cabin: [x, y - HANG, z],
        heading: reverse ? line.heading + Math.PI : line.heading,
        done: n === legs.length - 1 && rest >= line.length,
      }
    }
    rest -= line.length
  }
  return null
}
