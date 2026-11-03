import { CABLE_STATIONS } from '../world/layout'

/**
 * Logic thuần cho Cáp treo: chọn ga, hướng đứng khi xuống ga, đường bay camera trong cảnh chuyển.
 */

export const RIDE_MS = 5200
/** Thời gian mờ dần trước/sau khi dịch chuyển */
export const FADE_MS = 700

/** Danh sách ga (theo thứ tự trong CABLE_STATIONS); ga đang đứng có `current: true` */
export function stationList(from, stations = CABLE_STATIONS) {
  return Object.entries(stations).map(([id, s]) => ({ id, ...s, current: id === from }))
}

/** Chỉ đi được tới ga khác ga đang đứng */
export function canTravel(from, to, stations = CABLE_STATIONS) {
  return Boolean(stations[to]) && to !== from
}

/** Hướng quay khi xuống ga: nhìn từ nhà ga ra phía điểm đứng (bước ra khỏi ga) */
export function arrivalRotY(station) {
  const [px, , pz] = station.position
  const [ax, , az] = station.arrive
  if (px === ax && pz === az) return Math.PI
  return Math.atan2(ax - px, az - pz)
}

/** 'len' nếu ga đến cao hơn, 'xuong' nếu thấp hơn */
export function rideDirection(fromSt, toSt) {
  return toSt.position[1] >= fromSt.position[1] ? 'len' : 'xuong'
}

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

/**
 * Điểm ngắm camera tại tiến độ t (0..1): bay dọc tuyến cáp, vòng cung trên cao, xoay chậm toàn cảnh.
 * @returns {{ target: [number,number,number], distance: number, pitch: number, yaw: number }}
 */
export function rideCamera(fromSt, toSt, t) {
  const k = ease(Math.min(1, Math.max(0, t)))
  const [x0, y0, z0] = fromSt.position
  const [x1, y1, z1] = toSt.position
  const arc = Math.sin(Math.PI * k) * 22
  const heading = Math.atan2(x1 - x0, z1 - z0)
  return {
    target: [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k + 10 + arc, z0 + (z1 - z0) * k],
    distance: 30 + Math.sin(Math.PI * k) * 10,
    pitch: 0.42 + Math.sin(Math.PI * k) * 0.12,
    yaw: heading + 0.9 - k * 1.4,
  }
}
