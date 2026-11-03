import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatViDate, fromKey } from '../../lib/date'
import TempleArt from './TempleArt'
import { groupByYear } from './pilgrimage'

/** Nhật ký hành hương: các chuyến đã ghi dấu, gom theo năm, mới nhất trước. */
export default function JourneyTimeline({ timeline }) {
  const groups = useMemo(() => groupByYear(timeline), [timeline])
  if (!timeline.length) return null

  return (
    <section aria-labelledby="hh-timeline-title">
      <p className="text-xs font-semibold tracking-widest text-jade-600 uppercase dark:text-jade-400">Nhật ký hành hương</p>
      <h2 id="hh-timeline-title" className="mt-1 mb-4 font-serif text-xl font-semibold text-stone-900 sm:text-2xl dark:text-stone-50">
        Những nơi bạn đã đến
      </h2>
      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.year}>
            <h3 className="mb-3 text-sm font-semibold text-saffron-700 tabular-nums dark:text-saffron-300">Năm {g.year}</h3>
            <ol className="relative space-y-3 border-l-2 border-jade-100 pl-5 dark:border-jade-900/60">
              {g.items.map(({ temple, date, note }) => (
                <li key={temple.id} className="relative">
                  <span className="absolute top-5 -left-[27px] h-3 w-3 rounded-full bg-jade-500 ring-4 ring-paper dark:ring-night" aria-hidden />
                  <Link
                    to={`/hanh-huong/${temple.id}`}
                    className="flex gap-3 rounded-2xl border border-stone-200/70 bg-white p-3 transition hover:border-jade-300 dark:border-white/5 dark:bg-night-2 dark:hover:border-jade-700"
                  >
                    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl">
                      <TempleArt temple={temple} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-stone-500 dark:text-stone-400">{formatViDate(fromKey(date))}</p>
                      <p className="font-medium text-stone-900 dark:text-stone-100">{temple.name}</p>
                      {note ? (
                        <p className="mt-1 line-clamp-2 font-serif text-sm text-stone-600 italic dark:text-stone-400">“{note}”</p>
                      ) : (
                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{temple.province}</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  )
}
