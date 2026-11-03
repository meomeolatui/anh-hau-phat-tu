import { describe, expect, it } from 'vitest'
import { HANG, anchorOf, cabinOnRoute, cableLines, pointOnLine, routeBetween, routeLength } from './cableway'
import { groundSurface } from './world/terrainGrid'

describe('cáp treo', () => {
  const lines = cableLines()

  it('mỗi tuyến bắt đầu và kết thúc đúng bánh xe trong nhà ga', () => {
    for (const l of lines) {
      expect(l.points[0]).toEqual(anchorOf(l.from))
      expect(l.points[l.points.length - 1]).toEqual(anchorOf(l.to))
    }
  })

  it('cabin luôn lơ lửng trên mặt đất (không cắm vào núi) dọc cả tuyến', () => {
    for (const l of lines) {
      for (let s = l.length * 0.08; s < l.length * 0.92; s += 2) {
        const [x, y, z] = pointOnLine(l, s)
        expect(y - HANG - 1, `${l.id} @${s.toFixed(0)}m`).toBeGreaterThan(groundSurface(x, z))
      }
    }
  })

  it('có trụ đỡ ở các đoạn cáp phải vượt địa hình, trụ đứng trên mặt đất', () => {
    const towers = lines.flatMap((l) => l.towers)
    expect(towers.length).toBeGreaterThan(0)
    for (const t of towers) expect(t.top).toBeGreaterThan(t.ground + 5)
  })

  it('hành trình chân núi → đỉnh đi qua ga chùa Bà (2 chặng), chiều ngược lại đảo hướng', () => {
    const up = routeBetween('chan-nui', 'dinh-nui')
    expect(up).toHaveLength(2)
    expect(up.every((l) => !l.reverse)).toBe(true)
    const down = routeBetween('dinh-nui', 'chua-ba')
    expect(down).toHaveLength(1)
    expect(down[0].reverse).toBe(true)
    expect(routeBetween('chua-ba', 'chua-ba')).toBeNull()
  })

  it('nhìn từ ga thấp lên: cabin đi lên chạy sợi bên PHẢI, cabin đi xuống chạy sợi bên TRÁI', () => {
    const line = lines[0]
    const mid = line.length / 2
    const center = pointOnLine(line, mid, 0)
    // Bên phải của hướng tuyến h (nhìn theo hướng đi lên) = (−cos h, sin h)
    const rx = -Math.cos(line.heading)
    const rz = Math.sin(line.heading)
    const side = (p) => (p[0] - center[0]) * rx + (p[2] - center[2]) * rz
    const up = cabinOnRoute([{ line, reverse: false }], mid).cabin
    const down = cabinOnRoute([{ line, reverse: true }], line.length - mid).cabin
    expect(side(up)).toBeGreaterThan(0.5)
    expect(side(down)).toBeLessThan(-0.5)
  })

  it('cabin bắt đầu ở ga đi, kết thúc ở ga đến, báo xong khi tới nơi', () => {
    const legs = routeBetween('chan-nui', 'dinh-nui')
    const start = cabinOnRoute(legs, 0)
    const end = cabinOnRoute(legs, routeLength(legs) + 5)
    expect(start.cabin[1]).toBeCloseTo(anchorOf('chan-nui')[1] - HANG, 0)
    expect(end.cabin[1]).toBeCloseTo(anchorOf('dinh-nui')[1] - HANG, 0)
    expect(start.done).toBe(false)
    expect(end.done).toBe(true)
  })
})
