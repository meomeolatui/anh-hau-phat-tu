import { cn } from '../../lib/cn'

// Độ cong của miệng theo mức cảm nhận 1..5 — tự vẽ vì lucide v1 không còn bộ icon gương mặt
const MOUTH = {
  1: 'M8 17 Q12 13.5 16 17',
  2: 'M8.5 16.2 Q12 14.6 15.5 16.2',
  3: 'M8.5 15.5 L15.5 15.5',
  4: 'M8.5 14.6 Q12 17.4 15.5 14.6',
  5: 'M7.8 14 Q12 18.6 16.2 14',
}

export default function MoodFace({ value, className }) {
  const serene = value === 5
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-7 w-7', className)}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9.5" />
      {serene ? (
        // An lạc: mắt khép hờ như đang mỉm cười
        <>
          <path d="M7.8 10 Q9 8.8 10.2 10" />
          <path d="M13.8 10 Q15 8.8 16.2 10" />
        </>
      ) : (
        <>
          <circle cx="9" cy="10" r="0.9" fill="currentColor" stroke="none" />
          <circle cx="15" cy="10" r="0.9" fill="currentColor" stroke="none" />
        </>
      )}
      <path d={MOUTH[value] ?? MOUTH[3]} />
    </svg>
  )
}
