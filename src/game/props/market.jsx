import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide, Object3D, Vector2 } from 'three'
import Avatar from '../player/Avatar'
import { useInteractable } from '../interaction'
import { emit, runtime } from '../runtime'
import {
  addMerit,
  addStat,
  addXu,
  cooldownLeft,
  getGame,
  markCooldown,
  openPanel,
  setHolding,
  startActivity,
  updateUi,
  useGame,
} from '../state'
import { CHORE_REWARDS, STALLS } from '../shop/items'
import { COSTUMES, HATS } from '../shop/wardrobe'
import { HatModel } from '../player/Wardrobe3D'
import { PALETTE, glow, toon } from '../materials'
import { seeded } from '../../lib/random'
import { cached, vcMat } from './geom'
import { useDetail } from './detail'
import { buildStall, buildTeaStation } from './marketGeometry'

/**
 * Khu chợ & công quả dưới chân núi. QUY ƯỚC như interactive.jsx: position là toạ độ THẾ GIỚI,
 * rotY = hướng mặt trước (phía người mua/người chơi đứng).
 */

const front = ([x, y, z], rotY, dist) => [x + Math.sin(rotY) * dist, y, z + Math.cos(rotY) * dist]

/* ------------------------------------------------------------------ */
/* Sạp hàng                                                           */
/* ------------------------------------------------------------------ */

/** Sạp hàng: mái bạt sọc có rìa, quầy ván phủ khăn, kệ ba tầng, giỏ tre, bó nhang, hoa, đèn hoa đăng; người bán sau quầy */
export function MarketStall({ stallId, position, rotY = 0, night = false }) {
  const stall = STALLS[stallId]
  const stand = useMemo(() => front(position, rotY, 1.8), [position, rotY])
  const seller = useMemo(() => ({ anim: 'idle', speed: 0, holding: null }), [])
  useInteractable({
    id: `sap:${stallId}`,
    position: stand,
    radius: 2.2,
    label: stall.name,
    verb: stall.wear ? 'Xem y phục, mũ mão' : 'Ghé sạp mua đồ lễ',
    onInteract: () => startActivity(stall.wear ? 'y-phuc' : 'mua-sam', { stallId, stand, face: position }),
  })
  const detail = useDetail()
  const geo = useMemo(
    () => cached(`stall|${stall.awning}|${stall.items.join(',')}|${detail}`, () => buildStall(stall.awning, stall.items, detail)),
    [stall.awning, stall.items, detail],
  )
  return (
    <group position={position} rotation-y={rotY}>
      <mesh geometry={geo.wood} material={vcMat('wood')} castShadow receiveShadow />
      <mesh geometry={geo.cloth} material={vcMat()} castShadow receiveShadow />
      {/* Đèn sạp buổi tối */}
      <mesh position={[0, 2.3, 0]} material={night ? glow('#ffd28a') : toon('#e8dcc0')}>
        <sphereGeometry args={[0.14, 10, 8]} />
      </mesh>
      {stall.wear && <ClothesDisplay />}
      {/* Người bán đứng sau quầy (không đi lại) */}
      <group position={[0, 0, -0.35]}>
        <Avatar source={seller} profile={{ role: 'phat-tu', outfit: 'trang', hair: 'bui', skin: '#e3b48c' }} />
      </group>
    </group>
  )
}

// Áo treo dưới xà trước & mũ mão bày trên quầy của sạp y phục
const HANGING = ['ca-sa-vang', 'te-thien', 'ca-sa-do', 'than-tai']
// Dáng áo treo: vai → thân → vạt loe (dựng một lần)
const ROBE_PTS = [
  [0.0, 0.0],
  [0.07, -0.01],
  [0.17, -0.08],
  [0.16, -0.3],
  [0.2, -0.62],
  [0.0, -0.62],
].map(([r, y]) => new Vector2(r, y))
const ON_COUNTER = [
  ['non-la', -0.95, 0.225],
  ['mao-than-tai', 0.95, 0.25],
]

function ClothesDisplay() {
  return (
    <>
      {HANGING.map((id, i) => {
        const c = COSTUMES[id]
        const x = [-1.35, -0.85, 0.85, 1.35][i]
        return (
          <group key={id} position={[x, 2.38, 0.86]}>
            {/* Móc treo + thân áo + vạt áo (dẹt như treo trên mắc) */}
            <mesh material={toon('#5a3a22')} position={[0, 0.03, 0]}>
              <torusGeometry args={[0.04, 0.008, 4, 10, Math.PI]} />
            </mesh>
            <mesh material={toon(c.kasaya?.color ?? c.robe, { side: DoubleSide })} scale={[1, 1, 0.3]} castShadow>
              <latheGeometry args={[ROBE_PTS, 12]} />
            </mesh>
            <mesh material={toon(c.sash)} position={[0, -0.3, 0]} scale={[1, 0.25, 0.32]}>
              <cylinderGeometry args={[0.165, 0.165, 0.1, 12]} />
            </mesh>
          </group>
        )
      })}
      {ON_COUNTER.map(([id, x, base]) => (
        <group key={id} position={[x, 1.035 - base, 0.45]} rotation-y={0.4}>
          <HatModel hat={HATS[id]} />
        </group>
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Nhặt rác                                                           */
/* ------------------------------------------------------------------ */

// Loại rác: chai nhựa, lon nước, túi ni lông (lon xuất hiện nhiều hơn)
const TRASH_KINDS = [{ geo: 'bottle' }, { geo: 'can' }, { geo: 'bag' }, { geo: 'can' }]
const dummy = new Object3D()
const RESPAWN_SECONDS = 14

/**
 * Rác rơi vãi trên quảng trường: đi ngang qua là nhặt (không cần dụng cụ).
 * Mỗi món: +1 xu, +2 công đức, thống kê 'rac'. Thỉnh thoảng có rác mới (khách bất cẩn…).
 */
export function TrashField({ id, center, w, d, count = 14, seed = 5 }) {
  const [cx, cy, cz] = center
  const bottleRef = useRef()
  const canRef = useRef()
  const bagRef = useRef()
  const items = useMemo(() => {
    const rand = seeded(seed)
    return Array.from({ length: count }, () => {
      const kind = TRASH_KINDS[Math.floor(rand() * TRASH_KINDS.length)]
      return { x: cx + (rand() - 0.5) * w, z: cz + (rand() - 0.5) * d, rot: rand() * 6.28, kind, alive: true, t: 0 }
    })
  }, [cx, cz, w, d, count, seed])
  const byGeo = useMemo(() => {
    const out = { bottle: [], can: [], bag: [] }
    items.forEach((it, i) => out[it.kind.geo].push(i))
    return out
  }, [items])
  const respawn = useRef(0)
  const pending = useRef({ n: 0, timer: 0 })
  const meshFor = (geo) => (geo === 'bottle' ? bottleRef : geo === 'can' ? canRef : bagRef).current

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const p = runtime.player.position
    const near = Math.abs(p.y - cy) < 2
    respawn.current += dt
    let spawnOne = respawn.current > RESPAWN_SECONDS
    if (spawnOne) respawn.current = 0

    items.forEach((it) => {
      if (it.alive && near && !runtime.player.locked && Math.hypot(it.x - p.x, it.z - p.z) < 0.85) {
        it.alive = false
        it.t = 0
        pending.current.n++
      }
      if (!it.alive) it.t += dt
      if (spawnOne && !it.alive && it.t > 4) {
        it.alive = true
        it.x = cx + (Math.random() - 0.5) * w
        it.z = cz + (Math.random() - 0.5) * d
        spawnOne = false
      }
    })

    for (const geo of Object.keys(byGeo)) {
      const mesh = meshFor(geo)
      if (!mesh) continue
      byGeo[geo].forEach((idx, j) => {
        const it = items[idx]
        // Món vừa nhặt: bay lên và thu nhỏ trong 0.4 giây
        const pick = it.alive ? 0 : Math.min(1, it.t / 0.4)
        const s = it.alive ? 1 : 1 - pick
        dummy.position.set(it.x, cy + (geo === 'bag' ? 0.08 : 0.06) + pick * 1.2, it.z)
        dummy.rotation.set(geo === 'bag' ? 0 : Math.PI / 2, it.rot, 0)
        dummy.scale.setScalar(Math.max(0.0001, s))
        dummy.updateMatrix()
        mesh.setMatrixAt(j, dummy.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    }

    const pd = pending.current
    pd.timer += dt
    if (pd.n > 0 && pd.timer > 0.4) {
      pd.timer = 0
      const n = pd.n
      pd.n = 0
      addStat('rac', n)
      addXu(n * CHORE_REWARDS.rac.xu, 'Nhặt rác')
      addMerit(n * CHORE_REWARDS.rac.merit, 'Giữ sạch núi', [p.x, p.y + 1.8, p.z])
    }
  })

  return (
    <group name={`rac-${id}`}>
      {byGeo.bottle.length > 0 && (
        <instancedMesh ref={bottleRef} args={[null, null, byGeo.bottle.length]} material={toon('#5fa8d3', { transparent: true, opacity: 0.85 })} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.26, 8]} />
        </instancedMesh>
      )}
      {byGeo.can.length > 0 && (
        <instancedMesh ref={canRef} args={[null, null, byGeo.can.length]} material={toon('#c0392b')} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.13, 8]} />
        </instancedMesh>
      )}
      {byGeo.bag.length > 0 && (
        <instancedMesh ref={bagRef} args={[null, null, byGeo.bag.length]} material={toon('#f4f1ea')} castShadow>
          <icosahedronGeometry args={[0.12, 0]} />
        </instancedMesh>
      )}
    </group>
  )
}

/** Thùng rác phân loại (trang trí, nhắc ý thức giữ gìn) */
export function TrashBin({ position, rotY = 0 }) {
  return (
    <group position={position} rotation-y={rotY}>
      {[
        ['#2e7d6b', -0.32],
        ['#d9a441', 0.32],
      ].map(([c, x]) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.42, 0]} material={toon(c)} castShadow>
            <cylinderGeometry args={[0.26, 0.22, 0.84, 10]} />
          </mesh>
          <mesh position={[0, 0.88, 0]} material={toon('#3a3a3a')}>
            <cylinderGeometry args={[0.28, 0.28, 0.08, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Mời trà khách hành hương                                           */
/* ------------------------------------------------------------------ */

const TRAY_CUPS = 3
const THIRST_COOLDOWN = 3 * 60 * 1000

/** Trạm trà miễn phí: lấy khay (3 chén) hoặc cất khay */
export function TeaStation({ id, position, rotY = 0 }) {
  const holding = useGame((s) => s.ui.holding)
  const stand = useMemo(() => front(position, rotY, 1.4), [position, rotY])
  useInteractable({
    id: `tra:${id}`,
    position: stand,
    radius: 2,
    label: 'Trạm trà miễn phí',
    verb: holding === 'tea' ? 'Cất khay trà' : 'Bưng khay trà mời khách',
    onInteract: () => {
      if (getGame().ui.holding === 'tea') {
        setHolding(null)
        updateUi({ teaCups: 0 })
        return
      }
      setHolding('tea')
      updateUi({ teaCups: TRAY_CUPS })
      emit('toast', { title: 'Đã bưng khay ba chén trà', description: 'Tìm khách hành hương đang mỏi chân (có biểu tượng chén trà) để mời.' })
    },
  })
  const detail = useDetail()
  const geo = useMemo(() => cached(`tea-station|${detail}`, () => buildTeaStation(detail)), [detail])
  return (
    <group position={position} rotation-y={rotY}>
      <mesh geometry={geo.wood} material={vcMat('wood')} castShadow receiveShadow />
      <mesh geometry={geo.cloth} material={vcMat()} castShadow />
    </group>
  )
}

/** Băng ghế đá */
export function StoneBench({ position, rotY = 0 }) {
  const stone = toon(PALETTE.stoneDark)
  return (
    <group position={position} rotation-y={rotY}>
      <mesh position={[0, 0.42, 0]} material={stone} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.12, 0.55]} />
      </mesh>
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.2, 0]} material={stone}>
          <boxGeometry args={[0.2, 0.4, 0.45]} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Khách hành hương ngồi nghỉ trên ghế. Khi khát (chưa được mời trong 3 phút) có biểu tượng chén trà
 * nổi trên đầu; người chơi bưng khay tới mời: +3 xu, +6 công đức, thống kê 'tra'.
 */
export function ThirstyPilgrim({ id, name, position, rotY = 0, look }) {
  const holding = useGame((s) => s.ui.holding)
  const servedAt = useGame((s) => s.save.cooldowns[`tra:${id}`])
  const thirsty = !servedAt || cooldownLeft(`tra:${id}`, THIRST_COOLDOWN) === 0
  // Ngồi ghế bình thường (chân buông xuống đất), gốc nhân vật ở tâm mặt ghế trên mặt sân
  const source = useMemo(() => ({ anim: 'seated', speed: 0, holding: null }), [])
  const bubble = useRef()
  useFrame((state) => {
    if (bubble.current) bubble.current.position.y = 1.75 + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.06
  })
  useInteractable({
    id: `khach:${id}`,
    position,
    radius: 2.2,
    label: `${name} · khách hành hương`,
    verb: thirsty ? (holding === 'tea' ? 'Mời trà' : 'Hỏi thăm') : 'Chào hỏi',
    onInteract: () => {
      const ui = getGame().ui
      const stillThirsty = cooldownLeft(`tra:${id}`, THIRST_COOLDOWN) === 0
      if (!stillThirsty) {
        emit('toast', { title: name, description: '"Cảm ơn con, uống chén trà xong bác đỡ mỏi chân hẳn."' })
        return
      }
      if (ui.holding !== 'tea' || ui.teaCups <= 0) {
        emit('toast', { title: name, description: '"Leo nãy giờ khát quá… Trạm trà miễn phí ở gần lối lên bậc đá đó con."' })
        return
      }
      const cups = ui.teaCups - 1
      updateUi({ teaCups: cups })
      if (cups <= 0) setHolding(null)
      markCooldown(`tra:${id}`)
      addStat('tra')
      addXu(CHORE_REWARDS.tra.xu, 'Mời trà')
      addMerit(CHORE_REWARDS.tra.merit, 'Mời trà khách hành hương', [position[0], position[1] + 1.8, position[2]])
      emit('toast', { title: name, description: '"Quý hoá quá, A Di Đà Phật! Chúc con lên núi bình an."' })
    },
  })
  return (
    <group position={position} rotation-y={rotY}>
      <StoneBench position={[0, 0, -0.1]} />
      <group position={[0, 0, -0.08]}>
        <Avatar source={source} profile={look} />
      </group>
      {thirsty && (
        <group ref={bubble} position={[0, 1.75, 0]}>
          <mesh material={glow('#ffffff', 0.9)}>
            <sphereGeometry args={[0.2, 12, 10]} />
          </mesh>
          <mesh position={[0, -0.02, 0.12]} material={toon('#8a4b2a')}>
            <cylinderGeometry args={[0.07, 0.055, 0.09, 10]} />
          </mesh>
        </group>
      )}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Bảng việc công quả                                                 */
/* ------------------------------------------------------------------ */

export function NoticeBoard({ position, rotY = 0 }) {
  const stand = useMemo(() => front(position, rotY, 1.4), [position, rotY])
  useInteractable({
    id: 'bang-cong-qua',
    position: stand,
    radius: 2,
    label: 'Bảng việc công quả',
    verb: 'Xem việc hôm nay',
    onInteract: () => openPanel('quests'),
  })
  const wood = toon(PALETTE.woodDark)
  const paper = toon('#f5efe0')
  return (
    <group position={position} rotation-y={rotY}>
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} position={[x, 1, 0]} material={wood} castShadow>
          <boxGeometry args={[0.12, 2, 0.12]} />
        </mesh>
      ))}
      <mesh position={[0, 1.35, 0]} material={toon(PALETTE.wood)} castShadow>
        <boxGeometry args={[2, 1.1, 0.08]} />
      </mesh>
      {[
        [-0.5, 1.55],
        [0.1, 1.5],
        [0.6, 1.6],
        [-0.3, 1.1],
        [0.4, 1.12],
      ].map(([x, y]) => (
        <mesh key={`${x}${y}`} position={[x, y, 0.05]} rotation-z={(x * 7) % 0.2} material={paper}>
          <planeGeometry args={[0.42, 0.34]} />
        </mesh>
      ))}
      <mesh position={[0, 2.05, 0]} rotation-z={Math.PI / 2} material={toon(PALETTE.roof)}>
        <cylinderGeometry args={[0.05, 0.05, 2.3, 4]} />
      </mesh>
    </group>
  )
}
