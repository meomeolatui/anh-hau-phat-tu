import { useId } from 'react'
import { cn } from '../../lib/cn'
import { moonLitPath } from './moon-phase'

/** Mặt trăng minh hoạ theo ngày âm — chỉ để trang trí, thông tin thật nằm ở chữ bên cạnh. */
export default function MoonPhase({ lunarDay, className }) {
  const gradId = useId()
  const lit = moonLitPath(lunarDay)
  return (
    <svg viewBox="0 0 100 100" className={cn('h-16 w-16', className)} aria-hidden focusable="false">
      <defs>
        <radialGradient id={gradId} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fffaeb" />
          <stop offset="70%" stopColor="#fde08a" />
          <stop offset="100%" stopColor="#fbc94d" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" className="fill-saffron-200/20 dark:fill-saffron-300/10" />
      <circle cx="50" cy="50" r="40" className="fill-stone-300/60 dark:fill-white/10" />
      {lit && <path d={lit} fill={`url(#${gradId})`} />}
      <circle cx="50" cy="50" r="40" fill="none" className="stroke-stone-400/40 dark:stroke-white/15" strokeWidth="1" />
    </svg>
  )
}
