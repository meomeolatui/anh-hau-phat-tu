/**
 * Dữ liệu cho Nhật ký thiện hạnh & Sổ nguyện.
 * Toàn bộ câu chữ do nhóm tự viết — hướng đến việc lành đời thường, làm được ngay,
 * không hứa hẹn "công đức" hay phước báo đổi lấy từ việc ghi chép.
 */

/** Nhóm thiện hạnh. `icon` là tên icon lucide (ánh xạ sang component ở features/nhat-ky/ui.js). */
export const DEED_CATEGORIES = [
  { id: 'hieu-thao', label: 'Hiếu thảo', icon: 'HeartHandshake', tone: 'lotus', desc: 'Quan tâm, chăm sóc, biết ơn cha mẹ, ông bà, tổ tiên' },
  { id: 'tu-bi', label: 'Từ bi – giúp người', icon: 'HandHelping', tone: 'jade', desc: 'Giúp đỡ người khác bằng việc làm cụ thể' },
  { id: 'bo-thi', label: 'Bố thí – sẻ chia', icon: 'Gift', tone: 'saffron', desc: 'Sẻ chia của cải, thời gian, hiểu biết' },
  { id: 'ai-ngu', label: 'Ái ngữ – lời hay', icon: 'MessageCircleHeart', tone: 'lotus', desc: 'Lời nói chân thật, dịu dàng, đem lại niềm vui' },
  { id: 'nhan-nhuc', label: 'Nhẫn nhục – bớt giận', icon: 'Wind', tone: 'jade', desc: 'Dừng lại trước cơn giận, bao dung hơn' },
  { id: 'giu-gioi', label: 'Giữ giới', icon: 'ShieldCheck', tone: 'saffron', desc: 'Sống có chừng mực, giữ lời hứa, ăn chay' },
  { id: 'bao-ve-su-song', label: 'Bảo vệ sự sống – môi trường', icon: 'Sprout', tone: 'jade', desc: 'Không sát hại, gìn giữ thiên nhiên' },
  { id: 'khac', label: 'Khác', icon: 'Sparkles', tone: 'stone', desc: 'Những việc lành khác' },
]

const CATEGORY_MAP = new Map(DEED_CATEGORIES.map((c) => [c.id, c]))

/** Trả về nhóm theo id; id lạ (vd. từ bản sao lưu cũ) quy về "Khác". */
export function getDeedCategory(id) {
  return CATEGORY_MAP.get(id) ?? CATEGORY_MAP.get('khac')
}

/** Gợi ý việc lành cụ thể, đời thường. */
export const DEED_SUGGESTIONS = [
  { id: 'goi-cha-me', category: 'hieu-thao', text: 'Gọi điện hỏi thăm cha mẹ, ông bà và lắng nghe trọn vẹn, không vội vàng.' },
  { id: 'nau-com', category: 'hieu-thao', text: 'Nấu một bữa cơm hoặc pha một ấm trà mời người lớn trong nhà.' },
  { id: 'nhac-thuoc', category: 'hieu-thao', text: 'Nhắc cha mẹ uống thuốc, hỏi han sức khoẻ hoặc đưa đi khám bệnh.' },
  { id: 'anh-cu', category: 'hieu-thao', text: 'Cùng ông bà xem lại ảnh cũ và nghe kể chuyện ngày xưa.' },
  { id: 'ban-tho', category: 'hieu-thao', text: 'Lau dọn bàn thờ gia tiên, thắp nén hương với lòng biết ơn.' },
  { id: 'nhuong-cho', category: 'tu-bi', text: 'Nhường chỗ ngồi cho người lớn tuổi, phụ nữ mang thai hoặc người đang mệt.' },
  { id: 'chi-duong', category: 'tu-bi', text: 'Giúp một người lạ hỏi đường, xách đồ nặng hoặc qua đường.' },
  { id: 'tham-om', category: 'tu-bi', text: 'Thăm hỏi một người bạn đang ốm hoặc đang có chuyện buồn.' },
  { id: 'cho-meo', category: 'tu-bi', text: 'Đặt một bát nước sạch, một ít thức ăn cho chó mèo đi lạc.' },
  { id: 'day-dien-thoai', category: 'tu-bi', text: 'Kiên nhẫn chỉ cho người lớn tuổi cách dùng điện thoại.' },
  { id: 'tang-do', category: 'bo-thi', text: 'Gửi tặng quần áo, sách vở còn tốt cho người đang cần.' },
  { id: 'quy-thien', category: 'bo-thi', text: 'Góp một phần nhỏ cho bếp cơm từ thiện hoặc quỹ thiện nguyện minh bạch.' },
  { id: 'nguoi-ban-rong', category: 'bo-thi', text: 'Mua giúp một món hàng của cụ bán rong và nói lời cảm ơn.' },
  { id: 'chia-se-kinh-nghiem', category: 'bo-thi', text: 'Chia sẻ một kinh nghiệm hữu ích cho đồng nghiệp hay bạn học.' },
  { id: 'hien-mau', category: 'bo-thi', text: 'Đăng ký hiến máu tình nguyện nếu sức khoẻ cho phép.' },
  { id: 'lang-nghe', category: 'bo-thi', text: 'Dành trọn mười lăm phút lắng nghe ai đó tâm sự — sự có mặt cũng là món quà.' },
  { id: 'cam-on', category: 'ai-ngu', text: 'Nói lời cảm ơn chân thành với người giao hàng, bác bảo vệ, cô lao công.' },
  { id: 'khen-ngoi', category: 'ai-ngu', text: 'Khen một điều tốt của người thân thay vì chỉ nhắc lỗi.' },
  { id: 'xin-loi', category: 'ai-ngu', text: 'Nói lời xin lỗi với người mình từng làm buồn lòng.' },
  { id: 'khong-noi-xau', category: 'ai-ngu', text: 'Trọn một ngày không nói xấu sau lưng bất kỳ ai.' },
  { id: 'nhan-tin', category: 'ai-ngu', text: 'Nhắn vài lời hỏi thăm một người bạn lâu ngày chưa gặp.' },
  { id: 'ba-hoi-tho', category: 'nhan-nhuc', text: 'Khi sắp nổi giận, dừng lại thở ba hơi thật chậm rồi mới nói.' },
  { id: 'ket-xe', category: 'nhan-nhuc', text: 'Kẹt xe vẫn nhường đường, không bấm còi inh ỏi.' },
  { id: 'bo-qua', category: 'nhan-nhuc', text: 'Bỏ qua một câu nói khó nghe mà không đáp trả.' },
  { id: 'kien-nhan-tre', category: 'nhan-nhuc', text: 'Kiên nhẫn trả lời khi con trẻ hay người già hỏi đi hỏi lại.' },
  { id: 'viet-buc-boi', category: 'nhan-nhuc', text: 'Viết ra điều đang khiến mình bực bội, rồi đọc lại nó bằng lòng bao dung.' },
  { id: 'an-chay', category: 'giu-gioi', text: 'Ăn chay một bữa hoặc trọn ngày hôm nay.' },
  { id: 'khong-ruou', category: 'giu-gioi', text: 'Không rượu bia, không thuốc lá trong ngày hôm nay.' },
  { id: 'tra-tien-thua', category: 'giu-gioi', text: 'Trả lại tiền thừa khi người bán tính nhầm có lợi cho mình.' },
  { id: 'dung-hen', category: 'giu-gioi', text: 'Giữ đúng lời hứa và đúng giờ hẹn với mọi người.' },
  { id: 'dien-thoai', category: 'giu-gioi', text: 'Cất điện thoại một giờ trước khi ngủ, không lướt mạng xã hội.' },
  { id: 'phong-sinh', category: 'bao-ve-su-song', text: 'Phóng sinh có trách nhiệm: không mua chim, cá bị bắt về để thả; thay vào đó góp sức giữ gìn nơi chúng sinh sống.' },
  { id: 'nhat-rac', category: 'bao-ve-su-song', text: 'Nhặt rác ở nơi công cộng, bãi biển hoặc sân chùa.' },
  { id: 'binh-nuoc', category: 'bao-ve-su-song', text: 'Mang bình nước, túi vải riêng để bớt đồ nhựa dùng một lần.' },
  { id: 'trong-cay', category: 'bao-ve-su-song', text: 'Tưới cây, trồng thêm một chậu cây xanh.' },
  { id: 'tiet-kiem', category: 'bao-ve-su-song', text: 'Tắt đèn, khoá vòi nước khi không dùng đến.' },
  { id: 'con-trung', category: 'bao-ve-su-song', text: 'Nhẹ nhàng đưa con côn trùng ra ngoài thay vì đập chết.' },
  { id: 'don-dep', category: 'khac', text: 'Dọn gọn góc học tập, làm việc để tâm cũng thấy nhẹ nhàng.' },
  { id: 'ngoi-yen', category: 'khac', text: 'Ngồi yên năm phút cuối ngày, nhìn lại và mỉm cười với chính mình.' },
  { id: 'doc-sach', category: 'khac', text: 'Đọc một trang sách Phật pháp và ghi lại một ý mình tâm đắc.' },
  { id: 'di-bo', category: 'khac', text: 'Đi bộ chậm mười phút, chú tâm vào từng bước chân.' },
]

/** Câu tự vấn cuối ngày — xoay vòng theo ngày. */
export const REFLECTION_PROMPTS = [
  'Hôm nay điều gì khiến mình thấy biết ơn?',
  'Có lúc nào mình nổi giận không? Điều gì đã xảy ra ngay trước đó?',
  'Hôm nay mình đã nói lời nào khiến người khác vui?',
  'Mình có làm ai buồn không? Ngày mai mình có thể làm gì để hàn gắn?',
  'Khoảnh khắc nào trong ngày mình thấy lòng thật yên?',
  'Hôm nay mình đã thật sự lắng nghe ai đó chưa?',
  'Mình đã chăm sóc thân thể mình thế nào trong ngày?',
  'Một thói quen nhỏ mình muốn buông bớt là gì?',
  'Điều gì mình đang nắm quá chặt, có thể nhẹ tay hơn?',
  'Hôm nay mình học được gì từ một người khác?',
  'Nếu được sống lại hôm nay, mình sẽ làm khác điều gì?',
  'Mình đã dành bao nhiêu thời gian cho điều thật sự quan trọng?',
  'Có ai đang cần mình quan tâm mà mình chưa để ý?',
  'Mình đã tha thứ cho ai — kể cả chính mình — chưa?',
  'Một việc lành nhỏ mình muốn làm vào ngày mai là gì?',
]

/** Thang cảm nhận trong ngày (khớp setDayMood 1..5). */
export const MOODS = [
  { value: 1, label: 'Nặng nề' },
  { value: 2, label: 'Bất an' },
  { value: 3, label: 'Bình thường' },
  { value: 4, label: 'Nhẹ nhàng' },
  { value: 5, label: 'An lạc' },
]

export function getMood(value) {
  return MOODS.find((m) => m.value === value) ?? null
}

/** Ba loại ghi chép trong Sổ nguyện (khớp addVow type). */
export const VOW_TYPES = [
  { id: 'nguyen', label: 'Phát nguyện', icon: 'Flower2', tone: 'jade', hint: 'Điều mình mong làm được, nói bằng lời của chính mình.' },
  { id: 'hoi-huong', label: 'Hồi hướng', icon: 'Sunrise', tone: 'saffron', hint: 'Gửi những điều tốt đẹp mình đã làm đến người mình thương và muôn loài.' },
  { id: 'sam-hoi', label: 'Sám hối', icon: 'Feather', tone: 'lotus', hint: 'Thành thật nhìn lại lỗi lầm và nguyện sửa đổi — không phải để tự trách.' },
]

export function getVowType(id) {
  return VOW_TYPES.find((t) => t.id === id) ?? VOW_TYPES[0]
}

/**
 * Mẫu gợi ý cho Sổ nguyện. Hai bài kệ truyền thống được ghi nguyên âm Hán-Việt,
 * phần lược giải do nhóm tự diễn đạt.
 */
export const VOW_TEMPLATES = [
  { id: 'nguyen-loi-noi', type: 'nguyen', title: 'Giữ lời nói hiền hoà', text: 'Con nguyện trong tháng này giữ lời nói hiền hoà, trước khi nói điều gì sẽ tự hỏi: lời này có thật, có cần và có tử tế không.' },
  { id: 'nguyen-moi-ngay', type: 'nguyen', title: 'Mỗi ngày một thời tu', text: 'Con nguyện mỗi ngày dành ít nhất mười lăm phút để niệm Phật hoặc ngồi yên lặng, dù bận rộn đến đâu.' },
  { id: 'nguyen-an-chay', type: 'nguyen', title: 'Ăn chay ngày rằm, mùng một', text: 'Con nguyện ăn chay vào ngày rằm và mùng một hằng tháng, để nuôi lòng thương đối với muôn loài.' },
  { id: 'nguyen-cha-me', type: 'nguyen', title: 'Dành thời gian cho cha mẹ', text: 'Con nguyện mỗi tuần dành một buổi trọn vẹn cho cha mẹ: cùng ăn cơm, cùng trò chuyện, không cầm điện thoại.' },
  { id: 'hoi-huong-cha-me', type: 'hoi-huong', title: 'Cho cha mẹ', text: 'Con xin hồi hướng những điều lành đã làm hôm nay đến cha mẹ, mong cha mẹ thân tâm an ổn, sống vui khoẻ bên con cháu.' },
  { id: 'hoi-huong-nguoi-benh', type: 'hoi-huong', title: 'Cho người đang đau bệnh', text: 'Con xin hồi hướng đến những người đang đau bệnh, mong họ vơi bớt khổ đau, có người thương ở bên và sớm bình phục.' },
  { id: 'hoi-huong-nguoi-mat', type: 'hoi-huong', title: 'Cho người thân đã khuất', text: 'Con xin hồi hướng đến người thân đã khuất, nguyện cho hương linh được nhẹ nhàng, an lành; con sẽ sống tốt để tiếp nối những điều đẹp người đã trao.' },
  {
    id: 'hoi-huong-ke',
    type: 'hoi-huong',
    title: 'Kệ hồi hướng truyền thống',
    text: 'Nguyện dĩ thử công đức,\nPhổ cập ư nhất thiết,\nNgã đẳng dữ chúng sinh,\nGiai cộng thành Phật đạo.\n\n(Lược giải: Nguyện đem những điều lành này lan toả đến tất cả, để con cùng muôn loài đều đi trọn con đường giác ngộ.)',
  },
  { id: 'sam-hoi-nong-gian', type: 'sam-hoi', title: 'Đã nóng giận với người thân', text: 'Hôm nay con đã nóng giận và nói lời khó nghe với người thân. Con thành thật nhận lỗi, nguyện lần sau dừng lại thở một hơi trước khi nói.' },
  { id: 'sam-hoi-vo-tam', type: 'sam-hoi', title: 'Vô tâm, thiếu quan tâm', text: 'Con nhận ra mình đã vô tâm trước nỗi vất vả của người bên cạnh. Con nguyện để ý nhiều hơn và hỏi han bằng cả tấm lòng.' },
  {
    id: 'sam-hoi-ke',
    type: 'sam-hoi',
    title: 'Kệ sám hối truyền thống',
    text: 'Vãng tích sở tạo chư ác nghiệp,\nGiai do vô thuỷ tham sân si,\nTùng thân ngữ ý chi sở sinh,\nNhất thiết ngã kim giai sám hối.\n\n(Lược giải: Những lỗi lầm con đã gây từ trước đều do tham lam, giận dữ, mê lầm mà ra, qua thân, lời nói và ý nghĩ. Nay con xin thành tâm nhận lỗi tất cả.)',
  },
]
