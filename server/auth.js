import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

/** Tài khoản: băm mật khẩu bằng scrypt (có muối), phiên đăng nhập là chuỗi ngẫu nhiên — chỉ lưu bản băm SHA-256 */

const scrypt = promisify(scryptCb)
const KEY_LEN = 64

export const USERNAME_RE = /^[a-zA-Z0-9_.]{3,20}$/
export const PASSWORD_MIN = 6
export const SESSION_DAYS = 30

export function checkCredentials(username, password) {
  if (typeof username !== 'string' || !USERNAME_RE.test(username)) return 'Tên đăng nhập 3–20 ký tự: chữ không dấu, số, dấu _ hoặc .'
  if (typeof password !== 'string' || password.length < PASSWORD_MIN || password.length > 100) return `Mật khẩu từ ${PASSWORD_MIN} ký tự trở lên`
  return null
}

export async function hashPassword(password) {
  const salt = randomBytes(16)
  const key = await scrypt(password, salt, KEY_LEN)
  return `${salt.toString('hex')}:${key.toString('hex')}`
}

export async function verifyPassword(password, stored) {
  const [saltHex, keyHex] = String(stored).split(':')
  if (!saltHex || !keyHex) return false
  const key = await scrypt(password, Buffer.from(saltHex, 'hex'), KEY_LEN)
  const expected = Buffer.from(keyHex, 'hex')
  return expected.length === key.length && timingSafeEqual(expected, key)
}

export function newToken() {
  return randomBytes(32).toString('hex')
}

export function tokenHash(token) {
  return createHash('sha256').update(String(token)).digest('hex')
}

/** Giới hạn số lần thử theo khoá (vd. IP): tối đa `limit` lần mỗi `windowMs` */
export function rateLimiter(limit, windowMs) {
  const hits = new Map()
  return (key, now = Date.now()) => {
    const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
    if (list.length >= limit) {
      hits.set(key, list)
      return false
    }
    list.push(now)
    hits.set(key, list)
    return true
  }
}
