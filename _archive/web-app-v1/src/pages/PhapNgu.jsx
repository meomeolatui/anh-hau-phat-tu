import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpen, Heart, Quote, SearchX, Wind } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { QUOTES, QUOTE_THEMES, findQuote, quoteOfDay, themeLabel } from '../data/quotes'
import { useStore } from '../lib/store'
import { formatViDate } from '../lib/date'
import { haptic } from '../lib/sound'
import QuoteSpotlight from '../features/phap-ngu/QuoteSpotlight'
import QuoteFilters from '../features/phap-ngu/QuoteFilters'
import QuoteTile from '../features/phap-ngu/QuoteTile'
import ShareImageModal from '../features/phap-ngu/ShareImageModal'
import ContemplateView from '../features/phap-ngu/ContemplateView'
import { useQuoteActions } from '../features/phap-ngu/useQuoteActions'
import { countByTheme, filterQuotes, pickRandomQuote, pushRecent } from '../features/phap-ngu/quote-utils'

const PAGE_SIZE = 18
const FLIP_MS = 300

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

const READING_STEPS = [
  { title: 'Đọc chậm', desc: 'Đọc thành tiếng hoặc thầm, từng chữ một.' },
  { title: 'Dừng lại', desc: 'Ba hơi thở, để lời dạy thấm vào lòng.' },
  { title: 'Mang theo', desc: 'Chọn một câu để nhớ đến trong ngày.' },
]

function ReadingGuide({ favCount }) {
  return (
    <aside className="flex flex-col gap-4 rounded-4xl border border-stone-200/70 bg-white p-6 shadow-soft dark:border-white/5 dark:bg-night-2">
      <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
        <Wind className="h-5 w-5 text-jade-600 dark:text-jade-400" aria-hidden />
        <h2 className="font-semibold">Đọc pháp ngữ thế nào?</h2>
      </div>
      <ol className="space-y-3">
        {READING_STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-jade-50 font-serif text-sm font-semibold text-jade-700 dark:bg-jade-900/50 dark:text-jade-200">
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              <strong className="block font-semibold text-stone-800 dark:text-stone-200">{s.title}</strong>
              {s.desc}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-stone-100 pt-4 dark:border-white/5">
        <div>
          <p className="font-serif text-2xl font-semibold text-stone-900 dark:text-stone-50">{QUOTES.length}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">lời dạy · {QUOTE_THEMES.length} chủ đề</p>
        </div>
        <div>
          <p className="font-serif text-2xl font-semibold text-lotus-600 dark:text-lotus-400">{favCount}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">lời dạy bạn đã lưu</p>
        </div>
      </div>
    </aside>
  )
}

export default function PhapNgu() {
  const favIds = useStore((s) => s.favorites.quotes)
  const favSet = useMemo(() => new Set(favIds), [favIds])
  const { copy, toggleFav } = useQuoteActions()

  // Chốt ngày lúc mở trang: câu hôm nay không tự đổi giữa chừng khi người dùng đang đọc qua nửa đêm
  const [{ today, dateLabel }] = useState(() => {
    const now = new Date()
    return { today: quoteOfDay(now), dateLabel: formatViDate(now) }
  })
  const [params, setParams] = useSearchParams()
  const linked = findQuote(params.get('cau'))

  const [drawn, setDrawn] = useState(null)
  const [recent, setRecent] = useState(() => [today.id])
  const [flipping, setFlipping] = useState(false)
  const flipTimer = useRef(null)

  const [tab, setTab] = useState('all')
  const [theme, setTheme] = useState('all')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [limit, setLimit] = useState(PAGE_SIZE)

  const [shareQuote, setShareQuote] = useState(null)
  const [contemplate, setContemplate] = useState(null)

  useEffect(() => () => clearTimeout(flipTimer.current), [])

  const spotlight = drawn ?? linked ?? today
  const mode = drawn ? 'drawn' : linked ? 'linked' : 'today'

  const base = useMemo(
    () => (tab === 'fav' ? filterQuotes(QUOTES, { favoriteIds: favIds, onlyFavorites: true }) : QUOTES),
    [tab, favIds],
  )
  const counts = useMemo(() => countByTheme(base), [base])
  const results = useMemo(
    () => filterQuotes(base, { query: deferredQuery, theme, getThemeLabel: themeLabel }),
    [base, deferredQuery, theme],
  )
  const visible = results.slice(0, limit)

  // Rút trong chủ đề đang chọn (nếu có) — người đang tìm về "Nhẫn nhục" thường muốn thêm lời dạy cùng chủ đề
  const drawPool = useMemo(() => (theme === 'all' ? QUOTES : QUOTES.filter((q) => q.theme === theme)), [theme])

  const draw = () => {
    const next = pickRandomQuote(drawPool, [...recent, spotlight.id])
    if (!next || flipping) return
    haptic(10)
    setFlipping(true)
    clearTimeout(flipTimer.current)
    flipTimer.current = setTimeout(
      () => {
        setDrawn(next)
        setRecent((r) => pushRecent(r, next.id))
        setFlipping(false)
      },
      prefersReducedMotion() ? 0 : FLIP_MS,
    )
  }

  const backToToday = () => {
    setDrawn(null)
    if (linked) setParams({}, { replace: true })
  }

  // "Lời dạy khác" trong chế độ chiêm nghiệm: ở lại cùng chủ đề để mạch suy ngẫm không bị đứt
  const nextContemplation = () => {
    if (!contemplate) return
    const pool = QUOTES.filter((q) => q.theme === contemplate.theme)
    setContemplate(pickRandomQuote(pool, [contemplate.id]) ?? contemplate)
  }

  const resetLimit = (fn) => (v) => {
    fn(v)
    setLimit(PAGE_SIZE)
  }

  const clearFilters = () => {
    setQuery('')
    setTheme('all')
    setLimit(PAGE_SIZE)
  }

  // Hàm đóng phải ổn định: Modal dùng nó làm phụ thuộc effect quản lý focus
  const closeShare = useCallback(() => setShareQuote(null), [])
  const closeContemplate = useCallback(() => setContemplate(null), [])

  const filtered = deferredQuery.trim() || theme !== 'all'
  const themeName = theme === 'all' ? '' : themeLabel(theme)

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        eyebrow="Thư viện lời Phật dạy"
        title="Pháp ngữ"
        subtitle="Mỗi ngày một lời dạy để soi lại lòng mình — đọc chậm, nghĩ sâu, sống hiền hơn sau khi tắt màn hình."
        icon={Quote}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <QuoteSpotlight
          quote={spotlight}
          mode={mode}
          dateLabel={dateLabel}
          flipping={flipping}
          favorite={favSet.has(spotlight.id)}
          drawScopeLabel={themeName ? `Đang rút trong chủ đề “${themeName}”.` : ''}
          onDraw={draw}
          onBackToday={backToToday}
          onToggleFavorite={toggleFav}
          onCopy={copy}
          onShare={setShareQuote}
          onContemplate={setContemplate}
        />
        <ReadingGuide favCount={favIds.length} />
      </div>

      <section aria-labelledby="library-title" className="space-y-5">
        <div className="flex items-end justify-between gap-3">
          <h2 id="library-title" className="flex items-center gap-2 font-serif text-xl font-semibold text-stone-900 sm:text-2xl dark:text-stone-50">
            <BookOpen className="h-6 w-6 text-jade-600 dark:text-jade-400" aria-hidden />
            {tab === 'fav' ? 'Lời dạy đã lưu' : 'Tất cả lời dạy'}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400" aria-live="polite">
            {results.length} lời dạy
          </p>
        </div>

        <QuoteFilters
          tab={tab}
          onTab={resetLimit(setTab)}
          favCount={favIds.length}
          query={query}
          onQuery={resetLimit(setQuery)}
          theme={theme}
          onTheme={resetLimit(setTheme)}
          counts={counts}
        />

        {results.length === 0 && tab === 'fav' && !filtered && (
          <EmptyState
            icon={Heart}
            title="Bạn chưa lưu lời dạy nào"
            description="Chạm biểu tượng trái tim trên những lời dạy chạm đến lòng mình để đọc lại bất cứ lúc nào."
            action={
              <Button variant="secondary" onClick={() => setTab('all')}>
                Xem tất cả lời dạy
              </Button>
            }
          />
        )}

        {results.length === 0 && (tab !== 'fav' || filtered) && (
          <EmptyState
            icon={SearchX}
            title="Chưa tìm thấy lời dạy phù hợp"
            description="Thử từ khoá ngắn hơn, gõ không dấu, hoặc chọn chủ đề khác."
            action={
              <Button variant="secondary" onClick={clearFilters}>
                Xoá bộ lọc
              </Button>
            }
          />
        )}

        {visible.length > 0 && (
          <div className="columns-1 gap-4 md:columns-2 2xl:columns-3">
            {visible.map((q) => (
              <QuoteTile
                key={q.id}
                quote={q}
                favorite={favSet.has(q.id)}
                onToggleFavorite={toggleFav}
                onCopy={copy}
                onShare={setShareQuote}
                onContemplate={setContemplate}
              />
            ))}
          </div>
        )}

        {results.length > limit && (
          <div className="flex justify-center">
            <Button variant="outline" size="lg" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
              Xem thêm ({results.length - limit} lời dạy)
            </Button>
          </div>
        )}
      </section>

      <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-stone-500 dark:text-stone-500">
        Các câu trích từ kinh điển được lược dịch, diễn đạt lại bằng lời văn dễ hiểu; kệ chữ Hán giữ nguyên phiên âm kèm lược giải.
        Để học sâu, xin tham khảo các bản dịch đầy đủ của chư tôn đức.
      </p>

      {contemplate && (
        <ContemplateView
          quote={contemplate}
          favorite={favSet.has(contemplate.id)}
          onClose={closeContemplate}
          onNext={nextContemplation}
          onToggleFavorite={toggleFav}
          onShare={setShareQuote}
        />
      )}
      <ShareImageModal quote={shareQuote} onClose={closeShare} />
    </div>
  )
}
