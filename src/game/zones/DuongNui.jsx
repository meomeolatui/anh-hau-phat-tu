import { useMemo } from 'react'
import ColorGrove from '../props/ColorGrove'
import { MAPLE } from '../props/foliage'
import { Roof } from '../props/architecture'
import { Bamboo, BigTree, Boulders, Forest } from '../props/nature'
import { Npc, PrayerSeat } from '../props/interactive'
import { useColliders } from '../interaction'
import { PALETTE, toon } from '../materials'
import { DecorSet } from '../props/decor'
import { HangingLamp, Pavilion, RailingSet, StoneBench, StoneLanternSet, WarmLight } from './duong-nui/decor'
import {
  CN1_COLLIDERS,
  CN1_LANTERNS,
  CN2_BOULDER,
  CN2_COLLIDERS,
  GATE,
  GATE_COLLIDERS,
  GATE_O,
  INTERACTIVE,
  O1,
  O2,
  REST,
  REST_BENCH,
  VIEW,
  VIEW_BENCH,
  WATER_JAR,
  buildDuongNuiDecor,
} from './duong-nui/data'
import { CN1_DECOR_COLLIDERS, CN2_DECOR_COLLIDERS, DECOR_WORLD } from './duong-nui/decorLayout'

/**
 * KHU VỰC: Đường bậc đá lên chùa Bà & đường dốc lên đỉnh.
 * Bậc đá đã vẽ sẵn (RampSteps). Ở đây trang trí hai bên: lan can đá, đèn đá, cây rừng, đá granite, trúc;
 * chiếu nghỉ 1 có nhà nghỉ chân + ghế đá ngồi được (world/benches.js) (không đặt nơi thờ tự trên đường bậc);
 * chiếu nghỉ 2 có đình nhỏ và bồ đoàn thiền nhìn ra vực.
 *
 * Toạ độ: chiếu nghỉ 1 dùng gốc O1, chiếu nghỉ 2 dùng gốc O2, cổng chân bậc dùng GATE_O (xem duong-nui/data.js).
 * Đồ dọc các đoạn bậc trải nhiều độ cao nên tính sẵn bằng toạ độ thế giới (buildDuongNuiDecor).
 */

const CN1_LANTERN_ITEMS = CN1_LANTERNS.map(([x, z]) => ({ x, y: 0, z }))
const CN2_ROCKS = [
  { x: CN2_BOULDER.x, y: -0.2, z: CN2_BOULDER.z, s: CN2_BOULDER.s, rot: 0.7 },
  { x: CN2_BOULDER.x + 0.9, y: -0.1, z: CN2_BOULDER.z - 0.9, s: 0.8, rot: 2.1 },
]

export default function DuongNui({ night }) {
  useColliders('duong-nui-cong', GATE_COLLIDERS, GATE_O)
  useColliders('duong-nui-chieu-nghi', CN1_COLLIDERS, O1)
  useColliders('duong-nui-chieu-nghi-2', CN2_COLLIDERS, O2)
  useColliders('duong-nui-decor-1', CN1_DECOR_COLLIDERS, O1)
  useColliders('duong-nui-decor-2', CN2_DECOR_COLLIDERS, O2)
  const decor = useMemo(() => buildDuongNuiDecor(), [])

  return (
    <>
      {/* Rặng cây nhiều màu quanh khu vực (đỏ, cam, vàng, hồng, tím) */}
      <ColorGrove zoneId="duong-bac-da" count={44} seed={23} />
      {/* ---- Dọc các đoạn bậc (toạ độ thế giới) ---- */}
      <RailingSet runs={decor.rails} />
      <StoneLanternSet items={decor.lanterns} lit={night} />
      <Forest items={decor.trees} />
      <Boulders items={decor.rocks} />
      {decor.bamboo.map((p, i) => (
        <Bamboo key={i} position={p} seed={40 + i} height={5.5 + (i % 3)} />
      ))}
      {decor.bigTrees.map((p, i) => (
        <BigTree key={i} position={p} scale={0.85 + (i % 2) * 0.15} color={[MAPLE.do, MAPLE.vang, PALETTE.leaf, MAPLE.cam][i % 4]} />
      ))}

      <SignGate night={night} />

      {/* Đồ trang trí: dây phướn, đèn lồng dây vắt ngang bậc, cổng phụ, bia nhỏ, chậu cây, chuông gió (duong-nui/decorLayout.js) */}
      <DecorSet items={DECOR_WORLD} night={night} />

      {/* ---- Chiếu nghỉ 1: nhà nghỉ chân, ghế đá, lu nước ---- */}
      <group position={O1}>
        <Pavilion w={REST.w} d={REST.d} h={2.6} position={[REST.x, 0, REST.z]} rotation={[0, REST.rot, 0]}>
          <StoneBench len={REST_BENCH.len} position={[0, 0, REST_BENCH.lz]} />
          {/* Nón lá và túi vải của khách hành hương để trên ghế */}
          <mesh position={[0.9, 0.62, REST_BENCH.lz]} material={toon('#e6cf8f')} castShadow>
            <coneGeometry args={[0.32, 0.22, 12]} />
          </mesh>
          <mesh position={[-0.8, 0.62, REST_BENCH.lz]} material={toon(PALETTE.cloth)} scale={[1, 0.7, 0.8]}>
            <sphereGeometry args={[0.18, 8, 6]} />
          </mesh>
          <HangingLamp position={[0, 2.25, 0]} lit={night} hang={0.55} />
        </Pavilion>
        <WarmLight position={[REST.x, 2.1, REST.z]} night={night} />
        <WaterJar position={[WATER_JAR.x, 0, WATER_JAR.z]} />
        <StoneLanternSet items={CN1_LANTERN_ITEMS} lit={night} />
      </group>

      {/* ---- Chiếu nghỉ 2: đình nhỏ nhìn ra vực ---- */}
      <group position={O2}>
        <Pavilion w={VIEW.w} d={VIEW.d} h={2.4} position={[VIEW.x, 0, VIEW.z]} rotation={[0, VIEW.rot, 0]}>
          <StoneBench len={VIEW_BENCH.len} position={[0, 0, VIEW_BENCH.lz]} />
          <HangingLamp position={[0, 2.05, 0]} lit={night} hang={0.5} color="#e8a23a" />
        </Pavilion>
        <Boulders items={CN2_ROCKS} />
      </group>

      {/* ---- Đồ có tương tác (toạ độ thế giới) ---- */}
      <Npc
        id="phat-tu-nghi-chan"
        name="Bác Ba Hên"
        title="Phật tử hành hương"
        position={INTERACTIVE.npcNghiChan.position}
        rotY={INTERACTIVE.npcNghiChan.rotY}
        look={{ role: 'phat-tu', outfit: 'nau', hair: 'ngan' }}
        anim="idle"
        dialogueId="nghi-chan"
      />
      <PrayerSeat
        id="duong-nui-thien"
        name="Bồ đoàn thiền ngắm mây núi"
        activity="thien-dinh"
        position={INTERACTIVE.seatThien.position}
        rotY={INTERACTIVE.seatThien.rotY}
      />
    </>
  )
}

/** Cổng gỗ nhỏ ở chân bậc đoạn 1, treo biển gỗ "Đường lên chùa Bà" (mặt biển quay về quảng trường) */
function SignGate({ night }) {
  const wood = toon(PALETTE.wood)
  const dark = toon(PALETTE.woodDark)
  const stone = toon(PALETTE.stoneDark, { flat: true })
  const ink = toon('#4a2e1c')
  const { halfW, h } = GATE
  return (
    <group position={GATE_O}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * halfW, 0, 0]}>
          <mesh position={[0, 0.2, 0]} material={stone} castShadow receiveShadow>
            <boxGeometry args={[0.6, 0.4, 0.6]} />
          </mesh>
          <mesh position={[0, h / 2, 0]} material={wood} castShadow>
            <boxGeometry args={[0.28, h, 0.28]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, h + 0.05, 0]} material={dark} castShadow>
        <boxGeometry args={[halfW * 2 + 1, 0.26, 0.34]} />
      </mesh>
      <mesh position={[0, h - 0.45, 0]} material={wood}>
        <boxGeometry args={[halfW * 2, 0.16, 0.22]} />
      </mesh>
      <Roof w={halfW * 2 + 1.6} d={1.3} h={0.55} ornament={false} position={[0, h + 0.18, 0]} />
      {/* Biển gỗ treo dưới xà: nền gỗ sẫm, lòng biển màu ngà, nét chữ cách điệu */}
      <group position={[0, h - 1.2, 0.14]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 1.1, 0.57, 0]} material={dark}>
            <cylinderGeometry args={[0.02, 0.02, 0.34, 4]} />
          </mesh>
        ))}
        <mesh material={dark} castShadow>
          <boxGeometry args={[2.8, 0.8, 0.08]} />
        </mesh>
        <mesh position={[0, 0, 0.045]} material={toon('#e8d6a8')}>
          <planeGeometry args={[2.5, 0.52]} />
        </mesh>
        {[-0.95, -0.57, -0.19, 0.19, 0.57, 0.95].map((x) => (
          <mesh key={x} position={[x, 0, 0.05]} material={ink}>
            <boxGeometry args={[0.24, 0.28, 0.01]} />
          </mesh>
        ))}
      </group>
      {[-1, 1].map((s) => (
        <HangingLamp key={s} position={[s * (halfW - 0.5), h - 0.95, 0]} lit={night} hang={0.35} />
      ))}
    </group>
  )
}

/** Lu nước sành cho khách leo núi */
function WaterJar({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} material={toon('#8a5a3b')} scale={[1, 1.15, 1]} castShadow>
        <sphereGeometry args={[0.4, 12, 10]} />
      </mesh>
      <mesh position={[0, 0.88, 0]} material={toon(PALETTE.woodDark)}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 12]} />
      </mesh>
      <mesh position={[0.08, 0.95, 0]} rotation-z={0.3} material={toon(PALETTE.wood)}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 5]} />
      </mesh>
    </group>
  )
}
