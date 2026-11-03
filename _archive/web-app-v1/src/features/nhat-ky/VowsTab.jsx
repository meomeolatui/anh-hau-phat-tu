import { useId, useMemo, useState } from 'react'
import { BookHeart, Lock, PenLine, Trash } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card, { CardTitle } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import Segmented from '../../components/ui/Segmented'
import { useToast } from '../../components/ui/toast-context'
import { VOW_TEMPLATES, VOW_TYPES, getVowType } from '../../data/good-deeds'
import { addVow, removeVow } from '../../lib/actions'
import { formatTime, formatViDate } from '../../lib/date'
import { useStore } from '../../lib/store'
import { cn } from '../../lib/cn'
import { groupVowsByMonth } from './journal'
import { iconFor, toneOf } from './ui'
import Glyph from './Glyph'

const MAX_LEN = 1000
const TYPE_OPTIONS = VOW_TYPES.map((t) => ({ value: t.id, label: t.label, icon: iconFor(t.icon) }))

/** Tab "Sổ nguyện": phát nguyện, hồi hướng, sám hối — riêng tư, chỉ lưu trên máy. */
export default function VowsTab() {
  const vows = useStore((s) => s.vows)
  const [filter, setFilter] = useState('all')
  const [confirm, setConfirm] = useState(null)
  const toast = useToast()

  const counts = useMemo(() => {
    const c = { all: vows.length }
    for (const t of VOW_TYPES) c[t.id] = 0
    for (const v of vows) c[v.type] = (c[v.type] ?? 0) + 1
    return c
  }, [vows])

  const groups = useMemo(
    () => groupVowsByMonth(filter === 'all' ? vows : vows.filter((v) => v.type === filter)),
    [vows, filter],
  )

  const filterOptions = [
    { value: 'all', label: `Tất cả (${counts.all})` },
    ...VOW_TYPES.map((t) => ({ value: t.id, label: `${t.label} (${counts[t.id]})` })),
  ]

  const doRemove = () => {
    if (!confirm) return
    removeVow(confirm.id)
    setConfirm(null)
    toast({ title: 'Đã xoá khỏi sổ', tone: 'info' })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-3xl border border-jade-200/70 bg-jade-50/70 p-4 text-sm text-jade-900 dark:border-jade-800/60 dark:bg-jade-900/20 dark:text-jade-100">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-jade-600 dark:text-jade-300" aria-hidden />
        <p>
          <span className="font-semibold">Sổ nguyện là của riêng bạn.</span> Mọi dòng viết ở đây chỉ nằm trên thiết bị này, không gửi đi đâu cả.
          Muốn giữ lâu dài, hãy sao lưu dữ liệu trong mục{' '}
          <Button variant="ghost" size="sm" to="/ca-nhan" className="h-auto px-1 py-0 align-baseline text-jade-800 underline underline-offset-2 dark:text-jade-200">
            Hồ sơ &amp; cài đặt
          </Button>
          .
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-5">
        <VowComposer
          className="lg:sticky lg:top-6 lg:col-span-2"
          onSaved={(type) => {
            toast({ title: 'Đã ghi vào sổ', description: 'Mong lời này theo bạn trong từng việc làm.' })
            if (filter !== 'all' && filter !== type) setFilter('all')
          }}
        />

        <section aria-label="Các dòng trong sổ" className="space-y-4 lg:col-span-3">
          {vows.length > 0 && (
            <Segmented options={filterOptions} value={filter} onChange={setFilter} size="sm" aria-label="Lọc theo loại" />
          )}

          {groups.length === 0 ? (
            <EmptyState
              icon={BookHeart}
              title={vows.length ? 'Chưa có dòng nào thuộc loại này' : 'Sổ còn trống'}
              description={
                vows.length
                  ? 'Thử chọn "Tất cả" để xem lại mọi dòng đã viết.'
                  : 'Viết một lời nguyện nhỏ, vừa sức — như giữ lời nói hiền hoà trong tuần này. Lời nguyện chân thành quý hơn lời nguyện lớn.'
              }
            />
          ) : (
            groups.map((g) => (
              <div key={g.key}>
                <h3 className="mb-2 px-1 text-xs font-semibold tracking-widest text-stone-500 uppercase dark:text-stone-400">{g.label}</h3>
                <ul className="space-y-3">
                  {g.items.map((v) => (
                    <VowItem key={v.id} vow={v} onDelete={() => setConfirm(v)} />
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      </div>

      <Modal
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Xoá dòng này khỏi sổ?"
        description="Sau khi xoá sẽ không khôi phục được (trừ khi bạn có bản sao lưu)."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Giữ lại
            </Button>
            <Button variant="danger" onClick={doRemove}>
              <Trash className="h-4 w-4" aria-hidden />
              Xoá
            </Button>
          </>
        }
      >
        {confirm && (
          <p className="line-clamp-4 rounded-2xl bg-stone-50 p-3 font-serif text-sm whitespace-pre-line text-stone-700 dark:bg-white/5 dark:text-stone-300">
            {confirm.text}
          </p>
        )}
      </Modal>
    </div>
  )
}

function VowComposer({ className, onSaved }) {
  const [type, setType] = useState('nguyen')
  const [text, setText] = useState('')
  const fieldId = useId()
  const meta = getVowType(type)
  const templates = VOW_TEMPLATES.filter((t) => t.type === type)

  const applyTemplate = (tpl) => {
    const next = text.trim() ? `${text.trimEnd()}\n\n${tpl.text}` : tpl.text
    setText(next.slice(0, MAX_LEN))
    document.getElementById(fieldId)?.focus()
  }

  const submit = (e) => {
    e.preventDefault()
    if (!addVow({ text, type })) return
    setText('')
    onSaved(type)
  }

  return (
    <Card className={className}>
      <CardTitle icon={PenLine}>Viết vào sổ</CardTitle>
      <form onSubmit={submit} className="space-y-4">
        <Segmented options={TYPE_OPTIONS} value={type} onChange={setType} aria-label="Loại ghi chép" className="w-full [&>button]:flex-1" />
        <p className="text-sm text-stone-600 dark:text-stone-400">{meta.hint}</p>

        <div>
          <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
            Lời của bạn
          </label>
          <textarea
            id={fieldId}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
            maxLength={MAX_LEN}
            rows={5}
            placeholder={type === 'sam-hoi' ? 'Con xin thành thật nhìn lại…' : type === 'hoi-huong' ? 'Con xin hồi hướng đến…' : 'Con nguyện…'}
            className="min-h-32 w-full resize-y rounded-2xl border border-stone-300 bg-white px-4 py-3 font-serif text-base leading-relaxed text-stone-900 placeholder:text-stone-400 focus:border-jade-500 focus:ring-2 focus:ring-jade-500/20 focus:outline-none dark:border-white/10 dark:bg-night-3 dark:text-stone-100"
          />
          <p className="mt-1 text-right text-xs text-stone-500 tabular-nums dark:text-stone-400">
            {text.length}/{MAX_LEN}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-stone-500 dark:text-stone-400">Gợi ý mẫu — bấm để chép vào ô, rồi sửa theo lời mình</p>
          <div className="flex flex-wrap gap-1.5">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className={cn('rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition hover:brightness-95', toneOf(meta.tone).chip)}
              >
                {tpl.title}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={!text.trim()}>
          Lưu vào sổ
        </Button>
      </form>
    </Card>
  )
}

function VowItem({ vow, onDelete }) {
  const meta = getVowType(vow.type)
  const at = new Date(vow.at)
  const validDate = !Number.isNaN(at.getTime())

  return (
    <li className="group animate-fade-up rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft dark:border-white/5 dark:bg-night-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={meta.tone}>
            <Glyph name={meta.icon} className="h-3.5 w-3.5" />
            {meta.label}
          </Badge>
          {validDate && (
            <time dateTime={vow.at} className="text-xs text-stone-500 dark:text-stone-400">
              {formatViDate(at)} · {formatTime(at)}
            </time>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label="Xoá dòng này"
          className="text-stone-400 hover:text-red-600 dark:text-stone-500 dark:hover:text-red-400"
        >
          <Trash className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <p className="mt-3 font-serif text-[17px] leading-relaxed whitespace-pre-line text-stone-800 dark:text-stone-100">{vow.text}</p>
    </li>
  )
}
