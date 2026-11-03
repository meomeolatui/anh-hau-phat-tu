import { cn } from '../../lib/cn'
import { WEEKDAYS_SHORT_VI, formatNumber, formatShortDate, fromKey } from '../../lib/date'
import { chartScale } from './chart'

const W = 300
const H = 150
const TOP = 22
const BOTTOM = 24
const PLOT_H = H - TOP - BOTTOM

/** Cột có bo 4px ở đầu, chân cột bám sát trục. */
function barPath(x, y, w, h) {
  if (h <= 0) return ''
  const r = Math.min(4, h, w / 2)
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
}

/**
 * Biểu đồ cột 7 ngày (một chuỗi số liệu). Rê chuột / chạm cột để xem số;
 * kèm bảng ẩn cho trình đọc màn hình.
 */
export default function WeekChart({ data, goal }) {
  const { max, showGoal } = chartScale(data, goal)
  const slot = W / data.length
  const barW = Math.min(26, slot * 0.56)
  const y = (v) => TOP + PLOT_H - (v / max) * PLOT_H
  const lastIndex = data.length - 1

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label="Số câu niệm 7 ngày gần đây">
        <line x1="0" x2={W} y1={TOP + PLOT_H} y2={TOP + PLOT_H} className="stroke-stone-200 dark:stroke-white/10" strokeWidth="1" />
        {showGoal && (
          <g>
            <line x1="0" x2={W} y1={y(goal)} y2={y(goal)} strokeDasharray="4 4" className="stroke-saffron-400/80" strokeWidth="1" />
            <text x={W} y={y(goal) - 4} textAnchor="end" className="fill-stone-500 text-[9px] dark:fill-stone-400">
              Mục tiêu {formatNumber(goal)}
            </text>
          </g>
        )}
        {data.map((d, i) => {
          const cx = slot * i + slot / 2
          const top = y(d.value)
          const h = TOP + PLOT_H - top
          const isToday = i === lastIndex
          const date = fromKey(d.key)
          return (
            <g key={d.key} className="group">
              <title>{`${formatShortDate(date)}: ${formatNumber(d.value)} câu`}</title>
              {/* Vùng rê chuột rộng hơn cột để dễ chạm */}
              <rect x={slot * i} y={0} width={slot} height={H} className="fill-transparent" />
              <path
                d={barPath(cx - barW / 2, top, barW, h)}
                className={cn(
                  'transition-colors',
                  isToday ? 'fill-jade-600 dark:fill-jade-400' : 'fill-jade-300 group-hover:fill-jade-500 dark:fill-jade-700 dark:group-hover:fill-jade-500',
                )}
              />
              {d.value > 0 && (
                <text
                  x={cx}
                  y={top - 5}
                  textAnchor="middle"
                  className={cn(
                    'fill-stone-700 text-[10px] font-medium tabular-nums transition-opacity dark:fill-stone-200',
                    isToday ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                  )}
                >
                  {formatNumber(d.value)}
                </text>
              )}
              <text
                x={cx}
                y={H - 6}
                textAnchor="middle"
                className={cn('text-[10px]', isToday ? 'fill-jade-700 font-semibold dark:fill-jade-300' : 'fill-stone-500 dark:fill-stone-400')}
              >
                {isToday ? 'Nay' : WEEKDAYS_SHORT_VI[date.getDay()]}
              </text>
            </g>
          )
        })}
      </svg>
      <table className="sr-only">
        <caption>Số câu niệm theo ngày</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{formatShortDate(fromKey(d.key))}</th>
              <td>{d.value} câu</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
