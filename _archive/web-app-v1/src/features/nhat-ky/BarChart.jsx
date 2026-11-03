import { useId, useMemo, useState } from 'react'
import { formatNumber } from '../../lib/date'
import { cn } from '../../lib/cn'
import { compactNumber, niceScale } from './journal'
import { useElementWidth } from './useElementWidth'

const HEIGHT = 220
const M = { top: 22, right: 6, bottom: 26, left: 40 }

// Một hue duy nhất cho mỗi biểu đồ; cột mới nhất đậm hơn để mắt tìm ngay "hiện tại"
const TONES = {
  jade: { bar: 'fill-jade-400 dark:fill-jade-600', current: 'fill-jade-700 dark:fill-jade-300', dot: 'bg-jade-500' },
  saffron: { bar: 'fill-saffron-300 dark:fill-saffron-700', current: 'fill-saffron-600 dark:fill-saffron-400', dot: 'bg-saffron-500' },
}

/**
 * Biểu đồ cột SVG tự vẽ cho một chuỗi số liệu.
 * data: [{ key, label, fullLabel, ...giá trị }]
 */
export default function BarChart({ title, data, valueKey, unit, tone = 'jade', className }) {
  const [ref, width] = useElementWidth(560)
  const [hover, setHover] = useState(null)
  const titleId = useId()
  const colors = TONES[tone] ?? TONES.jade

  const geo = useMemo(() => {
    const n = data.length
    const values = data.map((d) => d[valueKey] || 0)
    const max = Math.max(0, ...values)
    const scale = niceScale(max)
    const innerW = Math.max(40, width - M.left - M.right)
    const innerH = HEIGHT - M.top - M.bottom
    const band = innerW / Math.max(1, n)
    // Khe 2px giữa các cột, cột không quá to khi chỉ có 7 ngày
    const barW = Math.max(3, Math.min(40, band * 0.64, band - 2))
    const y = (v) => M.top + innerH - (v / scale.max) * innerH
    const every = n <= 12 ? 1 : Math.max(1, Math.ceil(n / Math.max(1, Math.floor(innerW / 46))))
    const maxIndex = values.indexOf(max)
    return { n, values, max, scale, innerW, innerH, band, barW, y, every, maxIndex }
  }, [data, valueKey, width])

  const total = geo.values.reduce((a, b) => a + b, 0)
  const active = hover != null ? data[hover] : null

  return (
    <figure className={cn('relative', className)} aria-labelledby={titleId}>
      <figcaption id={titleId} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-stone-100">
          <span className={cn('h-2.5 w-2.5 rounded-full', colors.dot)} aria-hidden />
          {title}
        </span>
        <span className="text-xs text-stone-500 dark:text-stone-400">
          Tổng <span className="font-semibold text-stone-800 tabular-nums dark:text-stone-100">{formatNumber(total)}</span> {unit}
        </span>
      </figcaption>

      <div ref={ref} className="relative mt-3 w-full" onPointerLeave={() => setHover(null)}>
        <svg width={width} height={HEIGHT} className="block overflow-visible" role="img" aria-label={`${title}: tổng ${formatNumber(total)} ${unit}`}>
          {/* Lưới ngang mờ để không tranh chỗ với cột */}
          {geo.scale.ticks.map((t) => (
            <g key={t}>
              <line
                x1={M.left}
                x2={M.left + geo.innerW}
                y1={geo.y(t)}
                y2={geo.y(t)}
                className={t === 0 ? 'stroke-stone-300 dark:stroke-white/20' : 'stroke-stone-200/80 dark:stroke-white/5'}
                strokeDasharray={t === 0 ? undefined : '3 4'}
              />
              <text x={M.left - 8} y={geo.y(t)} dy="0.32em" textAnchor="end" className="fill-stone-500 text-[11px] tabular-nums dark:fill-stone-400">
                {compactNumber(t)}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const v = geo.values[i]
            const cx = M.left + geo.band * i + geo.band / 2
            const top = geo.y(v)
            const h = Math.max(0, M.top + geo.innerH - top)
            const current = i === geo.n - 1
            const showValue = v > 0 && (i === geo.maxIndex || current || hover === i)
            return (
              <g key={d.key}>
                {/* Chỉ bo 4px ở đầu cột, chân cột bám thẳng vào trục */}
                {h > 0 && (
                  <path
                    d={roundedTopBar(cx - geo.barW / 2, top, geo.barW, h, Math.min(4, geo.barW / 2, h))}
                    className={cn(current ? colors.current : colors.bar, 'transition-opacity', hover != null && hover !== i && 'opacity-50')}
                  />
                )}
                {showValue && (
                  <text x={cx} y={top - 6} textAnchor="middle" className="fill-stone-700 text-[11px] font-semibold tabular-nums dark:fill-stone-200">
                    {compactNumber(v)}
                  </text>
                )}
                {i % geo.every === 0 || current ? (
                  <text
                    x={cx}
                    y={HEIGHT - M.bottom + 16}
                    textAnchor="middle"
                    className={cn('text-[11px]', current ? 'fill-stone-800 font-semibold dark:fill-stone-100' : 'fill-stone-500 dark:fill-stone-400')}
                  >
                    {d.label}
                  </text>
                ) : null}
                {/* Vùng chạm rộng hơn cột để dễ rê chuột / chạm trên di động */}
                <rect
                  x={M.left + geo.band * i}
                  y={M.top}
                  width={geo.band}
                  height={geo.innerH}
                  fill="transparent"
                  onPointerEnter={() => setHover(i)}
                  onPointerDown={() => setHover(i)}
                />
              </g>
            )
          })}

          {geo.max === 0 && (
            <text x={M.left + geo.innerW / 2} y={M.top + geo.innerH / 2} textAnchor="middle" className="fill-stone-400 text-sm dark:fill-stone-500">
              Chưa có số liệu trong khoảng này
            </text>
          )}
        </svg>

        {active && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl border border-stone-200 bg-white/95 px-3 py-2 text-xs whitespace-nowrap shadow-lg backdrop-blur dark:border-white/10 dark:bg-night-3/95"
            style={{ left: clamp(M.left + geo.band * hover + geo.band / 2, 70, width - 70) }}
            aria-hidden
          >
            <p className="text-stone-500 dark:text-stone-400">{active.fullLabel}</p>
            <p className="font-semibold text-stone-900 tabular-nums dark:text-stone-50">
              {formatNumber(active[valueKey] || 0)} {unit}
            </p>
          </div>
        )}
      </div>

      {/* Bảng dữ liệu cho trình đọc màn hình */}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Thời gian</th>
            <th scope="col">{unit}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={d.key}>
              <th scope="row">{d.fullLabel}</th>
              <td>{formatNumber(geo.values[i])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), Math.max(lo, hi))
}

function roundedTopBar(x, y, w, h, r) {
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`
}
