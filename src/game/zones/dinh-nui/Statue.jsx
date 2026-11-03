import { StandingBodhisattva } from '../../props/sacred'
import { PALETTE, glow, toon } from '../../materials'
import { ALTAR_TABLE, ALTAR_TABLE_Z, APOTHEM, FRONT_STEPS, STATUE, STATUE_TOP } from './data'

/**
 * Tượng Phật Bà Tây Bổ Đà Sơn trên đỉnh núi Bà Đen — điểm nhấn của cả game.
 * Tượng thật cao 72 m (gồm đài sen và bệ), đúc từ hơn 170 tấn đồng đỏ, tạo hình phỏng theo
 * tượng Phật Bà thời Lê ở chùa Bổ Đà (Bắc Giang). Trong game thu nhỏ: tượng + đài sen ~24 m trên bệ đá ~3,4 m.
 *
 * Gốc toạ độ của component: tâm bệ tượng trên mặt quảng trường; mặt tượng hướng +Z.
 * Bệ bát giác dựng bằng cylinderGeometry 8 cạnh xoay π/8 để một mặt phẳng quay thẳng ra trước.
 */

const OCT = Math.PI / 8
const K = STATUE.size / 3 // hệ số tỉ lệ của StandingBodhisattva

/** Một tầng bệ bát giác có gờ viền trên và (tuỳ chọn) phù điêu ở các mặt bên */
function Tier({ r, h, y, panels }) {
  const stone = toon(PALETTE.stone)
  const trim = toon(PALETTE.stoneDark)
  const panel = toon(PALETTE.graniteDark)
  const a = r * 0.985 * APOTHEM
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, h / 2, 0]} rotation-y={OCT} material={stone} castShadow receiveShadow>
        <cylinderGeometry args={[r * 0.97, r, h, 8]} />
      </mesh>
      <mesh position={[0, h - 0.07, 0]} rotation-y={OCT} material={trim} receiveShadow>
        <cylinderGeometry args={[r * 0.99, r * 0.99, 0.14, 8]} />
      </mesh>
      {panels &&
        // Bảy mặt bên (bỏ mặt trước có bậc cấp)
        Array.from({ length: 7 }, (_, i) => {
          const t = ((i + 1) * Math.PI) / 4
          return (
            <mesh key={i} position={[Math.sin(t) * a, h * 0.45, Math.cos(t) * a]} rotation-y={t} material={panel}>
              <boxGeometry args={[r * 0.5, h * 0.42, 0.06]} />
            </mesh>
          )
        })}
    </group>
  )
}

/** Bậc cấp xếp chồng: các khối box thấp dần ra phía trước (trang trí, có vật cản chung với bàn thờ) */
function Stairs({ zFront, run, rise, n = 3, width, y = 0 }) {
  const mat = toon(PALETTE.stone)
  return (
    <group position={[0, y, zFront]}>
      {Array.from({ length: n }, (_, j) => {
        const d = (run * (n - j)) / n
        const h = (rise * (j + 1)) / n
        return (
          // lùi 0.35 m vào trong bệ để khít với mặt bệ hơi vát
          <mesh key={j} position={[0, h / 2, d / 2 - 0.175]} material={mat} castShadow receiveShadow>
            <boxGeometry args={[width - j * 0.3, h, d + 0.35]} />
          </mesh>
        )
      })}
      {/* Hai thành bậc */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (width / 2 + 0.2), rise / 2 + 0.1, run / 2]} material={toon(PALETTE.stoneDark)} castShadow>
          <boxGeometry args={[0.4, rise + 0.2, run]} />
        </mesh>
      ))}
    </group>
  )
}

/** Vầng hào quang sau đầu tượng: vòng kép + tia lửa cách điệu; phát sáng nhẹ ban đêm */
function Halo({ night, position }) {
  const mat = night ? glow('#ffd77a', 0.7) : toon(PALETTE.gold)
  const r = 0.52 * K
  return (
    <group position={position}>
      <mesh material={mat}>
        <torusGeometry args={[r, 0.035 * K, 6, 40]} />
      </mesh>
      <mesh material={mat}>
        <torusGeometry args={[r * 0.72, 0.018 * K, 5, 32]} />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1, 0]} rotation-z={a - Math.PI / 2} material={mat}>
            <coneGeometry args={[0.05 * K, 0.16 * K, 4]} />
          </mesh>
        )
      })}
    </group>
  )
}

/** Bàn thờ đá trước bậc cấp với lễ vật chay: bình hoa sen, đĩa trái cây, đèn nến, bát hương nhỏ */
function AltarTable({ night, z }) {
  const { w, d, h } = ALTAR_TABLE
  const bronze = toon(PALETTE.bronze)
  const flame = night ? glow('#ffb347') : toon('#f2c46d')
  const fruits = ['#e8a33a', '#d8662f', '#e9c46a', '#8fc06a', '#d8662f']
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, h / 2, 0]} material={toon(PALETTE.graniteDark)} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      <mesh position={[0, h + 0.03, 0]} material={toon(PALETTE.lacquer)}>
        <boxGeometry args={[w + 0.1, 0.06, d + 0.1]} />
      </mesh>
      {/* Bát hương nhỏ giữa bàn */}
      <mesh position={[0, h + 0.18, 0]} material={bronze}>
        <cylinderGeometry args={[0.2, 0.15, 0.24, 10]} />
      </mesh>
      {/* Bình hoa sen hai bên */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.15, h + 0.06, 0]}>
          <mesh position={[0, 0.22, 0]} material={bronze}>
            <cylinderGeometry args={[0.08, 0.13, 0.44, 8]} />
          </mesh>
          {[-0.12, 0, 0.12].map((o, i) => (
            <mesh key={i} position={[o, 0.58 + (i === 1 ? 0.08 : 0), 0]} material={toon(PALETTE.lotus, { flat: true })}>
              <coneGeometry args={[0.09, 0.2, 6]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Đĩa trái cây */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.55, h + 0.06, 0.12]}>
          <mesh material={toon(PALETTE.gold)}>
            <cylinderGeometry args={[0.2, 0.12, 0.05, 10]} />
          </mesh>
          {fruits.map((c, i) => (
            <mesh key={i} position={[Math.cos(i * 1.3) * 0.09, 0.08 + (i === 4 ? 0.08 : 0), Math.sin(i * 1.3) * 0.09]} material={toon(c)}>
              <sphereGeometry args={[0.065, 6, 5]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Đèn nến */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.45, h + 0.06, 0.25]}>
          <mesh position={[0, 0.1, 0]} material={toon('#f3e6c8')}>
            <cylinderGeometry args={[0.035, 0.035, 0.2, 6]} />
          </mesh>
          <mesh position={[0, 0.24, 0]} material={flame}>
            <coneGeometry args={[0.025, 0.07, 5]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default function Statue({ night }) {
  const [t1, t2, t3] = STATUE.tiers
  const y2 = t1.h
  const y3 = t1.h + t2.h
  return (
    <group position={[STATUE.x, 0, STATUE.z]}>
      {/* Bệ bát giác ba tầng */}
      <Tier r={t1.r} h={t1.h} y={0} />
      <Tier r={t2.r} h={t2.h} y={y2} panels />
      <Tier r={t3.r} h={t3.h} y={y3} />
      {/* Bậc cấp lên tầng 1 và tầng 2 (trang trí) */}
      <Stairs zFront={FRONT_STEPS.from} run={FRONT_STEPS.run} rise={t1.h} width={FRONT_STEPS.width} />
      <Stairs zFront={t2.r * APOTHEM} run={(t1.r - t2.r) * APOTHEM} rise={t2.h} width={FRONT_STEPS.width - 1} y={y2} />

      {/* Tượng đồng đỏ trên đài sen ba lớp cánh */}
      <StandingBodhisattva size={STATUE.size} color={PALETTE.bronze} position={[0, STATUE_TOP, 0]} />
      <Halo night={night} position={[0, STATUE_TOP + 3.17 * K, -0.4 * K]} />

      <AltarTable night={night} z={ALTAR_TABLE_Z - STATUE.z} />

      {/* Đèn chiếu tượng ban đêm (đặt thấp phía trước, hắt ánh vàng ấm lên tượng) */}
      {night && <pointLight position={[0, 6, FRONT_STEPS.from + 4]} color="#ffd9a0" intensity={80} distance={42} decay={1.6} />}
    </group>
  )
}
