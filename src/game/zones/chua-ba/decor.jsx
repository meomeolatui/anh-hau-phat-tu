import { useLayoutEffect, useRef } from 'react'
import { Object3D } from 'three'
import { PALETTE, glow, toon } from '../../materials'

/** Đồ trang trí tĩnh riêng của khu Chùa Bà (toạ độ cục bộ, đặt trong <group position={O}>) */

// Cờ Phật giáo: năm sắc xanh – vàng – đỏ – trắng – cam
const FLAG_COLORS = ['#2f6db5', '#f2c230', '#c8322b', '#f5f2ea', '#e8862d']
const STRIPE = 0.26
const FLAG_H = 1.3

/** Cột cờ Phật giáo: năm sọc dọc + sọc thứ sáu gồm năm màu xếp ngang */
export function BuddhistFlag({ position, height = 6.2 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} material={toon(PALETTE.stoneDark)} castShadow>
        <cylinderGeometry args={[0.3, 0.36, 0.3, 8]} />
      </mesh>
      <mesh position={[0, height / 2, 0]} material={toon(PALETTE.woodDark)} castShadow>
        <cylinderGeometry args={[0.05, 0.07, height, 6]} />
      </mesh>
      <mesh position={[0, height + 0.08, 0]} material={toon(PALETTE.gold)}>
        <sphereGeometry args={[0.1, 8, 6]} />
      </mesh>
      <group position={[0.08, height - 0.25 - FLAG_H / 2, 0]}>
        {FLAG_COLORS.map((c, i) => (
          <mesh key={c} position={[STRIPE * (i + 0.5), 0, 0]} material={toon(c)}>
            <boxGeometry args={[STRIPE, FLAG_H, 0.02]} />
          </mesh>
        ))}
        {FLAG_COLORS.map((c, i) => (
          <mesh key={`h${c}`} position={[STRIPE * 5.5, FLAG_H / 2 - (FLAG_H / 5) * (i + 0.5), 0]} material={toon(c)}>
            <boxGeometry args={[STRIPE, FLAG_H / 5, 0.02]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/**
 * Đèn lồng giấy treo KHÔNG kèm pointLight (chỉ đổi sang vật liệu phát sáng khi `lit`).
 * Dùng cho các đèn phụ để không tăng số nguồn sáng của cảnh — đèn chính dùng Lantern trong sacred.jsx.
 */
export function PaperLantern({ position, lit = false, color = '#d83a2e', hang = 0.6 }) {
  const cap = toon(PALETTE.gold)
  return (
    <group position={position}>
      <mesh position={[0, hang / 2, 0]} material={toon('#3b2a1a')}>
        <cylinderGeometry args={[0.01, 0.01, hang, 4]} />
      </mesh>
      <mesh material={lit ? glow(color) : toon(color)} scale={[1, 1.15, 1]}>
        <sphereGeometry args={[0.24, 12, 10]} />
      </mesh>
      <mesh position={[0, 0.27, 0]} material={cap}>
        <cylinderGeometry args={[0.1, 0.12, 0.06, 8]} />
      </mesh>
      <mesh position={[0, -0.27, 0]} material={cap}>
        <cylinderGeometry args={[0.12, 0.1, 0.06, 8]} />
      </mesh>
    </group>
  )
}

/** Cặp nến trên bàn thờ (ngọn lửa luôn sáng nhẹ) */
export function Candles({ y, spread, z = 0 }) {
  const wax = toon('#c8322b')
  const flame = glow('#ffc65a')
  return [-1, 1].map((s) => (
    <group key={s} position={[s * spread, y, z]}>
      <mesh position={[0, 0.06, 0]} material={toon(PALETTE.gold)}>
        <cylinderGeometry args={[0.09, 0.11, 0.12, 8]} />
      </mesh>
      <mesh position={[0, 0.27, 0]} material={wax}>
        <cylinderGeometry args={[0.045, 0.045, 0.3, 8]} />
      </mesh>
      <mesh position={[0, 0.47, 0]} material={flame}>
        <coneGeometry args={[0.035, 0.11, 6]} />
      </mesh>
    </group>
  ))
}

/** Bình hoa và mâm quả trên bàn thờ (lễ vật đồ chay) */
export function Offerings({ y, spread, z = 0 }) {
  const vase = toon(PALETTE.bronze)
  const flower = toon('#f2d36b', { flat: true })
  const plate = toon(PALETTE.gold)
  const fruit = toon('#e8862d')
  return (
    <group position={[0, y, z]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * spread, 0, 0]}>
          <mesh position={[0, 0.15, 0]} material={vase}>
            <cylinderGeometry args={[0.07, 0.1, 0.3, 8]} />
          </mesh>
          <mesh position={[0, 0.38, 0]} material={flower} scale={[1, 0.8, 1]}>
            <icosahedronGeometry args={[0.16, 0]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.03, 0]} material={plate}>
        <cylinderGeometry args={[0.24, 0.18, 0.06, 12]} />
      </mesh>
      {[
        [-0.08, 0.04],
        [0.09, 0.03],
        [0, -0.08],
      ].map(([x, zz]) => (
        <mesh key={`${x}${zz}`} position={[x, 0.13, zz]} material={fruit}>
          <sphereGeometry args={[0.08, 8, 6]} />
        </mesh>
      ))}
    </group>
  )
}

const dummy = new Object3D()

/**
 * Vách núi: các phiến đá granite cao, vẽ bằng một InstancedMesh (một draw call).
 * items: [{ x, y, z, sx, sy, sz, rot }] — tâm và nửa kích thước theo từng trục (cục bộ zone)
 */
export function CliffRocks({ items }) {
  const ref = useRef()
  useLayoutEffect(() => {
    items.forEach((r, i) => {
      dummy.position.set(r.x, r.y, r.z)
      dummy.rotation.set(0, r.rot, r.rot * 0.15)
      dummy.scale.set(r.sx, r.sy, r.sz)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [items])
  return (
    <instancedMesh ref={ref} args={[null, null, items.length]} material={toon(PALETTE.granite, { flat: true })} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
    </instancedMesh>
  )
}
