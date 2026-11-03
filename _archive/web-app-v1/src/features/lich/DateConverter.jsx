import { useId, useMemo, useState } from 'react'
import { ArrowLeftRight, CalendarSearch, Moon, Sun, TriangleAlert } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card, { CardTitle } from '../../components/ui/Card'
import { SelectField, TextField } from '../../components/ui/Field'
import Segmented from '../../components/ui/Segmented'
import { formatViDate, fromKey } from '../../lib/date'
import { canChiYear, LUNAR_MONTH_NAMES } from '../../lib/lunar'
import { holidaysOn } from '../../data/holidays'
import { lunarToSolarSafe, solarToLunarSafe } from './convert'
import { lunarLongLabel } from './day-info'
import { MAX_YEAR, MIN_YEAR } from './month-grid'

const MODES = [
  { value: 'solar', label: 'Dương → Âm', icon: Sun },
  { value: 'lunar', label: 'Âm → Dương', icon: Moon },
]

const DAY_OPTIONS = Array.from({ length: 30 }, (_, i) => ({ value: String(i + 1), label: `Ngày ${i + 1}` }))
const MONTH_OPTIONS = LUNAR_MONTH_NAMES.map((name, i) => ({ value: String(i + 1), label: `Tháng ${i + 1} (${name})` }))

function Result({ result, onShow, children }) {
  if (!result.ok) {
    return (
      <p className="flex items-start gap-2 rounded-2xl bg-saffron-50 p-3 text-sm text-saffron-900 dark:bg-saffron-500/10 dark:text-saffron-100">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {result.error}
      </p>
    )
  }
  const holidays = holidaysOn(result.lunar)
  return (
    <div className="rounded-2xl border border-jade-200 bg-gradient-to-br from-jade-50 to-white p-4 dark:border-jade-800 dark:from-jade-900/40 dark:to-transparent">
      {children}
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
        Ngày {result.lunar.dayName} · tháng {result.lunar.monthName}
      </p>
      {holidays.length > 0 && (
        <p className="mt-1 text-sm font-medium text-saffron-800 dark:text-saffron-200">
          {holidays.map((h) => h.name).join(' · ')}
        </p>
      )}
      <Button variant="secondary" size="sm" className="mt-3" onClick={() => onShow(result.date)}>
        <CalendarSearch className="h-4 w-4" aria-hidden />
        Xem trên lịch
      </Button>
    </div>
  )
}

/** Công cụ đổi ngày hai chiều — hữu ích khi tra ngày giỗ, ngày sinh âm lịch. */
export default function DateConverter({ today, onSelectDate }) {
  const leapId = useId()
  const [mode, setMode] = useState('solar')
  const [solar, setSolar] = useState(today)
  const todayYear = fromKey(today).getFullYear()
  const [lunar, setLunar] = useState({ day: '1', month: '1', year: String(todayYear), leap: false })

  const solarResult = useMemo(() => solarToLunarSafe(solar), [solar])
  const lunarResult = useMemo(
    () =>
      lunarToSolarSafe({
        day: Number(lunar.day),
        month: Number(lunar.month),
        year: lunar.year === '' ? Number.NaN : Number(lunar.year),
        leap: lunar.leap,
      }),
    [lunar],
  )

  const patchLunar = (patch) => setLunar((l) => ({ ...l, ...patch }))

  return (
    <Card>
      <CardTitle icon={ArrowLeftRight}>Đổi ngày âm – dương</CardTitle>
      <Segmented options={MODES} value={mode} onChange={setMode} aria-label="Chiều đổi ngày" className="mb-4" />

      {mode === 'solar' ? (
        <div className="space-y-4">
          <TextField
            label="Ngày dương lịch"
            type="date"
            value={solar}
            min={`${MIN_YEAR}-01-01`}
            max={`${MAX_YEAR}-12-31`}
            onChange={(e) => setSolar(e.target.value)}
          />
          <div aria-live="polite">
            <Result result={solarResult} onShow={onSelectDate}>
              <p className="text-xs font-medium tracking-wide text-jade-700 uppercase dark:text-jade-300">Âm lịch</p>
              {solarResult.ok && (
                <p className="mt-1 font-serif text-lg font-semibold text-stone-900 dark:text-stone-50">
                  {lunarLongLabel(solarResult.lunar)}
                </p>
              )}
            </Result>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Ngày âm"
              options={DAY_OPTIONS}
              value={lunar.day}
              onChange={(e) => patchLunar({ day: e.target.value })}
            />
            <SelectField
              label="Tháng âm"
              options={MONTH_OPTIONS}
              value={lunar.month}
              onChange={(e) => patchLunar({ month: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 items-start gap-3">
            <TextField
              label="Năm âm lịch"
              type="number"
              inputMode="numeric"
              min={MIN_YEAR}
              max={MAX_YEAR}
              value={lunar.year}
              hint={/^\d{4}$/.test(lunar.year) ? `Năm ${canChiYear(Number(lunar.year))}` : undefined}
              onChange={(e) => patchLunar({ year: e.target.value })}
            />
            <label
              htmlFor={leapId}
              className="mt-7 flex h-[42px] cursor-pointer items-center gap-2.5 text-sm text-stone-700 dark:text-stone-300"
            >
              <input
                id={leapId}
                type="checkbox"
                checked={lunar.leap}
                onChange={(e) => patchLunar({ leap: e.target.checked })}
                className="h-5 w-5 rounded accent-jade-600"
              />
              Tháng nhuận
            </label>
          </div>
          <div aria-live="polite">
            <Result result={lunarResult} onShow={onSelectDate}>
              <p className="text-xs font-medium tracking-wide text-jade-700 uppercase dark:text-jade-300">Dương lịch</p>
              {lunarResult.ok && (
                <p className="mt-1 font-serif text-lg font-semibold text-stone-900 dark:text-stone-50">
                  {formatViDate(lunarResult.date)}
                </p>
              )}
            </Result>
          </div>
        </div>
      )}
    </Card>
  )
}
