import { useMemo, useState } from 'react'
import { Download, Leaf, Sparkles } from 'lucide-react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Switch } from '../../components/ui/Field'
import { useToast } from '../../components/ui/toast-context'
import { getFastingScheme } from '../../data/holidays'
import { addDays, formatShortDate, fromKey } from '../../lib/date'
import { collectCalendarEvents, icsFileName, rangeEnd } from './calendar-events'
import { buildIcs } from './ics'
import { downloadTextFile } from './download'

const MONTHS = 12
// Sự kiện cả ngày bắt đầu lúc 0h — nhắc trước 6 giờ tức khoảng 18h tối hôm trước
const REMIND_HOURS = 6

/** Hộp thoại xuất ngày vía/ngày chay 12 tháng tới ra tệp .ics cho ứng dụng Lịch của điện thoại. */
export default function ExportDialog({ open, onClose, today, fasting }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thêm vào lịch điện thoại"
      description={`Tạo tệp lịch (.ics) gồm các ngày lễ, ngày vía trong ${MONTHS} tháng tới để nhập vào Lịch Google, Lịch iPhone hay Outlook.`}
    >
      {open && <ExportBody today={today} fasting={fasting} onDone={onClose} />}
    </Modal>
  )
}

function ExportBody({ today, fasting, onDone }) {
  const toast = useToast()
  const scheme = getFastingScheme(fasting)
  const canFast = scheme.days.length > 0
  const [includeFasting, setIncludeFasting] = useState(canFast)
  const [remind, setRemind] = useState(true)

  const from = fromKey(today)
  const events = useMemo(
    () =>
      collectCalendarEvents(fromKey(today), {
        months: MONTHS,
        includeFasting: includeFasting && canFast,
        fasting,
        alarmHoursBefore: remind ? REMIND_HOURS : null,
      }),
    [today, fasting, includeFasting, canFast, remind],
  )
  const holidayCount = events.filter((e) => e.kind === 'holiday').length
  const fastingCount = events.length - holidayCount

  const onDownload = () => {
    const ics = buildIcs(events, { name: 'Ngày vía & ngày chay — Anh Hậu Phật Tử' })
    const ok = downloadTextFile(ics, icsFileName(from), 'text/calendar;charset=utf-8')
    if (!ok) {
      toast({
        title: 'Trình duyệt chưa hỗ trợ tải tệp',
        description: 'Bạn thử mở ứng dụng bằng Chrome, Safari hoặc Edge nhé.',
        tone: 'warning',
      })
      return
    }
    toast({ title: 'Đã tạo tệp lịch', description: `${events.length} sự kiện — mở tệp vừa tải để thêm vào ứng dụng Lịch.` })
    onDone()
  }

  return (
    <div>
      <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200 px-4 dark:divide-white/5 dark:border-white/10">
        <Switch
          checked={includeFasting && canFast}
          onChange={(v) => canFast && setIncludeFasting(v)}
          label="Kèm ngày chay"
          description={
            canFast ? `Theo lối ${scheme.label.toLowerCase()}` : 'Bạn chưa chọn lối ăn chay — chọn ở mục "Lối ăn chay của bạn".'
          }
        />
        <Switch
          checked={remind}
          onChange={setRemind}
          label="Nhắc trước một buổi"
          description="Thông báo vào khoảng 18 giờ tối hôm trước"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <p className="flex items-center gap-2 rounded-2xl bg-saffron-50 p-3 text-saffron-900 dark:bg-saffron-500/10 dark:text-saffron-100">
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            <strong className="tabular-nums">{holidayCount}</strong> ngày lễ, vía
          </span>
        </p>
        <p className="flex items-center gap-2 rounded-2xl bg-jade-50 p-3 text-jade-900 dark:bg-jade-900/40 dark:text-jade-100">
          <Leaf className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            <strong className="tabular-nums">{fastingCount}</strong> ngày chay
          </span>
        </p>
      </div>
      <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
        Từ {formatShortDate(from, true)} đến {formatShortDate(addDays(rangeEnd(from, MONTHS), -1), true)}. Tệp được tạo ngay trên
        máy bạn; nhập lại lần sau sẽ cập nhật chứ không nhân đôi sự kiện.
      </p>

      <details className="mt-4 rounded-2xl bg-stone-50 p-3 text-sm text-stone-600 dark:bg-white/5 dark:text-stone-300">
        <summary className="cursor-pointer font-medium text-stone-800 dark:text-stone-100">Cách thêm vào lịch</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Điện thoại: mở tệp .ics vừa tải, chọn ứng dụng Lịch rồi xác nhận thêm sự kiện.</li>
          <li>Lịch Google: trên máy tính, vào Cài đặt → Nhập và xuất, chọn tệp vừa tải.</li>
          <li>Nên tạo một lịch riêng (ví dụ "Phật sự") để dễ ẩn/hiện hoặc xoá khi cần.</li>
        </ul>
      </details>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onDone}>
          Để sau
        </Button>
        <Button onClick={onDownload} disabled={!events.length}>
          <Download className="h-4 w-4" aria-hidden />
          Tải tệp lịch
        </Button>
      </div>
    </div>
  )
}
