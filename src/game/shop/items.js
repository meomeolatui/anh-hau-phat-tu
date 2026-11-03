/**
 * Hàng ở các sạp dưới chân núi. Giá tính bằng xu (tiền trong game, chỉ kiếm bằng công quả).
 * pack: số đơn vị nhận được mỗi lần mua.
 */
export const ITEMS = {
  nhang: { label: 'Nhang trầm', unit: 'nén', pack: 3, price: 3, desc: 'Một bó ba nén nhang trầm để thắp ở chùa.' },
  hoa: { label: 'Bó hoa cúc vàng', unit: 'bó', pack: 1, price: 5, desc: 'Dâng cùng nén hương trước bàn thờ.' },
  den: { label: 'Đèn hoa đăng', unit: 'chiếc', pack: 1, price: 6, desc: 'Đèn hình hoa sen, thả trên hồ kèm lời nguyện.' },
}

/** Mỗi sạp bán những món nào, người bán là ai (nhân vật hư cấu). wear: sạp y phục (shop/wardrobe.js) */
export const STALLS = {
  'sap-nhang': { name: 'Sạp nhang cô Năm', seller: 'Cô Năm', items: ['nhang'], awning: '#c0392b' },
  'sap-hoa': { name: 'Sạp hoa dì Sáu', seller: 'Dì Sáu', items: ['hoa'], awning: '#d4a017' },
  'sap-den': { name: 'Sạp đèn chú Bảy', seller: 'Chú Bảy', items: ['den', 'nhang'], awning: '#2e7d6b' },
  'sap-y-phuc': { name: 'Sạp y phục bà Tám', seller: 'Bà Tám', items: [], wear: true, awning: '#7b4ea3' },
}

/** Phần thưởng việc công quả ở chân núi */
export const CHORE_REWARDS = {
  rac: { xu: 1, merit: 2 }, // mỗi món rác
  tra: { xu: 3, merit: 6 }, // mỗi chén trà mời khách
  la: { xu: 1, perLeaves: 5 }, // 1 xu mỗi 5 lá quét ở chân núi (công đức tính riêng trong LeafField)
}
