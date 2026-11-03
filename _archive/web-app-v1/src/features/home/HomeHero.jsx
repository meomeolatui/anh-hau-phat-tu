import { CircleDot, Moon, Timer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

const BADGE_TONES = {
  saffron: 'bg-saffron-300 text-saffron-900',
  lotus: 'bg-lotus-200 text-lotus-900',
  jade: 'bg-jade-100 text-jade-900',
}

/** Minh hoạ: mặt trời buổi sớm sau đoá sen trên mặt nước tĩnh. */
function HeroArt({ className }) {
  const petal = 'M160 92c11 15 16 33 16 52s-5 32-16 44c-11-12-16-25-16-44s5-37 16-52Z'
  return (
    <svg viewBox="0 0 320 240" className={className} aria-hidden>
      <defs>
        <radialGradient id="hh-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fde08a" stopOpacity="0.95" />
          <stop offset="0.6" stopColor="#fbc94d" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f0920c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hh-petal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdf2f6" />
          <stop offset="1" stopColor="#f8a8c5" />
        </linearGradient>
        <linearGradient id="hh-petal-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbcfe0" />
          <stop offset="1" stopColor="#e8497d" />
        </linearGradient>
      </defs>
      <g className="origin-center animate-breathe" style={{ transformBox: 'fill-box' }}>
        <circle cx="160" cy="118" r="96" fill="url(#hh-sun)" />
      </g>
      <g fill="none" stroke="#fff" strokeOpacity="0.12">
        <circle cx="160" cy="118" r="70" />
        <circle cx="160" cy="118" r="104" />
        <circle cx="160" cy="118" r="138" />
      </g>
      <g className="animate-float">
        <path d={petal} fill="url(#hh-petal-back)" opacity="0.75" transform="rotate(-62 160 188)" />
        <path d={petal} fill="url(#hh-petal-back)" opacity="0.75" transform="rotate(62 160 188)" />
        <path d={petal} fill="url(#hh-petal)" opacity="0.95" transform="rotate(-32 160 188)" />
        <path d={petal} fill="url(#hh-petal)" opacity="0.95" transform="rotate(32 160 188)" />
        <path d={petal} fill="url(#hh-petal)" />
        <path d="M128 190c10 6 21 8 32 8s22-2 32-8" fill="none" stroke="#fbc94d" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g stroke="#fff" strokeLinecap="round" strokeOpacity="0.28" strokeWidth="2">
        <path d="M96 210h128" />
        <path d="M120 222h80" strokeOpacity="0.18" />
        <path d="M140 232h40" strokeOpacity="0.12" />
      </g>
    </svg>
  )
}

/**
 * Khối mở đầu trang Hôm nay: lời chào, ngày dương – âm, các nhãn ngày đặc biệt.
 */
export default function HomeHero({ greeting, name, phapDanh, solarLabel, lunarLabel, dayCanChi, badges }) {
  return (
    <section
      aria-labelledby="home-greeting"
      className="relative isolate overflow-hidden rounded-4xl bg-gradient-to-br from-jade-700 via-jade-800 to-jade-950 px-6 py-8 text-white shadow-glow sm:px-10 sm:py-10 dark:from-jade-900 dark:via-night-3 dark:to-night"
    >
      <div className="bg-lotus-pattern absolute inset-0 -z-10 opacity-90" aria-hidden />
      <HeroArt className="pointer-events-none absolute -right-16 -bottom-6 -z-10 h-56 opacity-40 sm:right-0 sm:h-72 sm:opacity-90 lg:right-6 lg:h-80" />

      <div className="max-w-xl">
        <p className="text-sm font-medium text-jade-100/90">{solarLabel}</p>
        <h2 id="home-greeting" className="mt-2 font-serif text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          {greeting}
          {name ? ',' : ''}
          {name && <span className="block text-saffron-200">{name}</span>}
        </h2>
        {phapDanh && <p className="mt-1 text-sm text-jade-100/90">Pháp danh {phapDanh}</p>}

        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-white/95">
          <Moon className="h-4 w-4 text-saffron-200" aria-hidden />
          <span className="font-medium">{lunarLabel}</span>
          <span className="text-jade-100/80">· ngày {dayCanChi}</span>
        </p>

        {badges.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Hôm nay là">
            {badges.map((b) => (
              <li key={b.id} className={cn('rounded-full px-3 py-1 text-sm font-semibold shadow-sm', BADGE_TONES[b.tone])}>
                {b.label}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/niem-phat"
            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-5 text-base font-semibold text-jade-800 shadow-sm transition hover:bg-jade-50"
          >
            <CircleDot className="h-5 w-5" aria-hidden />
            Niệm Phật
          </Link>
          <Link
            to="/thien"
            className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            <Timer className="h-5 w-5" aria-hidden />
            Ngồi thiền
          </Link>
        </div>
      </div>
    </section>
  )
}
