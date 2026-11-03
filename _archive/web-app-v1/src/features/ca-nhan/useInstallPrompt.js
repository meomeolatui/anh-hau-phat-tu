import { useCallback, useEffect, useState } from 'react'
import { installMode, isIOSDevice, isStandaloneDisplay } from './install'

/**
 * Lắng nghe `beforeinstallprompt` (Chrome/Edge/Android) để hiện nút cài đặt của riêng ứng dụng.
 * Trả về { mode, install } — install() resolve 'accepted' | 'dismissed' | 'unavailable'.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [installed, setInstalled] = useState(() => isStandaloneDisplay())

  useEffect(() => {
    const onPrompt = (e) => {
      // Chặn banner mặc định để người dùng tự chọn thời điểm cài
      e.preventDefault()
      setDeferred(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferred) return 'unavailable'
    deferred.prompt()
    const choice = await deferred.userChoice
    // Sự kiện chỉ dùng được một lần
    setDeferred(null)
    if (choice?.outcome === 'accepted') setInstalled(true)
    return choice?.outcome ?? 'dismissed'
  }, [deferred])

  const mode = installMode({ installed, canPrompt: Boolean(deferred), ios: isIOSDevice() })
  return { mode, install }
}
