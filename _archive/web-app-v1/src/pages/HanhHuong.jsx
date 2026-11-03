import { useCallback, useEffect, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { Footprints, Info, SearchX } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import { TEMPLES } from '../data/temples'
import { useStore } from '../lib/store'
import { diffDays, todayKey } from '../lib/date'
import JourneyOverview from '../features/hanh-huong/JourneyOverview'
import TempleFilters from '../features/hanh-huong/TempleFilters'
import TempleCard from '../features/hanh-huong/TempleCard'
import WishlistStrip from '../features/hanh-huong/WishlistStrip'
import JourneyTimeline from '../features/hanh-huong/JourneyTimeline'
import EtiquetteGuide from '../features/hanh-huong/EtiquetteGuide'
import {
  EMPTY_FILTERS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  filterTemples,
  pilgrimageStats,
  sortTemples,
  statusOf,
  suggestNext,
} from '../features/hanh-huong/pilgrimage'

// Tên tham số ngắn trên URL để liên kết gọn, dễ chia sẻ
const PARAM_KEYS = { query: 'q', region: 'mien', status: 'tt', province: 'tinh', sort: 'xep' }
const VALID = {
  region: ['all', 'bac', 'trung', 'nam'],
  status: STATUS_OPTIONS.map((o) => o.value),
  sort: SORT_OPTIONS.map((o) => o.value),
}

/** Đọc bộ lọc từ URL, bỏ qua giá trị lạ (người dùng tự sửa URL hoặc liên kết cũ). */
function readFilters(params) {
  const out = { ...EMPTY_FILTERS }
  for (const [key, param] of Object.entries(PARAM_KEYS)) {
    const v = params.get(param)
    if (v === null) continue
    if (VALID[key] && !VALID[key].includes(v)) continue
    out[key] = v
  }
  if (out.province !== 'all' && !TEMPLES.some((t) => t.province === out.province)) out.province = 'all'
  return out
}

export default function HanhHuong() {
  const pilgrimage = useStore((s) => s.pilgrimage)
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => readFilters(params), [params])
  const { hash } = useLocation()

  // Liên kết kiểu /hanh-huong#muc từ trang khác: đợi khung hình sau vì AppShell cuộn về đầu khi đổi trang
  useEffect(() => {
    if (!hash) return
    const raf = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView?.({ behavior: 'smooth' }))
    return () => cancelAnimationFrame(raf)
  }, [hash])

  const updateFilters = useCallback(
    (patch) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(patch)) {
            const param = PARAM_KEYS[key]
            if (!value || value === EMPTY_FILTERS[key]) next.delete(param)
            else next.set(param, value)
          }
          return next
        },
        // Gõ tìm kiếm không nên tạo hàng chục mục lịch sử trình duyệt
        { replace: true },
      )
    },
    [setParams],
  )

  const resetFilters = useCallback(() => setParams({}, { replace: true }), [setParams])

  const stats = useMemo(() => pilgrimageStats(TEMPLES, pilgrimage), [pilgrimage])
  // Đổi gợi ý mỗi ngày nhưng giữ ổn định trong ngày
  const daySeed = diffDays('2024-01-01', todayKey())
  const suggestion = useMemo(() => suggestNext(TEMPLES, pilgrimage, daySeed), [pilgrimage, daySeed])
  const results = useMemo(
    () => sortTemples(filterTemples(TEMPLES, filters, pilgrimage), filters.sort, pilgrimage),
    [filters, pilgrimage],
  )

  return (
    <div className="space-y-10 sm:space-y-12">
      <div>
        <PageHeader
          eyebrow="Đi chùa ngoài đời thật"
          title="Hành hương"
          subtitle="Danh bạ những ngôi chùa tiêu biểu khắp ba miền. Lưu nơi muốn đến, ghi dấu từng chuyến đi — và mang sự an tĩnh ấy về với đời sống hằng ngày."
          icon={Footprints}
        />
        <JourneyOverview stats={stats} suggestion={suggestion} />
      </div>

      <WishlistStrip temples={stats.wishlist} />

      <section aria-labelledby="hh-directory-title" className="space-y-5">
        <div>
          <p className="text-xs font-semibold tracking-widest text-jade-600 uppercase dark:text-jade-400">Danh bạ chùa Việt</p>
          <h2 id="hh-directory-title" className="mt-1 font-serif text-xl font-semibold text-stone-900 sm:text-2xl dark:text-stone-50">
            Tìm một nơi để về
          </h2>
        </div>
        <TempleFilters filters={filters} onChange={updateFilters} onReset={resetFilters} resultCount={results.length} />
        {results.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {results.map((t) => (
              <li key={t.id} className="flex">
                <TempleCard temple={t} status={statusOf(t.id, pilgrimage)} visit={pilgrimage.visited[t.id]} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={SearchX}
            title="Chưa tìm thấy ngôi chùa phù hợp"
            description="Thử bỏ bớt bộ lọc, hoặc gõ ngắn hơn — ví dụ chỉ tên tỉnh hay một chữ trong tên chùa."
            action={
              <Button variant="secondary" onClick={resetFilters}>
                Xoá bộ lọc
              </Button>
            }
          />
        )}
        <p className="flex items-start gap-2 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Thông tin mang tính giới thiệu. Địa chỉ ghi theo tên gọi quen thuộc; sau đợt sắp xếp đơn vị hành chính năm 2025, tên huyện/tỉnh có
          thể đã thay đổi. Dùng nút “Chỉ đường” để có vị trí chính xác, và xem thông báo của nhà chùa trước khi đi dịp lễ lớn.
        </p>
      </section>

      <JourneyTimeline timeline={stats.timeline} />

      <EtiquetteGuide />
    </div>
  )
}
