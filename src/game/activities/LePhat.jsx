import { useCallback, useEffect, useRef, useState } from 'react'
import { HandHeart, RotateCcw } from 'lucide-react'
import Panel, { ActionButton } from './Panel'
import { useActivityPose } from './useActivityPose'
import { useActivityKeys } from './useActivityKeys'
import { setPlayerAnim } from '../runtime'
import { addMerit, addStat } from '../state'
import { haptic, playBell } from '../../lib/sound'
import { cn } from '../../lib/cn'
import {
  BOW_ANIM_MS,
  BOW_COUNTS,
  GRADE_TEXT,
  gradeTap,
  isHit,
  MERIT_PER_BOW,
  phaseAt,
  rhythmConfig,
  ringOpacity,
  ringScale,
} from './lePhatLogic'

const PETALS = 12
const BOW_LABELS = { 1: 'Nhất tâm đảnh lễ', 3: 'Kính lễ Phật, Pháp, Tăng', 9: 'Lễ trọn chín lạy' }

/** Vòng cánh sen (SVG) — dùng cho cả vòng đích lẫn vòng thu nhỏ */
function LotusRing({ className, petal = '#f2a2bd', stroke = '#d52b5c' }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <circle cx="100" cy="100" r="62" fill="none" stroke={stroke} strokeWidth="2" strokeOpacity="0.6" />
      {Array.from({ length: PETALS }, (_, i) => {
        const a = (i / PETALS) * 360
        return (
          <ellipse key={i} cx="100" cy="38" rx="9" ry="16" fill={petal} fillOpacity="0.85" stroke={stroke} strokeWidth="1" transform={`rotate(${a} 100 100)`} />
        )
      })}
    </svg>
  )
}

/**
 * Lễ Phật: chọn số lạy → mỗi lạy bấm "Lạy" khi vòng sen thu nhỏ khớp vòng tròn → hồi hướng.
 * params: { altarId, name, stand, face }
 */
export default function LePhat({ params, onClose }) {
  const { name, stand, face } = params
  useActivityPose({ anim: 'pray', stand, face })
  const [target, setTarget] = useState(3)
  const [easy, setEasy] = useState(false)
  const [step, setStep] = useState('chon') // chon → lay → xong
  const [done, setDone] = useState(0)
  const [bowing, setBowing] = useState(false)
  const [feedback, setFeedback] = useState(null) // { grade, n }
  const ringRef = useRef(null)
  const cycleStart = useRef(0)
  const misses = useRef(0)
  const doneRef = useRef(0)
  const bowTimer = useRef(0)
  const feedbackN = useRef(0)

  // Vòng sen co lại theo nhịp (cập nhật DOM trực tiếp, không re-render mỗi khung hình)
  useEffect(() => {
    if (step !== 'lay' || bowing) return
    cycleStart.current = performance.now()
    const { period } = rhythmConfig(easy)
    let raf = 0
    const tick = () => {
      const ph = phaseAt(performance.now(), cycleStart.current, period)
      const el = ringRef.current
      if (el) {
        el.style.transform = `scale(${ringScale(ph)})`
        el.style.opacity = String(ringOpacity(ph))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step, bowing, easy])

  useEffect(() => () => clearTimeout(bowTimer.current), [])

  const begin = () => {
    doneRef.current = 0
    misses.current = 0
    setDone(0)
    setFeedback(null)
    setStep('lay')
  }

  const tap = useCallback(() => {
    if (step !== 'lay' || bowing) return
    const ph = phaseAt(performance.now(), cycleStart.current, rhythmConfig(easy).period)
    const grade = gradeTap(ph, { easy, misses: misses.current })
    feedbackN.current += 1
    setFeedback({ grade, n: feedbackN.current })
    if (!isHit(grade)) {
      misses.current += 1
      haptic(6)
      return
    }
    misses.current = 0
    const n = doneRef.current + 1
    doneRef.current = n
    setDone(n)
    setBowing(true)
    setPlayerAnim('bow')
    haptic(grade === 'perfect' ? [12, 40, 12] : 15)
    playBell({ pitch: grade === 'perfect' ? 330 : 294 })
    addStat('lay')
    addMerit(MERIT_PER_BOW, 'Lạy Phật', stand)
    bowTimer.current = setTimeout(() => {
      setPlayerAnim('pray')
      setBowing(false)
      if (n >= target) {
        playBell({ pitch: 196, strong: true })
        setStep('xong')
      }
    }, BOW_ANIM_MS)
  }, [step, bowing, easy, stand, target])

  useActivityKeys((e, type) => {
    if (type !== 'down' || e.repeat) return
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault()
      tap()
    }
  })

  return (
    <Panel title="Lễ Phật" subtitle={name} onClose={onClose}>
      {step === 'chon' && (
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            Lạy Phật là cúi mình buông bớt cái tôi. Mỗi lạy, hãy để thân chậm lại theo hơi thở — bấm “Lạy” khi vòng sen khép vừa vòng tròn.
          </p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Số lạy">
            {BOW_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={target === n}
                onClick={() => setTarget(n)}
                className={cn(
                  'rounded-2xl border-2 p-3 text-left transition',
                  target === n ? 'border-jade-600 bg-jade-50' : 'border-stone-200 bg-white hover:border-stone-300',
                )}
              >
                <span className="block font-semibold">{n} lạy</span>
                <span className="text-xs leading-tight text-stone-500">{BOW_LABELS[n]}</span>
              </button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-stone-900/5 px-4 py-3 text-sm">
            <span>
              <span className="block font-medium text-stone-800">Chế độ thong thả</span>
              <span className="text-xs text-stone-500">Nhịp chậm hơn, dễ khớp hơn</span>
            </span>
            <input type="checkbox" checked={easy} onChange={(e) => setEasy(e.target.checked)} className="h-5 w-5 accent-jade-600" />
          </label>
          <ActionButton className="w-full" onClick={begin}>
            <HandHeart className="h-5 w-5" /> Bắt đầu lễ
          </ActionButton>
        </div>
      )}

      {step === 'lay' && (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={tap}
            disabled={bowing}
            className="relative h-40 w-40 touch-manipulation sm:h-52 sm:w-52 overflow-hidden rounded-full bg-gradient-to-b from-saffron-50 to-lotus-50 select-none"
            aria-label={`Lạy (${done}/${target}). Bấm khi vòng sen khớp vòng tròn`}
          >
            {/* Vòng đích */}
            <LotusRing className="absolute inset-0 h-full w-full opacity-40" petal="#fde08a" stroke="#d46c07" />
            {/* Vòng sen thu nhỏ theo nhịp */}
            {!bowing && (
              <div ref={ringRef} className="absolute inset-0 will-change-transform" style={{ opacity: 0 }}>
                <LotusRing className="h-full w-full" />
              </div>
            )}
            <span className="absolute inset-0 grid place-items-center">
              <span className="text-center">
                <span className="block font-serif text-3xl font-semibold sm:text-4xl text-stone-900 tabular-nums">
                  {done}
                  <span className="text-xl text-stone-400">/{target}</span>
                </span>
                <span className="block text-xs text-stone-500">{bowing ? 'Đang lạy…' : 'lạy'}</span>
              </span>
            </span>
          </button>

          <p
            key={feedback?.n ?? 0}
            className={cn('min-h-5 animate-fade-up text-center text-sm', feedback && isHit(feedback.grade) ? 'text-jade-700' : 'text-stone-500')}
            aria-live="polite"
          >
            {bowing ? 'Thân cúi xuống, tâm khiêm hạ. Đứng dậy chậm rãi…' : feedback ? GRADE_TEXT[feedback.grade] : 'Đợi vòng sen khép vừa vòng tròn vàng'}
          </p>

          <ActionButton tone="saffron" className="w-full" onClick={tap} disabled={bowing}>
            <HandHeart className="h-5 w-5" /> Lạy
          </ActionButton>
          <div className="flex w-full items-center justify-between text-xs text-stone-500">
            <span>Phím cách / Enter để lạy</span>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={easy} onChange={(e) => setEasy(e.target.checked)} className="h-4 w-4 accent-jade-600" />
              Thong thả
            </label>
          </div>
        </div>
      )}

      {step === 'xong' && (
        <div className="space-y-4 text-center">
          <div className="rounded-3xl bg-gradient-to-br from-saffron-50 to-lotus-50 px-4 py-5">
            <p className="mb-2 text-xs font-medium tracking-widest text-saffron-700 uppercase">Hồi hướng</p>
            <p className="font-serif text-lg leading-relaxed text-stone-800">
              Nguyện đem công đức này
              <br />
              Hướng về khắp tất cả
              <br />
              Đệ tử và chúng sanh
              <br />
              Đều trọn thành Phật đạo.
            </p>
          </div>
          <p className="text-sm text-jade-700">
            Đã lễ {done} lạy · +{done * MERIT_PER_BOW} công đức
          </p>
          <p className="text-xs text-stone-500">Lạy Phật để học hạnh khiêm cung — mang sự nhẹ nhàng ấy vào cách mình đối xử với mọi người.</p>
          <div className="flex gap-2">
            <ActionButton tone="ghost" className="flex-1" onClick={() => setStep('chon')}>
              <RotateCcw className="h-4 w-4" /> Lễ thêm
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
