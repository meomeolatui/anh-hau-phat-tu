import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BoxGeometry, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, IcosahedronGeometry, MeshBasicMaterial, Object3D, Vector3 } from 'three'
import { glow, toon } from '../materials'
import { runtime } from '../runtime'
import { useGame } from '../state'
import { groundSurface } from '../world/terrainGrid'
import { seeded } from '../../lib/random'
import { leafPalette, pickLeafColor } from './leafColors'

/**
 * Sự sống quanh người chơi: bướm (ngày), đom đóm (đêm), đàn chim (ngày), chuồn chuồn ở hồ sen,
 * lá rơi lả tả dưới cây lớn. Tất cả instanced, cập nhật ma trận trong useFrame (vài chục instance),
 * số lượng theo settings.quality, chỉ hoạt động gần người chơi.
 */

const dummy = new Object3D()
const tmpC = new Color()
const tmpV = new Vector3()

/** Số lượng theo chất lượng: [low, auto, high] */
const COUNTS = {
  butterflies: [0, 12, 22],
  fireflies: [70, 220, 380],
  birds: [5, 9, 13],
  dragonflies: [2, 4, 6],
  leaves: [0, 6, 10],
}
const countFor = (key, quality) => COUNTS[key][quality === 'low' ? 0 : quality === 'high' ? 2 : 1]

function fanGeometry(points) {
  // Quạt tam giác từ gốc (0,0,0) qua các điểm viền (mặt phẳng XZ)
  const v = []
  for (let i = 0; i < points.length - 1; i++) v.push(0, 0, 0, ...points[i], ...points[i + 1])
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(v, 3))
  g.computeVertexNormals()
  return g
}

const GEO = {
  // Cánh bướm (nửa phải): hai thuỳ trước/sau
  wing: fanGeometry([
    [0, 0, 0.05],
    [0.08, 0, 0.11],
    [0.14, 0, 0.05],
    [0.12, 0, -0.02],
    [0.1, 0, -0.08],
    [0.04, 0, -0.11],
    [0, 0, -0.06],
  ]),
  // Cánh chim (nửa phải), sải ~1 m
  birdWing: fanGeometry([
    [0, 0, 0.22],
    [0.55, 0, 0.05],
    [1.0, 0, -0.12],
    [0.4, 0, -0.14],
    [0, 0, -0.28],
  ]),
  leaf: fanGeometry([
    [0, 0, 0.09],
    [0.045, 0, 0],
    [0, 0, -0.09],
    [-0.045, 0, 0],
    [0, 0, 0.09],
  ]),
  spark: new IcosahedronGeometry(1, 0),
  dragonBody: new BoxGeometry(0.035, 0.035, 0.32),
  dragonWings: (() => {
    const v = []
    const quad = (x0, x1, z0, z1) => v.push(x0, 0, z0, x1, 0, z0, x1, 0, z1, x0, 0, z0, x1, 0, z1, x0, 0, z1)
    quad(-0.17, 0.17, 0.02, 0.065)
    quad(-0.15, 0.15, -0.045, -0.005)
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(v, 3))
    g.computeVertexNormals()
    return g
  })(),
}

const WING_MAT = new MeshBasicMaterial({ color: '#e8f6ff', transparent: true, opacity: 0.5, side: DoubleSide, depthWrite: false })
const BIRD_MAT = new MeshBasicMaterial({ color: '#3b3431', side: DoubleSide })

/* ---------------- Lá rơi dưới cây lớn ---------------- */

/**
 * Vài chiếc lá rơi lả tả từ tán cây lớn — màu theo tán (leafPalette của màu tán).
 * Đặt BÊN TRONG group của BigTree (toạ độ cục bộ đã nhân scale). origin: toạ độ thế giới của gốc cây.
 */
export function FallingLeaves({ color, origin, scale = 1, radius = 3.2, top = 5 }) {
  const quality = useGame((s) => s.save.settings.quality)
  const count = countFor('leaves', quality)
  const ref = useRef()
  const leaves = useMemo(() => {
    const rand = seeded(Math.round(Math.abs(origin[0] * 31 + origin[2] * 17)) + 1)
    const palette = leafPalette(color)
    return Array.from({ length: count }, (_, i) => ({
      rand,
      state: 'wait', // wait → fall → rest → wait
      timer: i * 1.7 + rand() * 2, // lần lượt rụng
      x: 0,
      y: 0,
      z: 0,
      ph: rand() * 6.28,
      speed: 0.5 + rand() * 0.35,
      color: pickLeafColor(rand, palette),
    }))
  }, [color, origin, count])

  useLayoutEffect(() => {
    if (!ref.current) return
    leaves.forEach((l, i) => ref.current.setColorAt(i, l.color))
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [leaves])

  useFrame((state, rawDt) => {
    const m = ref.current
    if (!m) return
    const p = runtime.player.position
    const near = Math.hypot(p.x - origin[0], p.z - origin[2]) < 45
    m.visible = near
    if (!near) return
    const dt = Math.min(rawDt, 0.05)
    const time = state.clock.elapsedTime
    leaves.forEach((l, i) => {
      if (l.state === 'wait') {
        l.timer -= dt
        dummy.scale.setScalar(0)
        if (l.timer <= 0) {
          // Rụng mới từ tán
          const a = l.rand() * Math.PI * 2
          const r = Math.sqrt(l.rand()) * radius
          l.x = Math.cos(a) * r
          l.z = Math.sin(a) * r
          l.y = top * (0.75 + l.rand() * 0.2)
          l.state = 'fall'
        }
      } else if (l.state === 'fall') {
        l.y -= (l.speed / scale) * dt
        const sw = Math.sin(time * 1.6 + l.ph)
        dummy.position.set(l.x + sw * 0.5, l.y, l.z + Math.cos(time * 1.1 + l.ph) * 0.35)
        dummy.rotation.set(sw * 0.9, time * 1.3 + l.ph, Math.cos(time * 2.1 + l.ph) * 0.7)
        dummy.scale.setScalar(1.4)
        if (l.y <= 0.03) {
          l.x = dummy.position.x
          l.z = dummy.position.z
          l.state = 'rest'
          l.timer = 4 + l.rand() * 5
        }
      } else {
        // Nằm trên đất một lúc rồi biến mất, chờ rụng lại
        l.timer -= dt
        dummy.position.set(l.x, 0.03, l.z)
        dummy.rotation.set(0, l.ph, 0)
        dummy.scale.setScalar(l.timer > 1 ? 1.4 : Math.max(0, l.timer) * 1.4)
        if (l.timer <= 0) {
          l.state = 'wait'
          l.timer = 1 + l.rand() * 5
        }
      }
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  if (!count) return null
  return <instancedMesh key={count} ref={ref} args={[GEO.leaf, toon('#ffffff', { side: DoubleSide }), count]} frustumCulled={false} />
}

/* ---------------- Bướm ---------------- */

const BUTTERFLY_COLORS = ['#f6d33c', '#ffffff', '#f08a4b', '#7fb2ff', '#f39bbb', '#f6d33c']

/** Bướm bay lượn quanh các khóm hoa gần người chơi (ban ngày) */
function Butterflies({ flowers, count, active }) {
  const ref = useRef()
  const flies = useMemo(() => {
    const rand = seeded(909)
    return Array.from({ length: count }, (_, i) => ({
      rand,
      pos: new Vector3(),
      target: new Vector3(),
      home: null,
      timer: 0,
      ph: rand() * 6.28,
      heading: 0,
      color: BUTTERFLY_COLORS[i % BUTTERFLY_COLORS.length],
    }))
  }, [count])
  const near = useRef({ list: [], timer: 0 })

  useLayoutEffect(() => {
    if (!ref.current) return
    flies.forEach((f, i) => {
      ref.current.setColorAt(i * 2, tmpC.set(f.color))
      ref.current.setColorAt(i * 2 + 1, tmpC.set(f.color))
    })
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [flies])

  useFrame((state, rawDt) => {
    const m = ref.current
    if (!m) return
    m.visible = active
    if (!active) return
    const dt = Math.min(rawDt, 0.05)
    const time = state.clock.elapsedTime
    const P = runtime.player.position
    // Danh sách hoa gần người chơi (làm mới ~1,5 giây một lần)
    const nr = near.current
    nr.timer -= dt
    if (nr.timer <= 0) {
      nr.timer = 1.5
      nr.list = flowers.filter((f) => Math.abs(f.x - P.x) < 32 && Math.abs(f.z - P.z) < 32 && Math.abs(f.y - P.y) < 12)
    }
    flies.forEach((f, i) => {
      if (!f.home || Math.hypot(f.home.x - P.x, f.home.z - P.z) > 38) {
        f.home = nr.list.length ? nr.list[Math.floor(f.rand() * nr.list.length)] : null
        if (f.home) {
          f.pos.set(f.home.x + (f.rand() - 0.5) * 3, f.home.y + 0.6 + f.rand(), f.home.z + (f.rand() - 0.5) * 3)
          f.timer = 0
        }
      }
      if (!f.home) {
        // Không có hoa gần: ẩn
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        m.setMatrixAt(i * 2, dummy.matrix)
        m.setMatrixAt(i * 2 + 1, dummy.matrix)
        return
      }
      f.timer -= dt
      if (f.timer <= 0 || f.pos.distanceTo(f.target) < 0.15) {
        if (nr.list.length && f.rand() < 0.25) f.home = nr.list[Math.floor(f.rand() * nr.list.length)]
        f.target.set(f.home.x + (f.rand() - 0.5) * 4, f.home.y + 0.25 + f.rand() * 1.4, f.home.z + (f.rand() - 0.5) * 4)
        f.timer = 1.5 + f.rand() * 2.5
      }
      const dx = f.target.x - f.pos.x
      const dy = f.target.y - f.pos.y
      const dz = f.target.z - f.pos.z
      const d = Math.hypot(dx, dy, dz) || 1
      const sp = 1.3 * dt
      f.pos.x += (dx / d) * sp + Math.sin(time * 3 + f.ph) * 0.4 * dt
      f.pos.y += (dy / d) * sp + Math.sin(time * 7 + f.ph) * 0.6 * dt
      f.pos.z += (dz / d) * sp + Math.cos(time * 2.6 + f.ph) * 0.4 * dt
      f.heading = Math.atan2(dx, dz)
      const flap = 0.15 + 1.05 * Math.abs(Math.sin(time * 15 + f.ph))
      dummy.position.copy(f.pos)
      dummy.rotation.set(0, f.heading, flap, 'YXZ')
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      m.setMatrixAt(i * 2, dummy.matrix)
      dummy.rotation.set(0, f.heading, -flap, 'YXZ')
      dummy.scale.set(-1, 1, 1)
      dummy.updateMatrix()
      m.setMatrixAt(i * 2 + 1, dummy.matrix)
    })
    dummy.rotation.order = 'XYZ'
    m.instanceMatrix.needsUpdate = true
  })

  if (!count) return null
  return <instancedMesh key={count} ref={ref} args={[GEO.wing, toon('#ffffff', { side: DoubleSide }), count * 2]} frustumCulled={false} />
}

/* ---------------- Đom đóm ---------------- */

/** Điểm tụ đom đóm cố định: quanh mép hồ sen chân núi */
const POND_SPOTS = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2
  return { x: 20 + Math.cos(a) * 6, y: 0.2, z: 10 + Math.sin(a) * 4 }
})

/**
 * Đom đóm ban đêm (vài trăm con, instanced): ~45% bay lượn quanh người chơi trong bán kính ~15 m,
 * còn lại tụ quanh bụi cỏ, khóm hoa, mép rừng ven lối đi và hồ sen gần đó.
 * level: mức đêm 0..1 — hiện từ 0,4 và sáng dần tới 0,85 (chạng vạng mờ). Màu glow > 1 để bloom làm loé.
 */
function Fireflies({ count, level, spots }) {
  const ref = useRef()
  const bugs = useMemo(() => {
    const rand = seeded(424)
    return Array.from({ length: count }, (_, i) => ({
      rand,
      swarm: i % 20 < 9,
      x: 0,
      y: 0,
      z: 0,
      placed: false,
      ph: rand() * 6.28,
      rate: 0.9 + rand() * 1.6,
      drift: 0.4 + rand() * 0.9,
      glowK: 0.75 + rand() * 0.5,
    }))
  }, [count])
  const near = useRef({ list: [], timer: 0 })
  const fade = Math.max(0, Math.min(1, (level - 0.4) / 0.45))

  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    bugs.forEach((b, i) => m.setColorAt(i, tmpC.setRGB(b.glowK * fade, b.glowK * fade, b.glowK * fade)))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [bugs, fade])

  useFrame((state, rawDt) => {
    const m = ref.current
    if (!m) return
    m.visible = fade > 0
    if (!m.visible) return
    const dt = Math.min(rawDt, 0.05)
    const time = state.clock.elapsedTime
    const P = runtime.player.position
    // Điểm tụ gần người chơi (làm mới 2 giây một lần)
    const nr = near.current
    nr.timer -= dt
    if (nr.timer <= 0) {
      nr.timer = 2
      const close = (s) => Math.abs(s.x - P.x) < 34 && Math.abs(s.z - P.z) < 34 && Math.abs(s.y - P.y) < 10
      nr.list = [...spots.filter(close), ...POND_SPOTS.filter(close)]
    }
    bugs.forEach((b, i) => {
      const own = b.swarm || !nr.list.length
      if (!b.placed || Math.hypot(b.x - P.x, b.z - P.z) > (own ? 15 : 36)) {
        if (own) {
          const a = b.rand() * Math.PI * 2
          const r = 1.5 + Math.sqrt(b.rand()) * 13
          b.x = P.x + Math.cos(a) * r
          b.z = P.z + Math.sin(a) * r
          b.y = Math.max(groundSurface(b.x, b.z), P.y - 3) + 0.5 + b.rand() * 2.5
        } else {
          const s = nr.list[Math.floor(b.rand() * nr.list.length)]
          b.x = s.x + (b.rand() - 0.5) * 3
          b.z = s.z + (b.rand() - 0.5) * 3
          b.y = s.y + 0.3 + b.rand() * 2
        }
        b.placed = true
      }
      // Chớp tắt lệch pha, bay lượn chậm
      const blink = Math.max(0, Math.sin(time * b.rate + b.ph * 5)) ** 3
      const t = time * 0.35 * b.drift
      dummy.position.set(
        b.x + Math.sin(t + b.ph) * 1.2 + Math.sin(t * 2.3 + b.ph) * 0.3,
        b.y + Math.sin(t * 1.4 + b.ph * 1.3) * 0.4,
        b.z + Math.cos(t * 0.9 + b.ph) * 1.2,
      )
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(0.016 + 0.05 * blink)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  if (!count) return null
  return <instancedMesh key={count} ref={ref} args={[GEO.spark, glow('#e4ff74', 1, 2.4), count]} frustumCulled={false} />
}

/* ---------------- Đàn chim ---------------- */

/** Đàn chim bay hình chữ V vòng xa trên trời, quanh vùng người chơi (ban ngày) */
function Birds({ count, active }) {
  const ref = useRef()
  const center = useRef(null)
  useFrame((state, rawDt) => {
    const m = ref.current
    if (!m) return
    m.visible = active
    if (!active) return
    const dt = Math.min(rawDt, 0.05)
    const time = state.clock.elapsedTime
    const P = runtime.player.position
    if (!center.current) center.current = new Vector3(P.x, P.y, P.z - 40)
    // Tâm vòng bay trôi chậm theo người chơi
    center.current.lerp(tmpV.set(P.x, P.y, P.z - 40), Math.min(1, dt * 0.05))
    const c = center.current
    const th = time * 0.045
    const R = 75
    const lx = c.x + Math.cos(th) * R
    const lz = c.z + Math.sin(th) * R
    const ly = c.y + 44 + Math.sin(time * 0.2) * 3
    // Hướng bay: tiếp tuyến vòng tròn
    const fx = -Math.sin(th)
    const fz = Math.cos(th)
    const heading = Math.atan2(fx, fz)
    for (let i = 0; i < count; i++) {
      const row = Math.ceil(i / 2)
      const side = i === 0 ? 0 : i % 2 ? 1 : -1
      // Lệch theo khung hướng bay: lùi sau đầu đàn, toả hai bên
      const back = row * 2.6
      const wide = side * row * 2.4
      const x = lx - fx * back + fz * wide
      const z = lz - fz * back - fx * wide
      const y = ly + Math.sin(time * 0.9 + i) * 0.5
      const flap = Math.sin(time * 6 + i * 0.8) * 0.55 * (Math.sin(time * 0.6 + i) > -0.3 ? 1 : 0.15)
      dummy.position.set(x, y, z)
      dummy.rotation.set(0, heading, flap, 'YXZ')
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      m.setMatrixAt(i * 2, dummy.matrix)
      dummy.rotation.set(0, heading, -flap, 'YXZ')
      dummy.scale.set(-1, 1, 1)
      dummy.updateMatrix()
      m.setMatrixAt(i * 2 + 1, dummy.matrix)
    }
    dummy.rotation.order = 'XYZ'
    m.instanceMatrix.needsUpdate = true
  })
  if (!count) return null
  return <instancedMesh key={count} ref={ref} args={[GEO.birdWing, BIRD_MAT, count * 2]} frustumCulled={false} />
}

/* ---------------- Chuồn chuồn hồ sen ---------------- */

/** Hồ sen chân núi (toạ độ thế giới) — khớp LotusPond trong ChanNui */
const POND = { x: 20, z: 10, w: 10, d: 6, y: 0.2 }
const DRAGON_COLORS = ['#2f6fd1', '#d23a2a', '#3aa86b', '#e0a030', '#2f6fd1', '#d23a2a']

function Dragonflies({ count, active }) {
  const body = useRef()
  const wings = useRef()
  const flies = useMemo(() => {
    const rand = seeded(5150)
    return Array.from({ length: count }, (_, i) => ({
      rand,
      pos: new Vector3(POND.x + (rand() - 0.5) * POND.w, POND.y + 0.5, POND.z + (rand() - 0.5) * POND.d),
      target: new Vector3(),
      timer: rand() * 2,
      dart: false,
      heading: rand() * 6.28,
      color: DRAGON_COLORS[i % DRAGON_COLORS.length],
    }))
  }, [count])

  useLayoutEffect(() => {
    if (!body.current) return
    flies.forEach((f, i) => body.current.setColorAt(i, tmpC.set(f.color)))
    if (body.current.instanceColor) body.current.instanceColor.needsUpdate = true
  }, [flies])

  useFrame((state, rawDt) => {
    if (!body.current || !wings.current) return
    const P = runtime.player.position
    const on = active && Math.hypot(P.x - POND.x, P.z - POND.z) < 50 && Math.abs(P.y - POND.y) < 10
    body.current.visible = on
    wings.current.visible = on
    if (!on) return
    const dt = Math.min(rawDt, 0.05)
    const time = state.clock.elapsedTime
    flies.forEach((f, i) => {
      if (f.dart) {
        const d = f.pos.distanceTo(f.target)
        const step = 4 * dt
        if (d <= step) {
          f.pos.copy(f.target)
          f.dart = false
          f.timer = 0.8 + f.rand() * 2
        } else {
          tmpV.subVectors(f.target, f.pos).multiplyScalar(step / d)
          f.pos.add(tmpV)
        }
      } else {
        f.timer -= dt
        if (f.timer <= 0) {
          f.target.set(POND.x + (f.rand() - 0.5) * (POND.w + 1.5), POND.y + 0.3 + f.rand() * 0.8, POND.z + (f.rand() - 0.5) * (POND.d + 1.5))
          f.heading = Math.atan2(f.target.x - f.pos.x, f.target.z - f.pos.z)
          f.dart = true
        }
      }
      const hover = f.dart ? 0 : Math.sin(time * 9 + i) * 0.015
      dummy.position.set(f.pos.x, f.pos.y + hover, f.pos.z)
      dummy.rotation.set(0, f.heading, 0)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      body.current.setMatrixAt(i, dummy.matrix)
      dummy.position.y += 0.02
      dummy.rotation.set(0, f.heading, Math.sin(time * 55 + i) * 0.3, 'YXZ')
      dummy.updateMatrix()
      wings.current.setMatrixAt(i, dummy.matrix)
      dummy.rotation.order = 'XYZ'
    })
    body.current.instanceMatrix.needsUpdate = true
    wings.current.instanceMatrix.needsUpdate = true
  })

  if (!count) return null
  return (
    <group>
      <instancedMesh key={`b${count}`} ref={body} args={[GEO.dragonBody, toon('#ffffff'), count]} frustumCulled={false} />
      <instancedMesh key={`w${count}`} ref={wings} args={[GEO.dragonWings, WING_MAT, count]} frustumCulled={false} />
    </group>
  )
}

/**
 * Toàn bộ sự sống của thế giới.
 * nightLevel: 0 = ngày … 1 = đêm hẳn (skyAt(hour).night) — đom đóm hiện từ 0,4 và sáng dần;
 * bướm, chim, chuồn chuồn chỉ ban ngày. flowers/grass: từ scatterFlora (bướm quanh hoa, đom đóm quanh bụi cỏ).
 */
export default function Life({ nightLevel = 0, flowers = [], grass = [] }) {
  const quality = useGame((s) => s.save.settings.quality)
  const day = nightLevel < 0.5
  const spots = useMemo(() => [...flowers, ...grass.filter((_, i) => i % 3 === 0)], [flowers, grass])
  return (
    <group name="su-song">
      <Butterflies flowers={flowers} count={flowers.length ? countFor('butterflies', quality) : 0} active={day} />
      <Fireflies count={countFor('fireflies', quality)} level={nightLevel} spots={spots} />
      <Birds count={countFor('birds', quality)} active={day} />
      <Dragonflies count={countFor('dragonflies', quality)} active={day} />
    </group>
  )
}
