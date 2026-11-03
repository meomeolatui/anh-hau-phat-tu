import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, CanvasTexture, Color, MeshBasicMaterial, Vector3 } from 'three'
import { sunDisplayDirection } from './sky'

/**
 * Mặt trời trên bầu trời: đĩa sáng + quầng toả, đi theo giờ trong game (mọc đông, lặn tây),
 * cùng hướng với ánh nắng đổ bóng. Luôn ở rất xa, bám theo camera như bầu trời.
 * Gần bình minh/hoàng hôn: to hơn, ngả cam đỏ; khuất dưới chân trời thì ẩn.
 */

const DIST = 780

/** Texture quầng sáng tròn mờ dần (null nếu không có canvas — vd. môi trường test) */
function haloTexture() {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext?.('2d')
  if (!ctx) return null
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.18, 'rgba(255,255,255,0.65)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.18)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new CanvasTexture(c)
}

/** Màu đĩa mặt trời theo độ cao: trắng vàng giữa trưa → cam đỏ khi sát chân trời */
function sunColorFor(elevation) {
  const noon = new Color('#fff4d6')
  const low = new Color('#ff8a3d')
  const t = Math.max(0, Math.min(1, elevation / 0.45))
  return low.lerp(noon, t)
}

export default function Sun({ hour }) {
  const group = useRef()
  // Hướng hiển thị: giữ phương vị thật (mọc đông, lặn tây) nhưng hạ độ cao xuống tối đa ~20°
  // để người chơi thấy được mặt trời trong khung hình góc nhìn thứ ba (nắng đổ bóng vẫn theo hướng thật)
  const dir = useMemo(() => new Vector3(...sunDisplayDirection(hour)), [hour])
  const color = useMemo(() => sunColorFor(dir.y), [dir])
  const halo = useMemo(() => haloTexture(), [])

  const discMat = useMemo(
    () => new MeshBasicMaterial({ color: '#ffffff', fog: false, toneMapped: false, depthWrite: false }),
    [],
  )
  const haloMat = useMemo(
    () =>
      new MeshBasicMaterial({
        map: halo,
        color: '#ffffff',
        transparent: true,
        opacity: 0.85,
        blending: AdditiveBlending,
        fog: false,
        toneMapped: false,
        depthWrite: false,
      }),
    [halo],
  )
  // Bám theo camera như bầu trời; luôn quay mặt về camera
  useFrame(({ camera }) => {
    const g = group.current
    if (!g) return
    discMat.color.copy(color).multiplyScalar(1.6) // sáng hơn 1 để bloom (nếu bật) làm loá nhẹ
    haloMat.color.copy(color)
    g.position.copy(camera.position).addScaledVector(dir, DIST)
    g.quaternion.copy(camera.quaternion)
  })

  // Khuất hẳn dưới chân trời thì không vẽ
  if (dir.y < -0.06) return null
  // Sát chân trời mặt trời trông to hơn (ảo giác tự nhiên khi mọc/lặn)
  const size = 26 + Math.max(0, 0.25 - dir.y) * 40
  const fade = Math.min(1, (dir.y + 0.06) / 0.1)

  return (
    <group ref={group} renderOrder={-1}>
      {halo && (
        <mesh material={haloMat} scale={size * 7 * fade}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      )}
      <mesh material={discMat} scale={size * fade}>
        <circleGeometry args={[0.5, 40]} />
      </mesh>
    </group>
  )
}
