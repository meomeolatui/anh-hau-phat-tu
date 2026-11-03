import { useEffect, useState } from 'react'
import { Globe, LogOut, User, WifiOff } from 'lucide-react'
import { fetchMe, forgetAccount, login, logout, register, rememberAccount, savedAccount } from '../net/api'
import { goOffline, goOnline, useOnline } from '../net/online'
import { getGame } from '../game/state'
import { cn } from '../lib/cn'

// Đã chọn "chơi một mình" trong lần mở trang này → không tự đăng nhập lại
const OFFLINE_FLAG = 'ahpt-choi-mot-minh'

/**
 * Tài khoản chơi online trên màn hình chính: tự đăng nhập lại nếu đã lưu phiên; nếu chưa thì
 * đăng nhập / tạo tài khoản (có thể mang theo tiến trình chơi một mình); hoặc chơi một mình không cần mạng.
 */
export default function AccountPanel() {
  const mode = useOnline((s) => s.mode)
  const username = useOnline((s) => s.username)
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ username: '', password: '' })
  const [carry, setCarry] = useState(() => Boolean(getGame().save.profile))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Tự đăng nhập bằng phiên đã lưu
  useEffect(() => {
    const acc = savedAccount()
    if (!acc || mode !== 'offline' || sessionStorage.getItem(OFFLINE_FLAG)) return
    let cancelled = false
    fetchMe(acc.token)
      .then((me) => {
        if (!cancelled) goOnline({ token: acc.token, username: me.username, save: me.save })
      })
      .catch((err) => {
        if (cancelled) return
        if (err.status === 401) forgetAccount()
        setError(err.message)
      })
    return () => {
      cancelled = true
    }
    // Chỉ thử một lần khi mở màn hình chính
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const local = tab === 'register' && carry ? getGame().save : null
      const res = tab === 'register' ? await register(form.username, form.password, local) : await login(form.username, form.password)
      rememberAccount(res)
      sessionStorage.removeItem(OFFLINE_FLAG)
      goOnline({ token: res.token, username: res.username, save: res.save })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const playSolo = () => {
    sessionStorage.setItem(OFFLINE_FLAG, '1')
    goOffline()
  }

  const signOut = async () => {
    const acc = savedAccount()
    if (acc) await logout(acc.token)
    forgetAccount()
    goOffline()
  }

  if (mode !== 'offline') {
    return (
      <div className="rounded-2xl bg-white/80 p-3 text-left text-sm shadow-sm backdrop-blur">
        <p className="flex items-center gap-2 font-semibold text-jade-900">
          <Globe className="h-4 w-4" aria-hidden /> Chơi online · {username}
        </p>
        <p className="mt-0.5 text-xs text-stone-600">Tiến trình lưu trên máy chủ, gặp gỡ phật tử khác trên núi.</p>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={playSolo} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-stone-900/5 text-xs font-semibold hover:bg-stone-900/10">
            <WifiOff className="h-3.5 w-3.5" aria-hidden /> Chơi một mình
          </button>
          <button type="button" onClick={signOut} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-stone-900/5 text-xs font-semibold hover:bg-stone-900/10">
            <LogOut className="h-3.5 w-3.5" aria-hidden /> Đăng xuất
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white/85 p-3 text-left text-sm shadow-sm backdrop-blur" aria-label="Chơi online">
      <div className="mb-2 flex gap-1 rounded-xl bg-stone-900/5 p-1" role="tablist" aria-label="Tài khoản">
        {[
          ['login', 'Đăng nhập'],
          ['register', 'Tạo tài khoản'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => (setTab(id), setError(''))}
            className={cn('h-8 flex-1 rounded-lg text-xs font-semibold', tab === id ? 'bg-white text-jade-900 shadow' : 'text-stone-500')}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="mb-1.5 flex items-center gap-2 rounded-xl bg-white px-2.5">
        <User className="h-4 w-4 text-stone-400" aria-hidden />
        <input
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value.trim() })}
          placeholder="Tên đăng nhập"
          aria-label="Tên đăng nhập"
          autoComplete="username"
          className="h-10 min-w-0 flex-1 bg-transparent outline-none"
        />
      </label>
      <input
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        placeholder="Mật khẩu (từ 6 ký tự)"
        aria-label="Mật khẩu"
        autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
        className="mb-2 h-10 w-full rounded-xl bg-white px-3 outline-none"
      />
      {tab === 'register' && getGame().save.profile && (
        <label className="mb-2 flex cursor-pointer items-start gap-2 text-xs text-stone-600">
          <input type="checkbox" checked={carry} onChange={(e) => setCarry(e.target.checked)} className="mt-0.5 accent-jade-600" />
          Mang theo nhân vật &amp; tiến trình đang chơi một mình (tối đa 3.000 công đức, 300 xu)
        </label>
      )}
      {error && (
        <p role="alert" className="mb-2 rounded-lg bg-lotus-50 px-2 py-1.5 text-xs text-lotus-800">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-jade-700 font-semibold text-white hover:bg-jade-800 disabled:opacity-60">
        <Globe className="h-4 w-4" aria-hidden /> {busy ? 'Đang kết nối…' : tab === 'register' ? 'Tạo tài khoản & chơi online' : 'Đăng nhập chơi online'}
      </button>
      <p className="mt-2 text-center text-xs text-stone-500">Không đăng nhập vẫn chơi một mình được như cũ.</p>
    </form>
  )
}
