import { Sparkles } from 'lucide-react'

/** Phần thân bài: các mục nội dung. Cỡ chữ theo cài đặt đọc của người dùng. */
export function LessonSections({ sections, fontSize }) {
  return (
    <div className="space-y-4">
      {sections.map((section, i) => (
        <section
          key={section.heading}
          id={`phan-${i + 1}`}
          aria-labelledby={`phan-${i + 1}-title`}
          className="scroll-mt-24 rounded-3xl border border-stone-200/70 bg-white p-5 shadow-soft sm:p-7 lg:scroll-mt-8 dark:border-white/5 dark:bg-night-2"
        >
          <h2 id={`phan-${i + 1}-title`} className="flex items-baseline gap-3 font-serif text-xl font-semibold text-stone-900 outline-none sm:text-2xl dark:text-stone-50">
            <span className="text-base font-medium text-jade-600 tabular-nums dark:text-jade-400" aria-hidden>
              {String(i + 1).padStart(2, '0')}
            </span>
            {section.heading}
          </h2>
          <div className="mt-4 space-y-4 font-serif leading-[1.8] text-stone-800 dark:text-stone-200" style={{ fontSize }}>
            {section.paragraphs.map((p, j) => (
              <p key={j}>{p}</p>
            ))}
            {section.list?.length > 0 && (
              <ul className="space-y-2.5">
                {section.list.map((li, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="mt-[0.7em] h-2 w-2 shrink-0 rounded-full bg-lotus-400" aria-hidden />
                    <span>{li}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}

/** Khối "Điểm cốt lõi" — tóm tắt để ghi nhớ trước khi làm trắc nghiệm. */
export function KeyPoints({ points, id }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="relative scroll-mt-24 overflow-hidden rounded-3xl bg-gradient-to-br from-jade-700 via-jade-800 to-jade-950 p-6 text-white shadow-glow sm:p-8 lg:scroll-mt-8"
    >
      <div className="bg-lotus-pattern pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative">
        <h2 id={`${id}-title`} className="flex items-center gap-2 font-serif text-xl font-semibold outline-none sm:text-2xl">
          <Sparkles className="h-6 w-6 text-saffron-300" aria-hidden />
          Điểm cốt lõi
        </h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2">
          {points.map((p, i) => (
            <li key={i} className="flex gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-saffron-400 text-sm font-bold text-jade-950" aria-hidden>
                {i + 1}
              </span>
              <span className="leading-relaxed text-jade-50">{p}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
