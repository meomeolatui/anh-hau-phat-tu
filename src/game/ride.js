import { HANG, RIDE_SPEED, cabinOnRoute, routeBetween, routeLength } from './cableway'
import { CABLE_STATIONS, ZONES } from './world/layout'
import { emit, runtime } from './runtime'
import { addStat, discoverZone, setHolding, updateUi } from './state'

/**
 * Chuyến cáp treo của người chơi: ngồi trong cabin chạy trên dây từ ga này tới ga kia.
 * Trạng thái nằm ở runtime.player.ride (cập nhật mỗi frame trong Player.jsx qua stepRide).
 */

/** Nhân vật ngồi trên ghế cabin: gốc nhân vật (mặt sàn) thấp hơn tâm cabin bao nhiêu */
export const SEAT_DROP = 1.12
/** Cabin phóng to so với mô hình gốc để vừa người ngồi */
export const CABIN_SCALE = 1.5

/** Bắt đầu chuyến; trả về false nếu không có tuyến */
export function startRide(from, to) {
  const legs = routeBetween(from, to)
  if (!legs) return false
  setHolding(null)
  runtime.player.ride = { from, to, legs, dist: 0, total: routeLength(legs), fast: false, cabin: null, heading: 0 }
  runtime.player.locked = true
  runtime.player.anim = 'seated'
  // Lùi camera ra xa một chút để ngắm cảnh quanh cabin
  runtime.camera.distance = 8
  addStat('capTreo')
  emit('toast', { title: `Lên cabin đi ${CABLE_STATIONS[to].name}`, description: 'Kéo chuột (hoặc vuốt) để xoay camera ngắm núi rừng.' })
  return true
}

/** Đi nhanh tới ga (vẫn thấy cabin chạy, chỉ nhanh hơn) */
export function hurryRide() {
  if (runtime.player.ride) runtime.player.ride.fast = true
}

/**
 * Cập nhật chuyến đi mỗi frame. Trả về true nếu đang đi (Player bỏ qua điều khiển đi bộ).
 */
export function stepRide(dt) {
  const p = runtime.player
  const ride = p.ride
  if (!ride) return false
  ride.dist += (ride.fast ? RIDE_SPEED * 6 : RIDE_SPEED) * dt
  const st = cabinOnRoute(ride.legs, ride.dist)
  ride.cabin = st.cabin
  ride.heading = st.heading
  // Ngồi giữa cabin, quay mặt theo hướng chạy
  p.position.set(st.cabin[0], st.cabin[1] - SEAT_DROP, st.cabin[2])
  p.rotY = st.heading
  p.anim = 'seated'
  p.speed = 0
  if (st.done) finishRide()
  return true
}

function finishRide() {
  const p = runtime.player
  const { to } = p.ride
  const st = CABLE_STATIONS[to]
  p.ride = null
  p.locked = false
  p.anim = 'idle'
  const [ax, ay, az] = st.arrive
  const [sx, , sz] = st.position
  p.position.set(ax, ay, az)
  // Bước ra khỏi ga: quay lưng về nhà ga
  p.rotY = Math.atan2(ax - sx, az - sz)
  runtime.camera.yaw = p.rotY
  runtime.camera.distance = 7.5
  const zone = ZONES[to]
  if (zone) {
    runtime.zoneId = zone.id
    const first = discoverZone(zone.id)
    updateUi({ zone: { id: zone.id, name: zone.name, subtitle: zone.subtitle } })
    emit('zone', { ...zone, first })
  }
  emit('toast', { title: `Đã tới ${st.name}`, description: 'Mời bạn xuống cabin, đi cẩn thận.' })
}

/** Độ treo cabin (để vẽ tay treo nối lên cáp) */
export const CABIN_HANG = HANG
