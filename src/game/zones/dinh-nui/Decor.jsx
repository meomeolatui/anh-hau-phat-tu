import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide, Object3D } from 'three'
import { Pillar, Roof } from '../../props/architecture'
import { Lantern } from '../../props/sacred'
import { PALETTE, toon } from '../../materials'
import { DECK, DECK_POSTS, ENTRY, INCENSE, STATUE } from './data'

/**
 * Trang trí tĩnh của khu đỉnh núi (toạ độ CỤC BỘ, đặt trong <group position={O}>).
 */

const dummy = new Object3D()

/** Hoa văn lát đá: các vòng tròn đồng tâm quanh lư hương, tia chia ô, hoa sen dưới lư, lối thần đạo */
export function PavingPattern() {
  const dark = toon(PALETTE.stoneDark)
  const light = toon('#e6dcc6')
  const granite = toon(PALETTE.granite)
  const rings = [3.2, 7, 11.5, 16.5, 22, 27.5, 32.6]
  // Lối từ đường dốc vào tâm quảng trường
  const [ex, ez] = ENTRY
  const entryLen = Math.hypot(ex, ez) + 3
  const entryRot = Math.atan2(ex, ez)
  const axisFrom = 2
  const axisTo = STATUE.z + STATUE.tiers[0].r * 0.85
  return (
    <group position={[0, 0.012, 0]}>
      {/* Lối thần đạo: lư hương → bệ tượng, và lối vào từ đường dốc (nằm dưới các vòng hoa văn) */}
      <mesh position={[0, -0.004, (axisFrom + axisTo) / 2]} rotation-x={-Math.PI / 2} material={light} receiveShadow>
        <planeGeometry args={[4, axisFrom - axisTo]} />
      </mesh>
      <group rotation-y={entryRot}>
        <mesh position={[0, -0.004, entryLen / 2 + 1]} rotation-x={-Math.PI / 2} material={light} receiveShadow>
          <planeGeometry args={[3.6, entryLen]} />
        </mesh>
      </group>
      <group position={[INCENSE.x, 0, INCENSE.z]}>
        {rings.map((r, i) => (
          <mesh key={r} rotation-x={-Math.PI / 2} material={i % 2 ? granite : dark} receiveShadow>
            <ringGeometry args={[r - 0.18, r + 0.18, 72]} />
          </mesh>
        ))}
        {/* Tia chia ô giữa vòng 1 và vòng 3 */}
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2
          const r0 = rings[0]
          const r1 = rings[2]
          return (
            <group key={i} rotation-y={a}>
              <mesh position={[0, 0.002, (r0 + r1) / 2]} rotation-x={-Math.PI / 2} material={dark} receiveShadow>
                <planeGeometry args={[0.14, r1 - r0]} />
              </mesh>
            </group>
          )
        })}
        {/* Hoa sen tám cánh dưới lư hương */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2
          return (
            <mesh
              key={i}
              position={[Math.sin(a) * 1.9, 0.002, Math.cos(a) * 1.9]}
              rotation={[-Math.PI / 2, 0, a]}
              scale={[0.55, 1.1, 1]}
              material={granite}
              receiveShadow
            >
              <circleGeometry args={[0.9, 10]} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

/** Lan can đá quanh mép vực — instanced (2 draw call cho cả vòng) */
export function RailingRing({ segments }) {
  const rails = useRef()
  const posts = useRef()
  const postList = useMemo(() => {
    const seen = new Map()
    for (const s of segments) {
      for (const t of [0, 0.5, 1]) {
        const x = s.ax + (s.bx - s.ax) * t
        const z = s.az + (s.bz - s.az) * t
        seen.set(`${x.toFixed(2)}|${z.toFixed(2)}`, { x, z, rot: s.rot })
      }
    }
    return [...seen.values()]
  }, [segments])
  useLayoutEffect(() => {
    segments.forEach((s, i) => {
      dummy.position.set(s.x, 0.72, s.z)
      dummy.rotation.set(0, s.rot, 0)
      dummy.scale.set(0.18, 0.12, s.len + 0.1)
      dummy.updateMatrix()
      rails.current.setMatrixAt(i, dummy.matrix)
    })
    rails.current.instanceMatrix.needsUpdate = true
    postList.forEach((p, i) => {
      dummy.position.set(p.x, 0.4, p.z)
      dummy.rotation.set(0, p.rot, 0)
      dummy.scale.set(0.24, 0.8, 0.24)
      dummy.updateMatrix()
      posts.current.setMatrixAt(i, dummy.matrix)
    })
    posts.current.instanceMatrix.needsUpdate = true
  }, [segments, postList])
  const mat = toon(PALETTE.stoneDark)
  return (
    <group>
      <instancedMesh ref={rails} args={[null, null, segments.length]} material={mat} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
      <instancedMesh ref={posts} args={[null, null, postList.length]} material={mat} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </group>
  )
}

/** Cột phướn: cột gỗ son, xà ngang, dải phướn vải buông dài đung đưa nhẹ */
export function Banner({ position, color, seed = 0 }) {
  const cloth = useRef()
  useFrame((state) => {
    if (cloth.current) cloth.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.7 + seed) * 0.12
  })
  const pole = toon(PALETTE.lacquer)
  const gold = toon(PALETTE.gold)
  const fabric = toon(color, { side: DoubleSide })
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} material={toon(PALETTE.stoneDark)} castShadow>
        <cylinderGeometry args={[0.28, 0.34, 0.4, 8]} />
      </mesh>
      <mesh position={[0, 3.4, 0]} material={pole} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 6.8, 8]} />
      </mesh>
      <mesh position={[0, 6.95, 0]} material={gold}>
        <sphereGeometry args={[0.14, 8, 6]} />
      </mesh>
      <mesh position={[0, 6.3, 0]} rotation-z={Math.PI / 2} material={pole}>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 6]} />
      </mesh>
      <group ref={cloth} position={[0, 6.25, 0]}>
        <mesh position={[0, -1.9, 0.08]} material={fabric} castShadow>
          <planeGeometry args={[0.9, 3.8]} />
        </mesh>
        <mesh position={[0, -3.85, 0.08]} material={gold}>
          <boxGeometry args={[0.94, 0.1, 0.02]} />
        </mesh>
      </group>
    </group>
  )
}

/** Thiền đài ngắm mây: sàn gỗ thấp, bốn cột son, mái ngói nhẹ, hai đèn lồng treo hiên */
export function MeditationPavilion({ night }) {
  const wood = toon(PALETTE.wood)
  const plank = toon(PALETTE.woodDark)
  return (
    <group>
      <group position={[DECK.x, 0, DECK.z]}>
        <mesh position={[0, DECK.h / 2, 0]} material={wood} receiveShadow>
          <boxGeometry args={[DECK.w, DECK.h, DECK.d]} />
        </mesh>
        {/* Đường ghép ván */}
        {Array.from({ length: 8 }, (_, i) => (
          <mesh key={i} position={[0, DECK.h + 0.004, -DECK.d / 2 + ((i + 1) * DECK.d) / 9]} rotation-x={-Math.PI / 2} material={plank}>
            <planeGeometry args={[DECK.w - 0.1, 0.05]} />
          </mesh>
        ))}
        <Roof w={DECK.w + 1.4} d={DECK.d + 1.4} h={1.5} color={PALETTE.roof} ornament={false} position={[0, 3.05, 0]} />
      </group>
      {DECK_POSTS.map(([x, z]) => (
        <Pillar key={`${x}${z}`} h={2.75} r={0.14} position={[x, DECK.h - 0.1, z]} />
      ))}
      {[DECK.z - 2, DECK.z + 2].map((z) => (
        <Lantern key={z} position={[DECK.x + DECK.w / 2 + 0.2, 2.45, z]} hang={0.55} lit={night} />
      ))}
    </group>
  )
}

/** Thông thấp dáng tháp (ba tầng tán), mọc trên sườn đá */
export function LowPine({ position, scale = 1 }) {
  const leaf = toon(PALETTE.leafDark, { flat: true })
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.7, 0]} material={toon(PALETTE.trunk)} castShadow>
        <cylinderGeometry args={[0.12, 0.22, 1.4, 6]} />
      </mesh>
      {[
        [1.6, 1.5, 1.5],
        [1.25, 1.3, 2.4],
        [0.85, 1.1, 3.2],
      ].map(([r, h, y], i) => (
        <mesh key={i} position={[0, y, 0]} rotation-y={i * 0.5} material={leaf} castShadow>
          <coneGeometry args={[r, h, 7]} />
        </mesh>
      ))}
    </group>
  )
}
