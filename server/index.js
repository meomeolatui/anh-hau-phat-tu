import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { startServer } from './server.js'

/**
 * Chạy máy chủ: `npm run server` (phát triển, cổng 5200 — Vite chuyển tiếp /api, /ws sang đây)
 * Triển khai: `npm run build` rồi `npm run server` → phục vụ luôn game ở dist/.
 * Biến môi trường:
 *  PORT          cổng (mặc định 5200; dịch vụ đám mây tự đặt)
 *  DATABASE_URL  chuỗi kết nối Postgres (vd. Neon) — có thì dùng Postgres, dùng khi ổ đĩa máy chủ không bền (Render free)
 *  DB_FILE       file SQLite khi không có DATABASE_URL (mặc định .data/game.db — ngoài thư mục server/ để chế độ
 *                tự khởi động lại khi sửa code không bị kích hoạt mỗi lần ghi cơ sở dữ liệu)
 */
const here = dirname(fileURLToPath(import.meta.url))
const dist = join(here, '..', 'dist')

const app = await startServer({
  port: Number(process.env.PORT ?? 5200),
  dbFile: process.env.DB_FILE ?? join(here, '..', '.data', 'game.db'),
  dbUrl: process.env.DATABASE_URL || null,
  staticDir: existsSync(dist) ? dist : null,
  log: (line) => console.log(line),
})
console.log(
  `Máy chủ Anh Hậu Phật Tử chạy ở cổng ${app.port} · CSDL ${app.dbKind}${existsSync(dist) ? ' · phục vụ cả game trong dist/' : ''}`,
)

const stop = async () => {
  await app.close()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
