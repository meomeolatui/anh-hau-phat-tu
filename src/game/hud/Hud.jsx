import { Suspense, lazy, useEffect, useState } from 'react'
import { Coins, Eye, Flame, Hand, ListChecks, Map as MapIcon, Menu, ScanEye, Sparkles, Video } from 'lucide-react'
import Feedback from './Feedback'
import StaminaBar from './StaminaBar'
import RideStatus from './RideStatus'
import YouTubeMusic from './YouTubeMusic'
import { levelFor, QUESTS } from '../progression'
import { endActivity, openPanel, setHolding, useGame } from '../state'
import { interactNearest } from '../interaction'
import { on, refreshActivityView, runtime } from '../runtime'
import { toggleFirstPerson } from '../player/firstPerson'
import { ChatPanel, EmoteMenu, KickedNotice, OnlineStatus, SelfBubble } from './OnlineHud'
import { ACTIVITIES } from '../activities'
import { cn } from '../../lib/cn'

const QuestsPanel = lazy(() => import('./QuestsPanel'))
const MenuPanel = lazy(() => import('./MenuPanel'))
const MapPanel = lazy(() => import('./MapPanel'))

function IconButton({ label, onClick, children, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="relative grid h-11 w-11 place-items-center rounded-2xl bg-stone-900/45 text-white shadow-lg backdrop-blur-md transition hover:bg-stone-900/60"
    >
      {children}
      {badge ? (
        <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-saffron-500 px-1 text-[11px] font-bold">{badge}</span>
      ) : null}
    </button>
  )
}

function MeritBadge() {
  const merit = useGame((s) => s.save.merit)
  const profile = useGame((s) => s.save.profile)
  const lv = levelFor(merit)
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-stone-900/45 py-2 pr-4 pl-2 text-white shadow-lg backdrop-blur-md">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-saffron-300 to-saffron-600 font-serif text-lg font-bold">
        {lv.index + 1}
      </div>
      <div className="min-w-0">
        <p className="max-w-[9rem] truncate text-sm font-semibold sm:max-w-[14rem]">{profile?.name ?? 'Phật tử'}</p>
        <p className="text-[11px] text-white/80">
          {lv.title} · <span className="tabular-nums">{merit.toLocaleString('vi-VN')}</span> công đức
        </p>
        <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-white/20 sm:w-40" role="progressbar" aria-valuenow={Math.round(lv.progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Tiến độ lên cấp">
          <div className="h-full rounded-full bg-saffron-300 transition-all duration-700" style={{ width: `${lv.progress * 100}%` }} />
        </div>
      </div>
    </div>
  )
}

/** Túi tiền & đồ lễ: xu (công quả), nhang, hoa, đèn hoa đăng */
function Wallet() {
  const xu = useGame((s) => s.save.xu)
  const inv = useGame((s) => s.save.inventory)
  return (
    <div className="mt-2 flex w-fit items-center gap-3 rounded-2xl bg-stone-900/45 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-md" aria-label="Túi đồ">
      <span className="flex items-center gap-1" title="Xu — kiếm bằng công quả dưới chân núi">
        <Coins className="h-3.5 w-3.5 text-saffron-300" aria-hidden />
        <span className="tabular-nums">{xu}</span> xu
      </span>
      <span className="flex items-center gap-1" title="Nhang trong túi">
        <Flame className="h-3.5 w-3.5 text-lotus-300" aria-hidden />
        <span className="tabular-nums">{inv.nhang}</span> nhang
      </span>
      {inv.hoa > 0 && <span className="tabular-nums">{inv.hoa} hoa</span>}
      {inv.den > 0 && <span className="tabular-nums">{inv.den} đèn</span>}
    </div>
  )
}

function Prompt() {
  const prompt = useGame((s) => s.ui.prompt)
  const activity = useGame((s) => s.ui.activity)
  if (!prompt || activity) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-28 z-20 flex justify-center px-4 sm:bottom-10">
      <button
        type="button"
        onClick={interactNearest}
        className="pointer-events-auto flex animate-fade-up items-center gap-3 rounded-full bg-white/90 py-2 pr-5 pl-2 text-stone-900 shadow-2xl backdrop-blur-md transition hover:bg-white"
      >
        <span className="grid h-9 min-w-9 place-items-center rounded-full bg-jade-700 px-2 text-sm font-bold text-white">
          <span className="hidden sm:inline">E</span>
          <Hand className="h-4 w-4 sm:hidden" aria-hidden />
        </span>
        <span className="text-left leading-tight">
          <span className="block text-sm font-semibold">{prompt.verb}</span>
          <span className="block text-xs text-stone-500">{prompt.label}</span>
        </span>
      </button>
    </div>
  )
}

function HoldingChip() {
  const holding = useGame((s) => s.ui.holding)
  const la = useGame((s) => s.save.stats.la)
  const cups = useGame((s) => s.ui.teaCups)
  if (holding === 'tea') {
    return (
      <div className="absolute top-44 left-3 z-20 flex items-center gap-2 rounded-2xl bg-jade-700/90 py-1.5 pr-1.5 pl-3 text-sm font-medium text-white shadow-lg sm:top-48 sm:left-5">
        Đang bưng khay trà · còn {cups} chén
        <button type="button" onClick={() => setHolding(null)} className="rounded-xl bg-white/20 px-2.5 py-1 text-xs hover:bg-white/30">
          Đặt khay xuống
        </button>
      </div>
    )
  }
  if (holding !== 'broom') return null
  return (
    <div className="absolute top-44 left-3 z-20 flex items-center gap-2 rounded-2xl bg-saffron-500/90 py-1.5 pr-1.5 pl-3 text-sm font-medium text-white shadow-lg sm:top-48 sm:left-5">
      <Sparkles className="h-4 w-4" aria-hidden /> Đang quét lá · đã quét {la.toLocaleString('vi-VN')}
      <button type="button" onClick={() => setHolding(null)} className="rounded-xl bg-white/20 px-2.5 py-1 text-xs hover:bg-white/30">
        Cất chổi
      </button>
    </div>
  )
}

// Các nghi thức cần thấy rõ động tác nhân vật → xoay camera nghiêng 3/4 phía trước
const POSE_ACTIVITIES = new Set(['le-phat', 'thap-huong', 'niem-phat', 'doc-bia', 'tung-kinh', 'thinh-chuong', 'hoa-dang', 'nghi-ngoi', 'y-phuc', 'lay-lien-tuc', 'thien-dinh'])

// Thử đồ: camera đứng ĐỐI DIỆN nhân vật, gần và ngang tầm mắt để thấy trọn bộ y phục
const FITTING_FRAME = {
  desktop: { side: 0.8, up: 0.05, distance: 3.6 },
  mobile: { side: 0, up: 0.85, distance: 4.6 },
  yawOffset: Math.PI,
  pitch: 0.08,
}

// Ngồi (niệm Phật, thiền): camera gần hơn, điểm nhìn hạ xuống ngang thân người đang ngồi
const SEATED_ACTIVITIES = new Set(['niem-phat', 'thien-dinh'])

/** Khung hình camera khi đang làm hoạt động: nhân vật lệch khỏi vùng bảng che */
function useActivityFraming(activityId) {
  useEffect(() => {
    if (!activityId) return
    const cam = runtime.camera
    const saved = { yaw: cam.yaw, distance: cam.distance, pitch: cam.pitch }
    const mobile = window.innerWidth < 640
    if (activityId === 'y-phuc') {
      cam.pitch = FITTING_FRAME.pitch
      cam.frame = { ...FITTING_FRAME[mobile ? 'mobile' : 'desktop'], yawOffset: FITTING_FRAME.yawOffset, userRotated: false }
      return () => {
        cam.frame = null
        cam.distance = saved.distance
        cam.pitch = saved.pitch
        cam.yaw = runtime.player.rotY
      }
    }
    cam.frame = {
      // Máy tính: bảng ở cạnh phải → dời nhân vật sang trái; điện thoại: bảng ở trên → dời nhân vật xuống
      side: mobile ? 0 : 1.7,
      up: (mobile ? 1.15 : 0.15) - (SEATED_ACTIVITIES.has(activityId) ? 0.45 : 0),
      distance: SEATED_ACTIVITIES.has(activityId) ? (mobile ? 4.6 : 3.8) : POSE_ACTIVITIES.has(activityId) ? (mobile ? 5.4 : 4.4) : mobile ? 6.5 : 5.2,
      // Nhìn ngang hơi chếch phía trước (~100°): thấy rõ dáng quỳ lạy và bàn thờ, ít đâm vào tường điện
      yawOffset: POSE_ACTIVITIES.has(activityId) ? Math.PI * 0.55 : null,
      userRotated: false,
    }
    return () => {
      const rotated = cam.frame?.userRotated
      cam.frame = null
      cam.distance = saved.distance
      if (!rotated) cam.yaw = runtime.player.rotY
    }
  }, [activityId])
}

function ActivityLayer() {
  const activity = useGame((s) => s.ui.activity)
  useActivityFraming(activity?.id)
  if (!activity) return null
  const def = ACTIVITIES[activity.id]
  if (!def) return null
  const { Overlay } = def
  return (
    <Suspense fallback={null}>
      <button
        type="button"
        onClick={(e) => {
          refreshActivityView()
          // Bỏ tiêu điểm: phím Space sau đó dành cho hoạt động (kéo chày chuông…), không bấm lại nút này
          e.currentTarget.blur()
        }}
        className="pointer-events-auto absolute bottom-24 left-3 z-30 flex items-center gap-1.5 rounded-2xl bg-stone-900/55 px-3 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-md hover:bg-stone-900/70 sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2"
        title="Đổi góc nhìn (phím E)"
      >
        <Video className="h-4 w-4" aria-hidden /> Đổi góc nhìn <span className="hidden text-white/60 sm:inline">(E)</span>
      </button>
      <Overlay key={activity.id + JSON.stringify(activity.params?.seatId ?? activity.params?.spotId ?? '')} params={activity.params ?? {}} onClose={endActivity} />
    </Suspense>
  )
}

/** Nút đổi góc nhìn thứ nhất/thứ ba (phím C) — cần cho màn hình cảm ứng */
function ViewToggle() {
  const [firstPerson, setFirstPerson] = useState(runtime.camera.firstPerson)
  useEffect(() => on('view', (v) => setFirstPerson(v.firstPerson)), [])
  const label = firstPerson ? 'Về góc nhìn thứ ba (C)' : 'Góc nhìn thứ nhất (C)'
  return (
    <IconButton
      label={label}
      onClick={(e) => {
        toggleFirstPerson()
        e.currentTarget.blur()
      }}
    >
      {firstPerson ? <ScanEye className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </IconButton>
  )
}

/** Tâm ngắm nhỏ giữa màn hình khi nhìn bằng mắt nhân vật */
function Crosshair() {
  const activity = useGame((s) => s.ui.activity)
  const [firstPerson, setFirstPerson] = useState(runtime.camera.firstPerson)
  useEffect(() => on('view', (v) => setFirstPerson(v.firstPerson)), [])
  if (!firstPerson || activity) return null
  return <div className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]" aria-hidden />
}

export default function Hud() {
  const panel = useGame((s) => s.ui.panel)
  const daily = useGame((s) => s.save.daily.list)
  const readyToClaim = daily.filter((q) => !q.claimed && q.progress >= (QUESTS[q.id]?.target ?? Infinity)).length

  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none">
      <div className="pointer-events-auto absolute top-3 left-3 sm:top-5 sm:left-5">
        <MeritBadge />
        <Wallet />
        <StaminaBar />
      </div>
      <div className="pointer-events-auto absolute top-3 right-3 flex gap-2 sm:top-5 sm:right-5">
        <IconButton label="Nhiệm vụ hôm nay (Q)" onClick={() => openPanel('quests')} badge={readyToClaim}>
          <ListChecks className="h-5 w-5" />
        </IconButton>
        <ViewToggle />
        <IconButton label="Bản đồ núi (M)" onClick={() => openPanel('map')}>
          <MapIcon className="h-5 w-5" />
        </IconButton>
        <IconButton label="Menu (Esc)" onClick={() => openPanel('menu')}>
          <Menu className="h-5 w-5" />
        </IconButton>
      </div>
      <div className="pointer-events-auto">
        <HoldingChip />
      </div>
      <Crosshair />
      <SelfBubble />
      <OnlineStatus />
      <Feedback />
      <RideStatus />
      <YouTubeMusic />
      <div className="pointer-events-auto">
        <Prompt />
        <ActivityLayer />
      </div>
      <ChatPanel />
      <EmoteMenu />
      <KickedNotice />
      {panel && (
        <div className={cn('pointer-events-auto absolute inset-0 z-40')}>
          <Suspense fallback={null}>
            {panel === 'quests' && <QuestsPanel />}
            {panel === 'menu' && <MenuPanel />}
            {panel === 'map' && <MapPanel />}
          </Suspense>
        </div>
      )}
    </div>
  )
}
