import { cn } from '../../lib/cn'

/**
 * Hình trang trí nét mảnh cho từng loại bài: pháp luân (kinh), hào quang (chú),
 * hoa sen (kệ), cuộn thư (nghi thức). Thuần SVG, dùng currentColor để tự hợp sáng/tối.
 */
export default function SutraGlyph({ category, className }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className={cn('h-16 w-16', className)} aria-hidden>
      {category === 'kinh' && <Wheel />}
      {category === 'chu' && <Radiance />}
      {category === 'ke' && <Lotus />}
      {category === 'nghi-thuc' && <Scroll />}
    </svg>
  )
}

function Wheel() {
  const spokes = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4)
  return (
    <g>
      <circle cx="32" cy="32" r="26" />
      <circle cx="32" cy="32" r="20" />
      <circle cx="32" cy="32" r="5" />
      {spokes.map((a) => (
        <line key={a} x1={32 + Math.cos(a) * 5} y1={32 + Math.sin(a) * 5} x2={32 + Math.cos(a) * 26} y2={32 + Math.sin(a) * 26} />
      ))}
    </g>
  )
}

function Radiance() {
  const rays = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6)
  return (
    <g>
      <circle cx="32" cy="32" r="8" />
      <circle cx="32" cy="32" r="14" strokeDasharray="2 4" />
      {rays.map((a) => (
        <line key={a} x1={32 + Math.cos(a) * 18} y1={32 + Math.sin(a) * 18} x2={32 + Math.cos(a) * 28} y2={32 + Math.sin(a) * 28} />
      ))}
    </g>
  )
}

function Lotus() {
  return (
    <g>
      <path d="M32 12c5 6 7 12 7 18s-2.5 11-7 14c-4.5-3-7-8-7-14s2-12 7-18Z" />
      <path d="M14 26c6 1 11 4 14 9 1.5 2.6 1.6 6 1.6 9-5.6-.6-10.2-2.8-12.8-6.4C14.4 34 13.6 30 14 26Z" />
      <path d="M50 26c-6 1-11 4-14 9-1.5 2.6-1.6 6-1.6 9 5.6-.6 10.2-2.8 12.8-6.4C49.6 34 50.4 30 50 26Z" />
      <path d="M12 50h40" />
      <path d="M18 55h28" />
    </g>
  )
}

function Scroll() {
  return (
    <g>
      <rect x="14" y="12" width="36" height="40" rx="4" />
      <path d="M10 16a4 4 0 0 1 8 0v34a4 4 0 0 1-8 0Z" />
      <path d="M46 16a4 4 0 0 1 8 0v34a4 4 0 0 1-8 0Z" />
      <path d="M24 22h16M24 29h16M24 36h12M24 43h14" />
    </g>
  )
}
