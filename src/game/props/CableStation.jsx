import { useMemo } from 'react'
import { useInteractable } from '../interaction'
import { startActivity } from '../state'
import { CABLE_STATIONS } from '../world/layout'
import { PALETTE, toon } from '../materials'
import { cached, vcMat } from './geom'
import { useDetail } from './detail'
import { buildCabin, buildCableStation, cabinGlassGeo } from './marketGeometry'

/**
 * Nhà ga cáp treo hiện đại (dịch chuyển nhanh giữa chân núi – chùa Bà – đỉnh núi): khung thép, tường kính,
 * mái vòm, bánh xe cáp, cabin đang đậu. Dây cáp, trụ và cabin chạy do props/Cableway.jsx vẽ.
 * position: toạ độ THẾ GIỚI; rotY: hướng cửa ga.
 */


export function CableStation({ stationId, position, rotY = 0 }) {
  const station = CABLE_STATIONS[stationId]
  const detail = useDetail()
  // Cửa ga nằm phía trước (+Z cục bộ) 4.2 m
  const door = [position[0] + Math.sin(rotY) * 4.2, position[1], position[2] + Math.cos(rotY) * 4.2]
  useInteractable({
    id: `cap-treo:${stationId}`,
    position: door,
    radius: 2.6,
    label: station?.name ?? 'Ga cáp treo',
    verb: 'Đi cáp treo',
    onInteract: () => startActivity('cap-treo', { from: stationId }),
  })
  const geo = useMemo(() => cached(`cable-station|${detail}`, () => buildCableStation(detail)), [detail])
  const cabin = useMemo(() => cached(`cabin|${detail}`, () => buildCabin(PALETTE.lotus, detail)), [detail])
  const cabinGlass = useMemo(() => cached('cabin-glass', cabinGlassGeo), [])
  const glass = toon('#9cc9d6', { transparent: true, opacity: 0.45 })
  return (
    <>
      <group position={position} rotation-y={rotY}>
        <mesh geometry={geo.frame} material={vcMat()} castShadow receiveShadow />
        <mesh geometry={geo.roof} material={vcMat()} castShadow receiveShadow />
        <mesh geometry={geo.glass} material={glass} />
        {/* Cabin đang đậu trên ray */}
        <group position={[1.5, 1.7, 0.2]}>
          <mesh geometry={cabin} material={vcMat()} castShadow />
          <mesh geometry={cabinGlass} material={glass} scale={1.005} />
        </group>
      </group>
    </>
  )
}
