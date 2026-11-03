import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'

// Test máy chủ (server/*.test.js) chạy môi trường node — không có DOM/localStorage, bỏ qua phần này
if (typeof window !== 'undefined') {
  const { cleanup } = await import('@testing-library/react')
  const { __resetForTests } = await import('../game/state')

  beforeEach(() => {
    localStorage.clear()
    __resetForTests()
  })

  afterEach(() => {
    cleanup()
  })
}
