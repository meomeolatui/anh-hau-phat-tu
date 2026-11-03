import { PALETTE } from '../materials'

/** Lựa chọn ngoại hình nhân vật (dùng cho màn tạo nhân vật và NPC) */

export const ROLES = {
  'phat-tu': { label: 'Phật tử hành hương', desc: 'Áo tràng, giữ tóc — người tại gia lên núi lễ Phật' },
  'chu-tieu': { label: 'Chú tiểu', desc: 'Đầu cạo, áo nâu — học tu trong chùa' },
  'ni-co': { label: 'Ni cô', desc: 'Đầu cạo, mũ len, áo lam/xám' },
}

export const OUTFITS = {
  lam: { label: 'Áo tràng lam', color: PALETTE.cloth },
  nau: { label: 'Áo nâu', color: PALETTE.robeBrown },
  xam: { label: 'Áo xám', color: PALETTE.robeGrey },
  vang: { label: 'Áo vàng nghệ', color: PALETTE.robeSaffron },
  trang: { label: 'Áo trắng', color: '#ece8df' },
}

export const SKINS = ['#f5d3b3', '#eec09a', '#d9a27a', '#b9805a', '#8d5a3c']
export const HAIRS = { ngan: 'Tóc ngắn', bui: 'Tóc búi', dai: 'Tóc dài', cao: 'Cạo trọc' }
