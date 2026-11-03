/**
 * Đồng hồ bấm giờ theo mốc Date.now() — thuần, bất biến.
 * Không cộng dồn từ setInterval vì trình duyệt bóp nhịp hẹn giờ khi tab ẩn/màn hình tắt;
 * thay vào đó lưu "thời gian đã tích luỹ" + "đang chạy từ mốc nào".
 * clock = { accumulatedMs, since: number | null }
 */

export function startClock(now) {
  return { accumulatedMs: 0, since: now }
}

export function elapsedMs(clock, now) {
  if (!clock) return 0
  const running = clock.since == null ? 0 : Math.max(0, now - clock.since)
  return clock.accumulatedMs + running
}

export function isRunning(clock) {
  return Boolean(clock && clock.since != null)
}

export function pauseClock(clock, now) {
  if (!isRunning(clock)) return clock
  return { accumulatedMs: elapsedMs(clock, now), since: null }
}

export function resumeClock(clock, now) {
  if (!clock || isRunning(clock)) return clock
  return { ...clock, since: now }
}
