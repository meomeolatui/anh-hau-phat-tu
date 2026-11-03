/**
 * Gọi API tài khoản của máy chủ online (cùng địa chỉ với game; khi phát triển Vite chuyển tiếp /api sang cổng 5200).
 * Phiên đăng nhập (token) lưu trong localStorage để lần sau vào thẳng.
 */

const ACCOUNT_KEY = 'ahpt-online'

export function savedAccount() {
  try {
    const acc = JSON.parse(localStorage.getItem(ACCOUNT_KEY) ?? 'null')
    return acc?.token && acc?.username ? acc : null
  } catch {
    return null
  }
}

export function rememberAccount({ token, username }) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ token, username }))
}

export function forgetAccount() {
  localStorage.removeItem(ACCOUNT_KEY)
}

async function call(path, { method = 'POST', body, token } = {}) {
  let res
  try {
    res = await fetch(path, {
      method,
      headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Không kết nối được máy chủ. Bạn vẫn có thể chơi một mình.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error ?? 'Máy chủ đang bận, thử lại sau nhé.')
    err.status = res.status
    throw err
  }
  return data
}

/** local: bản lưu chơi một mình muốn mang theo (máy chủ giới hạn số liệu) */
export const register = (username, password, local = null) => call('/api/register', { body: { username, password, local } })
export const login = (username, password) => call('/api/login', { body: { username, password } })
export const logout = (token) => call('/api/logout', { token }).catch(() => null)
export const fetchMe = (token) => call('/api/me', { method: 'GET', token })
