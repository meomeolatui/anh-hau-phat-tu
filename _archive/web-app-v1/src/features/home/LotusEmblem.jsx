import { cn } from '../../lib/cn'

/**
 * Đoá sen trong vòng tròn, chỉ dùng màu đặc (không gradient theo id).
 * Lý do: LotusMark dùng id gradient cố định; khi bản đầu tiên nằm trong khối bị ẩn (sidebar ở di động)
 * Chrome không vẽ được gradient → logo mất nền. Bản này an toàn để dùng nhiều lần trên cùng trang.
 */
export default function LotusEmblem({ className }) {
  return (
    <svg viewBox="0 0 48 48" className={cn('h-10 w-10', className)} aria-hidden>
      <rect width="48" height="48" rx="14" className="fill-jade-700 dark:fill-jade-800" />
      <circle cx="24" cy="24" r="16" fill="none" stroke="#fbc94d" strokeOpacity=".6" strokeWidth="1.2" />
      <path d="M13 21c4.4.6 8 2.6 10 6 1 1.8 1 4.6 1 7-4.2-.4-7.6-2-9.6-4.8C12.6 26.6 12.4 24 13 21Z" fill="#f8a8c5" />
      <path d="M35 21c-4.4.6-8 2.6-10 6-1 1.8-1 4.6-1 7 4.2-.4 7.6-2 9.6-4.8 1.8-2.6 2-5.2 1.4-8.2Z" fill="#f8a8c5" />
      <path d="M24 12c3.6 4 5.4 8 5.4 12S27.6 31.6 24 34c-3.6-2.4-5.4-6-5.4-10S20.4 16 24 12Z" fill="#fce7ef" />
      <path d="M14 35.5h20" stroke="#fbc94d" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
