import { useState } from 'react'
import { UserRound } from 'lucide-react'
import Button from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import { useToast } from '../../components/ui/toast-context'
import { updateProfile } from '../../lib/actions'
import { cn } from '../../lib/cn'
import { formatViDate } from '../../lib/date'
import Section from './Section'

const MANTRAS = [
  'Nam mô A Di Đà Phật',
  'Nam mô Bổn Sư Thích Ca Mâu Ni Phật',
  'Nam mô Đại Bi Quán Thế Âm Bồ Tát',
  'Nam mô Dược Sư Lưu Ly Quang Vương Phật',
]

/** Sửa tên gọi, pháp danh, câu niệm mặc định. */
export default function ProfileForm({ profile }) {
  const toast = useToast()
  const [name, setName] = useState(profile.name)
  const [phapDanh, setPhapDanh] = useState(profile.phapDanh)
  const [mantra, setMantra] = useState(profile.mantra)

  const mantraError = mantra.trim() ? null : 'Câu niệm không được để trống.'
  const dirty = name !== profile.name || phapDanh !== profile.phapDanh || mantra !== profile.mantra

  const save = (e) => {
    e.preventDefault()
    if (mantraError) return
    updateProfile({ name: name.trim(), phapDanh: phapDanh.trim(), mantra: mantra.trim() })
    setName(name.trim())
    setPhapDanh(phapDanh.trim())
    setMantra(mantra.trim())
    toast({ title: 'Đã lưu hồ sơ' })
  }

  return (
    <Section id="ho-so" icon={UserRound} title="Hồ sơ" description="Thông tin này chỉ dùng để chào hỏi và hiển thị trên máy bạn.">
      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Tên gọi" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="given-name" />
          <TextField label="Pháp danh" value={phapDanh} onChange={(e) => setPhapDanh(e.target.value)} maxLength={40} placeholder="Nếu đã quy y" />
        </div>
        <div>
          <TextField
            label="Câu niệm mặc định"
            hint="Hiện trên tràng hạt ở trang Niệm Phật."
            value={mantra}
            onChange={(e) => setMantra(e.target.value)}
            maxLength={80}
            aria-invalid={Boolean(mantraError)}
          />
          {mantraError && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
              {mantraError}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2" aria-label="Câu niệm gợi ý">
            {MANTRAS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMantra(m)}
                aria-pressed={mantra === m}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                  mantra === m
                    ? 'border-jade-500 bg-jade-50 text-jade-800 dark:border-jade-600 dark:bg-jade-900/40 dark:text-jade-100'
                    : 'border-stone-200 text-stone-600 hover:border-jade-300 dark:border-white/10 dark:text-stone-300',
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Ngày bắt đầu đồng hành:{' '}
          <span className="font-medium text-stone-800 dark:text-stone-200">
            {profile.createdAt ? formatViDate(new Date(profile.createdAt)) : 'chưa ghi nhận'}
          </span>
        </p>
        <div className="flex justify-end">
          <Button type="submit" disabled={!dirty || Boolean(mantraError)}>
            Lưu hồ sơ
          </Button>
        </div>
      </form>
    </Section>
  )
}
