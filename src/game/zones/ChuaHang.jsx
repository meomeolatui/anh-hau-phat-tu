import { useMemo } from 'react'
import ColorGrove from '../props/ColorGrove'
import { Hall } from '../props/architecture'
import { Bamboo, BigTree, Boulders, Forest } from '../props/nature'
import { SeatedBuddha } from '../props/sacred'
import { IncenseSpot, Npc, PrayerSeat } from '../props/interactive'
import { AltarSpot } from '../props/spots'
import { useColliders } from '../interaction'
import { PALETTE, glow, toon } from '../materials'
import { DecorSet } from '../props/decor'
import { HangingLamp, RailingSet, StoneLanternSet, WarmLight } from './duong-nui/decor'
import { Cave, CliffRocks, SplitRock, Stream } from './chua-hang/scenery'
import {
  ALTAR_TABLE,
  BODHI,
  COLLIDERS,
  ENTRY_LANTERNS,
  FLOOR,
  HALL,
  HALL_LANTERNS_LOCAL,
  INTERACTIVE,
  O,
  buildChuaHangDecor,
  buildCliff,
  hallAt,
  streamSamples,
} from './chua-hang/data'
import { DECOR, DECOR_COLLIDERS } from './chua-hang/decorLayout'

/**
 * KHU VỰC: Chùa Hang — Linh Sơn Long Châu Tự (lập 1830, trùng tu 1995; đền do người xây + hang đá tự nhiên,
 * gần thung Suối Vàng). Sân tròn r 15 quanh origin, lối vào từ chùa Bà ở phía +X.
 *  - Vách đá granite chồng khối phía −X/−Z; cửa hang tối có đèn dầu bên trong.
 *  - Điện nhỏ một tầng mái nép vào vách, quay mặt về tâm sân: tượng Phật, lư hương, bồ đoàn, chiếu lạy.
 *  - Tương truyền "Ông Đá nứt": tảng đá nứt đôi ven sân, khe giữa đi qua được.
 *  - Khe suối nhỏ chảy ngoài mép sân phía nam.
 * Toạ độ cục bộ/thế giới & vật cản: xem chua-hang/data.js.
 */

const HALL_LANTERN_ITEMS = [
  ...HALL_LANTERNS_LOCAL.map(([lx, lz]) => {
    const [x, z] = hallAt(lx, lz)
    return { x, y: 0, z, rot: HALL.rot }
  }),
  ...ENTRY_LANTERNS.map(([x, z]) => ({ x, y: 0, z, rot: Math.PI / 2 })),
]
const HALL_LIGHT = hallAt(0, 1.2)

export default function ChuaHang({ night }) {
  useColliders('chua-hang', COLLIDERS, O)
  useColliders('chua-hang-decor', DECOR_COLLIDERS, O)
  const cliff = useMemo(() => buildCliff(), [])
  const decor = useMemo(() => buildChuaHangDecor(), [])
  const stream = useMemo(() => streamSamples(), [])

  return (
    <>
      {/* Rặng cây nhiều màu quanh khu vực (đỏ, cam, vàng, hồng, tím) */}
      <ColorGrove zoneId="chua-hang" count={16} seed={41} />
      {/* ---- Lối vào từ chùa Bà & rừng quanh (toạ độ thế giới) ---- */}
      <RailingSet runs={decor.rails} />
      <StoneLanternSet items={decor.lanterns} lit={night} />
      <Forest items={decor.trees} />
      <Boulders items={decor.rocks} />

      <group position={O}>
        <CliffRocks items={cliff} />
        <Cave night={night} />

        <Hall w={HALL.w} d={HALL.d} h={HALL.h} tiers={1} wall={PALETTE.wallCream} position={[HALL.x, 0, HALL.z]} rotation={[0, HALL.rot, 0]}>
          <mesh position={[0, FLOOR + ALTAR_TABLE.h / 2, ALTAR_TABLE.lz]} material={toon(PALETTE.lacquer)} castShadow>
            <boxGeometry args={[ALTAR_TABLE.w, ALTAR_TABLE.h, ALTAR_TABLE.d]} />
          </mesh>
          <SeatedBuddha size={1.3} position={[0, FLOOR + ALTAR_TABLE.h, ALTAR_TABLE.lz - 0.05]} />
          {/* Đèn nến & bình hoa sen trên bàn thờ */}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 1.0, FLOOR + ALTAR_TABLE.h, ALTAR_TABLE.lz + 0.25]}>
              <mesh position={[0, 0.12, 0]} material={toon('#efe4c8')}>
                <cylinderGeometry args={[0.035, 0.035, 0.24, 6]} />
              </mesh>
              <mesh position={[0, 0.28, 0]} material={glow('#ffb347')}>
                <coneGeometry args={[0.03, 0.09, 6]} />
              </mesh>
              <mesh position={[s * -0.25, 0.14, -0.15]} material={toon(PALETTE.bronze)}>
                <cylinderGeometry args={[0.07, 0.05, 0.28, 8]} />
              </mesh>
              <mesh position={[s * -0.25, 0.36, -0.15]} material={toon(PALETTE.lotus, { flat: true })}>
                <coneGeometry args={[0.09, 0.16, 6]} />
              </mesh>
            </group>
          ))}
          {[-1, 1].map((s) => (
            <HangingLamp key={s} position={[s * 2.4, 2.55, HALL.d / 2 - 0.25]} lit={night} hang={0.4} />
          ))}
        </Hall>
        <WarmLight position={[HALL_LIGHT[0], 2.3, HALL_LIGHT[1]]} night={night} intensity={2.5} distance={9} />

        <StoneLanternSet items={HALL_LANTERN_ITEMS} lit={night} />
        <BigTree position={[BODHI.x, 0, BODHI.z]} scale={BODHI.scale} />
        <SplitRock />
        <Stream samples={stream} />
        <Boulders items={decor.bank} castShadow={false} />
        {decor.bamboo.map((p, i) => (
          <Bamboo key={i} position={p} seed={70 + i} height={6} />
        ))}

        {/* Đồ trang trí: kệ dép, công đức, bảo tháp sau điện, phướn, đèn dây, bàn ghế đá, chậu sen… (chua-hang/decorLayout.js) */}
        <DecorSet items={DECOR} night={night} />
      </group>

      {/* ---- Đồ có tương tác (toạ độ thế giới) ---- */}
      <IncenseSpot
        id="chua-hang-lu"
        name="Lư hương bàn thờ chùa Hang"
        position={INTERACTIVE.incense.position}
        rotY={INTERACTIVE.incense.rotY}
        scale={0.5}
      />
      <AltarSpot id="chua-hang" name="Trước bàn thờ Phật chùa Hang" position={INTERACTIVE.altar.position} rotY={INTERACTIVE.altar.rotY} />
      <PrayerSeat id="chua-hang-1" name="Bồ đoàn trong chùa Hang" position={INTERACTIVE.seat.position} rotY={INTERACTIVE.seat.rotY} />
      <Npc
        id="giu-chua-hang"
        name="Chú Tư"
        title="người giữ chùa Hang"
        position={INTERACTIVE.npc.position}
        rotY={INTERACTIVE.npc.rotY}
        look={{ role: 'phat-tu', outfit: 'xam', hair: 'ngan' }}
        dialogueId="chua-hang"
      />
    </>
  )
}
