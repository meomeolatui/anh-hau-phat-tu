import { BookOpen, CalendarDays, GraduationCap, MapPin, NotebookPen, Quote } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

const LINKS = [
  { to: '/kinh', label: 'Kinh tụng', desc: 'Đọc, tụng theo nhịp mõ', icon: BookOpen, tone: 'jade' },
  { to: '/hanh-huong', label: 'Hành hương', desc: 'Những ngôi chùa nên ghé', icon: MapPin, tone: 'lotus' },
  { to: '/hoc-phat', label: 'Học Phật', desc: 'Bài học ngắn, dễ hiểu', icon: GraduationCap, tone: 'saffron' },
  { to: '/phap-ngu', label: 'Pháp ngữ', desc: 'Lời dạy cho mỗi ngày', icon: Quote, tone: 'lotus' },
  { to: '/nhat-ky', label: 'Nhật ký', desc: 'Thiện hạnh và tự vấn', icon: NotebookPen, tone: 'jade' },
  { to: '/lich', label: 'Lịch âm', desc: 'Ngày vía, ngày chay', icon: CalendarDays, tone: 'saffron' },
]

const TONES = {
  jade: 'bg-jade-50 text-jade-700 group-hover:bg-jade-600 group-hover:text-white dark:bg-jade-900/40 dark:text-jade-300',
  lotus: 'bg-lotus-50 text-lotus-600 group-hover:bg-lotus-500 group-hover:text-white dark:bg-lotus-900/30 dark:text-lotus-300',
  saffron: 'bg-saffron-50 text-saffron-700 group-hover:bg-saffron-500 group-hover:text-white dark:bg-saffron-900/30 dark:text-saffron-300',
}

/** Lưới lối tắt tới các tính năng còn lại. */
export default function QuickLinks() {
  return (
    <section aria-labelledby="quick-links-title">
      <h2 id="quick-links-title" className="mb-3 font-serif text-xl font-semibold text-stone-900 dark:text-stone-50">
        Khám phá
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {LINKS.map(({ to, label, desc, icon: Icon, tone }) => (
          <li key={to}>
            <Link
              to={to}
              className="group flex h-full flex-col gap-3 rounded-3xl border border-stone-200/70 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-jade-300 hover:shadow-glow dark:border-white/5 dark:bg-night-2 dark:hover:border-jade-700"
            >
              <span className={cn('grid h-11 w-11 place-items-center rounded-2xl transition-colors', TONES[tone])}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold text-stone-900 dark:text-stone-100">{label}</span>
                <span className="mt-0.5 block text-sm text-stone-500 dark:text-stone-400">{desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
