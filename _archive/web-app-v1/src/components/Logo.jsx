import { cn } from '../lib/cn'

/** Biểu trưng: đoá sen cách điệu trong vòng tròn viên mãn. */
export function LotusMark({ className }) {
  return (
    <svg viewBox="0 0 48 48" className={cn('h-10 w-10', className)} aria-hidden>
      <defs>
        <linearGradient id="lm-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a967f" />
          <stop offset="1" stopColor="#163f3a" />
        </linearGradient>
        <linearGradient id="lm-petal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fce7ef" />
          <stop offset="1" stopColor="#f8a8c5" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#lm-bg)" />
      <circle cx="24" cy="24" r="16" fill="none" stroke="#fbc94d" strokeOpacity=".55" strokeWidth="1.2" />
      <path d="M24 12c3.6 4 5.4 8 5.4 12S27.6 31.6 24 34c-3.6-2.4-5.4-6-5.4-10S20.4 16 24 12Z" fill="url(#lm-petal)" />
      <path d="M13 21c4.4.6 8 2.6 10 6 1 1.8 1 4.6 1 7-4.2-.4-7.6-2-9.6-4.8C12.6 26.6 12.4 24 13 21Z" fill="url(#lm-petal)" opacity=".92" />
      <path d="M35 21c-4.4.6-8 2.6-10 6-1 1.8-1 4.6-1 7 4.2-.4 7.6-2 9.6-4.8 1.8-2.6 2-5.2 1.4-8.2Z" fill="url(#lm-petal)" opacity=".92" />
      <path d="M14 35.5h20" stroke="#fbc94d" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export default function Logo({ className, compact = false }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LotusMark />
      {!compact && (
        <span className="leading-tight">
          <span className="block font-serif text-base font-semibold text-stone-900 dark:text-stone-50">Anh Hậu Phật Tử</span>
          <span className="block text-[11px] tracking-wide text-stone-500 dark:text-stone-400">Đồng hành tu tập mỗi ngày</span>
        </span>
      )}
    </span>
  )
}
