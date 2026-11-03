import { Info, Leaf, MoonStar, Sparkles } from 'lucide-react'
import { FASTING_SCHEMES } from '../../data/holidays'
import { fastingDaysText } from './day-info'

const SCHEMES = FASTING_SCHEMES.filter((s) => s.days.length)

function GuideCard({ icon: Icon, title, tone, children }) {
  const tones = {
    lotus: 'bg-lotus-50 text-lotus-700 dark:bg-lotus-500/15 dark:text-lotus-300',
    jade: 'bg-jade-50 text-jade-700 dark:bg-jade-900/40 dark:text-jade-300',
    saffron: 'bg-saffron-50 text-saffron-700 dark:bg-saffron-500/15 dark:text-saffron-300',
    stone: 'bg-stone-100 text-stone-700 dark:bg-white/5 dark:text-stone-300',
  }
  return (
    <article className="rounded-3xl border border-stone-200/70 bg-white/70 p-5 dark:border-white/5 dark:bg-night-2/70">
      <div className={`mb-3 grid h-10 w-10 place-items-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-50">{title}</h3>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{children}</div>
    </article>
  )
}

/** Giải thích ngắn gọn các khái niệm trên lịch, viết cho cả người mới. */
export default function LichGuide() {
  return (
    <section aria-labelledby="lich-guide-title" className="mt-10">
      <h2 id="lich-guide-title" className="mb-4 font-serif text-xl font-semibold text-stone-900 sm:text-2xl dark:text-stone-50">
        Hiểu lịch âm trong đời sống tu tập
      </h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <GuideCard icon={MoonStar} title="Sóc và Vọng" tone="lotus">
          <p>
            <strong className="text-stone-800 dark:text-stone-200">Sóc</strong> là ngày mùng 1, khi trăng non bắt đầu chu kỳ mới.{' '}
            <strong className="text-stone-800 dark:text-stone-200">Vọng</strong> là ngày rằm 15, khi trăng tròn đầy.
          </p>
          <p>
            Phật tử Việt thường chọn hai ngày này để đi chùa, lễ Phật, tụng kinh, ăn chay và soi xét lại nửa tháng đã qua — như
            một nhịp dừng lại để bắt đầu mới.
          </p>
        </GuideCard>

        <GuideCard icon={Leaf} title="Các lối ăn chay kỳ" tone="jade">
          <ul className="space-y-1.5">
            {SCHEMES.map((s) => (
              <li key={s.id}>
                <strong className="text-stone-800 dark:text-stone-200">{s.label.split(' (')[0]}:</strong>{' '}
                {fastingDaysText(s.days)}.
              </li>
            ))}
          </ul>
          <p>Hãy chọn lối vừa sức, giữ đều đặn quan trọng hơn giữ nhiều.</p>
        </GuideCard>

        <GuideCard icon={Sparkles} title="Ngày lễ và ngày vía" tone="saffron">
          <p>
            Ngày vía là ngày tưởng niệm chư Phật, Bồ Tát; ngày lễ lớn như Phật Đản, Vu Lan gắn với cuộc đời đức Phật và đạo hiếu.
            Lịch ghi theo truyền thống Phật giáo Bắc tông tại Việt Nam.
          </p>
          <p>Vía rơi vào ngày 30 mà tháng chỉ có 29 ngày thì được tính vào ngày cuối tháng.</p>
        </GuideCard>

        <GuideCard icon={Info} title="Tháng nhuận, tháng thiếu" tone="stone">
          <p>
            Tháng âm có 29 (tháng thiếu) hoặc 30 ngày (tháng đủ). Khoảng hai, ba năm có một tháng nhuận để âm lịch khớp với mùa;
            ngày vía chỉ tính theo tháng chính, không lặp lại ở tháng nhuận.
          </p>
          <p>
            Lịch được tính theo giờ Việt Nam (GMT+7) nên đôi khi lệch một ngày so với lịch âm của nước khác. Mọi tính toán diễn ra
            ngay trên máy, không cần mạng.
          </p>
        </GuideCard>
      </div>
    </section>
  )
}
