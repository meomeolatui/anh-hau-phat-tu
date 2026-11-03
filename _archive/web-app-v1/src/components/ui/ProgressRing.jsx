import { cn } from '../../lib/cn'

/**
 * Vòng tiến độ SVG.
 * @param value 0..1
 * @param tone 'jade' | 'lotus' | 'saffron'
 */
export default function ProgressRing({ value = 0, size = 120, stroke = 10, tone = 'jade', className, children, label }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  const colors = {
    jade: 'stroke-jade-500',
    lotus: 'stroke-lotus-500',
    saffron: 'stroke-saffron-500',
  }
  return (
    <div
      className={cn('relative inline-grid place-items-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-stone-200 dark:stroke-white/10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          className={cn('fill-none transition-[stroke-dashoffset] duration-700 ease-out', colors[tone])}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}
