import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import TempleArt from './TempleArt'

/** Dải "Muốn đến": cuộn ngang trên di động, xếp lưới trên màn hình lớn. */
export default function WishlistStrip({ temples }) {
  return (
    <section aria-labelledby="hh-wish-title">
      <div className="mb-3 flex items-center gap-2">
        <Heart className="h-5 w-5 fill-lotus-500 text-lotus-500" aria-hidden />
        <h2 id="hh-wish-title" className="text-base font-semibold text-stone-900 dark:text-stone-100">
          Muốn đến <span className="text-stone-500 tabular-nums dark:text-stone-400">({temples.length})</span>
        </h2>
      </div>
      {temples.length ? (
        <ul className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-4">
          {temples.map((t) => (
            <li key={t.id} className="w-60 shrink-0 snap-start sm:w-auto">
              <Link
                to={`/hanh-huong/${t.id}`}
                className="flex items-center gap-3 rounded-2xl border border-lotus-200/70 bg-lotus-50/60 p-2.5 transition hover:border-lotus-300 hover:bg-lotus-50 dark:border-lotus-900/40 dark:bg-lotus-900/10 dark:hover:bg-lotus-900/20"
              >
                <div className="h-12 w-14 shrink-0 overflow-hidden rounded-xl">
                  <TempleArt temple={t} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-stone-900 dark:text-stone-100">{t.name}</p>
                  <p className="truncate text-sm text-stone-600 dark:text-stone-400">{t.province}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-4 text-sm text-stone-600 dark:border-white/10 dark:text-stone-400">
          Chưa có nơi nào. Bấm biểu tượng <Heart className="inline h-4 w-4 align-text-bottom text-lotus-500" aria-label="trái tim" /> trên thẻ chùa để
          lưu những nơi bạn mong được đến.
        </p>
      )}
    </section>
  )
}
