import { useEffect } from 'react'
import { facePoint, lockPlayer, runtime } from '../runtime'

/**
 * Khi một hoạt động mở: khoá di chuyển, đưa nhân vật về vị trí đứng/ngồi (nếu có), quay mặt
 * về vật thờ và đặt hoạt ảnh. Khi đóng: trả lại trạng thái tự do.
 *
 * @param {{ anim: string, stand?: [number,number,number], face?: [number,number,number], holding?: string|null }} opts
 */
export function useActivityPose({ anim, stand, face, holding = null }) {
  useEffect(() => {
    const prevHolding = runtime.player.holding
    if (stand) runtime.player.position.set(...stand)
    if (face) facePoint(face[0], face[2])
    runtime.player.holding = holding
    lockPlayer(true, anim)
    return () => {
      runtime.player.holding = prevHolding === 'broom' ? 'broom' : null
      lockPlayer(false, 'idle')
    }
    // Chỉ chạy khi mở/đóng hoạt động; đổi tư thế giữa chừng dùng setPlayerAnim
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
