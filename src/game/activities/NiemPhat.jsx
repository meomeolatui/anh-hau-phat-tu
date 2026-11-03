import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import Panel, { ActionButton } from './Panel'
import { useActivityPose } from './useActivityPose'
import { addMerit, addStat, getGame, updateProfile } from '../state'
import { haptic, playBead, playBell, playMo } from '../../lib/sound'
import { cn } from '../../lib/cn'
import { MANTRAS } from './constants'


const BEADS = 108
// Mỗi 27 hạt (một phần tư chuỗi) +5 công đức; tròn chuỗi thưởng thêm 30
const QUARTER = 27

/**
 * Ngồi bồ đoàn lần chuỗi 108 hạt. Chạm vòng chuỗi / phím Space để lần hạt; có chế độ gõ mõ tự động.
 * params: { seatId, name, stand?, face? }
 */
export default function NiemPhat({ params, onClose }) {
  const { name, stand, face } = params
  useActivityPose({ anim: 'sit', stand, face, holding: 'beads' })
  const [count, setCount] = useState(0) // số hạt trong phiên
  const [mantra, setMantra] = useState(() => getGame().save.profile?.mantra ?? MANTRAS[0])
  const [auto, setAuto] = useState(false)
  const [bpm, setBpm] = useState(60)
  const [pulse, setPulse] = useState(0)
  const countRef = useRef(0)

  const step = useCallback(() => {
    const n = countRef.current + 1
    countRef.current = n
    setCount(n)
    setPulse((p) => p + 1)
    addStat('niem')
    if (n % BEADS === 0) {
      playBell({ pitch: 220 })
      haptic([30, 40, 30])
      addMerit(5 + 30, 'Tròn một chuỗi 108 hạt', stand)
    } else {
      playBead()
      haptic(8)
      if (n % QUARTER === 0) addMerit(5, 'Niệm Phật', stand)
    }
  }, [stand])

  // Phím tắt: Space / Enter / mũi tên xuống
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowDown') {
        e.preventDefault()
        if (!e.repeat) step()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step])

  // Gõ mõ tự động theo nhịp
  useEffect(() => {
    if (!auto) return
    const t = setInterval(() => {
      playMo()
      step()
    }, 60000 / bpm)
    return () => clearInterval(t)
  }, [auto, bpm, step])

  const chooseMantra = (m) => {
    setMantra(m)
    updateProfile({ mantra: m })
  }

  const inRound = count % BEADS
  const rounds = Math.floor(count / BEADS)
  const size = 220
  const R = 92

  return (
    <Panel title="Niệm Phật" subtitle={name} onClose={onClose}>
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={step}
          className="relative touch-manipulation rounded-full outline-offset-4 select-none"
          style={{ width: size, height: size }}
          aria-label={`Lần hạt. Đã niệm ${count} câu`}
        >
          <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" aria-hidden>
            {Array.from({ length: BEADS }, (_, i) => {
              // Hạt 0 ở đỉnh, chạy theo chiều kim đồng hồ
              const a = (i / BEADS) * Math.PI * 2 - Math.PI / 2
              const done = i < inRound
              const current = i === inRound
              return (
                <circle
                  key={i}
                  cx={size / 2 + Math.cos(a) * R}
                  cy={size / 2 + Math.sin(a) * R}
                  r={current ? 5.2 : 3.6}
                  className={cn(
                    'transition-all duration-200',
                    current ? 'fill-saffron-400' : done ? 'fill-[#7a4a2a]' : 'fill-[#c9a27a]',
                  )}
                />
              )
            })}
            {/* Hạt mẫu */}
            <circle cx={size / 2} cy={size / 2 - R - 10} r={7} className="fill-jade-700" />
          </svg>
          <span key={pulse} className="absolute inset-10 animate-ripple rounded-full bg-saffron-300/40" aria-hidden />
          <span className="absolute inset-0 grid place-items-center">
            <span className="text-center">
              <span className="block text-4xl font-semibold tabular-nums text-stone-900">{inRound}</span>
              <span className="block text-xs text-stone-500">/ 108 · {rounds} chuỗi</span>
            </span>
          </span>
        </button>

        <p className="text-center font-serif text-lg text-jade-900">{mantra}</p>

        <div className="flex w-full flex-wrap items-center justify-center gap-2">
          <ActionButton tone={auto ? 'saffron' : 'ghost'} onClick={() => setAuto((a) => !a)} className="h-10 text-sm">
            {auto ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {auto ? 'Dừng mõ' : 'Niệm theo mõ'}
          </ActionButton>
          {auto && (
            <label className="flex items-center gap-2 text-xs text-stone-600">
              Nhịp
              <input type="range" min={30} max={110} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-24 accent-jade-600" />
              <span className="w-12 tabular-nums">{bpm}/phút</span>
            </label>
          )}
        </div>

        <details className="w-full text-sm">
          <summary className="cursor-pointer text-stone-600">Đổi câu niệm</summary>
          <div className="mt-2 grid gap-1.5">
            {MANTRAS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => chooseMantra(m)}
                className={cn('rounded-xl px-3 py-2 text-left', m === mantra ? 'bg-jade-50 font-medium text-jade-900' : 'hover:bg-stone-900/5')}
              >
                {m}
              </button>
            ))}
          </div>
        </details>
        <p className="text-center text-xs text-stone-500">Chạm vòng chuỗi hoặc nhấn phím cách để lần từng hạt. Niệm rõ ràng, nghe rõ ràng.</p>
      </div>
    </Panel>
  )
}
