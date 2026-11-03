import { Link } from 'react-router-dom'
import { ArrowUpRight, Info, Lightbulb } from 'lucide-react'

/** Phần "Lược giải": nghĩa do ứng dụng tự diễn đạt + ghi chú nguồn/bản kinh + các bài được dẫn chiếu. */
export default function MeaningPanel({ sutra, refs, fontSize }) {
  const hasMeaning = sutra.meaning?.length > 0
  return (
    <div className="mx-auto max-w-[42rem]">
      {hasMeaning ? (
        <>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-saffron-50 px-3 py-1 text-xs font-semibold text-saffron-800 dark:bg-saffron-900/30 dark:text-saffron-200">
            <Lightbulb className="h-3.5 w-3.5" aria-hidden />
            Lược giải — diễn ý cho dễ hiểu, không phải bản dịch từng chữ
          </p>
          <div className="space-y-5 font-serif leading-[1.9] text-stone-800 dark:text-stone-200" style={{ fontSize: Math.max(16, fontSize - 2) }}>
            {sutra.meaning.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </>
      ) : (
        <p className="text-stone-600 dark:text-stone-400">Bài này chưa có phần lược giải riêng.</p>
      )}

      {refs.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-100">Các bài trong nghi thức</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {refs.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/kinh/${r.id}`}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-800 transition hover:border-jade-300 hover:text-jade-800 dark:border-white/10 dark:text-stone-200 dark:hover:border-jade-700 dark:hover:text-jade-200"
                >
                  {r.title}
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sutra.notes?.length > 0 && (
        <div className="mt-8 rounded-3xl border border-stone-200/70 bg-paper-2/60 p-5 dark:border-white/5 dark:bg-white/[0.03]">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
            <Info className="h-4 w-4 text-jade-600 dark:text-jade-400" aria-hidden />
            Ghi chú về bản văn
          </h3>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            {sutra.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
