import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import World from './world/World'
import PostFX from './world/PostFX'
import FpsMeter from './fx/FpsMeter'
import { postFxEnabled, wantsFpsMeter } from './fx/quality'
import Player from './player/Player'
import CameraRig from './player/CameraRig'
import { FittingFocus } from './player/FittingFocus'
import RemotePlayers from './player/RemotePlayers'
import FittingBlur from './hud/FittingBlur'
import Hud from './hud/Hud'
import TouchControls from './input/TouchControls'
import { useKeyboard } from './input/useKeyboard'
import { usePointerLock } from './input/usePointerLock'
import { MousePointer2 } from 'lucide-react'
import { emit, runtime } from './runtime'
import { ensureDaily, getGame, persistNow, updateUi, useGame } from './state'
import { SPAWN, ZONES } from './world/layout'
import { groundAt } from './world/navigation'
import { useHour } from './world/useHour'
import { setAmbienceTime, startAmbience, stopAmbience } from '../lib/ambience'
import { setMusicDuck, startMusic, stopMusic } from '../lib/music'

/** Đặt nhân vật về vị trí đã lưu (nếu hợp lệ) hoặc điểm xuất phát */
function placePlayer() {
  const last = getGame().save.lastPosition
  const valid = last && groundAt(last[0], last[2], last[1])
  const [x, y, z, rot] = valid ? last : [...SPAWN.position, SPAWN.rotY]
  runtime.player.position.set(x, valid ? valid.y : y, z)
  runtime.player.rotY = rot ?? SPAWN.rotY
  runtime.player.locked = false
  runtime.player.holding = null
  runtime.camera.yaw = runtime.player.rotY
  runtime.camera.focus = null
  const g = groundAt(x, z, y)
  const zone = g && ZONES[g.walkable.zone]
  if (zone) {
    runtime.zoneId = zone.id
    updateUi({ zone: { id: zone.id, name: zone.name, subtitle: zone.subtitle }, holding: null, activity: null, panel: null })
  }
}

export default function Game() {
  const wrap = useRef(null)
  const quality = useGame((s) => s.save.settings.quality)
  const activity = useGame((s) => s.ui.activity)
  const panel = useGame((s) => s.ui.panel)
  useKeyboard(wrap)
  const pointer = usePointerLock(wrap)
  const hour = useHour()

  // Âm thanh nền: gió, chim ban ngày, dế ban đêm (tự tôn trọng cài đặt âm thanh)
  useEffect(() => {
    startAmbience()
    return () => stopAmbience()
  }, [])
  useEffect(() => {
    setAmbienceTime(hour)
  }, [hour])

  // Nhạc nền: bắt đầu khi vào game; hạ nhỏ khi thiền, tụng kinh, niệm Phật để tập trung
  useEffect(() => {
    startMusic()
    return () => stopMusic()
  }, [])
  useEffect(() => {
    setMusicDuck(['thien-dinh', 'tung-kinh', 'niem-phat'].includes(activity?.id) ? 0.35 : 1)
  }, [activity?.id])

  useEffect(() => {
    placePlayer()
    ensureDaily()
    return () => persistNow()
  }, [])

  // Hướng dẫn nhanh lần đầu vào game
  useEffect(() => {
    if (getGame().save.stats.niem + getGame().save.merit > 0) return
    const t = setTimeout(
      () =>
        emit('toast', {
          title: 'A Di Đà Phật! Chào mừng lên núi Bà Đen',
          description: 'Đi bằng W A S D (hoặc cần điều khiển), lại gần đồ vật và bấm E để tương tác. Chú tiểu ở cổng sẽ chỉ đường cho bạn.',
        }),
      1200,
    )
    return () => clearTimeout(t)
  }, [])

  const dpr = quality === 'low' ? [0.75, 1] : quality === 'high' ? [1, 2] : [1, 1.5]
  // Hậu kỳ: tắt ở 'low', 'auto' chỉ bật trên máy tính (không phải màn hình cảm ứng), 'high' luôn bật
  const fx = useMemo(() => postFxEnabled(quality), [quality])
  const showFps = useMemo(() => wantsFpsMeter(), [])

  return (
    <div ref={wrap} className="relative h-dvh w-full overflow-hidden bg-[#d4e6ec]">
      <Canvas
        shadows={quality !== 'low' ? 'percentage' : false}
        dpr={dpr}
        camera={{ fov: 55, near: 0.1, far: 1400, position: [0, 4, 34] }}
        // Khi có hậu kỳ, khử răng cưa do SMAA lo → khỏi MSAA ở bộ đệm màn hình (chỉ đọc lúc tạo context)
        gl={{ antialias: quality !== 'low' && !fx, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping
          gl.outputColorSpace = SRGBColorSpace
        }}
        className="touch-none"
      >
        <Suspense fallback={null}>
          <World />
          <Player />
          <CameraRig />
          <FittingFocus active={activity?.id === 'y-phuc'} />
          <RemotePlayers />
        </Suspense>
        <PostFX enabled={fx} high={quality === 'high'} />
        {showFps && <FpsMeter fx={fx} />}
      </Canvas>
      {/* Thử đồ ở sạp y phục: mờ khung cảnh, chừa nhân vật */}
      {activity?.id === 'y-phuc' && <FittingBlur />}
      <TouchControls disabled={!!activity} />
      {/* Chuột chưa khoá vào khung hình (trình duyệt từ chối / vừa bấm Esc) → nhắc bấm để điều khiển */}
      {pointer.supported && !pointer.locked && !activity && !panel && (
        <div className="pointer-events-none absolute top-20 left-1/2 z-30 flex -translate-x-1/2 animate-fade-in items-center gap-2 rounded-2xl bg-stone-900/60 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md">
          <MousePointer2 className="h-4 w-4" aria-hidden /> Bấm vào khung hình để điều khiển camera bằng chuột · giữ Alt để con trỏ lướt tự do
        </div>
      )}
      <Hud />
    </div>
  )
}
