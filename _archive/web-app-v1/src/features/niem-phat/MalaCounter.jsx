import { memo, useMemo } from 'react'
import { Pause, Play } from 'lucide-react'
import { cn } from '../../lib/cn'
import { formatNumber } from '../../lib/date'
import { VIEW, beadLayout, beadState } from './mala'

const BEAD_CLASS = {
  todo: 'fill-stone-200 stroke-stone-300/70 dark:fill-white/10 dark:stroke-white/10',
  done: 'fill-jade-500 stroke-jade-600/40 dark:fill-jade-400 dark:stroke-jade-300/30',
  current: 'fill-saffron-400 stroke-saffron-600/40 dark:fill-saffron-300',
}

/** Vòng hạt SVG — tách riêng và memo để lần hạt chỉ vẽ lại khi vị trí hạt đổi. */
const MalaRing = memo(function MalaRing({ size, bead, total, completedFlash }) {
  const layout = useMemo(() => beadLayout(size), [size])
  const { center, radius, beadR, guru, beads } = layout
  const current = bead > 0 ? beads[bead - 1] : null
  const origin = (p) => ({ transformOrigin: `${p.x}px ${p.y}px` })
  const guruGlow = bead === 0 && total > 0

  return (
    <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="absolute inset-0 h-full w-full" aria-hidden focusable="false">
      <defs>
        <radialGradient id="np-guru" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#f8a8c5" />
          <stop offset="60%" stopColor="#d52b5c" />
          <stop offset="100%" stopColor="#7f1a37" />
        </radialGradient>
        <radialGradient id="np-halo">
          <stop offset="0%" stopColor="#fbc94d" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fbc94d" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sợi dây xâu chuỗi */}
      <circle cx={center} cy={center} r={radius} className="fill-none stroke-stone-300 dark:stroke-white/15" strokeWidth="1.5" />

      {beads.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={beadR} strokeWidth="1" className={cn('transition-colors duration-300', BEAD_CLASS[beadState(i, bead)])} />
          {beadR >= 6 && <circle cx={p.x - beadR * 0.3} cy={p.y - beadR * 0.3} r={beadR * 0.28} className="fill-white/50 dark:fill-white/25" />}
        </g>
      ))}

      {current && (
        <>
          <circle cx={current.x} cy={current.y} r={beadR * 3} fill="url(#np-halo)" />
          {/* key theo tổng số câu để mỗi lần lần hạt hiệu ứng chạy lại từ đầu */}
          <circle
            key={`r${total}`}
            cx={current.x}
            cy={current.y}
            r={beadR * 1.4}
            strokeWidth="2"
            className="animate-ripple fill-none stroke-saffron-400"
            style={origin(current)}
          />
          <g key={`s${total}`} className="animate-[spin_0.6s_ease-out_1]" style={origin(current)}>
            <circle cx={current.x} cy={current.y} r={beadR * 1.25} strokeWidth="1" className={BEAD_CLASS.current} />
            <circle cx={current.x - beadR * 0.45} cy={current.y - beadR * 0.45} r={beadR * 0.35} className="fill-white/70" />
          </g>
        </>
      )}

      {/* Hạt mẫu ở đỉnh — sáng lên khi vừa tròn một chuỗi */}
      {guruGlow && (
        <circle
          key={`g${completedFlash}`}
          cx={guru.x}
          cy={guru.y}
          r={guru.r * 1.3}
          strokeWidth="2.5"
          className="animate-ripple fill-none stroke-lotus-400"
          style={origin(guru)}
        />
      )}
      <circle cx={guru.x} cy={guru.y} r={guru.r} fill="url(#np-guru)" className="stroke-white/70 dark:stroke-night" strokeWidth="2" />
      <circle cx={guru.x - guru.r * 0.32} cy={guru.y - guru.r * 0.32} r={guru.r * 0.28} className="fill-white/60" />
    </svg>
  )
})

/**
 * Tràng hạt + vùng chạm lớn. Toàn bộ khối tròn là một nút để chạm dễ dàng,
 * kể cả với người lớn tuổi; touch-action: manipulation tránh phóng to khi chạm nhanh hai lần.
 */
export default function MalaCounter({ size, session, mantra, mode, running, onActivate, padRef, focus = false }) {
  const { total, bead, rounds } = session
  const auto = mode === 'mo'
  const label = auto
    ? `${running ? 'Tạm dừng' : 'Bắt đầu'} niệm theo nhịp mõ. Đã niệm ${total} câu.`
    : `Lần hạt. Đã niệm ${total} câu, hạt ${bead} trên ${size}, ${rounds} vòng.`

  return (
    <button
      ref={padRef}
      type="button"
      onClick={onActivate}
      aria-label={label}
      className={cn(
        'group relative mx-auto block aspect-square w-full touch-manipulation rounded-full select-none',
        focus ? 'max-w-[min(92vw,72vh)]' : 'max-w-[26rem]',
      )}
    >
      <MalaRing size={size} bead={bead} total={total} completedFlash={rounds} />

      <span
        className={cn(
          'absolute inset-[17%] flex flex-col items-center justify-center overflow-hidden rounded-full border text-center transition',
          'border-jade-100 bg-gradient-to-b from-white to-jade-50 shadow-soft group-hover:shadow-glow group-active:scale-[0.98]',
          'dark:border-white/5 dark:from-night-3 dark:to-night-2',
        )}
      >
        {/* Gợn sóng nhẹ ở vùng chạm mỗi khi lần hạt */}
        {total > 0 && <span key={total} className="pointer-events-none absolute inset-[25%] animate-ripple rounded-full bg-jade-400/20" aria-hidden />}
        <span className="relative line-clamp-2 max-w-[85%] font-serif text-sm leading-snug text-jade-800 sm:text-base dark:text-jade-200">
          {mantra}
        </span>
        <span className="relative mt-1 text-5xl font-semibold tracking-tight text-stone-900 tabular-nums sm:text-6xl dark:text-stone-50">
          {formatNumber(total)}
        </span>
        <span className="relative mt-1 text-xs font-medium text-stone-500 tabular-nums sm:text-sm dark:text-stone-400">
          Hạt {bead}/{size} · {rounds} vòng
        </span>
        {auto && (
          <span
            className={cn(
              'relative mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
              running ? 'bg-saffron-100 text-saffron-800 dark:bg-saffron-900/40 dark:text-saffron-200' : 'bg-jade-700 text-white dark:bg-jade-500 dark:text-jade-950',
            )}
            aria-hidden
          >
            {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {running ? 'Tạm dừng' : 'Bắt đầu'}
          </span>
        )}
      </span>
    </button>
  )
}
