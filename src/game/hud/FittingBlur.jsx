import { FITTING_LAYER_ID } from '../player/FittingFocus'

// Elip quanh nhân vật trong suốt (sắc nét), mờ dần ra ngoài
const MASK = 'radial-gradient(ellipse var(--rx, 160px) var(--ry, 240px) at var(--fx, 35%) var(--fy, 55%), transparent 62%, black 100%)'

/** Lớp phủ làm mờ khung cảnh khi thử đồ (vị trí elip do FittingFocus cập nhật mỗi frame) */
export default function FittingBlur() {
  return (
    <div
      id={FITTING_LAYER_ID}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5] animate-fade-in"
      style={{
        backdropFilter: 'blur(7px) saturate(0.85)',
        WebkitBackdropFilter: 'blur(7px) saturate(0.85)',
        background: 'rgba(28, 22, 18, 0.18)',
        maskImage: MASK,
        WebkitMaskImage: MASK,
      }}
    />
  )
}
