import { Leaf } from 'lucide-react'

/** Chú giải ký hiệu trên lưới lịch — mỗi mục dùng đúng ký hiệu như trong ô ngày. */
export default function CalendarLegend() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-600 dark:text-stone-400" aria-label="Chú giải ký hiệu lịch">
      <li className="flex items-center gap-2">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-jade-700 text-[10px] font-semibold text-white dark:bg-jade-500 dark:text-jade-950">
          2
        </span>
        Hôm nay
      </li>
      <li className="flex items-center gap-2">
        <span className="h-4 w-5 rounded-md bg-saffron-100 ring-1 ring-saffron-300 ring-inset dark:bg-saffron-500/15 dark:ring-saffron-500/40" />
        Ngày lễ, ngày vía
      </li>
      <li className="flex items-center gap-2">
        <span className="rounded-full bg-lotus-100 px-1.5 text-[10px] font-semibold text-lotus-800 dark:bg-lotus-500/20 dark:text-lotus-200">
          15
        </span>
        Mùng 1 (Sóc) · Rằm (Vọng)
      </li>
      <li className="flex items-center gap-2">
        <Leaf className="h-4 w-4 text-jade-600 dark:text-jade-400" aria-hidden />
        Ngày chay theo lối bạn chọn
      </li>
      <li className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-jade-500 dark:bg-jade-400" />
        Ngày có tu tập
      </li>
      <li className="flex items-center gap-2">
        <span className="font-semibold text-stone-500">1/9</span>
        Đầu tháng âm (ngày/tháng)
      </li>
    </ul>
  )
}
