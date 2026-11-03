import { useId } from 'react'
import { cn } from '../../lib/cn'

const inputBase =
  'w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition focus:border-jade-500 focus:ring-2 focus:ring-jade-500/20 focus:outline-none dark:border-white/10 dark:bg-night-3 dark:text-stone-100'

/** Ô nhập có nhãn. Dùng `multiline` để thành textarea. */
export function TextField({ label, hint, multiline = false, className, inputClassName, id, ...props }) {
  const autoId = useId()
  const fieldId = id || autoId
  const Tag = multiline ? 'textarea' : 'input'
  return (
    <div className={className}>
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
          {label}
        </label>
      )}
      <Tag id={fieldId} className={cn(inputBase, multiline && 'min-h-24 resize-y', inputClassName)} {...props} />
      {hint && <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{hint}</p>}
    </div>
  )
}

export function SelectField({ label, hint, options, className, id, ...props }) {
  const autoId = useId()
  const fieldId = id || autoId
  return (
    <div className={className}>
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
          {label}
        </label>
      )}
      <select id={fieldId} className={inputBase} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{hint}</p>}
    </div>
  )
}

/** Công tắc bật/tắt có nhãn. */
export function Switch({ checked, onChange, label, description }) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-medium text-stone-800 dark:text-stone-200">{label}</span>
        {description && <span className="block text-xs text-stone-500 dark:text-stone-400">{description}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-jade-600' : 'bg-stone-300 dark:bg-white/15',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </div>
  )
}
