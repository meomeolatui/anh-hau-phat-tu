import { useMemo, useState } from 'react'
import { ChevronDown, NotebookPen, PenLine } from 'lucide-react'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { getDeedCategory, getMood } from '../../data/good-deeds'
import { diffDays, formatNumber, formatViDate, fromKey } from '../../lib/date'
import { cn } from '../../lib/cn'
import { journalEntries } from './journal'
import MoodFace from './MoodFace'
import { MOOD_TONE, toneOf } from './ui'
import Glyph from './Glyph'

const PAGE = 5
const MAX_DEEDS = 3

function relativeLabel(key, today) {
  const n = diffDays(key, today)
  if (n === 0) return 'Hôm nay'
  if (n === 1) return 'Hôm qua'
  if (n < 7) return `${n} ngày trước`
  if (n < 30) return `${Math.floor(n / 7)} tuần trước`
  return null
}

/** Dòng thời gian những ngày có ghi chép (việc lành, cảm nhận, tự vấn). */
export default function Timeline({ logs, today, onOpenDay }) {
  const entries = useMemo(() => journalEntries(logs, today), [logs, today])
  const [visible, setVisible] = useState(PAGE)

  if (!entries.length) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="Trang nhật ký còn trắng"
        description="Khi bạn ghi việc lành, chọn cảm nhận hay viết vài dòng tự vấn, những ngày ấy sẽ hiện ở đây."
        action={
          <Button variant="secondary" size="sm" onClick={() => onOpenDay(today)}>
            Viết cho hôm nay
          </Button>
        }
      />
    )
  }

  const shown = entries.slice(0, visible)
  return (
    <div>
      <ol className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-px before:bg-stone-200 dark:before:bg-white/10">
        {shown.map(({ key, day }) => (
          <TimelineItem key={key} dayKey={key} day={day} today={today} onOpen={() => onOpenDay(key)} />
        ))}
      </ol>
      {entries.length > visible && (
        <div className="mt-5 text-center">
          <Button variant="outline" onClick={() => setVisible((v) => v + PAGE)}>
            <ChevronDown className="h-4 w-4" aria-hidden />
            Xem thêm ({entries.length - visible} ngày)
          </Button>
        </div>
      )}
    </div>
  )
}

function TimelineItem({ dayKey, day, today, onOpen }) {
  const mood = getMood(day.mood)
  const deeds = day.thienHanh ?? []
  const rel = relativeLabel(dayKey, today)
  const practice = [
    day.niem > 0 && `${formatNumber(day.niem)} câu niệm`,
    day.thienMin > 0 && `${formatNumber(day.thienMin)} phút thiền`,
    day.tung > 0 && `${day.tung} thời kinh`,
  ].filter(Boolean)

  return (
    <li className="relative pl-12">
      <span
        className={cn(
          'absolute top-0 left-0 grid h-9 w-9 place-items-center rounded-full border bg-white dark:bg-night-2',
          mood ? 'border-jade-200 dark:border-jade-800' : 'border-stone-200 dark:border-white/10',
        )}
        aria-hidden
      >
        {mood ? <MoodFace value={mood.value} className={cn('h-6 w-6', MOOD_TONE[mood.value])} /> : <span className="h-2.5 w-2.5 rounded-full bg-jade-400" />}
      </span>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-stone-900 dark:text-stone-100">{formatViDate(fromKey(dayKey))}</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {[rel, mood && `Cảm nhận: ${mood.label.toLowerCase()}`].filter(Boolean).join(' · ') || 'Đã có ghi chép'}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onOpen} aria-label={`Mở và chỉnh sửa nhật ký ${formatViDate(fromKey(dayKey))}`}>
          <PenLine className="h-4 w-4" aria-hidden />
          Mở
        </Button>
      </div>

      {deeds.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {deeds.slice(0, MAX_DEEDS).map((d) => {
            const cat = getDeedCategory(d.category)
            return (
              <li key={d.id} className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300">
                <span className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md', toneOf(cat.tone).icon)}>
                  <Glyph name={cat.icon} className="h-3 w-3" />
                </span>
                <span className="min-w-0">{d.text}</span>
              </li>
            )
          })}
          {deeds.length > MAX_DEEDS && (
            <li className="pl-7 text-xs text-stone-500 dark:text-stone-400">và {deeds.length - MAX_DEEDS} việc lành khác</li>
          )}
        </ul>
      )}

      {day.note?.trim() && (
        <blockquote className="mt-2 line-clamp-3 border-l-2 border-lotus-300 pl-3 font-serif text-sm whitespace-pre-line text-stone-700 italic dark:border-lotus-700 dark:text-stone-300">
          {day.note.trim()}
        </blockquote>
      )}

      {practice.length > 0 && (
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">Tu tập: {practice.join(' · ')}</p>
      )}
    </li>
  )
}
