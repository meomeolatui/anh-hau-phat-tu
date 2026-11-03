import { useMemo } from 'react'
import PageHeader from '../components/ui/PageHeader'
import { useStore } from '../lib/store'
import { getDay } from '../lib/actions'
import { formatViDate, fromKey, greetingByHour, toKey } from '../lib/date'
import { getLunarDate, lunarShortLabel } from '../lib/lunar'
import { currentStreak, longestStreak } from '../lib/stats'
import { getFastingScheme, holidaysOn, isFastingDay, isSocVong, upcomingFastingDays, upcomingHolidays } from '../data/holidays'
import { quoteOfDay } from '../data/quotes'
import HomeHero from '../features/home/HomeHero'
import TodayPractice from '../features/home/TodayPractice'
import StreakCard from '../features/home/StreakCard'
import QuoteCard from '../features/home/QuoteCard'
import UpcomingCard from '../features/home/UpcomingCard'
import QuickLinks from '../features/home/QuickLinks'
import SuggestionCard from '../features/home/SuggestionCard'
import MindfulNote from '../features/home/MindfulNote'
import { useNow } from '../features/home/useNow'
import { lunarHeading, recentDays, todayBadges } from '../features/home/today'
import { suggestFor } from '../features/home/suggest'

export default function Home() {
  const now = useNow()
  const key = toKey(now)
  const hour = now.getHours()

  const profile = useStore((s) => s.profile)
  const fasting = useStore((s) => s.settings.fasting)
  const logs = useStore((s) => s.logs)
  const day = getDay(logs, key)

  // Dữ liệu lịch chỉ đổi theo ngày → tính lại khi qua ngày mới, không phải mỗi phút
  const calendar = useMemo(() => {
    const date = fromKey(key)
    const lunar = getLunarDate(date)
    return {
      date,
      lunar,
      holidaysToday: holidaysOn(lunar),
      badges: todayBadges(lunar, fasting),
      fastingToday: isFastingDay(lunar, fasting),
      socVong: isSocVong(lunar),
      upcoming: upcomingHolidays(date, 3).map((h) => ({ ...h, lunarLabel: lunarShortLabel(getLunarDate(h.date)) })),
      fastingDays: upcomingFastingDays(fasting, date, 3).map((f) => ({ ...f, lunarLabel: lunarShortLabel(f.lunar) })),
      quote: quoteOfDay(date),
    }
  }, [key, fasting])

  const streak = useMemo(
    () => ({ current: currentStreak(logs, key), longest: longestStreak(logs), days: recentDays(logs, key) }),
    [logs, key],
  )

  const suggestion = useMemo(
    () =>
      suggestFor({
        hour,
        day,
        goals: profile.goals,
        holidays: calendar.holidaysToday,
        fasting: calendar.fastingToday,
        socVong: calendar.socVong,
      }),
    [hour, day, profile.goals, calendar],
  )

  const scheme = getFastingScheme(fasting)

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title="Hôm nay" className="sr-only" />

      <div className="animate-fade-up">
        <HomeHero
          greeting={greetingByHour(hour)}
          name={profile.name.trim()}
          phapDanh={profile.phapDanh.trim()}
          solarLabel={formatViDate(calendar.date)}
          lunarLabel={lunarHeading(calendar.lunar)}
          dayCanChi={calendar.lunar.dayName}
          badges={calendar.badges}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TodayPractice day={day} goals={profile.goals} />
        </div>
        <SuggestionCard suggestion={suggestion} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StreakCard current={streak.current} longest={streak.longest} days={streak.days} />
        <QuoteCard quote={calendar.quote} />
        <div className="md:col-span-2 lg:col-span-1">
          <UpcomingCard
            holidays={calendar.upcoming}
            fastingDays={calendar.fastingDays}
            fastingLabel={scheme.label}
            fastingEnabled={scheme.days.length > 0}
          />
        </div>
      </div>

      <QuickLinks />

      <MindfulNote />
    </div>
  )
}
