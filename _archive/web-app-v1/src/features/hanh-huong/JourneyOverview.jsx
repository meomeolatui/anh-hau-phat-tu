import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck, Heart, MapPinned, Navigation, Sparkles } from 'lucide-react'
import Button from '../../components/ui/Button'
import ProgressRing from '../../components/ui/ProgressRing'
import { formatShortDate, fromKey } from '../../lib/date'
import TempleArt from './TempleArt'
import { mapsUrl } from './pilgrimage'

const RING_TONES = { bac: 'jade', trung: 'saffron', nam: 'lotus' }

const REASON_TEXT = {
  wishlist: 'Nơi bạn đã lưu trong danh sách Muốn đến.',
  region: 'Cùng miền với những nơi bạn đã đến — có lẽ không quá xa.',
  daily: 'Gợi ý hôm nay. Một chuyến đi gần, một buổi sáng thong thả là đủ.',
}

function SuggestionCard({ suggestion }) {
  if (!suggestion) {
    return (
      <div className="flex h-full flex-col justify-center rounded-3xl bg-white/95 p-5 text-stone-800 shadow-soft dark:bg-night-2/90 dark:text-stone-100">
        <Sparkles className="h-6 w-6 text-saffron-500" aria-hidden />
        <p className="mt-2 font-serif text-lg font-semibold">Bạn đã ghi dấu tất cả các chùa trong danh bạ</p>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Hành trình bên ngoài đã trọn, hành trình trong tâm vẫn tiếp tục. Ngôi chùa gần nhà vẫn luôn chờ bạn ghé thăm.
        </p>
      </div>
    )
  }
  const { temple, reason } = suggestion
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-white/95 text-stone-800 shadow-soft dark:bg-night-2/90 dark:text-stone-100">
      <div className="h-28 overflow-hidden sm:h-36 lg:h-44">
        <TempleArt temple={temple} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold tracking-wider text-jade-700 uppercase dark:text-jade-300">Chuyến đi tới</p>
        <p className="mt-1 font-serif text-lg leading-snug font-semibold">{temple.name}</p>
        <p className="text-sm text-stone-600 dark:text-stone-400">{temple.province}</p>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{REASON_TEXT[reason]}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          <Button to={`/hanh-huong/${temple.id}`} size="sm" variant="primary">
            Xem chi tiết
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button href={mapsUrl(temple)} target="_blank" rel="noopener noreferrer" size="sm" variant="outline">
            <Navigation className="h-4 w-4" aria-hidden />
            Chỉ đường
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Khối hero: tiến độ hành hương tổng + theo miền + gợi ý chuyến đi tới. */
export default function JourneyOverview({ stats, suggestion }) {
  const percent = Math.round(stats.ratio * 100)
  return (
    <section
      aria-labelledby="hh-journey-title"
      className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-jade-700 via-jade-800 to-jade-950 p-5 text-white shadow-glow sm:p-8"
    >
      <div className="bg-lotus-pattern pointer-events-none absolute inset-0 opacity-90" aria-hidden />
      <svg className="pointer-events-none absolute -right-10 -bottom-8 h-56 w-80 text-white/5" viewBox="0 0 320 220" aria-hidden>
        <path d="M0 220 C60 160 100 60 160 40 C220 60 260 160 320 220 Z" fill="currentColor" />
        <path d="M110 70 L160 30 L210 70 Z" fill="currentColor" />
      </svg>
      <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-8">
        <div>
          <p className="text-xs font-semibold tracking-widest text-jade-200 uppercase">Hành trình của bạn</p>
          <h2 id="hh-journey-title" className="mt-2 font-serif text-2xl leading-tight font-semibold sm:text-3xl">
            Đã viếng <span className="text-saffron-300 tabular-nums">{stats.visited}</span>
            <span className="text-jade-200">/{stats.total}</span> ngôi chùa
          </h2>
          <div
            className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/15"
            role="progressbar"
            aria-label="Tiến độ hành hương"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div className="h-full rounded-full bg-gradient-to-r from-saffron-300 to-lotus-300 transition-all duration-700" style={{ width: `${percent}%` }} />
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-2 text-sm sm:gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <dt className="flex items-center gap-1.5 text-jade-100">
                <MapPinned className="h-4 w-4" aria-hidden />
                <span className="truncate">Tỉnh/thành</span>
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">{stats.provinces}</dd>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <dt className="flex items-center gap-1.5 text-jade-100">
                <Heart className="h-4 w-4" aria-hidden />
                <span className="truncate">Muốn đến</span>
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">{stats.wishlist.length}</dd>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <dt className="flex items-center gap-1.5 text-jade-100">
                <CalendarCheck className="h-4 w-4" aria-hidden />
                <span className="truncate">Gần nhất</span>
              </dt>
              <dd className="mt-1 truncate text-xl font-semibold tabular-nums">
                {stats.lastVisit?.date ? formatShortDate(fromKey(stats.lastVisit.date)) : '—'}
              </dd>
            </div>
          </dl>
          <ul className="mt-5 grid grid-cols-3 gap-2 sm:gap-3" aria-label="Tiến độ theo miền">
            {stats.byRegion.map((r) => (
              <li key={r.id} className="flex flex-col items-center rounded-2xl bg-white/95 px-2 py-3 text-stone-800 dark:bg-night-2/90 dark:text-stone-100">
                <ProgressRing value={r.ratio} size={68} stroke={7} tone={RING_TONES[r.id]} label={`${r.label}: đã viếng ${r.visited}/${r.total}`}>
                  <span className="text-sm font-semibold tabular-nums">
                    {r.visited}/{r.total}
                  </span>
                </ProgressRing>
                <span className="mt-2 text-center text-xs font-medium text-stone-600 sm:text-sm dark:text-stone-300">Miền {r.short}</span>
              </li>
            ))}
          </ul>
          {stats.lastVisit && (
            <p className="mt-4 text-sm text-jade-100">
              Lần gần nhất:{' '}
              <Link to={`/hanh-huong/${stats.lastVisit.temple.id}`} className="font-medium text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">
                {stats.lastVisit.temple.name}
              </Link>
            </p>
          )}
        </div>
        <SuggestionCard suggestion={suggestion} />
      </div>
    </section>
  )
}
