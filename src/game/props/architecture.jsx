import { useMemo } from 'react'
import { PALETTE } from '../materials'
import { cached, vcMat } from './geom'
import { buildGate, buildHall, buildPillar, buildRailing, buildRoof } from './buildings'
import { useDetail } from './detail'

/**
 * Kiến trúc chùa Nam Bộ cách điệu low-poly: mái cong đầu đao, ngói ống, cột son câu đối / rồng cuốn,
 * xà, bẩy hiên, cửa võng, cửa sổ tròn hoa sen, lan can con tiện, tay vịn rồng đá.
 * Mọi kích thước tính bằng mét; gốc toạ độ tại tâm đáy công trình, mặt tiền hướng +Z.
 *
 * Hiệu năng: mỗi công trình gộp toàn bộ hình học tĩnh theo vật liệu (xem buildings.js) → tối đa 4 draw call;
 * hình học cache theo tham số + mức chi tiết (dùng chung giữa các instance).
 */

/** Vẽ các nhóm hình học đã gộp với vật liệu tương ứng */
function Merged({ geo }) {
  return (
    <>
      {geo.stone && <mesh geometry={geo.stone} material={vcMat('stone')} castShadow receiveShadow />}
      {geo.body && <mesh geometry={geo.body} material={vcMat('plaster')} castShadow receiveShadow />}
      {geo.tile && <mesh geometry={geo.tile} material={vcMat('roof')} castShadow receiveShadow />}
      {geo.trim && <mesh geometry={geo.trim} material={vcMat()} castShadow />}
    </>
  )
}

/** Mái chùa: mái cong võng, ngói ống, diềm nhiều tầng viền vàng, đầu đao lá đề, đầu kìm; ornament: lưỡng long chầu nhật */
export function Roof({ w = 8, d = 6, h = 2.2, color = PALETTE.roof, ornament = true, position, rotation }) {
  const detail = useDetail()
  const geo = useMemo(
    () => cached(`roof|${w}|${d}|${h}|${color}|${ornament}|${detail}`, () => buildRoof({ w, d, h, color, ornament, detail })),
    [w, d, h, color, ornament, detail],
  )
  return (
    <group position={position} rotation={rotation}>
      <Merged geo={geo} />
    </group>
  )
}

/** Cột son tròn có chân tảng đá, vành sen, đai vàng; câu đối (couplet) hoặc rồng cuốn (dragon) */
export function Pillar({ h = 3.2, r = 0.18, color = PALETTE.pillarRed, couplet = true, dragon = false, position }) {
  const detail = useDetail()
  const geo = useMemo(
    () => cached(`pillar|${h}|${r}|${color}|${couplet}|${dragon}|${detail}`, () => buildPillar({ h, r, color, couplet, dragon, detail })),
    [h, r, color, couplet, dragon, detail],
  )
  return (
    <group position={position}>
      <Merged geo={geo} />
    </group>
  )
}

/**
 * Điện thờ / chánh điện: nền đá nhiều gờ, hàng cột hiên (rồng cuốn hai cột biên, câu đối cột trong),
 * xà, cửa võng, bẩy hiên, rui, tường ba mặt có cửa sổ tròn hoa sen, tay vịn rồng đá, mái 1–2 tầng.
 * Mặt tiền mở (hướng +Z) để người chơi nhìn/đi vào trong. Vật cản: xem hallColliders (footprint không đổi).
 * steps: số bậc thềm trước gian giữa, nằm ngoài nền (mặc định 0 — zone tự dựng bậc nếu cần).
 */
export function Hall({
  w = 12,
  d = 9,
  h = 3.6,
  tiers = 2,
  wall = PALETTE.wallYellow,
  roof = PALETTE.roof,
  open = true,
  steps = 0,
  position,
  rotation,
  children,
}) {
  const detail = useDetail()
  const geo = useMemo(
    () => cached(`hall|${w}|${d}|${h}|${tiers}|${wall}|${roof}|${open}|${steps}|${detail}`, () => buildHall({ w, d, h, tiers, wall, roof, open, steps, detail })),
    [w, d, h, tiers, wall, roof, open, steps, detail],
  )
  return (
    <group position={position} rotation={rotation}>
      <Merged geo={geo} />
      {children}
    </group>
  )
}

/** Cổng tam quan: bốn trụ câu đối, cửa võng ba lối, hai mái bên + gác giữa hai tầng mái (lưỡng long chầu nhật) */
export function Gate({ w = 10, h = 4.2, position, rotation, roof = PALETTE.roof }) {
  const detail = useDetail()
  const geo = useMemo(() => cached(`gate|${w}|${h}|${roof}|${detail}`, () => buildGate({ w, h, roof, detail })), [w, h, roof, detail])
  return (
    <group position={position} rotation={rotation}>
      <Merged geo={geo} />
    </group>
  )
}

/** Lan can đá thấp chạy thẳng từ a tới b (toạ độ cục bộ x,z): trụ mũ búp sen, con tiện, tay vịn hai lớp */
export function Railing({ from, to, y = 0 }) {
  const detail = useDetail()
  const [ax, az] = from
  const [bx, bz] = to
  const len = Math.hypot(bx - ax, bz - az)
  const rot = Math.atan2(bx - ax, bz - az)
  const key = Math.round(len * 100) / 100
  const geo = useMemo(() => cached(`rail|${key}|${detail}`, () => buildRailing(key, detail)), [key, detail])
  return (
    <group position={[ax, y, az]} rotation-y={rot}>
      <Merged geo={geo} />
    </group>
  )
}
