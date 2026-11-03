import { Gate, Railing } from '../props/architecture'
import ColorGrove from '../props/ColorGrove'
import { Bamboo, BigTree } from '../props/nature'
import { MAPLE } from '../props/foliage'
import { DecorSet } from '../props/decor'
import { Lantern, LotusPond, StoneLantern } from '../props/sacred'
import { BroomRack, LeafField, Npc } from '../props/interactive'
import { MarketStall, NoticeBoard, TeaStation, ThirstyPilgrim, TrashBin, TrashField } from '../props/market'
import { CableStation } from '../props/CableStation'
import { FloatingLanterns } from '../props/FloatingLanterns'
import { useColliders, useInteractable } from '../interaction'
import { getGame, startActivity } from '../state'
import { emit } from '../runtime'
import {
  BAMBOO,
  BODHI,
  BROOM,
  CABLE,
  COLLIDERS,
  DECOR,
  DECOR_COLLIDERS,
  GUIDE_NPC,
  HOA_DANG,
  LEAF_FIELDS,
  LEAF_TREES,
  NOTICE,
  O,
  PILGRIMS,
  POND,
  STALLS_AT,
  STALL_X,
  TEA,
  TRASH_BINS,
  TRASH_FIELDS,
  w,
} from './chan-nui/data'

/**
 * KHU VỰC: Chân núi — chợ nhang & công quả (không có chùa; chùa chỉ ở lưng chừng núi và trên đỉnh).
 * Quảng trường 76×54 m (x −38..38, z −27..27) ở độ cao 0. Cổng ở mép +Z, lối lên bậc đá ở mép −Z.
 *
 * Vòng chơi: làm công quả (nhặt rác, quét lá, mời trà) → nhận xu → mua nhang/hoa/đèn ở sạp
 * → lên chùa Bà, chùa Hang, đỉnh núi để thắp hương, lễ Phật.
 *
 * Mẫu chuẩn cho mọi zone:
 *  - Đồ trang trí tĩnh nằm trong <group position={O}> với toạ độ CỤC BỘ.
 *  - Đồ có tương tác đặt NGOÀI group với toạ độ THẾ GIỚI qua w([x,y,z]).
 *  - Vật cản đăng ký một lần bằng useColliders(key, list CỤC BỘ, O).
 *  - Bố cục, vật cản & đồ trang trí (DecorSet) khai báo thuần JS trong ./chan-nui/data.js để test được.
 */
const toWorldTrees = (list) => list.map((t) => ({ ...t, x: t.x + O[0], z: t.z + O[2] }))
const LEAF_TREES_WORLD = { san: toWorldTrees(LEAF_TREES.san), cayDa: toWorldTrees(LEAF_TREES.cayDa) }

export default function ChanNui({ night }) {
  useColliders('chan-nui', COLLIDERS, O)
  useColliders('chan-nui-decor', DECOR_COLLIDERS, O)

  // Hồ sen: nơi thả đèn hoa đăng (cần đèn trong túi — mua ở sạp đèn)
  useInteractable({
    id: 'hoa-dang:chan-nui',
    position: w([HOA_DANG.x, 0, HOA_DANG.z]),
    radius: 2.4,
    label: 'Hồ sen chân núi',
    verb: 'Thả đèn hoa đăng',
    onInteract: () => {
      if (getGame().save.inventory.den <= 0) {
        emit('toast', { title: 'Bạn chưa có đèn hoa đăng', description: 'Ghé sạp đèn chú Bảy bên trái quảng trường để thỉnh một chiếc nhé.' })
        return
      }
      startActivity('hoa-dang', { pondId: 'chan-nui', stand: w([HOA_DANG.stand[0], 0, HOA_DANG.stand[1]]), face: w([POND.x, 0, POND.z]) })
    },
  })

  return (
    <>
      {/* Rặng cây nhiều màu quanh khu vực (đỏ, cam, vàng, hồng, tím) */}
      <ColorGrove zoneId="chan-nui" count={36} seed={11} />
      <group position={O}>
        <Gate w={12} position={[0, 0, 22]} />
        {/* Lối đi chính lát đá từ cổng tới chân bậc */}
        <mesh position={[0, 0.01, 0]} rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[6, 52]} />
          <meshToonMaterial color="#d6c9ae" />
        </mesh>

        {[...LEAF_TREES.san, ...LEAF_TREES.cayDa].map((t) => (
          <BigTree key={`${t.x},${t.z}`} position={[t.x, 0, t.z]} scale={t.scale} color={t.color} />
        ))}
        <BigTree position={[BODHI.x, 0, BODHI.z]} scale={0.95} color={MAPLE.doTham} />
        {BAMBOO.map((b) => (
          <Bamboo key={b.seed} position={[b.x, 0, b.z]} seed={b.seed} height={b.height} />
        ))}

        <LotusPond position={[POND.x, 0, POND.z]} w={POND.w} d={POND.d} />
        {TRASH_BINS.map(([x, z]) => (
          <TrashBin key={z} position={[x, 0, z]} />
        ))}

        {/* Lan can hai bên lối lên bậc đá */}
        <Railing from={[-3.6, -18]} to={[-3.6, -27]} />
        <Railing from={[3.6, -18]} to={[3.6, -27]} />

        {/* Đèn dọc lối chính */}
        {[-14, -4, 8, 16].map((z) => (
          <group key={z}>
            <StoneLantern position={[-3.8, 0, z]} lit={night} />
            <StoneLantern position={[3.8, 0, z]} lit={night} />
          </group>
        ))}
        {[-4, 0, 4].map((x) => (
          <Lantern key={x} position={[x, 3.4, 22.2]} hang={0.6} lit={night} light={x === 0} />
        ))}

        {/* Đồ trang trí: rào tre, bonsai, đèn lồng dây, giỏ hàng, lu nước, bàn ghế đá, chậu sen, luống hoa… */}
        <DecorSet items={DECOR} night={night} />
      </group>

      {/* ---- Chợ nhang (toạ độ thế giới) ---- */}
      {STALLS_AT.map((s) => (
        <MarketStall key={s.id} stallId={s.id} position={w([STALL_X, 0, s.z])} rotY={Math.PI / 2} night={night} />
      ))}

      {/* ---- Công quả ---- */}
      <NoticeBoard position={w([NOTICE.x, 0, NOTICE.z])} rotY={NOTICE.rot} />
      <BroomRack id="chan-nui" position={w([BROOM.x, 0, BROOM.z])} rotY={BROOM.rot} />
      {LEAF_FIELDS.map((f) => (
        <LeafField key={f.id} id={f.id} center={w([f.x, 0, f.z])} w={f.w} d={f.d} count={f.count} seed={f.seed} xuPerFive={1} trees={LEAF_TREES_WORLD[f.trees]} />
      ))}
      {TRASH_FIELDS.map((f) => (
        <TrashField key={f.id} id={f.id} center={w([f.x, 0, f.z])} w={f.w} d={f.d} count={f.count} seed={f.seed} />
      ))}
      <TeaStation id="chan-nui" position={w([TEA.x, 0, TEA.z])} rotY={TEA.rot} />
      {PILGRIMS.map((p) => (
        <ThirstyPilgrim key={p.id} id={p.id} name={p.name} position={w([p.x, 0, p.z])} rotY={p.rot} look={p.look} />
      ))}

      <FloatingLanterns pondId="chan-nui" center={w([POND.x, 0.22, POND.z])} w={POND.w} d={POND.d} />

      <Npc
        id="chu-tieu-dan-duong"
        name="Chú tiểu Minh An"
        title="dẫn đường"
        position={w([GUIDE_NPC.x, 0, GUIDE_NPC.z])}
        rotY={GUIDE_NPC.rot}
        look={{ role: 'chu-tieu', outfit: 'nau', skin: '#eec09a' }}
        dialogueId="chao-mung"
      />

      <CableStation stationId="chan-nui" position={w([CABLE.x, 0, CABLE.z])} rotY={CABLE.rotY} />
    </>
  )
}
