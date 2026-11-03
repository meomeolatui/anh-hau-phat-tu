import { useCallback, useState } from 'react'
import { CalendarCheck, Footprints, Pencil, Undo2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card, { CardTitle } from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { TextField } from '../../components/ui/Field'
import { useToast } from '../../components/ui/toast-context'
import { markVisited, unmarkVisited } from '../../lib/actions'
import { formatViDate, fromKey, todayKey } from '../../lib/date'
import { haptic, playBell } from '../../lib/sound'
import { useStore } from '../../lib/store'
import { validateVisitDate } from './pilgrimage'

const NOTE_MAX = 1000

function VisitForm({ temple, initial, onDone, onCancel }) {
  const toast = useToast()
  const today = todayKey()
  const [date, setDate] = useState(initial?.date ?? today)
  const [note, setNote] = useState(initial?.note ?? '')
  const [error, setError] = useState(null)

  const onSubmit = (e) => {
    e.preventDefault()
    const err = validateVisitDate(date, today)
    if (err) {
      setError(err)
      return
    }
    markVisited(temple.id, { date, note: note.trim() })
    playBell()
    haptic([10, 40, 10])
    toast({
      title: initial ? 'Đã cập nhật chuyến đi' : 'Đã ghi dấu chuyến đi',
      description: `${temple.name} · ${formatViDate(fromKey(date))}`,
    })
    onDone?.()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <TextField
        label="Ngày bạn đến"
        type="date"
        value={date}
        max={today}
        required
        onChange={(e) => {
          setDate(e.target.value)
          setError(null)
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${temple.id}-date-error` : undefined}
      />
      {error && (
        <p id={`${temple.id}-date-error`} role="alert" className="-mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <TextField
        label="Cảm nhận (không bắt buộc)"
        multiline
        rows={4}
        maxLength={NOTE_MAX}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Điều gì khiến bạn thấy lòng lắng lại? Một câu nói, một khoảnh khắc, một lời tự nhủ…"
        hint={`${note.length}/${NOTE_MAX} ký tự · chỉ lưu trên thiết bị của bạn`}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" className="flex-1 sm:flex-none">
          <CalendarCheck className="h-5 w-5" aria-hidden />
          {initial ? 'Lưu thay đổi' : 'Ghi dấu chuyến đi'}
        </Button>
        {onCancel && (
          <Button variant="ghost" size="lg" onClick={onCancel}>
            Huỷ
          </Button>
        )}
      </div>
    </form>
  )
}

/** Thẻ "Ghi dấu chuyến đi" ở trang chi tiết chùa. */
export default function VisitLog({ temple }) {
  const visit = useStore((s) => s.pilgrimage.visited[temple.id])
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  // Modal chạy lại effect quản lý focus khi onClose đổi — giữ tham chiếu ổn định
  const closeConfirm = useCallback(() => setConfirmOpen(false), [])

  const onUnmark = () => {
    unmarkVisited(temple.id)
    setConfirmOpen(false)
    setEditing(false)
    toast({ title: 'Đã gỡ ghi dấu', description: temple.name, tone: 'info' })
  }

  if (!visit) {
    return (
      <Card>
        <CardTitle icon={Footprints}>Ghi dấu chuyến đi</CardTitle>
        <p className="mb-4 text-sm text-stone-600 dark:text-stone-400">
          Bạn đã đến đây? Ghi lại ngày và đôi dòng cảm nhận — để sau này đọc lại, nhớ mình đã từng bình yên thế nào.
        </p>
        <VisitForm key="new" temple={temple} />
      </Card>
    )
  }

  if (editing) {
    return (
      <Card>
        <CardTitle icon={Pencil}>Sửa chuyến đi</CardTitle>
        <VisitForm key="edit" temple={temple} initial={visit} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
      </Card>
    )
  }

  return (
    <Card className="border-jade-200 bg-gradient-to-br from-jade-50 to-white dark:border-jade-900/60 dark:from-jade-950/60 dark:to-night-2">
      <CardTitle icon={CalendarCheck}>Chuyến đi của bạn</CardTitle>
      <p className="text-sm text-stone-600 dark:text-stone-400">Đã viếng ngày</p>
      <p className="font-serif text-xl font-semibold text-jade-800 dark:text-jade-200">{formatViDate(fromKey(visit.date))}</p>
      {visit.note ? (
        <blockquote className="mt-4 border-l-4 border-jade-300 pl-4 font-serif leading-relaxed whitespace-pre-line text-stone-700 italic dark:border-jade-700 dark:text-stone-300">
          {visit.note}
        </blockquote>
      ) : (
        <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">Chưa có cảm nhận. Bạn có thể thêm bất cứ lúc nào.</p>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" aria-hidden />
          Sửa
        </Button>
        <Button variant="ghost" onClick={() => setConfirmOpen(true)}>
          <Undo2 className="h-4 w-4" aria-hidden />
          Gỡ ghi dấu
        </Button>
      </div>
      <Modal
        open={confirmOpen}
        onClose={closeConfirm}
        size="sm"
        title="Gỡ ghi dấu chuyến đi?"
        description={`Ngày viếng và cảm nhận về ${temple.name} sẽ bị xoá khỏi nhật ký hành hương.`}
        footer={
          <>
            <Button variant="ghost" onClick={closeConfirm}>
              Giữ lại
            </Button>
            <Button variant="danger" onClick={onUnmark}>
              Gỡ ghi dấu
            </Button>
          </>
        }
      />
    </Card>
  )
}
