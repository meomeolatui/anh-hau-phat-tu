import { useMemo } from 'react'
import Terrain from './Terrain'
import Environment from './Environment'
import { useHour } from './useHour'
import { skyAt } from './sky'
import { WALKABLES } from './layout'
import { terrainHeight } from './navigation'
import { STELES } from './steles'
import { Boulders, Forest, Paving, RampSteps, WindClock } from '../props/nature'
import Flora from '../props/flora'
import Life from '../props/life'
import { scatterFlora, scatterForest } from '../props/natureScatter'
import { Stele } from '../props/interactive'
import FarForest from '../props/FarForest'
import NightLights from '../props/NightLights'
import Cableway from '../props/Cableway'
import RestBench from '../props/RestBench'
import { BENCHES } from './benches'
import ChanNui from '../zones/ChanNui'
import DuongNui from '../zones/DuongNui'
import ChuaBa from '../zones/ChuaBa'
import ChuaHang from '../zones/ChuaHang'
import DinhNui from '../zones/DinhNui'
import { useGame } from '../state'

/** Rừng phủ sườn núi + đá tảng (tính một lần) */
function useScatter() {
  return useMemo(() => scatterForest(), [])
}

export default function World() {
  const hour = useHour()
  const quality = useGame((s) => s.save.settings.quality)
  const nightLevel = useMemo(() => skyAt(hour).night, [hour])
  const night = nightLevel > 0.5
  const { trees, rocks } = useScatter()
  // Cỏ, hoa dại, bụi mai ven lối đi — mật độ theo chất lượng
  const flora = useMemo(() => scatterFlora(quality), [quality])
  const forest = useMemo(() => [...trees, ...flora.shrubs], [trees, flora])
  const steles = useMemo(
    () => STELES.map((s) => ({ ...s, position: [s.position[0], Math.max(s.position[1], terrainHeight(s.position[0], s.position[2])), s.position[2]] })),
    [],
  )

  return (
    <>
      <Environment />
      <Terrain />
      <RampSteps />
      {WALKABLES.filter((s) => s.type !== 'ramp').map((s) => (
        <Paving key={s.id} shape={s} />
      ))}
      <WindClock />
      <Forest items={forest} castShadow={quality === 'high'} />
      <Flora grass={flora.grass} flowers={flora.flowers} />
      <Life nightLevel={nightLevel} flowers={flora.flowers} grass={flora.grass} />
      {/* Rừng xa phủ đều đồng bằng và sườn núi xa lối đi */}
      <FarForest />
      {/* Đèn lan can & đèn lồng treo trên cây — sáng khi trời tối */}
      <NightLights />
      {/* Cáp treo: dây cáp, trụ đỡ, cabin chạy thật */}
      <Cableway />
      {/* Ghế đá nghỉ chân (hồi thể lực nhanh) */}
      {BENCHES.map((b) => (
        <RestBench key={b.id} id={b.id} position={b.position} rotY={b.rotY} />
      ))}
      <Boulders items={rocks} castShadow={quality !== 'low'} />
      {steles.map((s) => (
        <Stele key={s.id} id={s.id} position={s.position} rotY={s.rotY} quoteId={s.quoteId} />
      ))}
      <ChanNui night={night} />
      <DuongNui night={night} />
      <ChuaBa night={night} />
      <ChuaHang night={night} />
      <DinhNui night={night} />
    </>
  )
}
