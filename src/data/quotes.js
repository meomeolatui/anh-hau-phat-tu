/**
 * Pháp ngữ — HỢP ĐỒNG API (các trang khác đang dùng, giữ nguyên tên export):
 *   QUOTES: [{ id: string, text: string, source: string, theme: string, gloss?: string }]
 *   QUOTE_THEMES: [{ id: string, label: string }]
 *   quoteOfDay(date?: Date) => quote — ổn định trong cùng một ngày, đổi khi qua ngày
 *
 * Nguyên tắc biên soạn:
 * - Câu trích Kinh Pháp Cú và các kinh Nikāya được TỰ diễn đạt lại bằng tiếng Việt (lược dịch ý),
 *   không chép nguyên văn bản dịch của bất kỳ dịch giả hiện đại nào. Chỉ ghi số kệ khi chắc chắn.
 * - Kệ, phú cổ (Hán-Việt) giữ nguyên phiên âm truyền thống; phần `gloss` là lược giải do chúng tôi tự viết.
 * - "Lời dạy nhà Phật" là những lời khuyên phổ biến trong đời sống Phật tử, được viết lại ngắn gọn.
 */

export const QUOTE_THEMES = [
  { id: 'tam', label: 'Tâm' },
  { id: 'tu-bi', label: 'Từ bi' },
  { id: 'nhan-qua', label: 'Nhân quả' },
  { id: 'tinh-tan', label: 'Tinh tấn' },
  { id: 'vo-thuong', label: 'Vô thường' },
  { id: 'tri-tue', label: 'Trí tuệ' },
  { id: 'nhan-nhuc', label: 'Nhẫn nhục' },
  { id: 'an-lac', label: 'An lạc' },
]

const PC = 'Kinh Pháp Cú'
const pc = (n) => `${PC}, kệ ${n}`
const DG = 'Lời dạy nhà Phật'

export const QUOTES = [
  /* ---------- Tâm ---------- */
  {
    id: 'pc-1',
    text: 'Tâm dẫn đầu mọi pháp, tâm làm chủ, tâm tạo tác. Nói hay làm với tâm ô nhiễm, khổ đau sẽ theo sau như bánh xe lăn theo dấu chân con vật kéo xe.',
    source: pc(1),
    theme: 'tam',
  },
  {
    id: 'pc-2',
    text: 'Tâm dẫn đầu mọi pháp, tâm làm chủ, tâm tạo tác. Nói hay làm với tâm trong sạch, an vui sẽ theo sau như bóng không rời hình.',
    source: pc(2),
    theme: 'tam',
  },
  {
    id: 'pc-33',
    text: 'Tâm hay dao động, khó giữ, khó phòng hộ. Người trí uốn nắn tâm mình cho ngay thẳng, như người thợ làm tên uốn thẳng mũi tên.',
    source: pc(33),
    theme: 'tam',
  },
  {
    id: 'pc-35',
    text: 'Tâm khó nắm giữ, nhẹ nhàng chạy theo điều mình ưa thích. Điều phục được tâm là điều lành; tâm đã được điều phục đem lại an vui.',
    source: pc(35),
    theme: 'tam',
  },
  {
    id: 'an-tam-sang',
    text: 'Tâm này vốn sáng trong; chỉ vì những phiền não từ bên ngoài ghé đến mà bị che mờ.',
    source: 'Tăng Chi Bộ',
    theme: 'tam',
  },
  {
    id: 'mn-19',
    text: 'Điều gì ta thường suy nghĩ, thường nghiền ngẫm, tâm sẽ dần nghiêng về hướng ấy.',
    source: 'Kinh Song Tầm (Trung Bộ 19)',
    theme: 'tam',
  },
  {
    id: 'kc-vo-so-tru',
    text: 'Ưng vô sở trụ nhi sanh kỳ tâm.',
    gloss: 'Lược giải: Hãy để tâm sáng tỏ, hiện diện trọn vẹn mà không bám víu vào bất cứ điều gì.',
    source: 'Kinh Kim Cang',
    theme: 'tam',
  },
  {
    id: 'tnt-tinh-do',
    text: 'Tịnh độ là lòng trong sạch, chớ còn ngờ hỏi đến Tây phương; Di Đà là tính sáng soi, mựa phải nhọc tìm về Cực Lạc.',
    gloss: 'Lược giải: Cõi Tịnh độ ở ngay nơi tâm thanh tịnh; Phật Di Đà là tánh giác sáng suốt sẵn có trong mỗi người.',
    source: 'Trần Nhân Tông — Cư trần lạc đạo phú',
    theme: 'tam',
  },
  {
    id: 'dg-tam-binh',
    text: 'Tâm bình thì thế giới bình. Muốn cuộc đời quanh mình yên ổn, trước hết hãy giữ cho lòng mình lắng dịu.',
    source: DG,
    theme: 'tam',
  },

  /* ---------- Từ bi ---------- */
  {
    id: 'pc-5',
    text: 'Hận thù không thể dập tắt hận thù; chỉ có lòng từ mới dập tắt được hận thù. Đó là định luật muôn đời.',
    source: pc(5),
    theme: 'tu-bi',
  },
  {
    id: 'pc-3',
    text: 'Ai cứ ôm mãi ý nghĩ “người ấy mắng tôi, đánh tôi, thắng tôi, lấy của tôi”, hận thù trong lòng người ấy không bao giờ nguôi.',
    source: pc(3),
    theme: 'tu-bi',
  },
  {
    id: 'pc-129',
    text: 'Ai cũng sợ roi gậy, ai cũng sợ chết. Lấy lòng mình suy ra lòng người, chớ giết hại và chớ khiến người khác giết hại.',
    source: pc(129),
    theme: 'tu-bi',
  },
  {
    id: 'pc-49',
    text: 'Như con ong hút mật mà không làm hại sắc hương của hoa, người hiền đi vào làng xóm cũng nhẹ nhàng như thế.',
    source: pc(49),
    theme: 'tu-bi',
  },
  {
    id: 'pc-54',
    text: 'Hương hoa không bay ngược chiều gió; nhưng hương đức hạnh của người hiền thì lan tỏa khắp mọi phương.',
    source: pc(54),
    theme: 'tu-bi',
  },
  {
    id: 'metta-me-con',
    text: 'Như người mẹ đem cả mạng sống che chở đứa con một của mình, hãy nuôi dưỡng tâm từ không giới hạn đến với muôn loài.',
    source: 'Kinh Từ Bi (Kinh Tập)',
    theme: 'tu-bi',
  },
  {
    id: 'metta-an-vui',
    text: 'Nguyện cho mọi loài đều được an vui, được bình yên, tâm luôn hạnh phúc — loài yếu hay mạnh, lớn hay nhỏ, gần hay xa.',
    source: 'Kinh Từ Bi (Kinh Tập)',
    theme: 'tu-bi',
  },
  {
    id: '42c-ngon-duoc',
    text: 'Như một ngọn đuốc mồi sang cho trăm ngàn người thắp lửa, bóng tối được xua tan mà ngọn đuốc vẫn sáng như cũ. Niềm vui khi tùy hỷ điều lành cũng như vậy.',
    source: 'Kinh Bốn Mươi Hai Chương',
    theme: 'tu-bi',
  },
  {
    id: 'an-bao-hieu',
    text: 'Dù cõng cha mẹ trên vai suốt trăm năm cũng chưa đền đủ công ơn. Giúp cha mẹ hướng về điều thiện, sống trong chánh pháp mới là báo hiếu trọn vẹn.',
    source: 'Tăng Chi Bộ',
    theme: 'tu-bi',
  },
  {
    id: 'dg-tu-bi',
    text: 'Từ là trao niềm vui, bi là làm vơi nỗi khổ. Không cần việc lớn — một lời tử tế hôm nay cũng đã là từ bi.',
    source: DG,
    theme: 'tu-bi',
  },

  /* ---------- Nhân quả ---------- */
  {
    id: 'pc-183',
    text: 'Không làm mọi điều ác, siêng làm các việc lành, giữ tâm ý trong sạch — đó là lời chư Phật dạy.',
    source: pc(183),
    theme: 'nhan-qua',
  },
  {
    id: 'pc-121',
    text: 'Chớ xem thường điều ác nhỏ mà nghĩ “chẳng đến với ta”. Nước nhỏ từng giọt còn làm đầy chum; người dại gom góp điều ác nhỏ, dần dần thành ác lớn.',
    source: pc(121),
    theme: 'nhan-qua',
  },
  {
    id: 'pc-122',
    text: 'Chớ xem thường điều thiện nhỏ mà nghĩ “chẳng đến với ta”. Nước nhỏ từng giọt còn làm đầy chum; người trí gom góp điều thiện nhỏ, dần dần thành thiện lớn.',
    source: pc(122),
    theme: 'nhan-qua',
  },
  {
    id: 'pc-165',
    text: 'Tự mình làm ác, tự mình nhiễm ô; tự mình tránh ác, tự mình thanh tịnh. Sạch hay nhơ đều do chính mình, không ai làm cho ai trong sạch được.',
    source: pc(165),
    theme: 'nhan-qua',
  },
  {
    id: 'pc-173',
    text: 'Ai lấy việc lành che lấp việc ác đã làm, người ấy soi sáng thế gian như vầng trăng ra khỏi đám mây.',
    source: pc(173),
    theme: 'nhan-qua',
  },
  {
    id: 'an-tac-y',
    text: 'Chính ý muốn là nghiệp. Có ý muốn rồi, người ta mới hành động bằng thân, bằng lời nói và bằng ý nghĩ.',
    source: 'Tăng Chi Bộ',
    theme: 'nhan-qua',
  },
  {
    id: 'an-chu-nhan-nghiep',
    text: 'Ta là chủ nhân của nghiệp, là người thừa hưởng nghiệp. Làm điều thiện hay điều ác, chính ta sẽ nhận lấy kết quả của điều ấy.',
    source: 'Tăng Chi Bộ (Năm điều nên thường quán)',
    theme: 'nhan-qua',
  },
  {
    id: 'tam-the-nhan-qua',
    text: 'Dục tri tiền thế nhân, kim sinh thọ giả thị; dục tri hậu thế quả, kim sinh tác giả thị.',
    gloss: 'Lược giải: Muốn biết nhân đã gieo trước kia, hãy nhìn những gì đang nhận hôm nay; muốn biết quả mai sau, hãy nhìn những gì mình đang làm hôm nay.',
    source: 'Kinh Nhân Quả Ba Đời',
    theme: 'nhan-qua',
  },
  {
    id: '42c-nho-troi',
    text: 'Kẻ ác hại người hiền như ngửa mặt lên trời mà nhổ: nước bọt không tới trời, lại rơi xuống chính mặt mình.',
    source: 'Kinh Bốn Mươi Hai Chương',
    theme: 'nhan-qua',
  },
  {
    id: 'dg-bo-tat-so-nhan',
    text: 'Bồ Tát sợ nhân, chúng sinh sợ quả. Người tỉnh thức cẩn trọng từ lúc gieo, không đợi đến khi gặt mới lo.',
    source: DG,
    theme: 'nhan-qua',
  },

  /* ---------- Tinh tấn ---------- */
  {
    id: 'pc-21',
    text: 'Tỉnh thức là con đường đến bất tử, buông lung là con đường đến cái chết. Người tỉnh thức không chết; kẻ buông lung dù sống cũng như đã chết.',
    source: pc(21),
    theme: 'tinh-tan',
  },
  {
    id: 'pc-25',
    text: 'Bằng nỗ lực, tỉnh thức, giữ giới và tự chế, người trí tự xây cho mình một hòn đảo mà nước lũ không thể nhấn chìm.',
    source: pc(25),
    theme: 'tinh-tan',
  },
  {
    id: 'pc-112',
    text: 'Sống một ngày tinh tấn, bền bỉ còn quý hơn sống trăm năm biếng nhác, yếu hèn.',
    source: pc(112),
    theme: 'tinh-tan',
  },
  {
    id: 'pc-276',
    text: 'Chính các con phải tự mình nỗ lực; các đấng Như Lai chỉ là người chỉ đường.',
    source: pc(276),
    theme: 'tinh-tan',
  },
  {
    id: 'pc-19',
    text: 'Dù tụng đọc nhiều kinh mà không thực hành, người ấy như kẻ chăn bò đếm bò cho người khác, chẳng hưởng được phần nào của đời sống tu tập.',
    source: pc(19),
    theme: 'tinh-tan',
  },
  {
    id: 'pc-103',
    text: 'Thắng ngàn ngàn quân địch nơi chiến trường không bằng tự thắng chính mình; tự thắng mình mới là chiến thắng cao nhất.',
    source: pc(103),
    theme: 'tinh-tan',
  },
  {
    id: 'pc-116',
    text: 'Hãy mau làm điều lành, giữ tâm tránh xa điều ác. Ai chậm trễ làm việc thiện, tâm dễ vui theo điều ác.',
    source: pc(116),
    theme: 'tinh-tan',
  },
  {
    id: 'pc-160',
    text: 'Chính mình là nơi nương tựa của mình, còn ai khác làm chỗ dựa được? Khéo điều phục chính mình là có được chỗ dựa khó tìm.',
    source: pc(160),
    theme: 'tinh-tan',
  },
  {
    id: 'dn-16-hon-dao',
    text: 'Hãy tự mình là hòn đảo của chính mình, tự mình nương tựa nơi chính mình; lấy Pháp làm hòn đảo, lấy Pháp làm nơi nương tựa.',
    source: 'Kinh Đại Bát Niết-bàn (Trường Bộ 16)',
    theme: 'tinh-tan',
  },
  {
    id: 'dg-giot-nuoc',
    text: 'Giọt nước nhỏ rơi đều đặn mãi cũng làm mòn đá. Mỗi ngày một chút công phu, chẳng bao lâu tâm sẽ khác.',
    source: DG,
    theme: 'tinh-tan',
  },

  /* ---------- Vô thường ---------- */
  {
    id: 'dn-16-di-ngon',
    text: 'Mọi pháp hữu vi đều phải hoại diệt. Hãy tinh tấn, chớ buông lung.',
    source: 'Kinh Đại Bát Niết-bàn (Trường Bộ 16)',
    theme: 'vo-thuong',
  },
  {
    id: 'pc-277',
    text: '“Mọi pháp hữu vi đều vô thường” — khi lấy trí tuệ thấy rõ như vậy, người ta nhàm chán khổ đau. Đó là con đường đi đến thanh tịnh.',
    source: pc(277),
    theme: 'vo-thuong',
  },
  {
    id: 'pc-46',
    text: 'Biết thân này mong manh như bọt nước, hư ảo như bóng nắng, người ấy bẻ gãy được những mũi tên hoa của dục vọng.',
    source: pc(46),
    theme: 'vo-thuong',
  },
  {
    id: 'pc-113',
    text: 'Sống một ngày thấy rõ sự sinh diệt của vạn pháp còn quý hơn sống trăm năm mà không thấy.',
    source: pc(113),
    theme: 'vo-thuong',
  },
  {
    id: 'pc-182',
    text: 'Được làm người là khó, được sống còn là khó, được nghe chánh pháp là khó, gặp Phật ra đời là khó.',
    source: pc(182),
    theme: 'vo-thuong',
  },
  {
    id: 'an-nam-dieu-quan',
    text: 'Ta rồi sẽ già, sẽ bệnh, sẽ chết; mọi điều thân yêu rồi sẽ đổi thay, chia lìa. Thường quán xét như vậy để biết trân quý từng ngày.',
    source: 'Tăng Chi Bộ (Năm điều nên thường quán)',
    theme: 'vo-thuong',
  },
  {
    id: 'kc-mong-huyen',
    text: 'Nhất thiết hữu vi pháp, như mộng huyễn bào ảnh, như lộ diệc như điện, ưng tác như thị quán.',
    gloss: 'Lược giải: Mọi pháp do duyên hợp thành đều như giấc mộng, trò huyễn, bọt nước, bóng hình, như giọt sương, như tia chớp — hãy quán chiếu như vậy.',
    source: 'Kinh Kim Cang',
    theme: 'vo-thuong',
  },
  {
    id: 'van-hanh',
    text: 'Thân như điện ảnh hữu hoàn vô, vạn mộc xuân vinh thu hựu khô. Nhậm vận thịnh suy vô bố úy, thịnh suy như lộ thảo đầu phô.',
    gloss: 'Lược giải: Thân người như bóng chớp, có rồi lại không; cây cối xuân tươi, thu lại héo. Mặc cho thịnh suy, lòng không sợ hãi, vì thịnh suy chỉ như giọt sương đầu ngọn cỏ.',
    source: 'Thiền sư Vạn Hạnh — Thị đệ tử',
    theme: 'vo-thuong',
  },
  {
    id: 'man-giac',
    text: 'Mạc vị xuân tàn hoa lạc tận, đình tiền tạc dạ nhất chi mai.',
    gloss: 'Lược giải: Chớ bảo xuân tàn thì hoa rụng hết; đêm qua trước sân, một cành mai vẫn nở.',
    source: 'Thiền sư Mãn Giác — Cáo tật thị chúng',
    theme: 'vo-thuong',
  },
  {
    id: 'dg-vo-thuong',
    text: 'Hiểu vô thường không phải để buồn, mà để biết thương. Vì mọi thứ đều đổi thay, hãy nói lời yêu thương khi còn có thể.',
    source: DG,
    theme: 'vo-thuong',
  },

  /* ---------- Trí tuệ ---------- */
  {
    id: 'kalama',
    text: 'Đừng tin chỉ vì nghe truyền lại, vì kinh sách ghi, hay vì người thầy nói. Khi tự mình biết rõ điều gì là lành, đem lại lợi ích và an vui, hãy sống theo điều ấy.',
    source: 'Kinh Kālāma (Tăng Chi Bộ)',
    theme: 'tri-tue',
  },
  {
    id: 'mn-22-chiec-be',
    text: 'Pháp Ta dạy như chiếc bè dùng để qua sông, không phải để vác theo mà ôm giữ.',
    source: 'Kinh Ví Dụ Con Rắn (Trung Bộ 22)',
    theme: 'tri-tue',
  },
  {
    id: 'sn-duyen-khoi',
    text: 'Cái này có nên cái kia có, cái này sinh nên cái kia sinh; cái này không nên cái kia không, cái này diệt nên cái kia diệt.',
    source: 'Tương Ưng Bộ',
    theme: 'tri-tue',
  },
  {
    id: 'tu-de',
    text: 'Có khổ, có nguyên nhân của khổ, có sự chấm dứt khổ, và có con đường đưa đến chấm dứt khổ.',
    source: 'Kinh Chuyển Pháp Luân',
    theme: 'tri-tue',
  },
  {
    id: 'sn-mui-ten',
    text: 'Gặp cảm thọ đau, người chưa học pháp như bị trúng hai mũi tên: một mũi của nỗi đau, một mũi của sự than trách. Người hiểu pháp chỉ trúng một mũi mà thôi.',
    source: 'Kinh Mũi Tên (Tương Ưng Bộ)',
    theme: 'tri-tue',
  },
  {
    id: 'pc-50',
    text: 'Đừng soi lỗi người, đừng xét việc người đã làm hay chưa làm; hãy nhìn lại việc mình đã làm và chưa làm.',
    source: pc(50),
    theme: 'tri-tue',
  },
  {
    id: 'pc-76',
    text: 'Gặp người trí chỉ ra lỗi lầm của mình, hãy xem như người chỉ chỗ cất giấu kho báu, và hãy gần gũi người ấy.',
    source: pc(76),
    theme: 'tri-tue',
  },
  {
    id: 'pc-252',
    text: 'Lỗi người thì dễ thấy, lỗi mình thì khó thấy.',
    source: pc(252),
    theme: 'tri-tue',
  },
  {
    id: 'pc-282',
    text: 'Trí tuệ sinh ra từ thiền tập; xa rời thiền tập, trí tuệ mai một.',
    source: pc(282),
    theme: 'tri-tue',
  },
  {
    id: 'bat-nha',
    text: 'Sắc bất dị không, không bất dị sắc; sắc tức thị không, không tức thị sắc.',
    gloss: 'Lược giải: Mọi hình tướng đều do duyên hợp, không có tự tánh riêng; thấy được điều ấy là thấy tánh Không.',
    source: 'Bát Nhã Ba La Mật Đa Tâm Kinh',
    theme: 'tri-tue',
  },
  {
    id: 'hue-nang-bo-de',
    text: 'Bồ đề bổn vô thọ, minh cảnh diệc phi đài; bổn lai vô nhất vật, hà xứ nhạ trần ai.',
    gloss: 'Lược giải: Giác ngộ vốn chẳng phải là cây, gương sáng cũng chẳng phải là đài; xưa nay không một vật, bụi trần bám vào đâu?',
    source: 'Lục Tổ Huệ Năng — Pháp Bảo Đàn Kinh',
    theme: 'tri-tue',
  },
  {
    id: 'hue-nang-the-gian',
    text: 'Phật pháp tại thế gian, bất ly thế gian giác; ly thế mịch bồ đề, kháp như cầu thố giác.',
    gloss: 'Lược giải: Phật pháp ở ngay giữa cuộc đời, giác ngộ không rời thế gian; lìa đời mà tìm giác ngộ chẳng khác gì đi tìm sừng thỏ.',
    source: 'Lục Tổ Huệ Năng — Pháp Bảo Đàn Kinh',
    theme: 'tri-tue',
  },
  {
    id: 'tue-trung',
    text: 'Phản quan tự kỷ bổn phận sự, bất tòng tha đắc.',
    gloss: 'Lược giải: Hãy quay về soi xét chính mình — đó là việc gốc của người tu, không ai làm thay được.',
    source: 'Tuệ Trung Thượng Sĩ',
    theme: 'tri-tue',
  },

  /* ---------- Nhẫn nhục ---------- */
  {
    id: 'pc-184',
    text: 'Nhẫn nại, kham nhẫn là hạnh tu cao nhất; Niết-bàn là tối thượng — chư Phật đều dạy như vậy.',
    source: pc(184),
    theme: 'nhan-nhuc',
  },
  {
    id: 'pc-223',
    text: 'Lấy không giận thắng giận, lấy thiện thắng ác, lấy rộng rãi thắng keo kiệt, lấy chân thật thắng dối trá.',
    source: pc(223),
    theme: 'nhan-nhuc',
  },
  {
    id: 'pc-222',
    text: 'Ai ghìm được cơn giận đang bùng lên như ghìm cỗ xe đang lao, người ấy mới thật là người đánh xe giỏi; kẻ khác chỉ cầm dây cương mà thôi.',
    source: pc(222),
    theme: 'nhan-nhuc',
  },
  {
    id: 'pc-81',
    text: 'Như tảng đá vững chãi không lay động trước gió, người trí không dao động trước lời khen tiếng chê.',
    source: pc(81),
    theme: 'nhan-nhuc',
  },
  {
    id: 'pc-201',
    text: 'Chiến thắng sinh oán thù, kẻ bại sống khổ đau. Ai bỏ được cả thắng lẫn thua, người ấy sống an vui.',
    source: pc(201),
    theme: 'nhan-nhuc',
  },
  {
    id: 'mn-21-cai-cua',
    text: 'Dù bị người khác đối xử tàn nhẫn đến đâu, nếu để lòng sân hận khởi lên, ta chưa thật sự sống theo lời Phật dạy.',
    source: 'Kinh Ví Dụ Cái Cưa (Trung Bộ 21)',
    theme: 'nhan-nhuc',
  },
  {
    id: 'an-tam-phap',
    text: 'Được và mất, danh thơm và tiếng xấu, khen và chê, vui và khổ — tám điều ấy là lẽ thường của đời, đến rồi lại đi.',
    source: 'Tăng Chi Bộ (Tám pháp thế gian)',
    theme: 'nhan-nhuc',
  },
  {
    id: 'dg-nhin',
    text: 'Một điều nhịn, chín điều lành. Nhẫn không phải là yếu đuối, mà là đủ vững vàng để không làm tổn thương nhau.',
    source: DG,
    theme: 'nhan-nhuc',
  },

  /* ---------- An lạc ---------- */
  {
    id: 'pc-204',
    text: 'Không bệnh là lợi lớn nhất, biết đủ là giàu nhất, lòng tin cậy là người thân nhất, Niết-bàn là an vui nhất.',
    source: pc(204),
    theme: 'an-lac',
  },
  {
    id: 'pc-197',
    text: 'Vui thay, ta sống không oán thù giữa những người còn oán thù.',
    source: pc(197),
    theme: 'an-lac',
  },
  {
    id: 'pc-202',
    text: 'Không lửa nào bằng lửa tham, không tội nào bằng sân hận, không khổ nào bằng thân năm uẩn, không vui nào bằng tịch tịnh.',
    source: pc(202),
    theme: 'an-lac',
  },
  {
    id: 'pc-82',
    text: 'Như hồ nước sâu, trong và lặng; người trí nghe pháp, tâm cũng trở nên an tịnh như thế.',
    source: pc(82),
    theme: 'an-lac',
  },
  {
    id: 'pc-354',
    text: 'Pháp thí hơn mọi thứ bố thí, vị pháp hơn mọi vị ngon, niềm vui pháp hơn mọi niềm vui.',
    source: pc(354),
    theme: 'an-lac',
  },
  {
    id: 'mn-131',
    text: 'Việc đã qua đừng đuổi theo, việc chưa đến đừng mong ngóng. Quá khứ đã lùi xa, tương lai còn chưa tới; hãy nhìn cho rõ điều đang có mặt ngay đây.',
    source: 'Kinh Nhất Dạ Hiền Giả (Trung Bộ 131)',
    theme: 'an-lac',
  },
  {
    id: 'di-giao-tri-tuc',
    text: 'Người biết đủ, dù nằm trên đất vẫn thấy an vui; người không biết đủ, dù ở cõi trời vẫn chưa vừa ý.',
    source: 'Kinh Di Giáo',
    theme: 'an-lac',
  },
  {
    id: 'sn-ban-lanh',
    text: 'Có bạn lành, có người đồng hành tốt không phải là một nửa, mà là trọn vẹn đời sống phạm hạnh.',
    source: 'Tương Ưng Bộ',
    theme: 'an-lac',
  },
  {
    id: 'tnt-cu-tran',
    text: 'Cư trần lạc đạo thả tùy duyên, cơ tắc xan hề khốn tắc miên. Gia trung hữu bảo hưu tầm mịch, đối cảnh vô tâm mạc vấn thiền.',
    gloss: 'Lược giải: Sống giữa đời mà vui với đạo, cứ thuận theo duyên; đói thì ăn, mệt thì ngủ. Trong nhà sẵn báu, thôi đừng tìm đâu xa; đối cảnh mà tâm không vướng, cần chi hỏi thiền.',
    source: 'Trần Nhân Tông — Cư trần lạc đạo phú',
    theme: 'an-lac',
  },
  {
    id: 'dg-buong',
    text: 'Buông xuống không phải là mất đi, mà là để đôi tay được rảnh rang, đón nhận những điều tốt đẹp đang đến.',
    source: DG,
    theme: 'an-lac',
  },
]

const QUOTE_INDEX = new Map(QUOTES.map((q) => [q.id, q]))
const THEME_INDEX = new Map(QUOTE_THEMES.map((t) => [t.id, t]))

export function findQuote(id) {
  return QUOTE_INDEX.get(id) ?? null
}

export function themeLabel(themeId) {
  return THEME_INDEX.get(themeId)?.label ?? ''
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b)
}

// Bước nhảy nguyên tố cùng nhau với số câu: các ngày liên tiếp không rơi vào cùng chủ đề
// (dữ liệu xếp theo chủ đề) nhưng vẫn đi qua đủ mọi câu trước khi lặp lại.
const DAY_STEP = [37, 41, 43, 47, 53, 1].find((s) => gcd(s, QUOTES.length) === 1)

export function quoteOfDay(date = new Date()) {
  // Dùng Date.UTC theo ngày/tháng/năm địa phương để không lệch khi đổi giờ mùa hè
  const dayIndex = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000)
  const n = QUOTES.length
  const i = (((dayIndex * DAY_STEP) % n) + n) % n
  return QUOTES[i]
}
