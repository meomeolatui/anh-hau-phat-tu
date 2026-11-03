import { Link } from 'react-router-dom'
import { CircleCheck, Heart, MapPin } from 'lucide-react'
import Card from '../../components/ui/Card'
import { REGIONS } from '../../data/temples'
import { formatShortDate, fromKey } from '../../lib/date'
import TempleArt from './TempleArt'
import WishlistButton from './WishlistButton'

const REGION_SHORT = Object.fromEntries(REGIONS.map((r) => [r.id, r.label]))

/**
 * Thẻ chùa trong lưới. Cả thẻ bấm được (liên kết "kéo giãn" qua ::after của tiêu đề),
 * riêng nút trái tim nằm lớp trên nên vẫn bấm độc lập.
 */
export default function TempleCard({ temple, status, visit }) {
  return (
    <Card as="article" padded={false} interactive className="group relative flex w-full flex-col overflow-hidden">
      <div className="relative aspect-[5/3] overflow-hidden">
        <TempleArt temple={temple} className="transition duration-500 group-hover:scale-105" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {status === 'visited' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-jade-700/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
              <CircleCheck className="h-3.5 w-3.5" aria-hidden />
              Đã viếng
            </span>
          )}
          {status === 'wishlist' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-lotus-600/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
              <Heart className="h-3.5 w-3.5 fill-current" aria-hidden />
              Muốn đến
            </span>
          )}
        </div>
        {status !== 'visited' && <WishlistButton temple={temple} className="absolute top-2.5 right-2.5 z-10" />}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-serif text-lg leading-snug font-semibold text-stone-900 dark:text-stone-50">
          <Link
            to={`/hanh-huong/${temple.id}`}
            className="outline-none after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-jade-500"
          >
            {temple.name}
          </Link>
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-600 dark:text-stone-400">
          <MapPin className="h-4 w-4 shrink-0 text-jade-600 dark:text-jade-400" aria-hidden />
          <span className="truncate">
            {temple.province} · {REGION_SHORT[temple.region]}
          </span>
        </p>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{temple.summary}</p>
        {visit?.date && (
          <p className="mt-auto pt-3 text-xs font-medium text-jade-700 dark:text-jade-300">
            Đã đến ngày {formatShortDate(fromKey(visit.date), true)}
          </p>
        )}
      </div>
    </Card>
  )
}
