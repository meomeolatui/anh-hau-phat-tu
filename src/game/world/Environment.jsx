import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BackSide,
  Color,
  IcosahedronGeometry,
  Matrix4,
  MeshBasicMaterial,
  MeshToonMaterial,
  Object3D,
  ShaderMaterial,
  SpriteMaterial,
  Vector3,
} from 'three'
import { useGame } from '../state'
import { runtime } from '../runtime'
import { lightDirection, moonDirection, skyAt, sunDirection, sunDisplayDirection } from './sky'
import { useHour } from './useHour'
import Sun from './Sun'
import { toonGradient } from '../materials'
import { getTexture } from '../textures'
import { skyUniforms } from '../fx/skyUniforms'
import { seeded } from '../../lib/random'
import { nearestWalkable, terrainHeight } from './navigation'

/* ---------------- Bầu trời ---------------- */

const skyShader = {
  uniforms: {
    top: { value: new Color() },
    horizon: { value: new Color() },
    fogTint: { value: new Color() },
    sunDir: { value: new Vector3(0, 1, 0) },
    sunColor: { value: new Color() },
    sunAmt: { value: 0 },
    sunLow: { value: 0 },
    moonDir: { value: new Vector3(0, 1, 0) },
    night: { value: 0 },
    time: skyUniforms.uTime,
  },
  vertexShader: /* glsl */ `
    varying vec3 vDir;
    void main() {
      vDir = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 top;
    uniform vec3 horizon;
    uniform vec3 fogTint;
    uniform vec3 sunDir;
    uniform vec3 sunColor;
    uniform float sunAmt;
    uniform float sunLow;
    uniform vec3 moonDir;
    uniform float night;
    uniform float time;
    varying vec3 vDir;

    float hash3(vec3 p) {
      p = fract(p * 0.1031);
      p += dot(p, p.zyx + 31.32);
      return fract((p.x + p.y) * p.z);
    }

    void main() {
      vec3 d = normalize(vDir);
      float h = clamp(d.y * 1.6 + 0.08, 0.0, 1.0);
      vec3 col = mix(horizon, top, pow(h, 0.75));
      // Sát chân trời hoà vào màu sương → núi xa tan vào trời, không có đường viền
      col = mix(fogTint, col, smoothstep(-0.04, 0.14, d.y));
      // Quầng nắng toả quanh mặt trời; lúc bình minh/hoàng hôn kéo thành dải ấm dọc chân trời
      float sd = max(dot(d, sunDir), 0.0);
      col += sunColor * (pow(sd, 6.0) * 0.18 + pow(sd, 40.0) * 0.3) * sunAmt;
      col = mix(col, sunColor, pow(sd, 2.5) * (1.0 - h) * 0.45 * sunLow * sunAmt);
      // Quầng trăng mờ
      float md = max(dot(d, moonDir), 0.0);
      col += vec3(0.55, 0.65, 1.0) * pow(md, 24.0) * 0.14 * night;
      // Sao lấp lánh (thủ tục, theo ô lưới trên mặt cầu)
      if (night > 0.01 && d.y > 0.0) {
        vec3 q = d * 160.0;
        vec3 cell = floor(q);
        float r = hash3(cell);
        if (r > 0.984) {
          vec3 c = cell + 0.5 + (vec3(hash3(cell + 1.3), hash3(cell + 2.7), hash3(cell + 5.1)) - 0.5) * 0.5;
          float star = 1.0 - smoothstep(0.0, 0.24, length(q - c));
          float tw = 0.55 + 0.45 * sin(time * (1.2 + hash3(cell + 9.1) * 3.5) + r * 400.0);
          col += vec3(1.0, 0.96, 0.88) * star * tw * night * smoothstep(0.0, 0.25, d.y) * 1.5;
        }
      }
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
}

let skyMaterial = null
/** Vật liệu vòm trời (một bản dùng chung, cập nhật uniform theo giờ) */
function getSkyMaterial() {
  if (!skyMaterial) skyMaterial = new ShaderMaterial({ ...skyShader, side: BackSide, depthWrite: false, fog: false })
  return skyMaterial
}

/** Cập nhật uniform bầu trời + uniform dùng chung cho mặt nước theo giờ */
function applySky(hour, sky, moonDir) {
  const u = getSkyMaterial().uniforms
  u.top.value.set(sky.top)
  u.horizon.value.set(sky.horizon)
  u.fogTint.value.set(sky.fog)
  u.sunDir.value.set(...sunDisplayDirection(hour))
  u.sunColor.value.set(sky.sunColor)
  u.sunAmt.value = Math.min(1, sky.sun / 0.5)
  const elev = sunDirection(hour)[1]
  u.sunLow.value = 1 - Math.max(0, Math.min(1, (elev - 0.05) / 0.45))
  u.moonDir.value.copy(moonDir)
  u.night.value = sky.night
  skyUniforms.uSkyTop.value.set(sky.top)
  skyUniforms.uSkyHorizon.value.set(sky.horizon)
  skyUniforms.uSunDir.value.set(...(sky.night > 0.6 ? moonDirection(hour) : sunDirection(hour))).normalize()
  skyUniforms.uSunColor.value.set(sky.night > 0.6 ? '#9fb4ff' : sky.sunColor)
  skyUniforms.uLight.value = Math.max(0.25, Math.min(1.2, sky.amb * 0.8 + sky.sun * 0.35))
  skyUniforms.uNight.value = sky.night
}

/** Vòm trời bám theo camera (luôn bao quanh người xem, không lộ mép) */
function SkyDome({ material }) {
  const ref = useRef()
  useFrame(({ camera }) => {
    if (ref.current) ref.current.position.copy(camera.position)
  })
  return (
    <mesh ref={ref} material={material} scale={950} renderOrder={-2} frustumCulled={false}>
      <sphereGeometry args={[1, 48, 24]} />
    </mesh>
  )
}

/** Mặt trăng: đĩa sáng + quầng, bám camera như bầu trời */
function Moon({ dir, visible }) {
  const ref = useRef()
  const halo = getTexture('halo')
  const discMat = useMemo(() => new MeshBasicMaterial({ color: '#fdf6dc', fog: false, toneMapped: false, depthWrite: false }), [])
  const haloMat = useMemo(
    () =>
      new MeshBasicMaterial({
        map: halo,
        color: '#9fb2ff',
        transparent: true,
        opacity: 0.55,
        blending: AdditiveBlending,
        fog: false,
        toneMapped: false,
        depthWrite: false,
      }),
    [halo],
  )
  useFrame(({ camera }) => {
    const g = ref.current
    if (!g) return
    g.position.copy(camera.position).addScaledVector(dir, 760)
    g.quaternion.copy(camera.quaternion)
  })
  if (!visible) return null
  return (
    <group ref={ref} renderOrder={-1}>
      {halo && (
        <mesh material={haloMat} scale={150}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      )}
      <mesh material={discMat} scale={20}>
        <circleGeometry args={[0.5, 32]} />
      </mesh>
    </group>
  )
}

/* ---------------- Mây ---------------- */

const CLOUDS = 34
const cloudDummy = new Object3D()

/**
 * Mây: mỗi cụm ghép từ nhiều khối tròn nhỏ (thân phồng, đáy phẳng), khối dưới/bên trong tối hơn
 * như bị các khối trên che bóng. Một instancedMesh cho toàn bộ → một draw call.
 */
function cloudPuffs() {
  const rand = seeded(77)
  const out = []
  for (let i = 0; i < CLOUDS; i++) {
    const a = (i / CLOUDS) * Math.PI * 2 + Math.sin(i * 3.1) * 0.15
    // Vành mây cách đỉnh 230–330 m: nằm ngoài toàn bộ đường đi, nhìn thấy rõ nhất từ đỉnh núi
    const r = 230 + (Math.sin(i * 7.7) * 0.5 + 0.5) * 100
    const cx = Math.cos(a) * r
    const cz = Math.sin(a) * r
    const cy = 32 + (Math.sin(i * 5.3) * 0.5 + 0.5) * 14
    const size = 9 + (Math.sin(i * 2.9) * 0.5 + 0.5) * 9
    const n = 9 + Math.floor(rand() * 7)
    const yaw = rand() * Math.PI
    for (let k = 0; k < n; k++) {
      // Dải dài theo một trục, gồ ở giữa
      const along = (rand() - 0.5) * 2.6
      const across = (rand() - 0.5) * 1.1
      const centre = 1 - Math.min(1, Math.abs(along) / 1.4)
      const s = (0.35 + rand() * 0.35) * (0.6 + centre * 0.6)
      const lift = rand() * 0.55 * centre + s * 0.3
      const ox = (along * Math.cos(yaw) - across * Math.sin(yaw)) * size
      const oz = (along * Math.sin(yaw) + across * Math.cos(yaw)) * size
      out.push({
        x: cx + ox,
        y: cy + lift * size,
        z: cz + oz,
        s: s * size,
        // khối thấp (đáy) xám hơn, khối cao sáng — giả bóng mềm giữa các khối
        shade: 0.74 + Math.min(1, lift / 0.75) * 0.26,
      })
    }
  }
  return out
}

function Clouds({ tint }) {
  const puffs = useMemo(() => cloudPuffs(), [])
  const geometry = useMemo(() => new IcosahedronGeometry(1, 1), [])
  // Vật liệu riêng (không lấy từ cache toon) vì màu bị đổi theo giờ
  const mat = useMemo(() => new MeshToonMaterial({ color: '#ffffff', gradientMap: toonGradient() }), [])
  const ref = useRef()
  useEffect(() => {
    mat.color.set(tint)
  }, [mat, tint])
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const c = new Color()
    puffs.forEach((p, i) => {
      cloudDummy.position.set(p.x, p.y, p.z)
      // đáy hơi dẹt
      cloudDummy.scale.set(p.s, p.s * 0.82, p.s)
      cloudDummy.updateMatrix()
      mesh.setMatrixAt(i, cloudDummy.matrix)
      mesh.setColorAt(i, c.setRGB(p.shade, p.shade, Math.min(1, p.shade * 1.04)))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [puffs])
  const group = useRef()
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.004
  })
  return (
    <group ref={group} position={[0, 0, -238]}>
      <instancedMesh ref={ref} args={[geometry, mat, puffs.length]} />
    </group>
  )
}

/* ---------------- Sương thung lũng ---------------- */

/** Vị trí các đám sương: thung lũng chân núi và vài khe sườn núi, xa lối đi */
function mistSpots() {
  const rand = seeded(404)
  const out = []
  for (let i = 0; i < 900 && out.length < 30; i++) {
    const x = -200 + rand() * 380
    const z = -380 + rand() * 500
    const n = nearestWalkable(x, z)
    if (n.dist < 22) continue
    const y = terrainHeight(x, z)
    const valley = y < 6
    if (!valley && (y > 34 || rand() < 0.6)) continue
    const w = valley ? 45 + rand() * 40 : 28 + rand() * 20
    out.push({ x, y: y + w * 0.12, z, w, h: w * (0.22 + rand() * 0.08), phase: rand() * 6 })
  }
  return out
}

const MIST = { mats: undefined, color: new Color('#ffffff'), amount: 0 }

/** Vật liệu sprite sương — mỗi đám một bản (để mờ dần riêng khi camera lại gần); null khi không có canvas (test) */
function getMistMaterials(count) {
  if (MIST.mats === undefined) {
    const tex = getTexture('mist')
    MIST.mats = tex
      ? Array.from({ length: count }, () => new SpriteMaterial({ map: tex, color: '#ffffff', transparent: true, depthWrite: false, fog: true, opacity: 0 }))
      : null
  }
  return MIST.mats
}

function tintMist(color, amount) {
  MIST.color.set(color)
  MIST.amount = amount
  MIST.mats?.forEach((m) => m.color.copy(MIST.color))
}

const _cam = new Vector3()

function ValleyMist({ color, amount }) {
  const spots = useMemo(() => mistSpots(), [])
  const mats = getMistMaterials(spots.length)
  useEffect(() => {
    tintMist(color, amount)
  }, [color, amount])
  const ref = useRef()
  useFrame(({ clock, camera }) => {
    const g = ref.current
    if (!g || !mats) return
    const t = clock.elapsedTime * 0.05
    _cam.copy(camera.position)
    g.children.forEach((s, i) => {
      const p = spots[i]
      // trôi rất chậm qua lại; mờ dần khi camera lại gần (không che kín màn hình)
      s.position.x = p.x + Math.sin(t + p.phase) * 6
      const d = s.position.distanceTo(_cam) - p.w * 0.3
      const k = Math.max(0, Math.min(1, (d - 12) / 35))
      mats[i].opacity = MIST.amount * k * k * (3 - 2 * k)
    })
  })
  if (!mats || amount < 0.02) return null
  return (
    <group ref={ref}>
      {spots.map((p, i) => (
        <sprite key={i} material={mats[i]} position={[p.x, p.y, p.z]} scale={[p.w, p.h, 1]} />
      ))}
    </group>
  )
}

/* ---------------- Ánh sáng ---------------- */

const SHADOW_HALF = 30
const SHADOW_SIZE = 2048
const _basis = new Matrix4()
const _basisInv = new Matrix4()
const _origin = new Vector3()
const _up = new Vector3(0, 1, 0)
const _dir = new Vector3()
const _snap = new Vector3()

export default function Environment() {
  const hour = useHour()
  const quality = useGame((s) => s.save.settings.quality)
  const sky = useMemo(() => skyAt(hour), [hour])
  const lightDir = useMemo(() => lightDirection(hour, sky), [hour, sky])
  const moonDir = useMemo(() => new Vector3(...moonDirection(hour)), [hour])
  const sunRef = useRef()

  useEffect(() => {
    applySky(hour, sky, moonDir)
  }, [sky, hour, moonDir])

  // Bóng đổ bám theo nhân vật: hộp bóng nhỏ quanh người chơi → bóng nét mà rẻ.
  // Tâm hộp bóng được làm tròn theo ô texel trong không gian ánh sáng → bóng không "bơi"/rung khi di chuyển.
  useFrame(({ clock }) => {
    // Quấn vòng mỗi giờ để số thực trong shader không mất độ chính xác khi chơi lâu
    skyUniforms.uTime.value = clock.elapsedTime % 3600
    const s = sunRef.current
    if (!s) return
    const p = runtime.player.position
    _dir.set(lightDir[0], lightDir[1], lightDir[2])
    _basis.lookAt(_origin, _dir, _up)
    _basisInv.copy(_basis).transpose()
    const texel = (SHADOW_HALF * 2) / SHADOW_SIZE
    _snap.copy(p).applyMatrix4(_basisInv)
    _snap.x = Math.round(_snap.x / texel) * texel
    _snap.y = Math.round(_snap.y / texel) * texel
    _snap.applyMatrix4(_basis)
    s.position.copy(_snap).addScaledVector(_dir, 60)
    s.target.position.copy(_snap)
    s.target.updateMatrixWorld()
  })

  const shadows = quality !== 'low'
  // Đêm: dùng ánh trăng xanh nhạt thay nắng
  const lightIntensity = Math.max(sky.sun * 2.4, sky.night * 0.5)
  const lightColor = useMemo(() => {
    const c = new Color(sky.sunColor)
    return c.lerp(new Color('#9fb4ff'), Math.min(1, sky.night * 1.4)).getStyle()
  }, [sky])
  // Mây ngả màu nắng lúc bình minh/hoàng hôn, xanh xám về đêm
  const cloudTint = useMemo(() => {
    const c = new Color('#ffffff').lerp(new Color(sky.sunColor), 0.35 * (1 - Math.min(1, sky.sun)))
    return c.lerp(new Color('#9aa6c8'), sky.night).getStyle()
  }, [sky])
  const mistColor = useMemo(() => new Color(sky.fog).lerp(new Color('#ffffff'), 0.35 * (1 - sky.night)).getStyle(), [sky])

  return (
    <>
      <color attach="background" args={[sky.fog]} />
      <fog attach="fog" args={[sky.fog, 60, 420]} />
      <SkyDome material={getSkyMaterial()} />
      <Sun hour={hour} />
      <Moon dir={moonDir} visible={sky.night > 0.3} />
      <hemisphereLight args={[sky.top, sky.ground, sky.amb * 1.05]} />
      <ambientLight intensity={sky.amb * 0.28} />
      <directionalLight
        ref={sunRef}
        color={lightColor}
        intensity={lightIntensity}
        castShadow={shadows}
        shadow-mapSize={[SHADOW_SIZE, SHADOW_SIZE]}
        shadow-camera-left={-SHADOW_HALF}
        shadow-camera-right={SHADOW_HALF}
        shadow-camera-top={SHADOW_HALF}
        shadow-camera-bottom={-SHADOW_HALF}
        shadow-camera-near={1}
        shadow-camera-far={160}
        shadow-bias={-0.0004}
        shadow-normalBias={0.035}
        shadow-radius={3}
      />
      <Clouds tint={cloudTint} />
      {quality !== 'low' && <ValleyMist color={mistColor} amount={sky.mist * 0.55} />}
    </>
  )
}
