import { useCallback, useEffect, useState } from 'react'
import { Timer } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { useToast } from '../components/ui/toast-context'
import { useStore } from '../lib/store'
import { recordSession } from '../lib/actions'
import PostureGuide from '../features/thien/PostureGuide'
import SessionOverlay from '../features/thien/SessionOverlay'
import SetupCard from '../features/thien/SetupCard'
import { RecentSessions, TodayCard } from '../features/thien/StatsPanel'
import { loadPrefs, savePrefs } from '../features/thien/prefs'
import { humanDuration, shouldRecord } from '../features/thien/summary'

export default function Thien() {
  const toast = useToast()
  const soundOn = useStore((s) => s.settings.sound)
  const [prefs, setPrefs] = useState(loadPrefs)
  // Cấu hình được "chụp" lúc bấm bắt đầu — đổi tuỳ chọn sau đó không ảnh hưởng buổi đang ngồi
  const [running, setRunning] = useState(null)

  useEffect(() => {
    savePrefs(prefs)
  }, [prefs])

  const updatePrefs = (patch) => setPrefs((p) => ({ ...p, ...patch }))

  const handleComplete = useCallback(
    (sec) => {
      if (!shouldRecord(sec)) return
      recordSession({ type: 'thien', duration: sec })
      toast({ title: 'Đã ghi vào nhật ký', description: `Buổi ngồi ${humanDuration(sec)}.` })
    },
    [toast],
  )

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Tĩnh tâm"
        title="Thiền định"
        subtitle="Ngồi yên, theo dõi hơi thở. Không cần đạt được gì — chỉ cần có mặt trọn vẹn với giây phút này."
        icon={Timer}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SetupCard prefs={prefs} onChange={updatePrefs} onStart={() => setRunning({ ...prefs })} soundOn={soundOn} />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <TodayCard />
          <RecentSessions />
        </div>
      </div>

      <div className="mt-6">
        <PostureGuide />
      </div>

      {running && <SessionOverlay config={running} onComplete={handleComplete} onClose={() => setRunning(null)} />}
    </div>
  )
}
