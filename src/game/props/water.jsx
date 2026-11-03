import { PALETTE } from '../materials'
import { waterMaterial } from '../fx/waterMaterial'

/**
 * HỢP ĐỒNG API — mặt nước dùng chung (hồ sen, suối, khe nước).
 *   <WaterSurface w d position rotation color? />  — mặt phẳng nằm ngang kích thước w×d (mét), tâm tại position
 * Vật liệu: shader nước toon (fx/waterMaterial.js) — màu sâu/nông, gợn sóng chuyển động, vệt nắng lấp lánh,
 * phản chiếu màu trời theo giờ, trong suốt nhẹ. Hình học tự dựng (suối, thác) dùng thẳng waterMaterial().
 */
export function WaterSurface({ w = 4, d = 4, position, rotation, color = PALETTE.water }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation-x={-Math.PI / 2} material={waterMaterial(color)}>
        <planeGeometry args={[w, d]} />
      </mesh>
    </group>
  )
}
