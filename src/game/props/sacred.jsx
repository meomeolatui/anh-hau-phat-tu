import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PALETTE, glow, toon } from '../materials'
import { Parts, cached, vcMat } from './geom'
import { useDetail } from './detail'
import { WaterSurface } from './water'
import {
  addLotusThrone,
  buildBell,
  buildBellTower,
  buildBodhisattva,
  buildBodoan,
  buildIncenseBurner,
  buildIncenseSticks,
  buildLanternFrame,
  buildPond,
  buildSeatedBuddha,
  buildStoneLantern,
  lanternBodyGeo,
} from './sacredGeometry'

/**
 * Đồ thờ tự & vật dụng chùa. Tượng được tạo hình TRANG NGHIÊM (mắt khép hiền, chân mày cong, môi mỉm,
 * nếp áo cà sa nhiều lớp, tóc xoắn ốc), không đùa cợt.
 * Hình học dựng sẵn trong sacredGeometry.js, gộp theo vật liệu + cache theo tham số → ít draw call.
 */

/** Đài sen nhiều lớp cánh cong có viền, đế sen úp, eo chuỗi hạt */
export function LotusThrone({ r = 0.8, layers = 2, color = PALETTE.gold, position }) {
  const detail = useDetail()
  const geo = useMemo(
    () =>
      cached(`throne|${layers}|${color}|${detail}`, () => {
        const B = new Parts()
        addLotusThrone(B, { layers, color, detail })
        return B.build()
      }),
    [layers, color, detail],
  )
  return <mesh geometry={geo} material={vcMat()} position={position} scale={r} castShadow receiveShadow />
}

/**
 * Tượng Phật ngồi kiết già trên đài sen, tay kết ấn thiền định.
 * size = chiều cao xấp xỉ (m). halo: vầng hào quang hoa văn phía sau.
 */
export function SeatedBuddha({ size = 2.4, color = PALETTE.gold, halo = true, position, rotation }) {
  const detail = useDetail()
  const k = size / 2.4
  const g = useMemo(() => cached(`buddha|${color}|${halo}|${detail}`, () => buildSeatedBuddha({ color, halo, detail })), [color, halo, detail])
  return (
    <group position={position} rotation={rotation} scale={k}>
      <mesh geometry={g.body} material={vcMat()} castShadow receiveShadow />
      {halo && (
        <mesh position={g.haloAt} material={glow('#ffd77a', 0.35)}>
          <torusGeometry args={[0.55, 0.05, 6, 40]} />
        </mesh>
      )}
    </group>
  )
}

/**
 * Tượng Bồ Tát đứng trên đài sen (tượng Phật Bà lớn trên đỉnh và tượng Quán Âm).
 * size = chiều cao tượng (không gồm bệ), tay chắp trước ngực.
 */
export function StandingBodhisattva({ size = 3, color = PALETTE.bronze, position, rotation, withThrone = true }) {
  const detail = useDetail()
  const k = size / 3
  const body = useMemo(() => cached(`bodhi|${color}|${detail}`, () => buildBodhisattva({ color, detail })), [color, detail])
  return (
    <group position={position} rotation={rotation}>
      {withThrone && <LotusThrone r={0.9 * k} layers={3} color={color} />}
      <mesh geometry={body} material={vcMat()} position={[0, withThrone ? 0.75 * k : 0, 0]} scale={k} castShadow receiveShadow />
    </group>
  )
}

/** Khói hương: dải khói mảnh uốn lượn bay lên, nở dần rồi tan */
export function IncenseSmoke({ position, intensity = 1 }) {
  const puffs = useRef([])
  const offsets = useMemo(() => Array.from({ length: 12 }, (_, i) => i / 12), [])
  const mat = useMemo(() => glow('#f1f0f4', 0.22), [])
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.18
    puffs.current.forEach((m, i) => {
      if (!m) return
      const c = (t + offsets[i]) % 1
      // Càng lên cao càng xoáy rộng; gần đỉnh thì thu nhỏ để giả lập tan biến
      const fade = c > 0.7 ? 1 - (c - 0.7) / 0.3 : 1
      m.position.set(Math.sin(c * 7 + t * 3) * 0.18 * c, c * 2.6, Math.cos(c * 6 + t * 2) * 0.14 * c)
      m.scale.setScalar((0.025 + c * 0.13) * fade * intensity)
      m.visible = intensity > 0.01
    })
  })
  return (
    <group position={position}>
      {offsets.map((_, i) => (
        <mesh key={i} ref={(el) => (puffs.current[i] = el)} material={mat}>
          <sphereGeometry args={[1, 8, 6]} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Lư hương đồng ba chân cong trên bệ đá chạm hoa thị. `sticks`: số nén đang cháy (hiện que hương + khói).
 */
export function IncenseBurner({ position, scale = 1, sticks = 0 }) {
  const detail = useDetail()
  const g = useMemo(() => cached(`burner|${detail}`, () => buildIncenseBurner(detail)), [detail])
  const n = Math.min(sticks, 9)
  const s = useMemo(() => (n > 0 ? cached(`sticks|${n}`, () => buildIncenseSticks(n)) : null), [n])
  return (
    <group position={position} scale={scale}>
      <mesh geometry={g.stone} material={vcMat('stone')} castShadow receiveShadow />
      <mesh geometry={g.bronze} material={vcMat()} castShadow />
      {s && (
        <>
          <mesh geometry={s.sticks} material={vcMat()} />
          <mesh geometry={s.embers} material={glow('#ff7a3d')} />
        </>
      )}
      {sticks > 0 && <IncenseSmoke position={[0, 1.7, 0]} intensity={Math.min(1, 0.5 + sticks * 0.1)} />}
    </group>
  )
}

/** Bồ đoàn (đệm ngồi thiền tròn xếp nếp, viền ống, nút giữa) */
export function Bodoan({ position, color = '#b8862f' }) {
  const detail = useDetail()
  const geo = useMemo(() => cached(`bodoan|${color}|${detail}`, () => buildBodoan(color, detail)), [color, detail])
  return <mesh geometry={geo} material={vcMat('cloth')} position={position} castShadow receiveShadow />
}

/**
 * Đèn lồng treo/đứng có gân vàng, nắp chóp, tua rua — phát sáng khi `lit` (ban đêm).
 * `light`: thêm nguồn sáng thật (pointLight) — tốn hiệu năng, chỉ bật cho vài đèn chính mỗi khu vực.
 */
export function Lantern({ position, lit = false, color = '#d83a2e', hang = 0, light = false }) {
  const detail = useDetail()
  const body = useMemo(() => cached('lantern-body', lanternBodyGeo), [])
  const frame = useMemo(() => cached(`lantern|${hang}|${color}|${detail}`, () => buildLanternFrame({ hang, color, detail })), [hang, color, detail])
  return (
    <group position={position}>
      <mesh geometry={body} material={lit ? glow(color) : toon(color, { map: 'cloth' })} />
      <mesh geometry={frame} material={vcMat()} />
      {lit && light && <pointLight color="#ffb36b" intensity={3} distance={7} decay={2} />}
    </group>
  )
}

/** Đèn đá (thạch đăng): đế lục giác, thân đai, buồng đèn bốn trụ, mái cong đầu đao, búp sen */
export function StoneLantern({ position, lit = false }) {
  const detail = useDetail()
  const geo = useMemo(() => cached(`stone-lantern|${detail}`, () => buildStoneLantern(detail)), [detail])
  return (
    <group position={position}>
      <mesh geometry={geo} material={vcMat('stone')} castShadow />
      <mesh position={[0, 0.86, 0]} material={lit ? glow('#ffcf7a') : toon('#e8dcc0')}>
        <boxGeometry args={[0.28, 0.24, 0.28]} />
      </mesh>
    </group>
  )
}

/** Hồ sen: bờ đá ghép, mặt nước (WaterSurface), lá sen gân toả, hoa sen nhiều cánh, nụ, lá vươn cao */
export function LotusPond({ position, w = 8, d = 5, seed = 3 }) {
  const detail = useDetail()
  const g = useMemo(() => cached(`pond|${w}|${d}|${seed}|${detail}`, () => buildPond(w, d, seed, detail)), [w, d, seed, detail])
  return (
    <group position={position}>
      <mesh geometry={g.stone} material={vcMat('stone')} castShadow receiveShadow />
      <WaterSurface w={w} d={d} position={[0, 0.21, 0]} />
      <mesh geometry={g.plants} material={vcMat()} castShadow />
    </group>
  )
}

/**
 * Gác chuông: nền đá, bốn cột son, lan can ba mặt, mái hai tầng lưỡng long chầu nhật; chuông đồng có đai,
 * núm, toà sen thỉnh, quai bồ lao. Chày gỗ treo ngang (BellSpot dò đúng hình dạng chày này để thay bằng con lắc).
 */
export function BellTower({ position, rotation, swing = 0 }) {
  const detail = useDetail()
  const wood = toon(PALETTE.woodDark)
  const tower = useMemo(() => cached(`bell-tower|${detail}`, () => buildBellTower(detail)), [detail])
  const bell = useMemo(() => cached(`bell|${detail}`, () => buildBell(detail)), [detail])
  const log = useRef()
  useFrame(() => {
    if (log.current) log.current.position.z = 0.95 - swing * 0.6
  })
  return (
    <group position={position} rotation={rotation}>
      {tower.stone && <mesh geometry={tower.stone} material={vcMat('stone')} receiveShadow />}
      <mesh geometry={tower.body} material={vcMat('plaster')} castShadow receiveShadow />
      <mesh geometry={tower.tile} material={vcMat('roof')} castShadow receiveShadow />
      <mesh geometry={tower.trim} material={vcMat()} castShadow />
      <group position={[0, 3.4, 0]}>
        <mesh geometry={bell} material={vcMat()} castShadow />
        {/* Chày gỗ treo ngang */}
        <mesh ref={log} position={[0, -1.0, 0.95]} rotation-x={Math.PI / 2} material={wood}>
          <cylinderGeometry args={[0.12, 0.12, 1.4, 8]} />
        </mesh>
      </group>
    </group>
  )
}
