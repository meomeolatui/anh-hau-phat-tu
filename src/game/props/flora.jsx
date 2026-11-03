import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Object3D } from 'three'
import { runtime } from '../runtime'
import { hash2 } from './treeSpecies'
import { windToon } from './wind'

/**
 * Cỏ bụi và hoa dại (instanced) dọc mép lối đi, quanh sân, trên sườn gần đường.
 * Chia ô 40 m: mỗi ô 2 draw call (cỏ, hoa), ô xa người chơi > 80 m bị ẩn. Đung đưa theo gió (shader).
 * Dữ liệu vị trí: scatterFlora() trong natureScatter.js.
 */

const dummy = new Object3D()
const tmpC = new Color()
const CHUNK = 40
const VIEW = 80

const lin = (hex) => {
  const c = new Color(hex)
  return [c.r, c.g, c.b]
}

/** Khóm cỏ: 7 lá, mỗi lá 2 đoạn cong ra ngoài, gốc sẫm → ngọn sáng (cao đơn vị 1) */
function grassGeometry() {
  const pos = []
  const col = []
  const base = lin('#3f6b2c')
  const mid = lin('#6f9c45')
  const tip = lin('#b4d46e')
  const N = 7
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + hash2(i, 3, 1) * 0.6
    const h = 0.65 + hash2(i, 5, 2) * 0.35
    const bend = 0.18 + hash2(i, 7, 3) * 0.2
    const ox = Math.cos(a) * 0.06
    const oz = Math.sin(a) * 0.06
    const dx = Math.cos(a)
    const dz = Math.sin(a)
    // hướng bề ngang lá (vuông góc hướng cong)
    const sx = -dz
    const sz = dx
    const w0 = 0.035
    const w1 = 0.022
    const b0 = [ox - sx * w0, 0, oz - sz * w0]
    const b1 = [ox + sx * w0, 0, oz + sz * w0]
    const m0 = [ox + dx * bend * 0.35 - sx * w1, h * 0.55, oz + dz * bend * 0.35 - sz * w1]
    const m1 = [ox + dx * bend * 0.35 + sx * w1, h * 0.55, oz + dz * bend * 0.35 + sz * w1]
    const t = [ox + dx * bend, h, oz + dz * bend]
    pos.push(...b0, ...b1, ...m1, ...b0, ...m1, ...m0, ...m0, ...m1, ...t)
    col.push(...base, ...base, ...mid, ...base, ...mid, ...mid, ...mid, ...mid, ...tip)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new Float32BufferAttribute(col, 3))
  g.computeVertexNormals()
  return g
}

/** Hoa dại: cuống + 2 lá nhỏ + 5 cánh rõ (trắng → nhuộm theo instanceColor) + nhuỵ vàng; cao ~0,3 */
function flowerGeometry() {
  const pos = []
  const col = []
  const green = lin('#2f6a2a')
  const white = [1, 1, 1]
  const petalBase = [0.85, 0.85, 0.85]
  const heart = lin('#ffd23a')
  const H = 0.28
  // cuống: hai mặt chéo nhau
  for (const [sx, sz] of [
    [0.008, 0],
    [0, 0.008],
  ]) {
    pos.push(-sx, 0, -sz, sx, 0, sz, sx, H, sz, -sx, 0, -sz, sx, H, sz, -sx, H, -sz)
    for (let k = 0; k < 6; k++) col.push(...green)
  }
  // hai lá nhỏ trên cuống
  for (const s of [1, -1]) {
    pos.push(0, 0.06, 0, s * 0.07, 0.12, 0.015, s * 0.02, 0.11, -0.01)
    for (let k = 0; k < 3; k++) col.push(...green)
  }
  // 5 cánh: hình thoi toả từ tâm, hơi ngửa lên
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const at = (r, da, dy) => [Math.cos(a + da) * r, H + dy, Math.sin(a + da) * r]
    const c0 = at(0.012, 0, 0)
    const l = at(0.045, -0.42, 0.006)
    const r = at(0.045, 0.42, 0.006)
    const tip = at(0.085, 0, 0.02)
    pos.push(...c0, ...r, ...l, ...l, ...r, ...tip)
    col.push(...petalBase, ...white, ...white, ...white, ...white, ...white)
  }
  // nhuỵ: ngũ giác nhỏ nhô lên
  for (let i = 0; i < 5; i++) {
    const a0 = (i / 5) * Math.PI * 2
    const a1 = ((i + 1) / 5) * Math.PI * 2
    pos.push(0, H + 0.018, 0, Math.cos(a1) * 0.02, H + 0.008, Math.sin(a1) * 0.02, Math.cos(a0) * 0.02, H + 0.008, Math.sin(a0) * 0.02)
    for (let k = 0; k < 3; k++) col.push(...heart)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new Float32BufferAttribute(col, 3))
  g.computeVertexNormals()
  return g
}

const GEO = { grass: grassGeometry(), flower: flowerGeometry() }
// Sắc cỏ: phần lớn xanh tươi, ít khóm úa vàng (mùa khô Tây Ninh)
const GRASS_TINTS = ['#ffffff', '#f2f7e4', '#e4f0c8', '#ffffff', '#f6e7b0']

function FloraBatch({ list, kind }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    list.forEach((it, i) => {
      dummy.position.set(it.x, it.y - 0.02, it.z)
      dummy.rotation.set(0, it.rot, 0)
      if (kind === 'grass') dummy.scale.set(it.s * 0.75, it.s * 0.5, it.s * 0.75)
      else dummy.scale.setScalar(0.8 + it.s * 0.45)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      const c = kind === 'grass' ? GRASS_TINTS[Math.floor(hash2(it.x, it.z, 81) * GRASS_TINTS.length)] : it.color
      m.setColorAt(i, tmpC.set(c))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
  }, [list, kind])
  if (!list.length) return null
  const mat =
    kind === 'grass'
      ? windToon('#ffffff', { vertexColors: true, side: DoubleSide }, { amp: 0.07, speed: 1.7, root: true, lift: 1 })
      : windToon('#ffffff', { vertexColors: true, side: DoubleSide }, { amp: 0.05, speed: 1.5, root: true, lift: 3.4 })
  return <instancedMesh key={list.length} ref={ref} args={[GEO[kind], mat, list.length]} />
}

/**
 * Cỏ & hoa dại toàn thế giới. grass/flowers: từ scatterFlora(quality).
 */
export default function Flora({ grass, flowers }) {
  const chunks = useMemo(() => {
    const map = new Map()
    const add = (list, key) =>
      list.forEach((it) => {
        const id = `${Math.floor(it.x / CHUNK)},${Math.floor(it.z / CHUNK)}`
        if (!map.has(id)) map.set(id, { id, grass: [], flowers: [], cx: 0, cz: 0, n: 0 })
        const c = map.get(id)
        c[key].push(it)
        c.cx += it.x
        c.cz += it.z
        c.n++
      })
    add(grass, 'grass')
    add(flowers, 'flowers')
    return [...map.values()].map((c) => ({ ...c, cx: c.cx / c.n, cz: c.cz / c.n }))
  }, [grass, flowers])
  const refs = useRef([])
  const timer = useRef(0)

  // Ẩn các ô xa người chơi (kiểm tra ~4 lần/giây)
  useFrame((_, dt) => {
    timer.current -= dt
    if (timer.current > 0) return
    timer.current = 0.25
    const p = runtime.player.position
    chunks.forEach((c, i) => {
      const g = refs.current[i]
      if (g) g.visible = Math.hypot(c.cx - p.x, c.cz - p.z) < VIEW
    })
  })

  return (
    <group name="co-hoa">
      {chunks.map((c, i) => (
        <group key={c.id} ref={(el) => (refs.current[i] = el)}>
          <FloraBatch list={c.grass} kind="grass" />
          <FloraBatch list={c.flowers} kind="flower" />
        </group>
      ))}
    </group>
  )
}
