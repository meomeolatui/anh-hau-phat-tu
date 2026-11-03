import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { UserRound } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { useStore } from '../lib/store'
import { currentStreak, totals } from '../lib/stats'
import ProfileOverview from '../features/ca-nhan/ProfileOverview'
import ProfileForm from '../features/ca-nhan/ProfileForm'
import GoalsForm from '../features/ca-nhan/GoalsForm'
import SettingsPanel from '../features/ca-nhan/SettingsPanel'
import Milestones from '../features/ca-nhan/Milestones'
import DataPanel from '../features/ca-nhan/DataPanel'
import InstallPanel from '../features/ca-nhan/InstallPanel'
import AboutPanel from '../features/ca-nhan/AboutPanel'

const SECTIONS = [
  { id: 'ho-so', label: 'Hồ sơ' },
  { id: 'muc-tieu', label: 'Mục tiêu' },
  { id: 'cai-dat', label: 'Cài đặt' },
  { id: 'thanh-tuu', label: 'Cột mốc' },
  { id: 'du-lieu', label: 'Dữ liệu' },
  { id: 'cai-ung-dung', label: 'Cài ứng dụng' },
  { id: 'gioi-thieu', label: 'Giới thiệu' },
]

export default function CaNhan() {
  const state = useStore()
  const { hash } = useLocation()
  // Tăng sau khi khôi phục/xoá dữ liệu để các biểu mẫu nạp lại giá trị mới từ store
  const [revision, setRevision] = useState(0)

  const summary = useMemo(() => ({ totals: totals(state.logs), streak: currentStreak(state.logs) }), [state.logs])

  // Hỗ trợ link sâu như /ca-nhan#cai-dat từ trang khác; đợi một nhịp để AppShell cuộn lên đầu xong
  useEffect(() => {
    if (!hash) return
    const id = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' }))
    return () => cancelAnimationFrame(id)
  }, [hash])

  return (
    <div>
      <PageHeader
        icon={UserRound}
        eyebrow="Cá nhân"
        title="Hồ sơ & cài đặt"
        subtitle="Thông tin của bạn, mục tiêu tu tập, cách ứng dụng hiển thị và dữ liệu trên thiết bị."
      />

      <div className="space-y-6">
        <ProfileOverview profile={state.profile} totals={summary.totals} streak={summary.streak} />

        <nav aria-label="Mục lục trang" className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
          <ul className="flex gap-2">
            {SECTIONS.map((s) => (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#${s.id}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 transition hover:border-jade-300 hover:text-jade-800 dark:border-white/10 dark:bg-night-2 dark:text-stone-300 dark:hover:border-jade-700 dark:hover:text-jade-200"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid gap-6 lg:grid-cols-2">
          <ProfileForm key={`p-${revision}`} profile={state.profile} />
          <GoalsForm key={`g-${revision}`} goals={state.profile.goals} />
        </div>

        <SettingsPanel settings={state.settings} />

        <Milestones state={state} />

        <div className="grid gap-6 lg:grid-cols-2">
          <DataPanel state={state} onReplaced={() => setRevision((r) => r + 1)} />
          <InstallPanel />
        </div>

        <AboutPanel />
      </div>
    </div>
  )
}
