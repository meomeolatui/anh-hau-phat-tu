import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { useRef } from 'react'
import { usePointerLock } from './usePointerLock'
import { endActivity, getGame, openPanel, setScreen, startActivity, updateSettings } from '../state'
import { runtime } from '../runtime'

// jsdom không có Pointer Lock — giả lập tối thiểu
let lockedEl = null
function installPointerLock() {
  Object.defineProperty(document, 'pointerLockElement', { configurable: true, get: () => lockedEl })
  HTMLElement.prototype.requestPointerLock = vi.fn(function () {
    lockedEl = this
    document.dispatchEvent(new Event('pointerlockchange'))
    return Promise.resolve()
  })
  document.exitPointerLock = vi.fn(() => {
    lockedEl = null
    document.dispatchEvent(new Event('pointerlockchange'))
  })
  window.matchMedia = vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
}

function Harness() {
  const ref = useRef(null)
  const { locked } = usePointerLock(ref)
  return <div ref={ref} data-testid="khung" data-locked={locked} />
}

describe('khoá chuột vào khung hình', () => {
  beforeEach(() => {
    lockedEl = null
    installPointerLock()
    setScreen('game')
  })
  afterEach(() => {
    delete document.pointerLockElement
  })

  it('vào game là khoá chuột; di chuột xoay camera không cần kéo', () => {
    const { getByTestId } = render(<Harness />)
    expect(lockedEl).toBe(getByTestId('khung'))
    runtime.input.lookDX = 0
    const move = new MouseEvent('mousemove')
    Object.defineProperty(move, 'movementX', { value: 12 })
    Object.defineProperty(move, 'movementY', { value: -4 })
    act(() => document.dispatchEvent(move))
    expect(runtime.input.lookDX).toBe(12)
    expect(runtime.input.lookDY).toBe(-4)
    runtime.input.lookDX = 0
    runtime.input.lookDY = 0
  })

  it('mở hoạt động thì nhả chuột (không mở Menu), xong hoạt động thì khoá lại', () => {
    render(<Harness />)
    act(() => startActivity('y-phuc', {}))
    expect(lockedEl).toBeNull()
    expect(getGame().ui.panel).toBeNull()
    act(() => endActivity())
    expect(lockedEl).not.toBeNull()
  })

  it('Esc (trình duyệt tự nhả chuột) khi đang chơi → mở Menu tạm dừng', () => {
    vi.spyOn(document, 'hasFocus').mockReturnValue(true)
    render(<Harness />)
    act(() => {
      lockedEl = null
      document.dispatchEvent(new Event('pointerlockchange'))
    })
    expect(getGame().ui.panel).toBe('menu')
    act(() => openPanel(null))
    vi.restoreAllMocks()
  })

  it('chuột trái khi đang khoá → hiện con trỏ (không mở Menu); bấm lần nữa → khoá lại', () => {
    const { getByTestId } = render(<Harness />)
    const el = getByTestId('khung')
    const click = () => {
      const e = new MouseEvent('pointerdown', { bubbles: true, button: 0 })
      Object.defineProperty(e, 'pointerType', { value: 'mouse' })
      act(() => el.dispatchEvent(e))
    }
    expect(lockedEl).toBe(el)
    click()
    expect(lockedEl).toBeNull()
    expect(getGame().ui.panel).toBeNull()
    click()
    expect(lockedEl).toBe(el)
  })

  it('Alt+Tab (cửa sổ mất focus) → hiện chuột, không mở Menu', () => {
    const focus = vi.spyOn(document, 'hasFocus').mockReturnValue(false)
    render(<Harness />)
    act(() => window.dispatchEvent(new Event('blur')))
    expect(lockedEl).toBeNull()
    expect(getGame().ui.panel).toBeNull()
    focus.mockRestore()
  })

  it('tắt trong cài đặt thì không khoá', () => {
    act(() => updateSettings({ mouseLock: false }))
    render(<Harness />)
    expect(lockedEl).toBeNull()
  })
})
