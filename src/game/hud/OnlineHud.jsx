import { useEffect, useRef, useState } from 'react'
import { Flag, MessageCircle, Send, Smile, VolumeX, Wifi, WifiOff, X } from 'lucide-react'
import { EMOTES, CHAT_MAX } from '../../net/protocol'
import { SELF_BUBBLE_ID, goOffline, reportPlayer, sendChat, sendEmote, useOnline } from '../../net/online'
import { toggleMute, useMessages } from '../../net/chatStore'
import { useRemoteList } from '../../net/remotes'
import { forgetAccount } from '../../net/api'
import { setScreen, updateUi, useGame } from '../state'
import { cn } from '../../lib/cn'

/** Chấm trạng thái online + số người cùng khu */
export function OnlineStatus() {
  const mode = useOnline((s) => s.mode)
  const remotes = useRemoteList()
  if (mode === 'offline') return null
  const online = mode === 'online'
  return (
    <div
      className={cn(
        'pointer-events-none absolute top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white shadow backdrop-blur-md sm:top-5',
        online ? 'bg-jade-800/70' : 'bg-stone-900/70',
      )}
    >
      {online ? <Wifi className="h-3.5 w-3.5" aria-hidden /> : <WifiOff className="h-3.5 w-3.5" aria-hidden />}
      {online ? `Online · ${remotes.length + 1} người trong khu` : 'Mất kết nối, đang nối lại…'}
    </div>
  )
}

/** Bảng chat: T mở, Enter gửi, Esc đóng; bấm tên để tắt tiếng / báo cáo */
export function ChatPanel() {
  const mode = useOnline((s) => s.mode)
  const myId = useOnline((s) => s.myId)
  const open = useGame((s) => s.ui.chat)
  const messages = useMessages()
  const [text, setText] = useState('')
  const [scope, setScope] = useState('near')
  const [menu, setMenu] = useState(null) // { id, name }
  const input = useRef(null)
  const list = useRef(null)
  const [now, setNow] = useState(() => Date.now())

  // Tin cũ ẩn dần khi bảng đóng: cập nhật đồng hồ mỗi 2 giây
  useEffect(() => {
    if (open) return
    const t = setInterval(() => setNow(Date.now()), 2000)
    return () => clearInterval(t)
  }, [open])
  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight })
  }, [messages, open])

  if (mode === 'offline') return null
  const visible = open ? messages.slice(-30) : messages.filter((m) => now - m.at < 12000).slice(-4)
  const close = () => {
    updateUi({ chat: false })
    setMenu(null)
  }
  const submit = (e) => {
    e.preventDefault()
    sendChat(text, scope)
    setText('')
  }

  return (
    <div className="pointer-events-auto absolute bottom-40 left-3 z-30 w-[min(360px,calc(100vw-1.5rem))] sm:bottom-24 sm:left-5">
      {visible.length > 0 && (
        <ul
          ref={list}
          className={cn('mb-2 space-y-1 overflow-y-auto text-sm', open ? 'max-h-60 rounded-2xl bg-stone-900/55 p-2 backdrop-blur-md' : 'max-h-40')}
          aria-live="polite"
        >
          {visible.map((m) => (
            <li key={m.key} className={cn('rounded-xl px-2 py-1 text-white', !open && 'bg-stone-900/45 backdrop-blur-sm')}>
              {m.system ? (
                <span className="text-saffron-200">{m.text}</span>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={m.self || !open}
                    onClick={() => setMenu({ id: m.id, name: m.name })}
                    className={cn('mr-1 font-semibold', m.self ? 'text-saffron-200' : 'text-jade-200 hover:underline')}
                  >
                    {m.name}
                    {m.scope === 'zone' && <span className="ml-1 text-[10px] font-normal text-white/60">(cả khu)</span>}:
                  </button>
                  <span className="break-words">{m.text}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {menu && menu.id !== myId && (
        <div className="mb-2 flex items-center gap-2 rounded-2xl bg-white/95 p-2 text-sm shadow-lg">
          <span className="flex-1 truncate font-semibold">{menu.name}</span>
          <button type="button" onClick={() => (toggleMute(menu.name), setMenu(null))} className="flex items-center gap-1 rounded-xl bg-stone-100 px-2 py-1 hover:bg-stone-200">
            <VolumeX className="h-4 w-4" aria-hidden /> Tắt tiếng
          </button>
          <button
            type="button"
            onClick={() => {
              reportPlayer(menu.id, 'chat')
              setMenu(null)
            }}
            className="flex items-center gap-1 rounded-xl bg-lotus-50 px-2 py-1 text-lotus-800 hover:bg-lotus-100"
          >
            <Flag className="h-4 w-4" aria-hidden /> Báo cáo
          </button>
          <button type="button" onClick={() => setMenu(null)} aria-label="Đóng" className="rounded-lg p-1 hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {open ? (
        <form onSubmit={submit} className="flex items-center gap-1.5 rounded-2xl bg-white/95 p-1.5 shadow-xl">
          <button
            type="button"
            onClick={() => setScope(scope === 'near' ? 'zone' : 'near')}
            className="h-9 shrink-0 rounded-xl bg-stone-100 px-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-200"
            title="Đổi người nhận"
          >
            {scope === 'near' ? 'Gần đây' : 'Cả khu'}
          </button>
          <input
            ref={input}
            value={text}
            maxLength={CHAT_MAX}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), close())}
            placeholder="Nhắn gì đó hiền hoà…"
            aria-label="Tin nhắn"
            className="h-9 min-w-0 flex-1 rounded-xl px-2 text-sm outline-none"
          />
          <button type="submit" aria-label="Gửi" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-jade-700 text-white hover:bg-jade-800">
            <Send className="h-4 w-4" />
          </button>
          <button type="button" onClick={close} aria-label="Đóng chat" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl hover:bg-stone-100">
            <X className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => updateUi({ chat: true })}
          className="flex items-center gap-1.5 rounded-2xl bg-stone-900/50 px-3 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-md hover:bg-stone-900/65"
        >
          <MessageCircle className="h-4 w-4" aria-hidden /> Trò chuyện <span className="hidden text-white/60 sm:inline">(T)</span>
        </button>
      )}
    </div>
  )
}

/** Nút & bảng biểu cảm (G) — chơi một mình vẫn dùng được, online thì người xung quanh thấy */
export function EmoteMenu() {
  const open = useGame((s) => s.ui.emotes)
  const activity = useGame((s) => s.ui.activity)
  if (activity) return null
  return (
    <div className="pointer-events-auto absolute right-3 bottom-48 z-30 flex flex-col items-end gap-2 sm:right-5 sm:bottom-24">
      {open && (
        <div className="grid w-56 grid-cols-2 gap-1.5 rounded-2xl bg-white/95 p-2 shadow-xl" role="menu" aria-label="Biểu cảm">
          {Object.entries(EMOTES).map(([id, em]) => (
            <button
              key={id}
              type="button"
              role="menuitem"
              onClick={(e) => {
                sendEmote(id)
                updateUi({ emotes: false })
                e.currentTarget.blur()
              }}
              className="rounded-xl bg-stone-100 px-2 py-2 text-xs font-semibold text-stone-800 hover:bg-saffron-100"
            >
              {em.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={(e) => {
          updateUi({ emotes: !open })
          e.currentTarget.blur()
        }}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-2xl bg-stone-900/50 px-3 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-md hover:bg-stone-900/65"
      >
        <Smile className="h-4 w-4" aria-hidden /> Biểu cảm <span className="hidden text-white/60 sm:inline">(G)</span>
      </button>
    </div>
  )
}

/** Bong bóng chat / biểu cảm trên đầu chính mình (vị trí do RemotePlayers đặt mỗi khung hình) */
export function SelfBubble() {
  const bubble = useOnline((s) => s.selfBubble)
  const [shown, setShown] = useState(null)
  useEffect(() => {
    if (!bubble) return
    // Hiện ngay, ẩn khi hết hạn
    const show = setTimeout(() => setShown(bubble.text), 0)
    const hide = setTimeout(() => setShown(null), Math.max(0, bubble.until - performance.now()))
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [bubble])
  return (
    <div id={SELF_BUBBLE_ID} className="pointer-events-none absolute top-0 left-0 z-10" aria-live="polite">
      {shown && <div className="max-w-[240px] rounded-2xl bg-saffron-50/95 px-3 py-1.5 text-center text-sm leading-snug text-stone-800 shadow-lg">{shown}</div>}
    </div>
  )
}

/** Bị đẩy ra (đăng nhập nơi khác / phiên hết hạn) */
export function KickedNotice() {
  const mode = useOnline((s) => s.mode)
  const notice = useOnline((s) => s.notice)
  if (mode !== 'kicked') return null
  return (
    <div className="pointer-events-auto absolute inset-0 z-50 grid place-items-center bg-stone-900/50 p-6 backdrop-blur-sm">
      <div role="alertdialog" aria-label="Mất phiên chơi online" className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <WifiOff className="mx-auto h-8 w-8 text-stone-500" aria-hidden />
        <p className="mt-3 font-serif text-xl font-semibold text-stone-900">Đã thoát chơi online</p>
        <p className="mt-2 text-sm text-stone-600">{notice}</p>
        <button
          type="button"
          onClick={() => {
            if (/hết hạn/.test(notice ?? '')) forgetAccount()
            goOffline()
            setScreen('title')
          }}
          className="mt-5 h-11 w-full rounded-2xl bg-jade-700 font-semibold text-white hover:bg-jade-800"
        >
          Về màn hình chính
        </button>
      </div>
    </div>
  )
}
