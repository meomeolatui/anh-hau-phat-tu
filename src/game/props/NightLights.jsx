import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, Object3D } from 'three'
import { PALETTE, glow, toon } from '../materials'
import { useHour } from '../world/useHour'
import { skyAt } from '../world/sky'
import { railingLamps, treeLanterns } from './nightLightsLayout'

/**
 * Đèn ban đêm toàn núi: đèn trụ dọc lan can và đèn lồng treo trên cây.
 * Ban ngày là đèn giấy tắt; tối đến phát sáng (bloom làm loé) — không dùng pointLight để giữ hiệu năng.
 */

const dummy = new Object3D()

function useNight() {
  const hour = useHour()
  return useMemo(() => skyAt(hour).night > 0.35, [hour])
}

/** Đèn trụ nhỏ trên lan can: cột gỗ + chụp đèn giấy */
function RailingLamps({ night }) {
  const lamps = useMemo(() => railingLamps(), [])
  const posts = useRef()
  const heads = useRef()
  const caps = useRef()

  useLayoutEffect(() => {
    lamps.forEach((l, i) => {
      dummy.rotation.set(0, 0, 0)
      dummy.position.set(l.x, l.y + 0.55, l.z)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      posts.current.setMatrixAt(i, dummy.matrix)
      dummy.position.set(l.x, l.y + 1.22, l.z)
      dummy.updateMatrix()
      heads.current.setMatrixAt(i, dummy.matrix)
      dummy.position.set(l.x, l.y + 1.43, l.z)
      dummy.updateMatrix()
      caps.current.setMatrixAt(i, dummy.matrix)
    })
    for (const m of [posts, heads, caps]) {
      m.current.instanceMatrix.needsUpdate = true
      m.current.computeBoundingSphere()
    }
  }, [lamps])

  return (
    <group name="den-lan-can">
      <instancedMesh ref={posts} args={[null, null, lamps.length]} material={toon(PALETTE.woodDark)} castShadow>
        <boxGeometry args={[0.1, 1.1, 0.1]} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[null, null, lamps.length]} material={night ? glow('#ffcf7a', 1, 1.7) : toon('#f3ead6')}>
        <boxGeometry args={[0.26, 0.3, 0.26]} />
      </instancedMesh>
      <instancedMesh ref={caps} args={[null, null, lamps.length]} material={toon(PALETTE.roof)}>
        <coneGeometry args={[0.24, 0.16, 4]} />
      </instancedMesh>
    </group>
  )
}

/** Đèn lồng treo dưới tán cây, đung đưa nhẹ theo gió */
function TreeLanterns({ night }) {
  const list = useMemo(() => treeLanterns(), [])
  const strings = useRef()
  const bodies = useRef()

  useLayoutEffect(() => {
    const c = new Color()
    list.forEach((l, i) => bodies.current.setColorAt(i, c.set(l.color)))
    bodies.current.instanceColor.needsUpdate = true
  }, [list])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    list.forEach((l, i) => {
      // Lắc nhẹ quanh điểm treo
      const sx = Math.sin(t * 1.3 + l.phase) * 0.12
      const sz = Math.cos(t * 1.1 + l.phase) * 0.1
      dummy.rotation.set(sz, 0, -sx)
      dummy.scale.set(1, 1, 1)
      dummy.position.set(l.x + sx * 0.25, l.y - 0.25, l.z + sz * 0.25)
      dummy.updateMatrix()
      strings.current.setMatrixAt(i, dummy.matrix)
      dummy.position.set(l.x + sx * 0.6, l.y - 0.72, l.z + sz * 0.6)
      dummy.scale.set(1, 1.2, 1)
      dummy.updateMatrix()
      bodies.current.setMatrixAt(i, dummy.matrix)
    })
    strings.current.instanceMatrix.needsUpdate = true
    bodies.current.instanceMatrix.needsUpdate = true
  })

  useLayoutEffect(() => {
    strings.current.computeBoundingSphere()
    bodies.current.computeBoundingSphere()
  }, [list])

  return (
    <group name="den-long-tren-cay">
      <instancedMesh ref={strings} args={[null, null, list.length]} material={toon('#3b2a1a')}>
        <cylinderGeometry args={[0.012, 0.012, 0.5, 4]} />
      </instancedMesh>
      {/* Thân đèn: màu từng chiếc qua instanceColor (vật liệu trắng) */}
      <instancedMesh ref={bodies} args={[null, null, list.length]} material={night ? glow('#ffffff', 1, 1.5) : toon('#ffffff')}>
        <sphereGeometry args={[0.2, 10, 8]} />
      </instancedMesh>
    </group>
  )
}

export default function NightLights() {
  const night = useNight()
  return (
    <>
      <RailingLamps night={night} />
      <TreeLanterns night={night} />
    </>
  )
}
