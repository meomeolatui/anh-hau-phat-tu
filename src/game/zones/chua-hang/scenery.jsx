import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, BufferAttribute, BufferGeometry, Object3D } from 'three'
import { SeatedBuddha } from '../../props/sacred'
import { waterMaterial } from '../../fx/waterMaterial'
import { PALETTE, glow, toon } from '../../materials'
import { HangingLamp, WarmLight } from '../duong-nui/decor'
import { CAVE, SPLIT, STREAM_WIDTH } from './data'

/**
 * Cảnh quan Chùa Hang (toạ độ CỤC BỘ quanh origin của zone): vách đá granite, hang đá có đèn dầu,
 * tảng "Ông Đá nứt", khe suối nước chảy.
 */

const dummy = new Object3D()

/** Khối đá lớn instanced (2 tông xám granite). items: [{ x, y, z, sx, sy, sz, rx, ry, rz, dark }] */
export function CliffRocks({ items }) {
  const groups = useMemo(() => [items.filter((r) => !r.dark), items.filter((r) => r.dark)], [items])
  return (
    <group>
      <RockBatch list={groups[0]} color={PALETTE.granite} />
      <RockBatch list={groups[1]} color={PALETTE.graniteDark} />
    </group>
  )
}

function RockBatch({ list, color }) {
  const ref = useRef()
  useLayoutEffect(() => {
    if (!ref.current) return
    list.forEach((r, i) => {
      dummy.position.set(r.x, r.y, r.z)
      dummy.rotation.set(r.rx, r.ry, r.rz)
      dummy.scale.set(r.sx, r.sy, r.sz)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [list])
  if (!list.length) return null
  return (
    <instancedMesh ref={ref} args={[null, null, list.length]} material={toon(color, { flat: true })} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
    </instancedMesh>
  )
}

/** Ngọn lửa đèn dầu chập chờn */
function Flame({ position, seed = 0 }) {
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime * 7 + seed * 3.1
    const k = 1 + Math.sin(t) * 0.12 + Math.sin(t * 2.3) * 0.08
    ref.current.scale.set(1, k, 1)
  })
  return (
    <group position={position}>
      <mesh position={[0, -0.02, 0]} material={toon(PALETTE.bronze)}>
        <cylinderGeometry args={[0.09, 0.05, 0.05, 8]} />
      </mesh>
      <mesh ref={ref} position={[0, 0.06, 0]} material={glow('#ffb347')}>
        <coneGeometry args={[0.035, 0.13, 6]} />
      </mesh>
    </group>
  )
}

/**
 * Cửa hang: lòng hang tối (hộp lật mặt trong), bệ đá thờ Phật nhỏ, đèn dầu thắp quanh năm,
 * đèn lồng treo ở miệng hang. Khung đá quanh miệng hang nằm trong danh sách vách đá (buildCliff).
 */
export function Cave({ night }) {
  const inside = toon('#2b241d', { side: BackSide })
  const ledge = toon(PALETTE.graniteDark, { flat: true })
  return (
    <group position={[CAVE.x, 0, CAVE.z]} rotation-y={CAVE.rot}>
      <mesh position={[0, 1.7, -1.7]} material={inside} receiveShadow>
        <boxGeometry args={[3.4, 3.4, 3.4]} />
      </mesh>
      <mesh position={[0, 0.4, -2.95]} material={ledge} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.8, 0.7]} />
      </mesh>
      <SeatedBuddha size={0.9} position={[0, 0.8, -3.05]} />
      <Flame position={[-0.65, 0.84, -2.75]} seed={1} />
      <Flame position={[0.65, 0.84, -2.75]} seed={2} />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.2, 0, -1.2]}>
          <mesh position={[0, 0.25, 0]} material={ledge}>
            <cylinderGeometry args={[0.1, 0.16, 0.5, 6]} />
          </mesh>
          <Flame position={[0, 0.53, 0]} seed={3 + s} />
        </group>
      ))}
      <WarmLight position={[0, 1.5, -1.0]} night={night} day={1.2} intensity={4} distance={7} />
      {[-1, 1].map((s) => (
        <HangingLamp key={s} position={[s * 0.95, 2.5, 0.15]} lit={night} hang={0.35} />
      ))}
    </group>
  )
}

/**
 * "Ông Đá nứt" (tương truyền): tảng đá lớn nứt đôi, khe giữa rộng ~1,5 m theo trục z cục bộ.
 * Hai nửa hơi ngả ra hai bên; khớp vật cản trong chua-hang/data.js.
 */
export function SplitRock() {
  const stone = toon(PALETTE.granite, { flat: true })
  const moss = toon(PALETTE.leafDark, { flat: true })
  const hx = SPLIT.gap / 2 + SPLIT.halfW
  return (
    <group position={[SPLIT.x, 0, SPLIT.z]} rotation-y={SPLIT.rot}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * hx, 0, 0]} rotation-z={-s * 0.07}>
          <mesh position={[0, 1.3, 0]} rotation-y={s * 0.15} scale={[SPLIT.halfW, 1.55, SPLIT.len / 2]} material={stone} castShadow receiveShadow>
            <dodecahedronGeometry args={[1, 0]} />
          </mesh>
          <mesh position={[s * 0.1, 2.62, -0.2]} scale={[0.55, 0.12, 0.8]} material={moss}>
            <icosahedronGeometry args={[1, 0]} />
          </mesh>
        </group>
      ))}
      {/* Lối sỏi trong khe */}
      <mesh position={[0, 0.015, 0]} rotation-x={-Math.PI / 2} material={toon('#bfb39a')} receiveShadow>
        <planeGeometry args={[SPLIT.gap - 0.1, SPLIT.len + 0.6]} />
      </mesh>
    </group>
  )
}

const FLECKS = 28
const FLOW_SPEED = 1.3

/** Khe suối: dải nước toon bám địa hình + bọt nước trôi theo dòng + thác nhỏ ở chân vách */
export function Stream({ samples }) {
  const geo = useMemo(() => {
    const n = samples.length
    const hw = STREAM_WIDTH / 2
    const pos = new Float32Array(n * 6)
    // uv: u ngang dòng (0..1), v = mét dọc dòng → shader nước cho gợn/bọt trôi theo dòng chảy
    const uv = new Float32Array(n * 4)
    samples.forEach((p, i) => {
      pos.set([p.x - p.nx * hw, p.y, p.z - p.nz * hw, p.x + p.nx * hw, p.y, p.z + p.nz * hw], i * 6)
      uv.set([0, p.s, 1, p.s], i * 4)
    })
    const idx = []
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('uv', new BufferAttribute(uv, 2))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [samples])

  const total = samples[samples.length - 1].s
  const flecks = useMemo(
    () => Array.from({ length: FLECKS }, (_, i) => ({ phase: (i * 0.618) % 1, off: (((i * 0.37) % 1) - 0.5) * STREAM_WIDTH * 0.6 })),
    [],
  )
  const foam = useRef()
  useFrame((state) => {
    if (!foam.current) return
    const t = state.clock.elapsedTime * FLOW_SPEED
    flecks.forEach((f, i) => {
      const s = (f.phase * total + t) % total
      let k = 0
      while (k < samples.length - 2 && samples[k + 1].s < s) k++
      const a = samples[k]
      const b = samples[k + 1]
      const u = Math.min(1, Math.max(0, (s - a.s) / (b.s - a.s || 1)))
      const fade = Math.min(1, s / 1.5, (total - s) / 1.5)
      dummy.position.set(a.x + (b.x - a.x) * u + a.nx * f.off, a.y + (b.y - a.y) * u + 0.03, a.z + (b.z - a.z) * u + a.nz * f.off)
      dummy.rotation.set(-Math.PI / 2, 0, i)
      dummy.scale.set(fade, fade * 1.6, fade)
      dummy.updateMatrix()
      foam.current.setMatrixAt(i, dummy.matrix)
    })
    foam.current.instanceMatrix.needsUpdate = true
  })

  const head = samples[0]
  const next = samples[1]
  const water = waterMaterial(PALETTE.water, { kind: 'stream', opacity: 0.85 })
  const fall = waterMaterial(PALETTE.water, { kind: 'fall' })
  const white = toon('#eef6f7', { flat: true })
  return (
    <group>
      <mesh geometry={geo} material={water} />
      <instancedMesh ref={foam} args={[null, null, FLECKS]} material={white}>
        <circleGeometry args={[0.07, 5]} />
      </instancedMesh>
      {/* Thác nhỏ chảy ra từ chân vách đá */}
      <group position={[head.x, head.y, head.z]} rotation-y={Math.atan2(next.x - head.x, next.z - head.z)}>
        <mesh position={[0, 1.1, -0.15]} material={fall}>
          <planeGeometry args={[0.7, 2.2]} />
        </mesh>
        {[-0.25, 0.05, 0.3].map((x, i) => (
          <mesh key={x} position={[x, 0.05, 0.15]} scale={[0.22, 0.1, 0.18]} material={white} rotation-y={i}>
            <icosahedronGeometry args={[1, 0]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
