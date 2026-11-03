import { Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Ellipsis, Monitor, Moon, Sun } from 'lucide-react'
import Logo from '../Logo'
import Modal from '../ui/Modal'
import { NAV_GROUPS, NAV_ITEMS } from '../../lib/nav'
import { useStore } from '../../lib/store'
import { updateSettings } from '../../lib/actions'
import { useApplyTheme } from '../../lib/useTheme'
import { cn } from '../../lib/cn'
import OnboardingGate from '../../features/onboarding/OnboardingGate'

const THEME_CYCLE = { system: 'light', light: 'dark', dark: 'system' }
const THEME_META = {
  system: { icon: Monitor, label: 'Theo hệ thống' },
  light: { icon: Sun, label: 'Giao diện sáng' },
  dark: { icon: Moon, label: 'Giao diện tối' },
}

function ThemeButton({ className }) {
  const theme = useStore((s) => s.settings.theme)
  const { icon: Icon, label } = THEME_META[theme] ?? THEME_META.system
  return (
    <button
      type="button"
      onClick={() => updateSettings({ theme: THEME_CYCLE[theme] ?? 'light' })}
      className={cn('grid h-10 w-10 place-items-center rounded-xl text-stone-600 hover:bg-stone-900/5 dark:text-stone-300 dark:hover:bg-white/10', className)}
      aria-label={`${label} — bấm để đổi`}
      title={label}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}

function SideLink({ item, onNavigate }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
          isActive
            ? 'bg-jade-700 text-white shadow-sm dark:bg-jade-600'
            : 'text-stone-600 hover:bg-stone-900/5 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-100',
        )
      }
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
      {item.label}
    </NavLink>
  )
}

function Sidebar() {
  const name = useStore((s) => s.profile.phapDanh || s.profile.name)
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-stone-200/70 bg-white/60 px-4 py-6 backdrop-blur lg:flex dark:border-white/5 dark:bg-night-2/60">
      <NavLink to="/" className="mb-8 px-2" aria-label="Anh Hậu Phật Tử — Trang chủ">
        <Logo />
      </NavLink>
      <nav className="flex-1 space-y-6 overflow-y-auto scrollbar-none" aria-label="Điều hướng chính">
        {NAV_GROUPS.map((g) => (
          <div key={g.label}>
            <p className="mb-2 px-3 text-[11px] font-semibold tracking-widest text-stone-400 uppercase">{g.label}</p>
            <div className="space-y-1">
              {g.items.map((item) => (
                <SideLink key={item.to} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-jade-50 px-3 py-2 dark:bg-jade-900/30">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-jade-900 dark:text-jade-100">{name || 'Phật tử'}</p>
          <p className="text-xs text-jade-700/80 dark:text-jade-300/70">A Di Đà Phật</p>
        </div>
        <ThemeButton />
      </div>
    </aside>
  )
}

function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200/60 bg-paper/85 px-4 py-2.5 backdrop-blur-lg lg:hidden dark:border-white/5 dark:bg-night/85">
      <NavLink to="/" aria-label="Trang chủ">
        <Logo />
      </NavLink>
      <ThemeButton />
    </header>
  )
}

function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const { pathname } = useLocation()
  const primary = NAV_ITEMS.filter((i) => i.mobile)
  const secondary = NAV_ITEMS.filter((i) => !i.mobile)
  const moreActive = secondary.some((i) => pathname.startsWith(i.to))

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/70 bg-white/90 pb-safe backdrop-blur-lg lg:hidden dark:border-white/5 dark:bg-night-2/90"
        aria-label="Điều hướng nhanh"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {primary.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-2 text-[11px] font-medium',
                    isActive ? 'text-jade-700 dark:text-jade-300' : 'text-stone-500 dark:text-stone-400',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cn('grid h-8 w-12 place-items-center rounded-full transition', isActive && 'bg-jade-100 dark:bg-jade-900/60')}>
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            )
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn('flex flex-col items-center gap-1 py-2 text-[11px] font-medium', moreActive ? 'text-jade-700 dark:text-jade-300' : 'text-stone-500 dark:text-stone-400')}
            aria-haspopup="dialog"
          >
            <span className={cn('grid h-8 w-12 place-items-center rounded-full', moreActive && 'bg-jade-100 dark:bg-jade-900/60')}>
              <Ellipsis className="h-5 w-5" aria-hidden />
            </span>
            Thêm
          </button>
        </div>
      </nav>
      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Khám phá thêm">
        <div className="grid grid-cols-2 gap-2">
          {secondary.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col gap-2 rounded-2xl border p-4 text-sm font-medium transition',
                    isActive
                      ? 'border-jade-300 bg-jade-50 text-jade-800 dark:border-jade-700 dark:bg-jade-900/40 dark:text-jade-100'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-white/10 dark:text-stone-200 dark:hover:bg-white/5',
                  )
                }
              >
                <Icon className="h-5 w-5 text-jade-600 dark:text-jade-400" aria-hidden />
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </Modal>
    </>
  )
}

function PageFallback() {
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status" aria-label="Đang tải">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-jade-200 border-t-jade-600" />
    </div>
  )
}

export default function AppShell() {
  useApplyTheme()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        Bỏ qua tới nội dung chính
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <BottomNav />
      <OnboardingGate />
    </div>
  )
}
