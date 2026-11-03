import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, Object3D } from 'three'
import { Bodoan, IncenseBurner } from './sacred'
import Avatar from '../player/Avatar'
import { useInteractable } from '../interaction'
import { emit, on, runtime } from '../runtime'
import { addMerit, addStat, addXu, setHolding, startActivity, useGame } from '../state'
import { INCENSE_COOLDOWN } from '../activities/constants'
import { PALETTE, toon } from '../materials'
import { seeded } from '../../lib/random'
import { groundAt } from '../world/navigation'
import { leafPalette, nearestTree, pickLeafColor } from './leafColors'
import { treeLookAt } from './treeSpecies'

/**
 * Đồ vật CÓ TƯƠNG TÁC. QUY ƯỚC: mọi `position` ở đây là toạ độ THẾ GIỚI
 * → đặt các component này NGOÀI <group position={origin}> của zone (dùng toWorld(origin, [x,y,z])).
 * rotY: hướng quay mặt trước (+Z cục bộ) của đồ vật.
 */

/** Điểm đứng trước đồ vật cách `dist` mét theo hướng mặt trước — độ cao lấy theo mặt đất
 *  (đồ vật có thể đặt trên bàn thờ cao hơn sàn, người chơi vẫn đứng dưới sàn) */
function standPoint([x, y, z], rotY, dist) {
  const sx = x + Math.sin(rotY) * dist
  const sz = z + Math.cos(rotY) * dist
  const g = groundAt(sx, sz, y)
  return [sx, g ? g.y : y, sz]
}

/** Thời gian hiện tại, cập nhật mỗi `ms` (để hương tự tắt sau 10 phút) */
function useNow(ms = 30000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

/** Lư hương có thể thắp. Hương của người chơi cháy 10 phút (lưu cả khi tải lại trang). */
export function IncenseSpot({ id, name, position, rotY = 0, scale = 1, baseSticks = 0 }) {
  const litAt = useGame((s) => s.save.cooldowns[`huong:${id}`])
  // Người khác (online) vừa thắp hương ở lư này
  const [othersLitAt, setOthersLitAt] = useState(0)
  useEffect(() => on('incense-lit', (e) => e.remote && e.spotId === id && setOthersLitAt(Date.now())), [id])
  const now = useNow()
  const burning = litAt && now - new Date(litAt).getTime() < INCENSE_COOLDOWN
  const othersBurning = othersLitAt && Math.max(now, othersLitAt) - othersLitAt < INCENSE_COOLDOWN
  const stand = useMemo(() => standPoint(position, rotY, 1.6 * scale + 0.4), [position, rotY, scale])
  useInteractable({
    id: `huong:${id}`,
    position,
    radius: 2.6 * scale,
    label: name,
    verb: 'Thắp hương',
    onInteract: () => startActivity('thap-huong', { spotId: id, name, stand, face: position }),
  })
  return (
    <group position={position} rotation-y={rotY}>
      <IncenseBurner scale={scale} sticks={baseSticks + (burning ? 3 : 0) + (othersBurning ? 3 : 0)} />
    </group>
  )
}

/** Bồ đoàn để ngồi niệm Phật (hoặc thiền — activity = 'thien-dinh'); params: tham số thêm cho hoạt động (vd. sessions) */
export function PrayerSeat({ id, name, position, rotY = 0, activity = 'niem-phat', verb, color, params }) {
  const face = useMemo(() => standPoint(position, rotY, 3), [position, rotY])
  useInteractable({
    id: `seat:${id}`,
    position,
    radius: 1.5,
    label: name,
    verb: verb ?? (activity === 'thien-dinh' ? 'Ngồi thiền' : 'Ngồi niệm Phật'),
    onInteract: () => startActivity(activity, { seatId: id, name, stand: position, face, ...params }),
  })
  return <Bodoan position={position} color={color} />
}

/** Bia đá khắc pháp ngữ — đọc để khám phá (sưu tầm bia trên khắp núi) */
export function Stele({ id, position, rotY = 0, quoteId }) {
  const found = useGame((s) => s.save.discovered.steles.includes(id))
  const stone = toon(PALETTE.graniteDark, { flat: true })
  const face = toon('#b9b3a6')
  useInteractable({
    id: `bia:${id}`,
    position,
    radius: 2,
    label: found ? 'Bia pháp ngữ (đã đọc)' : 'Bia đá khắc chữ',
    verb: 'Đọc bia',
    onInteract: () => startActivity('doc-bia', { steleId: id, quoteId, stand: standPoint(position, rotY, 1.3), face: position }),
  })
  return (
    <group position={position} rotation-y={rotY}>
      <mesh position={[0, 0.2, 0]} material={stone} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.4, 0.7]} />
      </mesh>
      <mesh position={[0, 1.15, 0]} material={stone} castShadow>
        <boxGeometry args={[1, 1.6, 0.22]} />
      </mesh>
      <mesh position={[0, 1.15, 0.115]} material={face}>
        <planeGeometry args={[0.78, 1.3]} />
      </mesh>
      <mesh position={[0, 2.05, 0]} material={stone} castShadow>
        <boxGeometry args={[1.2, 0.22, 0.34]} />
      </mesh>
      {!found && (
        <mesh position={[0, 2.5, 0]} material={toon(PALETTE.gold, { emissive: PALETTE.gold, emissiveIntensity: 0.6 })}>
          <octahedronGeometry args={[0.14, 0]} />
        </mesh>
      )}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Quét lá                                                            */
/* ------------------------------------------------------------------ */

/** Giá để chổi tre: lấy / cất chổi */
export function BroomRack({ id, position, rotY = 0 }) {
  const holding = useGame((s) => s.ui.holding)
  useInteractable({
    id: `choi:${id}`,
    position,
    radius: 2,
    label: 'Giá chổi tre',
    verb: holding === 'broom' ? 'Cất chổi' : 'Lấy chổi quét lá',
    onInteract: () => {
      const next = holding === 'broom' ? null : 'broom'
      setHolding(next)
      if (next) emit('toast', { title: 'Đã cầm chổi', description: 'Đi qua chỗ có lá rụng để quét sân chùa.' })
    },
  })
  const wood = toon(PALETTE.woodDark)
  const straw = toon('#c9a95b')
  return (
    <group position={position} rotation-y={rotY}>
      <mesh position={[0, 0.9, 0]} material={wood} castShadow>
        <boxGeometry args={[1.6, 0.08, 0.08]} />
      </mesh>
      {[-0.75, 0.75].map((x) => (
        <mesh key={x} position={[x, 0.5, 0]} material={wood}>
          <boxGeometry args={[0.08, 1, 0.3]} />
        </mesh>
      ))}
      {holding !== 'broom' &&
        [-0.4, 0, 0.4].map((x) => (
          <group key={x} position={[x, 0.65, 0.12]} rotation-z={0.08}>
            <mesh material={wood}>
              <cylinderGeometry args={[0.02, 0.02, 1.2, 5]} />
            </mesh>
            <mesh position={[0, -0.55, 0]} material={straw}>
              <coneGeometry args={[0.16, 0.3, 7, 1, true]} />
            </mesh>
          </group>
        ))}
    </group>
  )
}

// Sân không có cây toả bóng (hiếm): lá khô vàng nâu chung chung
const LEAF_COLORS = ['#d9a441', '#c9772e', '#a8642f', '#e0b85a', '#8a6a35'].map((c) => new Color(c))

/** Màu lá theo cây gần nhất (lá rơi phải giống tán cây phía trên) */
function leafColorAt(rand, trees, x, z) {
  const t = nearestTree(trees, x, z)
  if (!t) return LEAF_COLORS[Math.floor(rand() * LEAF_COLORS.length)]
  // Cùng logic chọn loài/màu với BigTree (cây không truyền màu tự chọn loài theo vị trí gốc)
  const { color } = treeLookAt(t.x, t.z, { color: t.color, species: t.species })
  return pickLeafColor(rand, leafPalette(color))
}
const dummy = new Object3D()
const REGROW_SECONDS = 9
const FALL_SECONDS = 3.6

/**
 * Chọn một điểm lá rơi: phần lớn dưới tán cây (gần gốc hơn thì dày hơn), số ít rải khắp sân.
 * Kẹp trong vùng sân để lá không rơi ra ngoài mặt đi được.
 */
function leafSpot(rand, { cx, cz, w, d, trees }) {
  let x
  let z
  if (trees.length && rand() < 0.78) {
    const t = trees[Math.floor(rand() * trees.length)]
    const r = Math.sqrt(rand()) * 4.6 * (t.scale ?? 1)
    const a = rand() * Math.PI * 2
    x = t.x + Math.cos(a) * r
    z = t.z + Math.sin(a) * r
  } else {
    x = cx + (rand() - 0.5) * w
    z = cz + (rand() - 0.5) * d
  }
  return [Math.max(cx - w / 2, Math.min(cx + w / 2, x)), Math.max(cz - d / 2, Math.min(cz + d / 2, z))]
}

/**
 * Sân có lá rụng. Khi người chơi cầm chổi đi qua, lá bay gom lại và biến mất; lá rụng lại theo thời gian.
 * Mỗi 5 lá: +2 công đức (và +`xuPerFive` xu — dùng cho sân công quả dưới chân núi).
 * center/y: toạ độ thế giới; w×d: kích thước vùng.
 * trees: [{ x, z, scale?, color? }] toạ độ THẾ GIỚI các cây toả bóng (zone tự vẽ cây) — lá dồn dưới tán, màu lá theo màu tán,
 *        và lá mới rụng từ trên tán xuống, xoay lả tả (kể cả khi chưa ai quét, cho cảnh sống động).
 */
export function LeafField({ id, center, w, d, count = 60, seed = 7, xuPerFive = 0, trees = [] }) {
  const [cx, cy, cz] = center
  const mesh = useRef()
  const area = useMemo(() => ({ cx, cz, w, d, trees }), [cx, cz, w, d, trees])
  const leaves = useMemo(() => {
    const rand = seeded(seed)
    return Array.from({ length: count }, () => {
      const [x, z] = leafSpot(rand, area)
      return {
      x,
      z,
      rot: rand() * Math.PI * 2,
      s: 0.7 + rand() * 0.6,
      color: leafColorAt(rand, area.trees, x, z),
      state: 'down', // down | flying | gone | falling
      t: 0,
      vx: 0,
      vz: 0,
      fromX: 0,
      fromZ: 0,
      fromY: 0,
      }
    })
  }, [area, count, seed])
  const fallRand = useMemo(() => seeded(seed * 7 + 1), [seed])
  const pending = useRef({ n: 0, timer: 0, forMerit: 0 })
  const regrow = useRef(0)

  useLayoutEffect(() => {
    leaves.forEach((l, i) => mesh.current.setColorAt(i, l.color))
    mesh.current.instanceColor.needsUpdate = true
  }, [leaves])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const p = runtime.player
    const sweeping = p.holding === 'broom' && Math.abs(p.position.y - cy) < 2
    // Điểm chổi chạm đất: trước mặt nhân vật
    const bx = p.position.x + Math.sin(p.rotY) * 0.75
    const bz = p.position.z + Math.cos(p.rotY) * 0.75

    regrow.current += dt
    let regrowOne = false
    // Có cây: lá rơi đều hơn (mỗi ~4 giây một chiếc) cho cảnh sân chùa sống động
    if (regrow.current > (trees.length ? 4 : REGROW_SECONDS)) {
      regrow.current = 0
      regrowOne = true
    }
    // Không còn chỗ trống (chưa ai quét) mà có cây → cho một chiếc lá cũ bay lên tán rồi rụng lại chỗ khác
    let colorDirty = false
    const recycle = regrowOne && trees.length && !leaves.some((l) => l.state === 'gone') ? Math.floor(fallRand() * leaves.length) : -1

    leaves.forEach((l, i) => {
      if (i === recycle && l.state === 'down') l.state = 'gone'
      if (l.state === 'down' && sweeping && Math.hypot(l.x - bx, l.z - bz) < 1.15) {
        l.state = 'flying'
        l.t = 0
        const ang = p.rotY + (Math.random() - 0.5) * 1.2
        l.vx = Math.sin(ang) * 2.4
        l.vz = Math.cos(ang) * 2.4
        pending.current.n++
      }
      if (l.state === 'flying') {
        l.t += dt
        l.x += l.vx * dt
        l.z += l.vz * dt
        if (l.t > 0.7) l.state = 'gone'
      }
      if (regrowOne && l.state === 'gone') {
        // Lá mới rụng: bắt đầu từ tán cây (nếu có) và đáp xuống dưới tán
        const [tx, tz] = leafSpot(fallRand, area)
        const tree = trees.length ? trees.reduce((a, b) => (Math.hypot(b.x - tx, b.z - tz) < Math.hypot(a.x - tx, a.z - tz) ? b : a)) : null
        l.state = 'falling'
        l.t = 0
        l.x = tx
        l.z = tz
        l.fromX = tree ? tree.x + (tx - tree.x) * 0.5 : tx
        l.fromZ = tree ? tree.z + (tz - tree.z) * 0.5 : tz
        l.fromY = tree ? 4.2 * (tree.scale ?? 1) + fallRand() * 1.4 : 4
        // Lá mới mang màu của cây nó rụng xuống
        l.color = leafColorAt(fallRand, trees, tx, tz)
        mesh.current.setColorAt(i, l.color)
        colorDirty = true
        regrowOne = false
      }
      if (l.state === 'falling') {
        l.t += dt
        if (l.t > FALL_SECONDS) l.state = 'down'
      }
      let y = cy + 0.03
      let scale = l.s * 0.22
      let spin = 0
      if (l.state === 'flying') {
        y += Math.sin((l.t / 0.7) * Math.PI) * 0.5
        scale *= 1 - l.t / 0.7
        spin = l.t * 12
      } else if (l.state === 'falling') {
        // Rơi chậm dần, đung đưa qua lại như lá thật
        const k = l.t / FALL_SECONDS
        y += (1 - k) * l.fromY
        spin = l.t * 2.2
      } else if (l.state === 'gone') {
        scale = 0.0001
      }
      const k = l.state === 'falling' ? l.t / FALL_SECONDS : 1
      const sway = l.state === 'falling' ? Math.sin(l.t * 2.6 + i) * 0.5 * (1 - k) : 0
      dummy.position.set(l.fromX + (l.x - l.fromX) * k + sway, y, l.fromZ + (l.z - l.fromZ) * k)
      dummy.rotation.set(-Math.PI / 2 + Math.sin(spin) * 0.5, 0, l.rot + spin)
      dummy.scale.set(scale, scale * 1.6, scale)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
    if (colorDirty) mesh.current.instanceColor.needsUpdate = true

    // Gom kết quả, ghi state thưa thớt (không ghi mỗi frame)
    const pd = pending.current
    pd.timer += dt
    if (pd.n > 0 && pd.timer > 0.6) {
      pd.timer = 0
      const n = pd.n
      pd.n = 0
      addStat('la', n)
      pd.forMerit += n
      if (pd.forMerit >= 5) {
        const chunks = Math.floor(pd.forMerit / 5)
        pd.forMerit -= chunks * 5
        addMerit(chunks * 2, xuPerFive ? 'Quét lá công quả' : 'Quét lá sân chùa', [p.position.x, p.position.y + 1.8, p.position.z])
        if (xuPerFive) addXu(chunks * xuPerFive, 'Quét lá')
      }
    }
  })

  return (
    <instancedMesh ref={mesh} args={[null, null, leaves.length]} material={toon('#ffffff', { flat: true })} receiveShadow name={`la-${id}`}>
      <circleGeometry args={[1, 5]} />
    </instancedMesh>
  )
}

/* ------------------------------------------------------------------ */
/* Nhân vật không điều khiển (NPC)                                    */
/* ------------------------------------------------------------------ */

/**
 * NPC đứng/ngồi tại chỗ, bấm để trò chuyện (mở hoạt động 'hoi-chuyen' với dialogueId).
 * look: { role, outfit, skin, hair } giống hồ sơ người chơi.
 */
export function Npc({ id, name, title, position, rotY = 0, look, anim = 'idle', dialogueId }) {
  const source = useMemo(() => ({ anim, speed: 0, holding: null }), [anim])
  const ref = useRef()
  // Khi người chơi lại gần, NPC quay về phía người chơi một chút
  useFrame((_, dt) => {
    if (!ref.current) return
    const p = runtime.player.position
    const dx = p.x - position[0]
    const dz = p.z - position[2]
    const near = Math.hypot(dx, dz) < 4 && anim === 'idle'
    const target = near ? Math.atan2(dx, dz) : rotY
    let diff = (target - ref.current.rotation.y) % (Math.PI * 2)
    if (diff > Math.PI) diff -= Math.PI * 2
    if (diff < -Math.PI) diff += Math.PI * 2
    ref.current.rotation.y += diff * Math.min(1, dt * 3)
  })
  useInteractable({
    id: `npc:${id}`,
    position,
    radius: 2.4,
    label: title ? `${name} · ${title}` : name,
    verb: 'Trò chuyện',
    onInteract: () => startActivity('hoi-chuyen', { npcId: id, name, title, dialogueId, face: position }),
  })
  return (
    <group ref={ref} position={position} rotation-y={rotY}>
      <Avatar source={source} profile={look} />
    </group>
  )
}
