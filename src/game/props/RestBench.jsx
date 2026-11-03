import { useMemo } from 'react'
import { useColliders, useInteractable } from '../interaction'
import { startActivity } from '../state'
import { PALETTE, toon } from '../materials'

/**
 * Ghế đá nghỉ chân — ngồi để hồi thể lực nhanh (hoạt động 'nghi-ngoi').
 * position: toạ độ THẾ GIỚI trên mặt đất; rotY: hướng người ngồi nhìn ra (mặt trước ghế).
 */
const SEAT_HEIGHT = 0.45

export default function RestBench({ id, position, rotY = 0 }) {
  const [x, y, z] = position
  const fx = Math.sin(rotY)
  const fz = Math.cos(rotY)
  const params = useMemo(
    () => ({
      benchId: id,
      // Tư thế 'seated' đặt gốc nhân vật ở tâm ghế trên mặt đất (hông tự cao ngang mặt ghế)
      seat: [x, y, z],
      face: [x + fx * 3, y, z + fz * 3],
      standUp: [x + fx * 0.9, y, z + fz * 0.9],
    }),
    [id, x, y, z, fx, fz],
  )
  const colliderList = useMemo(() => [{ type: 'box', x: 0, z: 0, w: 1.9, d: 0.6, rot: rotY }], [rotY])
  useColliders(`ghe:${id}`, colliderList, position)
  useInteractable({
    id: `ghe:${id}`,
    position: params.standUp,
    radius: 1.8,
    label: 'Ghế đá',
    verb: 'Ngồi nghỉ chân',
    onInteract: () => startActivity('nghi-ngoi', params),
  })

  const stone = toon(PALETTE.stoneDark)
  const top = toon(PALETTE.stone)
  return (
    <group position={position} rotation-y={rotY}>
      <mesh position={[0, SEAT_HEIGHT - 0.06, 0]} material={top} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.12, 0.55]} />
      </mesh>
      {/* Tựa lưng thấp */}
      <mesh position={[0, SEAT_HEIGHT + 0.22, -0.24]} material={top} castShadow>
        <boxGeometry args={[1.8, 0.32, 0.08]} />
      </mesh>
      {[-0.72, 0.72].map((lx) => (
        <mesh key={lx} position={[lx, (SEAT_HEIGHT - 0.12) / 2, 0]} material={stone} castShadow>
          <boxGeometry args={[0.2, SEAT_HEIGHT - 0.12, 0.48]} />
        </mesh>
      ))}
    </group>
  )
}
