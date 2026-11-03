import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, Download } from 'lucide-react'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import { useStore } from '../lib/store'
import { fromKey, toKey, todayKey } from '../lib/date'
import { describeDay } from '../features/lich/day-info'
import { isKeyInRange, monthOfKey, selectionForMonth, shiftMonth } from '../features/lich/month-grid'
import MonthCalendar from '../features/lich/MonthCalendar'
import MonthYearPicker from '../features/lich/MonthYearPicker'
import DayDetail from '../features/lich/DayDetail'
import TodayHero from '../features/lich/TodayHero'
import UpcomingPanel from '../features/lich/UpcomingPanel'
import FastingCard from '../features/lich/FastingCard'
import DateConverter from '../features/lich/DateConverter'
import ExportDialog from '../features/lich/ExportDialog'
import LichGuide from '../features/lich/LichGuide'

const KEY_RE = /^\d{4}-\d{2}-\d{2}$/

/** Cho phép trang khác mở thẳng một ngày: /lich?ngay=2026-11-24 */
function initialKey(param, today) {
  if (!param || !KEY_RE.test(param)) return today
  // Chuẩn hoá qua Date để loại ngày không tồn tại (vd. 2026-02-30)
  const key = toKey(fromKey(param))
  return key === param && isKeyInRange(key) ? key : today
}

export default function Lich() {
  const [params] = useSearchParams()
  const fasting = useStore((s) => s.settings.fasting)
  const logs = useStore((s) => s.logs)
  // Cố định "hôm nay" trong suốt phiên xem trang để lưới và bảng chi tiết không lệch nhau
  const [today] = useState(todayKey)
  const [selectedKey, setSelectedKey] = useState(() => initialKey(params.get('ngay'), today))
  const [view, setView] = useState(() => monthOfKey(selectedKey))
  const [pickerOpen, setPickerOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const selectKey = useCallback((key) => {
    if (!isKeyInRange(key)) return
    setSelectedKey(key)
    setView(monthOfKey(key))
  }, [])

  const selectDate = useCallback(
    (date) => {
      selectKey(toKey(date))
      // Trên di động lịch nằm phía trên — cuộn lên để người dùng thấy ngày vừa chọn
      document.getElementById('lich-thang')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    },
    [selectKey],
  )

  const goToMonth = useCallback(
    (next) => {
      setView(next)
      setSelectedKey((prev) => selectionForMonth(next, prev, today))
    },
    [today],
  )

  // Modal chạy lại effect khi onClose đổi tham chiếu, nên giữ ổn định các hàm đóng
  const closePicker = useCallback(() => setPickerOpen(false), [])
  const closeExport = useCallback(() => setExportOpen(false), [])

  const selectedInfo = useMemo(
    () => describeDay(fromKey(selectedKey), { fasting, logs, today }),
    [selectedKey, fasting, logs, today],
  )

  return (
    <>
      <PageHeader
        eyebrow="Lịch âm Phật giáo"
        title="Lịch âm & ngày chay"
        subtitle="Theo dõi ngày rằm, mùng một, ngày vía chư Phật – Bồ Tát và ngày chay của riêng bạn."
        icon={CalendarDays}
        actions={
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <Download className="h-4 w-4" aria-hidden />
            Thêm vào lịch điện thoại
          </Button>
        }
      />

      <TodayHero today={today} fasting={fasting} onSelectDate={selectDate} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_25rem]">
        <section id="lich-thang" aria-label="Lịch tháng" className="min-w-0 scroll-mt-4">
          <MonthCalendar
            view={view}
            selectedKey={selectedKey}
            today={today}
            fasting={fasting}
            logs={logs}
            onSelect={selectKey}
            onShiftMonth={(delta) => goToMonth(shiftMonth(view, delta))}
            onToday={() => selectKey(today)}
            onOpenPicker={() => setPickerOpen(true)}
          />
        </section>
        <aside aria-label="Chi tiết ngày đã chọn" className="lg:sticky lg:top-6 lg:self-start">
          <DayDetail info={selectedInfo} today={today} logs={logs} fasting={fasting} />
        </aside>
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <UpcomingPanel today={today} fasting={fasting} onSelectDate={selectDate} />
        <FastingCard fasting={fasting} />
        <div className="lg:col-span-2 xl:col-span-1">
          <DateConverter today={today} onSelectDate={selectDate} />
        </div>
      </div>

      <LichGuide />

      <MonthYearPicker
        open={pickerOpen}
        onClose={closePicker}
        view={view}
        onPick={(next) => {
          setPickerOpen(false)
          goToMonth(next)
        }}
      />
      <ExportDialog open={exportOpen} onClose={closeExport} today={today} fasting={fasting} />
    </>
  )
}
