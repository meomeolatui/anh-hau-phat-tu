import { useEffect, useState } from 'react'
import { SCALE_EMPTY, scaleAt } from './breathing'

const EASE = 'cubic-bezier(0.45, 0, 0.55, 1)'
const NATURAL_SCALE = 0.86

/**
 * Vòng tròn thở: co giãn bằng transform + transition có thời lượng đúng bằng phần còn lại của pha.
 * - Đang chạy: đặt đích = kích thước cuối pha, trình duyệt tự nội suy mượt.
 * - Tạm dừng: "đóng băng" đúng kích thước hiện tại (tính bằng scaleAt), không transition.
 * Đổi transition-duration giữa chừng không làm khựng chuyển động đang chạy, nên cập nhật mỗi nhịp là an toàn.
 */
function circleStyle(phase, paused, ready, idleScale) {
  if (!phase) return { transform: `scale(${idleScale})`, transition: `transform 1200ms ${EASE}` }
  if (paused || !ready) return { transform: `scale(${scaleAt(phase)})`, transition: 'none' }
  const remaining = Math.max(0, phase.durationMs - phase.phaseElapsedMs)
  return { transform: `scale(${phase.toScale})`, transition: `transform ${remaining}ms ${EASE}` }
}

export default function BreathCircle({ phase, paused, natural, children }) {
  // Khung hình đầu tiên đặt đúng kích thước hiện tại, khung sau mới bật transition —
  // nếu không, vòng tròn sẽ "nhảy" thẳng tới đích ngay khi vừa hiện ra.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const style = circleStyle(phase, paused, ready, natural ? NATURAL_SCALE : SCALE_EMPTY)

  return (
    <div className="relative grid aspect-square w-full place-items-center">
      {/* Quầng sáng ngoài cùng co giãn theo nhịp thở */}
      <div
        aria-hidden
        className="absolute inset-[6%] rounded-full bg-jade-400/10 blur-xl will-change-transform"
        style={style}
      />
      <div
        aria-hidden
        className="absolute inset-[10%] rounded-full border border-jade-300/25 bg-[radial-gradient(circle_at_35%_30%,rgb(127_207_184/0.55),rgb(29_120_103/0.35)_45%,rgb(10_36_33/0.2)_75%)] shadow-[0_0_80px_-10px_rgb(75_179_153/0.55)] will-change-transform"
        style={style}
      />
      <div
        aria-hidden
        className="absolute inset-[24%] rounded-full border border-white/10 bg-white/5 will-change-transform"
        style={style}
      />
      <div className="relative z-10 text-center">{children}</div>
    </div>
  )
}
