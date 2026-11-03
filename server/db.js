import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { SESSION_DAYS, tokenHash } from './auth.js'

/**
 * Cơ sở dữ liệu của máy chủ online — hai lựa chọn, cùng một bộ hàm (đều async):
 *  - SQLite (có sẵn trong Node 24): chạy trên máy, test. openDb({ file })
 *  - Postgres: triển khai trên dịch vụ đám mây có ổ đĩa không bền (vd. Render free + Neon). openDb({ url })
 *    hoặc openDb({ client }) với client có query(sql, params) → { rows } (pg.Pool, PGlite khi test)
 *
 *  users    — tài khoản (tên đăng nhập không phân biệt hoa thường, mật khẩu đã băm)
 *  sessions — phiên đăng nhập (bản băm của token)
 *  saves    — bản lưu tiến trình + "xô" giới hạn tốc độ công đức/xu (xem saveRules.js)
 *  reports  — báo cáo người chơi
 */
export async function openDb({ file = ':memory:', url = null, client = null } = {}) {
  if (url || client) return openPostgres(client ?? (await pgPool(url)))
  return openSqlite(file)
}

const expiry = (now) => now + SESSION_DAYS * 86400000

/* ---------------- SQLite ---------------- */

async function openSqlite(file) {
  const { DatabaseSync } = await import('node:sqlite')
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true })
  const db = new DatabaseSync(file)
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      pass TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS saves (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      data TEXT NOT NULL,
      buckets TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter INTEGER NOT NULL,
      target INTEGER NOT NULL,
      reason TEXT,
      created_at INTEGER NOT NULL
    );
  `)
  const q = {
    insertUser: db.prepare('INSERT INTO users (username, pass, created_at) VALUES (?, ?, ?)'),
    userByName: db.prepare('SELECT id, username, pass FROM users WHERE username = ?'),
    insertSession: db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'),
    sessionUser: db.prepare('SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?'),
    deleteSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
    loadSave: db.prepare('SELECT data, buckets FROM saves WHERE user_id = ?'),
    upsertSave: db.prepare(
      'INSERT INTO saves (user_id, data, buckets, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, buckets = excluded.buckets, updated_at = excluded.updated_at',
    ),
    insertReport: db.prepare('INSERT INTO reports (reporter, target, reason, created_at) VALUES (?, ?, ?, ?)'),
  }
  return {
    kind: 'sqlite',
    async createUser(username, passHash, now = Date.now()) {
      return Number(q.insertUser.run(username, passHash, now).lastInsertRowid)
    },
    async userByName(username) {
      return q.userByName.get(username) ?? null
    },
    async createSession(userId, token, now = Date.now()) {
      q.insertSession.run(tokenHash(token), userId, expiry(now))
    },
    async userForToken(token, now = Date.now()) {
      return token ? (q.sessionUser.get(tokenHash(token), now) ?? null) : null
    },
    async deleteSession(token) {
      q.deleteSession.run(tokenHash(token))
    },
    async loadSave(userId) {
      const row = q.loadSave.get(userId)
      return row ? { save: JSON.parse(row.data), buckets: JSON.parse(row.buckets) } : null
    },
    async storeSave(userId, save, buckets, now = Date.now()) {
      q.upsertSave.run(userId, JSON.stringify(save), JSON.stringify(buckets), now)
    },
    async addReport(reporter, target, reason, now = Date.now()) {
      q.insertReport.run(reporter, target, String(reason ?? '').slice(0, 200), now)
    },
    async close() {
      db.close()
    },
  }
}

/* ---------------- Postgres ---------------- */

async function pgPool(url) {
  const { default: pg } = await import('pg')
  // Neon/Render cấp chuỗi kết nối có sslmode=require — pg tự bật TLS theo chuỗi đó
  return new pg.Pool({ connectionString: url, max: 5, idleTimeoutMillis: 30_000 })
}

async function openPostgres(client) {
  const sql = (text, params = []) => client.query(text, params)
  for (const stmt of [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL,
      pass TEXT NOT NULL,
      created_at BIGINT NOT NULL
    )`,
    // Tên đăng nhập không phân biệt hoa thường (giống COLLATE NOCASE bên SQLite)
    'CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower ON users (LOWER(username))',
    `CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      expires_at BIGINT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS saves (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      data TEXT NOT NULL,
      buckets TEXT NOT NULL,
      updated_at BIGINT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      reporter INTEGER NOT NULL,
      target INTEGER NOT NULL,
      reason TEXT,
      created_at BIGINT NOT NULL
    )`,
  ])
    await sql(stmt)

  return {
    kind: 'postgres',
    async createUser(username, passHash, now = Date.now()) {
      const { rows } = await sql('INSERT INTO users (username, pass, created_at) VALUES ($1, $2, $3) RETURNING id', [username, passHash, now])
      return Number(rows[0].id)
    },
    async userByName(username) {
      const { rows } = await sql('SELECT id, username, pass FROM users WHERE LOWER(username) = LOWER($1)', [username])
      return rows[0] ? { ...rows[0], id: Number(rows[0].id) } : null
    },
    async createSession(userId, token, now = Date.now()) {
      await sql('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)', [tokenHash(token), userId, expiry(now)])
    },
    async userForToken(token, now = Date.now()) {
      if (!token) return null
      const { rows } = await sql(
        'SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > $2',
        [tokenHash(token), now],
      )
      return rows[0] ? { id: Number(rows[0].id), username: rows[0].username } : null
    },
    async deleteSession(token) {
      await sql('DELETE FROM sessions WHERE token_hash = $1', [tokenHash(token)])
    },
    async loadSave(userId) {
      const { rows } = await sql('SELECT data, buckets FROM saves WHERE user_id = $1', [userId])
      return rows[0] ? { save: JSON.parse(rows[0].data), buckets: JSON.parse(rows[0].buckets) } : null
    },
    async storeSave(userId, save, buckets, now = Date.now()) {
      await sql(
        `INSERT INTO saves (user_id, data, buckets, updated_at) VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, buckets = EXCLUDED.buckets, updated_at = EXCLUDED.updated_at`,
        [userId, JSON.stringify(save), JSON.stringify(buckets), now],
      )
    },
    async addReport(reporter, target, reason, now = Date.now()) {
      await sql('INSERT INTO reports (reporter, target, reason, created_at) VALUES ($1, $2, $3, $4)', [reporter, target, String(reason ?? '').slice(0, 200), now])
    },
    async close() {
      await client.end?.()
      await client.close?.()
    },
  }
}
