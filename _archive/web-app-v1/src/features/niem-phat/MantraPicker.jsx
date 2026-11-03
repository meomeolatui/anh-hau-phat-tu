import { useState } from 'react'
import { Check } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import { cn } from '../../lib/cn'
import { MANTRAS, MAX_MANTRA_LENGTH, cleanMantra, findMantra } from './mantras'

/** Hộp thoại chọn câu niệm: danh sách có sẵn hoặc tự nhập. */
export default function MantraPicker({ open, onClose, value, onChange }) {
  return (
    <Modal open={open} onClose={onClose} title="Chọn câu niệm" description="Lựa chọn được ghi nhớ cho những lần niệm sau." size="md">
      {/* Mount lại nội dung mỗi lần mở để ô tự nhập luôn bắt đầu từ giá trị hiện tại */}
      {open && <PickerBody value={value} onChange={onChange} onClose={onClose} />}
    </Modal>
  )
}

function PickerBody({ value, onChange, onClose }) {
  const preset = findMantra(value)
  const [custom, setCustom] = useState(preset ? '' : value)
  const cleanCustom = cleanMantra(custom)

  const choose = (text) => {
    onChange(text)
    onClose()
  }

  const submitCustom = (e) => {
    e.preventDefault()
    if (cleanCustom) choose(cleanCustom)
  }

  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label="Câu niệm có sẵn" className="space-y-2">
        {MANTRAS.map((m) => {
          const active = preset?.id === m.id
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(m.text)}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition',
                active
                  ? 'border-jade-400 bg-jade-50 dark:border-jade-600 dark:bg-jade-900/40'
                  : 'border-stone-200 hover:border-jade-300 hover:bg-stone-50 dark:border-white/10 dark:hover:bg-white/5',
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-serif text-base text-stone-900 dark:text-stone-50">{m.text}</span>
                <span className="block text-xs text-stone-500 dark:text-stone-400">{m.note}</span>
              </span>
              <span
                className={cn(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full border',
                  active ? 'border-jade-600 bg-jade-600 text-white' : 'border-stone-300 dark:border-white/20',
                )}
                aria-hidden
              >
                {active && <Check className="h-4 w-4" />}
              </span>
            </button>
          )
        })}
      </div>

      <form onSubmit={submitCustom} className="rounded-2xl bg-paper-2 p-4 dark:bg-night-3">
        <TextField
          label="Hoặc tự nhập câu niệm"
          placeholder="Ví dụ: Nam mô Đại Thế Chí Bồ Tát"
          value={custom}
          maxLength={MAX_MANTRA_LENGTH}
          onChange={(e) => setCustom(e.target.value)}
          hint={`${cleanCustom.length}/${MAX_MANTRA_LENGTH} ký tự`}
        />
        <Button type="submit" className="mt-3 w-full sm:w-auto" disabled={!cleanCustom}>
          Dùng câu này
        </Button>
      </form>
    </div>
  )
}
