import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CostumeArt, HatArt } from './WearArt'
import WardrobeList from './WardrobeList'
import { COSTUMES, COSTUME_GROUPS, HATS, HAT_GROUPS, wearItem } from './wardrobe'
import { STALLS } from './items'
import { addXu, buyWear, equipWear, getGame, setTryOn } from '../state'
import { buildCape, buildKasayaTorso, kasayaFront, torsoRadius } from '../player/costumeGeometry'

const HEX = /^#[0-9a-f]{6}$/i
const HAT_KINDS = ['non-la', 'quai-thao', 'khan-dong', 'canh-chuon', 'than-tai', 'vuong-mien', 'kim-co', 'te-thien', 'ty-lu']

describe('danh mục y phục', () => {
  it('đủ cà sa nhiều màu, bộ Tây Du Ký và mũ mão như yêu cầu', () => {
    const kasaya = Object.values(COSTUMES).filter((c) => c.kasaya)
    expect(new Set(kasaya.map((c) => c.kasaya.color)).size).toBeGreaterThanOrEqual(6)
    for (const id of ['te-thien', 'bat-gioi', 'sa-tang', 'ca-sa-gam']) expect(COSTUMES[id].group).toBe('tay-du')
    for (const id of ['non-la', 'mao-than-tai', 'mao-te-thien', 'kim-co', 'mu-ty-lu']) expect(HATS[id]).toBeTruthy()
  })

  it('mỗi món có giá xu dương, nhóm hợp lệ, màu đúng định dạng, kiểu mũ dựng được', () => {
    const cg = COSTUME_GROUPS.map((g) => g.id)
    for (const c of Object.values(COSTUMES)) {
      expect(c.price).toBeGreaterThan(0)
      expect(cg).toContain(c.group)
      for (const k of ['robe', 'skirt', 'sash', 'pants', 'shoe', 'cape', 'pauldrons', 'necklace']) if (c[k]) expect(c[k]).toMatch(HEX)
      if (c.kasaya) expect(c.kasaya.color).toMatch(HEX)
    }
    const hg = HAT_GROUPS.map((g) => g.id)
    for (const h of Object.values(HATS)) {
      expect(h.price).toBeGreaterThan(0)
      expect(hg).toContain(h.group)
      expect(HAT_KINDS).toContain(h.kind)
      for (const v of Object.values(h.colors)) expect(v).toMatch(HEX)
    }
    expect(wearItem('hat', 'non-la')).toBe(HATS['non-la'])
    expect(wearItem('costume', null)).toBeNull()
  })

  it('có sạp y phục ở chợ chân núi', () => {
    expect(Object.values(STALLS).some((s) => s.wear)).toBe(true)
  })
})

describe('tủ đồ — mua, mặc, mặc thử', () => {
  it('thiếu xu thì không mua được; đủ xu thì trừ xu, có món và mặc luôn', () => {
    const xu0 = getGame().save.xu
    expect(buyWear('hat', 'mao-te-thien', xu0 + 1000)).toBe(false)
    expect(getGame().save.xu).toBe(xu0)
    addXu(20)
    expect(buyWear('hat', 'non-la', 10)).toBe(true)
    const s = getGame().save
    expect(s.xu).toBe(xu0 + 10)
    expect(s.wardrobe.owned).toContain('non-la')
    expect(s.wardrobe.hat).toBe('non-la')
    // Không mua trùng
    expect(buyWear('hat', 'non-la', 10)).toBe(false)
  })

  it('chỉ mặc được đồ đã có; null = về đồ thường', () => {
    addXu(20)
    buyWear('hat', 'non-la', 10)
    expect(equipWear('costume', 'te-thien')).toBe(false)
    expect(equipWear('hat', null)).toBe(true)
    expect(getGame().save.wardrobe.hat).toBeNull()
    expect(equipWear('hat', 'non-la')).toBe(true)
  })

  it('mặc thử không lưu vào tủ đồ', () => {
    setTryOn({ costume: 'te-thien' })
    expect(getGame().ui.tryOn).toEqual({ costume: 'te-thien' })
    expect(getGame().save.wardrobe.owned).not.toContain('te-thien')
    setTryOn(null)
    expect(getGame().ui.tryOn).toBeNull()
  })
})

describe('hình dựng trang phục', () => {
  const vertices = (g) => {
    const p = g.getAttribute('position')
    return Array.from({ length: p.count }, (_, i) => [p.getX(i), p.getY(i), p.getZ(i)])
  }

  it('cà sa nằm ngoài mặt thân áo, phủ vai trái (−X) và để lộ vai phải (+X)', () => {
    const v = vertices(buildKasayaTorso())
    for (const [x, y, z] of v) expect(Math.hypot(x, z)).toBeGreaterThanOrEqual(torsoRadius(y) - 1e-6)
    const shoulder = v.filter(([, y]) => y > 0.45)
    expect(shoulder.some(([x]) => x < -0.15)).toBe(true)
    expect(shoulder.some(([x]) => x > 0.15)).toBe(false)
    // Mép trước chạy chéo: càng xuống thấp càng lệch sang phải
    expect(kasayaFront(0)).toBeGreaterThan(kasayaFront(0.6))
  })

  it('áo choàng chỉ ở sau lưng', () => {
    for (const [, , z] of vertices(buildCape())) expect(z).toBeLessThan(0.12)
  })
})

describe('hình minh hoạ y phục', () => {
  it('mọi món đều vẽ được hình (có nội dung SVG)', () => {
    for (const item of Object.values(COSTUMES)) {
      const { container, unmount } = render(<CostumeArt item={item} />)
      expect(container.querySelectorAll('svg path, svg rect, svg circle, svg ellipse').length).toBeGreaterThan(5)
      unmount()
    }
    for (const item of Object.values(HATS)) {
      const { container, unmount } = render(<HatArt item={item} />)
      // Đầu (3 hình) + mũ (ít nhất 1 hình)
      expect(container.querySelectorAll('svg path, svg rect, svg circle, svg ellipse, svg line').length).toBeGreaterThan(4)
      unmount()
    }
  })

  it('cà sa có vân ô ruộng, áo Tề Thiên có gậy Như Ý', () => {
    const { container } = render(<CostumeArt item={COSTUMES['ca-sa-do']} />)
    expect(container.querySelector('pattern')).toBeTruthy()
    const te = render(<CostumeArt item={COSTUMES['te-thien']} />)
    expect(te.container.querySelector('line[stroke="#b0262a"]')).toBeTruthy()
  })

  it('sạp liệt kê mọi món kèm hình; tủ đồ trong Menu chỉ hiện đồ đã mua', () => {
    const shop = render(<WardrobeList shop />)
    expect(screen.getByText('Cà sa đỏ thắm')).toBeTruthy()
    expect(shop.container.querySelectorAll('li svg').length).toBe(Object.keys(COSTUMES).length)
    shop.unmount()
    render(<WardrobeList />)
    expect(screen.queryByText('Cà sa đỏ thắm')).toBeNull()
    expect(screen.getByText(/Chưa có món nào/)).toBeTruthy()
  })
})
