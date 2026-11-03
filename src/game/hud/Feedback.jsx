import { useEffect, useRef, useState } from 'react'
import { Award, CircleCheck, Sparkles } from 'lucide-react'
import { on } from '../runtime'
import { useGame } from '../state'

/**
 * Phản hồi tức thời: chữ "+N công đức" nổi lên, thông báo nhỏ, biểu ngữ khi vào khu vực mới.
 */
export default function Feedback() {
  const [floats, setFloats] = useState([])
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)
  // Biểu ngữ tên khu vực: key theo zone → mỗi lần đổi khu vực, hoạt ảnh hiện–ẩn chạy lại
  const banner = useGame((s) => s.ui.zone)

  useEffect(() => {
    const push = (setter, item, ms) => {
      const id = ++counter.current
      setter((xs) => [...xs.slice(-3), { ...item, id }])
      setTimeout(() => setter((xs) => xs.filter((x) => x.id !== id)), ms)
    }
    const offs = [
      on('merit', ({ amount, label }) => push(setFloats, { amount, label, kind: 'merit' }, 2200)),
      on('xu', ({ amount, label }) => push(setFloats, { amount, label, kind: 'xu' }, 2200)),
      on('toast', (t) => push(setToasts, { icon: 'info', ...t }, 3200)),
      on('quest-done', (q) => push(setToasts, { icon: 'quest', title: 'Nhiệm vụ đã xong', description: `${q.title} — mở bảng nhiệm vụ (Q) để nhận thưởng.` }, 4200)),
      on('levelup', (lv) => push(setToasts, { icon: 'level', title: `Cấp mới: ${lv.title}`, description: 'Hành trình tu học thêm một bước. Hãy giữ tâm hoan hỷ!' }, 5000)),
    ]
    return () => offs.forEach((off) => off())
  }, [])

  return (
    <>
      {banner && (
        <div key={banner.id} className="pointer-events-none absolute inset-x-0 top-[18%] z-20 flex animate-[zone-banner_3.6s_ease-out_forwards] justify-center text-center opacity-0" role="status">
          <div>
            <p className="font-serif text-3xl font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-4xl">{banner.name}</p>
            {banner.subtitle && <p className="mt-1 text-sm tracking-widest text-white/90 uppercase drop-shadow">{banner.subtitle}</p>}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-24 z-20 flex flex-col items-center gap-1" aria-live="polite">
        {floats.map((f) => (
          <div
            key={f.id}
            className={`animate-[float-up_2.2s_ease-out_forwards] rounded-full px-3 py-1 text-sm font-semibold text-white shadow-lg ${f.kind === 'xu' ? 'bg-jade-600/90' : 'bg-saffron-500/90'}`}
          >
            +{f.amount} {f.kind === 'xu' ? 'xu' : 'công đức'}
            {f.label ? ` · ${f.label}` : ''}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-48 z-30 flex flex-col items-center gap-2 px-3 sm:bottom-32" aria-live="polite">
        {toasts.map((t) => {
          const Icon = t.icon === 'level' ? Award : t.icon === 'quest' ? CircleCheck : Sparkles
          return (
            <div key={t.id} role="status" className="flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-2xl bg-stone-900/80 p-3.5 text-white shadow-xl backdrop-blur">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-saffron-300" aria-hidden />
              <div>
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description && <p className="text-xs text-white/80">{t.description}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
