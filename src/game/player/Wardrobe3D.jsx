import {
  BoxGeometry,
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  SphereGeometry,
  TorusGeometry,
} from 'three'
import { soft } from './softMaterial'
import {
  buildCape,
  buildConicalHat,
  buildCrownShell,
  buildFeather,
  buildFlatHat,
  buildKasayaSkirt,
  buildKasayaTorso,
  buildStrap,
  kasayaFront,
  torsoRadius,
} from './costumeGeometry'

/**
 * Trang phục & mũ mão mua ở sạp y phục (dữ liệu: shop/wardrobe.js), gắn vào khung xương Avatar:
 *  CostumeTorso — trong nhóm thân trên (cà sa vắt vai, áo choàng, bụng, chuỗi hạt)
 *  Weapon       — binh khí (Avatar đặt sau lưng / cầm tay khi múa gậy)
 *  CostumeSkirt — trong nhóm vạt áo (cà sa quấn ngoài vạt)
 *  HatModel     — trong nhóm đầu (tâm đầu ở y 0.17, bán kính ~0.2)
 */

let geoCache = null
function G() {
  if (geoCache) return geoCache
  geoCache = {
    kasayaTorso: buildKasayaTorso(),
    kasayaSkirt: buildKasayaSkirt(),
    cape: buildCape(),
    ball: new SphereGeometry(1, 18, 12),
    ring: new TorusGeometry(1, 0.22, 8, 24),
    band: new TorusGeometry(0.212, 0.02, 8, 40),
    thinBand: new TorusGeometry(0.208, 0.013, 6, 40),
    conical: buildConicalHat(),
    flat: buildFlatHat(),
    crownTall: buildCrownShell(0.5),
    crownLow: buildCrownShell(0.37, 0.218),
    crownSmall: buildCrownShell(0.44, 0.13),
    featherL: buildFeather(-1),
    featherR: buildFeather(1),
    strap: buildStrap(),
    disc: new CylinderGeometry(1, 1, 1, 24),
    cone: new ConeGeometry(1, 1, 8),
    // Thanh dài đúng 1 m (gồm hai đầu bo), bán kính 1 → scale [r, dài, r]
    rod: new CapsuleGeometry(1, 1, 4, 10).scale(1, 1 / 3, 1),
    rib: new TorusGeometry(1, 0.02, 4, 36),
    box: new BoxGeometry(1, 1, 1),
    halfRing: new TorusGeometry(0.11, 0.016, 6, 20, Math.PI),
  }
  return geoCache
}

/** Cà sa vắt vai, áo choàng, bụng tròn, chuỗi hạt, đồ đeo lưng — trong hệ thân trên */
export function CostumeTorso({ wear, m }) {
  if (!wear) return null
  const g = G()
  // Khoen cà sa: ngay mép vải trên ngực
  const ringY = 0.42
  const ringPhi = kasayaFront(ringY) - 0.08
  const ringR = torsoRadius(ringY) * 1.05 + 0.02
  return (
    <>
      {wear.kasaya && (
        <>
          <mesh geometry={g.kasayaTorso} material={m.kasaya} castShadow />
          <mesh
            geometry={g.ring}
            material={m.kasayaRing}
            position={[Math.sin(ringPhi) * ringR, ringY, Math.cos(ringPhi) * ringR]}
            rotation-y={ringPhi}
            scale={0.03}
          />
        </>
      )}
      {wear.cape && <mesh geometry={g.cape} material={m.cape} castShadow />}
      {wear.belly && <mesh geometry={g.ball} material={m.robe} position={[0, 0.17, 0.085]} scale={[0.205, 0.19, 0.17]} castShadow />}
      {wear.necklace && <Necklace m={m} />}
    </>
  )
}

/** Chuỗi hạt lớn đeo cổ (Sa Tăng): vòng nghiêng, trước thấp sau cao, nằm sát mặt áo */
function Necklace({ m }) {
  const g = G()
  const n = 14
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const y = 0.58 - ((Math.cos(a) + 1) / 2) * 0.15
    const r = torsoRadius(y) + 0.028
    return <mesh key={i} geometry={g.ball} material={i % 7 === 0 ? m.sash : m.necklace} position={[Math.sin(a) * r, y, Math.cos(a) * r]} scale={0.032} />
  })
}

/**
 * Binh khí (trục dọc theo Y, tâm ở giữa cán) — Avatar đặt chéo sau lưng hoặc cầm tay khi múa (anim 'twirl').
 */
export function Weapon({ kind }) {
  const g = G()
  const wood = soft('#7a4a26')
  const gold = soft('#f0c75a')
  const steel = soft('#c9ccd2')
  if (kind === 'gay-nhu-y') {
    // Gậy Như Ý: thân đỏ, hai đầu bịt vàng
    const red = soft('#b0262a')
    return (
      <group>
        <mesh geometry={g.rod} material={red} scale={[0.024, 1.3, 0.024]} castShadow />
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={g.disc} material={gold} position={[0, s * 0.62, 0]} scale={[0.032, 0.16, 0.032]} />
        ))}
      </group>
    )
  }
  if (kind === 'cao-cuu-rang') {
    // Cào chín răng: cán gỗ, đầu cào sắt chín răng
    return (
      <group>
        <mesh geometry={g.rod} material={wood} scale={[0.022, 1.1, 0.022]} castShadow />
        <group position={[0, 0.56, 0]}>
          <mesh geometry={g.box} material={steel} scale={[0.34, 0.07, 0.05]} castShadow />
          {Array.from({ length: 9 }, (_, i) => (
            <mesh key={i} geometry={g.cone} material={steel} position={[-0.15 + i * 0.0375, 0.08, 0]} scale={[0.012, 0.1, 0.012]} />
          ))}
        </group>
      </group>
    )
  }
  if (kind === 'nguyet-xan') {
    // Nguyệt xẳn: một đầu lưỡi trăng khuyết, một đầu xẻng
    return (
      <group>
        <mesh geometry={g.rod} material={wood} scale={[0.02, 1.2, 0.02]} castShadow />
        <mesh geometry={g.halfRing} material={steel} position={[0, 0.6, 0]} rotation-z={Math.PI} />
        <mesh geometry={g.box} material={steel} position={[0, -0.62, 0]} scale={[0.12, 0.13, 0.02]} />
      </group>
    )
  }
  return null
}

/** Cà sa quấn ngoài vạt áo (trong nhóm vạt áo → co/xoè theo vạt) */
export function CostumeSkirt({ wear, m }) {
  if (!wear?.kasaya) return null
  return <mesh geometry={G().kasayaSkirt} material={m.kasaya} castShadow />
}

/* ---------------- Mũ mão ---------------- */

export function HatModel({ hat }) {
  if (!hat) return null
  const g = G()
  const c = hat.colors
  const main = soft(c.main)
  const line = soft(c.line ?? c.main)
  const mainDS = soft(c.main, { side: DoubleSide })

  switch (hat.kind) {
    case 'non-la':
      return (
        <>
          <mesh geometry={g.conical} material={mainDS} castShadow />
          {/* Vòng nón (gân tre) và vành trong tựa lên đầu */}
          {[0.16, 0.3, 0.44].map((r) => (
            <mesh key={r} geometry={g.rib} material={line} position={[0, 0.5875 - 0.75 * r + 0.004, 0]} rotation-x={Math.PI / 2} scale={r} />
          ))}
          <mesh geometry={g.thinBand} material={line} position={[0, 0.31, 0]} rotation-x={Math.PI / 2} scale={0.78} />
          <mesh geometry={g.strap} material={soft(c.strap)} />
        </>
      )
    case 'quai-thao':
      return (
        <>
          <mesh geometry={g.flat} material={mainDS} castShadow />
          <mesh geometry={g.ring} material={line} position={[0, 0.36, 0]} rotation-x={Math.PI / 2} scale={[0.44, 0.44, 0.04]} />
          {/* Tua quai thao rủ hai bên */}
          {[-1, 1].map((s) =>
            [0, 1, 2, 3, 4].map((i) => (
              <mesh key={`${s}${i}`} geometry={g.rod} material={line} position={[s * 0.31, 0.2 - (i % 2) * 0.025, -0.06 + i * 0.03]} scale={[0.007, 0.2, 0.007]} />
            )),
          )}
          <mesh geometry={g.strap} material={soft(c.strap)} />
        </>
      )
    case 'khan-dong':
      // Khăn xếp nếp nhiều lớp quanh đầu, lớp giữa sẫm/sáng khác màu, mặt trên phẳng
      return (
        <>
          {[
            [0.235, 1.0, 0.09],
            [0.285, 0.98, -0.09],
            [0.33, 0.92, 0.07],
          ].map(([y, s, tilt], i) => (
            <mesh key={y} geometry={g.band} material={i === 1 ? line : main} position={[0, y, -0.01]} rotation-x={Math.PI / 2 + tilt} scale={[s, s, 2.4]} castShadow />
          ))}
          <mesh geometry={g.disc} material={main} position={[0, 0.355, -0.01]} scale={[0.185, 0.04, 0.185]} />
        </>
      )
    case 'canh-chuon':
      return (
        <>
          <mesh geometry={g.crownLow} material={mainDS} castShadow />
          <mesh geometry={g.disc} material={main} position={[0, 0.355, 0]} scale={[0.19, 0.03, 0.19]} />
          {/* Khối hậu sơn phía sau cao hơn */}
          <mesh geometry={g.ball} material={main} position={[0, 0.42, -0.08]} scale={[0.15, 0.12, 0.1]} castShadow />
          <mesh geometry={g.thinBand} material={line} position={[0, 0.27, 0]} rotation-x={Math.PI / 2} scale={1.06} />
          {/* Hai cánh chuồn trên cần ngang */}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.24, 0.42, -0.1]} rotation-z={s * 0.12}>
              <mesh geometry={g.rod} material={main} rotation-z={Math.PI / 2} position={[s * 0.02, 0, 0]} scale={[0.008, 0.12, 0.008]} />
              <mesh geometry={g.disc} material={main} position={[s * 0.13, 0, 0]} rotation-x={Math.PI / 2} scale={[0.08, 0.01, 0.038]} castShadow />
              <mesh geometry={g.rib} material={line} position={[s * 0.13, 0, 0]} scale={[0.08, 0.038, 0.4]} />
            </group>
          ))}
        </>
      )
    case 'than-tai':
      return (
        <>
          <mesh geometry={g.crownTall} material={mainDS} castShadow />
          <mesh geometry={g.disc} material={main} position={[0, 0.5, 0]} scale={[0.12, 0.01, 0.12]} />
          <mesh geometry={g.band} material={line} position={[0, 0.27, 0]} rotation-x={Math.PI / 2} scale={[1.06, 1.06, 1.2]} />
          <mesh geometry={g.thinBand} material={line} position={[0, 0.44, 0]} rotation-x={Math.PI / 2} scale={1.05} />
          {/* Ngọc giữa trán, chỏm vàng */}
          <mesh geometry={g.ball} material={soft(c.gem)} position={[0, 0.355, 0.215]} scale={[0.04, 0.04, 0.02]} />
          <mesh geometry={g.ring} material={line} position={[0, 0.355, 0.214]} scale={0.048} />
          <mesh geometry={g.ball} material={line} position={[0, 0.535, 0]} scale={0.045} />
          {/* Hai cánh vểnh sau mão */}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.25, 0.47, -0.08]} rotation-z={s * -0.55}>
              <mesh geometry={g.disc} material={main} rotation-x={Math.PI / 2} position={[s * 0.09, 0, 0]} scale={[0.11, 0.014, 0.07]} castShadow />
              <mesh geometry={g.ring} material={line} position={[s * 0.09, 0, 0]} scale={[0.11, 0.07, 0.035]} />
            </group>
          ))}
        </>
      )
    case 'vuong-mien':
      return (
        <>
          <mesh geometry={g.crownLow} material={mainDS} castShadow />
          <mesh geometry={g.band} material={line} position={[0, 0.27, 0]} rotation-x={Math.PI / 2} scale={[1.06, 1.06, 1.1]} />
          {/* Năm đỉnh nhọn + hạt ngọc */}
          {[-2, -1, 0, 1, 2].map((i) => {
            const a = i * 0.55
            return (
              <group key={i} position={[Math.sin(a) * 0.205, 0.39, Math.cos(a) * 0.205]} rotation-y={a}>
                <mesh geometry={g.cone} material={main} position={[0, 0.05, 0]} scale={[0.045, i === 0 ? 0.16 : 0.11, 0.025]} />
                <mesh geometry={g.ball} material={soft(c.gem)} position={[0, -0.04, 0.02]} scale={i === 0 ? 0.03 : 0.02} />
              </group>
            )
          })}
        </>
      )
    case 'kim-co':
      return <KimCo c={c} />
    case 'te-thien':
      return (
        <>
          <KimCo c={c} />
          <mesh geometry={g.crownSmall} material={mainDS} position={[0, 0.0, -0.02]} castShadow />
          <mesh geometry={g.cone} material={main} position={[0, 0.47, 0.06]} rotation-x={-0.2} scale={[0.05, 0.12, 0.02]} />
          <mesh geometry={g.ball} material={soft(c.feather)} position={[0, 0.41, 0.115]} scale={0.022} />
          {/* Hai lông trĩ dài, đầu lông màu nhạt */}
          <mesh geometry={g.featherL} material={soft(c.feather)} castShadow />
          <mesh geometry={g.featherR} material={soft(c.feather)} castShadow />
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={g.ball} material={soft(c.tip)} position={[s * 0.66, 1.24, -0.72]} scale={[0.03, 0.02, 0.05]} />
          ))}
        </>
      )
    case 'ty-lu':
      return (
        <>
          <mesh geometry={g.crownLow} material={soft(c.panel, { side: DoubleSide })} castShadow />
          <mesh geometry={g.band} material={main} position={[0, 0.27, 0]} rotation-x={Math.PI / 2} scale={[1.07, 1.07, 1.1]} />
          {/* Năm cánh hình Phật xếp vòng phía trước */}
          {[-2, -1, 0, 1, 2].map((i) => {
            const a = i * 0.48
            return (
              <group key={i} position={[Math.sin(a) * 0.225, 0.39, Math.cos(a) * 0.225]} rotation={[-0.18, a, 0]}>
                <mesh geometry={g.disc} material={soft(c.panel)} rotation-x={Math.PI / 2} scale={[0.065, 0.012, 0.1]} castShadow />
                <mesh geometry={g.ring} material={main} scale={[0.066, 0.1, 0.04]} />
                <mesh geometry={g.ball} material={main} position={[0, 0.015, 0.012]} scale={[0.022, 0.028, 0.012]} />
                <mesh geometry={g.ball} material={soft(c.gem)} position={[0, -0.05, 0.012]} scale={0.012} />
              </group>
            )
          })}
          {/* Dải lụa sau gáy */}
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={g.box} material={soft(c.panel, { side: DoubleSide })} position={[s * 0.07, 0.08, -0.215]} rotation={[0.12, 0, s * 0.08]} scale={[0.05, 0.42, 0.008]} />
          ))}
        </>
      )
    default:
      return null
  }
}

/** Vòng Kim Cô: vòng vàng ngang trán, hai móc xoắn ở thái dương */
function KimCo({ c }) {
  const g = G()
  const gold = soft(c.main)
  const dark = soft(c.line ?? c.main)
  return (
    <>
      <mesh geometry={g.band} material={gold} position={[0, 0.265, -0.005]} rotation-x={Math.PI / 2 - 0.12} scale={[1.02, 1.02, 0.9]} castShadow />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={g.ring} material={dark} position={[s * 0.205, 0.255, 0.03]} rotation-y={Math.PI / 2} scale={0.026} />
      ))}
    </>
  )
}
