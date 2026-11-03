import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, BookOpen, CalendarCheck, Clock, Heart, Info, Search, Sunrise, X } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Segmented from '../components/ui/Segmented'
import EmptyState from '../components/ui/EmptyState'
import { useStore } from '../lib/store'
import { formatDuration } from '../lib/date'
import { cn } from '../lib/cn'
import { SUTRAS, SUTRA_CATEGORIES, getSutra } from '../data/sutras'
import { buildIndex, searchIndex } from '../features/kinh/search'
import { isInProgress, progressOf } from '../features/kinh/reader'
import { suggestByHour, tungStats } from '../features/kinh/history'
import { ALL_ICON, categoryMeta } from '../features/kinh/category-meta'
import SutraCard from '../features/kinh/SutraCard'
import SutraGlyph from '../features/kinh/SutraGlyph'

// Dữ liệu tĩnh: dựng chỉ mục tìm kiếm và đếm dòng một lần khi tải trang
const INDEX = buildIndex(SUTRAS, getSutra)
const LINE_COUNT = Object.fromEntries(INDEX.map((e) => [e.sutra.id, e.lines.length]))

const FILTERS = [
  { value: 'all', label: `Tất cả (${SUTRAS.length})`, icon: ALL_ICON },
  ...SUTRA_CATEGORIES.map((c) => ({
    value: c.id,
    label: `${c.short} (${SUTRAS.filter((s) => s.category === c.id).length})`,
    icon: categoryMeta(c.id).icon,
  })),
]

export default function Kinh() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const rawCategory = params.get('loai')
  const category = FILTERS.some((f) => f.value === rawCategory) ? rawCategory : 'all'

  const favorites = useStore((s) => s.favorites.sutras)
  const bookmarks = useStore((s) => s.bookmarks)
  const sessions = useStore((s) => s.sessions)

  const stats = useMemo(() => tungStats(sessions), [sessions])
  const results = useMemo(
    () => searchIndex(INDEX, query).filter((r) => category === 'all' || r.sutra.category === category),
    [query, category],
  )
  const continueList = useMemo(
    () => SUTRAS.filter((s) => isInProgress(bookmarks[s.id], LINE_COUNT[s.id])),
    [bookmarks],
  )
  const favoriteList = useMemo(() => favorites.map(getSutra).filter(Boolean), [favorites])

  // Giữ từ khoá & bộ lọc trên URL để quay lại từ trình đọc vẫn còn nguyên kết quả
  const updateParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value && value !== 'all') next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const browsing = !query.trim() && category === 'all'

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Thư viện tụng niệm"
        title="Kinh tụng"
        subtitle="Kinh, chú, kệ và nghi thức tụng tại gia — chữ lớn dễ đọc, có chế độ tụng theo nhịp mõ, dùng được cả khi không có mạng."
        icon={BookOpen}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <SuggestionCard />
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
          <StatTile icon={Sunrise} label="Thời tụng hôm nay" value={stats.today} tone="saffron" />
          <StatTile icon={CalendarCheck} label="Trong 7 ngày qua" value={stats.week} tone="jade" />
          <StatTile icon={Clock} label="Tổng thời gian tụng" value={formatDuration(stats.seconds)} tone="lotus" />
        </div>
      </div>

      {continueList.length > 0 && (
        <section className="mt-8" aria-labelledby="doc-tiep">
          <h2 id="doc-tiep" className="mb-3 text-lg font-semibold text-stone-900 dark:text-stone-100">
            Đọc tiếp
          </h2>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-3">
            {continueList.map((s) => (
              <ContinueCard key={s.id} sutra={s} index={bookmarks[s.id]} total={LINE_COUNT[s.id]} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8" aria-labelledby="thu-vien">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 id="thu-vien" className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Thư viện
          </h2>
          <SearchBox value={query} onChange={(v) => updateParam('q', v)} />
        </div>
        <div className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
          <Segmented
            options={FILTERS}
            value={category}
            onChange={(v) => updateParam('loai', v)}
            aria-label="Lọc theo loại bài"
          />
        </div>

        {browsing && favoriteList.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-lotus-700 uppercase dark:text-lotus-300">
              <Heart className="h-4 w-4 fill-current" aria-hidden />
              Bài yêu thích
            </h3>
            <CardGrid items={favoriteList.map((s) => ({ sutra: s }))} favorites={favorites} bookmarks={bookmarks} stats={stats} />
          </div>
        )}

        <div className="mt-6">
          <p className="mb-3 text-sm text-stone-500 dark:text-stone-400" aria-live="polite">
            {query.trim() ? `${results.length} kết quả cho “${query.trim()}”` : browsing ? 'Tất cả bài tụng' : `${results.length} bài`}
          </p>
          {results.length ? (
            <CardGrid items={results} favorites={favorites} bookmarks={bookmarks} stats={stats} />
          ) : (
            <EmptyState
              icon={Search}
              title="Chưa tìm thấy bài phù hợp"
              description="Thử gõ ngắn hơn, ví dụ “tam kinh”, “sam hoi”, “vang sanh” — gõ không dấu cũng được."
              action={
                <Button variant="secondary" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                  Xoá tìm kiếm & bộ lọc
                </Button>
              }
            />
          )}
        </div>
      </section>

      <aside className="mt-10 flex gap-3 rounded-3xl border border-stone-200/70 bg-paper-2/70 p-5 text-sm leading-relaxed text-stone-600 dark:border-white/5 dark:bg-night-2/60 dark:text-stone-400">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-jade-600 dark:text-jade-400" aria-hidden />
        <p>
          Kinh văn, chú và kệ truyền thống giữ nguyên phiên âm Hán-Việt thường dùng trong thời khoá tại Việt Nam. Phần
          “Lược giải” do ứng dụng tự diễn đạt cho dễ hiểu, không thay thế lời giảng của quý thầy — khi có điều chưa rõ,
          hãy hỏi thêm nơi đạo tràng bạn tu học.
        </p>
      </aside>
    </div>
  )
}

function SuggestionCard() {
  const tip = suggestByHour()
  const sutra = getSutra(tip.id)
  if (!sutra) return null
  return (
    <div className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-jade-700 via-jade-800 to-jade-950 p-6 text-white shadow-glow sm:p-8 lg:col-span-2">
      <div className="bg-lotus-pattern pointer-events-none absolute inset-0 opacity-80" aria-hidden />
      <SutraGlyph category={sutra.category} className="pointer-events-none absolute -right-6 -bottom-6 h-48 w-48 text-white/10" />
      <div className="relative max-w-lg">
        <p className="text-xs font-semibold tracking-widest text-saffron-200 uppercase">{tip.label} · gợi ý cho bạn</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">{sutra.title}</h2>
        <p className="mt-2 text-jade-50/90">{tip.hint}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            to={`/kinh/${sutra.id}`}
            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-6 font-medium text-jade-900 shadow-sm transition hover:bg-jade-50"
          >
            Bắt đầu tụng
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <span className="inline-flex items-center gap-1.5 text-sm text-jade-100/90">
            <Clock className="h-4 w-4" aria-hidden />
            khoảng {sutra.minutes} phút
          </span>
        </div>
      </div>
    </div>
  )
}

const TILE_TONES = {
  jade: 'bg-jade-50 text-jade-700 dark:bg-jade-900/40 dark:text-jade-300',
  lotus: 'bg-lotus-50 text-lotus-600 dark:bg-lotus-900/30 dark:text-lotus-300',
  saffron: 'bg-saffron-50 text-saffron-700 dark:bg-saffron-900/30 dark:text-saffron-300',
}

/** Ô số liệu: dọc trên di động (3 ô một hàng), ngang khi đủ rộng. */
function StatTile({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex flex-col gap-2 rounded-3xl border border-stone-200/70 bg-white p-4 sm:flex-row sm:items-center sm:gap-3 dark:border-white/5 dark:bg-night-2">
      <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-2xl', TILE_TONES[tone])}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-semibold text-stone-900 tabular-nums dark:text-stone-50">{value}</p>
        <p className="text-xs leading-snug text-stone-500 dark:text-stone-400">{label}</p>
      </div>
    </div>
  )
}

function ContinueCard({ sutra, index, total }) {
  const pct = Math.round(progressOf(index, total) * 100)
  return (
    <Link
      to={`/kinh/${sutra.id}`}
      className="flex w-72 shrink-0 snap-start items-center gap-4 rounded-3xl border border-jade-200 bg-jade-50/70 p-4 transition hover:border-jade-400 hover:bg-jade-50 sm:w-auto dark:border-jade-800 dark:bg-jade-900/30 dark:hover:border-jade-600"
    >
      <div
        className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-xs font-semibold text-jade-800 dark:text-jade-100"
        style={{ background: `conic-gradient(var(--color-jade-500) ${pct}%, transparent 0)` }}
        aria-hidden
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-jade-50 dark:bg-night-2">{pct}%</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-base font-semibold text-stone-900 dark:text-stone-50">{sutra.title}</p>
        <p className="text-sm text-jade-700 dark:text-jade-300">
          Tiếp tục từ dòng {index + 1}/{total}
        </p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-jade-600 dark:text-jade-400" aria-hidden />
    </Link>
  )
}

function SearchBox({ value, onChange }) {
  return (
    <div className="relative w-full lg:max-w-sm">
      <label htmlFor="tim-kinh" className="sr-only">
        Tìm bài kinh, chú, kệ
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-stone-400" aria-hidden />
      <input
        id="tim-kinh"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tìm bài hoặc câu kinh (gõ không dấu được)…"
        autoComplete="off"
        className={cn(
          'h-12 w-full rounded-2xl border border-stone-300 bg-white pr-11 pl-12 text-base text-stone-900 placeholder:text-stone-400',
          'transition focus:border-jade-500 focus:ring-2 focus:ring-jade-500/20 focus:outline-none',
          'dark:border-white/10 dark:bg-night-2 dark:text-stone-100 [&::-webkit-search-cancel-button]:hidden',
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-stone-500 hover:bg-stone-100 dark:hover:bg-white/10"
          aria-label="Xoá từ khoá"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  )
}

function CardGrid({ items, favorites, bookmarks, stats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(({ sutra, snippet, lineIndex }) => (
        <SutraCard
          key={sutra.id}
          sutra={sutra}
          lineCount={LINE_COUNT[sutra.id]}
          favorite={favorites.includes(sutra.id)}
          bookmark={bookmarks[sutra.id]}
          stat={stats.byId[sutra.id]}
          snippet={snippet}
          lineIndex={lineIndex}
        />
      ))}
    </div>
  )
}
