import { useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookHeart, ChartColumn, NotebookPen, Sun } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Segmented from '../components/ui/Segmented'
import { todayKey } from '../lib/date'
import { normalizeDayKey, normalizeTab } from '../features/nhat-ky/journal'
import TodayTab from '../features/nhat-ky/TodayTab'
import StatsTab from '../features/nhat-ky/StatsTab'
import VowsTab from '../features/nhat-ky/VowsTab'

const TAB_OPTIONS = [
  { value: 'hom-nay', label: 'Hôm nay', icon: Sun },
  { value: 'thong-ke', label: 'Thống kê', icon: ChartColumn },
  { value: 'so-nguyen', label: 'Sổ nguyện', icon: BookHeart },
]

/**
 * Nhật ký thiện hạnh — tab và ngày đang xem nằm trên URL (?tab=…&ngay=YYYY-MM-DD)
 * để chia sẻ/đánh dấu được và nút Quay lại của trình duyệt hoạt động tự nhiên.
 */
export default function NhatKy() {
  const [params, setParams] = useSearchParams()
  const today = todayKey()
  const tab = normalizeTab(params.get('tab'))
  const dayKey = normalizeDayKey(params.get('ngay'), today)
  const topRef = useRef(null)

  const changeTab = useCallback(
    (next) =>
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          p.set('tab', next)
          if (next !== 'hom-nay') p.delete('ngay')
          return p
        },
        { replace: true },
      ),
    [setParams],
  )

  const changeDay = useCallback(
    (key) =>
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          p.set('tab', 'hom-nay')
          if (key === today) p.delete('ngay')
          else p.set('ngay', key)
          return p
        },
        { replace: true },
      ),
    [setParams, today],
  )

  // Mở một ngày từ Thống kê: đẩy vào lịch sử để "Quay lại" trở về đúng chỗ đang xem
  const openDay = useCallback(
    (key) => {
      setParams(key === today ? { tab: 'hom-nay' } : { tab: 'hom-nay', ngay: key })
      topRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    },
    [setParams, today],
  )

  return (
    <div ref={topRef} className="scroll-mt-20 lg:scroll-mt-6">
      <PageHeader
        eyebrow="Tu tập ngoài đời"
        title="Nhật ký thiện hạnh"
        subtitle="Ghi lại việc lành, lắng lòng nhìn lại mỗi ngày và giữ những lời nguyện của riêng mình."
        icon={NotebookPen}
      />

      <div className="mb-5">
        <Segmented options={TAB_OPTIONS} value={tab} onChange={changeTab} aria-label="Mục trong nhật ký" className="w-full sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none" />
      </div>

      <div key={tab} className="animate-fade-up">
        {tab === 'hom-nay' && <TodayTab dayKey={dayKey} today={today} onChangeDay={changeDay} />}
        {tab === 'thong-ke' && <StatsTab today={today} onOpenDay={openDay} />}
        {tab === 'so-nguyen' && <VowsTab />}
      </div>

      <p className="mt-10 text-center font-serif text-sm text-stone-500 italic dark:text-stone-400">
        Điều quý không nằm ở những dòng ghi trên màn hình, mà ở việc mình sống hiền hơn sau khi tắt nó đi.
      </p>
    </div>
  )
}
