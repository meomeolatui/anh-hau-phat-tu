import { useLayoutEffect, useMemo, useRef } from 'react'
import { BufferAttribute, BufferGeometry, Color, IcosahedronGeometry, MeshToonMaterial, Object3D } from 'three'
import { nearestWalkable } from './navigation'
import { PALETTE, toon, toonGradient } from '../materials'
import { getTexture } from '../textures'
import { useGame } from '../state'
import { TERRAIN_GRID, gridHeight } from './terrainGrid'
import { outcropSpots } from './outcrops'
import { fbm, valueNoise } from './noise'

/**
 * Địa hình núi: lưới độ cao dựng từ terrainGrid (khớp các mặt đi được + gồ ghề chi tiết),
 * tô màu theo vùng: lối đá, cỏ chân núi (xanh tươi / úa vàng), đất đỏ bazan lộ ở dốc vừa,
 * rêu rừng xanh sẫm trên sườn, đá granite ở chỗ dốc/cao. Texture cỏ/granite chiếu theo toạ độ thế giới XZ,
 * pha theo thuộc tính aRock. Thêm các mỏm đá lộ (instanced) ở sườn dốc.
 */

const BOUNDS = TERRAIN_GRID
const CELL = TERRAIN_GRID.cell
/** Mét cho một lần lặp texture cỏ (đá dùng gấp đôi) */
const UV_SCALE = 5

const C = {
  stone: new Color(PALETTE.stone),
  stoneDark: new Color(PALETTE.stoneDark),
  soil: new Color('#b29a74'),
  grassLush: new Color('#6fa451'),
  grass: new Color(PALETTE.grass),
  grassDry: new Color('#adb866'),
  laterite: new Color('#a65f3d'),
  lateriteDark: new Color('#874a30'),
  moss: new Color('#3d7040'),
  mossDark: new Color('#2c5634'),
  forestLight: new Color(PALETTE.leaf),
  rock: new Color(PALETTE.granite),
  rockDark: new Color(PALETTE.graniteDark),
  rockLight: new Color('#9b968a'),
}

const smooth = (e0, e1, x) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

const tmp = new Color()
const tmp2 = new Color()

/** Màu + độ "đá" (0..1, chọn texture) của một đỉnh địa hình */
function shade(x, z, y, slope, dist) {
  if (dist <= 0.6) {
    tmp.copy(C.stone).lerp(C.stoneDark, valueNoise(x * 0.7, z * 0.7) * 0.5)
    return 0.6
  }
  const n1 = fbm(x, z, 22, 2)
  const n2 = valueNoise(x * 0.35, z * 0.35)
  // Nền theo độ cao: cỏ chân núi → rừng rêu sẫm
  tmp.copy(C.grassLush).lerp(C.grassDry, smooth(0.45, 0.75, n1))
  tmp2.copy(C.mossDark).lerp(C.forestLight, smooth(0.3, 0.85, n1) * 0.7)
  tmp.lerp(tmp2, smooth(2, 7, y))
  // Đất đỏ bazan lộ ở dốc vừa (theo mảng)
  const laterite = smooth(0.42, 0.75, slope) * smooth(0.35, 0.6, n2) * (1 - smooth(40, 52, y))
  tmp.lerp(tmp2.copy(C.laterite).lerp(C.lateriteDark, n1), laterite * 0.8)
  // Granite ở chỗ dốc hoặc trên cao
  const rock = Math.max(smooth(0.75, 1.1, slope), smooth(44, 56, y))
  tmp2.copy(C.rock).lerp(C.rockDark, n2).lerp(C.rockLight, smooth(50, 70, y) * 0.5)
  tmp.lerp(tmp2, rock)
  // Đất nện ven lối đi
  tmp.lerp(C.soil, (1 - smooth(0.6, 2.4, dist)) * 0.55 * (1 - rock))
  // Sáng tối nhẹ theo nhiễu mịn để mặt đất không phẳng màu
  tmp.multiplyScalar(0.94 + valueNoise(x * 1.3, z * 1.3) * 0.12)
  return Math.max(rock, laterite * 0.35)
}

function buildGeometry() {
  const nx = Math.round((BOUNDS.x1 - BOUNDS.x0) / CELL) + 1
  const nz = Math.round((BOUNDS.z1 - BOUNDS.z0) / CELL) + 1
  const pos = new Float32Array(nx * nz * 3)
  const uv = new Float32Array(nx * nz * 2)
  const heights = new Float32Array(nx * nz)
  const dist = new Float32Array(nx * nz)

  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = BOUNDS.x0 + i * CELL
      const z = BOUNDS.z0 + j * CELL
      const k = j * nx + i
      // Cùng nguồn với groundSurface() → đồ đặt theo mặt lưới luôn khớp mesh
      const y = gridHeight(i, j)
      heights[k] = y
      dist[k] = nearestWalkable(x, z).dist
      pos[k * 3] = x
      pos[k * 3 + 1] = y
      pos[k * 3 + 2] = z
      uv[k * 2] = x / UV_SCALE
      uv[k * 2 + 1] = z / UV_SCALE
    }
  }

  // Màu theo độ dốc + độ cao + lối đi
  const col = new Float32Array(nx * nz * 3)
  const rockAttr = new Float32Array(nx * nz)
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i
      const hL = heights[j * nx + Math.max(0, i - 1)]
      const hR = heights[j * nx + Math.min(nx - 1, i + 1)]
      const hD = heights[Math.max(0, j - 1) * nx + i]
      const hU = heights[Math.min(nz - 1, j + 1) * nx + i]
      const slope = Math.hypot(hR - hL, hU - hD) / (2 * CELL)
      rockAttr[k] = shade(pos[k * 3], pos[k * 3 + 2], heights[k], slope, dist[k])
      col[k * 3] = tmp.r
      col[k * 3 + 1] = tmp.g
      col[k * 3 + 2] = tmp.b
    }
  }

  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6)
  let p = 0
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i
      const b = a + 1
      const c = a + nx
      const d = c + 1
      // Đổi hướng đường chéo xen kẽ cho mặt low-poly tự nhiên hơn (khớp groundSurface)
      if ((i + j) % 2 === 0) {
        idx.set([a, c, b, b, c, d], p)
      } else {
        idx.set([a, c, d, a, d, b], p)
      }
      p += 6
    }
  }

  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3))
  g.setAttribute('color', new BufferAttribute(col, 3))
  g.setAttribute('uv', new BufferAttribute(uv, 2))
  g.setAttribute('aRock', new BufferAttribute(rockAttr, 1))
  g.setIndex(new BufferAttribute(idx, 1))
  // Bỏ chỉ số → mỗi tam giác có pháp tuyến riêng → mặt núi phẳng từng mảng kiểu low-poly
  const flat = g.toNonIndexed()
  flat.computeVertexNormals()
  flat.computeBoundingSphere()
  g.dispose()
  return flat
}

let terrainMat = null

/**
 * Vật liệu địa hình (tạo một lần): toon + màu đỉnh; texture cỏ và granite pha theo aRock.
 * Không có canvas (test) → chỉ dùng màu đỉnh.
 */
function terrainMaterial() {
  if (terrainMat) return terrainMat
  const grass = getTexture('grass')
  const granite = getTexture('granite')
  const m = new MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: toonGradient() })
  if (grass && granite) {
    m.map = grass
    m.onBeforeCompile = (shader) => {
      shader.uniforms.rockMap = { value: granite }
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aRock;\nvarying float vRock;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRock = aRock;')
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D rockMap;\nvarying float vRock;')
        .replace(
          '#include <map_fragment>',
          `#ifdef USE_MAP
            vec4 grassTexel = texture2D( map, vMapUv );
            vec4 rockTexel = texture2D( rockMap, vMapUv * 0.5 );
            diffuseColor *= mix( grassTexel, rockTexel, clamp( vRock, 0.0, 1.0 ) );
          #endif`,
        )
    }
    m.customProgramCacheKey = () => 'terrain-grass-rock'
  }
  terrainMat = m
  return m
}

/* ---------------- Mỏm đá lộ trên sườn dốc ---------------- */

const dummy = new Object3D()

/** Khối đá low-poly gồ ghề (icosahedron chi tiết 1, đỉnh xô lệch theo vị trí → mặt vẫn kín) */
function rockGeometry() {
  const g = new IcosahedronGeometry(1, 1)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const z = p.getZ(i)
    const k = 0.78 + valueNoise(x * 3.1 + 11, z * 3.1 + y * 5.3) * 0.4
    // dẹt đáy, gồ đỉnh: mỏm đá nhô khỏi sườn núi
    p.setXYZ(i, x * k, (y > 0 ? y * 0.75 : y * 0.45) * k, z * k)
  }
  g.computeVertexNormals()
  return g
}

function Outcrops({ castShadow }) {
  const items = useMemo(() => outcropSpots(), [])
  const geometry = useMemo(() => rockGeometry(), [])
  const material = toon(PALETTE.granite, { map: 'granite', repeat: [2, 2] })
  const ref = useRef()
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const c = new Color()
    items.forEach((r, i) => {
      dummy.position.set(r.x, r.y, r.z)
      dummy.rotation.set(r.tilt, r.ry, r.tilt * 0.6)
      dummy.scale.set(r.s * 1.35, r.s * 0.8, r.s * 1.1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, c.setScalar(r.shade))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items])
  if (!items.length) return null
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} receiveShadow />
}

export default function Terrain() {
  const quality = useGame((s) => s.save.settings.quality)
  const geometry = useMemo(() => buildGeometry(), [])
  const material = terrainMaterial()
  const plain = toon('#7fa95a')
  return (
    <group>
      <mesh geometry={geometry} material={material} receiveShadow />
      <Outcrops castShadow={quality !== 'low'} />
      {/* Đồng bằng xa tít — sương mù sẽ che mép */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.6, -120]} material={plain}>
        <circleGeometry args={[900, 48]} />
      </mesh>
    </group>
  )
}
