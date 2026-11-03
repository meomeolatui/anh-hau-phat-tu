/**
 * HỢP ĐỒNG API — hội thoại NPC (mở bằng startActivity('hoi-chuyen', { npcId, name, title, dialogueId, face })).
 * DIALOGUES[dialogueId] = { greeting: string, topics: [{ id, label, lines: [string], reward?: number }] }
 * Các dialogueId đã được zone dùng (giữ nguyên tên):
 *   'chao-mung'       chú tiểu ở cổng chân núi — hướng dẫn vòng chơi (công quả → xu → mua nhang → lên chùa)
 *   'nghi-chan'       Phật tử nghỉ chân ở chiếu nghỉ đường bậc đá — chuyện leo núi, mùa lễ hội
 *   'su-thay-chua-ba' sư thầy ở chùa Bà — sự tích Bà Đen (truyền thuyết), Phật điện & Điện Bà, lễ vía mùng 4–6/5 âm lịch
 *   'chua-hang'       người giữ chùa Hang — Linh Sơn Long Châu Tự, tương truyền "Ông Đá nứt"
 *   'dinh-nui'        hướng dẫn viên trên đỉnh — tượng Phật Bà Tây Bổ Đà Sơn, cáp treo, mây núi
 *   'le-nghi'         cô Phật tử — lễ nghi khi đi chùa
 *
 * Nội dung theo docs/nui-ba-den.md: điều chỉ có một nguồn được nói là "tương truyền / theo một số tư liệu";
 * phân biệt rõ Phật điện (thờ Phật, Bồ Tát) và Điện Bà (thờ Linh Sơn Thánh Mẫu).
 * `reward` (tuỳ chọn) — công đức lần đầu nghe chủ đề, mặc định 15.
 */
export const DIALOGUES = {
  'chao-mung': {
    greeting: 'A Di Đà Phật! Chào bạn đã về tới chân núi Bà Đen. Đường lên núi còn dài, có điều gì chưa rõ bạn cứ hỏi nhé.',
    topics: [
      {
        id: 'bat-dau',
        label: 'Mình nên bắt đầu từ đâu?',
        lines: [
          'Ở chân núi này có bảng việc công quả. Bạn giúp một tay quét lá, nhặt rác hay mời trà khách hành hương thì sẽ nhận được xu.',
          'Muốn quét lá, bạn ghé giá chổi lấy một cây chổi rồi đi qua chỗ lá rụng. Quét xong nhớ bấm “Cất chổi” nha.',
          'Có xu rồi, bạn ghé sạp nhang mua ít nén hương, rồi leo bậc đá hoặc đi cáp treo lên chùa Bà.',
          'Lên tới chùa, bạn thắp hương, ngồi bồ đoàn niệm Phật, lễ Phật, hay phụ quét lá sân chùa. Còn sức thì lên tới đỉnh chiêm bái tượng Phật Bà.',
          'Mỗi ngày có vài nhiệm vụ nhỏ, bấm Q để xem. Cứ thong thả mà đi, không cần vội đâu.',
        ],
      },
      {
        id: 'dieu-khien',
        label: 'Đi lại và tương tác thế nào?',
        lines: [
          'Trên máy tính, bạn đi bằng W A S D hoặc phím mũi tên, giữ Shift để đi nhanh. Trên điện thoại thì dùng cần điều khiển ở góc màn hình.',
          'Kéo chuột hay vuốt màn hình để xoay góc nhìn, lăn chuột để nhìn gần hoặc xa.',
          'Lại gần đồ vật hay người khác, khi hiện nút gợi ý thì bấm E hoặc chạm vào nút đó để tương tác.',
          'Phím Q mở nhiệm vụ trong ngày, phím M mở bản đồ núi, phím Esc mở bảng cài đặt.',
        ],
      },
      {
        id: 'len-nui',
        label: 'Đường lên núi đi thế nào?',
        lines: [
          'Bậc đá bắt đầu ở cuối quảng trường, men sườn núi qua rừng, có chiếu nghỉ giữa đường rồi tới sân chùa Bà.',
          'Từ sân chùa Bà có lối rẽ sang chùa Hang, và có dốc đá dẫn lên đỉnh núi.',
          'Nếu muốn đi nhanh, bạn ra ga cáp treo. Có ba ga: chân núi, chùa Bà và đỉnh núi.',
          'Lạc đường thì bấm M xem bản đồ nhé.',
        ],
      },
      {
        id: 'cong-duc',
        label: 'Công đức và xu khác nhau sao?',
        lines: [
          'Xu là tiền trong trò chơi, có được khi làm công quả, dùng để mua nhang, đèn ở các sạp. Trò chơi không có nạp tiền thật.',
          'Công đức là điểm số ghi nhận những việc lành bạn làm trong trò chơi: thắp hương, niệm Phật, lễ Phật, quét lá…',
          'Nhưng điểm số chỉ là trò chơi thôi. Tu tập thật là sống hiền lành, thương người, giúp đỡ ai đó ngoài đời — chuyện ấy không cần điểm nào ghi lại cả.',
        ],
      },
      {
        id: 'chan-nui',
        label: 'Dưới chân núi có chùa không?',
        lines: [
          'Ngoài đời, ngay lối vào dưới chân núi có chùa Trung — Linh Sơn Phước Trung Tự, lập năm 1876, thờ Linh Sơn Thánh Mẫu.',
          'Còn trong trò chơi này, chân núi là khu chợ nhang và làm công quả: có sạp nhang, sạp hoa, sạp đèn hoa đăng, hồ sen và ga cáp treo.',
          'Chùa thì ở lưng chừng núi — chùa Bà, chùa Hang — và trên đỉnh có tượng Phật Bà.',
          'Bạn mua đèn ở sạp rồi ra hồ sen thả đèn hoa đăng, gửi một lời nguyện lành. Ai đi ngang cũng đọc được đó.',
        ],
      },
    ],
  },

  'nghi-chan': {
    greeting: 'Ngồi xuống nghỉ chân chút đã con. Leo núi phải biết nghỉ thì mới đi được xa.',
    topics: [
      {
        id: 'bac-da',
        label: 'Đường bậc đá có dài không bác?',
        lines: [
          'Theo một số tư liệu, đường bộ lên chùa Bà có khoảng một nghìn rưỡi bậc đá men sườn núi, người ta đi chừng một tới một tiếng rưỡi.',
          'Dọc đường là rừng rậm, đá tảng lớn, sáng sớm hay có sương mù.',
          'Trong trò chơi đường được rút ngắn lại, nhưng con cứ đi chậm mà ngắm cảnh cho trọn.',
        ],
      },
      {
        id: 'chuan-bi',
        label: 'Leo núi cần chuẩn bị gì?',
        lines: [
          'Mang giày đế bám cho chắc, mang theo nước uống. Đi đều chân, thở đều hơi, mệt thì nghỉ, đừng ráng sức.',
          'Bậc đá có chỗ trơn, nhất là sau mưa. Đi bên trong, nhường lối cho người lớn tuổi.',
          'Rác thì mang theo xuống núi, đừng bẻ cây hái hoa. Núi đẹp là nhờ ai cũng giữ gìn.',
        ],
      },
      {
        id: 'nui-ba-den',
        label: 'Núi Bà Đen cao bao nhiêu?',
        lines: [
          'Núi Bà Đen cao 986 mét, là ngọn núi cao nhất Nam Bộ, ở tỉnh Tây Ninh, cách thành phố Tây Ninh chừng 11 cây số.',
          'Núi còn có tên Vân Sơn, hay Bà Đinh. Có tư liệu còn gọi là núi Một.',
          'Đứng trên cao nhìn xuống đồng bằng, ai cũng thấy lòng mình rộng ra.',
        ],
      },
      {
        id: 'mua-le',
        label: 'Mùa nào người lên núi đông nhất?',
        lines: [
          'Đông nhất là dịp Hội Xuân núi Bà, từ mùng 4 Tết kéo dài suốt tháng Giêng.',
          'Rồi tới lễ vía Bà Linh Sơn Thánh Mẫu, từ mùng 4 tới mùng 6 tháng 5 âm lịch, chính vía là mùng 5.',
          'Mùa lễ người đông lắm, con nhớ đi chậm, giữ lễ, đừng chen lấn nghen.',
        ],
      },
    ],
  },

  'su-thay-chua-ba': {
    greeting: 'A Di Đà Phật. Thí chủ đi đường xa có mệt không? Mời thí chủ nghỉ chân, có gì muốn hỏi cứ tự nhiên.',
    topics: [
      {
        id: 'chua-ba',
        label: 'Thưa thầy, chùa Bà có từ bao giờ?',
        lines: [
          'Chùa Bà có tên chữ là Linh Sơn Tiên Thạch Tự, nằm ở lưng chừng núi, hình thành vào khoảng thế kỷ mười tám.',
          'Người ta quen gọi chùa Bà, nhưng chánh điện của chùa là Phật điện, thờ Đức Phật và chư Bồ Tát.',
          'Bên cạnh chùa có Điện Bà, thờ Linh Sơn Thánh Mẫu trong hang đá, mái là đá tự nhiên của núi.',
        ],
      },
      {
        id: 'phat-dien-dien-ba',
        label: 'Phật điện và Điện Bà khác nhau thế nào?',
        lines: [
          'Trên núi này có hai dòng tín ngưỡng cùng song hành: đạo Phật và tín ngưỡng thờ Mẫu.',
          'Phật điện thờ Đức Phật, Bồ Tát — nơi mình học theo con đường từ bi, trí tuệ mà Phật đã chỉ dạy.',
          'Điện Bà thờ Linh Sơn Thánh Mẫu — lòng kính ngưỡng, tri ân của bà con đối với Bà theo tín ngưỡng dân gian.',
          'Hai nơi khác nhau, mình nên hiểu cho đúng và giữ lòng tôn kính ở cả hai, đừng lẫn lộn.',
        ],
      },
      {
        id: 'su-tich',
        label: 'Sự tích Bà Đen ra sao ạ?',
        lines: [
          'Đây là truyền thuyết dân gian, có nhiều dị bản. Bản được kể phổ biến nhất là chuyện nàng Lý Thị Thiên Hương, người Trảng Bàng.',
          'Nàng là người con hiếu thảo, giữ gìn tiết hạnh. Tương truyền khi bị kẻ xấu vây bắt, nàng đã gieo mình xuống vực chứ không chịu khuất phục.',
          'Sau đó nàng báo mộng cho một nhà sư trên núi. Về sau, triều Nguyễn sắc phong là Linh Sơn Thánh Mẫu.',
          'Dân gian gọi là Bà Đen vì nước da ngăm của nàng. Ngoài ra còn có những dị bản khác như chuyện Rê Đeng, Thạch Nương, hay truyền thuyết của người Khmer.',
          'Dù theo bản nào, câu chuyện vẫn nhắc người đời giữ lòng hiếu thảo và sống ngay thẳng.',
        ],
      },
      {
        id: 'le-via',
        label: 'Lễ vía Bà vào dịp nào ạ?',
        lines: [
          'Lễ vía Bà Linh Sơn Thánh Mẫu diễn ra từ mùng 4 đến mùng 6 tháng 5 âm lịch, chính vía là ngày mùng 5.',
          'Lễ hội này đã được công nhận là Di sản văn hoá phi vật thể quốc gia vào ngày 14 tháng 8 năm 2019.',
          'Còn đầu năm thì có Hội Xuân núi Bà, từ mùng 4 Tết kéo dài suốt tháng Giêng.',
        ],
      },
      {
        id: 'tu-tap',
        label: 'Lên chùa nên tu tập thế nào ạ?',
        lines: [
          'Lên chùa không phải để xin cho nhiều. Thắp một nén hương, lạy một lạy với lòng thành là đủ.',
          'Điều quý là khi xuống núi, mình hiền hơn một chút, biết thương cha mẹ, bớt giận, bớt nói lời làm đau người khác.',
          'Mỗi ngày niệm Phật vài câu, thở vài hơi thật chậm. Tu là sửa mình, ngay trong đời sống thường ngày.',
        ],
      },
    ],
  },

  'chua-hang': {
    greeting: 'Chào bạn. Chùa Hang mát lắm, bạn vào nghỉ chân. Đi trong hang nhớ bước chậm nghen.',
    topics: [
      {
        id: 'lich-su',
        label: 'Chùa Hang có từ khi nào?',
        lines: [
          'Chùa Hang tên chữ là Linh Sơn Long Châu Tự, lập năm 1830, được trùng tu vào năm 1995, theo hệ phái Bắc tông.',
          'Chùa gồm hai phần: phần đền do người xây dựng, và phần hang đá tự nhiên của núi.',
          'Gần chùa có thung Suối Vàng, cảnh vật yên tĩnh lắm.',
        ],
      },
      {
        id: 'ong-da-nut',
        label: 'Tảng đá nứt kia có tích gì?',
        lines: [
          'Ở đây có tích “Ông Đá nứt”. Tương truyền xưa kia có tảng đá lớn chắn ngang lối đi.',
          'Người ta thành tâm cầu nguyện suốt một trăm ngày, rồi tảng đá nứt ra, mở thành lối đi.',
          'Đó là lời kể dân gian truyền lại. Mình nghe để hiểu lòng người xưa: kiên trì và thành tâm thì đường khó cũng có lối.',
        ],
      },
      {
        id: 'trong-hang',
        label: 'Đi trong hang cần lưu ý gì?',
        lines: [
          'Nền đá có chỗ trơn, trần có chỗ thấp — bạn đi chậm, cúi đầu khi cần, để ý bước chân.',
          'Trong hang tiếng vang lớn, nên nói khẽ thôi, để người đang lễ được yên.',
          'Đừng khắc chữ hay vẽ lên đá, cũng đừng thắp hương ở chỗ không có lư hương.',
        ],
      },
      {
        id: 'duong-toi',
        label: 'Có đường nào tới chùa Hang nhanh không?',
        lines: [
          'Theo một số tư liệu, ngoài đời có tuyến cáp treo Chùa Hang đưa khách lên khu chùa, khai trương năm 2020.',
          'Còn trong trò chơi, bạn đi lối rẽ từ sân chùa Bà sang đây. Muốn đi nhanh lên đỉnh thì ra ga cáp treo ở chùa Bà.',
        ],
      },
    ],
  },

  'dinh-nui': {
    greeting: 'Chào mừng bạn lên tới đỉnh núi Bà Đen! Gió trên này mát lắm, bạn cứ thong thả ngắm cảnh.',
    topics: [
      {
        id: 'tuong-phat-ba',
        label: 'Pho tượng lớn kia là tượng gì?',
        lines: [
          'Đó là tượng Phật Bà Tây Bổ Đà Sơn. Tượng cao 72 mét, tính cả đài sen và bệ.',
          'Tượng được đúc từ hơn 170 tấn đồng đỏ.',
          'Tạo hình của tượng phỏng theo pho tượng Phật Bà thời Lê ở chùa Bổ Đà, Bắc Giang.',
          'Đứng trước tượng, bạn có thể chắp tay, lặng yên vài hơi thở. Chiêm bái là để nhớ tới lòng từ bi.',
        ],
      },
      {
        id: 'do-cao',
        label: 'Mình đang ở độ cao bao nhiêu?',
        lines: [
          'Ngoài đời, núi Bà Đen cao 986 mét — cao nhất Nam Bộ, nên hay được gọi vui là “nóc nhà Nam Bộ”.',
          'Trong trò chơi, núi được phỏng theo cảnh thật chứ không theo đúng tỉ lệ, nên đường lên ngắn hơn nhiều.',
        ],
      },
      {
        id: 'cap-treo',
        label: 'Cáp treo trên núi có từ bao giờ?',
        lines: [
          'Theo một số tư liệu, hệ thống cáp treo khai trương năm 2020, có tuyến Vân Sơn lên đỉnh và tuyến Chùa Hang lên khu chùa.',
          'Trong trò chơi có ba ga: chân núi, chùa Bà và đỉnh núi. Bạn ra ga là đi được ngay.',
        ],
      },
      {
        id: 'may-nui',
        label: 'Sao trên đỉnh hay có mây vậy?',
        lines: [
          'Núi đứng một mình giữa đồng bằng nên mây, sương hay vờn quanh đỉnh, nhất là sáng sớm.',
          'Một tên khác của núi là Vân Sơn — nghĩa là “núi mây”.',
          'Nếu thích, bạn tìm chỗ ngồi thiền trên đỉnh, nhìn mây trôi mà theo dõi hơi thở. Mây đến rồi đi, ý nghĩ cũng vậy.',
        ],
      },
      {
        id: 'giu-gin',
        label: 'Mình có thể làm gì cho đỉnh núi sạch đẹp?',
        lines: [
          'Mang rác của mình xuống núi, thấy rác rơi thì nhặt giúp một chút.',
          'Không viết vẽ lên đá, lên tượng; nói khẽ để giữ không khí trang nghiêm.',
          'Việc nhỏ thôi, nhưng ai cũng làm thì núi mãi đẹp.',
        ],
      },
    ],
  },

  'le-nghi': {
    greeting: 'A Di Đà Phật! Bạn mới lên chùa lần đầu hả? Có gì chưa rõ về lễ nghi, mình chỉ cho.',
    topics: [
      {
        id: 'trang-phuc',
        label: 'Đi chùa nên ăn mặc thế nào?',
        lines: [
          'Bạn mặc kín đáo, lịch sự là được: tránh quần quá ngắn, áo hở vai hay hở lưng.',
          'Vào chánh điện thì bỏ mũ nón; chỗ nào chùa yêu cầu cởi giày dép thì mình để gọn bên ngoài.',
          'Không cần đồ đắt tiền, gọn gàng sạch sẽ là đẹp rồi.',
        ],
      },
      {
        id: 'di-lai',
        label: 'Vào chánh điện đi lối nào?',
        lines: [
          'Mình đi cửa bên, vì cửa chính giữa thường dành cho chư Tăng hoặc những dịp lễ lớn.',
          'Đi nhẹ, nói khẽ, không chen lấn. Đừng đi ngang ngay trước mặt người đang lạy Phật.',
          'Giữ yên lặng cũng là một cách cúng dường — cho mình và cho mọi người chung quanh.',
        ],
      },
      {
        id: 'le-vat',
        label: 'Nên dâng lễ vật gì?',
        lines: [
          'Lễ vật dâng Phật là đồ chay: hương, hoa, đèn, trái cây. Không mang đồ mặn lên Phật điện.',
          'Không cần nhiều, quý nhất là lòng thành. Một nén hương, một cành hoa là đủ.',
          'Đốt ít hương thôi, vừa giữ không khí trong lành, vừa an toàn cho mọi người.',
        ],
      },
      {
        id: 'chap-tay',
        label: 'Chắp tay, lạy Phật thế nào cho đúng?',
        lines: [
          'Chắp tay ngay ngắn trước ngực, các ngón khép lại như búp sen.',
          'Khi lạy, mình quỳ xuống, cúi người để hai đầu gối, hai bàn tay và trán chạm đất — gọi là năm vóc sát đất.',
          'Thường lạy ba lạy, kính Phật, Pháp, Tăng. Lạy chậm thôi, mỗi lạy theo một hơi thở.',
        ],
      },
      {
        id: 'chup-anh',
        label: 'Có được chụp ảnh trong chùa không?',
        lines: [
          'Ở sân chùa, cảnh vật thì bạn chụp thoải mái. Còn nơi thờ tự thì nên hạn chế chụp ảnh.',
          'Nếu thật cần, hãy hỏi người trong chùa, không dùng đèn chớp, không chụp người đang lễ.',
          'Đôi khi cứ đứng yên ngắm cho kỹ, giữ hình ảnh ấy trong lòng cũng đẹp lắm.',
        ],
      },
    ],
  },
}
