import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CircleGeometry, CylinderGeometry, SphereGeometry } from 'three'
import { emit, runtime } from '../runtime'
import { getGame, useGame } from '../state'
import { glow, toon } from '../materials'
import { useHour } from '../world/useHour'
import { driftAt, driftParams, lanternPetal, launchPoint, LAUNCH_MS, NEAR_RADIUS, NEAR_REPEAT_MS } from '../activities/hoaDangLogic'

const MAX_SHOWN = 8
const OUTER = 8
const INNER = 6

/** Một chiếc đèn hoa sen: lá đỡ, hai vòng cánh, ngọn nến ở giữa */
function LotusLantern({ geo, petal, night, setRef }) {
  const petalMat = night ? toon(petal, { emissive: petal, emissiveIntensity: 0.55 }) : toon(petal)
  const leaf = toon('#4f8a4b')
  return (
    <group ref={setRef}>
      <mesh geometry={geo.pad} material={leaf} rotation-x={-Math.PI / 2} />
      {Array.from({ length: OUTER }, (_, i) => {
        const a = (i / OUTER) * Math.PI * 2
        return (
          <mesh key={`o${i}`} geometry={geo.petal} material={petalMat} position={[Math.sin(a) * 0.15, 0.07, Math.cos(a) * 0.15]} rotation={[0.55, a, 0, 'YXZ']} scale={[0.75, 1.4, 0.35]} />
        )
      })}
      {Array.from({ length: INNER }, (_, i) => {
        const a = ((i + 0.5) / INNER) * Math.PI * 2
        return (
          <mesh key={`i${i}`} geometry={geo.petal} material={petalMat} position={[Math.sin(a) * 0.07, 0.09, Math.cos(a) * 0.07]} rotation={[0.25, a, 0, 'YXZ']} scale={[0.55, 1.2, 0.3]} />
        )
      })}
      <mesh geometry={geo.candle} material={toon('#f6efe0')} position={[0, 0.09, 0]} />
      <mesh geometry={geo.flame} material={glow(night ? '#ffc35a' : '#ffd98a')} position={[0, 0.16, 0]} scale={[1, 1.5, 1]} />
    </group>
  )
}

/**
 * Đèn hoa đăng người chơi đã thả trên hồ `pondId` (center: toạ độ thế giới mặt nước; w×d: kích thước mặt nước).
 * Đèn trôi lững lờ trong phạm vi hồ; đèn mới thả trôi từ mép hồ gần người chơi ra. Ban đêm đèn sáng.
 * Khi người chơi đi ngang gần một đèn: hiện lời nguyện (thông báo nhỏ, mỗi đèn tối đa một lần / 45 giây).
 */
export function FloatingLanterns({ pondId, center, w = 6, d = 4 }) {
  const lanterns = useGame((s) => s.save.lanterns)
  const mine = useMemo(() => lanterns.filter((l) => (l.pondId ?? 'chan-nui') === pondId).slice(0, MAX_SHOWN), [lanterns, pondId])
  const hour = useHour()
  const night = hour < 6 || hour >= 18
  const groups = useRef(new Map()) // id → Object3D
  const meta = useRef(new Map()) // id → { p, launch, near, lastNear }
  const checkIn = useRef(0)

  const geo = useMemo(
    () => ({
      pad: new CircleGeometry(0.24, 12),
      petal: new SphereGeometry(0.1, 6, 4),
      candle: new CylinderGeometry(0.03, 0.035, 0.08, 8),
      flame: new SphereGeometry(0.03, 8, 6),
    }),
    [],
  )
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const p = runtime.player.position
    const lx = p.x - center[0]
    const lz = p.z - center[2]
    checkIn.current -= dt
    const check = checkIn.current <= 0
    if (check) checkIn.current = 0.25
    let toasted = false

    for (const l of mine) {
      const g = groups.current.get(l.id)
      if (!g) continue
      let m = meta.current.get(l.id)
      if (!m) {
        m = { p: driftParams(l.id, w, d), launch: null, near: false, lastNear: 0 }
        // Đèn vừa thả: trôi ra từ mép hồ gần người chơi
        const age = Date.now() - Date.parse(l.at)
        if (age >= 0 && age < LAUNCH_MS * 2) {
          const [sx, sz] = launchPoint(lx, lz, w, d)
          m.launch = { sx, sz, t0: t }
        }
        meta.current.set(l.id, m)
      }
      let [x, z] = driftAt(m.p, t)
      if (m.launch) {
        const k = (t - m.launch.t0) / (LAUNCH_MS / 1000)
        if (k >= 1) m.launch = null
        else {
          const e = 1 - (1 - k) ** 3
          x = m.launch.sx + (x - m.launch.sx) * e
          z = m.launch.sz + (z - m.launch.sz) * e
        }
      }
      const b = m.p.bob
      g.position.set(x, 0.02 + Math.sin(t * 1.3 + b) * 0.02, z)
      g.rotation.set(Math.sin(t * 0.9 + b) * 0.05, t * m.p.spin + b, Math.cos(t * 0.7 + b) * 0.05)

      if (!check) continue
      const dist = Math.hypot(x - lx, z - lz)
      if (dist < NEAR_RADIUS && !m.near) {
        m.near = true
        const now = Date.now()
        if (!toasted && now - m.lastNear > NEAR_REPEAT_MS && !getGame().ui.activity && l.text) {
          m.lastNear = now
          toasted = true
          emit('toast', { title: 'Lời nguyện trên đèn hoa đăng', description: `“${l.text}”` })
        }
      } else if (dist > NEAR_RADIUS + 0.8) m.near = false
    }
  })

  return (
    <group position={center}>
      {mine.map((l) => (
        <LotusLantern
          key={l.id}
          geo={geo}
          petal={lanternPetal(l.color, l.id)}
          night={night}
          setRef={(el) => {
            if (el) groups.current.set(l.id, el)
            else groups.current.delete(l.id)
          }}
        />
      ))}
      {night && mine.length > 0 && <pointLight position={[0, 0.8, 0]} color="#ffb36b" intensity={1.5 + mine.length * 0.4} distance={Math.max(w, d) * 1.3} decay={2} />}
    </group>
  )
}
