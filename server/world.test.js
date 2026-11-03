// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { World } from './world.js'

const look = (name) => ({ name, role: 'phat-tu', costume: null, hat: null })

function setup() {
  const inbox = new Map()
  let clock = 1_000_000
  const world = new World({
    send: (id, msg) => {
      if (!inbox.has(id)) inbox.set(id, [])
      inbox.get(id).push(msg)
    },
    now: () => clock,
  })
  const take = (id, t) => {
    const all = inbox.get(id) ?? []
    inbox.set(id, [])
    return t ? all.filter((m) => m.t === t) : all
  }
  return { world, take, advance: (ms) => (clock += ms) }
}

describe('thế giới chung theo khu', () => {
  it('vào khu: nhận danh sách người đang ở đó, người cũ được báo có người mới', () => {
    const { world, take } = setup()
    world.join(1, { userId: 11, look: look('An') })
    world.join(2, { userId: 12, look: look('Bình') })
    world.state(1, { z: 'chan-nui', p: [0, 0, 0, 0], a: 'idle' })
    take(1)
    world.state(2, { z: 'chan-nui', p: [3, 0, 0, 0], a: 'walk' })
    expect(take(2, 'roster')[0].players.map((p) => p.name)).toEqual(['An'])
    expect(take(1, 'join')[0]).toMatchObject({ id: 2, name: 'Bình' })
  })

  it('chỉ gửi vị trí người cùng khu & trong tầm nhìn; khác khu thì không', () => {
    const { world, take } = setup()
    world.join(1, { userId: 11, look: look('An') })
    world.join(2, { userId: 12, look: look('Bình') })
    world.join(3, { userId: 13, look: look('Chi') })
    world.state(1, { z: 'chua-ba', p: [0, 26, 0, 0] })
    world.state(2, { z: 'chua-ba', p: [5, 26, 0, 1], a: 'bow', s: 0 })
    world.state(3, { z: 'dinh-nui', p: [5, 56, 0, 0] })
    take(1)
    world.tick()
    const snap = take(1, 'snap')[0]
    expect(snap.ps.map((r) => r[0])).toEqual([2])
    expect(snap.ps[0][5]).toBe('bow')
  })

  it('người đứng yên vẫn được nhắc lại mỗi giây; không đổi gì thì không gửi lặp mỗi nhịp', () => {
    const { world, take, advance } = setup()
    world.join(1, { userId: 11, look: look('An') })
    world.join(2, { userId: 12, look: look('Bình') })
    world.state(1, { z: 'z', p: [0, 0, 0, 0] })
    world.state(2, { z: 'z', p: [2, 0, 0, 0] })
    world.tick()
    take(1)
    advance(100)
    world.tick()
    expect(take(1, 'snap')).toHaveLength(0)
    advance(1000)
    world.tick()
    expect(take(1, 'snap')).toHaveLength(1)
  })

  it('đổi khu: người ở khu cũ được báo rời đi', () => {
    const { world, take } = setup()
    world.join(1, { userId: 11, look: look('An') })
    world.join(2, { userId: 12, look: look('Bình') })
    world.state(1, { z: 'a', p: [0, 0, 0, 0] })
    world.state(2, { z: 'a', p: [1, 0, 0, 0] })
    take(1)
    world.state(2, { z: 'b', p: [1, 0, 0, 0] })
    expect(take(1, 'leave')[0].id).toBe(2)
  })

  it('chat gần chỉ người trong 30 m nghe; chat cả khu thì mọi người; nhắn dồn bị chặn; lời thô tục bị che', () => {
    const { world, take, advance } = setup()
    for (const [id, x] of [
      [1, 0],
      [2, 10],
      [3, 60],
    ]) {
      world.join(id, { userId: id, look: look(`N${id}`) })
      world.state(id, { z: 'z', p: [x, 0, 0, 0] })
    }
    ;[1, 2, 3].forEach((id) => take(id))
    world.chat(1, { scope: 'near', text: 'A Di Đà Phật' })
    expect(take(2, 'chat')[0].text).toBe('A Di Đà Phật')
    expect(take(3, 'chat')).toHaveLength(0)
    expect(world.chat(1, { scope: 'zone', text: 'nữa' })).toMatch(/nhanh/)
    advance(2000)
    world.chat(1, { scope: 'zone', text: 'đẹp vcl' })
    expect(take(3, 'chat')[0].text).toBe('đẹp ***')
  })

  it('sự kiện chung: chuông cả khu nghe, biểu cảm hợp lệ mới gửi', () => {
    const { world, take } = setup()
    world.join(1, { userId: 1, look: look('A') })
    world.join(2, { userId: 2, look: look('B') })
    world.state(1, { z: 'z', p: [0, 0, 0, 0] })
    world.state(2, { z: 'z', p: [70, 0, 0, 0] })
    take(2)
    world.event(1, { kind: 'bell', spot: 'chua-ba-gac-chuong', power: 0.8 })
    expect(take(2, 'ev')[0]).toMatchObject({ kind: 'bell', spot: 'chua-ba-gac-chuong', power: 0.8 })
    world.event(1, { kind: 'hack', spot: 'x' })
    world.emote(1, 'khong-co')
    world.emote(1, 'a-di-da')
    expect(take(2).map((m) => m.t)).toEqual(['emote'])
  })

  it('500 người cùng khu: mỗi người chỉ nhận tối đa 40 người gần nhất', () => {
    const { world, take } = setup()
    for (let i = 1; i <= 500; i++) {
      world.join(i, { userId: i, look: look(`N${i}`) })
      world.state(i, { z: 'z', p: [(i % 25) * 3, 0, Math.floor(i / 25) * 3, 0] })
    }
    take(1)
    world.tick()
    expect(take(1, 'snap')[0].ps.length).toBe(40)
  })
})
