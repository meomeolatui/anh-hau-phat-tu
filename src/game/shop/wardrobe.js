/**
 * Trang phục & mũ mão bán ở sạp y phục dưới chân núi (mua bằng xu, chỉ để làm đẹp — không cộng công đức).
 *
 * Áo (COSTUMES) — thay màu thân/vạt/tay áo và thêm đồ đi kèm (Avatar.jsx đọc các trường dưới đây):
 *  robe      màu thân áo, tay áo          skirt   màu vạt áo (mặc định = robe)
 *  sash      màu thắt lưng, cổ áo         pants / shoe  màu quần, giày (tuỳ chọn)
 *  kasaya    { color, line } — cà sa vắt vai trái, vân ô ruộng (line = màu đường may)
 *  skirtPattern 'tiger' — vạt da hổ (Tề Thiên)
 *  cape      màu áo choàng sau lưng        pauldrons màu giáp vai
 *  belly     bụng tròn (Bát Giới, Thần Tài)  necklace màu chuỗi hạt lớn đeo cổ
 *  back      vật đeo sau lưng: 'gay-nhu-y' | 'cao-cuu-rang' | 'nguyet-xan'
 *
 * Mũ (HATS) — kind là kiểu dựng hình trong Avatar.jsx (HatModel); colors tuỳ kiểu.
 */

export const COSTUME_GROUPS = [
  { id: 'ca-sa', label: 'Cà sa' },
  { id: 'tay-du', label: 'Tây Du Ký' },
  { id: 'le-hoi', label: 'Lễ hội' },
]

export const COSTUMES = {
  'ca-sa-vang': {
    group: 'ca-sa',
    label: 'Cà sa vàng nghệ',
    price: 20,
    desc: 'Màu vàng nghệ ấm, vân ô ruộng may tay.',
    robe: '#e4b04a',
    sash: '#a8711a',
    kasaya: { color: '#e09a1e', line: '#9a5c10' },
  },
  'ca-sa-cam': {
    group: 'ca-sa',
    label: 'Cà sa cam nam tông',
    price: 20,
    desc: 'Sắc cam rực của các chùa nam tông.',
    robe: '#e8913a',
    sash: '#a85a18',
    kasaya: { color: '#e0701c', line: '#97420c' },
  },
  'ca-sa-do': {
    group: 'ca-sa',
    label: 'Cà sa đỏ thắm',
    price: 25,
    desc: 'Đỏ thắm trang nghiêm, đường may vàng.',
    robe: '#d9b56a',
    sash: '#7c1d1a',
    kasaya: { color: '#a8262a', line: '#e3b44f' },
  },
  'ca-sa-nau': {
    group: 'ca-sa',
    label: 'Cà sa nâu đất',
    price: 18,
    desc: 'Màu đất mộc mạc, giản dị.',
    robe: '#8a6a4c',
    sash: '#4e3524',
    kasaya: { color: '#7a4f32', line: '#4a2c1a' },
  },
  'ca-sa-lam': {
    group: 'ca-sa',
    label: 'Cà sa lam ngọc',
    price: 22,
    desc: 'Xanh lam dịu như sương núi sớm.',
    robe: '#8fa7b8',
    sash: '#3e5568',
    kasaya: { color: '#4f7593', line: '#2a4258' },
  },
  'ca-sa-tro': {
    group: 'ca-sa',
    label: 'Cà sa xám tro',
    price: 18,
    desc: 'Xám tro thanh tịnh của người xuất gia.',
    robe: '#b9b4ab',
    sash: '#5c5852',
    kasaya: { color: '#7d7870', line: '#4b4842' },
  },
  'ca-sa-gam': {
    group: 'tay-du',
    label: 'Cà sa gấm Đường Tăng',
    price: 70,
    desc: 'Cà sa gấm đỏ viền chỉ vàng, áo trong màu kem — đi cùng mũ Tỳ Lư.',
    robe: '#f1e2b8',
    sash: '#c99a2e',
    shoe: '#5a3a20',
    kasaya: { color: '#b3232a', line: '#f0c75a', rich: true },
  },
  'te-thien': {
    group: 'tay-du',
    label: 'Giáp Tề Thiên Đại Thánh',
    price: 80,
    desc: 'Giáp vàng, áo choàng đỏ, vạt da hổ, gậy Như Ý sau lưng.',
    robe: '#e0b23e',
    skirt: '#e08a2a',
    skirtPattern: 'tiger',
    sash: '#c0392b',
    pants: '#7a4a24',
    shoe: '#2a2220',
    cape: '#c0392b',
    pauldrons: '#f0c75a',
    back: 'gay-nhu-y',
  },
  'bat-gioi': {
    group: 'tay-du',
    label: 'Áo Trư Bát Giới',
    price: 50,
    desc: 'Áo đen thắt đai nâu, bụng tròn, cào chín răng sau lưng.',
    robe: '#2f323c',
    sash: '#8a5a2e',
    pants: '#24262c',
    belly: true,
    back: 'cao-cuu-rang',
  },
  'sa-tang': {
    group: 'tay-du',
    label: 'Áo Sa Tăng',
    price: 50,
    desc: 'Áo nâu đỏ, chuỗi hạt lớn đeo cổ, nguyệt xẳn sau lưng.',
    robe: '#7a3f2c',
    sash: '#3b2a20',
    necklace: '#e8dcc0',
    back: 'nguyet-xan',
  },
  'than-tai': {
    group: 'le-hoi',
    label: 'Áo bào Thần Tài',
    price: 55,
    desc: 'Áo bào đỏ viền vàng, bụng tròn phúc hậu — hợp với mão Thần Tài.',
    robe: '#c8202a',
    sash: '#efc04a',
    pants: '#7a1418',
    shoe: '#1f1a18',
    belly: true,
    pauldrons: '#efc04a',
  },
}

export const HAT_GROUPS = [
  { id: 'dan-gian', label: 'Nón dân gian' },
  { id: 'mao', label: 'Mũ mão' },
  { id: 'tay-du', label: 'Tây Du Ký' },
]

export const HATS = {
  'non-la': {
    group: 'dan-gian',
    kind: 'non-la',
    label: 'Nón lá',
    price: 10,
    desc: 'Nón lá trắng ngà, quai lụa đỏ — che nắng lên núi.',
    colors: { main: '#e2cf9a', line: '#b89c5c', strap: '#b8323a' },
  },
  'non-quai-thao': {
    group: 'dan-gian',
    kind: 'quai-thao',
    label: 'Nón quai thao',
    price: 18,
    desc: 'Nón mặt phẳng, vành rộng, tua quai thao đong đưa.',
    colors: { main: '#3a2a1e', line: '#c9a95b', strap: '#2a1f18' },
  },
  'khan-dong': {
    group: 'dan-gian',
    kind: 'khan-dong',
    label: 'Khăn đóng',
    price: 12,
    desc: 'Khăn xếp nếp đội đầu, đi cùng áo dài ngày lễ.',
    colors: { main: '#1f2433', line: '#323a52' },
  },
  'mu-canh-chuon': {
    group: 'mao',
    kind: 'canh-chuon',
    label: 'Mũ cánh chuồn',
    price: 30,
    desc: 'Mũ quan văn, hai cánh chuồn hai bên.',
    colors: { main: '#1d1b22', line: '#c9a95b' },
  },
  'mao-than-tai': {
    group: 'mao',
    kind: 'than-tai',
    label: 'Mão Thần Tài',
    price: 45,
    desc: 'Mão đỏ đính vàng, hai cánh vểnh — cầu may mắn, phát tài.',
    colors: { main: '#b81e26', line: '#f0c75a', gem: '#2e9a6a' },
  },
  'mao-hoang-kim': {
    group: 'mao',
    kind: 'vuong-mien',
    label: 'Mão hoàng kim',
    price: 40,
    desc: 'Mão vàng chạm hoa văn mây, đính ngọc đỏ.',
    colors: { main: '#e8bd4a', line: '#a8781e', gem: '#c0262c' },
  },
  'kim-co': {
    group: 'tay-du',
    kind: 'kim-co',
    label: 'Vòng Kim Cô',
    price: 15,
    desc: 'Vòng vàng trên trán của Tề Thiên Đại Thánh.',
    colors: { main: '#f0c75a', line: '#b8862a' },
  },
  'mao-te-thien': {
    group: 'tay-du',
    kind: 'te-thien',
    label: 'Mão Tề Thiên',
    price: 60,
    desc: 'Mão Tử Kim cắm hai lông trĩ dài, kèm vòng Kim Cô.',
    colors: { main: '#f0c75a', line: '#b8862a', feather: '#d8452a', tip: '#f4e2b8' },
  },
  'mu-ty-lu': {
    group: 'tay-du',
    kind: 'ty-lu',
    label: 'Mũ Tỳ Lư',
    price: 50,
    desc: 'Mũ năm cánh hình Phật của Đường Tăng, dải lụa sau gáy.',
    colors: { main: '#f0c75a', line: '#a8781e', panel: '#b3232a', gem: '#3d7fc0' },
  },
}

/** Tra một món theo ô (costume | hat) */
export function wearItem(slot, id) {
  if (!id) return null
  return (slot === 'costume' ? COSTUMES : HATS)[id] ?? null
}
