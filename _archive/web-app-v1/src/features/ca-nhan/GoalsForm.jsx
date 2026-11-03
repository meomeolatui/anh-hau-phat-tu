import { useState } from 'react'
import { Target } from 'lucide-react'
import Button from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import { useToast } from '../../components/ui/toast-context'
import { updateGoals } from '../../lib/actions'
import { cn } from '../../lib/cn'
import { GOAL_FIELDS, GOAL_PRESETS, goalsToDraft, matchPreset, validateGoals } from './goals'
import Section from './Section'

/** Mục tiêu hằng ngày, kiểm tra hợp lệ trước khi lưu. */
export default function GoalsForm({ goals }) {
  const toast = useToast()
  const [draft, setDraft] = useState(() => goalsToDraft(goals))
  const [touched, setTouched] = useState({})
  const { goals: parsed, errors } = validateGoals(draft)
  const current = goalsToDraft(goals)
  const dirty = GOAL_FIELDS.some(({ key }) => draft[key] !== current[key])
  const activePreset = parsed ? matchPreset(parsed) : 'custom'

  const save = (e) => {
    e.preventDefault()
    if (!parsed) {
      setTouched(Object.fromEntries(GOAL_FIELDS.map(({ key }) => [key, true])))
      return
    }
    updateGoals(parsed)
    setDraft(goalsToDraft(parsed))
    toast({ title: 'Đã cập nhật mục tiêu', description: 'Trang Hôm nay sẽ tính theo mục tiêu mới.' })
  }

  return (
    <Section id="muc-tieu" icon={Target} title="Mục tiêu hằng ngày" description="Đặt vừa sức để giữ được lâu dài.">
      <form onSubmit={save} noValidate>
        <div role="radiogroup" aria-label="Mức gợi ý" className="grid grid-cols-3 gap-2">
          {GOAL_PRESETS.map((p) => {
            const active = activePreset === p.id
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setDraft(goalsToDraft(p.goals))
                  setTouched({})
                }}
                className={cn(
                  'rounded-2xl border-2 px-2 py-3 text-center transition',
                  active
                    ? 'border-jade-600 bg-jade-50 dark:border-jade-400 dark:bg-jade-900/40'
                    : 'border-stone-200 hover:border-jade-300 dark:border-white/10 dark:hover:border-jade-700',
                )}
              >
                <span className="block text-sm font-semibold text-stone-900 dark:text-stone-100">{p.label}</span>
                <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">
                  {p.goals.niem.toLocaleString('vi-VN')} câu · {p.goals.thienMin} phút
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-5 space-y-4">
          {GOAL_FIELDS.map((f) => {
            const err = touched[f.key] ? errors[f.key] : null
            return (
              <div key={f.key}>
                <div className="flex items-end gap-3">
                  <TextField
                    className="flex-1"
                    label={f.label}
                    inputMode="numeric"
                    value={draft[f.key]}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    onBlur={() => setTouched((t) => ({ ...t, [f.key]: true }))}
                    aria-invalid={Boolean(err)}
                    inputClassName="h-11 text-base tabular-nums"
                  />
                  <span className="w-12 pb-3 text-sm text-stone-500 dark:text-stone-400">{f.unit}</span>
                </div>
                {err && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
                    {err}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {activePreset === 'custom' ? 'Mục tiêu tự đặt' : `Đang chọn mức ${GOAL_PRESETS.find((p) => p.id === activePreset).label}`}
          </p>
          <Button type="submit" disabled={!dirty}>
            Lưu mục tiêu
          </Button>
        </div>
      </form>
    </Section>
  )
}
