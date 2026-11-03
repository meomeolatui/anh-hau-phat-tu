/**
 * Khung xương & tư thế nhân vật (thuần JS, test được).
 *
 * Quy ước giá trị khớp: SỐ DƯƠNG = đưa ra phía TRƯỚC (hông, vai) / GẬP (gối, khuỷu).
 * Avatar.jsx đổi sang góc quay three.js khi áp dụng.
 *
 * Khớp:
 *  rootY      hạ/nâng toàn thân (quỳ, ngồi)          lean       nghiêng cả người (chạy)
 *  torsoPitch gập thân quanh HÔNG                     torsoYaw   vặn thân (quét lá)
 *  headPitch  cúi (+) / ngẩng (−) đầu                headYaw    quay đầu sang trái (+) / phải (−)
 *  thighL/R   đưa đùi ra trước                         spread     dạng đùi sang hai bên (ngồi xếp bằng)
 *  kneeL/R    gập gối
 *  armL/R     đưa cánh tay ra trước                    inL/R      khép tay vào trong (+) / dang ra (−)
 *  elbowL/R   gập khuỷu
 *  skirtSquash 0..1 vạt áo co lại (quỳ/ngồi)          skirtFlare hệ số xoè vạt áo
 */

/** Kích thước khung (mét) — dùng chung cho dựng hình và test */
export const RIG = {
  hipY: 0.66,
  thigh: 0.31,
  shin: 0.3,
  shoulderX: 0.205,
  shoulderY: 0.49, // trên hông, trong hệ thân (vai nằm sát mặt áo để khớp vai liền với thân)
  upperArm: 0.25,
  forearm: 0.27,
}

export const REST = Object.freeze({
  rootY: 0,
  lean: 0,
  torsoPitch: 0,
  torsoYaw: 0,
  headPitch: 0,
  headYaw: 0,
  thighL: 0,
  thighR: 0,
  spread: 0,
  kneeL: 0,
  kneeR: 0,
  armL: 0,
  armR: 0,
  inL: -0.08,
  inR: -0.08,
  elbowL: 0.12,
  elbowR: 0.12,
  skirtSquash: 0,
  skirtFlare: 1,
})

/** Tay chắp trước ngực */
const PRAY = { armL: 0.42, armR: 0.42, inL: 0.42, inR: 0.42, elbowL: 1.75, elbowR: 1.75 }

/**
 * Tư thế đích tại thời điểm t (giây, tính từ lúc bắt đầu hoạt ảnh với các nghi thức).
 * @param {string} anim  idle|walk|run|pray|incense|bow|kneel|sit|seated|sweep|bell|wave|tired|jump|land|look|vai|twirl
 * @param {number} speed tốc độ di chuyển (m/s)
 * @param {number} tired mức mệt 0..1 (cho 'tired')
 * @param {number} pull  lực kéo dây chuông 0..1 (cho 'bell-pull')
 * @param {number} air   pha nhảy -1 (vừa bật lên) … 0 (đỉnh) … 1 (đang rơi) (cho 'jump', xem jump.js)
 */
export function poseFor(anim, t, speed = 0, tired = 0.5, pull = 0, air = 0) {
  const p = { ...REST }
  switch (anim) {
    case 'walk':
    case 'run': {
      const run = anim === 'run'
      const f = run ? 11 : 7.5
      const a = Math.min(1, speed / (run ? 6 : 3)) * (run ? 0.7 : 0.45)
      const s = Math.sin(t * f)
      p.thighL = s * a
      p.thighR = -s * a
      // Gối gập khi chân đánh ra sau (bước tự nhiên, không đá thẳng cứng đơ)
      p.kneeL = Math.max(0, Math.sin(t * f - 1.3)) * a * 1.5
      p.kneeR = Math.max(0, -Math.sin(t * f - 1.3)) * a * 1.5
      p.armL = -s * a * 0.8
      p.armR = s * a * 0.8
      p.elbowL = run ? 1.2 : 0.35
      p.elbowR = run ? 1.2 : 0.35
      p.rootY = Math.abs(Math.cos(t * f)) * (run ? 0.05 : 0.025) - (run ? 0.03 : 0.01)
      p.lean = run ? 0.14 : 0.04
      break
    }
    case 'pray':
      Object.assign(p, PRAY)
      p.headPitch = 0.12
      p.torsoPitch = 0.05
      break
    case 'incense': {
      // Nâng hương ngang trán, vái nhẹ
      const bow = (Math.sin(t * 2.2) * 0.5 + 0.5) * 0.22
      Object.assign(p, { armL: 0.82, armR: 0.82, inL: 0.36, inR: 0.36, elbowL: 1.95, elbowR: 1.95 })
      p.torsoPitch = bow
      p.headPitch = 0.08
      break
    }
    case 'kneel':
      Object.assign(p, PRAY)
      p.rootY = -0.27
      p.kneeL = 1.57
      p.kneeR = 1.57
      p.skirtSquash = 0.42
      p.headPitch = 0.1
      break
    case 'bow': {
      // Lạy: quỳ xuống → cúi rạp, hai tay đặt xuống trước → đứng lên; chu kỳ 3 giây
      const c = (t % 3) / 3
      const k = c < 0.2 ? c / 0.2 : c > 0.8 ? (1 - c) / 0.2 : 1
      const down = c > 0.3 && c < 0.7 ? Math.sin(((c - 0.3) / 0.4) * Math.PI) : 0
      p.rootY = -0.27 * k
      p.kneeL = 1.57 * k
      p.kneeR = 1.57 * k
      p.skirtSquash = 0.42 * k
      p.torsoPitch = 0.08 * k + 1.15 * down
      p.armL = 0.42 + down * 0.85
      p.armR = 0.42 + down * 0.85
      p.inL = 0.42 * (1 - down) + 0.1 * down
      p.inR = p.inL
      p.elbowL = 1.75 * (1 - down) + 0.3 * down
      p.elbowR = p.elbowL
      p.headPitch = 0.2
      break
    }
    case 'sit': {
      // Ngồi kiết già: hông hạ sát đất, đùi xoè ra trước, gối gập, vạt áo xoè phủ chân, tay đặt trên đùi
      const b = Math.sin(t * 0.9)
      p.rootY = -0.52
      p.thighL = 1.35
      p.thighR = 1.35
      p.spread = 0.85
      p.kneeL = 2.35
      p.kneeR = 2.35
      p.skirtSquash = 0.72
      p.skirtFlare = 1.45
      Object.assign(p, { armL: 0.32, armR: 0.32, inL: 0.32, inR: 0.32, elbowL: 1.15, elbowR: 1.15 })
      p.torsoPitch = 0.02 + b * 0.01
      p.headPitch = 0.08
      break
    }
    case 'seated': {
      // Ngồi ghế (ghế đá, cabin cáp treo): đùi nằm ngang ra trước, cẳng chân buông thẳng, tay đặt trên đùi.
      // Gốc toạ độ nhân vật đặt ở tâm mặt ghế (trên mặt sàn) → hông cao ~0.42 m
      const b = Math.sin(t * 1.4)
      p.rootY = -0.24
      p.thighL = 1.5
      p.thighR = 1.5
      p.kneeL = 1.5
      p.kneeR = 1.5
      p.spread = 0.08
      p.skirtSquash = 0.3
      Object.assign(p, { armL: 0.55, armR: 0.55, inL: 0.18, inR: 0.18, elbowL: 0.95, elbowR: 0.95 })
      p.torsoPitch = -0.04 + b * 0.008
      p.headPitch = 0.02
      break
    }
    case 'sweep': {
      const s = Math.sin(t * 4.2)
      p.torsoPitch = 0.28
      p.torsoYaw = s * 0.35
      Object.assign(p, { armL: 0.9, armR: 0.7, inL: 0.25, inR: 0.25, elbowL: 0.5, elbowR: 0.6 })
      p.thighL = Math.max(0, s) * 0.18
      p.thighR = Math.max(0, -s) * 0.18
      p.kneeL = 0.15
      p.kneeR = 0.15
      p.rootY = -0.02
      break
    }
    case 'bell': {
      // Sẵn sàng thỉnh chuông: hai tay đưa lên nắm dây kéo chày, thở đều
      const b = Math.sin(t * 1.5) * 0.02
      Object.assign(p, { armL: 2.25 + b, armR: 2.25 + b, inL: 0.28, inR: 0.28, elbowL: 0.45, elbowR: 0.45 })
      p.headPitch = -0.25
      break
    }
    case 'bell-pull': {
      // Lấy đà: ngả người ra sau, lùi chân phải, kéo dây về sát ngực (theo lực kéo 0..1)
      const k = Math.max(0, Math.min(1, pull))
      Object.assign(p, { armL: 2.25 - k * 0.85, armR: 2.25 - k * 0.85, inL: 0.3, inR: 0.3, elbowL: 0.45 + k * 1.25, elbowR: 0.45 + k * 1.25 })
      p.torsoPitch = -0.28 * k
      p.thighR = -0.38 * k
      p.kneeR = 0.25 * k
      p.thighL = 0.12 * k
      p.kneeL = 0.3 * k
      p.rootY = -0.05 * k
      p.headPitch = -0.25 + 0.1 * k
      break
    }
    case 'bell-strike': {
      // Đánh: nhoài người tới, hai tay đẩy thẳng ra trước (0–0.2 s), rồi thu về tư thế sẵn sàng (tới ~1.2 s)
      const thrust = t < 0.2 ? t / 0.2 : Math.max(0, 1 - (t - 0.2) / 1)
      const e = thrust * thrust * (3 - 2 * thrust)
      Object.assign(p, { armL: 2.25 - e * 0.85, armR: 2.25 - e * 0.85, inL: 0.28, inR: 0.28, elbowL: 0.45 - e * 0.35, elbowR: 0.45 - e * 0.35 })
      p.torsoPitch = 0.32 * e
      p.thighL = 0.4 * e
      p.kneeL = 0.35 * e
      p.thighR = -0.2 * e
      p.rootY = -0.06 * e
      p.headPitch = -0.25 + 0.2 * e
      break
    }
    case 'wave':
      p.armR = 2.8
      p.elbowR = 0.45
      p.inR = -0.25 + Math.sin(t * 8) * 0.25
      break
    case 'look': {
      // Đứng ngắm cảnh: quay đầu chậm sang hai bên, thân vặn theo một chút, thỉnh thoảng ngẩng nhìn cao
      const s = Math.sin(t * 0.85)
      p.headYaw = s * 0.75
      p.torsoYaw = s * 0.18
      p.headPitch = -0.12 - Math.max(0, Math.sin(t * 0.43)) * 0.18
      p.armL = 0.05
      p.armR = 0.05
      break
    }
    case 'vai': {
      // Chắp tay vái ba vái (đứng), mỗi vái 1.5 giây
      const c = (t % 1.5) / 1.5
      const bow = Math.sin(Math.PI * c) ** 2
      Object.assign(p, PRAY)
      p.torsoPitch = 0.05 + bow * 0.55
      p.headPitch = 0.12 + bow * 0.3
      p.elbowL = 1.75 - bow * 0.2
      p.elbowR = p.elbowL
      break
    }
    case 'twirl': {
      // Múa gậy: tay phải đưa ra trước xoay binh khí (Avatar quay vật trong tay), tay trái chống hông,
      // chân trụ khuỵu, thỉnh thoảng giơ gậy lên quá đầu
      const up = Math.max(0, Math.sin(t * 1.6)) ** 2
      const sway = Math.sin(t * 3.2)
      p.armR = 1.35 + up * 1.3
      p.inR = -0.05
      p.elbowR = 0.35 - up * 0.25
      p.armL = -0.25
      p.inL = -0.55
      p.elbowL = 1.5
      p.spread = 0.22
      p.thighL = 0.25
      p.thighR = 0.25
      p.kneeL = 0.4
      p.kneeR = 0.4
      p.rootY = -0.07 + sway * 0.01
      p.torsoYaw = sway * 0.15
      p.torsoPitch = 0.06
      p.headPitch = -0.08 - up * 0.2
      break
    }
    case 'jump': {
      // Bật lên: co gối, vung hai tay lên lấy đà → qua đỉnh: duỗi chân đón đất, dang tay giữ thăng bằng
      const u = (Math.max(-1, Math.min(1, air)) + 1) / 2 // 0 = bật lên, 1 = rơi xuống
      p.thighL = 0.75 - 0.5 * u
      p.thighR = 0.55 - 0.45 * u
      p.kneeL = 1.15 - 0.85 * u
      p.kneeR = 1.0 - 0.75 * u
      p.armL = 1.25 - 0.75 * u
      p.armR = 1.25 - 0.75 * u
      p.inL = -0.1 - 0.45 * u
      p.inR = -0.1 - 0.45 * u
      p.elbowL = 0.5 - 0.2 * u
      p.elbowR = 0.5 - 0.2 * u
      p.torsoPitch = 0.12 - 0.08 * u
      p.headPitch = -0.12 + 0.25 * u // bay lên ngẩng, rơi xuống nhìn chỗ đặt chân
      p.skirtFlare = 1.12 + 0.12 * u // vạt áo xoè khi rơi
      p.lean = 0.06
      break
    }
    case 'land':
      // Tiếp đất: khuỵu gối, hạ thấp người, tay đưa ra trước đỡ đà
      p.rootY = -0.13
      p.thighL = 0.8
      p.thighR = 0.8
      p.kneeL = 1.15
      p.kneeR = 1.15
      p.torsoPitch = 0.3
      p.armL = 0.55
      p.armR = 0.55
      p.inL = -0.2
      p.inR = -0.2
      p.elbowL = 0.5
      p.elbowR = 0.5
      p.headPitch = -0.2
      p.skirtSquash = 0.12
      break
    case 'tired': {
      // Khom người thở dốc: gập ở hông, gối chùng, tay chống lên đùi/gối, đầu ngẩng nhìn trước
      const f = 3.5 + 3 * tired
      const breath = Math.sin(t * f)
      p.torsoPitch = 0.6 + 0.08 * tired + breath * 0.05
      p.thighL = 0.32
      p.thighR = 0.32
      p.kneeL = 0.5
      p.kneeR = 0.5
      p.rootY = -0.05 + breath * 0.012
      // Tay buông theo thân đã gập → bù ngược một chút để bàn tay chạm gối
      p.armL = -0.22 + breath * 0.03
      p.armR = -0.22 + breath * 0.03
      p.inL = 0.2
      p.inR = 0.2
      p.elbowL = 0.25
      p.elbowR = 0.25
      p.headPitch = -0.5 - breath * 0.04
      break
    }
    default: {
      // Đứng yên: thở nhẹ
      const b = Math.sin(t * 1.6)
      p.torsoPitch = b * 0.012
      p.rootY = b * 0.004
    }
  }
  return p
}

/** Bưng khay trà: hai cẳng tay đưa ngang ra trước đỡ khay (ghi đè tay của mọi tư thế) */
export function applyCarry(p) {
  return { ...p, armL: 0.72, armR: 0.72, inL: 0.24, inR: 0.24, elbowL: 1.05, elbowR: 1.05 }
}

/**
 * Vị trí bàn tay (hệ toạ độ thân, gốc tại hông) khi chỉ xét vai + khuỷu, bỏ qua khép tay.
 * Dùng trong test để kiểm tra tay không đâm vào thân/vạt áo.
 */
export function handPosition(arm, elbow) {
  const { shoulderY, upperArm, forearm } = RIG
  // Góc so với phương thẳng đứng hướng xuống, dương = ra trước
  const a1 = arm
  const a2 = arm + elbow
  const y = shoulderY - Math.cos(a1) * upperArm - Math.cos(a2) * forearm
  const z = Math.sin(a1) * upperArm + Math.sin(a2) * forearm
  return { y, z }
}
