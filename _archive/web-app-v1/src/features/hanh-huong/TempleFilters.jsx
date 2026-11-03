import { useId, useMemo } from 'react'
import { RotateCcw, Search, X } from 'lucide-react'
import Button from '../../components/ui/Button'
import Segmented from '../../components/ui/Segmented'
import { SelectField } from '../../components/ui/Field'
import { REGIONS, TEMPLES } from '../../data/temples'
import { SORT_OPTIONS, STATUS_OPTIONS, activeFilterCount, provincesOf } from './pilgrimage'

const REGION_OPTIONS = [{ value: 'all', label: 'Tất cả' }, ...REGIONS.map((r) => ({ value: r.id, label: r.short }))]

/**
 * Bộ lọc danh bạ chùa. Component "điều khiển" hoàn toàn: giá trị nằm ở URL (trang cha),
 * nhờ vậy bấm vào chùa rồi quay lại vẫn giữ nguyên kết quả lọc.
 */
export default function TempleFilters({ filters, onChange, onReset, resultCount }) {
  const searchId = useId()
  const provinces = useMemo(() => provincesOf(TEMPLES, filters.region), [filters.region])
  const provinceOptions = useMemo(
    () => [{ value: 'all', label: 'Tất cả tỉnh/thành' }, ...provinces.map((p) => ({ value: p.name, label: `${p.name} (${p.count})` }))],
    [provinces],
  )
  const active = activeFilterCount(filters)

  const setRegion = (region) => {
    // Đổi miền thì tỉnh đang chọn có thể không còn thuộc miền mới — bỏ chọn tỉnh
    const keepProvince = region === 'all' || provincesOf(TEMPLES, region).some((p) => p.name === filters.province)
    onChange({ region, province: keepProvince ? filters.province : 'all' })
  }

  return (
    <div className="rounded-3xl border border-stone-200/70 bg-white p-4 shadow-soft sm:p-5 dark:border-white/5 dark:bg-night-2">
      <label htmlFor={searchId} className="sr-only">
        Tìm chùa
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-stone-400" aria-hidden />
        <input
          id={searchId}
          type="search"
          value={filters.query}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder="Tìm theo tên chùa, tỉnh, điểm nổi bật… (gõ không dấu cũng được)"
          className="h-12 w-full rounded-2xl border border-stone-300 bg-paper pr-12 pl-12 text-base text-stone-900 placeholder:text-stone-400 focus:border-jade-500 focus:ring-2 focus:ring-jade-500/20 focus:outline-none dark:border-white/10 dark:bg-night-3 dark:text-stone-100 [&::-webkit-search-cancel-button]:hidden"
          autoComplete="off"
        />
        {filters.query && (
          <button
            type="button"
            onClick={() => onChange({ query: '' })}
            className="absolute top-1/2 right-2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-stone-500 hover:bg-stone-100 dark:hover:bg-white/10"
            aria-label="Xoá từ khoá tìm kiếm"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[auto_auto_1fr] xl:items-end">
        <div>
          <p className="mb-1.5 text-sm font-medium text-stone-700 dark:text-stone-300" aria-hidden>
            Miền
          </p>
          <Segmented options={REGION_OPTIONS} value={filters.region} onChange={setRegion} aria-label="Lọc theo miền" />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-stone-700 dark:text-stone-300" aria-hidden>
            Trạng thái
          </p>
          <Segmented options={STATUS_OPTIONS} value={filters.status} onChange={(status) => onChange({ status })} aria-label="Lọc theo trạng thái" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:col-span-2 xl:col-span-1">
          <SelectField label="Tỉnh/thành" options={provinceOptions} value={filters.province} onChange={(e) => onChange({ province: e.target.value })} />
          <SelectField label="Sắp xếp" options={SORT_OPTIONS} value={filters.sort} onChange={(e) => onChange({ sort: e.target.value })} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 dark:border-white/5">
        <p className="text-sm text-stone-600 dark:text-stone-400" aria-live="polite">
          {resultCount ? (
            <>
              Tìm thấy <strong className="font-semibold text-stone-900 dark:text-stone-100">{resultCount}</strong> ngôi chùa
            </>
          ) : (
            'Không có chùa nào phù hợp'
          )}
        </p>
        {active > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Xoá bộ lọc ({active})
          </Button>
        )}
      </div>
    </div>
  )
}
