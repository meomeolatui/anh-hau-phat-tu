import { Salad } from 'lucide-react'
import Card, { CardTitle } from '../../components/ui/Card'
import { SelectField } from '../../components/ui/Field'
import { useToast } from '../../components/ui/toast-context'
import { FASTING_SCHEMES, getFastingScheme } from '../../data/holidays'
import { updateSettings } from '../../lib/actions'
import { fastingDaysText, lunarDayName } from './day-info'

const OPTIONS = FASTING_SCHEMES.map((s) => ({ value: s.id, label: s.label }))

/** Chọn lối ăn chay ngay tại trang lịch — dùng chung cài đặt với toàn ứng dụng. */
export default function FastingCard({ fasting }) {
  const toast = useToast()
  const scheme = getFastingScheme(fasting)

  const onChange = (e) => {
    const next = getFastingScheme(e.target.value)
    updateSettings({ fasting: next.id })
    toast({
      title: next.days.length ? `Đã chọn ${next.label.toLowerCase()}` : 'Đã tắt theo dõi ngày chay',
      description: next.days.length ? 'Lịch đã đánh dấu lại các ngày chay.' : undefined,
      tone: 'info',
    })
  }

  return (
    <Card>
      <CardTitle icon={Salad}>Lối ăn chay của bạn</CardTitle>
      <SelectField label="Theo dõi ngày chay" options={OPTIONS} value={scheme.id} onChange={onChange} />

      {scheme.days.length > 0 ? (
        <div className="mt-4 rounded-2xl bg-jade-50 p-4 dark:bg-jade-900/30">
          <p className="text-sm font-medium text-jade-900 dark:text-jade-100">Các ngày âm lịch mỗi tháng</p>
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Ngày chay trong tháng">
            {scheme.days.map((d) => (
              <li
                key={d}
                className="grid h-9 min-w-9 place-items-center rounded-full bg-white px-2 text-sm font-semibold text-jade-800 tabular-nums ring-1 ring-jade-200 dark:bg-jade-950 dark:text-jade-200 dark:ring-jade-800"
                title={d === 30 ? 'Ngày cuối tháng (tháng thiếu là ngày 29)' : lunarDayName(d)}
              >
                {d}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-jade-800/80 dark:text-jade-200/70">
            Gồm: {fastingDaysText(scheme.days)}.
            {scheme.days.includes(30) && ' Tháng thiếu chỉ có 29 ngày thì ngày 29 được tính là ngày cuối tháng.'}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">
          Bạn chưa theo dõi ngày chay. Có thể bắt đầu từ nhị trai (mùng 1 và rằm) rồi tăng dần khi thấy thân tâm nhẹ nhàng.
        </p>
      )}

      <p className="mt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        Ăn chay kỳ là giữ chay vào một số ngày cố định theo âm lịch. Điều quý không nằm ở số ngày, mà ở việc mỗi bữa chay nhắc
        mình nuôi lớn lòng từ và bớt làm tổn hại muôn loài.
      </p>
    </Card>
  )
}
