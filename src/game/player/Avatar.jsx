import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  CapsuleGeometry,
  CatmullRomCurve3,
  DoubleSide,
  MathUtils,
  MeshBasicMaterial,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import { PALETTE } from '../materials'
import { OUTFITS, SKINS } from './looks'
import { RIG, applyCarry, poseFor } from './avatarRig'
import { jumpPhase } from './jump'
import { soft, shade } from './softMaterial'
import { TORSO_PROFILE, WEAPON_BACK, lathe } from './costumeGeometry'
import { COSTUMES, HATS } from '../shop/wardrobe'
import { CostumeSkirt, CostumeTorso, HatModel, Weapon } from './Wardrobe3D'
import { hatCoversHair, wearMaterials } from './wearMaterials'

/**
 * Nhân vật liền mạch, mềm mại: thân & vạt áo tràng dựng bằng đường cong tiện tròn (lathe),
 * tay chân có khớp vai–khuỷu, hông–gối với viên khớp tròn che mối nối (không hở, không gãy),
 * tay áo loe rộng, cổ áo giao lĩnh, khuôn mặt hiền. Tư thế tính trong avatarRig.js.
 *
 * API: <Avatar source={{ anim, speed, holding, tiredness? }} profile={{ role, outfit, skin, hair, costume?, hat? }} />
 * costume/hat: id trang phục & mũ mão (shop/wardrobe.js), dựng trong Wardrobe3D.jsx.
 */

/* ---------------- Hình học dùng chung (tạo một lần cho mọi nhân vật) ---------------- */

const GEO = {
  // Thân áo: eo → ngực → vai → chân cổ, khép kín
  torso: lathe(TORSO_PROFILE),
  // Vạt áo tràng: từ hông xoè dần tới gần mắt cá, mép dưới có độ dày
  skirt: lathe([
    [0.0, 0.03],
    [0.205, 0.03],
    [0.215, -0.06],
    [0.245, -0.2],
    [0.285, -0.36],
    [0.33, -0.5],
    [0.34, -0.53],
    [0.31, -0.535],
    [0.29, -0.5],
  ]),
  // Tay áo loe: cẳng tay rộng dần về phía cổ tay
  sleeve: lathe(
    [
      [0.0, 0.02],
      [0.066, 0.02],
      [0.07, -0.05],
      [0.085, -0.15],
      [0.108, -0.24],
      [0.112, -0.255],
      [0.095, -0.25],
    ],
    20,
  ),
  ball: new SphereGeometry(1, 20, 14),
  head: new SphereGeometry(0.2, 32, 24),
  hairCap: new SphereGeometry(0.212, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.56),
  hatCap: new SphereGeometry(0.218, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
  upperArm: new CapsuleGeometry(0.064, 0.15, 8, 16),
  thigh: new CapsuleGeometry(0.078, 0.2, 8, 16),
  shin: new CapsuleGeometry(0.066, 0.2, 8, 16),
  neck: new CapsuleGeometry(0.056, 0.06, 6, 14),
  foot: new CapsuleGeometry(0.052, 0.1, 6, 12),
  hand: new SphereGeometry(0.046, 16, 12),
  belt: new TorusGeometry(0.207, 0.018, 8, 40),
  smile: new TorusGeometry(0.026, 0.0065, 6, 16, Math.PI),
  brow: new CapsuleGeometry(0.008, 0.04, 4, 6),
  cheek: new SphereGeometry(0.03, 12, 8),
  bun: new SphereGeometry(0.085, 18, 14),
  longHair: new CapsuleGeometry(0.12, 0.28, 8, 16),
  // Cổ áo giao lĩnh: dải vải chéo từ vai trái xuống hông phải, ôm theo mặt ngực
  collar: new TubeGeometry(
    new CatmullRomCurve3([
      new Vector3(-0.12, 0.6, 0.06),
      new Vector3(-0.05, 0.52, 0.19),
      new Vector3(0.05, 0.38, 0.226),
      new Vector3(0.13, 0.22, 0.19),
      new Vector3(0.17, 0.08, 0.13),
    ]),
    24,
    0.022,
    8,
    false,
  ),
  collarBack: new TubeGeometry(
    new CatmullRomCurve3([new Vector3(0.12, 0.6, 0.06), new Vector3(0.06, 0.55, 0.16), new Vector3(-0.02, 0.47, 0.205)]),
    12,
    0.02,
    8,
    false,
  ),
  stick: new CapsuleGeometry(0.008, 0.36, 2, 5),
  ember: new SphereGeometry(0.014, 8, 6),
  bead: new SphereGeometry(0.018, 8, 6),
  broomStick: new CapsuleGeometry(0.02, 1.2, 4, 8),
  broomHead: lathe(
    [
      [0.03, 0.0],
      [0.1, -0.12],
      [0.19, -0.34],
      [0.0, -0.36],
    ],
    12,
  ),
  tray: new CapsuleGeometry(0.16, 0.2, 4, 12),
  cup: lathe(
    [
      [0.0, 0.0],
      [0.034, 0.0],
      [0.044, 0.065],
      [0.04, 0.066],
    ],
    14,
  ),
}

const damp = (cur, target, k, dt) => MathUtils.damp(cur, target, k, dt)

/** Cánh tay: vai (khớp tròn) → bắp tay → khuỷu (khớp tròn) → tay áo loe → bàn tay */
function Arm({ side, m, upper = m.robe, shoulderRef, elbowRef, children }) {
  return (
    <group ref={shoulderRef} position={[side * RIG.shoulderX, RIG.shoulderY, 0]}>
      <mesh geometry={GEO.ball} material={upper} scale={[0.066, 0.07, 0.066]} castShadow />
      {/* Giáp vai (Tề Thiên, Thần Tài) */}
      {m.pad && <mesh geometry={GEO.ball} material={m.pad} position={[side * 0.012, 0.035, 0]} scale={[0.1, 0.06, 0.1]} castShadow />}
      <mesh geometry={GEO.upperArm} material={upper} position={[0, -RIG.upperArm / 2, 0]} castShadow />
      <group ref={elbowRef} position={[0, -RIG.upperArm, 0]}>
        <mesh geometry={GEO.ball} material={m.robe} scale={0.068} castShadow />
        <mesh geometry={GEO.sleeve} material={m.robeIn} castShadow />
        <group position={[0, -RIG.forearm, 0]}>
          <mesh geometry={GEO.hand} material={m.skin} scale={[1, 1.15, 0.85]} castShadow />
          {children}
        </group>
      </group>
    </group>
  )
}

/** Chân: hông (khớp tròn) → đùi → gối (khớp tròn) → cẳng chân → bàn chân */
function Leg({ side, m, thighRef, kneeRef }) {
  return (
    <group ref={thighRef} position={[side * 0.1, 0, 0]}>
      <mesh geometry={GEO.ball} material={m.pants} scale={0.082} />
      <mesh geometry={GEO.thigh} material={m.pants} position={[0, -RIG.thigh / 2, 0]} castShadow />
      <group ref={kneeRef} position={[0, -RIG.thigh, 0]}>
        <mesh geometry={GEO.ball} material={m.pants} scale={0.07} />
        <mesh geometry={GEO.shin} material={m.pants} position={[0, -RIG.shin / 2, 0]} castShadow />
        <mesh geometry={GEO.foot} material={m.shoe} position={[0, -RIG.shin + 0.005, 0.045]} rotation-x={Math.PI / 2} castShadow />
      </group>
    </group>
  )
}

/* ---------------- Mồ hôi khi thở dốc ---------------- */

const SWEAT_N = 16
// Chỗ mồ hôi rịn ra (hệ toạ độ đầu): trán, thái dương, SAU ĐẦU và gáy (camera thường ở sau lưng)
const SWEAT_SPOTS = [
  [-0.09, 0.29, 0.15],
  [0.06, 0.3, 0.16],
  [0.11, 0.27, 0.14],
  [-0.17, 0.21, 0.07],
  [0.18, 0.2, 0.06],
  [0.0, 0.31, 0.15],
  // sau đầu
  [-0.08, 0.27, -0.17],
  [0.07, 0.29, -0.16],
  [0.0, 0.22, -0.19],
  [-0.15, 0.17, -0.12],
  [0.15, 0.16, -0.12],
  // gáy
  [-0.05, 0.07, -0.15],
  [0.06, 0.06, -0.15],
]
const sweatMat = new MeshBasicMaterial({ color: '#cdeeff', transparent: true, opacity: 0.92, toneMapped: false })

/**
 * Giọt mồ hôi: rịn ra (to dần) ở trán/thái dương rồi lăn xuống và rơi khỏi mặt.
 * Càng mệt (source.tiredness) càng nhiều giọt, rơi càng dồn dập. Chỉ chạy khi anim = 'tired'.
 */
function Sweat({ source }) {
  const refs = useRef([])
  const drops = useRef(Array.from({ length: SWEAT_N }, () => ({ t: -1, spot: 0, life: 1.2 })))
  const spawn = useRef(0)
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const tired = source.anim === 'tired'
    const level = source.tiredness ?? 0.5
    spawn.current += tired ? dt * (1.6 + level * 4.5) : 0
    drops.current.forEach((d, i) => {
      if (d.t < 0 && spawn.current >= 1) {
        spawn.current -= 1
        d.t = 0
        // Lần lượt đổi chỗ rịn để cả trán lẫn sau đầu đều có mồ hôi
        d.spot = (d.spot + 5 + i) % SWEAT_SPOTS.length
        d.life = 1 + (i % 3) * 0.25
        d.jitter = ((i * 37) % 10) / 10 - 0.5
      }
      const mesh = refs.current[i]
      if (!mesh) return
      if (d.t < 0) {
        mesh.visible = false
        return
      }
      d.t += dt
      const k = d.t / d.life
      if (k >= 1) {
        d.t = -1
        mesh.visible = false
        return
      }
      const [x, y, z] = SWEAT_SPOTS[d.spot]
      // 35% đầu: giọt rịn to dần tại chỗ; sau đó lăn xuống má rồi rơi (nhanh dần)
      const grow = Math.min(1, k / 0.35)
      const fall = Math.max(0, (k - 0.35) / 0.65)
      mesh.visible = true
      // Giọt phía trước lăn ra trước mặt, giọt sau đầu lăn xuống gáy rồi rơi ra sau
      mesh.position.set(x * (1 + fall * 0.25) + d.jitter * 0.02, y - fall * fall * 0.55, z + Math.sign(z) * fall * 0.06)
      const sc = 0.55 + grow * 0.45
      mesh.scale.set(0.016 * sc, 0.024 * sc * (1 + fall * 0.6), 0.016 * sc)
    })
  })
  return Array.from({ length: SWEAT_N }, (_, i) => (
    <mesh key={i} ref={(el) => (refs.current[i] = el)} geometry={GEO.ball} material={sweatMat} visible={false} />
  ))
}

/** Khuôn mặt + tóc / đầu cạo / mũ len ni cô / mũ mão mua ở sạp */
function Head({ m, hair, role, hat }) {
  const shaved = hair === 'cao' && role !== 'ni-co'
  const covered = hatCoversHair(hat)
  return (
    <>
      <mesh geometry={GEO.head} material={m.skin} position={[0, 0.17, 0]} scale={[1, 1.04, 0.98]} castShadow />
      {[-1, 1].map((s) => (
        <mesh key={`tai${s}`} geometry={GEO.ball} material={m.skin} position={[s * 0.196, 0.15, -0.01]} scale={[0.028, 0.045, 0.035]} />
      ))}
      {/* Mắt có đốm sáng, chân mày, má hồng */}
      {[-1, 1].map((s) => (
        <group key={`mat${s}`} position={[s * 0.07, 0.18, 0.178]}>
          <mesh geometry={GEO.ball} material={m.eye} scale={[0.021, 0.029, 0.012]} />
          <mesh geometry={GEO.ball} material={m.shine} position={[s * -0.006, 0.01, 0.009]} scale={0.0065} />
          <mesh geometry={GEO.brow} material={m.hair} position={[0, 0.06, 0.004]} rotation={[0, 0, Math.PI / 2 + s * 0.15]} />
          <mesh geometry={GEO.cheek} material={m.cheek} position={[s * 0.035, -0.055, -0.006]} scale={[1, 0.6, 0.4]} />
        </group>
      ))}
      {/* Mũi, miệng cười */}
      <mesh geometry={GEO.ball} material={m.scalp} position={[0, 0.135, 0.196]} scale={[0.016, 0.014, 0.012]} />
      <mesh geometry={GEO.smile} material={m.mouth} position={[0, 0.098, 0.186]} rotation={[0, 0, Math.PI]} />

      {shaved && <mesh geometry={GEO.hairCap} material={m.scalp} position={[0, 0.172, -0.005]} scale={[0.96, 0.98, 0.96]} />}
      {hair !== 'cao' && (
        <>
          <mesh geometry={GEO.hairCap} material={m.hair} position={[0, 0.17, -0.012]} rotation-x={-0.18} castShadow />
          {hair === 'bui' && !covered && <mesh geometry={GEO.bun} material={m.hair} position={[0, 0.33, -0.12]} castShadow />}
          {hair === 'dai' && <mesh geometry={GEO.longHair} material={m.hair} position={[0, 0.02, -0.12]} scale={[1.2, 1, 0.55]} castShadow />}
        </>
      )}
      {role === 'ni-co' && !covered && (
        <>
          <mesh geometry={GEO.hatCap} material={m.hat} position={[0, 0.18, -0.01]} castShadow />
          <mesh geometry={GEO.belt} material={m.hat} position={[0, 0.2, -0.01]} rotation-x={Math.PI / 2} scale={1.04} />
        </>
      )}
      <HatModel hat={hat} />
    </>
  )
}

export default function Avatar({ source, profile }) {
  const root = useRef()
  const torso = useRef()
  const head = useRef()
  const skirt = useRef()
  const thighL = useRef()
  const thighR = useRef()
  const kneeL = useRef()
  const kneeR = useRef()
  const shoulderL = useRef()
  const shoulderR = useRef()
  const elbowL = useRef()
  const elbowR = useRef()
  const broom = useRef()
  const incense = useRef()
  const beads = useRef()
  const tray = useRef()
  const backWeapon = useRef()
  const handWeapon = useRef()
  const pose = useRef(poseFor('idle', 0))
  // Mốc bắt đầu hoạt ảnh hiện tại → lạy/vái/thỉnh chuông luôn bắt đầu từ đầu động tác
  const animClock = useRef({ anim: 'idle', start: 0 })

  const role = profile?.role ?? 'phat-tu'
  const wear = COSTUMES[profile?.costume] ?? null
  const hatDef = HATS[profile?.hat] ?? null
  const outfit = wear?.robe ?? OUTFITS[profile?.outfit]?.color ?? (role === 'chu-tieu' ? PALETTE.robeBrown : PALETTE.cloth)
  const skin = profile?.skin ?? SKINS[1]
  const hair = role === 'phat-tu' ? (profile?.hair ?? 'ngan') : 'cao'

  const m = useMemo(() => {
    const base = {
      robe: soft(outfit),
      robeIn: soft(shade(outfit, -0.04), { side: DoubleSide }),
      sash: soft(role === 'chu-tieu' ? PALETTE.robeSaffron : shade(outfit, -0.16)),
      skin: soft(skin),
      scalp: soft(shade(skin, -0.06)),
      hair: soft('#2a201b'),
      eye: soft('#2b1d16'),
      shine: soft('#ffffff'),
      mouth: soft('#a8564c'),
      cheek: soft('#f08a8a', { opacity: 0.45 }),
      pants: soft('#3d3a36'),
      shoe: soft('#3a2f28'),
      hat: soft('#8f8b84'),
      wood: soft(PALETTE.wood),
      straw: soft('#c9a95b'),
      incense: soft(PALETTE.incense),
      ember: soft('#ff8a4a'),
      bead: soft('#7a4a2a'),
      cup: soft('#efe8dc'),
    }
    const extra = wearMaterials(wear)
    return { ...base, skirt: base.robeIn, ...extra }
  }, [outfit, skin, role, wear])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const { anim, speed, holding } = source
    if (animClock.current.anim !== anim) animClock.current = { anim, start: t }
    const local = anim === 'walk' || anim === 'run' || anim === 'idle' ? t : t - animClock.current.start
    let target = poseFor(anim, local, speed, source.tiredness ?? 0.5, source.bellPull ?? 0, source.jump ? jumpPhase(source.jump) : 0)
    if (holding === 'tea') target = applyCarry(target)

    const cur = pose.current
    // Động tác nhanh (đi, quét, đánh chuông) bám đích nhanh hơn
    const k = anim === 'jump' || anim === 'land' ? 18 : anim === 'walk' || anim === 'run' || anim === 'sweep' || anim === 'bell-strike' ? 16 : anim === 'bell-pull' ? 12 : 7
    for (const key of Object.keys(target)) {
      // Khớp chưa có/không hợp lệ (vd. sau khi nạp lại code) → lấy luôn giá trị đích, tránh NaN
      const from = Number.isFinite(cur[key]) ? cur[key] : target[key]
      cur[key] = damp(from, target[key], k, dt)
    }

    root.current.position.y = cur.rootY
    root.current.rotation.x = cur.lean
    torso.current.rotation.set(cur.torsoPitch, cur.torsoYaw, 0)
    head.current.rotation.set(cur.headPitch, cur.headYaw, 0)

    // Hông: dương = đùi ra trước (quay âm quanh X); dạng đùi quanh Z
    thighL.current.rotation.set(-cur.thighL, 0, -cur.spread)
    thighR.current.rotation.set(-cur.thighR, 0, cur.spread)
    kneeL.current.rotation.x = cur.kneeL
    kneeR.current.rotation.x = cur.kneeR

    // Vai: dương = tay ra trước; khép vào trong quanh Z (tay trái +, tay phải −)
    shoulderL.current.rotation.set(-cur.armL, 0, cur.inL)
    shoulderR.current.rotation.set(-cur.armR, 0, -cur.inR)
    elbowL.current.rotation.x = -cur.elbowL
    elbowR.current.rotation.x = -cur.elbowR

    // Vạt áo: rủ theo trung bình hai đùi (ít), co lại khi quỳ/ngồi, xoè khi ngồi xếp bằng
    const avgThigh = (cur.thighL + cur.thighR) / 2
    skirt.current.rotation.x = -avgThigh * (cur.spread > 0.3 ? 0 : 0.35) + (cur.thighL - cur.thighR) * 0.06
    skirt.current.scale.set(cur.skirtFlare, 1 - cur.skirtSquash, cur.skirtFlare)

    broom.current.visible = holding === 'broom'
    incense.current.visible = anim === 'incense'
    beads.current.visible = holding === 'beads'
    tray.current.visible = holding === 'tea'
    // Múa gậy: binh khí rời lưng sang tay phải, quay tít như chong chóng trước người
    const twirl = anim === 'twirl'
    if (backWeapon.current) backWeapon.current.visible = !twirl
    if (handWeapon.current) {
      handWeapon.current.visible = twirl
      if (twirl) handWeapon.current.rotation.y += Math.min(dt, 0.05) * 11
    }
  })

  return (
    <group>
      {/* Bóng tròn mềm dưới chân (bổ sung cho bóng đổ thật) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.38, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.16} depthWrite={false} />
      </mesh>

      <group ref={root}>
        <group position={[0, RIG.hipY, 0]}>
          <Leg side={-1} m={m} thighRef={thighL} kneeRef={kneeL} />
          <Leg side={1} m={m} thighRef={thighR} kneeRef={kneeR} />

          {/* Vạt áo tràng (liền với thân ở hông) */}
          <group ref={skirt}>
            <mesh geometry={GEO.skirt} material={m.skirt} castShadow receiveShadow />
            <CostumeSkirt wear={wear} m={m} />
          </group>

          {/* Thân trên gập quanh hông */}
          <group ref={torso}>
            <mesh geometry={GEO.torso} material={m.robe} castShadow receiveShadow />
            <mesh geometry={GEO.belt} material={m.sash} position={[0, 0.03, 0]} rotation-x={Math.PI / 2} />
            <mesh geometry={GEO.collar} material={m.sash} />
            <mesh geometry={GEO.collarBack} material={m.sash} />
            <mesh geometry={GEO.neck} material={m.skin} position={[0, 0.68, 0]} />
            <CostumeTorso wear={wear} m={m} />
            {wear?.back && (
              <group ref={backWeapon} position={WEAPON_BACK.position} rotation-z={WEAPON_BACK.tilt[wear.back] ?? 0.6}>
                <Weapon kind={wear.back} />
              </group>
            )}

            <group ref={head} position={[0, 0.76, 0]}>
              <Head m={m} hair={hair} role={role} hat={hatDef} />
              <Sweat source={source} />
            </group>

            {/* Tay trái: tràng hạt khi ngồi niệm */}
            <Arm side={-1} m={m} upper={m.kasayaArm} shoulderRef={shoulderL} elbowRef={elbowL}>
              <group ref={beads} position={[0.04, -0.02, 0.05]} rotation-x={Math.PI / 2.2}>
                {Array.from({ length: 18 }, (_, i) => {
                  const a = (i / 18) * Math.PI * 2
                  return <mesh key={i} geometry={GEO.bead} material={m.bead} position={[Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0]} />
                })}
              </group>
            </Arm>
            {/* Tay phải: nén hương khi thắp */}
            <Arm side={1} m={m} shoulderRef={shoulderR} elbowRef={elbowR}>
              {/* Binh khí cầm giữa cán, nằm ngang so với cẳng tay → quay quanh cẳng tay */}
              {wear?.back && (
                <group ref={handWeapon} visible={false}>
                  <group rotation-z={Math.PI / 2}>
                    <Weapon kind={wear.back} />
                  </group>
                </group>
              )}
              <group ref={incense} position={[-0.03, 0.02, 0.03]}>
                {[-0.025, 0, 0.025].map((x) => (
                  <group key={x} position={[x, 0.17, 0]}>
                    <mesh geometry={GEO.stick} material={m.incense} />
                    <mesh geometry={GEO.ember} material={m.ember} position={[0, 0.2, 0]} />
                  </group>
                ))}
              </group>
            </Arm>

            {/* Chổi tre (quét lá) */}
            <group ref={broom} position={[0.12, 0.12, 0.4]} rotation={[0.55, 0, 0.08]}>
              <mesh geometry={GEO.broomStick} material={m.wood} castShadow />
              <mesh geometry={GEO.broomHead} material={m.straw} position={[0, -0.62, 0]} castShadow />
            </group>

            {/* Khay trà ba chén (mời khách hành hương) */}
            <group ref={tray} position={[0, 0.2, 0.44]}>
              <mesh geometry={GEO.tray} material={m.wood} rotation-z={Math.PI / 2} scale={[0.12, 1, 1]} castShadow />
              {[-0.13, 0, 0.13].map((x) => (
                <mesh key={x} geometry={GEO.cup} material={m.cup} position={[x, 0.02, 0]} />
              ))}
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
