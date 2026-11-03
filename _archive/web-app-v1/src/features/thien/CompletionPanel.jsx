import { useState } from 'react'
import { Check, Cloud, CloudRain, CloudSun, Sparkles, Sun } from 'lucide-react'
import { LotusMark } from '../../components/Logo'
import { getState, useStore } from '../../lib/store'
import { getDay, setDayMood, setDayNote } from '../../lib/actions'
import { todayKey } from '../../lib/date'
import { cn } from '../../lib/cn'
import { DEDICATION, DEDICATION_VERSE, MOOD_REPLIES, MOODS } from './content'
import { appendNote, humanDuration, shouldRecord } from './summary'

const MOOD_ICONS = { CloudRain, Cloud, CloudSun, Sun, Sparkles }
const NOTE_MAX = 500

function MoodPicker({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Cảm nhận sau buổi ngồi" className="grid grid-cols-5 gap-2">
      {MOODS.map((m) => {
        const Icon = MOOD_ICONS[m.icon]
        const active = value === m.value
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(m.value)}
            className={cn(
              'flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border px-1 py-3 text-xs font-medium transition sm:text-sm',
              active
                ? 'border-jade-300 bg-jade-400/20 text-jade-50'
                : 'border-white/10 bg-white/5 text-stone-300 hover:border-white/25 hover:text-stone-100',
            )}
          >
            <Icon className={cn('h-6 w-6', active ? 'text-jade-200' : 'text-stone-400')} aria-hidden />
            {m.label}
          </button>
        )
      })}
    </div>
  )
}

/** Màn hình sau buổi ngồi: thời gian, cảm nhận, ghi chú ngắn và lời hồi hướng. */
export default function CompletionPanel({ result, onClose }) {
  const key = todayKey()
  const mood = useStore((s) => getDay(s.logs, key).mood)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const recorded = shouldRecord(result.sec)

  const saveNote = () => {
    const clean = note.trim()
    if (!clean) return
    const prev = getDay(getState().logs, key).note
    setDayNote(appendNote(prev, clean, { at: new Date(), sec: result.sec }), key)
    setNote('')
    setSaved(true)
  }

  const done = () => {
    // Lỡ quên bấm "Lưu" thì vẫn giữ lại điều đã viết
    saveNote()
    onClose()
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 animate-fade-up flex-col gap-6 px-5 pt-2 pb-10 sm:pt-6">
      <div className="text-center">
        <LotusMark className="mx-auto mb-4 h-16 w-16 rounded-2xl shadow-glow" />
        <p className="text-sm font-semibold tracking-[0.25em] text-jade-300 uppercase">
          {result.natural ? 'Buổi ngồi đã trọn' : 'Đã kết thúc'}
        </p>
        <p className="mt-2 font-serif text-4xl font-semibold text-stone-50 sm:text-5xl">{humanDuration(result.sec)}</p>
        <p className="mt-2 text-sm text-stone-400">
          {recorded ? 'Đã ghi vào nhật ký hôm nay.' : 'Buổi ngồi dưới 1 phút nên chưa ghi vào nhật ký — lần sau mình ngồi lâu hơn chút nhé.'}
        </p>
      </div>

      <section aria-labelledby="thien-mood-title">
        <h2 id="thien-mood-title" className="mb-3 text-base font-semibold text-stone-100">
          Lúc này bạn cảm thấy thế nào?
        </h2>
        <MoodPicker value={mood} onChange={(v) => setDayMood(v, key)} />
        {mood && (
          <p className="mt-3 text-sm leading-relaxed text-stone-300" role="status">
            {MOOD_REPLIES[mood]}
          </p>
        )}
      </section>

      <section>
        <label htmlFor="thien-note" className="mb-2 block text-base font-semibold text-stone-100">
          Ghi chú ngắn <span className="font-normal text-stone-400">(không bắt buộc)</span>
        </label>
        <textarea
          id="thien-note"
          value={note}
          maxLength={NOTE_MAX}
          onChange={(e) => {
            setNote(e.target.value)
            setSaved(false)
          }}
          placeholder="Điều mình nhận ra trong buổi ngồi…"
          className="min-h-24 w-full resize-y rounded-2xl border border-white/10 bg-night-3 px-4 py-3 text-base text-stone-100 placeholder:text-stone-500 focus:border-jade-400 focus:ring-2 focus:ring-jade-400/25 focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-stone-500">Ghi chú được thêm vào nhật ký hôm nay, không thay thế ghi chú cũ.</p>
          <button
            type="button"
            onClick={saveNote}
            disabled={!note.trim()}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-white/15 px-4 text-sm font-medium text-stone-100 hover:bg-white/10 disabled:opacity-40"
          >
            {saved && !note ? <Check className="h-4 w-4" aria-hidden /> : null}
            {saved && !note ? 'Đã lưu' : 'Lưu ghi chú'}
          </button>
        </div>
      </section>

      <section aria-label="Hồi hướng" className="rounded-3xl border border-saffron-300/15 bg-saffron-400/5 p-5 text-center">
        <p className="text-xs font-semibold tracking-[0.25em] text-saffron-300 uppercase">Hồi hướng</p>
        <p className="mt-3 text-sm leading-relaxed text-stone-300">{DEDICATION}</p>
        <p className="mt-4 font-serif text-base leading-loose text-saffron-100">
          {DEDICATION_VERSE.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      </section>

      <button type="button" onClick={done} className="h-14 rounded-2xl bg-jade-400 text-base font-semibold text-jade-950 hover:bg-jade-300">
        Hoàn tất
      </button>
    </div>
  )
}
