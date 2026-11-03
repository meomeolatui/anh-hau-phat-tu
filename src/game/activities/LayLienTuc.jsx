import { useEffect, useRef, useState } from 'react'
import { Coins, HandHeart, Pause, Play } from 'lucide-react'
import Panel, { ActionButton } from './Panel'
import { useActivityPose } from './useActivityPose'
import { emit, setPlayerAnim } from '../runtime'
import { addMerit, addStat, addXu } from '../state'
import { playBell, playMo } from '../../lib/sound'
import { cn } from '../../lib/cn'
import { AUTO_BOW_MS, BOWS_PER_XU, MERIT_PER_AUTO_BOW, bowsAfter, xuGained } from './layLienTucLogic'

// Ba lạy một vòng: quy y Phật – Pháp – Tăng, trọn vòng thì hồi hướng (được 1 xu)
const REFUGES = ['Phật', 'Pháp', 'Tăng']

/**
 * Qui y hồi hướng (chiếu chính giữa chánh điện chùa Bà): bấm bắt đầu là nhân vật tự lạy mãi theo nhịp 3 giây,
 * không cần thao tác. Mỗi vòng ba lạy (quy y Phật, Pháp, Tăng) rồi hồi hướng → 1 xu (+ chút công đức mỗi lạy).
 * Tạm dừng / tiếp tục tuỳ ý; đóng bảng là đứng dậy.
 * params: { altarId, name, stand, face }
 */
export default function LayLienTuc({ params, onClose }) {
  const { name, stand, face } = params
  useActivityPose({ anim: 'pray', stand, face })
  const [running, setRunning] = useState(false)
  const [bows, setBows] = useState(0) // tổng lạy trong lượt này
  const [xu, setXu] = useState(0)
  const startAt = useRef(0)
  const carried = useRef(0) // số lạy trước lần tiếp tục gần nhất
  const counted = useRef(0) // số lạy đã ghi nhận (đã cộng xu/công đức)

  useEffect(() => {
    if (!running) return
    startAt.current = Date.now()
    setPlayerAnim('bow')
    const id = setInterval(() => {
      const total = carried.current + bowsAfter(Date.now() - startAt.current)
      const fresh = total - counted.current
      if (fresh <= 0) return
      const gain = xuGained(counted.current, total)
      counted.current = total
      addStat('lay', fresh)
      addMerit(MERIT_PER_AUTO_BOW * fresh, 'Lạy Phật', stand)
      playMo({ volume: 0.35 })
      if (gain > 0) {
        addXu(gain)
        playBell({ pitch: 330 })
        emit('toast', { title: `Hồi hướng · +${gain} xu`, description: `Trọn ${Math.floor(total / BOWS_PER_XU)} vòng quy y Tam Bảo (${total} lạy).` })
      }
      setBows(total)
      setXu((x) => x + gain)
    }, 200)
    return () => {
      clearInterval(id)
      // Giữ phần đã lạy trọn để lần tiếp tục đếm nối tiếp
      carried.current = counted.current
      setPlayerAnim('pray')
    }
  }, [running, stand])

  const toNext = BOWS_PER_XU - (bows % BOWS_PER_XU)

  return (
    <Panel title="Qui y hồi hướng" subtitle={name} onClose={onClose}>
      <p className="mb-3 text-sm text-stone-600">
        Bấm bắt đầu, nhân vật tự lạy theo nhịp {AUTO_BOW_MS / 1000} giây một lạy — không cần thao tác. Ba lạy là một vòng quy y{' '}
        <b>Phật · Pháp · Tăng</b>, trọn vòng thì hồi hướng và được <b>1 xu</b>; mỗi lạy thêm {MERIT_PER_AUTO_BOW} công đức.
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-gradient-to-b from-saffron-50 to-lotus-50 px-4 py-3 text-center">
          <p className="font-serif text-3xl font-semibold text-stone-900 tabular-nums">{bows}</p>
          <p className="text-xs text-stone-500">lạy lượt này</p>
        </div>
        <div className="rounded-2xl bg-saffron-50 px-4 py-3 text-center">
          <p className="flex items-center justify-center gap-1.5 font-serif text-3xl font-semibold text-saffron-800 tabular-nums">
            <Coins className="h-6 w-6" aria-hidden />+{xu}
          </p>
          <p className="text-xs text-saffron-800">xu đã nhận</p>
        </div>
      </div>

      {/* Vòng quy y: Phật → Pháp → Tăng (sáng dần theo số lạy trong vòng) */}
      <div className="mb-4 flex items-center justify-center gap-2" aria-label={`Còn ${toNext} lạy nữa trọn vòng, được 1 xu`}>
        {REFUGES.map((r, i) => (
          <span
            key={r}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold transition',
              i < bows % BOWS_PER_XU ? 'bg-saffron-500 text-white' : 'bg-stone-100 text-stone-500',
            )}
          >
            Quy y {r}
          </span>
        ))}
      </div>

      {running ? (
        <ActionButton tone="ghost" className="w-full" onClick={() => setRunning(false)}>
          <Pause className="h-5 w-5" /> Tạm dừng
        </ActionButton>
      ) : (
        <ActionButton tone="saffron" className="w-full" onClick={() => setRunning(true)}>
          {bows > 0 ? <Play className="h-5 w-5" /> : <HandHeart className="h-5 w-5" />} {bows > 0 ? 'Tiếp tục' : 'Bắt đầu qui y'}
        </ActionButton>
      )}
      <p className="mt-2 text-center text-xs text-stone-500">{running ? 'Đang lạy… Thân cúi xuống, tâm khiêm hạ.' : 'Đóng bảng để đứng dậy.'}</p>
    </Panel>
  )
}
