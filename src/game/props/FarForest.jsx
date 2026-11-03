import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, Object3D } from 'three'
import { PALETTE, toon } from '../materials'
import { useGame } from '../state'
import { farForest } from './farForestLayout'

/**
 * Rừng xa phủ đều quanh núi — 3 InstancedMesh (thân, tán chính, tán phụ) cho hàng nghìn cây.
 * Không đổ bóng (ở xa, sương mù che) để giữ hiệu năng; mỗi cây một tông màu.
 * Mật độ theo chất lượng: Nhẹ 14 m · Tự động 10 m · Đẹp 8 m.
 */

const dummy = new Object3D()

export default function FarForest() {
  const quality = useGame((s) => s.save.settings.quality)
  const spacing = quality === 'low' ? 14 : quality === 'high' ? 8 : 10
  const trees = useMemo(() => farForest({ spacing }), [spacing])
  const trunk = useRef()
  const crown = useRef()
  const crown2 = useRef()

  useLayoutEffect(() => {
    const color = new Color()
    trees.forEach((t, i) => {
      dummy.position.set(t.x, t.y + 1.2 * t.scale, t.z)
      dummy.rotation.set(0, t.rot, 0)
      dummy.scale.setScalar(t.scale)
      dummy.updateMatrix()
      trunk.current.setMatrixAt(i, dummy.matrix)

      dummy.position.set(t.x, t.y + 3.3 * t.scale, t.z)
      dummy.scale.set(2.1 * t.scale, 1.7 * t.scale, 2.1 * t.scale)
      dummy.updateMatrix()
      crown.current.setMatrixAt(i, dummy.matrix)
      crown.current.setColorAt(i, color.set(t.color))

      const c = Math.cos(t.rot)
      const s = Math.sin(t.rot)
      dummy.position.set(t.x + 1.1 * c * t.scale, t.y + 2.8 * t.scale, t.z - 1.1 * s * t.scale)
      dummy.scale.set(1.3 * t.scale, 1.1 * t.scale, 1.3 * t.scale)
      dummy.updateMatrix()
      crown2.current.setMatrixAt(i, dummy.matrix)
      crown2.current.setColorAt(i, color.set(t.color).offsetHSL(0, 0, -0.07))
    })
    for (const m of [trunk, crown, crown2]) m.current.instanceMatrix.needsUpdate = true
    crown.current.instanceColor.needsUpdate = true
    crown2.current.instanceColor.needsUpdate = true
    // Cập nhật khối bao để camera cắt bỏ đúng (instanced trải rộng hàng trăm mét)
    for (const m of [trunk, crown, crown2]) m.current.computeBoundingSphere()
  }, [trees])

  const crownMat = toon('#ffffff')
  return (
    <group name="rung-xa">
      <instancedMesh key={`t${trees.length}`} ref={trunk} args={[null, null, trees.length]} material={toon(PALETTE.trunk)}>
        <cylinderGeometry args={[0.14, 0.24, 2.4, 5]} />
      </instancedMesh>
      <instancedMesh key={`c${trees.length}`} ref={crown} args={[null, null, trees.length]} material={crownMat}>
        <icosahedronGeometry args={[1, 0]} />
      </instancedMesh>
      <instancedMesh key={`d${trees.length}`} ref={crown2} args={[null, null, trees.length]} material={crownMat}>
        <icosahedronGeometry args={[1, 0]} />
      </instancedMesh>
    </group>
  )
}
