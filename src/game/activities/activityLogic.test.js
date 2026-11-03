import { describe, expect, it } from 'vitest'
import { cleanWish, driftAt, driftParams, lanternPetal, launchPoint, LANTERN_COLORS, MAX_WISH } from './hoaDangLogic'
import { gradeTap, isHit, phaseAt, ringOpacity, ringScale, rhythmConfig, TARGET_PHASE } from './lePhatLogic'
import { gradeStrike, PENDULUM, powerFromHold, FILL_MS, releaseVelocity, stepPendulum } from './chuongLogic'
import { breathAt, fullMinutes, formatClock, INHALE_MS, BREATH_MS } from './thienLogic'
import { beatsBefore, CHANT_IDS, chantMerit, countBeats, flattenSutra, lineDuration, nextPosition, parseLine } from './kinhLogic'
import { arrivalRotY, canTravel, rideCamera, rideDirection, stationList } from './capTreoLogic'
import { heardKey, initialOf, typedLength } from './hoiChuyenLogic'
import { getSutra } from '../../data/sutras'
import { CABLE_STATIONS } from '../world/layout'

describe('Lễ Phật — nhịp vòng sen', () => {
  it('vòng sen khớp vòng đích (scale 1) đúng ở TARGET_PHASE', () => {
    expect(ringScale(TARGET_PHASE)).toBeCloseTo(1, 6)
    expect(ringScale(0)).toBeGreaterThan(1)
    expect(ringScale(1)).toBeLessThan(1)
  })

  it('bấm đúng lúc là "perfect", lệch chút là "good"', () => {
    expect(gradeTap(TARGET_PHASE)).toBe('perfect')
    expect(gradeTap(TARGET_PHASE + 0.08)).toBe('good')
  })

  it('bấm quá sớm / quá muộn được nhắc nhẹ, không tính lạy', () => {
    expect(gradeTap(0.2)).toBe('early')
    expect(gradeTap(0.98)).toBe('late')
    expect(isHit('early')).toBe(false)
    expect(isHit('good')).toBe(true)
  })

  it('chế độ dễ và lỡ nhịp liên tiếp đều nới rộng cửa sổ', () => {
    const p = TARGET_PHASE - 0.15
    expect(gradeTap(p)).toBe('early')
    expect(gradeTap(p, { easy: true })).toBe('good')
    expect(gradeTap(p, { misses: 3 })).toBe('good')
    expect(gradeTap(TARGET_PHASE - 0.3, { misses: 3 })).toBe('early')
    expect(rhythmConfig(true).period).toBeGreaterThan(rhythmConfig(false).period)
  })

  it('pha tính vòng theo chu kỳ', () => {
    expect(phaseAt(1500, 0, 1000)).toBeCloseTo(0.5)
    expect(phaseAt(0, 0, 1000)).toBe(0)
    expect(ringOpacity(0)).toBe(0)
    expect(ringOpacity(TARGET_PHASE)).toBe(1)
  })
})

describe('Thỉnh chuông — lực và con lắc', () => {
  it('lực tăng tới đầy rồi lùi lại khi giữ quá lâu', () => {
    expect(powerFromHold(0)).toBe(0)
    expect(powerFromHold(FILL_MS / 2)).toBeCloseTo(0.5)
    expect(powerFromHold(FILL_MS)).toBeCloseTo(1)
    expect(powerFromHold(FILL_MS * 1.5)).toBeCloseTo(0.5)
    expect(powerFromHold(FILL_MS * 2)).toBeCloseTo(0)
  })

  it('chấm tiếng chuông theo vùng lực', () => {
    expect(gradeStrike(0.2)).toBe('nhe')
    expect(gradeStrike(0.65)).toBe('ngan')
    expect(gradeStrike(0.95)).toBe('manh')
  })

  it('kéo lùi chày thì góc âm; thả với vận tốc thì chạm chuông và nảy lại', () => {
    let s = { angle: 0, vel: 0 }
    for (let i = 0; i < 120; i++) s = stepPendulum(s, 1 / 60, 1)
    expect(s.angle).toBeLessThan(-PENDULUM.maxPull * 0.8)
    s = { angle: s.angle, vel: releaseVelocity(0.6) }
    let hit = 0
    for (let i = 0; i < 60 && !hit; i++) {
      s = stepPendulum(s, 1 / 60, 0)
      hit = s.impact
    }
    expect(hit).toBeGreaterThan(0)
    expect(s.angle).toBeLessThanOrEqual(PENDULUM.contact)
    expect(s.vel).toBeLessThan(0)
  })

  it('để yên thì chày đứng ở vị trí nghỉ', () => {
    const s = stepPendulum({ angle: 0, vel: 0 }, 0.05, 0)
    expect(s.angle).toBe(0)
    expect(s.impact).toBe(0)
  })
})

describe('Thiền định — hơi thở & thời gian', () => {
  it('hít vào 4 giây rồi thở ra 6 giây', () => {
    expect(breathAt(0).phase).toBe('hit')
    expect(breathAt(INHALE_MS - 1).phase).toBe('hit')
    expect(breathAt(INHALE_MS + 1).phase).toBe('tho')
    expect(breathAt(BREATH_MS).phase).toBe('hit')
    expect(breathAt(BREATH_MS * 3 + 10).cycle).toBe(3)
  })

  it('vòng hướng dẫn lớn nhất khi hít đầy, nhỏ nhất khi thở hết', () => {
    expect(breathAt(0).scale).toBeCloseTo(0.6)
    expect(breathAt(INHALE_MS).scale).toBeCloseTo(1)
    expect(breathAt(BREATH_MS - 1).scale).toBeCloseTo(0.6, 2)
  })

  it('chỉ tính phút trọn vẹn và không vượt thời lượng đã chọn', () => {
    expect(fullMinutes(59_999, 5)).toBe(0)
    expect(fullMinutes(125_000, 5)).toBe(2)
    expect(fullMinutes(20 * 60_000, 3)).toBe(3)
    expect(fullMinutes(-5, 3)).toBe(0)
  })

  it('định dạng đồng hồ m:ss', () => {
    expect(formatClock(65_000)).toBe('1:05')
    expect(formatClock(0)).toBe('0:00')
  })
})

describe('Tụng kinh — dàn dòng & tiến trình', () => {
  it('tách ký hiệu lặp "(3 lần)"', () => {
    expect(parseLine('Án ma ni bát di hồng. (7 lần)')).toEqual({ text: 'Án ma ni bát di hồng.', repeat: 7 })
    expect(parseLine('Quy y Phật.')).toEqual({ text: 'Quy y Phật.', repeat: 1 })
  })

  it('mọi bài trong danh sách tụng đều có trong thư viện và có dòng', () => {
    for (const id of CHANT_IDS) {
      const lines = flattenSutra(getSutra(id), getSutra)
      expect(lines.length, id).toBeGreaterThan(0)
    }
  })

  it('dòng đầu mỗi đoạn mang tiêu đề đoạn; bài dẫn chiếu được chèn vào', () => {
    const tamQuy = flattenSutra(getSutra('ke-tam-quy'), getSutra)
    expect(tamQuy[0].heading).toBe('Tam quy')
    expect(tamQuy.filter((l) => l.heading).length).toBe(2)
    const fake = { sections: [{ lines: ['A'] }, { ref: 'ke-hoi-huong' }] }
    const merged = flattenSutra(fake, getSutra)
    expect(merged.length).toBe(5)
    expect(merged[1].heading).toBe('Kệ Hồi Hướng')
  })

  it('đi hết các nhịp kể cả dòng lặp rồi kết thúc', () => {
    const lines = [
      { text: 'a', repeat: 2 },
      { text: 'b', repeat: 1 },
    ]
    expect(countBeats(lines)).toBe(3)
    let pos = { line: 0, rep: 0 }
    const seen = [pos]
    while ((pos = nextPosition(pos, lines))) seen.push(pos)
    expect(seen).toEqual([
      { line: 0, rep: 0 },
      { line: 0, rep: 1 },
      { line: 1, rep: 0 },
    ])
    expect(beatsBefore({ line: 1, rep: 0 }, lines)).toBe(2)
  })

  it('thời gian dòng theo số chữ, có giới hạn, chia theo tốc độ', () => {
    expect(lineDuration('a')).toBe(2000)
    expect(lineDuration('một hai ba bốn năm sáu bảy tám chín mười')).toBe(4400)
    expect(lineDuration('một hai ba bốn năm sáu bảy tám chín mười', 2)).toBe(2200)
  })

  it('công đức tụng kinh trong khoảng 25–50 theo độ dài', () => {
    expect(chantMerit(1)).toBe(25)
    expect(chantMerit(4)).toBe(25)
    expect(chantMerit(30)).toBe(50)
    expect(chantMerit(200)).toBe(50)
    const tamKinh = countBeats(flattenSutra(getSutra('bat-nha-tam-kinh'), getSutra))
    expect(chantMerit(tamKinh)).toBeGreaterThan(chantMerit(4))
  })
})

describe('Cáp treo — chọn ga', () => {
  it('liệt kê đủ ga, đánh dấu ga đang đứng', () => {
    const list = stationList('chua-ba')
    expect(list.map((s) => s.id)).toEqual(Object.keys(CABLE_STATIONS))
    expect(list.filter((s) => s.current).map((s) => s.id)).toEqual(['chua-ba'])
  })

  it('không cho đi tới chính ga đang đứng hoặc ga không tồn tại', () => {
    expect(canTravel('chan-nui', 'chan-nui')).toBe(false)
    expect(canTravel('chan-nui', 'khong-co')).toBe(false)
    expect(canTravel('chan-nui', 'dinh-nui')).toBe(true)
  })

  it('xuống ga quay mặt từ nhà ga ra điểm đứng', () => {
    const st = { position: [0, 0, 0], arrive: [0, 0, 5] }
    expect(arrivalRotY(st)).toBeCloseTo(0)
    expect(arrivalRotY({ position: [0, 0, 0], arrive: [-3, 0, 0] })).toBeCloseTo(-Math.PI / 2)
  })

  it('hướng lên/xuống và camera bắt đầu – kết thúc gần hai ga', () => {
    const a = CABLE_STATIONS['chan-nui']
    const b = CABLE_STATIONS['dinh-nui']
    expect(rideDirection(a, b)).toBe('len')
    expect(rideDirection(b, a)).toBe('xuong')
    const s = rideCamera(a, b, 0)
    const e = rideCamera(a, b, 1)
    expect(s.target[0]).toBeCloseTo(a.position[0])
    expect(e.target[2]).toBeCloseTo(b.position[2])
    expect(rideCamera(a, b, 0.5).target[1]).toBeGreaterThan(Math.max(a.position[1], b.position[1]))
  })
})

describe('Hội thoại', () => {
  it('khoá "đã nghe" theo hội thoại + chủ đề', () => {
    expect(heardKey('chao-mung', 'cach-choi')).toBe('nghe:chao-mung:cach-choi')
  })

  it('gõ chữ dần theo thời gian, không vượt độ dài', () => {
    expect(typedLength('xin chào', 0)).toBe(0)
    expect(typedLength('xin chào', 100, 50)).toBe(5)
    expect(typedLength('xin chào', 10_000)).toBe(8)
  })

  it('chân dung lấy chữ cái đầu của tên gọi', () => {
    expect(initialOf('Chú tiểu Minh An')).toBe('A')
    expect(initialOf('cô Lan')).toBe('L')
    expect(initialOf('')).toBe('?')
  })
})

describe('Hoa đăng — lời nguyện & trôi trên hồ', () => {

  it('chuẩn hoá lời nguyện và giới hạn 120 ký tự', () => {
    expect(cleanWish('  Nguyện   bình an \n')).toBe('Nguyện bình an')
    expect(cleanWish('x'.repeat(300)).length).toBe(MAX_WISH)
    expect(cleanWish(null)).toBe('')
  })

  it('màu đèn theo lựa chọn, đèn cũ chưa có màu vẫn có màu hợp lệ', () => {
    expect(lanternPetal('vang-nghe')).toBe('#f6c453')
    expect(LANTERN_COLORS.map((c) => c.petal)).toContain(lanternPetal(undefined, 'abc'))
  })

  it('đèn luôn trôi trong phạm vi mặt hồ', () => {
    for (const id of ['a', 'mk3j2', 'lantern-xyz', '12345']) {
      const p = driftParams(id, 10, 6)
      for (let t = 0; t < 600; t += 3.7) {
        const [x, z] = driftAt(p, t)
        expect(Math.abs(x)).toBeLessThanOrEqual(5 - 0.6 + 1e-9)
        expect(Math.abs(z)).toBeLessThanOrEqual(3 - 0.6 + 1e-9)
      }
    }
  })

  it('tham số trôi xác định theo id', () => {
    expect(driftParams('abc', 10, 6)).toEqual(driftParams('abc', 10, 6))
  })

  it('điểm thả đèn nằm ở mép hồ gần người chơi', () => {
    expect(launchPoint(0, -9, 10, 6)).toEqual([0, -2.4])
    expect(launchPoint(20, 0, 10, 6)).toEqual([4.4, 0])
  })
})
