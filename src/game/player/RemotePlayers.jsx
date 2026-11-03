import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Color, ConeGeometry, Object3D, SphereGeometry, Vector3 } from 'three'
import Avatar from './Avatar'
import { OUTFITS } from './looks'
import { COSTUMES } from '../shop/wardrobe'
import { runtime } from '../runtime'
import { toon } from '../materials'
import { getRemote, isStale, sampleRemote, useRemoteList } from '../../net/remotes'
import { SELF_BUBBLE_ID } from '../../net/online'

/**
 * Người chơi khác (online).
 *  - FULL_MAX người gần nhất trong FULL_RADIUS: nhân vật đầy đủ (Avatar: trang phục, động tác) + bảng tên, bong bóng chat
 *  - Người xa hơn (tới FAR_RADIUS): hình giản lược vẽ chung một InstancedMesh → vài trăm người vẫn mượt
 */
const FULL_MAX = 24
const FULL_RADIUS = 50
const FAR_RADIUS = 130
const MAX_FAR = 500

const IDLE = Object.freeze({ anim: 'idle', speed: 0, holding: null })
const robeColor = (look) => COSTUMES[look?.costume]?.robe ?? OUTFITS[look?.outfit]?.color ?? '#8a7a66'

/** Bảng tên + bong bóng chat trên đầu */
function Tag({ name, bubbleRef }) {
  return (
    <Html position={[0, 2.25, 0]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div className="flex flex-col items-center gap-1 select-none">
        <div ref={bubbleRef} className="hidden w-max max-w-[220px] rounded-2xl bg-white/95 px-3 py-1.5 text-center text-sm leading-snug text-stone-800 shadow-lg" />
        <div className="rounded-full bg-stone-900/60 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-white backdrop-blur-sm">{name}</div>
      </div>
    </Html>
  )
}

function RemoteAvatar({ id, name, look }) {
  const group = useRef()
  const bubble = useRef()
  const shownBubble = useRef(null)
  const profile = useMemo(() => ({ role: look?.role, outfit: look?.outfit, skin: look?.skin, hair: look?.hair, costume: look?.costume, hat: look?.hat }), [look])

  useFrame(() => {
    const p = getRemote(id)
    const g = group.current
    if (!p || !g) return
    const now = performance.now()
    const s = sampleRemote(p, now)
    if (!s) return
    g.position.set(s.x, s.y, s.z)
    g.rotation.y = s.r
    const emote = p.emote && now < p.emote.until && s.s < 0.3 ? p.emote.anim : null
    // Nguồn động tác của người này nằm trong kho remotes (dữ liệu ngoài React) — cập nhật tại chỗ
    const src = p.source
    src.anim = emote ?? s.a
    src.speed = s.s
    src.holding = s.h
    // Bong bóng chat: chỉ đụng DOM khi nội dung đổi
    const text = p.bubble && now < p.bubble.until ? p.bubble.text : null
    if (text !== shownBubble.current && bubble.current) {
      shownBubble.current = text
      bubble.current.textContent = text ?? ''
      bubble.current.classList.toggle('hidden', !text)
    }
  })

  return (
    <group ref={group}>
      <Avatar source={getRemote(id)?.source ?? IDLE} profile={profile} />
      <Tag name={name} bubbleRef={bubble} />
    </group>
  )
}

const bodyGeo = new ConeGeometry(0.3, 1.25, 10).translate(0, 0.62, 0)
const headGeo = new SphereGeometry(0.19, 12, 10).translate(0, 1.42, 0)
const dummy = new Object3D()
const tint = new Color()

/** Người ở xa: thân + đầu giản lược, màu theo áo, vẽ chung một lượt */
function FarCrowd({ fullIds }) {
  const body = useRef()
  const head = useRef()
  const remotes = useRemoteList()
  useFrame(() => {
    const b = body.current
    const h = head.current
    if (!b || !h) return
    const me = runtime.player.position
    const now = performance.now()
    let n = 0
    for (const p of remotes) {
      if (n >= MAX_FAR || fullIds.has(p.id) || isStale(p, now)) continue
      const s = sampleRemote(p, now)
      if (!s || Math.hypot(s.x - me.x, s.z - me.z) > FAR_RADIUS) continue
      dummy.position.set(s.x, s.y, s.z)
      dummy.rotation.set(0, s.r, 0)
      dummy.updateMatrix()
      b.setMatrixAt(n, dummy.matrix)
      h.setMatrixAt(n, dummy.matrix)
      b.setColorAt(n, tint.set(robeColor(p.look)))
      n++
    }
    b.count = n
    h.count = n
    b.instanceMatrix.needsUpdate = true
    h.instanceMatrix.needsUpdate = true
    if (b.instanceColor) b.instanceColor.needsUpdate = true
  })
  return (
    <>
      <instancedMesh ref={body} args={[bodyGeo, toon('#ffffff'), MAX_FAR]} frustumCulled={false} castShadow />
      <instancedMesh ref={head} args={[headGeo, toon('#e3b48c'), MAX_FAR]} frustumCulled={false} />
    </>
  )
}

/**
 * Neo bong bóng chat của chính mình: chiếu đỉnh đầu nhân vật ra màn hình mỗi khung hình,
 * đặt vị trí cho phần tử DOM SELF_BUBBLE_ID (hud/OnlineHud.jsx vẽ nội dung).
 */
const headPos = new Vector3()
function SelfBubbleAnchor() {
  const el = useRef(null)
  useFrame(({ camera, size }) => {
    if (!el.current?.isConnected) el.current = document.getElementById(SELF_BUBBLE_ID)
    const box = el.current
    if (!box) return
    const p = runtime.player.position
    headPos.set(p.x, p.y + (runtime.player.jump?.h ?? 0) + 2.05, p.z).project(camera)
    const behind = headPos.z > 1
    box.style.transform = `translate(-50%, -100%) translate(${((headPos.x * 0.5 + 0.5) * size.width).toFixed(1)}px, ${((-headPos.y * 0.5 + 0.5) * size.height).toFixed(1)}px)`
    box.style.visibility = behind ? 'hidden' : ''
  })
  return null
}

export default function RemotePlayers() {
  const remotes = useRemoteList()
  const [fullIds, setFullIds] = useState(() => new Set())
  const timer = useRef(0)

  // Chọn người vẽ đầy đủ: gần nhất, còn tín hiệu, trong FULL_RADIUS (tính lại 2 lần/giây)
  useFrame((_, dt) => {
    timer.current += dt
    if (timer.current < 0.5) return
    timer.current = 0
    const me = runtime.player.position
    const now = performance.now()
    const ranked = []
    for (const p of remotes) {
      if (isStale(p, now)) continue
      const s = sampleRemote(p, now)
      if (!s) continue
      const d = Math.hypot(s.x - me.x, s.z - me.z)
      if (d <= FULL_RADIUS) ranked.push([d, p.id])
    }
    ranked.sort((a, b) => a[0] - b[0])
    const next = new Set(ranked.slice(0, FULL_MAX).map((r) => r[1]))
    if (next.size !== fullIds.size || [...next].some((id) => !fullIds.has(id))) setFullIds(next)
  })

  return (
    <>
      {remotes
        .filter((p) => fullIds.has(p.id))
        .map((p) => (
          <RemoteAvatar key={p.id} id={p.id} name={p.name} look={p.look} />
        ))}
      <FarCrowd fullIds={fullIds} />
      <SelfBubbleAnchor />
    </>
  )
}
