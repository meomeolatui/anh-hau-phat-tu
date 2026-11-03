import { useEffect, useRef, useState } from 'react'
import { Wind } from 'lucide-react'
import Panel, { ActionButton } from './Panel'
import { useActivityPose } from './useActivityPose'
import { addMerit, addStat } from '../state'
import { haptic, playBell } from '../../lib/sound'
import { cn } from '../../lib/cn'
import { breathAt, formatClock, fullMinutes, MERIT_PER_MINUTE, SESSION_MINUTES } from './thienLogic'

const RING_LEN = 2 * Math.PI * 96

/**
 * Thiền định: chọn thời lượng → theo vòng hướng dẫn hơi thở (hít 4 – thở 6) → chuông kết thúc.
 * Camera ở gần, chếch phía trước, tránh vật che (khung hình hoạt động trong Hud). Thời gian tính theo đồng hồ thật (Date.now).
 * params: { seatId, name, stand, face, sessions? } — sessions: các lựa chọn số phút (mặc định SESSION_MINUTES)
 */
export default function ThienDinh({ params, onClose }) {
  const { name, stand, face } = params
  const sessions = params.sessions ?? SESSION_MINUTES
  useActivityPose({ anim: 'sit', stand, face })
  const [minutes, setMinutes] = useState(() => (sessions.includes(5) ? 5 : sessions[0]))
  const [step, setStep] = useState('chon') // chon → ngoi → xong
  const [phase, setPhase] = useState('hit')
  const [remaining, setRemaining] = useState(0)
  const [result, setResult] = useState(null) // { minutes, merit, complete }
  const startAt = useRef(0)
  const duration = useRef(0)
  const settled = useRef(true)
  const circle = useRef(null)
  const ring = useRef(null)

  // Ghi nhận phút thiền (một lần cho mỗi phiên)
  const settle = (complete) => {
    if (settled.current) return null
    settled.current = true
    const elapsed = Date.now() - startAt.current
    const mins = fullMinutes(elapsed, duration.current)
    const merit = mins * MERIT_PER_MINUTE
    if (mins > 0) {
      addMerit(merit, `Thiền ${mins} phút`, stand)
      addStat('thienPhut', mins)
    }
    return { minutes: mins, merit, complete, elapsed }
  }
  const settleRef = useRef(settle)
  useEffect(() => {
    settleRef.current = settle
  })

  // Đóng giữa chừng: vẫn ghi nhận phút đã ngồi
  useEffect(() => () => settleRef.current(false), [])

  const finish = (complete) => {
    const r = settle(complete)
    if (!r) return
    playBell({ pitch: 196, strong: complete })
    haptic([30, 80, 30])
    setResult(r)
    setStep('xong')
  }
  const finishRef = useRef(finish)
  useEffect(() => {
    finishRef.current = finish
  })

  const begin = () => {
    startAt.current = Date.now()
    duration.current = minutes
    settled.current = false
    playBell({ pitch: 196 })
    setRemaining(minutes * 60000)
    setPhase('hit')
    setStep('ngoi')
  }

  // Vòng hơi thở + đếm ngược (DOM cập nhật trực tiếp; state chỉ đổi khi chữ hiển thị đổi)
  useEffect(() => {
    if (step !== 'ngoi') return
    let raf = 0
    let lastPhase = ''
    let lastSec = -1
    const total = duration.current * 60000
    const tick = () => {
      const elapsed = Date.now() - startAt.current
      const b = breathAt(elapsed)
      if (circle.current) circle.current.style.transform = `scale(${b.scale})`
      if (ring.current) ring.current.style.strokeDashoffset = String(RING_LEN * (1 - Math.min(1, elapsed / total)))
      if (b.phase !== lastPhase) {
        lastPhase = b.phase
        setPhase(b.phase)
      }
      const sec = Math.ceil((total - elapsed) / 1000)
      if (sec !== lastSec) {
        lastSec = sec
        setRemaining(Math.max(0, total - elapsed))
      }
      if (elapsed >= total) {
        finishRef.current(true)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step])

  return (
    <Panel title="Thiền định" subtitle={name} onClose={onClose}>
      {step === 'chon' && (
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Ngồi yên, lưng thẳng mà thư giãn. Theo dõi hơi thở: hít vào bốn nhịp, thở ra sáu nhịp. Ý nghĩ đến rồi đi — nhẹ nhàng quay về hơi thở.
          </p>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Thời gian thiền">
            {sessions.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={minutes === m}
                onClick={() => setMinutes(m)}
                className={cn(
                  'rounded-2xl border-2 py-3 text-center transition',
                  minutes === m ? 'border-jade-600 bg-jade-50' : 'border-stone-200 bg-white hover:border-stone-300',
                )}
              >
                <span className="block text-lg font-semibold tabular-nums">{m}</span>
                <span className="text-xs text-stone-500">phút</span>
              </button>
            ))}
          </div>
          <ActionButton className="w-full" onClick={begin}>
            <Wind className="h-5 w-5" /> Bắt đầu thiền
          </ActionButton>
        </div>
      )}

      {step === 'ngoi' && (
        <div className="flex flex-col items-center gap-3">
          <div className="relative grid h-40 w-40 place-items-center sm:h-52 sm:w-52">
            <svg viewBox="0 0 208 208" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="104" cy="104" r="96" fill="none" stroke="rgb(26 96 85 / 0.12)" strokeWidth="5" />
              <circle
                ref={ring}
                cx="104"
                cy="104"
                r="96"
                fill="none"
                stroke="#2a967f"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={RING_LEN}
                strokeDashoffset={RING_LEN}
              />
            </svg>
            <div
              ref={circle}
              className="absolute h-32 w-32 rounded-full sm:h-40 sm:w-40 bg-gradient-to-br from-jade-200 via-jade-100 to-saffron-100 shadow-[0_0_40px_rgb(42_150_127/0.35)] will-change-transform"
              style={{ transform: 'scale(0.6)' }}
              aria-hidden
            />
            <div className="relative text-center" aria-live="polite">
              <p className="font-serif text-2xl text-jade-900">{phase === 'hit' ? 'Hít vào…' : 'Thở ra…'}</p>
              <p className="mt-1 text-sm text-stone-600 tabular-nums">{formatClock(remaining)}</p>
            </div>
          </div>
          <p className="text-center text-xs text-stone-500">
            {phase === 'hit' ? 'Biết mình đang hít vào, bụng phồng nhẹ.' : 'Biết mình đang thở ra, buông lỏng vai.'}
          </p>
          <ActionButton tone="ghost" className="w-full" onClick={() => finish(false)}>
            Xả thiền
          </ActionButton>
        </div>
      )}

      {step === 'xong' && result && (
        <div className="space-y-4 text-center">
          <p className="font-serif text-lg text-stone-800">
            {result.complete ? 'Chuông xả thiền đã vang.' : 'Bạn đã xả thiền.'} Xoa nhẹ hai bàn tay, mỉm cười với chính mình.
          </p>
          <p className="text-sm text-jade-700">
            {result.minutes > 0
              ? `Đã ngồi ${result.minutes} phút trọn vẹn · +${result.merit} công đức`
              : `Đã ngồi ${formatClock(result.elapsed)} — chưa đủ một phút trọn vẹn.`}
          </p>
          <p className="text-xs text-stone-500">Mỗi ngày vài phút trở về hơi thở, tâm sẽ dần lắng trong như mặt hồ.</p>
          <div className="flex gap-2">
            <ActionButton tone="ghost" className="flex-1" onClick={() => setStep('chon')}>
              Ngồi tiếp
            </ActionButton>
            <ActionButton className="flex-1" onClick={onClose}>
              Xong
            </ActionButton>
          </div>
        </div>
      )}
    </Panel>
  )
}
