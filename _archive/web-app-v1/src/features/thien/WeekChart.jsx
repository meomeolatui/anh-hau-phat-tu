import { useState } from 'react'
import { formatViDate, fromKey, WEEKDAYS_SHORT_VI } from '../../lib/date'
import { cn } from '../../lib/cn'

const W = 320
const H = 168
const PAD_TOP = 26
const PAD_BOTTOM = 26
const PAD_X = 6
const RADIUS = 4

/** Cột bo tròn 4px ở đầu, phẳng ở đáy (neo vào trục). */
function barPath(x, y, w, h) {
  if (h <= 0) return ''
  const r = Math.min(RADIUS, h, w / 2)
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
}

/**
 * Biểu đồ cột 7 ngày phút thiền (một chuỗi → không cần chú giải, tiêu đề đã gọi tên).
 * Có đường mục tiêu nét đứt, hiện số phút khi rê chuột/chạm vào cột, và bảng ẩn cho trình đọc màn hình.
 */
export default function WeekChart({ points, goal, todayKey }) {
  const [active, setActive] = useState(null)
  const max = Math.max(goal || 0, ...points.map((p) => p.value), 1)
  const plotH = H - PAD_TOP - PAD_BOTTOM
  const slot = (W - PAD_X * 2) / points.length
  const barW = Math.min(28, slot - 10)
  const yOf = (v) => PAD_TOP + plotH - (v / max) * plotH
  const goalY = goal ? yOf(goal) : null

  return (
    <div>
      {/* Nhãn mục tiêu đặt ngoài vùng vẽ để không bao giờ đè lên cột */}
      {goal > 0 && (
        <p className="mb-1 flex items-center justify-end gap-1.5 text-xs text-stone-500 dark:text-stone-400">
          <svg width="16" height="2" aria-hidden className="overflow-visible">
            <line x1="0" x2="16" y1="1" y2="1" strokeDasharray="4 3" strokeWidth="1.5" className="stroke-saffron-500" />
          </svg>
          Mục tiêu {goal} phút/ngày
        </p>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label="Biểu đồ số phút thiền trong 7 ngày gần nhất">
        <line x1={0} x2={W} y1={PAD_TOP + plotH} y2={PAD_TOP + plotH} className="stroke-stone-200 dark:stroke-white/10" strokeWidth={1} />
        {goalY != null && <line x1={0} x2={W} y1={goalY} y2={goalY} strokeDasharray="4 4" strokeWidth={1} className="stroke-saffron-500/70" aria-hidden />}
        {points.map((p, i) => {
          const cx = PAD_X + slot * i + slot / 2
          const h = (p.value / max) * plotH
          const isToday = p.key === todayKey
          const isActive = active === i
          const d = fromKey(p.key)
          return (
            <g key={p.key} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} onClick={() => setActive(i)}>
              <title>{`${WEEKDAYS_SHORT_VI[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}: ${p.value} phút`}</title>
              {/* Vùng chạm rộng hơn cột để dễ rê chuột/chạm */}
              <rect x={cx - slot / 2} y={0} width={slot} height={H} fill="transparent" />
              {isActive && <rect x={cx - slot / 2 + 2} y={PAD_TOP - 4} width={slot - 4} height={plotH + 4} rx={8} className="fill-jade-500/8 dark:fill-white/5" />}
              {p.value > 0 ? (
                <path
                  d={barPath(cx - barW / 2, yOf(p.value), barW, h)}
                  className={cn(isToday ? 'fill-jade-600 dark:fill-jade-400' : 'fill-jade-300 dark:fill-jade-700', isActive && 'fill-jade-700 dark:fill-jade-300')}
                />
              ) : (
                <rect x={cx - barW / 2} y={PAD_TOP + plotH - 2} width={barW} height={2} rx={1} className="fill-stone-200 dark:fill-white/10" />
              )}
              {(isActive || (isToday && p.value > 0)) && (
                <text x={cx} y={yOf(p.value) - 6} textAnchor="middle" className="fill-stone-800 text-[11px] font-semibold dark:fill-stone-100">
                  {p.value}′
                </text>
              )}
              <text
                x={cx}
                y={H - 6}
                textAnchor="middle"
                className={cn('text-[11px]', isToday ? 'fill-jade-700 font-semibold dark:fill-jade-300' : 'fill-stone-500 dark:fill-stone-400')}
              >
                {isToday ? 'Nay' : WEEKDAYS_SHORT_VI[d.getDay()]}
              </text>
            </g>
          )
        })}
      </svg>
      <table className="sr-only">
        <caption>Số phút thiền 7 ngày gần nhất</caption>
        <thead>
          <tr>
            <th scope="col">Ngày</th>
            <th scope="col">Phút</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.key}>
              <td>{formatViDate(fromKey(p.key))}</td>
              <td>{p.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
