import { useEffect, useMemo } from 'react'
import { PALETTE, glow, toon } from '../materials'
import { vcMat } from './geom'
import { buildDecor } from './decorGeometry'

/**
 * ĐỒ TRANG TRÍ dùng chung cho các zone (set dressing): chậu bonsai men lam, chậu sen, lu nước có gáo, bàn ghế đá,
 * luống hoa viền gạch, hòn non bộ có thác, dây phướn ngũ sắc, đèn lồng dây, kệ dép, bảng nội quy, thùng công đức,
 * giỏ tre, chồng ngói gạch, bó củi, ghế băng, rào tre, rào đá, cổng phụ, bảo tháp nhỏ, chuông gió, bia nhỏ.
 *  - Hình học các món: decorGeometry.js (thuần, test được). Mặt bằng & vật cản: decorKinds.js.
 *  - Mỗi zone khai báo danh sách món (toạ độ, tham số) trong file dữ liệu của zone rồi đặt một <DecorSet>.
 */

/**
 * Bày cả một khu đồ trang trí — tối đa 4 draw call.
 * items: toạ độ trong hệ của group cha (thường là <group position={O}> của zone). night: đèn lồng phát sáng.
 */
export function DecorSet({ items, night = false, castShadow = true }) {
  const geo = useMemo(() => buildDecor(items), [items])
  useEffect(() => () => Object.values(geo).forEach((g) => g?.dispose()), [geo])
  return (
    <group>
      {geo.base && <mesh geometry={geo.base} material={vcMat()} castShadow={castShadow} receiveShadow />}
      {geo.water && <mesh geometry={geo.water} material={toon(PALETTE.water)} />}
      {geo.lamp && <mesh geometry={geo.lamp} material={night ? glow('#ff5a3c', 1, 1.5) : toon('#d23a2c')} />}
      {geo.warm && <mesh geometry={geo.warm} material={night ? glow('#ffc65a', 1, 1.6) : toon('#e9b44c')} />}
    </group>
  )
}
