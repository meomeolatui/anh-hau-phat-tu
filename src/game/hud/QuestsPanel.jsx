import { useEffect } from 'react'
import { Check, Gift } from 'lucide-react'
import Sheet from './Sheet'
import { LEVELS, levelFor, QUESTS } from '../progression'
import { claimQuest, ensureDaily, useGame } from '../state'
import { STELES } from '../world/steles'
import { ZONES } from '../world/layout'
import { cn } from '../../lib/cn'

const STAT_LABELS = [
  ['niem', 'Câu niệm Phật'],
  ['huong', 'Lần thắp hương'],
  ['la', 'Lá đã quét'],
  ['lay', 'Lạy Phật'],
  ['chuong', 'Hồi chuông'],
  ['thienPhut', 'Phút thiền'],
  ['kinh', 'Thời kinh'],
  ['hoaDang', 'Đèn hoa đăng'],
]

export default function QuestsPanel() {
  const daily = useGame((s) => s.save.daily)
  const stats = useGame((s) => s.save.stats)
  const merit = useGame((s) => s.save.merit)
  const discovered = useGame((s) => s.save.discovered)
  useEffect(() => ensureDaily(), [])
  const lv = levelFor(merit)

  return (
    <Sheet title="Hành trình hôm nay" subtitle="Nhiệm vụ đổi mới mỗi ngày. Công đức ở đây chỉ là điểm trò chơi — việc lành thật nằm ngoài màn hình.">
      <ul className="space-y-2">
        {daily.list.map((q) => {
          const def = QUESTS[q.id]
          if (!def) return null
          const done = q.progress >= def.target
          return (
            <li key={q.id} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3.5">
              <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', q.claimed ? 'bg-jade-600 text-white' : done ? 'bg-saffron-100 text-saffron-700' : 'bg-stone-100 text-stone-400')}>
                {q.claimed ? <Check className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-medium', q.claimed && 'text-stone-400 line-through')}>{def.title}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200">
                    <div className="h-full rounded-full bg-jade-500 transition-all" style={{ width: `${(Math.min(q.progress, def.target) / def.target) * 100}%` }} />
                  </div>
                  <span className="text-xs tabular-nums text-stone-500">
                    {Math.min(q.progress, def.target)}/{def.target}
                  </span>
                </div>
              </div>
              {done && !q.claimed ? (
                <button type="button" onClick={() => claimQuest(q.id)} className="rounded-xl bg-saffron-500 px-3 py-2 text-xs font-semibold text-white hover:bg-saffron-600">
                  Nhận +{def.reward}
                </button>
              ) : (
                <span className="text-xs text-stone-400">+{def.reward}</span>
              )}
            </li>
          )
        })}
      </ul>

      <h3 className="mt-7 mb-3 text-sm font-semibold tracking-wide text-stone-500 uppercase">Cấp tu học</h3>
      <div className="rounded-2xl bg-white p-4">
        <div className="flex items-baseline justify-between">
          <p className="font-serif text-lg font-semibold text-jade-900">
            {lv.index + 1}. {lv.title}
          </p>
          <p className="text-xs text-stone-500">{lv.next ? `còn ${(lv.next - merit).toLocaleString('vi-VN')} để lên ${LEVELS[lv.index + 1].title}` : 'Cấp cao nhất'}</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
          <div className="h-full rounded-full bg-gradient-to-r from-saffron-300 to-saffron-500" style={{ width: `${lv.progress * 100}%` }} />
        </div>
      </div>

      <h3 className="mt-7 mb-3 text-sm font-semibold tracking-wide text-stone-500 uppercase">Sổ tu tập</h3>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STAT_LABELS.map(([k, label]) => (
          <div key={k} className="rounded-2xl bg-white p-3">
            <dt className="text-[11px] text-stone-500">{label}</dt>
            <dd className="text-lg font-semibold tabular-nums">{(stats[k] ?? 0).toLocaleString('vi-VN')}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-stone-600">
        Đã đến {discovered.zones.length}/{Object.keys(ZONES).length} khu vực · Sưu tầm {discovered.steles.length}/{STELES.length} bia pháp ngữ
      </p>
    </Sheet>
  )
}
