import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide, MeshBasicMaterial } from 'three'
import { useInteractable } from '../interaction'
import { on, runtime } from '../runtime'
import { playBell } from '../../lib/sound'
import { startActivity } from '../state'
import { BellTower } from './sacred'
import { PALETTE, toon } from '../materials'
import { PENDULUM, releaseVelocity, stepPendulum } from '../activities/chuongLogic'

/**
 * HỢP ĐỒNG API — các zone dùng những component này; phần hoạt động (activities) hoàn thiện hành vi.
 * Mọi position là toạ độ THẾ GIỚI; rotY là hướng mặt trước của đồ vật (người chơi đứng phía trước, nhìn vào).
 *
 *  <BellSpot id name position rotY />        gác chuông → hoạt động 'thinh-chuong' (params: towerId, name, stand, face)
 *  <AltarSpot id name position rotY />       tấm chiếu lạy trước bàn thờ → 'le-phat' (params: altarId, name, stand, face)
 *  <SutraLectern id name position rotY />    án thư đặt kinh → 'tung-kinh' (params: lecternId, name, stand, face)
 *  <FloatingLanterns pondId center w d />    (props/FloatingLanterns.jsx) đèn hoa đăng trôi trên hồ
 */

function front([x, y, z], rotY, dist) {
  return [x + Math.sin(rotY) * dist, y, z + Math.cos(rotY) * dist]
}

/* ---------------- Gác chuông ---------------- */

/** Chày gỗ treo bằng hai dây: điểm treo phía trước chuông, chạm chuông khi góc = PENDULUM.contact */
const LOG_HALF = 0.5
const BELL_Y = 2.4 // tâm thân chuông (cục bộ gác chuông)
const BELL_R = 0.635 // bán kính thân chuông ở độ cao chày
const PIVOT = [0, BELL_Y + PENDULUM.length, BELL_R + LOG_HALF + PENDULUM.length * Math.sin(PENDULUM.contact)]
const WAVES = 2

function isOriginalLog(o) {
  const g = o.geometry
  return o.isMesh && g?.type === 'CylinderGeometry' && g.parameters?.height === 1.4 && g.parameters?.radiusTop === 0.12
}

/**
 * Gác chuông: lắng nghe 'bell-pull' (đang kéo chày) và 'bell-ring' (thả chày) từ hoạt động Thỉnh chuông.
 * Chày gỗ là con lắc (chuongLogic.stepPendulum); khi chạm chuông: chuông rung nhẹ + vòng sóng âm lan toả.
 */
export function BellSpot({ id, name = 'Gác chuông', position, rotY = 0 }) {
  // Đứng sát sau đuôi chày để hai tay nắm được dây kéo
  const stand = useMemo(() => front(position, rotY, 1.95), [position, rotY])
  useInteractable({
    id: `chuong:${id}`,
    position: stand,
    radius: 2.4,
    label: name,
    verb: 'Thỉnh chuông',
    onInteract: () => startActivity('thinh-chuong', { towerId: id, name, stand, face: position }),
  })

  const tower = useRef(null)
  const pivot = useRef(null)
  const log = useRef(null)
  const waves = useRef([])
  const sim = useRef({ angle: 0, vel: 0, pull: 0, searched: false, hang: null, shakeT: -1, shakeAmp: 0, waveT: -1, waveAmp: 0 })

  useEffect(() => {
    const offPull = on('bell-pull', ({ towerId, pull }) => {
      if (towerId === id) sim.current.pull = pull
    })
    const offRing = on('bell-ring', ({ towerId, power, remote }) => {
      if (towerId !== id) return
      sim.current.pull = 0
      sim.current.vel = releaseVelocity(power)
      // Người khác (online) thỉnh chuông: mình nghe tiếng ngân, càng xa càng nhỏ
      if (remote) {
        const p = runtime.player.position
        const d = Math.hypot(p.x - position[0], p.z - position[2])
        playBell({ strong: power > 0.6, pitch: 110, volume: Math.max(0.12, 1 - d / 140) })
      }
    })
    return () => {
      offPull()
      offRing()
    }
  }, [id, position])

  const waveMats = useMemo(
    () => Array.from({ length: WAVES }, () => new MeshBasicMaterial({ color: '#ffe0a0', transparent: true, opacity: 0, depthWrite: false, side: DoubleSide, toneMapped: false })),
    [],
  )
  useEffect(() => () => waveMats.forEach((m) => m.dispose()), [waveMats])

  useFrame((_, rawDt) => {
    const s = sim.current
    const dt = Math.min(rawDt, 0.05)
    // Ẩn chày gốc của BellTower (thay bằng chày con lắc bên dưới); giữ nhóm treo chuông để rung
    if (!s.searched && tower.current) {
      s.searched = true
      tower.current.traverse((o) => {
        if (isOriginalLog(o)) {
          o.visible = false
          s.hang = o.parent
        }
      })
    }

    const r = stepPendulum(s, dt, s.pull)
    s.angle = r.angle
    s.vel = r.vel
    if (r.impact > 0.5) {
      s.shakeT = 0
      s.shakeAmp = Math.min(0.07, r.impact * 0.012)
      s.waveT = 0
      s.waveAmp = Math.min(1, 0.35 + r.impact / 7)
    }
    if (pivot.current) pivot.current.rotation.x = s.angle
    // Giữ chày nằm ngang (treo hai dây song song)
    if (log.current) log.current.rotation.x = -s.angle

    if (s.shakeT >= 0) {
      s.shakeT += dt
      const k = Math.exp(-s.shakeT * 1.4)
      if (s.hang) s.hang.rotation.x = -s.shakeAmp * k * Math.sin(s.shakeT * 10)
      if (k < 0.01) {
        s.shakeT = -1
        if (s.hang) s.hang.rotation.x = 0
      }
    }

    if (s.waveT >= 0) {
      s.waveT += dt
      let alive = false
      for (let i = 0; i < WAVES; i++) {
        const mesh = waves.current[i]
        if (!mesh) continue
        const t = s.waveT - i * 0.4
        const shown = t >= 0 && t < 2.4
        mesh.visible = shown
        if (!shown) {
          if (t < 0) alive = true
          continue
        }
        alive = true
        const k = t / 2.4
        mesh.scale.setScalar(1 + k * 7)
        mesh.material.opacity = (1 - k) ** 2 * 0.55 * s.waveAmp
      }
      if (!alive) s.waveT = -1
    }
  })

  const wood = toon(PALETTE.woodDark)
  const rope = toon('#c9a95b')
  return (
    <group position={position} rotation-y={rotY}>
      <group ref={tower}>
        <BellTower position={[0, 0, 0]} />
      </group>
      {/* Xà ngang giữa hai cột trước để treo chày */}
      <mesh position={[0, PIVOT[1] + 0.04, PIVOT[2]]} material={wood}>
        <boxGeometry args={[2.8, 0.1, 0.1]} />
      </mesh>
      <group ref={pivot} position={PIVOT}>
        {[-0.32, 0.32].map((z) => (
          <mesh key={z} position={[0, -PENDULUM.length / 2, z]} material={rope}>
            <cylinderGeometry args={[0.012, 0.012, PENDULUM.length, 4]} />
          </mesh>
        ))}
        <group ref={log} position={[0, -PENDULUM.length, 0]}>
          <mesh rotation-x={Math.PI / 2} material={wood} castShadow>
            <cylinderGeometry args={[0.11, 0.11, LOG_HALF * 2, 10]} />
          </mesh>
          {/* Dây kéo buông từ đuôi chày xuống ngang tầm tay người đánh chuông */}
          <mesh position={[0, -0.45, LOG_HALF - 0.04]} material={rope}>
            <cylinderGeometry args={[0.018, 0.018, 0.9, 5]} />
          </mesh>
          <mesh position={[0, -0.92, LOG_HALF - 0.04]} material={toon(PALETTE.lacquer)}>
            <sphereGeometry args={[0.04, 8, 6]} />
          </mesh>
          {/* Đầu chày bọc đồng */}
          <mesh position={[0, 0, -LOG_HALF + 0.02]} rotation-x={Math.PI / 2} material={toon(PALETTE.bronze)}>
            <cylinderGeometry args={[0.115, 0.115, 0.05, 10]} />
          </mesh>
        </group>
      </group>
      {/* Vòng sóng âm lan toả quanh chuông */}
      {waveMats.map((m, i) => (
        <mesh
          key={i}
          ref={(el) => {
            waves.current[i] = el
          }}
          position={[0, BELL_Y, 0]}
          rotation-x={Math.PI / 2}
          material={m}
          visible={false}
        >
          <torusGeometry args={[0.8, 0.025, 6, 48]} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------- Chiếu lạy ---------------- */

const PETALS = 8

/** Tấm chiếu lạy trước bàn thờ Phật: chiếu đỏ viền vàng, hoa sen ở đầu chiếu hướng về bàn thờ */
export function AltarSpot({ id, name = 'Trước bàn thờ Phật', position, rotY = 0, activity = 'le-phat', verb = 'Lễ Phật' }) {
  const face = useMemo(() => front(position, rotY, -3), [position, rotY])
  useInteractable({
    id: `lay:${id}`,
    position,
    radius: 1.8,
    label: name,
    verb,
    onInteract: () => startActivity(activity, { altarId: id, name, stand: position, face }),
  })
  const red = toon('#9c2f22')
  const gold = toon('#d9a441')
  const petal = toon('#f0c35a')
  return (
    <group position={position} rotation-y={rotY}>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2} material={red} receiveShadow>
        <planeGeometry args={[1.1, 1.7]} />
      </mesh>
      <mesh position={[0, 0.025, 0]} rotation-x={-Math.PI / 2} material={gold}>
        <planeGeometry args={[0.96, 1.56]} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2} material={red}>
        <planeGeometry args={[0.88, 1.48]} />
      </mesh>
      {/* Hoa sen ở đầu chiếu (phía bàn thờ) */}
      <group position={[0, 0.035, -0.45]}>
        {Array.from({ length: PETALS }, (_, i) => {
          const a = (i / PETALS) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.sin(a) * 0.11, 0, Math.cos(a) * 0.11]} rotation={[-Math.PI / 2, 0, a]} scale={[0.45, 1, 1]} material={petal}>
              <circleGeometry args={[0.09, 10]} />
            </mesh>
          )
        })}
        <mesh position={[0, 0.002, 0]} rotation-x={-Math.PI / 2} material={gold}>
          <circleGeometry args={[0.06, 12]} />
        </mesh>
      </group>
      {/* Hoạ tiết hai vạch ở cuối chiếu */}
      {[0.5, 0.58].map((z) => (
        <mesh key={z} position={[0, 0.035, z]} rotation-x={-Math.PI / 2} material={gold}>
          <planeGeometry args={[0.7, 0.025]} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------------- Án thư tụng kinh ---------------- */

/** Án thư gỗ: quyển kinh mở, mõ gỗ và chuông gia trì bên cạnh */
export function SutraLectern({ id, name = 'Án thư tụng kinh', position, rotY = 0 }) {
  const stand = useMemo(() => front(position, rotY, 1.1), [position, rotY])
  useInteractable({
    id: `kinh:${id}`,
    position: stand,
    radius: 1.8,
    label: name,
    verb: 'Tụng kinh',
    onInteract: () => startActivity('tung-kinh', { lecternId: id, name, stand, face: position }),
  })
  const wood = toon(PALETTE.lacquer)
  const page = toon('#f4ead0')
  const cover = toon('#7a2a1e')
  return (
    <group position={position} rotation-y={rotY}>
      <mesh position={[0, 0.25, 0]} material={wood} castShadow>
        <boxGeometry args={[0.9, 0.5, 0.5]} />
      </mesh>
      <mesh position={[0, 0.51, 0]} material={toon(PALETTE.gold)}>
        <boxGeometry args={[0.92, 0.02, 0.52]} />
      </mesh>
      {/* Quyển kinh mở, đặt nghiêng về phía người tụng */}
      <group position={[0, 0.56, 0.03]} rotation-x={0.22}>
        <mesh position={[0, -0.012, 0]} material={cover}>
          <boxGeometry args={[0.54, 0.014, 0.36]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.128, 0.008, 0]} rotation-z={-s * 0.1} material={page}>
            <boxGeometry args={[0.25, 0.022, 0.33]} />
          </mesh>
        ))}
        {/* Dây đánh dấu trang */}
        <mesh position={[0, 0.02, 0.17]} material={toon(PALETTE.gold)}>
          <boxGeometry args={[0.018, 0.004, 0.1]} />
        </mesh>
      </group>
      {/* Mõ gỗ */}
      <group position={[0.36, 0.56, 0.08]}>
        <mesh scale={[1, 0.8, 1.1]} material={toon(PALETTE.wood)} castShadow>
          <sphereGeometry args={[0.065, 10, 8]} />
        </mesh>
        <mesh position={[0.02, 0.03, 0.09]} rotation={[0.9, 0, 0.3]} material={toon(PALETTE.woodDark)}>
          <cylinderGeometry args={[0.008, 0.008, 0.16, 5]} />
        </mesh>
      </group>
      {/* Chuông gia trì (chuông bát) */}
      <group position={[-0.36, 0.52, 0.08]}>
        <mesh position={[0, 0.005, 0]} material={toon('#a8323a')}>
          <cylinderGeometry args={[0.07, 0.07, 0.02, 12]} />
        </mesh>
        <mesh position={[0, 0.05, 0]} material={toon(PALETTE.bronze)} castShadow>
          <cylinderGeometry args={[0.06, 0.045, 0.07, 14, 1, true]} />
        </mesh>
      </group>
    </group>
  )
}
