import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, DoubleSide, LatheGeometry, TubeGeometry, Vector2, Vector3 } from 'three'
import { DOWN_SIDE, HANG, RIDE_SPEED, UP_SIDE, cableLines, pointOnLine } from '../cableway'
import { runtime } from '../runtime'
import { PALETTE, toon } from '../materials'

/**
 * Hệ cáp treo nhìn thấy được: hai sợi cáp mỗi tuyến (bám địa hình, có trụ đỡ), các cabin chạy
 * liên tục lên/xuống, và cabin chở người chơi (đi theo runtime.player.ride).
 * Cabin có thân dưới + mái đặc, dải kính trong suốt ở giữa để thấy người ngồi bên trong.
 */

const lathe = (pts, seg = 22) => new LatheGeometry(pts.map(([r, y]) => new Vector2(r, y)), seg)

// Kích thước thật (m): thân cao ~2.4 m, rộng ~2.7 m; tay treo nối lên cáp ở độ cao HANG trên tâm cabin
const CABIN_GEO = {
  lower: lathe([
    [0, -1.2],
    [1.08, -1.2],
    [1.27, -0.98],
    [1.36, -0.38],
    [1.3, -0.38],
  ]),
  upper: lathe([
    [1.3, 0.63],
    [1.34, 0.63],
    [1.14, 1.06],
    [0.45, 1.2],
    [0, 1.2],
  ]),
  glass: lathe(
    [
      [1.36, -0.38],
      [1.37, 0.12],
      [1.34, 0.63],
    ],
    22,
  ),
  floor: lathe([
    [0, -1.1],
    [1.2, -1.1],
  ]),
}

const CABIN_COLORS = ['#f2a2bd', '#4bb399', '#f0b23a', '#e8664a', '#7aa7d9']

function Cabin({ color = '#f2a2bd' }) {
  const shell = toon(color)
  const trim = toon('#f3efe4')
  const steel = toon('#4b5258')
  const glass = useMemo(() => toon('#bfe3ee', { transparent: true, opacity: 0.28, side: DoubleSide }), [])
  return (
    <group scale={[1, 1, 0.9]}>
      <mesh geometry={CABIN_GEO.lower} material={shell} castShadow />
      <mesh geometry={CABIN_GEO.upper} material={shell} castShadow />
      <mesh geometry={CABIN_GEO.floor} material={toon('#5a5148', { side: DoubleSide })} />
      <mesh geometry={CABIN_GEO.glass} material={glass} />
      {/* Viền trắng trên/dưới dải kính và 4 trụ khung */}
      {[-0.38, 0.63].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation-x={Math.PI / 2} material={trim}>
          <torusGeometry args={[1.35, 0.035, 6, 32]} />
        </mesh>
      ))}
      {[0.785, 2.356, 3.927, 5.498].map((a) => (
        <mesh key={a} position={[Math.cos(a) * 1.34, 0.125, Math.sin(a) * 1.34]} material={trim}>
          <boxGeometry args={[0.07, 1.01, 0.07]} />
        </mesh>
      ))}
      {/* Ghế ngồi giữa cabin */}
      <mesh position={[0, -0.76, -0.05]} material={toon(PALETTE.wood)}>
        <boxGeometry args={[1.5, 0.08, 0.5]} />
      </mesh>
      {/* Tay treo + kẹp cáp */}
      <mesh position={[0, (1.2 + HANG) / 2, 0]} material={steel}>
        <cylinderGeometry args={[0.06, 0.06, HANG - 1.2, 8]} />
      </mesh>
      <mesh position={[0, HANG, 0]} material={steel}>
        <boxGeometry args={[0.7, 0.16, 0.26]} />
      </mesh>
      {[-0.22, 0.22].map((z) => (
        <mesh key={z} position={[0, HANG + 0.06, z * 1.1]} rotation-x={Math.PI / 2} material={toon('#2f3438')}>
          <cylinderGeometry args={[0.12, 0.12, 0.1, 10]} />
        </mesh>
      ))}
    </group>
  )
}

/** Hai sợi cáp của một tuyến */
function Cables({ line }) {
  const geos = useMemo(
    () =>
      [-1, 1].map((side) => {
        const pts = []
        const n = line.points.length * 2
        for (let i = 0; i <= n; i++) pts.push(new Vector3(...pointOnLine(line, (i / n) * line.length, side)))
        return new TubeGeometry(new CatmullRomCurve3(pts), n * 2, 0.045, 5, false)
      }),
    [line],
  )
  const steel = toon('#3b4146')
  return geos.map((g, i) => <mesh key={i} geometry={g} material={steel} />)
}

/** Trụ cáp thép: hai chân choãi, xà ngang, bánh đỡ cáp hai bên */
function Tower({ tower, heading }) {
  const h = tower.top - tower.ground
  const steel = toon('#5b6268')
  const dark = toon('#2f3438')
  return (
    <group position={[tower.x, tower.ground, tower.z]} rotation-y={heading}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.55, h / 2, 0]} rotation-z={-s * 0.05} material={steel} castShadow>
          <boxGeometry args={[0.32, h, 0.32]} />
        </mesh>
      ))}
      {[0.3, 0.6].map((k) => (
        <mesh key={k} position={[0, h * k, 0]} material={steel}>
          <boxGeometry args={[1.3, 0.16, 0.16]} />
        </mesh>
      ))}
      <mesh position={[0, h - 0.3, 0]} material={steel} castShadow>
        <boxGeometry args={[3.2, 0.3, 0.4]} />
      </mesh>
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} position={[x, h - 0.05, 0]} rotation-z={Math.PI / 2} material={dark}>
          <cylinderGeometry args={[0.16, 0.16, 0.22, 10]} />
        </mesh>
      ))}
    </group>
  )
}

/** Cabin không người chạy vòng trên tuyến: lên bằng sợi bên phải, xuống bằng sợi bên trái (nhìn từ ga thấp) */
function IdleCabins({ line, count = 2, seed = 0 }) {
  const refs = useRef([])
  const cabins = useMemo(
    () =>
      Array.from({ length: count * 2 }, (_, i) => ({
        dir: i % 2 ? -1 : 1,
        offset: ((i + 0.5) / (count * 2)) * line.length + seed * 13,
        color: CABIN_COLORS[(i + seed) % CABIN_COLORS.length],
      })),
    [line, count, seed],
  )
  useFrame((state) => {
    const t = state.clock.elapsedTime
    cabins.forEach((c, i) => {
      const g = refs.current[i]
      if (!g) return
      // Chạy qua lại giữa hai ga (dừng chốc lát ở mỗi đầu)
      const period = (line.length / (RIDE_SPEED * 0.8)) * 2 + 6
      const ph = ((t + c.offset / RIDE_SPEED) % period) / period
      const k = Math.min(1, Math.max(0, (ph < 0.5 ? ph * 2 : 2 - ph * 2) * 1.08 - 0.04))
      const forward = c.dir > 0 ? k : 1 - k
      const s = forward * line.length
      const [x, y, z] = pointOnLine(line, s, c.dir > 0 ? UP_SIDE : DOWN_SIDE)
      g.position.set(x, y - HANG, z)
      g.rotation.y = line.heading + (c.dir > 0 ? 0 : Math.PI)
    })
  })
  return cabins.map((c, i) => (
    <group key={i} ref={(el) => (refs.current[i] = el)}>
      <Cabin color={c.color} />
    </group>
  ))
}

/** Cabin chở người chơi (đi theo chuyến trong runtime.player.ride) */
function RiderCabin() {
  const ref = useRef()
  useFrame(() => {
    const g = ref.current
    const ride = runtime.player.ride
    if (!g) return
    g.visible = Boolean(ride?.cabin)
    if (!ride?.cabin) return
    g.position.set(...ride.cabin)
    g.rotation.y = ride.heading
  })
  return (
    <group ref={ref} visible={false}>
      <Cabin color="#f2a2bd" />
    </group>
  )
}

export default function Cableway() {
  const lines = useMemo(() => cableLines(), [])
  return (
    <group name="cap-treo">
      {lines.map((line, i) => (
        <group key={line.id}>
          <Cables line={line} />
          {line.towers.map((t) => (
            <Tower key={`${t.x},${t.z}`} tower={t} heading={line.heading} />
          ))}
          <IdleCabins line={line} count={2} seed={i * 3} />
        </group>
      ))}
      <RiderCabin />
    </group>
  )
}
