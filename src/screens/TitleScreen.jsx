import { useEffect } from 'react'
import { Mountain, Play, UserPlus } from 'lucide-react'
import { LotusMark } from '../components/Logo'
import { levelFor } from '../game/progression'
import { setScreen, useGame } from '../game/state'
import AccountPanel from './AccountPanel'

/** Núi Bà Đen cách điệu bằng SVG nhiều lớp (núi xa, núi gần, mây, tượng trên đỉnh) */
function MountainArt() {
  return (
    <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="t-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6c493" />
          <stop offset="0.45" stopColor="#f3d9b8" />
          <stop offset="1" stopColor="#d9e8e3" />
        </linearGradient>
        <linearGradient id="t-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a9c95" />
          <stop offset="1" stopColor="#a9c3b8" />
        </linearGradient>
        <linearGradient id="t-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f5d4f" />
          <stop offset="1" stopColor="#163f3a" />
        </linearGradient>
      </defs>
      <rect width="1200" height="600" fill="url(#t-sky)" />
      <circle cx="900" cy="250" r="62" fill="#fde6b5" opacity="0.9" />
      {/* Núi Heo, núi Phụng phía xa */}
      <path d="M0 480 L180 400 L300 440 L420 395 L520 455 L1200 470 L1200 600 L0 600 Z" fill="url(#t-far)" opacity="0.8" />
      {/* Núi Bà Đen */}
      <path d="M200 600 L430 430 L530 360 L600 300 L640 292 L700 340 L820 420 L1000 600 Z" fill="url(#t-near)" />
      {/* Tượng trên đỉnh */}
      <path d="M613 295 L619 262 L623 252 L627 262 L633 295 Z" fill="#c08b4a" />
      <circle cx="623" cy="248" r="5" fill="#c08b4a" />
      {/* Mây */}
      <g fill="#ffffff" opacity="0.85">
        <ellipse cx="360" cy="470" rx="150" ry="22" />
        <ellipse cx="840" cy="420" rx="170" ry="22" />
        <ellipse cx="620" cy="520" rx="240" ry="26" />
      </g>
      {/* Cổng chùa và lư hương nhỏ dưới chân núi */}
      <g fill="#7d2f1f">
        <path d="M120 560 L170 540 L220 560 Z" />
        <rect x="132" y="560" width="8" height="40" />
        <rect x="200" y="560" width="8" height="40" />
      </g>
    </svg>
  )
}

export default function TitleScreen() {
  const profile = useGame((s) => s.save.profile)
  const merit = useGame((s) => s.save.merit)
  useEffect(() => {
    document.title = 'Anh Hậu Phật Tử — Hành hương núi Bà Đen'
  }, [])

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden text-stone-900">
      <MountainArt />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-start px-6 pt-[9vh] text-center">
        <LotusMark className="h-16 w-16 shadow-glow" />
        <p className="mt-5 text-xs font-semibold tracking-[0.35em] text-jade-800 uppercase">Hành hương núi Bà Đen</p>
        <h1 className="mt-2 font-serif text-5xl font-semibold tracking-tight text-jade-950 sm:text-6xl">Anh Hậu Phật Tử</h1>
        <p className="mt-3 max-w-md text-base text-stone-700">
          Lên núi, thắp nén hương, quét lá sân chùa, lần chuỗi niệm Phật — một hành trình tĩnh lặng giữa mây núi Tây Ninh.
        </p>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          {profile ? (
            <>
              <button
                type="button"
                onClick={() => setScreen('game')}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-jade-800 text-lg font-semibold text-white shadow-xl transition hover:bg-jade-900"
              >
                <Play className="h-5 w-5" /> Tiếp tục hành hương
              </button>
              <p className="mx-auto w-fit rounded-full bg-white/80 px-4 py-1.5 text-sm text-stone-800 shadow-sm backdrop-blur">
                {profile.name} · {levelFor(merit).title} · {merit.toLocaleString('vi-VN')} công đức
              </p>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setScreen('create')}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-jade-800 text-lg font-semibold text-white shadow-xl transition hover:bg-jade-900"
            >
              <Mountain className="h-5 w-5" /> Bắt đầu lên núi
            </button>
          )}
          {profile && (
            <button
              type="button"
              onClick={() => setScreen('create')}
              className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-white/70 text-sm font-medium text-stone-800 backdrop-blur hover:bg-white"
            >
              <UserPlus className="h-4 w-4" /> Sửa nhân vật
            </button>
          )}
          <AccountPanel />
        </div>
      </div>
      <footer className="relative z-10 px-6 pb-5 text-center text-xs text-white/85">
        Cảnh quan phỏng theo núi Bà Đen (Tây Ninh). Công đức trong game chỉ là điểm số — tu tập thật là sống hiền thiện mỗi ngày.
      </footer>
    </main>
  )
}
