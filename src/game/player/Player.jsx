import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'
import Avatar from './Avatar'
import { emit, on, runtime } from '../runtime'
import { colliders, findNearest } from '../interaction'
import { stepMove } from '../world/navigation'
import { ZONES } from '../world/layout'
import { discoverZone, getGame, saveLastPosition, updateUi, useGame } from '../state'
import { canRun, showTired, speedFactor, stepStamina, tiredness } from '../stamina'
import { stepRide } from '../ride'
import { PLAYER_GROUP } from './cameraPicker'
import { firstPersonActive } from './firstPerson'
import { canJump, startJump, stepJump } from './jump'
import { stepIdle } from './idleActions'
import { haptic, playLand } from '../../lib/sound'

const WALK = 3.2
const RUN = 6.2

/** Góc ngắn nhất từ a tới b */
function angleDelta(a, b) {
  let d = (b - a) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

export default function Player() {
  const group = useRef()
  const baseProfile = useGame((s) => s.save.profile)
  const wardrobe = useGame((s) => s.save.wardrobe)
  const tryOn = useGame((s) => s.ui.tryOn)
  // Đồ đang mặc thử ở sạp (chưa mua) đè lên đồ đã mặc
  const profile = useMemo(
    () => ({
      ...baseProfile,
      costume: tryOn && 'costume' in tryOn ? tryOn.costume : wardrobe.costume,
      hat: tryOn && 'hat' in tryOn ? tryOn.hat : wardrobe.hat,
    }),
    [baseProfile, wardrobe, tryOn],
  )
  // Động tác đứng yên theo bộ đồ (đọc trong useFrame qua ref)
  const idle = useRef({ wait: 0, kind: null, t: 0 })
  const costume = useRef(null)
  useEffect(() => {
    costume.current = profile.costume
  }, [profile.costume])
  const lastZone = useRef(null)
  const lastPrompt = useRef(null)
  const saveTimer = useRef(0)

  // Dịch chuyển (cáp treo, về điểm xuất phát)
  useEffect(
    () =>
      on('teleport', ({ position, rotY }) => {
        runtime.player.position.set(...position)
        if (rotY !== undefined) {
          runtime.player.rotY = rotY
          runtime.camera.yaw = rotY
        }
      }),
    [],
  )

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const p = runtime.player
    const input = runtime.input
    const ui = getGame().ui
    // Nhìn bằng mắt nhân vật thì ẩn thân người (kẻo che camera)
    const fp = firstPersonActive(runtime.camera, ui.activity)
    group.current.visible = !fp

    // ---- Đang ngồi cáp treo: vị trí theo cabin, bỏ qua đi bộ ----
    if (stepRide(dt)) {
      Object.assign(p.jump, { h: 0, vy: 0, airborne: false, land: 0 })
      input.jump = false
      const st = stepStamina(p.stamina, { moving: false, running: false, climbing: false, sitting: true, resting: false }, dt)
      Object.assign(p.stamina, { value: st.value, exhausted: st.exhausted, idleFor: st.idleFor })
      group.current.position.copy(p.position)
      group.current.rotation.y = p.rotY
      if (lastPrompt.current !== null) {
        lastPrompt.current = null
        runtime.nearestInteractable = null
        updateUi({ prompt: null })
      }
      return
    }

    // ---- Di chuyển theo hướng camera ----
    // Hoạt động cần đứng yên sẽ gọi lockPlayer(true); quét lá thì vẫn đi lại được
    const busy = p.locked
    let mx = busy ? 0 : input.moveX
    let mz = busy ? 0 : input.moveZ
    const len = Math.hypot(mx, mz)
    if (len > 1) {
      mx /= len
      mz /= len
    }
    const yaw = runtime.camera.yaw
    const fx = Math.sin(yaw)
    const fz = Math.cos(yaw)
    const rx = -Math.cos(yaw)
    const rz = Math.sin(yaw)
    const dirX = fx * mz + rx * mx
    const dirZ = fz * mz + rz * mx
    const moving = Math.hypot(dirX, dirZ) > 0.05
    // Thể lực: kiệt sức thì không chạy được và đi chậm lại
    const running = moving && input.run && p.holding !== 'broom' && canRun(p.stamina)
    const target = moving ? (running ? RUN : WALK * speedFactor(p.stamina)) * Math.min(1, Math.hypot(mx, mz)) : 0
    p.speed = MathUtils.damp(p.speed, target, 10, dt)

    const prevY = p.position.y
    if (p.speed > 0.01) {
      const n = Math.hypot(dirX, dirZ) || 1
      const vx = moving ? (dirX / n) * p.speed : Math.sin(p.rotY) * p.speed
      const vz = moving ? (dirZ / n) * p.speed : Math.cos(p.rotY) * p.speed
      const next = stepMove(p.position, vx * dt, vz * dt, { colliders })
      p.position.set(next.x, MathUtils.damp(p.position.y, next.y, 20, dt), next.z)
      if (moving) p.rotY += angleDelta(p.rotY, Math.atan2(dirX, dirZ)) * Math.min(1, dt * 12)

      if (next.walkable && next.walkable.zone !== lastZone.current) {
        lastZone.current = next.walkable.zone
        runtime.zoneId = next.walkable.zone
        const z = ZONES[next.walkable.zone]
        if (z) {
          const first = discoverZone(z.id)
          updateUi({ zone: { id: z.id, name: z.name, subtitle: z.subtitle } })
          emit('zone', { ...z, first })
        }
      }
    }

    // ---- Nhảy (Space) ----
    if (input.jump) {
      input.jump = false
      if (!ui.activity && canJump(p.jump, { locked: busy, stamina: p.stamina })) {
        startJump(p.jump)
        p.stamina.value = Math.max(0, p.stamina.value - 2)
        p.stamina.idleFor = 0
      }
    }
    if (stepJump(p.jump, dt)) {
      playLand()
      haptic(10)
    }

    // ---- Thể lực ----
    const climbing = moving && p.position.y - prevY > 0.2 * dt
    const sitting = p.locked && (p.anim === 'sit' || p.anim === 'seated' || p.anim === 'kneel' || p.anim === 'bow')
    const st = stepStamina(p.stamina, { moving: moving && p.speed > 0.3, running: running && p.speed > 4, climbing, sitting, resting: p.resting }, dt)
    p.stamina.value = st.value
    p.stamina.exhausted = st.exhausted
    p.stamina.idleFor = st.idleFor
    if (st.becameExhausted) {
      emit('toast', { title: 'Bạn thấm mệt rồi', description: 'Đứng nghỉ một chút, hoặc tìm ghế đá ngồi nghỉ chân để hồi sức nhanh hơn.' })
    }

    if (!p.locked && !ui.activity) {
      p.tiredness = tiredness(p.stamina)
      if (p.jump.airborne) p.anim = 'jump'
      else if (p.jump.land > 0) p.anim = 'land'
      else if (p.holding === 'broom') p.anim = 'sweep'
      else if (p.speed > 0.25) p.anim = p.speed > 4.2 ? 'run' : 'walk'
      // Đứng lại khi đuối sức: khom người, chống tay lên gối thở dốc
      else p.anim = showTired(p.stamina, true) ? 'tired' : 'idle'
    }

    // ---- Biểu cảm (A Di Đà Phật, chúc bình an, vẫy tay…): giữ động tác tới hết giờ, di chuyển là huỷ ----
    if (p.emote) {
      if (performance.now() > p.emote.until || p.locked || ui.activity || p.speed > 0.25 || p.jump.airborne) p.emote = null
      else p.anim = p.emote.anim
    }

    // ---- Đứng yên lâu: múa gậy / lạy bốn phương / ngắm cảnh… (huỷ ngay khi bấm di chuyển, nhảy) ----
    const still =
      !p.locked && !ui.activity && !fp && p.anim === 'idle' && !p.holding && !input.moveX && !input.moveZ && !input.jump && !p.jump.airborne
    const act = stepIdle(idle.current, still, costume.current, dt)
    if (act) {
      p.anim = act.anim
      p.rotY += act.turnRate * dt
    }

    // Góc nhìn thứ nhất: người luôn quay theo hướng nhìn (đi ngang không xoay người) → bấm E đúng thứ đang nhìn
    if (fp && !p.locked) p.rotY = runtime.camera.yaw

    group.current.position.copy(p.position)
    group.current.position.y += p.jump.h
    group.current.rotation.y = p.rotY

    // ---- Điểm tương tác gần nhất ----
    const near = !busy && !ui.activity ? findNearest(p.position, p.rotY) : null
    const nearId = near?.id ?? null
    if (nearId !== lastPrompt.current) {
      lastPrompt.current = nearId
      runtime.nearestInteractable = nearId
      updateUi({ prompt: near ? { id: near.id, label: near.label, verb: near.verb } : null })
    }

    // ---- Lưu vị trí định kỳ ----
    saveTimer.current += dt
    if (saveTimer.current > 5) {
      saveTimer.current = 0
      const { x, y, z } = p.position
      saveLastPosition([+x.toFixed(2), +y.toFixed(2), +z.toFixed(2), +p.rotY.toFixed(3)])
    }
  })

  return (
    <group ref={group} name={PLAYER_GROUP}>
      <Avatar source={runtime.player} profile={profile} />
    </group>
  )
}
