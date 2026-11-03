import { useId } from 'react'
import { HeartPulse } from 'lucide-react'
import Card, { CardTitle } from '../../components/ui/Card'
import { MOODS } from '../../data/good-deeds'
import { setDayMood } from '../../lib/actions'
import { cn } from '../../lib/cn'
import MoodFace from './MoodFace'
import { MOOD_TONE } from './ui'

/** Cảm nhận trong ngày — dùng radio gốc để có sẵn điều khiển bằng phím mũi tên. */
export default function MoodPicker({ dayKey, mood, isToday }) {
  const name = useId()
  const current = MOODS.find((m) => m.value === mood)

  return (
    <Card>
      <CardTitle
        icon={HeartPulse}
        action={
          mood ? (
            <button
              type="button"
              onClick={() => setDayMood(null, dayKey)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-stone-100"
            >
              Bỏ chọn
            </button>
          ) : null
        }
      >
        {isToday ? 'Lòng mình hôm nay' : 'Lòng mình ngày ấy'}
      </CardTitle>
      <fieldset>
        <legend className="sr-only">Cảm nhận trong ngày</legend>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {MOODS.map((m) => {
            const active = m.value === mood
            return (
              <label key={m.value} className="group cursor-pointer">
                <input
                  type="radio"
                  name={name}
                  value={m.value}
                  checked={active}
                  onChange={() => setDayMood(m.value, dayKey)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-2xl border px-1 py-3 text-center transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-jade-500',
                    active
                      ? 'border-jade-400 bg-jade-50 shadow-sm dark:border-jade-600 dark:bg-jade-900/40'
                      : 'border-stone-200 hover:border-jade-300 hover:bg-stone-50 dark:border-white/10 dark:hover:border-jade-700 dark:hover:bg-white/5',
                  )}
                >
                  <MoodFace
                    value={m.value}
                    className={cn('h-8 w-8 transition group-hover:scale-110 sm:h-9 sm:w-9', active ? MOOD_TONE[m.value] : 'text-stone-400 dark:text-stone-500')}
                  />
                  <span
                    className={cn(
                      'text-[11px] leading-tight font-medium sm:text-xs',
                      active ? 'text-jade-800 dark:text-jade-100' : 'text-stone-600 dark:text-stone-400',
                    )}
                  >
                    {m.label}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
      <p className="mt-3 text-sm text-stone-500 dark:text-stone-400" aria-live="polite">
        {current
          ? `Đã ghi nhận: ${current.label.toLowerCase()}. Mọi cảm xúc đều đáng được lắng nghe.`
          : 'Chọn một gương mặt gần nhất với lòng mình — không có đúng sai.'}
      </p>
    </Card>
  )
}
