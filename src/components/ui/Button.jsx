import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

const VARIANTS = {
  primary:
    'bg-jade-700 text-white shadow-sm hover:bg-jade-800 active:bg-jade-900 dark:bg-jade-500 dark:text-jade-950 dark:hover:bg-jade-400',
  secondary:
    'bg-jade-50 text-jade-800 hover:bg-jade-100 dark:bg-jade-900/50 dark:text-jade-100 dark:hover:bg-jade-900',
  outline:
    'border border-stone-300 bg-white/60 text-stone-800 hover:bg-stone-50 dark:border-stone-700 dark:bg-transparent dark:text-stone-100 dark:hover:bg-white/5',
  ghost: 'text-stone-700 hover:bg-stone-900/5 dark:text-stone-200 dark:hover:bg-white/10',
  lotus: 'bg-lotus-600 text-white shadow-sm hover:bg-lotus-700',
  saffron: 'bg-saffron-500 text-white shadow-sm hover:bg-saffron-600',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

const SIZES = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-sm',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-2xl px-6 text-base',
  icon: 'h-10 w-10 rounded-xl',
  'icon-sm': 'h-8 w-8 rounded-lg',
}

/**
 * Nút bấm chuẩn. Truyền `to` để render thành <Link>, `href` để render thành <a>.
 */
export default function Button({ variant = 'primary', size = 'md', className, to, href, children, ...props }) {
  const cls = cn(
    'inline-flex shrink-0 select-none items-center justify-center font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {children}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={cls} {...props}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" className={cls} {...props}>
      {children}
    </button>
  )
}
