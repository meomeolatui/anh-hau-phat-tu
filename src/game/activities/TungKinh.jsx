import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronLeft, Pause, Play, SkipForward, Volume2, VolumeX } from 'lucide-react'
import Panel, { ActionButton } from './Panel'
import { useActivityPose } from './useActivityPose'
import { useActivityKeys } from './useActivityKeys'
import { addMerit, addStat, cooldownLeft, markCooldown } from '../state'
import { haptic, playBell, playMo } from '../../lib/sound'
import { cn } from '../../lib/cn'
import { getSutra, SUTRA_CATEGORIES } from '../../data/sutras'
import { beatsBefore, CHANT_COOLDOWN, CHANT_IDS, chantMerit, countBeats, flattenSutra, lineDuration, nextPosition, SPEEDS } from './kinhLogic'

const CHANTS = CHANT_IDS.map(getSutra).filter(Boolean)
const categoryLabel = (id) => SUTRA_CATEGORIES.find((c) => c.id === id)?.short ?? ''

/**
 * Tụng kinh tại án thư: chọn bài → cuộn kinh tô sáng từng dòng theo nhịp mõ → hoàn thành cả bài.
 * params: { lecternId, name, stand, face }
 */
export default function TungKinh({ params, onClose }) {
  const { name, stand, face } = params
  useActivityPose({ anim: 'kneel', stand, face })
  const [sutraId, setSutraId] = useState(null)
  const [step, setStep] = useState('chon') // chon → tung → xong
  const [pos, setPos] = useState({ line: 0, rep: 0 })
  const [playing, setPlaying] = useState(true)
  const [speedId, setSpeedId] = useState('vua')
  const [mo, setMo] = useState(true)
  const [earned, setEarned] = useState(0)
  const scroller = useRef(null)
  const current = useRef(null)
  const startTimer = useRef(0)
  useEffect(() => () => clearTimeout(startTimer.current), [])

  const sutra = sutraId ? getSutra(sutraId) : null
  const lines = useMemo(() => flattenSutra(sutra, getSutra), [sutra])
  const total = useMemo(() => countBeats(lines), [lines])
  const speed = SPEEDS.find((s) => s.id === speedId)?.factor ?? 1

  const strike = () => {
    if (mo) playMo({ volume: 0.5 })
  }

  const choose = (id) => {
    setSutraId(id)
    setPos({ line: 0, rep: 0 })
    setPlaying(true)
    setStep('tung')
    playBell({ pitch: 262 })
    // Tiếng mõ mở dòng đầu tiên, sau khi chuông khai kinh lắng xuống
    clearTimeout(startTimer.current)
    startTimer.current = setTimeout(strike, 500)
  }

  const complete = () => {
    addStat('kinh')
    const key = `kinh:${sutraId}`
    let amount = 0
    if (cooldownLeft(key, CHANT_COOLDOWN) === 0) {
      amount = chantMerit(total)
      addMerit(amount, `Tụng ${sutra.title}`, stand)
      markCooldown(key)
    }
    setEarned(amount)
    playBell({ pitch: 196, strong: true })
    haptic([20, 60, 20])
    setStep('xong')
  }

  const advance = () => {
    const next = nextPosition(pos, lines)
    if (!next) {
      complete()
      return
    }
    setPos(next)
    strike()
  }
  const advanceRef = useRef(advance)
  useEffect(() => {
    advanceRef.current = advance
  })

  // Tự chuyển dòng theo nhịp
  useEffect(() => {
    if (step !== 'tung' || !playing) return
    const line = lines[pos.line]
    if (!line) return
    const t = setTimeout(() => advanceRef.current(), lineDuration(line.text, speed))
    return () => clearTimeout(t)
  }, [step, playing, pos, lines, speed])

  // Tự cuộn để dòng đang tụng nằm giữa khung
  useEffect(() => {
    const box = scroller.current
    const el = current.current
    if (!box || !el) return
    const top = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2
    box.scrollTo?.({ top: Math.max(0, top), behavior: 'smooth' })
  }, [pos, step])

  useActivityKeys((e, type) => {
    if (type !== 'down' || e.repeat || step !== 'tung') return
    if (e.code === 'Space' || e.code === 'ArrowDown') {
      e.preventDefault()
      advance()
    }
  })

  if (step === 'chon') {
    return (
      <Panel title="Tụng kinh" subtitle={name} onClose={onClose} wide>
        <p className="mb-3 text-sm text-stone-600">Chọn một bài để tụng. Tụng chậm, rõ chữ — miệng tụng, tai nghe, tâm theo từng câu.</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {CHANTS.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => choose(s.id)}
                className="flex h-full w-full flex-col rounded-2xl border border-stone-200 bg-white p-3 text-left transition hover:border-jade-400 hover:bg-jade-50"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-serif font-semibold text-stone-900">{s.title}</span>
                  <span className="shrink-0 rounded-full bg-stone-900/5 px-2 py-0.5 text-[11px] text-stone-600">
                    {categoryLabel(s.category)} · ~{s.minutes} phút
                  </span>
                </span>
                <span className="mt-0.5 line-clamp-2 text-xs text-stone-500">{s.subtitle}</span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    )
  }

  if (step === 'xong') {
    return (
      <Panel title="Tụng kinh" subtitle={sutra.title} onClose={onClose} wide>
        <div className="space-y-4 text-center">
          <p className="font-serif text-lg leading-relaxed text-stone-800">
            Nguyện đem công đức này, hướng về khắp tất cả,
            <br />
            đệ tử và chúng sanh, đều trọn thành Phật đạo.
          </p>
          <p className="text-sm text-jade-700">
            {earned > 0 ? `Tròn một thời kinh · +${earned} công đức` : 'Tròn một thời kinh. (Bài này vừa tụng gần đây nên không cộng thêm công đức.)'}
          </p>
          {sutra.meaning?.length > 0 && (
            <details className="rounded-2xl bg-stone-900/5 p-3 text-left text-sm text-stone-700">
              <summary className="cursor-pointer font-medium text-stone-800">Lược giải ý nghĩa</summary>
              <div className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1 leading-relaxed">
                {sutra.meaning.map((m) => (
                  <p key={m}>{m}</p>
                ))}
              </div>
            </details>
          )}
          <div className="flex gap-2">
            <ActionButton tone="ghost" className="flex-1" onClick={() => setStep('chon')}>
              Tụng bài khác
            </ActionButton>
            <ActionButton className="flex-1" onClick={onClose}>
              Xong
            </ActionButton>
          </div>
        </div>
      </Panel>
    )
  }

  const done = beatsBefore(pos, lines)
  return (
    <Panel title={sutra.title} subtitle={name} onClose={onClose} wide>
      <div
        ref={scroller}
        className="relative max-h-[24dvh] overflow-y-auto sm:max-h-[48vh] rounded-3xl border border-[#e3d3ad] bg-gradient-to-b from-[#fbf4e2] to-[#f3e6c6] px-4 py-6 shadow-inner sm:px-6"
        aria-label="Cuộn kinh"
      >
        <div className="py-[8dvh] sm:py-[14vh]">
          {lines.map((l, i) => {
            const active = i === pos.line
            return (
              <div key={i}>
                {l.heading && <p className="mt-4 mb-1 text-center text-xs font-semibold tracking-widest text-saffron-800 uppercase first:mt-0">{l.heading}</p>}
                {l.note && <p className="mb-2 text-center text-xs text-stone-500 italic">{l.note}</p>}
                <p
                  ref={active ? current : undefined}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'rounded-xl px-3 py-1.5 text-center font-serif text-lg leading-relaxed transition-colors duration-500 sm:text-xl',
                    active ? 'bg-saffron-200/70 text-stone-950' : i < pos.line ? 'text-stone-400' : 'text-stone-700',
                  )}
                >
                  {l.text}
                  {l.repeat > 1 && (
                    <span className="ml-2 align-middle font-sans text-xs text-saffron-800 tabular-nums">
                      {active ? `lần ${pos.rep + 1}/${l.repeat}` : `(${l.repeat} lần)`}
                    </span>
                  )}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-label="Tiến độ tụng" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}>
        <div className="h-full rounded-full bg-saffron-500 transition-all duration-500" style={{ width: `${(done / Math.max(1, total)) * 100}%` }} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ActionButton tone="ghost" className="h-10 px-3" onClick={() => setStep('chon')} aria-label="Chọn bài khác">
          <ChevronLeft className="h-4 w-4" />
        </ActionButton>
        <ActionButton tone={playing ? 'saffron' : 'jade'} className="h-10 text-sm" onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {playing ? 'Tạm dừng' : 'Tụng tiếp'}
        </ActionButton>
        <ActionButton tone="ghost" className="h-10 text-sm" onClick={advance}>
          <SkipForward className="h-4 w-4" /> Dòng kế
        </ActionButton>
        <div className="flex rounded-2xl bg-stone-900/5 p-1" role="radiogroup" aria-label="Tốc độ tụng">
          {SPEEDS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={speedId === s.id}
              onClick={() => setSpeedId(s.id)}
              className={cn('rounded-xl px-2.5 py-1.5 text-xs font-medium', speedId === s.id ? 'bg-white text-jade-800 shadow' : 'text-stone-600')}
            >
              {s.label}
            </button>
          ))}
        </div>
        <ActionButton
          tone="ghost"
          className="ml-auto h-10 px-3"
          onClick={() => setMo((m) => !m)}
          aria-pressed={mo}
          aria-label={mo ? 'Tắt tiếng mõ' : 'Bật tiếng mõ'}
          title={mo ? 'Tắt tiếng mõ' : 'Bật tiếng mõ'}
        >
          {mo ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          <span className="text-xs">Mõ</span>
        </ActionButton>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
        <BookOpen className="h-3.5 w-3.5" aria-hidden /> Phím cách để sang dòng kế khi muốn tụng theo nhịp của mình.
      </p>
    </Panel>
  )
}
