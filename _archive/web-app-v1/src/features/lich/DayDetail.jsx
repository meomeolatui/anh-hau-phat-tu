import { BookOpen, CircleDot, HeartHandshake, Leaf, NotebookPen, Sparkles, Timer } from 'lucide-react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { getDay } from '../../lib/actions'
import { diffDays, formatNumber, WEEKDAYS_VI } from '../../lib/date'
import { getFastingScheme } from '../../data/holidays'
import { cn } from '../../lib/cn'
import { lunarLongLabel, relativeDayLabel } from './day-info'
import MoonPhase from './MoonPhase'

const MOODS = ['', 'Nặng nề', 'Chưa yên', 'Bình thường', 'An ổn', 'An lạc']

function CanChi({ label, value }) {
  return (
    <div className="rounded-2xl bg-stone-50 px-3 py-2.5 text-center dark:bg-white/5">
      <p className="text-[11px] font-medium tracking-wide text-stone-500 uppercase dark:text-stone-400">{label}</p>
      <p className="mt-0.5 font-serif text-sm font-semibold text-stone-900 dark:text-stone-100">{value}</p>
    </div>
  )
}

function ActivityRow({ icon: Icon, label, value }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
        <Icon className="h-4 w-4 text-jade-600 dark:text-jade-400" aria-hidden />
        {label}
      </span>
      <span className="text-sm font-semibold text-stone-900 tabular-nums dark:text-stone-100">{value}</span>
    </li>
  )
}

function Practice({ day, offset }) {
  const deeds = day.thienHanh ?? []
  const hasNumbers = day.niem > 0 || day.thienMin > 0 || day.tung > 0
  const empty = !hasNumbers && !deeds.length && !day.note

  if (offset > 0) {
    return (
      <p className="text-sm text-stone-500 dark:text-stone-400">
        Ngày này chưa tới. Mỗi ngày đến đều là một cơ hội mới để sống tỉnh thức.
      </p>
    )
  }

  if (empty) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-500 dark:border-white/10 dark:text-stone-400">
        {offset === 0 ? (
          <>
            <p>Hôm nay chưa có ghi nhận nào. Bắt đầu nhẹ nhàng với vài phút niệm Phật hay một việc lành nhỏ.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button to="/niem-phat" size="sm" variant="secondary">
                <CircleDot className="h-4 w-4" aria-hidden />
                Niệm Phật
              </Button>
              <Button to="/nhat-ky" size="sm" variant="outline">
                <NotebookPen className="h-4 w-4" aria-hidden />
                Ghi thiện hạnh
              </Button>
            </div>
          </>
        ) : (
          <p>Không có ghi nhận tu tập trong ngày này.</p>
        )}
      </div>
    )
  }

  return (
    <div>
      {hasNumbers && (
        <ul className="divide-y divide-stone-100 dark:divide-white/5">
          {day.niem > 0 && <ActivityRow icon={CircleDot} label="Niệm Phật" value={`${formatNumber(day.niem)} câu`} />}
          {day.thienMin > 0 && <ActivityRow icon={Timer} label="Ngồi thiền" value={`${formatNumber(day.thienMin)} phút`} />}
          {day.tung > 0 && <ActivityRow icon={BookOpen} label="Tụng kinh" value={`${day.tung} thời`} />}
        </ul>
      )}
      {deeds.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
            <HeartHandshake className="h-4 w-4 text-lotus-600 dark:text-lotus-400" aria-hidden />
            {deeds.length} việc lành
          </p>
          <ul className="space-y-1.5">
            {deeds.slice(0, 5).map((d) => (
              <li
                key={d.id}
                className="rounded-xl bg-lotus-50/70 px-3 py-2 text-sm text-stone-700 dark:bg-lotus-500/10 dark:text-stone-200"
              >
                {d.text}
              </li>
            ))}
          </ul>
          {deeds.length > 5 && <p className="mt-1.5 text-xs text-stone-500">và {deeds.length - 5} việc khác…</p>}
        </div>
      )}
      {(day.note || day.mood) && (
        <div className="mt-3 rounded-2xl bg-stone-50 p-3 text-sm dark:bg-white/5">
          {day.mood ? (
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400">Tâm trạng: {MOODS[day.mood]}</p>
          ) : null}
          {day.note && <p className="mt-1 line-clamp-4 whitespace-pre-line text-stone-700 dark:text-stone-200">{day.note}</p>}
        </div>
      )}
    </div>
  )
}

/** Bảng thông tin đầy đủ của ngày đang chọn. */
export default function DayDetail({ info, today, logs, fasting }) {
  const { date, lunar } = info
  const offset = diffDays(today, info.key)
  const scheme = getFastingScheme(fasting)
  const day = getDay(logs, info.key)

  return (
    <Card className="animate-fade-up" key={info.key}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Badge tone={offset === 0 ? 'jade' : 'stone'}>{relativeDayLabel(offset)}</Badge>
          <p className="mt-3 text-sm font-medium text-stone-500 dark:text-stone-400">{WEEKDAYS_VI[date.getDay()]}</p>
          <h2 className="font-serif text-2xl font-semibold text-stone-900 sm:text-3xl dark:text-stone-50">
            {date.getDate()} tháng {date.getMonth() + 1}, {date.getFullYear()}
          </h2>
          <p className="mt-1 text-base text-jade-800 dark:text-jade-300">{lunarLongLabel(lunar)}</p>
        </div>
        <MoonPhase lunarDay={lunar.day} className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <CanChi label="Ngày" value={lunar.dayName} />
        <CanChi label="Tháng" value={lunar.monthName} />
        <CanChi label="Năm" value={lunar.yearName} />
      </div>

      {(info.soc || info.vong || lunar.leap) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {info.soc && <Badge tone="lotus">Ngày Sóc — mùng 1</Badge>}
          {info.vong && <Badge tone="lotus">Ngày Vọng — rằm</Badge>}
          {lunar.leap && <Badge tone="stone">Tháng nhuận</Badge>}
        </div>
      )}

      {info.holidays.length > 0 && (
        <ul className="mt-4 space-y-2">
          {info.holidays.map((h) => (
            <li
              key={h.id}
              className="rounded-2xl border border-saffron-200 bg-gradient-to-br from-saffron-50 to-white p-4 dark:border-saffron-500/25 dark:from-saffron-500/10 dark:to-transparent"
            >
              <p className="flex items-center gap-2 font-semibold text-saffron-900 dark:text-saffron-100">
                <Sparkles className="h-4 w-4 shrink-0 text-saffron-600 dark:text-saffron-300" aria-hidden />
                {h.name}
              </p>
              <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">{h.desc}</p>
            </li>
          ))}
        </ul>
      )}

      <div
        className={cn(
          'mt-4 flex items-start gap-3 rounded-2xl p-3 text-sm',
          info.fasting
            ? 'bg-jade-50 text-jade-900 dark:bg-jade-900/40 dark:text-jade-100'
            : 'bg-stone-50 text-stone-600 dark:bg-white/5 dark:text-stone-400',
        )}
      >
        <Leaf
          className={cn('mt-0.5 h-4 w-4 shrink-0', info.fasting ? 'text-jade-600 dark:text-jade-300' : 'text-stone-400')}
          aria-hidden
        />
        <p>
          {scheme.days.length === 0
            ? 'Bạn chưa chọn lối ăn chay để theo dõi.'
            : info.fasting
              ? `Ngày chay theo lối ${scheme.label.toLowerCase()}.`
              : `Không phải ngày chay theo lối ${scheme.label.toLowerCase()}.`}
        </p>
      </div>

      <div className="mt-5 border-t border-stone-200/70 pt-4 dark:border-white/5">
        <h3 className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-100">Tu tập trong ngày</h3>
        <Practice day={day} offset={offset} />
      </div>
    </Card>
  )
}
