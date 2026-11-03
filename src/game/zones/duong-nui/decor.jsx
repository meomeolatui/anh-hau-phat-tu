import { useLayoutEffect, useMemo, useRef } from 'react'
import { Object3D } from 'three'
import { Pillar, Roof } from '../../props/architecture'
import { PALETTE, glow, toon } from '../../materials'
import { PILLAR_INSET } from './helpers'

/**
 * Đồ trang trí tĩnh dùng chung cho các zone đường núi: lan can đá (instanced), đèn đá (instanced),
 * nhà nghỉ chân mái ngói, ghế đá, đèn lồng treo không kèm nguồn sáng, đèn ấm (pointLight cố định).
 */

const dummy = new Object3D()
const POST_H = 0.9
const RAIL_Y = 0.66

/**
 * Lan can đá: các đoạn `runs` (mỗi đoạn là dãy cột [x,y,z]); cột thấp tại mỗi điểm,
 * thanh vịn nối hai cột liền nhau (bám theo độ dốc).
 */
export function RailingSet({ runs }) {
  const posts = useRef()
  const rails = useRef()
  const { points, segs } = useMemo(
    () => ({ points: runs.flat(), segs: runs.flatMap((r) => r.slice(1).map((b, i) => [r[i], b])) }),
    [runs],
  )
  useLayoutEffect(() => {
    points.forEach(([x, y, z], i) => {
      dummy.position.set(x, y + POST_H / 2 - 0.15, z)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      posts.current.setMatrixAt(i, dummy.matrix)
    })
    posts.current.instanceMatrix.needsUpdate = true
    if (!rails.current) return
    segs.forEach(([a, b], i) => {
      dummy.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + RAIL_Y, (a[2] + b[2]) / 2)
      dummy.rotation.set(0, 0, 0)
      dummy.lookAt(b[0], b[1] + RAIL_Y, b[2])
      dummy.scale.set(1, 1, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]))
      dummy.updateMatrix()
      rails.current.setMatrixAt(i, dummy.matrix)
    })
    rails.current.instanceMatrix.needsUpdate = true
  }, [points, segs])
  if (!points.length) return null
  const stone = toon(PALETTE.stoneDark, { flat: true })
  return (
    <group>
      <instancedMesh ref={posts} args={[null, null, points.length]} material={stone} castShadow receiveShadow>
        <boxGeometry args={[0.24, POST_H, 0.24]} />
      </instancedMesh>
      {segs.length > 0 && (
        <instancedMesh ref={rails} args={[null, null, segs.length]} material={stone} castShadow>
          <boxGeometry args={[0.14, 0.11, 1]} />
        </instancedMesh>
      )}
    </group>
  )
}

/** Nhiều đèn đá (thạch đăng) — 3 instanced mesh thay cho hàng chục mesh rời. items: [{x,y,z,rot}] */
export function StoneLanternSet({ items, lit = false }) {
  const base = useRef()
  const lamp = useRef()
  const cap = useRef()
  useLayoutEffect(() => {
    const parts = [
      [base, 0.35],
      [lamp, 0.85],
      [cap, 1.12],
    ]
    for (const [ref, dy] of parts) {
      items.forEach((it, i) => {
        dummy.position.set(it.x, it.y + dy, it.z)
        dummy.rotation.set(0, it.rot ?? 0, 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        ref.current.setMatrixAt(i, dummy.matrix)
      })
      ref.current.instanceMatrix.needsUpdate = true
    }
  }, [items])
  if (!items.length) return null
  const stone = toon(PALETTE.stoneDark, { flat: true })
  return (
    <group>
      <instancedMesh ref={base} args={[null, null, items.length]} material={stone} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 0.7, 6]} />
      </instancedMesh>
      <instancedMesh ref={lamp} args={[null, null, items.length]} material={lit ? glow('#ffcf7a') : toon('#e8dcc0')}>
        <boxGeometry args={[0.36, 0.3, 0.36]} />
      </instancedMesh>
      <instancedMesh ref={cap} args={[null, null, items.length]} material={stone} castShadow>
        <coneGeometry args={[0.38, 0.3, 4]} />
      </instancedMesh>
    </group>
  )
}

/**
 * Nhà nghỉ chân / đình nhỏ: nền đá, 4 cột son, xà gỗ, mái ngói đầu đao.
 * Gốc ở tâm nền, mặt trước hướng +Z cục bộ. Vị trí cột khớp pavilionColliders().
 */
export function Pavilion({ w = 4, d = 3, h = 2.6, roof = PALETTE.roof, position, rotation, children }) {
  const px = w / 2 - PILLAR_INSET
  const pz = d / 2 - PILLAR_INSET
  const wood = toon(PALETTE.woodDark)
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.03, 0]} material={toon(PALETTE.stone)} receiveShadow>
        <boxGeometry args={[w + 0.5, 0.08, d + 0.5]} />
      </mesh>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Pillar key={`${sx}${sz}`} h={h} r={0.14} position={[sx * px, 0, sz * pz]} />))}
      {/* Xà đỡ mái */}
      {[-1, 1].map((s) => (
        <mesh key={`x${s}`} position={[0, h + 0.28, s * pz]} material={wood} castShadow>
          <boxGeometry args={[w - 0.2, 0.16, 0.16]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`z${s}`} position={[s * px, h + 0.28, 0]} material={wood}>
          <boxGeometry args={[0.16, 0.16, d - 0.2]} />
        </mesh>
      ))}
      <Roof w={w + 1.4} d={d + 1.4} h={1.3} color={roof} ornament={false} position={[0, h + 0.36, 0]} />
      {children}
    </group>
  )
}

/** Ghế đá: mặt đá dài `len` theo trục x cục bộ, hai chân */
export function StoneBench({ len = 1.8, position, rotation }) {
  const top = toon(PALETTE.stone, { flat: true })
  const leg = toon(PALETTE.stoneDark, { flat: true })
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.45, 0]} material={top} castShadow receiveShadow>
        <boxGeometry args={[len, 0.12, 0.5]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (len / 2 - 0.25), 0.2, 0]} material={leg} castShadow>
          <boxGeometry args={[0.16, 0.4, 0.42]} />
        </mesh>
      ))}
    </group>
  )
}

/** Đèn lồng treo — chỉ phát sáng (glow), không kèm pointLight để tiết kiệm đèn */
export function HangingLamp({ position, lit = false, color = '#d83a2e', hang = 0.4, size = 0.2 }) {
  return (
    <group position={position}>
      <mesh position={[0, hang / 2, 0]} material={toon('#3b2a1a')}>
        <cylinderGeometry args={[0.01, 0.01, hang, 4]} />
      </mesh>
      <mesh material={lit ? glow(color) : toon(color)} scale={[1, 1.15, 1]}>
        <sphereGeometry args={[size, 10, 8]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, s * size * 1.12, 0]} material={toon(PALETTE.gold)}>
          <cylinderGeometry args={[size * 0.45, size * 0.45, 0.05, 8]} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Nguồn sáng ấm cố định. Luôn gắn (chỉ đổi cường độ) để số đèn trong cảnh không đổi
 * giữa ngày/đêm — tránh biên dịch lại shader của mọi vật liệu khi chuyển giờ.
 */
export function WarmLight({ position, night, day = 0, intensity = 3, distance = 8 }) {
  return <pointLight position={position} color="#ffb36b" intensity={night ? intensity : day} distance={distance} decay={2} />
}
