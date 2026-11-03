import { Link } from 'react-router-dom'
import { Clock, ListOrdered, NotebookPen, Sparkles } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { formatDuration } from '../../lib/date'

/**
 * Hai bước để tránh bấm nhầm: xác nhận → ghi nhận. Sau khi ghi nhận, gợi ý việc tiếp theo
 * (hồi hướng, ghi một thiện hạnh) — để thời tụng nối vào đời sống chứ không dừng ở con số.
 */
export default function CompleteDialog({ open, phase, sutraTitle, seconds, linesRead, total, todayCount, suggestHoiHuong, onConfirm, onClose }) {
  if (phase === 'done') {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Thời tụng đã viên mãn"
        description={`Hôm nay bạn đã tụng ${todayCount} thời. Mong sự an tĩnh này theo bạn suốt ngày.`}
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Ở lại trang này
            </Button>
            <Button variant="outline" to="/kinh">
              Về thư viện
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {suggestHoiHuong && (
            <NextStep
              to="/kinh/ke-hoi-huong"
              icon={Sparkles}
              title="Tụng Kệ Hồi Hướng"
              text="Gửi điều lành của thời tụng đến mọi người."
              onNavigate={onClose}
            />
          )}
          <NextStep to="/nhat-ky" icon={NotebookPen} title="Ghi một thiện hạnh" text="Một việc tốt nhỏ hôm nay — tụng xong rồi sống." onNavigate={onClose} />
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hoàn thành thời tụng?"
      description={`Ghi nhận thời tụng “${sutraTitle}” vào nhật ký hôm nay.`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Tụng tiếp
          </Button>
          <Button onClick={onConfirm}>Ghi nhận</Button>
        </>
      }
    >
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-jade-50 p-4 dark:bg-jade-900/30">
          <dt className="flex items-center gap-1.5 text-xs text-jade-700 dark:text-jade-300">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            Thời gian
          </dt>
          <dd className="mt-1 text-xl font-semibold text-jade-950 tabular-nums dark:text-jade-50">{formatDuration(seconds)}</dd>
        </div>
        <div className="rounded-2xl bg-saffron-50 p-4 dark:bg-saffron-900/20">
          <dt className="flex items-center gap-1.5 text-xs text-saffron-800 dark:text-saffron-200">
            <ListOrdered className="h-3.5 w-3.5" aria-hidden />
            Đã tới dòng
          </dt>
          <dd className="mt-1 text-xl font-semibold text-saffron-900 tabular-nums dark:text-saffron-50">
            {linesRead}/{total}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">Thời gian chỉ tính lúc trang đang mở trên màn hình.</p>
    </Modal>
  )
}

function NextStep({ to, icon: Icon, title, text, onNavigate }) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className="flex flex-col gap-1 rounded-2xl border border-stone-200 p-4 transition hover:border-jade-300 hover:bg-jade-50/60 dark:border-white/10 dark:hover:border-jade-700 dark:hover:bg-jade-900/20"
    >
      <span className="flex items-center gap-2 font-semibold text-jade-800 dark:text-jade-200">
        <Icon className="h-4 w-4" aria-hidden />
        {title}
      </span>
      <span className="text-sm text-stone-500 dark:text-stone-400">{text}</span>
    </Link>
  )
}
