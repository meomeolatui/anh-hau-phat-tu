import { Headphones, X } from 'lucide-react'
import { updateSettings, useGame } from '../state'

/**
 * Nhạc nền từ YouTube bằng TRÌNH PHÁT NHÚNG CHÍNH THỨC (không tải/tách âm thanh — đúng điều khoản YouTube).
 * Trình phát PHẢI hiển thị (tối thiểu 200×200 px — điều khoản YouTube không cho ẩn); tự phát khi vào game
 * (cú bấm "Vào game" là thao tác người dùng nên trình duyệt cho phép phát có tiếng); cần có mạng.
 * Video do người dùng chọn: https://www.youtube.com/watch?v=QFR8gYk9Vxc
 */
export const YT_VIDEO_ID = 'QFR8gYk9Vxc'

export default function YouTubeMusic() {
  const source = useGame((s) => s.save.settings.bgmSource)
  const enabled = useGame((s) => s.save.settings.bgm !== false && s.save.settings.sound !== false)
  if (source !== 'youtube' || !enabled) return null
  // autoplay=1: tự phát; loop=1 cần kèm playlist=<id> để YouTube phát lặp lại một video
  const src = `https://www.youtube-nocookie.com/embed/${YT_VIDEO_ID}?autoplay=1&loop=1&playlist=${YT_VIDEO_ID}&rel=0&modestbranding=1&playsinline=1`
  return (
    <aside
      className="pointer-events-auto absolute right-3 bottom-3 z-30 w-[280px] overflow-hidden rounded-2xl bg-stone-900/80 shadow-2xl backdrop-blur-md sm:right-auto sm:bottom-5 sm:left-5"
      aria-label="Nhạc nền YouTube"
    >
      <header className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-white">
        <span className="flex items-center gap-1.5 font-medium">
          <Headphones className="h-3.5 w-3.5 text-saffron-300" aria-hidden /> Nhạc nền đang phát
        </span>
        <button
          type="button"
          onClick={() => updateSettings({ bgmSource: 'synth' })}
          className="rounded-lg p-1 text-white/80 hover:bg-white/15"
          aria-label="Tắt nhạc YouTube, dùng nhạc tự soạn"
          title="Tắt nhạc YouTube"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <iframe
        title="Nhạc nền YouTube"
        src={src}
        width="280"
        height="200"
        className="block h-[200px] w-[280px]"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </aside>
  )
}
