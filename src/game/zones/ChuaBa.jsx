import { Hall, Railing } from '../props/architecture'
import ColorGrove from '../props/ColorGrove'
import { Bamboo, BigTree } from '../props/nature'
import { Lantern, SeatedBuddha, StandingBodhisattva, StoneLantern } from '../props/sacred'
import { BroomRack, IncenseSpot, LeafField, Npc, PrayerSeat } from '../props/interactive'
import { AltarSpot, BellSpot, SutraLectern } from '../props/spots'
import { CableStation } from '../props/CableStation'
import { useColliders } from '../interaction'
import { PALETTE, toon } from '../materials'
import { DecorSet } from '../props/decor'
import DienBa from './chua-ba/DienBa'
import { BuddhistFlag, Candles, CliffRocks, Offerings, PaperLantern } from './chua-ba/decor'
import {
  BAMBOO,
  BELL,
  CABLE,
  CLIFF_ROCKS,
  COLLIDERS,
  FLAGS,
  HALL,
  HALL_FRONT_Z,
  LEAF_FIELDS,
  LU_HUONG,
  O,
  SPOTS,
  STONE_LANTERNS,
  TREES,
  w,
} from './chua-ba/data'
import { DECOR, DECOR_COLLIDERS } from './chua-ba/decorLayout'
import { LONG_SESSIONS } from '../activities/thienLogic'

/**
 * KHU VỰC: Chùa Bà · Linh Sơn Tiên Thạch Tự (lưng chừng núi) và Điện Bà.
 * Sân 66×56 m (x −33..33, z −28..28) ở độ cao O.y = 26. Vào từ bậc đá mép +Z (x≈0).
 * Lối rẽ Chùa Hang ở mép −X (z≈−6); đường dốc lên đỉnh ở góc (22, −27); ga cáp treo ở (26, 16).
 *
 * Bố cục (toạ độ, vật cản: ./chua-ba/data.js):
 *  - Trục chính x = 0: lối lát đá → lư hương lớn → tam cấp → chánh điện hai tầng mái tựa vách núi (−Z).
 *  - Điện Bà (thờ Mẫu) trong hang đá bên phải phía sau; gác chuông cân đối bên trái.
 *  - Hai bên sân: cây đa, cây bồ đề cổ thụ + sân lá để quét; lan can đá mép vực (+X, +Z).
 */

const PATH = '#d6c9ae'

/** Lối lát đá thẳng từ a tới b (cục bộ x,z) */
function PathStrip({ from, to, width }) {
  const [ax, az] = from
  const [bx, bz] = to
  const len = Math.hypot(bx - ax, bz - az)
  return (
    <mesh position={[(ax + bx) / 2, 0, (az + bz) / 2]} rotation-y={Math.atan2(bx - ax, bz - az)} material={toon(PATH)} receiveShadow>
      <boxGeometry args={[width, 0.02, len]} />
    </mesh>
  )
}

const PATHS = [
  { from: [0, 28], to: [0, HALL_FRONT_Z + 1.4], width: 5 }, // trục chính
  { from: [-33, -6], to: [-2.5, -6], width: 3.6 }, // rẽ sang Chùa Hang
  { from: [2.5, -7.5], to: [14.9, -19.6], width: 3 }, // tới Điện Bà
  { from: [-2.5, -7.5], to: [-14.6, -17.6], width: 3 }, // tới gác chuông
  { from: [6, -4.5], to: [25, -21], width: 3 }, // về phía dốc lên đỉnh
  { from: [25, -21], to: [22.4, -26.6], width: 3 },
]

/** Bậc tam cấp trước chánh điện (chỉ trang trí, thấp — không đổi mặt đi được) */
const STEPS = [0, 1, 2].map((i) => ({ z: HALL_FRONT_Z + 0.25 + i * 0.45, h: 0.13 - i * 0.04, w: 6.4 + i * 0.5 }))

/** Đèn lồng dưới hiên chánh điện: hai đèn giữa có nguồn sáng, hai đèn ngoài chỉ phát sáng */
const EAVE_Z = HALL.z + HALL.d / 2 + 0.6
const EAVE_Y = HALL.h - 0.5

function ChanhDien({ night }) {
  const lacquer = toon(PALETTE.lacquer)
  const gold = toon(PALETTE.gold)
  const wood = toon(PALETTE.wood)
  const back = -HALL.d / 2 + 0.3
  return (
    <Hall w={HALL.w} d={HALL.d} h={HALL.h} tiers={2} position={[HALL.x, 0, HALL.z]} rotation={[0, HALL.rot, 0]}>
      {/* Phông thờ đỏ viền vàng sau tượng */}
      <mesh position={[0, 2.6, back + 0.04]} material={lacquer}>
        <boxGeometry args={[5, 3.8, 0.06]} />
      </mesh>
      <mesh position={[0, 2.6, back + 0.08]} material={gold}>
        <boxGeometry args={[4.4, 3.2, 0.02]} />
      </mesh>
      <mesh position={[0, 2.6, back + 0.1]} material={lacquer}>
        <boxGeometry args={[4.1, 2.9, 0.02]} />
      </mesh>

      {/* Bệ thờ và tượng Phật lớn */}
      <mesh position={[0, 0.69, -4]} material={lacquer} castShadow>
        <boxGeometry args={[5.2, 1.1, 1.6]} />
      </mesh>
      <mesh position={[0, 1.25, -4]} material={gold}>
        <boxGeometry args={[5.3, 0.05, 1.65]} />
      </mesh>
      <SeatedBuddha size={3} position={[0, 1.27, -4.2]} />

      {/* Hai tượng Bồ Tát đứng hầu hai bên */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 4, 0.14, -4.2]}>
          <mesh position={[0, 0.25, 0]} material={lacquer} castShadow>
            <boxGeometry args={[1.2, 0.5, 1.2]} />
          </mesh>
          <StandingBodhisattva size={1.7} color={PALETTE.gold} position={[0, 0.5, 0]} />
        </group>
      ))}

      {/* Hương án: nến, hoa, quả */}
      <mesh position={[0, 0.565, -2.6]} material={wood} castShadow>
        <boxGeometry args={[3, 0.85, 0.8]} />
      </mesh>
      <mesh position={[0, 1, -2.6]} material={gold}>
        <boxGeometry args={[3.1, 0.05, 0.85]} />
      </mesh>
      <Candles y={1.02} spread={1.2} z={-2.6} />
      <Offerings y={1.02} spread={0.6} z={-2.6} />

      {/* Câu đối trên hai cột giữa */}
      {[-1.4, 1.4].map((x) => (
        <group key={x} position={[x, 2.4, HALL.d / 2 - 0.13]}>
          <mesh material={lacquer}>
            <boxGeometry args={[0.3, 2, 0.04]} />
          </mesh>
          <mesh position={[0, 0, 0.025]} material={gold}>
            <boxGeometry args={[0.12, 1.7, 0.02]} />
          </mesh>
        </group>
      ))}

      {/* Đèn lồng dưới hiên */}
      {[-5.6, -2.8, 2.8, 5.6].map((x) =>
        Math.abs(x) < 4 ? (
          <Lantern key={x} position={[x, EAVE_Y, EAVE_Z - HALL.z]} hang={0.8} lit={night} />
        ) : (
          <PaperLantern key={x} position={[x, EAVE_Y, EAVE_Z - HALL.z]} hang={0.8} lit={night} />
        ),
      )}
    </Hall>
  )
}

// Cây toả bóng gần mỗi sân lá → lá dồn dưới tán và rụng từ tán xuống
const LEAF_TREES_WORLD = Object.fromEntries(
  LEAF_FIELDS.map((f) => [
    f.id,
    TREES.filter((t) => Math.abs(t.x - f.center[0]) < f.w / 2 + 4 && Math.abs(t.z - f.center[2]) < f.d / 2 + 4).map((t) => {
      const [x, , z] = w([t.x, 0, t.z])
      return { x, z, scale: t.scale, color: t.color }
    }),
  ]),
)

export default function ChuaBa({ night }) {
  useColliders('chua-ba-san', COLLIDERS, O)
  useColliders('chua-ba-decor', DECOR_COLLIDERS, O)
  const stone = toon(PALETTE.stone)

  return (
    <>
      {/* Rặng cây nhiều màu quanh khu vực (đỏ, cam, vàng, hồng, tím) */}
      <ColorGrove zoneId="chua-ba" count={28} seed={37} />
      <group position={O}>
        {PATHS.map((p) => (
          <PathStrip key={`${p.from}`} {...p} />
        ))}

        {/* Vách núi dựng phía sau sân */}
        <CliffRocks items={CLIFF_ROCKS} />

        <ChanhDien night={night} />
        {STEPS.map((s) => (
          <mesh key={s.z} position={[HALL.x, s.h / 2, s.z]} material={stone} receiveShadow>
            <boxGeometry args={[s.w, s.h, 0.5]} />
          </mesh>
        ))}

        <DienBa night={night} />

        {/* Nền đá gác chuông */}
        <mesh position={[BELL.x, 0.06, BELL.z]} rotation-y={BELL.rot} material={stone} receiveShadow>
          <boxGeometry args={[4, 0.12, 4]} />
        </mesh>

        {/* Bệ đá bát giác dưới lư hương lớn */}
        <mesh position={[LU_HUONG[0], 0.06, LU_HUONG[1]]} material={toon(PALETTE.stoneDark)} receiveShadow>
          <cylinderGeometry args={[2.1, 2.2, 0.12, 8]} />
        </mesh>

        {TREES.map((t) => (
          <BigTree key={`${t.x}`} position={[t.x, 0, t.z]} scale={t.scale} color={t.color} />
        ))}
        {BAMBOO.map((b) => (
          <Bamboo key={b.seed} position={[b.x, 0, b.z]} seed={b.seed} height={b.height} />
        ))}
        {STONE_LANTERNS.map(([x, z]) => (
          <StoneLantern key={`${x},${z}`} position={[x, 0, z]} lit={night} />
        ))}
        {FLAGS.map(([x, z]) => (
          <BuddhistFlag key={x} position={[x, 0, z]} />
        ))}

        {/* Lan can đá mép vực: mép +X, mép +Z (chừa lối bậc đá) và đoạn trước mép −X */}
        <Railing from={[32.6, -22]} to={[32.6, 27.6]} />
        <Railing from={[32.6, 27.6]} to={[4.4, 27.6]} />
        <Railing from={[-4.4, 27.6]} to={[-32.6, 27.6]} />
        <Railing from={[-32.6, 27.6]} to={[-32.6, -1.6]} />

        {/* Đồ trang trí: kệ dép, công đức, phướn, bonsai, chậu sen, non bộ, bảo tháp sau chùa… (chua-ba/decorLayout.js) */}
        <DecorSet items={DECOR} night={night} />
      </group>

      {/* ---- Đồ có tương tác (toạ độ thế giới) ---- */}
      <IncenseSpot
        id="chua-ba-lu-huong"
        name="Lư hương lớn sân chùa Bà"
        position={w(SPOTS.luHuong.pos)}
        rotY={SPOTS.luHuong.rotY}
        scale={SPOTS.luHuong.scale}
        baseSticks={5}
      />

      {/* Chánh điện (Phật điện) */}
      <IncenseSpot
        id="chua-ba-ban-tho"
        name="Lư hương bàn thờ Phật"
        position={w(SPOTS.huongBanTho.pos)}
        rotY={SPOTS.huongBanTho.rotY}
        scale={SPOTS.huongBanTho.scale}
        baseSticks={2}
      />
      <AltarSpot id="chua-ba-chanh-dien" name="Trước Phật điện chùa Bà" position={w(SPOTS.altar.pos)} rotY={SPOTS.altar.rotY} />
      <SutraLectern id="chua-ba-an-thu" name="Án thư tụng kinh chánh điện" position={w(SPOTS.lectern.pos)} rotY={SPOTS.lectern.rotY} />
      {SPOTS.seats.map((s) => (
        <PrayerSeat key={s.id} id={s.id} name="Bồ đoàn trong chánh điện" position={w(s.pos)} rotY={s.rotY} />
      ))}
      <PrayerSeat
        id="chua-ba-thien-duong"
        name="Thiền đường chánh điện (5–60 phút)"
        activity="thien-dinh"
        position={w(SPOTS.thien.pos)}
        rotY={SPOTS.thien.rotY}
        color="#6b4a8a"
        params={{ sessions: LONG_SESSIONS }}
      />
      <AltarSpot
        id="chua-ba-lay-lien-tuc"
        name="Chiếu qui y hồi hướng (3 lạy = 1 xu)"
        activity="lay-lien-tuc"
        verb="Qui y hồi hướng"
        position={w(SPOTS.layLienTuc.pos)}
        rotY={SPOTS.layLienTuc.rotY}
      />

      {/* Điện Bà (thờ Linh Sơn Thánh Mẫu) */}
      <IncenseSpot
        id="chua-ba-dien-ba"
        name="Lư hương Điện Bà"
        position={w(SPOTS.huongDienBa.pos)}
        rotY={SPOTS.huongDienBa.rotY}
        scale={SPOTS.huongDienBa.scale}
        baseSticks={3}
      />

      <BellSpot id="chua-ba-gac-chuong" name="Gác chuông chùa Bà" position={w(SPOTS.bell.pos)} rotY={SPOTS.bell.rotY} />

      <BroomRack id="chua-ba-choi" position={w(SPOTS.broom.pos)} rotY={SPOTS.broom.rotY} />
      {LEAF_FIELDS.map((f) => (
        <LeafField
          key={f.id}
          id={f.id}
          center={w(f.center)}
          w={f.w}
          d={f.d}
          count={f.count}
          seed={f.seed}
          trees={LEAF_TREES_WORLD[f.id]}
        />
      ))}

      <Npc
        id="su-thay-chua-ba"
        name="Thầy Thích Tâm Hoà"
        title="trụ trì"
        position={w(SPOTS.truTri.pos)}
        rotY={SPOTS.truTri.rotY}
        look={{ role: 'chu-tieu', outfit: 'vang' }}
        dialogueId="su-thay-chua-ba"
      />
      <Npc
        id="co-phat-tu"
        name="Cô Diệu Liên"
        title="Phật tử"
        position={w(SPOTS.phatTu.pos)}
        rotY={SPOTS.phatTu.rotY}
        look={{ role: 'phat-tu', outfit: 'lam', hair: 'bui' }}
        dialogueId="le-nghi"
      />

      <CableStation stationId="chua-ba" position={w([CABLE.x, 0, CABLE.z])} rotY={CABLE.rotY} />
    </>
  )
}
