import { DoubleSide } from 'three'
import { Roof } from '../../props/architecture'
import { Boulders } from '../../props/nature'
import { Lantern } from '../../props/sacred'
import { PALETTE, glow, toon } from '../../materials'
import { CAVE, DIEN_BA } from './data'
import { Candles, Offerings } from './decor'

/**
 * ĐIỆN BÀ — thờ Linh Sơn Thánh Mẫu trong hang đá, mái đá tự nhiên, tựa vách núi bên phải chánh điện.
 *
 * LƯU Ý TÍN NGƯỠNG: đây là tín ngưỡng THỜ MẪU, khác với Phật điện (thờ Phật, Bồ Tát) ở chánh điện.
 * Không tạo tượng chi tiết của Bà: chỉ dựng khám thờ có màn the vàng/đỏ buông trước, bàn thờ, nến, đèn —
 * ánh sáng ấm sau màn gợi sự linh thiêng một cách trang nghiêm.
 *
 * Toạ độ trong file này là hệ cục bộ của hang (mặt hang hướng +Z, gốc tại tâm nền hang);
 * component được đặt trong <group position={O}> của zone. Lư hương (IncenseSpot) đặt ở ChuaBa.jsx (toạ độ thế giới).
 */

const { halfIn, halfOut, back, mouth } = CAVE

// Vách đá hai bên: đá granite xếp ba tầng
const WALL_ROCKS = [-1, 1].flatMap((side) =>
  [back + 0.6, -0.9, 0.8, mouth - 0.3].flatMap((z, zi) =>
    [0, 1, 2].map((level) => ({
      x: side * ((halfIn + halfOut) / 2 + ((zi + level) % 2) * 0.15),
      y: level * 1.15 - 0.2,
      z,
      s: (2.4 - level * 0.2) * (zi === 3 ? 0.85 : 1),
      rot: zi * 1.3 + level * 0.7 + side,
    })),
  ),
)
// Vách sau và mái đá tự nhiên phủ lên trên (đáy mái cao ≥ 3.3 m)
const BACK_ROCKS = [-2, 0, 2].flatMap((x, i) => [
  { x, y: -0.2, z: back - 0.8, s: 2.6, rot: i * 2.1 },
  { x: x * 0.9, y: 1.2, z: back - 0.9, s: 2.4, rot: i * 1.4 + 0.5 },
])
const ROOF_ROCKS = [
  { x: -2.3, y: 4.3, z: -1.2, s: 5, rot: 0.5 },
  { x: 2.4, y: 4.4, z: -0.9, s: 5.2, rot: 0.9 },
  { x: 0, y: 4.9, z: back + 0.2, s: 6, rot: 0.3 },
  { x: 0.3, y: 4.2, z: 1.3, s: 4.2, rot: 0.7 },
  { x: -3.9, y: 3.4, z: 1.6, s: 3, rot: 0.2 },
  { x: 4, y: 3.5, z: 1.4, s: 3.1, rot: 0.8 },
]
const ROCKS = [...WALL_ROCKS, ...BACK_ROCKS, ...ROOF_ROCKS]

const RED = '#b3261e'
const YELLOW = '#e9b93a'

export default function DienBa({ night }) {
  const lacquer = toon(PALETTE.lacquer)
  const gold = toon(PALETTE.gold)
  const stone = toon(PALETTE.granite)
  const caveDark = toon('#3d3a35')
  const red = toon(RED)
  const yellow = toon(YELLOW)
  const depth = mouth - back
  const midZ = (mouth + back) / 2

  return (
    <group position={[DIEN_BA.x, 0, DIEN_BA.z]} rotation-y={DIEN_BA.rot}>
      <Boulders items={ROCKS} />

      {/* Lòng hang: nền đá, vách và trần tối che khe giữa các tảng đá */}
      <mesh position={[0, 0.05, midZ]} material={toon(PALETTE.stoneDark)} receiveShadow>
        <boxGeometry args={[halfIn * 2 + 0.4, 0.1, depth]} />
      </mesh>
      <mesh position={[0, 0.03, mouth + 0.45]} material={toon(PALETTE.stone)} receiveShadow>
        <boxGeometry args={[halfIn * 2 + 0.2, 0.06, 0.9]} />
      </mesh>
      <mesh position={[0, 1.85, back - 0.05]} material={caveDark}>
        <boxGeometry args={[halfIn * 2 + 0.6, 3.7, 0.3]} />
      </mesh>
      <mesh position={[0, 3.6, midZ]} material={caveDark}>
        <boxGeometry args={[halfIn * 2 + 0.8, 0.3, depth]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (halfIn + 0.05), 1.8, midZ]} material={toon(PALETTE.graniteDark)}>
          <boxGeometry args={[0.3, 3.6, depth]} />
        </mesh>
      ))}

      {/* Bàn thờ Bà */}
      <group position={[0, 0.1, -2.3]}>
        <mesh position={[0, 0.475, 0]} material={lacquer} castShadow>
          <boxGeometry args={[3, 0.95, 1.2]} />
        </mesh>
        <mesh position={[0, 0.98, 0]} material={gold}>
          <boxGeometry args={[3.1, 0.06, 1.25]} />
        </mesh>
        <mesh position={[0, 0.5, 0.61]} material={gold}>
          <boxGeometry args={[2.2, 0.45, 0.02]} />
        </mesh>
        <Candles y={1.01} spread={1.15} z={0.3} />
        <Offerings y={1.01} spread={0.6} z={0.35} />
      </group>

      {/* Khám thờ: ánh sáng ấm sau màn the — không tạc tượng Bà */}
      <group position={[0, 1.1, back + 0.45]}>
        <mesh position={[0, 0.85, 0]} material={lacquer} castShadow>
          <boxGeometry args={[2, 1.7, 0.7]} />
        </mesh>
        <mesh position={[0, 0.85, 0.36]} material={glow('#ffd77a', 0.55)}>
          <planeGeometry args={[1.4, 1.25]} />
        </mesh>
        {/* Màn the vàng buông giữa, màn đỏ và rèm vàng vén hai bên */}
        <mesh position={[0, 0.85, 0.39]} material={toon('#f2d36b', { transparent: true, opacity: 0.6, side: DoubleSide })}>
          <planeGeometry args={[1.5, 1.3]} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * 0.82, 0.85, 0.4]} material={yellow}>
              <boxGeometry args={[0.32, 1.3, 0.05]} />
            </mesh>
            <mesh position={[s * 1.04, 0.8, 0.42]} material={red}>
              <boxGeometry args={[0.26, 1.5, 0.05]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 1.55, 0.42]} material={red}>
          <boxGeometry args={[2.2, 0.28, 0.06]} />
        </mesh>
        <mesh position={[0, 1.47, 0.46]} material={gold}>
          <boxGeometry args={[2.2, 0.05, 0.02]} />
        </mesh>
        <Roof w={2.5} d={1.2} h={0.4} ornament={false} position={[0, 1.72, 0]} />
      </group>

      {/* Cửa hang: trụ đá, mi đá, biển hoành phi, câu đối, phướn */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 2.1, 0, mouth - 0.4]}>
          <mesh position={[0, 1.6, 0]} material={stone} castShadow>
            <boxGeometry args={[0.45, 3.2, 0.45]} />
          </mesh>
          <mesh position={[0, 1.8, 0.24]} material={red}>
            <boxGeometry args={[0.3, 1.8, 0.04]} />
          </mesh>
          <mesh position={[0, 1.8, 0.265]} material={gold}>
            <boxGeometry args={[0.12, 1.5, 0.02]} />
          </mesh>
          <mesh position={[-s * 0.6, 2.4, 0.1]} material={s < 0 ? yellow : red}>
            <boxGeometry args={[0.32, 1.3, 0.03]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 3.35, mouth - 0.4]} material={stone} castShadow>
        <boxGeometry args={[5, 0.45, 0.55]} />
      </mesh>
      <mesh position={[0, 3.35, mouth - 0.1]} material={red}>
        <boxGeometry args={[2.2, 0.5, 0.06]} />
      </mesh>
      <mesh position={[0, 3.35, mouth - 0.06]} material={gold}>
        <boxGeometry args={[1.8, 0.26, 0.03]} />
      </mesh>

      {/* Đèn lồng treo cửa hang (sáng về đêm) */}
      {[-1, 1].map((s) => (
        <Lantern key={s} position={[s * 1.3, 2.75, mouth - 0.2]} hang={0.35} lit={night} />
      ))}
    </group>
  )
}
