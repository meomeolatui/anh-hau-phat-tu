import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  DoubleSide,
  Float32BufferAttribute,
  IcosahedronGeometry,
  LatheGeometry,
  Object3D,
  OctahedronGeometry,
  Vector2,
  Vector3,
} from 'three'
import { PALETTE, toon } from '../materials'
import { WALKABLES } from '../world/layout'
import { seeded } from '../../lib/random'
import { buildTrees, crownExtent, hash2, treeLookAt } from './treeSpecies'
import { WIND, windToon } from './wind'
import { FallingLeaves } from './life'

/**
 * Cây cối, tre trúc, đá tảng granite, bậc đá — dùng InstancedMesh để vẽ hàng trăm cây với ít draw call.
 * Loài cây & màu: treeSpecies.js (mỗi cây MỘT tông màu, đậm nhạt theo khối). Gió: wind.js (vertex shader).
 */

const dummy = new Object3D()
const UP = new Vector3(0, 1, 0)
const tmpV = new Vector3()
const tmpC = new Color()

/** Đồng hồ gió dùng chung cho mọi vật liệu windToon — đặt MỘT lần trong World */
export function WindClock() {
  useFrame((state) => {
    WIND.time.value = state.clock.elapsedTime
  })
  return null
}

/* ---------------- Hình học dùng chung (tạo một lần) ---------------- */

function hangGeometry() {
  // Chùm hoa rủ: nón mũi chĩa xuống, gốc nằm ở gốc toạ độ
  const g = new ConeGeometry(1, 1, 5)
  g.rotateX(Math.PI)
  g.translate(0, -0.5, 0)
  return g
}

const TREE_GEO = {
  wood: new CylinderGeometry(0.62, 1, 1, 6, 1, true),
  ico: new IcosahedronGeometry(1, 0),
  ico1: new IcosahedronGeometry(1, 1),
  cone: new ConeGeometry(1, 1, 7),
  dodeca: new DodecahedronGeometry(1, 0),
  bloom: new OctahedronGeometry(1, 0),
  hang: hangGeometry(),
}
const TREE_BATCHES = ['wood', 'ico', 'ico1', 'cone', 'dodeca', 'bloom', 'hang']

/** Một lô instance (một loại khối) cho mọi cây trong danh sách */
function InstBatch({ kind, list, material, castShadow }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const m = ref.current
    list.forEach((it, i) => {
      dummy.position.set(it.p[0], it.p[1], it.p[2])
      if (it.dir) dummy.quaternion.setFromUnitVectors(UP, tmpV.set(it.dir[0], it.dir[1], it.dir[2]))
      else dummy.rotation.set(0, it.ry, 0)
      dummy.scale.set(it.s[0], it.s[1], it.s[2])
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      m.setColorAt(i, tmpC.set(it.c))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
  }, [list])
  return <instancedMesh key={list.length} ref={ref} args={[TREE_GEO[kind], material, list.length]} castShadow={castShadow} receiveShadow={kind === 'wood'} />
}

/** Vẽ dữ liệu buildTrees(): ≤ 7 draw call cho cả rừng. wind: biên độ gió (m) hoặc 0 (đứng yên) */
function TreeInstances({ data, castShadow, wind }) {
  const leaf = wind ? windToon('#ffffff', {}, { amp: wind, speed: 1.25 }) : toon('#ffffff')
  const wood = toon('#ffffff')
  return TREE_BATCHES.map((kind) =>
    data[kind].length ? (
      <InstBatch key={kind} kind={kind} list={data[kind]} material={kind === 'wood' ? wood : leaf} castShadow={castShadow && kind !== 'bloom' && kind !== 'hang'} />
    ) : null,
  )
}

/**
 * Rừng cây instanced — loài & màu tự chọn theo cụm màu (forestSpeciesAt) nếu item không chỉ định.
 * items: [{ x, y, z, s, rot, kind: 'tron' | 'thong' | 'cao' | 'bui', species?, color? }]
 */
export function Forest({ items, castShadow = false }) {
  const data = useMemo(() => buildTrees(items), [items])
  return (
    <group>
      <TreeInstances data={data} castShadow={castShadow} wind={0.09} />
    </group>
  )
}

/**
 * Một cây lớn đơn lẻ (sân chùa, ven đường): tán nhiều cụm cùng tông màu, cành chính, rễ nổi, đốm hoa.
 * position/scale/color/sway: như cũ. color (nếu có) = màu tán chính. species (tuỳ chọn): 'da' | 'bo-de' |
 * 'phong' | 'phong-cam' | 'phong-vang' | 'phuong' | 'muong' | 'diep' | 'bang' | 'bang-lang' | 'mai' | 'sao'.
 * Không truyền species → chọn ổn định theo toạ độ THẾ GIỚI của gốc (treeLookAt trong treeSpecies.js).
 */
export function BigTree({ position, scale = 1, color, sway = true, species }) {
  const ref = useRef()
  const [origin, setOrigin] = useState(null)
  const [px, py, pz] = position
  useLayoutEffect(() => {
    // Toạ độ thế giới của gốc (zone có thể đặt cây trong group có origin riêng)
    ref.current.updateWorldMatrix(true, false)
    const v = ref.current.getWorldPosition(tmpV)
    const next = [Math.round(v.x * 100) / 100, v.y, Math.round(v.z * 100) / 100]
    setOrigin((o) => (o && o[0] === next[0] && o[2] === next[2] ? o : next))
  }, [px, py, pz])
  const look = useMemo(() => (origin ? treeLookAt(origin[0], origin[2], { color, species }) : null), [origin, color, species])
  const data = useMemo(() => {
    if (!look || !origin) return null
    const rot = hash2(origin[0], origin[2], 53) * Math.PI * 2
    return buildTrees([{ x: 0, y: 0, z: 0, s: 1, rot, species: look.species, color: look.color }], { big: true })
  }, [look, origin])
  return (
    <group ref={ref} position={position} scale={scale}>
      {data && <TreeInstances data={data} castShadow wind={sway ? 0.13 : 0} />}
      {look && <FallingLeaves color={look.color} origin={origin} scale={scale} {...crownExtent(look.species)} />}
    </group>
  )
}

/* ---------------- Tre trúc ---------------- */

const BAMBOO_NODES = 9

/** Thân tre đơn vị (cao 1, gốc ở y = 0): đốt phình nhẹ + vòng đốt sẫm màu (vertex color) */
function bambooStalkGeometry() {
  const pts = []
  const r = (y) => 0.062 - 0.024 * y
  pts.push(new Vector2(r(0), 0))
  for (let k = 1; k < BAMBOO_NODES; k++) {
    const y = k / BAMBOO_NODES
    pts.push(new Vector2(r(y), y - 0.014), new Vector2(r(y) * 1.2, y - 0.004), new Vector2(r(y) * 1.2, y + 0.004), new Vector2(r(y), y + 0.014))
  }
  pts.push(new Vector2(r(1), 1))
  const g = new LatheGeometry(pts, 6)
  const pos = g.attributes.position
  const colors = []
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    const d = Math.abs(y * BAMBOO_NODES - Math.round(y * BAMBOO_NODES)) / BAMBOO_NODES
    const node = d < 0.006 && y > 0.01 && y < 0.99
    // sẫm ở đốt, sáng dần lên ngọn
    const v = node ? 0.62 : 0.9 + y * 0.1
    colors.push(v * (node ? 0.9 : 1), v, v * (node ? 0.8 : 1))
  }
  g.setAttribute('color', new Float32BufferAttribute(colors, 3))
  return g
}

/** Lá tre nhọn: hình thoi dài, gốc ở toạ độ 0, mũi hướng +Z */
function bambooLeafGeometry() {
  const g = new BufferGeometry()
  const v = [0, 0, 0, 0.05, 0.012, 0.13, 0, 0, 0.46, 0, 0, 0, 0, 0, 0.46, -0.05, 0.012, 0.13]
  g.setAttribute('position', new Float32BufferAttribute(v, 3))
  g.computeVertexNormals()
  return g
}

const BAMBOO_GEO = { stalk: bambooStalkGeometry(), leaf: bambooLeafGeometry() }
const STALK_COLORS = ['#8fb05a', '#7fa05a', '#9cb85e', '#a9b85c', '#7a9a52']
const BAMBOO_LEAF_COLORS = ['#8fc06a', '#7db35a', '#9fca72', '#6fa452']

/** Khóm trúc: thân có đốt, lá nhọn từng chùm ở ngọn, đung đưa theo gió (shader) */
export function Bamboo({ position, count = 9, seed = 1, height = 6 }) {
  const { stalks, leaves } = useMemo(() => {
    const rand = seeded(seed)
    const st = []
    const lv = []
    const o = new Object3D()
    for (let i = 0; i < count; i++) {
      const s = {
        x: (rand() - 0.5) * 1.6,
        z: (rand() - 0.5) * 1.6,
        h: height * (0.7 + rand() * 0.4),
        lean: (rand() - 0.5) * 0.2,
        leanX: (rand() - 0.5) * 0.12,
        c: STALK_COLORS[Math.floor(rand() * STALK_COLORS.length)],
      }
      st.push(s)
      o.position.set(s.x, 0, s.z)
      o.rotation.set(s.leanX, 0, s.lean)
      o.scale.set(1, s.h, 1)
      o.updateMatrix()
      s.matrix = o.matrix.clone()
      // Chùm lá nhọn ở 1/3 trên của thân
      const sprigs = 4
      for (let k = 0; k < sprigs; k++) {
        const t = 0.62 + (k / (sprigs - 1)) * 0.36
        const base = new Vector3(0, t, 0).applyMatrix4(s.matrix)
        const yaw0 = rand() * Math.PI * 2
        const n = k === sprigs - 1 ? 6 : 4
        for (let j = 0; j < n; j++) {
          lv.push({
            p: [base.x, base.y, base.z],
            yaw: yaw0 + (j / n) * Math.PI * 2 + (rand() - 0.5) * 0.5,
            pitch: 0.35 + rand() * 0.6,
            s: 0.8 + rand() * 0.5,
            c: BAMBOO_LEAF_COLORS[Math.floor(rand() * BAMBOO_LEAF_COLORS.length)],
          })
        }
      }
    }
    return { stalks: st, leaves: lv }
  }, [count, seed, height])

  const stalkRef = useRef()
  const leafRef = useRef()
  useLayoutEffect(() => {
    stalks.forEach((s, i) => {
      stalkRef.current.setMatrixAt(i, s.matrix)
      stalkRef.current.setColorAt(i, tmpC.set(s.c))
    })
    leaves.forEach((l, i) => {
      dummy.position.set(l.p[0], l.p[1], l.p[2])
      dummy.rotation.set(l.pitch, l.yaw, 0, 'YXZ')
      dummy.scale.setScalar(l.s)
      dummy.updateMatrix()
      leafRef.current.setMatrixAt(i, dummy.matrix)
      leafRef.current.setColorAt(i, tmpC.set(l.c))
    })
    dummy.rotation.order = 'XYZ'
    for (const m of [stalkRef.current, leafRef.current]) {
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
      m.computeBoundingSphere()
    }
  }, [stalks, leaves])

  const stalkMat = windToon('#ffffff', { vertexColors: true }, { amp: 0.32, speed: 1.05, root: true, lift: 1 })
  const leafMat = windToon('#ffffff', { side: DoubleSide }, { amp: 0.27, speed: 1.05 })
  return (
    <group position={position}>
      <instancedMesh key={`s${stalks.length}`} ref={stalkRef} args={[BAMBOO_GEO.stalk, stalkMat, stalks.length]} castShadow />
      <instancedMesh key={`l${leaves.length}`} ref={leafRef} args={[BAMBOO_GEO.leaf, leafMat, leaves.length]} />
    </group>
  )
}

/* ---------------- Đá tảng granite ---------------- */

const GRANITE = ['#7c776d', '#857f74', '#726d64', '#8b867b']
const MOSS = ['#6d8f3e', '#5f8238', '#7a9a45']

/**
 * Đá tảng low-poly: đỉnh xô lệch theo băm vị trí (các bản sao một đỉnh lệch như nhau → kín mặt),
 * mặt ngửa lên trời phủ rêu (vertex color) nếu moss = true.
 */
function rockGeometry(base, salt, moss) {
  const g = base.index ? base.toNonIndexed() : base
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const k = 0.84 + hash2(x * 7, z * 7 + y * 3, salt) * 0.3
    pos.setXYZ(i, x * k, y * k * (y < 0 ? 0.7 : 1), z * k)
  }
  g.computeVertexNormals()
  const nrm = g.attributes.normal
  const colors = []
  const c = new Color()
  for (let i = 0; i < pos.count; i += 3) {
    const up = nrm.getY(i)
    const f = hash2(pos.getX(i) * 13, pos.getZ(i) * 13, salt + 1)
    if (moss && up > 0.55) c.set(MOSS[Math.floor(f * MOSS.length)])
    else c.set(GRANITE[Math.floor(f * GRANITE.length)])
    for (let v = 0; v < 3; v++) colors.push(c.r, c.g, c.b)
  }
  g.setAttribute('color', new Float32BufferAttribute(colors, 3))
  return g
}

const ROCK_GEO = [
  rockGeometry(new DodecahedronGeometry(0.6, 0), 1, true),
  rockGeometry(new IcosahedronGeometry(0.6, 0), 2, true),
  rockGeometry(new OctahedronGeometry(0.6, 1), 3, false),
]
const PEBBLE_GEO = rockGeometry(new DodecahedronGeometry(0.5, 0), 4, false)

/** Chia đá tảng thành các lô (theo biến thể hình) + mảnh ghép phụ + đá vụn quanh chân */
function buildBoulders(items) {
  const variants = [[], [], []]
  const pebbles = []
  items.forEach((b) => {
    const h = hash2(b.x, b.z, 61)
    // Trên cao (đỉnh trơ gió) ít rêu
    const v = b.y > 45 && h < 0.7 ? 2 : Math.floor(h * 3)
    const tilt = (hash2(b.x, b.z, 62) - 0.5) * 0.35
    variants[v].push({ p: [b.x, b.y + b.s * 0.25, b.z], r: [tilt, b.rot, tilt * 0.6], s: [b.s, b.s * 0.72, b.s * 0.9] })
    // 1–2 mảnh đá ghép tựa vào khối chính (nằm trong bán kính khối chính)
    const pieces = 1 + Math.floor(hash2(b.x, b.z, 63) * 2)
    for (let k = 0; k < pieces; k++) {
      const a = b.rot + 1.3 + k * 2.4
      const ps = b.s * (0.38 + hash2(b.x + k, b.z, 64) * 0.16)
      const vv = (v + 1 + k) % 3
      variants[vv].push({ p: [b.x + Math.cos(a) * b.s * 0.42, b.y + ps * 0.18, b.z + Math.sin(a) * b.s * 0.42], r: [0.2, a, -0.15], s: [ps, ps * 0.75, ps * 0.9] })
    }
    // Đá vụn nhỏ quanh chân
    const n = 3 + Math.floor(hash2(b.x, b.z, 65) * 3)
    for (let k = 0; k < n; k++) {
      const a = b.rot * 1.7 + (k / n) * Math.PI * 2 + hash2(b.x, b.z + k, 66)
      const d = b.s * (0.5 + hash2(b.x + k, b.z, 67) * 0.3)
      const ps = Math.min(0.35, b.s * (0.07 + hash2(b.x, b.z - k, 68) * 0.08))
      pebbles.push({ p: [b.x + Math.cos(a) * d, b.y - 0.02, b.z + Math.sin(a) * d], r: [0, a, 0], s: [ps, ps * 0.6, ps * 0.85] })
    }
  })
  return { variants, pebbles }
}

function RockBatch({ list, geometry, castShadow }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    list.forEach((b, i) => {
      dummy.position.set(b.p[0], b.p[1], b.p[2])
      dummy.rotation.set(b.r[0], b.r[1], b.r[2])
      dummy.scale.set(b.s[0], b.s[1], b.s[2])
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      // Sáng tối nhẹ từng tảng
      const l = 0.86 + hash2(b.p[0], b.p[2], 69) * 0.22
      m.setColorAt(i, tmpC.setRGB(l, l, l))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    m.computeBoundingSphere()
  }, [list])
  if (!list.length) return null
  return (
    <instancedMesh key={list.length} ref={ref} args={[geometry, toon('#ffffff', { vertexColors: true, map: 'granite' }), list.length]} castShadow={castShadow} receiveShadow />
  )
}

/**
 * Đá tảng granite (đặc trưng núi Bà Đen) — instanced, 3 biến thể hình, rêu trên mặt ngửa,
 * mảnh ghép phụ và đá vụn quanh chân.
 * items: [{ x, y, z, s, rot }] — s là kích thước (m)
 */
export function Boulders({ items, castShadow = true }) {
  const { variants, pebbles } = useMemo(() => buildBoulders(items), [items])
  if (!items.length) return null
  return (
    <group>
      {variants.map((list, i) => (
        <RockBatch key={i} list={list} geometry={ROCK_GEO[i]} castShadow={castShadow} />
      ))}
      <RockBatch list={pebbles} geometry={PEBBLE_GEO} castShadow={false} />
    </group>
  )
}

/* ---------------- Bậc đá, mặt sân ---------------- */

/** Bậc đá trên mọi đường dốc (ramp) trong layout — vẽ một lần cho cả thế giới */
export function RampSteps() {
  const steps = useMemo(() => {
    const out = []
    for (const s of WALKABLES) {
      if (s.type !== 'ramp') continue
      const [ax, az, ay] = s.from
      const [bx, bz, by] = s.to
      const len = Math.hypot(bx - ax, bz - az)
      const n = Math.max(2, Math.round(len / 0.9))
      const rot = Math.atan2(bx - ax, bz - az)
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n
        out.push({ x: ax + (bx - ax) * t, z: az + (bz - az) * t, y: ay + (by - ay) * t, w: s.width, rot, rise: Math.abs(by - ay) / n, run: len / n })
      }
    }
    return out
  }, [])
  const ref = useRef()
  useLayoutEffect(() => {
    steps.forEach((st, i) => {
      dummy.position.set(st.x, st.y - 0.12, st.z)
      dummy.rotation.set(0, st.rot, 0)
      dummy.scale.set(st.w, 0.3 + st.rise, st.run * 1.02)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [steps])
  return (
    <instancedMesh ref={ref} args={[null, null, steps.length]} material={toon(PALETTE.stone, { flat: true })} receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  )
}

/** Mặt sân lát đá (đặt trên mặt đi được dạng rect/circle) — texture đá lặp ~2 m một ô */
export function Paving({ shape, color = PALETTE.tile }) {
  if (shape.type === 'circle') {
    const n = Math.max(1, Math.round(shape.r))
    return (
      <mesh position={[shape.cx, shape.y - 0.02, shape.cz]} rotation-x={-Math.PI / 2} material={toon(color, { map: 'stone', repeat: [n, n] })} receiveShadow>
        <circleGeometry args={[shape.r + 0.3, 40]} />
      </mesh>
    )
  }
  const mat = toon(color, { map: 'stone', repeat: [Math.max(1, Math.round(shape.w / 2)), Math.max(1, Math.round(shape.d / 2))] })
  return (
    <mesh position={[shape.cx, shape.y - 0.02, shape.cz]} rotation={[-Math.PI / 2, 0, shape.rot || 0]} material={mat} receiveShadow>
      <planeGeometry args={[shape.w + 0.4, shape.d + 0.4]} />
    </mesh>
  )
}
