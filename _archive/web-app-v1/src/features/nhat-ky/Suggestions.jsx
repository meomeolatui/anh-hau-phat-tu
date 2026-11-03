import { useMemo, useState } from 'react'
import { Check, Lightbulb, Shuffle } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card, { CardTitle } from '../../components/ui/Card'
import { useToast } from '../../components/ui/toast-context'
import { DEED_SUGGESTIONS, getDeedCategory } from '../../data/good-deeds'
import { addGoodDeed } from '../../lib/actions'
import { cn } from '../../lib/cn'
import { pickSuggestions } from './journal'
import { toneOf } from './ui'
import Glyph from './Glyph'

/** Ba gợi ý việc lành của ngày — ổn định theo ngày, đổi được, ghi nhanh bằng một chạm. */
export default function Suggestions({ dayKey, isToday, deeds }) {
  const toast = useToast()
  const [round, setRound] = useState(0)
  const picks = useMemo(() => pickSuggestions(DEED_SUGGESTIONS, dayKey, 3, round), [dayKey, round])
  const doneTexts = useMemo(() => new Set(deeds.map((d) => d.text)), [deeds])

  const markDone = (s) => {
    if (!addGoodDeed({ text: s.text, category: s.category }, dayKey)) return
    toast({ title: 'Tuỳ hỷ!', description: 'Việc lành đã được ghi vào nhật ký.' })
  }

  return (
    <Card>
      <CardTitle
        icon={Lightbulb}
        action={
          <Button variant="ghost" size="sm" onClick={() => setRound((r) => r + 1)}>
            <Shuffle className="h-4 w-4" aria-hidden />
            Đổi gợi ý
          </Button>
        }
      >
        {isToday ? 'Gợi ý hôm nay' : 'Gợi ý việc lành'}
      </CardTitle>
      <ul className="grid gap-3 md:grid-cols-3" aria-live="polite">
        {picks.map((s) => {
          const cat = getDeedCategory(s.category)
          const tone = toneOf(cat.tone)
          const done = doneTexts.has(s.text)
          return (
            <li
              key={s.id}
              className={cn(
                'flex animate-fade-up flex-col rounded-3xl border p-4 transition',
                done
                  ? 'border-jade-200 bg-jade-50/60 dark:border-jade-800 dark:bg-jade-900/20'
                  : 'border-stone-200 bg-paper/60 hover:border-jade-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-jade-700',
              )}
            >
              <span className={cn('inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', tone.chip)}>
                <Glyph name={cat.icon} className="h-3.5 w-3.5" />
                {cat.label}
              </span>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-stone-800 dark:text-stone-200">{s.text}</p>
              <Button
                variant={done ? 'ghost' : 'secondary'}
                size="sm"
                className="mt-4 w-full"
                disabled={done}
                onClick={() => markDone(s)}
                aria-label={done ? `Đã ghi: ${s.text}` : `Mình đã làm: ${s.text}`}
              >
                <Check className="h-4 w-4" aria-hidden />
                {done ? 'Đã ghi' : 'Mình đã làm'}
              </Button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
