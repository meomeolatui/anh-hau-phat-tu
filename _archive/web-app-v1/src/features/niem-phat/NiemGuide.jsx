import { Lightbulb } from 'lucide-react'
import Card, { CardTitle } from '../../components/ui/Card'

const STEPS = [
  {
    title: 'Niệm rõ ràng',
    text: 'Từng chữ phân minh, không vội. Niệm ra tiếng, niệm nhỏ hay niệm thầm đều được — miễn trong tâm thấy rõ từng chữ.',
  },
  {
    title: 'Nghe rõ',
    text: 'Tai lắng nghe lại câu niệm của chính mình. Khi đang nghe rõ, vọng tưởng khó chen vào.',
  },
  {
    title: 'Nhiếp tâm',
    text: 'Tâm chạy đi là chuyện thường. Nhận ra, rồi nhẹ nhàng đưa về câu niệm, không trách mình.',
  },
  {
    title: 'Đều đặn hơn nhiều',
    text: 'Mười phút mỗi ngày bền bỉ quý hơn một buổi thật dài rồi bỏ. Chọn một giờ cố định để thành nếp.',
  },
]

/** Hướng dẫn ngắn cách niệm Phật. */
export default function NiemGuide() {
  return (
    <Card>
      <CardTitle icon={Lightbulb}>Cách niệm</CardTitle>
      <ol className="space-y-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lotus-50 text-sm font-semibold text-lotus-700 dark:bg-lotus-900/30 dark:text-lotus-200">
              {i + 1}
            </span>
            <div>
              <p className="font-medium text-stone-900 dark:text-stone-100">{s.title}</p>
              <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 border-t border-stone-100 pt-4 font-serif text-sm leading-relaxed text-stone-600 italic dark:border-white/5 dark:text-stone-400">
        Con số chỉ là phương tiện giữ thời khoá. Điều quý là sau khi đặt chuỗi xuống, lời nói và việc làm của mình hiền hơn một chút.
      </p>
      <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
        Phím tắt: <kbd className="rounded border border-stone-300 px-1 dark:border-white/20">Space</kbd>,{' '}
        <kbd className="rounded border border-stone-300 px-1 dark:border-white/20">Enter</kbd> hoặc{' '}
        <kbd className="rounded border border-stone-300 px-1 dark:border-white/20">↓</kbd> để lần hạt.
      </p>
    </Card>
  )
}
