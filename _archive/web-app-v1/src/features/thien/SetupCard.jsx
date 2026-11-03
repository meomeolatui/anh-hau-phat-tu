import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Minus, Play, Plus, VolumeX, Wind } from 'lucide-react'
import Card from '../../components/ui/Card'
import Segmented from '../../components/ui/Segmented'
import { Switch } from '../../components/ui/Field'
import { cn } from '../../lib/cn'
import { BREATH_PATTERNS, breathsPerMinute, getPattern } from './breathing'
import { DURATION_PRESETS, MAX_DURATION, MIN_DURATION, clampMinutes } from './prefs'

const PHASE_TONE = {
  in: 'bg-jade-400',
  holdIn: 'bg-saffron-300',
  out: 'bg-jade-700 dark:bg-jade-600',
  holdOut: 'bg-saffron-200 dark:bg-saffron-400/60',
}

const PREP_OPTS = [
  { value: 0, label: 'Không' },
  { value: 10, label: '10 giây' },
  { value: 30, label: '30 giây' },
]

const INTERVAL_OPTS = [
  { value: 0, label: 'Tắt' },
  { value: 5, label: '5 phút' },
  { value: 10, label: '10 phút' },
]

function SectionLabel({ children, id }) {
  return (
    <h3 id={id} className="mb-3 text-sm font-semibold text-stone-800 dark:text-stone-200">
      {children}
    </h3>
  )
}

/** Thanh nhỏ minh hoạ tỉ lệ các pha của một kiểu thở. */
function PatternBar({ phases }) {
  if (!phases.length) {
    return <div aria-hidden className="h-1.5 rounded-full bg-gradient-to-r from-jade-200 via-jade-300 to-jade-200 dark:from-jade-900 dark:via-jade-700 dark:to-jade-900" />
  }
  return (
    <div aria-hidden className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
      {phases.map(([kind, sec], i) => (
        <span key={i} className={cn('h-full rounded-full', PHASE_TONE[kind])} style={{ flexGrow: sec }} />
      ))}
    </div>
  )
}

function DurationPicker({ minutes, onChange }) {
  const inputId = useId()
  const isPreset = DURATION_PRESETS.includes(minutes)
  const [draft, setDraft] = useState(String(minutes))
  const [custom, setCustom] = useState(!isPreset)

  const commit = (value) => {
    const m = clampMinutes(value)
    if (m == null) {
      setDraft(String(minutes))
      return
    }
    setDraft(String(m))
    onChange(m)
  }

  const step = (d) => commit(minutes + d)

  return (
    <div>
      <div role="group" aria-label="Thời lượng có sẵn" className="flex flex-wrap gap-2">
        {DURATION_PRESETS.map((m) => {
          const active = !custom && minutes === m
          return (
            <button
              key={m}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setCustom(false)
                setDraft(String(m))
                onChange(m)
              }}
              className={cn(
                'h-11 min-w-14 rounded-2xl border px-3 text-sm font-semibold tabular-nums transition',
                active
                  ? 'border-jade-600 bg-jade-700 text-white shadow-sm dark:border-jade-400 dark:bg-jade-500 dark:text-jade-950'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-jade-300 hover:text-jade-800 dark:border-white/10 dark:bg-night-3 dark:text-stone-200 dark:hover:border-jade-700',
              )}
            >
              {m}′
            </button>
          )
        })}
        <button
          type="button"
          aria-pressed={custom}
          onClick={() => setCustom(true)}
          className={cn(
            'h-11 rounded-2xl border px-4 text-sm font-semibold transition',
            custom
              ? 'border-jade-600 bg-jade-700 text-white dark:border-jade-400 dark:bg-jade-500 dark:text-jade-950'
              : 'border-dashed border-stone-300 text-stone-600 hover:border-jade-400 hover:text-jade-800 dark:border-white/15 dark:text-stone-300',
          )}
        >
          Tuỳ chỉnh
        </button>
      </div>

      {custom && (
        <div className="mt-3 flex animate-fade-up items-center gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={minutes <= MIN_DURATION}
            aria-label="Bớt 1 phút"
            className="grid h-11 w-11 place-items-center rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-40 dark:border-white/10 dark:text-stone-200 dark:hover:bg-white/5"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <label htmlFor={inputId} className="sr-only">
            Số phút ngồi (từ {MIN_DURATION} đến {MAX_DURATION})
          </label>
          <input
            id={inputId}
            type="number"
            inputMode="numeric"
            min={MIN_DURATION}
            max={MAX_DURATION}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commit(e.currentTarget.value)}
            className="h-11 w-24 rounded-xl border border-stone-300 bg-white px-3 text-center text-lg font-semibold tabular-nums text-stone-900 focus:border-jade-500 focus:ring-2 focus:ring-jade-500/20 focus:outline-none dark:border-white/10 dark:bg-night-3 dark:text-stone-100"
          />
          <button
            type="button"
            onClick={() => step(1)}
            disabled={minutes >= MAX_DURATION}
            aria-label="Thêm 1 phút"
            className="grid h-11 w-11 place-items-center rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 disabled:opacity-40 dark:border-white/10 dark:text-stone-200 dark:hover:bg-white/5"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
          <span className="text-sm text-stone-500 dark:text-stone-400">phút (1–180)</span>
        </div>
      )}
    </div>
  )
}

function PatternPicker({ value, onChange }) {
  return (
    <div role="radiogroup" aria-labelledby="thien-pattern-label" className="grid gap-2 sm:grid-cols-2">
      {BREATH_PATTERNS.map((p) => {
        const active = p.id === value
        const bpm = breathsPerMinute(p)
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(p.id)}
            className={cn(
              'flex flex-col gap-2 rounded-2xl border p-3.5 text-left transition',
              active
                ? 'border-jade-500 bg-jade-50 ring-1 ring-jade-500 dark:border-jade-500 dark:bg-jade-900/40'
                : 'border-stone-200 hover:border-jade-300 dark:border-white/10 dark:hover:border-jade-700',
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="font-semibold text-stone-900 dark:text-stone-50">{p.label}</span>
              {bpm && <span className="text-xs text-stone-500 tabular-nums dark:text-stone-400">{String(bpm).replace('.', ',')} hơi/phút</span>}
            </span>
            <PatternBar phases={p.phases} />
            <span className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">{p.desc}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Khối thiết lập buổi ngồi + nút bắt đầu. */
export default function SetupCard({ prefs, onChange, onStart, soundOn }) {
  const pattern = getPattern(prefs.pattern)

  return (
    <Card padded={false} className="overflow-hidden">
      {/* Phần đầu: tóm tắt buổi ngồi & nút bắt đầu thật to để người lớn tuổi dễ bấm */}
      <div className="relative overflow-hidden bg-gradient-to-br from-jade-800 via-jade-900 to-jade-950 px-5 py-7 text-white sm:px-8">
        <div aria-hidden className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-jade-400/20 blur-3xl" />
        <div aria-hidden className="absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-lotus-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-jade-200 uppercase">Buổi ngồi của bạn</p>
            <p className="mt-2 font-serif text-5xl font-semibold tabular-nums">
              {prefs.minutes}
              <span className="ml-2 text-2xl font-normal text-jade-100">phút</span>
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-jade-100/90">
              <span className="inline-flex items-center gap-1.5">
                <Wind className="h-4 w-4" aria-hidden /> {pattern.label}
              </span>
              {prefs.intervalMin > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Bell className="h-4 w-4" aria-hidden /> nhắc mỗi {prefs.intervalMin} phút
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-white px-8 text-base font-semibold text-jade-900 shadow-lg transition hover:bg-jade-50 focus-visible:outline-white"
          >
            <Play className="h-5 w-5 fill-current" aria-hidden />
            Bắt đầu ngồi
          </button>
        </div>
      </div>

      <div className="space-y-7 p-5 sm:p-8">
        <section>
          <SectionLabel>Thời lượng</SectionLabel>
          <DurationPicker minutes={prefs.minutes} onChange={(minutes) => onChange({ minutes })} />
        </section>

        <section>
          <SectionLabel id="thien-pattern-label">Kiểu hơi thở</SectionLabel>
          <PatternPicker value={prefs.pattern} onChange={(p) => onChange({ pattern: p })} />
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          <div>
            <SectionLabel>Chuông nhắc giữa giờ</SectionLabel>
            <Segmented
              aria-label="Chuông nhắc giữa giờ"
              options={INTERVAL_OPTS}
              value={prefs.intervalMin}
              onChange={(intervalMin) => onChange({ intervalMin })}
            />
          </div>
          <div>
            <SectionLabel>Thời gian chuẩn bị</SectionLabel>
            <Segmented aria-label="Thời gian chuẩn bị" options={PREP_OPTS} value={prefs.prepSec} onChange={(prepSec) => onChange({ prepSec })} />
          </div>
        </section>

        <section className="divide-y divide-stone-100 rounded-2xl border border-stone-200/70 px-4 dark:divide-white/5 dark:border-white/10">
          <Switch
            checked={prefs.bells}
            onChange={(bells) => onChange({ bells })}
            label="Chuông mở đầu & kết thúc"
            description="Một tiếng chuông ngân khi bắt đầu và khi hết giờ."
          />
          <Switch
            checked={prefs.prompts}
            onChange={(prompts) => onChange({ prompts })}
            label="Câu nhắc chánh niệm"
            description="Vài lời nhắc nhẹ hiện trên màn hình, đổi sau mỗi vài phút."
          />
        </section>

        {!soundOn && (
          <p className="flex items-start gap-2 rounded-2xl bg-saffron-50 p-3 text-sm text-saffron-900 dark:bg-saffron-900/20 dark:text-saffron-100">
            <VolumeX className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Âm thanh đang tắt nên sẽ không nghe được chuông.{' '}
              <Link to="/ca-nhan" className="font-medium underline underline-offset-2">
                Bật lại trong Cá nhân
              </Link>
            </span>
          </p>
        )}
      </div>
    </Card>
  )
}
