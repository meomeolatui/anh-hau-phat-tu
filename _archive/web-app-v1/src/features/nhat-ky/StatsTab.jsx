import { useMemo, useState } from 'react'
import { BookOpen, CalendarCheck, CalendarDays, ChartPie, CircleDot, Flame, HandHeart, ListChecks, Timer } from 'lucide-react'
import Card, { CardTitle } from '../../components/ui/Card'
import Segmented from '../../components/ui/Segmented'
import Stat from '../../components/ui/Stat'
import { useStore } from '../../lib/store'
import { currentStreak, longestStreak } from '../../lib/stats'
import { formatNumber, formatShortDate, fromKey } from '../../lib/date'
import BarChart from './BarChart'
import CategoryBreakdown from './CategoryBreakdown'
import Heatmap from './Heatmap'
import Timeline from './Timeline'
import { buildBuckets, RANGES, summarize } from './journal'

const RANGE_TEXT = { '7d': '7 ngày', '30d': '30 ngày', '12m': '12 tháng' }

export default function StatsTab({ today, onOpenDay }) {
  const logs = useStore((s) => s.logs)
  const goals = useStore((s) => s.profile.goals)
  const [range, setRange] = useState('7d')

  const buckets = useMemo(() => buildBuckets(logs, range, today), [logs, range, today])
  const sum = useMemo(() => summarize(buckets), [buckets])
  const streak = useMemo(() => currentStreak(logs, today), [logs, today])
  const longest = useMemo(() => longestStreak(logs), [logs])
  const rangeText = RANGE_TEXT[range]

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented options={RANGES} value={range} onChange={setRange} aria-label="Khoảng thời gian thống kê" />
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Từ {formatShortDate(fromKey(sum.start), true)} đến {formatShortDate(fromKey(sum.end), true)}
        </p>
      </div>

      <section aria-label="Số liệu tổng hợp" className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat icon={CircleDot} label="Câu niệm Phật" value={formatNumber(sum.niem)} hint={`TB ${formatNumber(sum.avgNiem)} câu/ngày`} />
        <Stat icon={Timer} tone="saffron" label="Phút thiền" value={formatNumber(sum.thienMin)} hint={`TB ${formatNumber(sum.avgThienMin)} phút/ngày`} />
        <Stat icon={BookOpen} tone="stone" label="Thời kinh" value={formatNumber(sum.tung)} hint={`trong ${rangeText}`} />
        <Stat icon={HandHeart} tone="lotus" label="Việc lành" value={formatNumber(sum.thienHanh)} hint={`trong ${rangeText}`} />
        <Stat icon={CalendarCheck} label="Ngày có tu tập" value={`${sum.activeDays}/${sum.days}`} hint={`${Math.round((sum.activeDays / Math.max(1, sum.days)) * 100)}% số ngày`} />
        <Stat icon={Flame} tone="saffron" label="Chuỗi hiện tại" value={`${streak} ngày`} hint={`Dài nhất: ${longest} ngày`} />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <BarChart title="Niệm Phật" data={buckets} valueKey="niem" unit="câu" tone="jade" />
        </Card>
        <Card>
          <BarChart title="Thiền định" data={buckets} valueKey="thienMin" unit="phút" tone="saffron" />
        </Card>
      </div>

      <Card>
        <CardTitle icon={CalendarDays}>Lịch tu tập nửa năm</CardTitle>
        <Heatmap logs={logs} goals={goals} today={today} onOpenDay={onOpenDay} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardTitle icon={ChartPie}>Việc lành theo nhóm</CardTitle>
          <CategoryBreakdown logs={logs} start={sum.start} end={sum.end} rangeLabel={rangeText} />
        </Card>
        <Card className="lg:col-span-3">
          <CardTitle icon={ListChecks}>Những ngày đã ghi</CardTitle>
          <Timeline logs={logs} today={today} onOpenDay={onOpenDay} />
        </Card>
      </div>

      <p className="text-center text-xs text-stone-500 dark:text-stone-400">
        Con số chỉ để mình nhìn lại sự đều đặn — không phải thước đo công đức hay để so sánh với ai.
      </p>
    </div>
  )
}
