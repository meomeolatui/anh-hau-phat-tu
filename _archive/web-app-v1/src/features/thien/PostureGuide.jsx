import { useState } from 'react'
import { Armchair, Info, Wind } from 'lucide-react'
import Card, { CardTitle } from '../../components/ui/Card'
import Segmented from '../../components/ui/Segmented'
import { BREATH_TIPS, HEALTH_NOTE, POSTURE_STEPS } from './content'

/** Minh hoạ tư thế ngồi: lưng thẳng, vai thả lỏng, tay đặt trong lòng, ngồi trên bồ đoàn. */
export function SittingFigure({ className }) {
  return (
    <svg viewBox="0 0 220 220" className={className} role="img" aria-label="Minh hoạ tư thế ngồi thiền trên bồ đoàn, lưng thẳng, tay đặt trong lòng">
      <circle cx="110" cy="96" r="86" className="fill-jade-50 dark:fill-jade-900/30" />
      {/* Đường gióng cột sống thẳng */}
      <line x1="110" y1="22" x2="110" y2="170" strokeDasharray="3 6" strokeWidth="1.5" className="stroke-jade-400/70" />
      {/* Bồ đoàn */}
      <ellipse cx="110" cy="182" rx="74" ry="16" className="fill-saffron-300 dark:fill-saffron-500/70" />
      <ellipse cx="110" cy="176" rx="74" ry="14" className="fill-saffron-200 dark:fill-saffron-400/70" />
      {/* Chân xếp */}
      <path d="M44 168c4-18 30-26 66-26s62 8 66 26c-14 6-38 8-66 8s-52-2-66-8Z" className="fill-jade-700 dark:fill-jade-600" />
      {/* Thân */}
      <path d="M84 80c8-6 44-6 52 0 8 6 12 30 12 52 0 10-4 16-12 18H84c-8-2-12-8-12-18 0-22 4-46 12-52Z" className="fill-jade-600 dark:fill-jade-500" />
      {/* Tay buông xuống lòng */}
      <path d="M80 86c-10 10-14 34-8 50 4 8 16 12 30 12" fill="none" strokeWidth="10" strokeLinecap="round" className="stroke-jade-700 dark:stroke-jade-600" />
      <path d="M140 86c10 10 14 34 8 50-4 8-16 12-30 12" fill="none" strokeWidth="10" strokeLinecap="round" className="stroke-jade-700 dark:stroke-jade-600" />
      {/* Hai bàn tay chồng nhau */}
      <ellipse cx="110" cy="148" rx="16" ry="7" className="fill-saffron-100 dark:fill-stone-300" />
      {/* Cổ & đầu */}
      <rect x="103" y="62" width="14" height="16" rx="6" className="fill-saffron-100 dark:fill-stone-300" />
      <circle cx="110" cy="46" r="20" className="fill-saffron-100 dark:fill-stone-300" />
      {/* Mắt khép hờ, môi mỉm nhẹ */}
      <path d="M100 47q4 3 8 0M112 47q4 3 8 0" fill="none" strokeWidth="1.6" strokeLinecap="round" className="stroke-stone-600" />
      <path d="M106 55q4 2.5 8 0" fill="none" strokeWidth="1.4" strokeLinecap="round" className="stroke-stone-500" />
      {/* Hơi thở nhẹ */}
      <path d="M140 40c8-2 14 2 18 0M142 50c8-2 12 2 16 0" fill="none" strokeWidth="1.5" strokeLinecap="round" className="stroke-jade-400" />
    </svg>
  )
}

function StepList({ items }) {
  return (
    <ol className="space-y-4">
      {items.map((s, i) => (
        <li key={s.title} className="flex gap-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-jade-100 text-sm font-semibold text-jade-800 dark:bg-jade-900/60 dark:text-jade-200">
            {i + 1}
          </span>
          <div>
            <p className="font-semibold text-stone-900 dark:text-stone-100">{s.title}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

const TABS = [
  { value: 'tu-the', label: 'Tư thế', icon: Armchair },
  { value: 'hoi-tho', label: 'Hơi thở', icon: Wind },
]

/** Hướng dẫn cho người mới: tư thế ngồi và cách thở. */
export default function PostureGuide() {
  const [tab, setTab] = useState('tu-the')
  return (
    <Card>
      <CardTitle icon={Info} action={<Segmented size="sm" aria-label="Chọn phần hướng dẫn" options={TABS} value={tab} onChange={setTab} />}>
        Cho người mới bắt đầu
      </CardTitle>
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,220px)_1fr]">
        <SittingFigure className="mx-auto h-auto w-48 md:w-full" />
        <div>
          {tab === 'tu-the' ? <StepList items={POSTURE_STEPS} /> : <StepList items={BREATH_TIPS} />}
          <p className="mt-5 rounded-2xl bg-stone-50 p-3 text-xs leading-relaxed text-stone-600 dark:bg-white/5 dark:text-stone-400">{HEALTH_NOTE}</p>
        </div>
      </div>
    </Card>
  )
}
