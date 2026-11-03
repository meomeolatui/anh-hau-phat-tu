import { useCallback, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, CircleDot, NotebookPen, ShieldCheck } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import LotusEmblem from '../home/LotusEmblem'
import { useStore } from '../../lib/store'
import { completeOnboarding } from '../../lib/actions'
import { cn } from '../../lib/cn'
import { formatNumber } from '../../lib/date'
import { GOAL_FIELDS, GOAL_PRESETS, goalsToDraft, validateGoals } from '../ca-nhan/goals'

const STEPS = [
  { label: 'Chào mừng', title: 'A Di Đà Phật, chào bạn', desc: 'Anh Hậu Phật Tử — người bạn đồng hành tu tập mỗi ngày.' },
  { label: 'Tên gọi', title: 'Mình nên gọi bạn là gì?', desc: 'Có thể bỏ trống, bạn đổi lại bất cứ lúc nào trong Hồ sơ.' },
  { label: 'Mục tiêu', title: 'Mục tiêu hằng ngày', desc: 'Chọn mức vừa sức. Đều đặn mỗi ngày quý hơn làm nhiều một lúc.' },
]

const FEATURES = [
  { icon: CircleDot, title: 'Niệm Phật, thiền, tụng kinh', desc: 'Tràng hạt, đồng hồ thiền và kinh văn ngay trong tay.' },
  { icon: CalendarDays, title: 'Lịch âm, ngày vía, ngày chay', desc: 'Nhắc những ngày nên về chùa và giữ trai giới.' },
  { icon: NotebookPen, title: 'Nhật ký thiện hạnh', desc: 'Ghi lại việc lành nhỏ mỗi ngày, nhìn lại để sống tốt hơn.' },
]

const DEFAULT_PRESET = 'deu-dan'

/**
 * Màn chào mừng lần đầu (3 bước). Được AppShell render ở mọi trang,
 * tự ẩn khi profile.onboarded = true.
 */
export default function OnboardingGate() {
  const onboarded = useStore((s) => s.profile.onboarded)
  if (onboarded) return null
  return <OnboardingWizard />
}

function OnboardingWizard() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [phapDanh, setPhapDanh] = useState('')
  const [preset, setPreset] = useState(DEFAULT_PRESET)
  const [custom, setCustom] = useState(() => goalsToDraft(GOAL_PRESETS.find((p) => p.id === DEFAULT_PRESET).goals))
  const [showErrors, setShowErrors] = useState(false)

  const customCheck = validateGoals(custom)
  const last = step === STEPS.length - 1

  // Bỏ qua: vẫn đánh dấu đã chào mừng, giữ mục tiêu mặc định để không làm phiền lần sau.
  // useCallback vì Modal chạy lại effect (và giật focus) mỗi khi onClose đổi tham chiếu.
  const skip = useCallback(() => completeOnboarding({}), [])

  const finish = () => {
    if (preset === 'custom' && !customCheck.goals) {
      setShowErrors(true)
      return
    }
    const goals = preset === 'custom' ? customCheck.goals : GOAL_PRESETS.find((p) => p.id === preset).goals
    completeOnboarding({ name, phapDanh, goals })
  }

  const next = () => (last ? finish() : setStep((s) => s + 1))

  const footer = (
    <div className="flex w-full flex-wrap items-center gap-2">
      <Button variant="ghost" onClick={skip}>
        Bỏ qua
      </Button>
      <div className="ml-auto flex gap-2">
        {step > 0 && (
          <Button variant="outline" size="lg" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Quay lại
          </Button>
        )}
        <Button size="lg" onClick={next}>
          {last ? 'Bắt đầu tu tập' : 'Tiếp tục'}
          {!last && <ArrowRight className="h-4 w-4" aria-hidden />}
        </Button>
      </div>
    </div>
  )

  return (
    <Modal
      open
      onClose={skip}
      size="lg"
      footer={footer}
      title={
        <>
          <span className="block text-xs font-semibold tracking-widest text-jade-600 uppercase dark:text-jade-400">
            Bước {step + 1}/{STEPS.length} · {STEPS[step].label}
          </span>
          <span className="mt-1 block font-serif text-2xl text-stone-900 dark:text-stone-50">{STEPS[step].title}</span>
        </>
      }
      description={STEPS[step].desc}
    >
      <StepIndicator step={step} />
      <div
        className="mt-6"
        onKeyDown={(e) => {
          // Enter trong ô nhập → sang bước tiếp, giống thói quen điền biểu mẫu
          if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return
          e.preventDefault()
          next()
        }}
      >
        {step === 0 && <WelcomeStep />}
        {step === 1 && <NameStep name={name} phapDanh={phapDanh} onName={setName} onPhapDanh={setPhapDanh} />}
        {step === 2 && (
          <GoalStep
            preset={preset}
            onPreset={setPreset}
            custom={custom}
            onCustom={setCustom}
            errors={showErrors ? customCheck.errors : {}}
          />
        )}
      </div>
    </Modal>
  )
}

function StepIndicator({ step }) {
  return (
    <ol className="flex gap-2" aria-label="Tiến trình">
      {STEPS.map(({ label }, i) => (
        <li key={label} className="flex-1" aria-current={i === step ? 'step' : undefined}>
          <span
            className={cn(
              'block h-1.5 rounded-full transition-colors',
              i <= step ? 'bg-jade-600 dark:bg-jade-400' : 'bg-stone-200 dark:bg-white/10',
            )}
          />
          <span className="sr-only">
            {label}
            {i < step ? ' (đã xong)' : ''}
          </span>
        </li>
      ))}
    </ol>
  )
}

function WelcomeStep() {
  return (
    <div>
      <div className="bg-lotus-pattern grid place-items-center rounded-3xl bg-jade-50 py-6 dark:bg-jade-950/50">
        <LotusEmblem className="h-20 w-20 animate-float" />
      </div>
      <ul className="mt-5 space-y-3">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <li key={title} className="flex items-start gap-3 rounded-2xl bg-stone-50 p-4 dark:bg-white/5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-jade-100 text-jade-700 dark:bg-jade-900/60 dark:text-jade-300">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block font-medium text-stone-900 dark:text-stone-100">{title}</span>
              <span className="block text-sm text-stone-600 dark:text-stone-400">{desc}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-5 flex items-start gap-2 text-sm text-stone-600 dark:text-stone-400">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-jade-600 dark:text-jade-400" aria-hidden />
        Không cần tài khoản. Mọi dữ liệu chỉ lưu trên thiết bị của bạn và dùng được cả khi không có mạng.
      </p>
    </div>
  )
}

function NameStep({ name, phapDanh, onName, onPhapDanh }) {
  return (
    <div>
      <div className="space-y-4">
        <TextField
          label="Tên gọi"
          placeholder="Ví dụ: Minh An"
          value={name}
          onChange={(e) => onName(e.target.value)}
          maxLength={40}
          autoComplete="given-name"
          autoFocus
          inputClassName="h-12 text-base"
        />
        <TextField
          label="Pháp danh (nếu có)"
          placeholder="Ví dụ: Diệu Hạnh"
          hint="Pháp danh do thầy truyền giới đặt khi quy y Tam Bảo."
          value={phapDanh}
          onChange={(e) => onPhapDanh(e.target.value)}
          maxLength={40}
          inputClassName="h-12 text-base"
        />
      </div>
    </div>
  )
}

function GoalStep({ preset, onPreset, custom, onCustom, errors }) {
  const options = [...GOAL_PRESETS, { id: 'custom', label: 'Tự đặt', desc: 'Chọn con số phù hợp với mình' }]
  return (
    <div>
      <div role="radiogroup" aria-label="Mức mục tiêu" className="grid gap-3 sm:grid-cols-2">
        {options.map((o) => {
          const active = preset === o.id
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onPreset(o.id)}
              className={cn(
                'rounded-2xl border-2 p-4 text-left transition',
                active
                  ? 'border-jade-600 bg-jade-50 dark:border-jade-400 dark:bg-jade-900/40'
                  : 'border-stone-200 hover:border-jade-300 dark:border-white/10 dark:hover:border-jade-700',
              )}
            >
              <span className="block font-semibold text-stone-900 dark:text-stone-100">{o.label}</span>
              <span className="block text-sm text-stone-600 dark:text-stone-400">{o.desc}</span>
              {o.goals && (
                <span className="mt-2 block text-sm font-medium text-jade-700 dark:text-jade-300">
                  {formatNumber(o.goals.niem)} câu · {o.goals.thienMin} phút · {o.goals.thienHanh} việc lành
                </span>
              )}
            </button>
          )
        })}
      </div>

      {preset === 'custom' && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {GOAL_FIELDS.map((f) => (
            <div key={f.key}>
              <TextField
                label={`${f.label} (${f.unit})`}
                inputMode="numeric"
                value={custom[f.key]}
                onChange={(e) => onCustom({ ...custom, [f.key]: e.target.value })}
                aria-invalid={Boolean(errors[f.key])}
                inputClassName="h-12 text-base"
              />
              {errors[f.key] && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
                  {errors[f.key]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
