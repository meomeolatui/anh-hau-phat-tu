import { useEffect, useMemo, useState } from 'react'
import { Coins, RotateCcw } from 'lucide-react'
import Panel from './Panel'
import { useActivityPose } from './useActivityPose'
import { STALLS } from '../shop/items'
import WardrobeList from '../shop/WardrobeList'
import { setTryOn, useGame } from '../state'
import { runtime } from '../runtime'

/**
 * Sạp y phục dưới chân núi: mặc thử rồi mua cà sa, áo Tây Du Ký, nón lá, mũ mão bằng xu.
 * Nhân vật quay lưng về sạp, nhìn ra lối đi; camera đứng đối diện (Hud: khung hình thử đồ),
 * khung cảnh xung quanh được làm mờ (FittingBlur). Nút "Xem phía sau" xoay người để ngắm áo choàng, binh khí.
 * params: { stallId, stand, face }
 */
export default function YPhuc({ params, onClose }) {
  const { stallId, stand, face } = params
  // Nhìn ra phía ngược với sạp (đối xứng điểm sạp qua chỗ đứng)
  const outward = useMemo(() => [2 * stand[0] - face[0], stand[1], 2 * stand[2] - face[2]], [stand, face])
  useActivityPose({ anim: 'idle', stand, face: outward })
  const stall = STALLS[stallId]
  const xu = useGame((s) => s.save.xu)
  const [back, setBack] = useState(false)
  // Rời sạp thì cởi đồ đang mặc thử
  useEffect(() => () => setTryOn(null), [])

  const turn = () => {
    // Xoay người 180° và đổi góc camera tương ứng → camera đứng yên, thấy lưng nhân vật
    const p = runtime.player
    p.rotY += Math.PI
    const f = runtime.camera.frame
    if (f) {
      f.yawOffset = back ? Math.PI : 0
      f.userRotated = false
      runtime.camera.yaw = p.rotY + f.yawOffset
    }
    setBack(!back)
  }

  return (
    <Panel title={stall.name} subtitle={`${stall.seller}: "Thử đi con, vừa ý rồi hãy mua"`} onClose={onClose}>
      <div className="mb-3 flex items-center gap-2">
        <p className="flex min-w-0 flex-1 items-center gap-1.5 rounded-2xl bg-saffron-50 px-3 py-2.5 text-sm font-medium whitespace-nowrap text-saffron-900">
          <Coins className="h-4 w-4 shrink-0" aria-hidden />
          <b className="tabular-nums">{xu}</b> xu
        </p>
        <button
          type="button"
          onClick={turn}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-2xl bg-stone-900/5 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-900/10"
        >
          <RotateCcw className="h-4 w-4" aria-hidden /> {back ? 'Xem phía trước' : 'Xem phía sau'}
        </button>
      </div>
      <WardrobeList shop seller={stall.seller} />
    </Panel>
  )
}
