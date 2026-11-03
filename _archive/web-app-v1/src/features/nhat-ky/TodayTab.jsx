import { useStore } from '../../lib/store'
import { getDay } from '../../lib/actions'
import DayBar from './DayBar'
import DeedsCard from './DeedsCard'
import MoodPicker from './MoodPicker'
import ReflectionCard from './ReflectionCard'
import Suggestions from './Suggestions'

/** Tab "Hôm nay": ghi việc lành, cảm nhận và tự vấn cho ngày đang chọn (mặc định hôm nay). */
export default function TodayTab({ dayKey, today, onChangeDay }) {
  // Chọn đúng tham chiếu của ngày trong store — không tạo object mới trong selector
  const stored = useStore((s) => s.logs[dayKey])
  const goal = useStore((s) => s.profile.goals.thienHanh)
  const day = stored ?? getDay({}, dayKey)
  const isToday = dayKey === today

  return (
    <div className="space-y-5">
      <DayBar dayKey={dayKey} today={today} day={day} onChange={onChangeDay} />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <DeedsCard dayKey={dayKey} isToday={isToday} deeds={day.thienHanh} goal={goal} />
          <Suggestions key={dayKey} dayKey={dayKey} isToday={isToday} deeds={day.thienHanh} />
        </div>
        <div className="space-y-5 lg:col-span-2">
          <MoodPicker dayKey={dayKey} mood={day.mood} isToday={isToday} />
          <ReflectionCard key={dayKey} dayKey={dayKey} note={day.note} isToday={isToday} />
        </div>
      </div>
    </div>
  )
}
