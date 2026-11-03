import { Info } from 'lucide-react'
import { cn } from '../../lib/cn'

/** Lời nhắc khiêm cung: nội dung ở đây chỉ là bước đầu, không thay cho thầy và kinh sách. */
export default function StudyNote({ className }) {
  return (
    <aside
      className={cn(
        'flex gap-3 rounded-3xl border border-saffron-200 bg-saffron-50/70 p-4 text-sm leading-relaxed text-saffron-900 sm:p-5 dark:border-saffron-800/60 dark:bg-saffron-900/15 dark:text-saffron-100',
        className,
      )}
      aria-label="Lời nhắc"
    >
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-saffron-600 dark:text-saffron-300" aria-hidden />
      <p>
        Các bài học được biên soạn giản lược, chỉ mang tính <strong className="font-semibold">tham khảo nhập môn</strong>. Để hiểu sâu và đúng,
        xin hãy học hỏi thêm từ chư Tăng Ni và kinh sách chính thống, và quan trọng nhất là đem lời dạy vào đời sống hằng ngày.
      </p>
    </aside>
  )
}
