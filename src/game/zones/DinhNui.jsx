import { Boulders } from '../props/nature'
import ColorGrove from '../props/ColorGrove'
import { StoneLantern } from '../props/sacred'
import { IncenseSpot, Npc, PrayerSeat } from '../props/interactive'
import { AltarSpot, SutraLectern } from '../props/spots'
import { CableStation } from '../props/CableStation'
import { useColliders } from '../interaction'
import { DecorSet } from '../props/decor'
import Statue from './dinh-nui/Statue'
import { Banner, LowPine, MeditationPavilion, PavingPattern, RailingRing } from './dinh-nui/Decor'
import {
  ALTAR_MAT,
  BANNERS,
  COLLIDERS,
  DECK,
  INCENSE,
  INNER_BOULDERS,
  LANTERNS,
  LECTERN,
  NPC,
  O,
  OUTER_BOULDERS,
  PINES,
  RAILING,
  SEATS,
  STATION,
  w,
} from './dinh-nui/data'
import { DECOR, DECOR_COLLIDERS } from './dinh-nui/decorLayout'

/**
 * KHU VỰC: Đỉnh núi Bà Đen · Tượng Phật Bà Tây Bổ Đà Sơn.
 * Quảng trường tròn bán kính 34 m (cục bộ quanh (0,0), y = 0). Đường dốc lên tới mép +X/+Z ở (20,16);
 * ga cáp treo ở (24,12) cửa quay vào quảng trường. Từ đây nhìn xuống thấy vành mây và rừng núi.
 *
 * Bố cục (toạ độ & vật cản ở ./dinh-nui/data.js):
 *  - Trục chính: lư hương lớn ở tâm → chiếu lễ → bàn thờ & bậc cấp → bệ bát giác ba tầng ở (0,−21), tượng nhìn về +Z.
 *  - Hai hàng đèn đá dọc trục, bốn cột phướn hai bên bệ, án thư tụng kinh ở góc trái.
 *  - Thiền đài ngắm mây ở mép tây (−24,6): ba bồ đoàn quay ra vực.
 *  - Lan can đá quanh mép (chừa lối đường dốc), đá granite lớn và thông thấp quanh mép.
 */

export default function DinhNui({ night }) {
  useColliders('dinh-nui', COLLIDERS, O)
  useColliders('dinh-nui-decor', DECOR_COLLIDERS, O)

  return (
    <>
      {/* Rặng cây nhiều màu quanh khu vực (đỏ, cam, vàng, hồng, tím) */}
      <ColorGrove zoneId="dinh-nui" count={22} seed={53} />
      <group position={O}>
        <PavingPattern />
        <Statue night={night} />

        {/* Hai hàng đèn đá dọc trục lư hương → tượng */}
        {LANTERNS.map(([x, z]) => (
          <StoneLantern key={`${x}|${z}`} position={[x, 0, z]} lit={night} />
        ))}
        {BANNERS.map((b, i) => (
          <Banner key={i} position={[b.x, 0, b.z]} color={b.color} seed={i * 1.3} />
        ))}

        <MeditationPavilion night={night} />
        <RailingRing segments={RAILING} />

        <Boulders items={INNER_BOULDERS} />
        <Boulders items={OUTER_BOULDERS} />
        {PINES.map((p, i) => (
          <LowPine key={i} position={[p.x, p.y, p.z]} scale={p.s} />
        ))}

        {/* Đồ trang trí: bảo tháp sau tượng, chậu sen, bonsai, công đức, phướn, chuông gió, đèn dây (dinh-nui/decorLayout.js) */}
        <DecorSet items={DECOR} night={night} />
      </group>

      {/* ---- Đồ có tương tác (toạ độ thế giới) ---- */}
      <IncenseSpot
        id="dinh-nui-lu"
        name="Lư hương trước tượng Phật Bà"
        position={w([INCENSE.x, 0, INCENSE.z])}
        rotY={INCENSE.rotY}
        scale={INCENSE.scale}
        baseSticks={5}
      />
      <AltarSpot id="dinh-nui-tuong-phat-ba" name="Trước tượng Phật Bà Tây Bổ Đà Sơn" position={w([ALTAR_MAT.x, 0, ALTAR_MAT.z])} rotY={ALTAR_MAT.rotY} />
      <SutraLectern id="dinh-nui-an-thu" name="Án thư tụng kinh trên đỉnh núi" position={w([LECTERN.x, 0, LECTERN.z])} rotY={LECTERN.rotY} />

      {SEATS.map((s) => (
        <PrayerSeat
          key={s.id}
          id={s.id}
          name="Bồ đoàn thiền đài ngắm mây"
          activity="thien-dinh"
          position={w([s.x, DECK.h, s.z])}
          rotY={s.rotY}
        />
      ))}

      <Npc
        id="huong-dan-dinh"
        name="Anh Tuấn"
        title="hướng dẫn viên"
        position={w([NPC.x, 0, NPC.z])}
        rotY={NPC.rotY}
        look={{ role: 'phat-tu', outfit: 'trang', hair: 'ngan' }}
        dialogueId="dinh-nui"
      />

      <CableStation stationId="dinh-nui" position={w([STATION.x, 0, STATION.z])} rotY={STATION.rotY} />
    </>
  )
}
