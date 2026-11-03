import { useEffect, useMemo, useState } from 'react'
import { useGame } from '../state'
import { hourFor } from './sky'

/** Giờ hiện tại (0..24) theo cài đặt timeMode, tính lại mỗi 20 giây — đủ mượt cho chuyển ngày/đêm theo giờ thật */
export function useHour() {
  const timeMode = useGame((s) => s.save.settings.timeMode)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 20000)
    return () => clearInterval(t)
  }, [])
  // tick chỉ để kích hoạt tính lại theo đồng hồ thật
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => hourFor(timeMode), [timeMode, tick])
}
