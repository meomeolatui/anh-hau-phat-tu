import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import Panel, { ActionButton } from './Panel'
import { useActivityPose } from './useActivityPose'
import { useActivityKeys } from './useActivityKeys'
import { emit, runtime, setPlayerAnim } from '../runtime'
import { addMerit, addStat, cooldownLeft, markCooldown } from '../state'
import { haptic, playBell } from '../../lib/sound'
import { cn } from '../../lib/cn'
import { BELL_COOLDOWN, BELL_MERIT, gradeStrike, MAX_STRIKES, powerFromHold, STRIKE_GAP_MS, STRIKE_TEXT, SWEET } from './chuongLogic'

/** Kệ thỉnh chuông (phiên âm Hán-Việt truyền thống) */
const KE = ['Văn chung thanh, phiền não khinh, trí huệ trưởng, bồ đề sanh,', 'Ly địa ngục, xuất hoả khanh, nguyện thành Phật, độ chúng sanh.']
const KE_GIAI =
  'Nghe tiếng chuông, phiền não nhẹ vơi; trí tuệ lớn dần, tâm giác ngộ nảy mầm; lìa xa cảnh khổ như thoát khỏi hầm lửa — nguyện thành Phật để cùng đưa mọi loài qua bờ an vui. (Lược giải)'

/**
 * Thỉnh chuông: giữ để kéo chày lấy đà (thanh lực) → thả trong vùng giữa để chuông ngân tròn. Tối đa 3 tiếng.
 * params: { towerId, name, stand, face }
 */
export default function ThinhChuong({ params, onClose }) {
  const { towerId, name, stand, face } = params
  useActivityPose({ anim: 'bell', stand, face })
  const [power, setPower] = useState(0)
  const [holding, setHolding] = useState(false)
  const [strikes, setStrikes] = useState([]) // ['ngan', 'nhe', ...]
  const [waiting, setWaiting] = useState(false)
  const [earned, setEarned] = useState(null) // null = chưa xét, 0 = đang hồi, 10 = đã cộng
  const holdStart = useRef(0)
  const raf = useRef(0)
  const timers = useRef([])
  const awarded = useRef(false)
  const finished = strikes.length >= MAX_STRIKES

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current)
      timers.current.forEach(clearTimeout)
      emit('bell-pull', { towerId, pull: 0 })
    },
    [towerId],
  )

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms))

  const startHold = () => {
    if (holdStart.current || waiting || finished) return
    holdStart.current = performance.now()
    setHolding(true)
    setPlayerAnim('bell-pull')
    const tick = () => {
      const p = powerFromHold(performance.now() - holdStart.current)
      setPower(p)
      runtime.player.bellPull = p
      emit('bell-pull', { towerId, pull: p })
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }

  const cancelHold = () => {
    if (!holdStart.current) return
    cancelAnimationFrame(raf.current)
    holdStart.current = 0
    setHolding(false)
    setPower(0)
    runtime.player.bellPull = 0
    setPlayerAnim('bell')
    emit('bell-pull', { towerId, pull: 0 })
  }

  const release = () => {
    if (!holdStart.current) return
    cancelAnimationFrame(raf.current)
    const p = powerFromHold(performance.now() - holdStart.current)
    if (p < 0.08) {
      // Chưa kịp lấy đà — coi như buông tay, không tính tiếng
      cancelHold()
      return
    }
    holdStart.current = 0
    setHolding(false)
    setPower(p)
    const grade = gradeStrike(p)
    // Nhoài người đánh chày, rồi thu về tư thế sẵn sàng
    runtime.player.bellPull = 0
    setPlayerAnim('bell-strike')
    later(() => setPlayerAnim('bell'), 1250)
    emit('bell-pull', { towerId, pull: 0 })
    emit('bell-ring', { towerId, power: p })
    // Chày cần một thoáng để bay tới thân chuông
    later(() => {
      playBell({ strong: grade !== 'nhe', pitch: 110 })
      haptic(grade === 'ngan' ? [20, 60, 30] : 20)
    }, 150)
    const list = [...strikes, grade]
    setStrikes(list)
    if (list.length === 1) addStat('chuong')
    if (!awarded.current && (grade === 'ngan' || list.length >= MAX_STRIKES)) {
      awarded.current = true
      const key = `chuong:${towerId}`
      if (cooldownLeft(key, BELL_COOLDOWN) === 0) {
        addMerit(BELL_MERIT, 'Thỉnh chuông', face)
        markCooldown(key)
        setEarned(BELL_MERIT)
      } else setEarned(0)
    }
    setWaiting(true)
    later(() => {
      setWaiting(false)
      setPower(0)
      setPlayerAnim('bell')
    }, STRIKE_GAP_MS)
  }

  useActivityKeys((e, type) => {
    if (e.code !== 'Space' && e.code !== 'Enter') return
    e.preventDefault()
    if (type === 'down' && !e.repeat) startHold()
    if (type === 'up') release()
  })

  const last = strikes[strikes.length - 1]
  const inSweet = power >= SWEET[0] && power <= SWEET[1]
  const status = holding
    ? inSweet
      ? 'Thả tay ngay — đà vừa đẹp!'
      : power < SWEET[0]
        ? 'Kéo chày lùi lại, lấy đà…'
        : 'Đà hơi quá — chày đang lùi…'
    : waiting && last
      ? STRIKE_TEXT[last]
      : finished
        ? 'Hồi chuông đã vang. Lắng nghe dư âm…'
        : 'Nhấn giữ để kéo chày, thả tay khi vạch lực nằm trong vùng xanh'

  return (
    <Panel title="Thỉnh chuông" subtitle={name} onClose={onClose}>
      <div className="space-y-3 sm:space-y-4">
        <figure className="rounded-3xl bg-gradient-to-br from-stone-100 to-saffron-50 px-4 py-3 text-center">
          <blockquote className="font-serif text-sm leading-relaxed text-stone-800 sm:text-base">
            {KE.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </blockquote>
          <details className="mt-1 text-left text-xs text-stone-600">
            <summary className="cursor-pointer text-center text-stone-500">Ý nghĩa bài kệ</summary>
            <p className="mt-1.5 leading-relaxed italic">{KE_GIAI}</p>
          </details>
        </figure>

        {/* Thanh lực */}
        <div>
          <div className="relative h-4 overflow-hidden rounded-full bg-stone-200" role="meter" aria-label="Lực kéo chày" aria-valuenow={Math.round(power * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className="absolute inset-y-0 bg-jade-400/50" style={{ left: `${SWEET[0] * 100}%`, width: `${(SWEET[1] - SWEET[0]) * 100}%` }} />
            <div className={cn('absolute inset-y-0 left-0 rounded-full', inSweet ? 'bg-jade-600' : 'bg-saffron-500')} style={{ width: `${power * 100}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-stone-500">
            <span>Nhẹ</span>
            <span>Ngân</span>
            <span>Mạnh</span>
          </div>
        </div>

        <p className="min-h-5 text-center text-sm text-stone-600" aria-live="polite">
          {status}
        </p>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture?.(e.pointerId)
              startHold()
            }}
            onPointerUp={release}
            onPointerCancel={cancelHold}
            onKeyDown={(e) => {
              if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
                e.preventDefault()
                startHold()
              }
            }}
            onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && release()}
            onContextMenu={(e) => e.preventDefault()}
            disabled={waiting || finished}
            className={cn(
              'grid h-20 w-20 shrink-0 touch-none place-items-center rounded-full bg-gradient-to-b from-[#b07a3a] to-[#7a4a2a] text-white shadow-lg transition select-none disabled:opacity-60',
              holding && 'scale-95',
            )}
            aria-label="Nhấn giữ để kéo chày, thả để thỉnh chuông"
          >
            <Bell className={cn('h-10 w-10 transition', waiting && 'animate-pulse')} />
          </button>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex gap-2" aria-label={`Đã thỉnh ${strikes.length} trên ${MAX_STRIKES} tiếng`}>
              {Array.from({ length: MAX_STRIKES }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-3 flex-1 rounded-full',
                    i < strikes.length ? (strikes[i] === 'ngan' ? 'bg-jade-600' : 'bg-saffron-400') : 'bg-stone-200',
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-stone-500">
              {earned === BELL_MERIT
                ? `+${BELL_MERIT} công đức`
                : earned === 0
                  ? 'Gác chuông này vừa được thỉnh — công đức sẽ tính lại sau ít phút.'
                  : 'Mỗi lần thỉnh tối đa ba tiếng. Phím cách: giữ rồi thả.'}
            </p>
          </div>
        </div>

        {finished && !waiting && (
          <div className="space-y-3 text-center">
            <p className="font-serif text-base text-stone-800">Nguyện tiếng chuông vang xa, ai nghe cũng thấy lòng nhẹ lại.</p>
            <ActionButton className="w-full" onClick={onClose}>
              Xong
            </ActionButton>
          </div>
        )}
      </div>
    </Panel>
  )
}
