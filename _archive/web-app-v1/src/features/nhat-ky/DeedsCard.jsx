import { useEffect, useId, useRef, useState } from 'react'
import { HandHeart, Plus, Trash, Undo2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card, { CardTitle } from '../../components/ui/Card'
import ProgressRing from '../../components/ui/ProgressRing'
import { useToast } from '../../components/ui/toast-context'
import { DEED_CATEGORIES, getDeedCategory } from '../../data/good-deeds'
import { addGoodDeed, removeGoodDeed } from '../../lib/actions'
import { cn } from '../../lib/cn'
import { formatTime, toKey } from '../../lib/date'
import { toneOf } from './ui'
import Glyph from './Glyph'

const MAX_LEN = 280
const UNDO_MS = 7000

/** Ghi nhanh việc lành + danh sách việc lành của ngày đang xem (xoá có hoàn tác). */
export default function DeedsCard({ dayKey, isToday, deeds, goal }) {
  const toast = useToast()
  const [text, setText] = useState('')
  const [category, setCategory] = useState('khac')
  const [removed, setRemoved] = useState(null)
  const timer = useRef(null)
  const inputRef = useRef(null)
  const groupName = useId()
  const inputId = useId()

  useEffect(() => () => clearTimeout(timer.current), [])

  const submit = (e) => {
    e.preventDefault()
    const deed = addGoodDeed({ text, category }, dayKey)
    if (!deed) {
      inputRef.current?.focus()
      return
    }
    setText('')
    toast({ title: 'Đã ghi lại một việc lành', description: 'Việc nhỏ mà làm bằng cả tấm lòng thì đã là điều quý.' })
  }

  const remove = (deed) => {
    removeGoodDeed(deed.id, dayKey)
    clearTimeout(timer.current)
    setRemoved({ deed, dayKey })
    timer.current = setTimeout(() => setRemoved(null), UNDO_MS)
  }

  const undo = () => {
    if (!removed) return
    // actions chưa có hàm khôi phục nguyên bản → ghi lại cùng nội dung & nhóm
    addGoodDeed({ text: removed.deed.text, category: removed.deed.category }, removed.dayKey)
    clearTimeout(timer.current)
    setRemoved(null)
    toast({ title: 'Đã khôi phục việc lành', tone: 'info' })
  }

  const count = deeds.length
  const target = Math.max(1, goal || 1)

  return (
    <Card>
      <CardTitle
        icon={HandHeart}
        action={
          <ProgressRing value={count / target} size={48} stroke={5} tone="lotus" label={`${count} trên ${target} việc lành mục tiêu`}>
            <span className="text-xs font-semibold tabular-nums text-stone-800 dark:text-stone-100">
              {count}/{target}
            </span>
          </ProgressRing>
        }
      >
        {isToday ? 'Việc lành hôm nay' : 'Việc lành ngày này'}
      </CardTitle>

      <form onSubmit={submit} className="space-y-3">
        <label htmlFor={inputId} className="sr-only">
          Việc lành bạn đã làm
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
            maxLength={MAX_LEN}
            placeholder={isToday ? 'Hôm nay mình đã… (vd. gọi điện hỏi thăm mẹ)' : 'Ngày ấy mình đã…'}
            className="h-12 min-w-0 flex-1 rounded-2xl border border-stone-300 bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 focus:border-jade-500 focus:ring-2 focus:ring-jade-500/20 focus:outline-none dark:border-white/10 dark:bg-night-3 dark:text-stone-100"
          />
          <Button type="submit" size="lg" className="px-4 sm:px-6" disabled={!text.trim()} aria-label="Ghi việc lành">
            <Plus className="h-5 w-5" aria-hidden />
            <span className="hidden sm:inline">Ghi lại</span>
          </Button>
        </div>
        {text.length > MAX_LEN - 60 && (
          <p className="text-right text-xs text-stone-500 tabular-nums dark:text-stone-400">
            {text.length}/{MAX_LEN}
          </p>
        )}

        <fieldset>
          <legend className="mb-2 text-xs font-medium text-stone-500 dark:text-stone-400">Thuộc nhóm</legend>
          <div className="flex flex-wrap gap-1.5">
            {DEED_CATEGORIES.map((c) => {
              const tone = toneOf(c.tone)
              const active = c.id === category
              return (
                <label key={c.id} className="cursor-pointer" title={c.desc}>
                  <input
                    type="radio"
                    name={groupName}
                    value={c.id}
                    checked={active}
                    onChange={() => setCategory(c.id)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-jade-500',
                      active ? tone.chipActive : tone.chip,
                    )}
                  >
                    <Glyph name={c.icon} className="h-4 w-4" />
                    {c.label}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      </form>

      <div className="mt-5 border-t border-stone-100 pt-4 dark:border-white/5">
        {count === 0 ? (
          <p className="rounded-2xl bg-stone-50 px-4 py-5 text-center text-sm text-stone-500 dark:bg-white/5 dark:text-stone-400">
            {isToday
              ? 'Chưa có việc lành nào được ghi hôm nay. Không cần lớn lao — một lời cảm ơn cũng đủ.'
              : 'Ngày này chưa có việc lành nào được ghi. Bạn vẫn có thể bổ sung nếu nhớ ra.'}
          </p>
        ) : (
          <ul className="space-y-2" aria-label="Danh sách việc lành">
            {deeds.map((d) => (
              <DeedItem key={d.id} deed={d} dayKey={dayKey} onRemove={() => remove(d)} />
            ))}
          </ul>
        )}

        {removed && (
          <div
            role="status"
            className="mt-3 flex animate-fade-up items-center justify-between gap-3 rounded-2xl bg-stone-900 px-4 py-3 text-sm text-white dark:bg-stone-100 dark:text-stone-900"
          >
            <span className="min-w-0 truncate">Đã xoá “{removed.deed.text}”</span>
            <button
              type="button"
              onClick={undo}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 font-semibold text-jade-300 hover:bg-white/10 dark:text-jade-700 dark:hover:bg-stone-900/10"
            >
              <Undo2 className="h-4 w-4" aria-hidden />
              Hoàn tác
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}

function DeedItem({ deed, dayKey, onRemove }) {
  const cat = getDeedCategory(deed.category)
  const tone = toneOf(cat.tone)
  const at = new Date(deed.at)
  // Chỉ hiện giờ khi việc lành được ghi đúng trong ngày đó (ghi bù cho ngày cũ thì giờ không có nghĩa)
  const showTime = !Number.isNaN(at.getTime()) && toKey(at) === dayKey

  return (
    <li className="group flex animate-fade-up items-start gap-3 rounded-2xl px-2 py-2 transition hover:bg-stone-50 dark:hover:bg-white/5">
      <span className={cn('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl', tone.icon)}>
        <Glyph name={cat.icon} className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-snug break-words text-stone-800 dark:text-stone-100">{deed.text}</p>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
          {cat.label}
          {showTime && ` · ${formatTime(at)}`}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        aria-label={`Xoá việc lành: ${deed.text}`}
        className="text-stone-400 hover:text-red-600 dark:text-stone-500 dark:hover:text-red-400"
      >
        <Trash className="h-4 w-4" aria-hidden />
      </Button>
    </li>
  )
}
