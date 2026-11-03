/**
 * Bài học Phật pháp nhập môn — nội dung tự biên soạn, diễn đạt giản dị cho người tại gia.
 * Chỉ dùng những điểm giáo lý phổ thông, được các truyền thống thừa nhận rộng rãi;
 * tránh số liệu không chắc chắn. Đây là tài liệu tham khảo nhập môn, không thay cho
 * việc học hỏi từ chư Tăng Ni và kinh sách chính thống.
 *
 * Thứ tự trong mảng LESSONS chính là thứ tự lộ trình học.
 * icon: tên icon lucide (ánh xạ sang component ở features/hoc-phat/lesson-icons.js)
 */

export const LEVELS = [
  {
    id: 'nhap-mon',
    label: 'Nhập môn',
    description: 'Biết Đức Phật là ai, nương tựa Tam Bảo và giữ gìn nếp sống thiện lành mỗi ngày.',
  },
  {
    id: 'can-ban',
    label: 'Căn bản',
    description: 'Hiểu nhân quả, mười điều thiện và con đường thoát khổ mà Đức Phật chỉ dạy.',
  },
  {
    id: 'nang-cao',
    label: 'Nâng cao',
    description: 'Nuôi lớn tâm từ bi, hạnh Bồ-tát và tìm hiểu các pháp môn tu tập tại Việt Nam.',
  },
]

export const LESSONS = [
  /* ---------------- NHẬP MÔN ---------------- */
  {
    id: 'duc-phat-thich-ca',
    title: 'Đức Phật Thích Ca Mâu Ni',
    subtitle: 'Cuộc đời tóm lược của bậc Giác Ngộ',
    level: 'nhap-mon',
    minutes: 7,
    icon: 'Sun',
    sections: [
      {
        heading: 'Một con người tìm ra con đường',
        paragraphs: [
          'Đức Phật không phải là một vị thần ban phước hay giáng hoạ. Ngài là một con người đã tự mình tu tập, thấy rõ bản chất của khổ đau và con đường chấm dứt khổ đau, rồi dành trọn phần đời còn lại để chỉ dạy cho người khác.',
          '“Thích Ca Mâu Ni” có nghĩa là bậc hiền triết của dòng tộc Thích Ca. “Phật” (Buddha) nghĩa là người đã tỉnh thức, đã giác ngộ.',
        ],
      },
      {
        heading: 'Thái tử Tất-đạt-đa',
        paragraphs: [
          'Theo truyền thống, Ngài tên là Tất-đạt-đa (Siddhattha), họ Cồ-đàm (Gotama), con của vua Tịnh Phạn và hoàng hậu Ma-da, thuộc dòng Thích Ca. Ngài đản sinh tại vườn Lâm-tỳ-ni, nay thuộc nước Nepal, vào khoảng thế kỷ VI – V trước Công nguyên.',
          'Lớn lên trong nhung lụa, nhưng khi đi dạo ngoài thành, thái tử lần lượt thấy một người già, một người bệnh, một người chết và một vị sa-môn có dáng vẻ an nhiên. Những hình ảnh ấy khiến Ngài trăn trở: ai rồi cũng già, bệnh, chết — vậy có con đường nào vượt qua khổ đau không?',
        ],
      },
      {
        heading: 'Xuất gia và thành đạo',
        paragraphs: [
          'Thái tử rời bỏ cung điện để đi tìm chân lý. Ngài theo học với các vị thầy tu thiền nổi tiếng, rồi tu khổ hạnh rất nghiêm khắc đến mức thân thể kiệt quệ, nhưng vẫn chưa đạt được giải thoát.',
          'Từ kinh nghiệm đó, Ngài nhận ra con đường Trung đạo: không đắm chìm trong hưởng thụ, cũng không hành hạ thân xác. Ngồi thiền dưới cội cây Bồ-đề tại nơi nay gọi là Bồ-đề Đạo Tràng (Bodh Gaya, Ấn Độ), Ngài chứng ngộ và trở thành Phật.',
        ],
      },
      {
        heading: 'Bốn mươi lăm năm hoằng pháp',
        paragraphs: [
          'Bài pháp đầu tiên Đức Phật giảng là về Tứ Diệu Đế, cho năm anh em Kiều-trần-như tại vườn Lộc Uyển (Sarnath). Sự kiện này được gọi là “Chuyển Pháp Luân” — bánh xe Chánh pháp bắt đầu lăn.',
          'Suốt khoảng 45 năm sau đó, Ngài đi khắp vùng lưu vực sông Hằng để giảng dạy cho mọi tầng lớp, từ vua quan đến người cùng khổ, không phân biệt giai cấp. Năm 80 tuổi, Ngài nhập Niết-bàn tại Câu-thi-na (Kushinagar).',
        ],
        list: [
          'Lâm-tỳ-ni — nơi Đức Phật đản sinh',
          'Bồ-đề Đạo Tràng — nơi Ngài thành đạo',
          'Lộc Uyển — nơi Ngài giảng bài pháp đầu tiên',
          'Câu-thi-na — nơi Ngài nhập Niết-bàn',
        ],
      },
      {
        heading: 'Những ngày tưởng niệm tại Việt Nam',
        paragraphs: [
          'Phật tử Việt Nam theo truyền thống Bắc tông thường tưởng niệm Đức Phật vào các ngày: Phật Đản (rằm tháng Tư âm lịch), vía Xuất gia (mùng 8 tháng Hai), vía Niết-bàn (rằm tháng Hai) và vía Thành đạo (mùng 8 tháng Chạp).',
          'Cách tưởng niệm ý nghĩa nhất không nằm ở mâm lễ lớn, mà ở việc sống theo lời Ngài dạy: bớt tham, bớt giận, sống tỉnh thức và thương yêu.',
        ],
      },
    ],
    keyPoints: [
      'Đức Phật là con người tự tu tập mà giác ngộ, không phải thần linh ban phước.',
      'Ngài tìm ra con đường Trung đạo, tránh cả hưởng thụ lẫn khổ hạnh cực đoan.',
      'Bài pháp đầu tiên tại Lộc Uyển là Tứ Diệu Đế.',
      'Bốn thánh tích: Lâm-tỳ-ni, Bồ-đề Đạo Tràng, Lộc Uyển, Câu-thi-na.',
    ],
    quiz: [
      {
        q: 'Trước khi xuất gia, Đức Phật là thái tử có tên gọi là gì?',
        options: ['Ca-diếp', 'Tất-đạt-đa', 'A-nan', 'Xá-lợi-phất'],
        answer: 1,
        explain: 'Thái tử Tất-đạt-đa (Siddhattha), họ Cồ-đàm, con vua Tịnh Phạn và hoàng hậu Ma-da.',
      },
      {
        q: 'Đức Phật đản sinh tại đâu?',
        options: ['Vườn Lâm-tỳ-ni', 'Thành Xá-vệ', 'Vườn Lộc Uyển', 'Núi Linh Thứu'],
        answer: 0,
        explain: 'Ngài đản sinh tại vườn Lâm-tỳ-ni, nay thuộc nước Nepal.',
      },
      {
        q: 'Sau thời gian tu khổ hạnh, Đức Phật nhận ra con đường nào?',
        options: ['Khổ hạnh càng nghiêm càng tốt', 'Hưởng thụ để tâm được vui', 'Con đường Trung đạo', 'Cầu xin thần linh gia hộ'],
        answer: 2,
        explain: 'Trung đạo là con đường không đắm chìm trong dục lạc, cũng không hành hạ thân xác.',
      },
      {
        q: 'Bài pháp đầu tiên tại vườn Lộc Uyển nói về điều gì?',
        options: ['Lục độ Ba-la-mật', 'Kinh A Di Đà', 'Mười điều thiện', 'Tứ Diệu Đế'],
        answer: 3,
        explain: 'Đức Phật giảng Tứ Diệu Đế cho năm anh em Kiều-trần-như — gọi là Chuyển Pháp Luân.',
      },
      {
        q: 'Theo truyền thống Phật giáo Việt Nam, lễ Phật Đản diễn ra vào ngày nào?',
        options: ['Mùng 8 tháng Chạp', 'Rằm tháng Tư âm lịch', 'Rằm tháng Bảy âm lịch', 'Mùng 1 Tết'],
        answer: 1,
        explain: 'Phật Đản là rằm tháng Tư âm lịch. Mùng 8 tháng Chạp là vía Thành đạo; rằm tháng Bảy là lễ Vu Lan.',
      },
    ],
  },
  {
    id: 'tam-bao-quy-y',
    title: 'Tam Bảo và Quy y',
    subtitle: 'Ba ngôi báu — nơi nương tựa vững chắc',
    level: 'nhap-mon',
    minutes: 6,
    icon: 'Gem',
    sections: [
      {
        heading: 'Tam Bảo là gì?',
        paragraphs: [
          'Tam Bảo là ba ngôi báu: Phật, Pháp và Tăng. Gọi là “báu” vì đó là những điều quý giá nhất, giúp con người ra khỏi mê lầm và khổ đau.',
        ],
        list: [
          'Phật — bậc đã giác ngộ hoàn toàn, người thầy chỉ đường.',
          'Pháp — lời dạy của Đức Phật, con đường dẫn đến an lạc và giải thoát.',
          'Tăng — đoàn thể những người xuất gia sống hoà hợp, cùng nhau tu học và giữ gìn Chánh pháp.',
        ],
      },
      {
        heading: 'Quy y nghĩa là gì?',
        paragraphs: [
          '“Quy” là trở về, “y” là nương tựa. Quy y Tam Bảo là trở về nương tựa Phật, Pháp, Tăng — chọn Đức Phật làm thầy, lấy giáo pháp làm con đường, xem Tăng đoàn là người bạn lành dẫn dắt.',
          'Quy y không phải là xin được che chở một cách thần bí, mà là một lời phát nguyện có ý thức: từ nay tôi sống theo con đường hiểu biết và thương yêu.',
        ],
      },
      {
        heading: 'Lễ quy y',
        paragraphs: [
          'Người muốn quy y thường đến chùa, xin một vị thầy làm lễ truyền Tam quy. Vị thầy ấy gọi là thầy Bổn sư. Sau lễ, người quy y nhận một pháp danh — tên gọi trong đạo, nhắc mình về hướng tu tập.',
          'Theo truyền thống, sau khi quy y, người Phật tử phát nguyện không tôn thờ quỷ thần thay cho Phật, không theo những giáo thuyết sai lệch thay cho Chánh pháp, và không kết thân với bạn xấu dẫn dắt mình làm điều ác.',
          'Lễ quy y thường đi kèm với việc thọ trì Năm giới — có thể nhận những giới mình giữ được trước, rồi dần dần giữ trọn.',
        ],
      },
      {
        heading: 'Tam Bảo trong chính mình',
        paragraphs: [
          'Kinh Pháp Bảo Đàn ghi lời Lục Tổ Huệ Năng dạy về tự tánh Tam Bảo: Phật là giác, Pháp là chánh, Tăng là tịnh. Quy y Tam Bảo cũng là quay về nuôi dưỡng sự tỉnh thức, chân chánh và trong sạch sẵn có trong tâm mình.',
          'Vì vậy, ngoài việc kính lễ Tam Bảo nơi chùa, mỗi ngày ta có thể “quy y” bằng một hơi thở chánh niệm, một lời nói chân thật, một ý nghĩ trong lành.',
        ],
      },
    ],
    keyPoints: [
      'Tam Bảo gồm Phật, Pháp, Tăng.',
      'Quy y là trở về nương tựa — một lời phát nguyện có ý thức, không phải nghi thức thần bí.',
      'Sau lễ quy y, người Phật tử nhận pháp danh và thường thọ trì Năm giới.',
      'Tự tánh Tam Bảo: giác — chánh — tịnh ngay trong tâm mỗi người.',
    ],
    quiz: [
      {
        q: 'Tam Bảo gồm những ngôi báu nào?',
        options: ['Phật, Bồ-tát, Thánh', 'Giới, Định, Tuệ', 'Phật, Pháp, Tăng', 'Tham, Sân, Si'],
        answer: 2,
        explain: 'Tam Bảo là Phật (bậc giác ngộ), Pháp (lời dạy) và Tăng (đoàn thể xuất gia hoà hợp).',
      },
      {
        q: '“Quy y” có nghĩa là gì?',
        options: ['Trở về nương tựa', 'Xin ban phước lộc', 'Cắt tóc đi tu', 'Cúng dường chùa'],
        answer: 0,
        explain: '“Quy” là trở về, “y” là nương tựa. Người tại gia quy y vẫn sống đời sống gia đình bình thường.',
      },
      {
        q: 'Sau lễ quy y, người Phật tử thường nhận được gì?',
        options: ['Một lá bùa hộ mệnh', 'Một pháp danh', 'Chức vụ trong chùa', 'Giấy chứng nhận công đức'],
        answer: 1,
        explain: 'Pháp danh là tên gọi trong đạo, nhắc người Phật tử về hướng tu tập của mình.',
      },
      {
        q: '“Tăng” trong Tam Bảo được hiểu là gì?',
        options: ['Một vị sư bất kỳ', 'Ngôi chùa', 'Những người thường đi lễ chùa', 'Đoàn thể người xuất gia sống hoà hợp'],
        answer: 3,
        explain: 'Tăng (Sangha) là đoàn thể người xuất gia cùng tu học, sống hoà hợp theo giới luật.',
      },
      {
        q: 'Theo Lục Tổ Huệ Năng, tự tánh Tam Bảo là gì?',
        options: ['Giác, chánh, tịnh', 'Từ, bi, hỷ', 'Tín, nguyện, hạnh', 'Văn, tư, tu'],
        answer: 0,
        explain: 'Phật là giác, Pháp là chánh, Tăng là tịnh — Tam Bảo sẵn có trong tâm mỗi người.',
      },
    ],
  },
  {
    id: 'le-nghi-tai-gia',
    title: 'Lễ nghi căn bản tại gia',
    subtitle: 'Bàn thờ Phật, chắp tay, lễ lạy, dâng hương và thời khoá',
    level: 'nhap-mon',
    minutes: 7,
    icon: 'Flame',
    sections: [
      {
        heading: 'Lễ nghi để làm gì?',
        paragraphs: [
          'Lễ nghi trong đạo Phật không nhằm cầu xin hay mặc cả với thần linh. Lễ nghi giúp thân tâm trang nghiêm, nhắc ta nhớ đến đức hạnh của Đức Phật và nuôi dưỡng lòng cung kính, khiêm hạ.',
          'Vì vậy, điều cốt lõi là sự thành tâm và giản dị — không cần mâm lễ cầu kỳ, tốn kém.',
        ],
      },
      {
        heading: 'Bàn thờ Phật trong nhà',
        paragraphs: [
          'Nên đặt bàn thờ Phật ở nơi trang nghiêm, cao ráo, sạch sẽ, yên tĩnh. Nếu chung phòng với bàn thờ gia tiên, bàn thờ Phật thường được đặt cao hơn để thể hiện lòng tôn kính.',
          'Có thể thờ tượng hoặc ảnh Đức Phật Thích Ca, Đức Phật A Di Đà hay Bồ-tát Quán Thế Âm — tuỳ theo pháp môn và nhân duyên của mỗi gia đình. Một ngôi tượng nhỏ, sạch đẹp quý hơn nhiều tượng mà không được chăm chút.',
        ],
        list: [
          'Lễ vật nên thanh tịnh: hoa tươi, đèn, nước sạch, hương và trái cây.',
          'Không dâng cúng đồ mặn lên bàn thờ Phật.',
          'Thường xuyên lau dọn, thay nước, thay hoa.',
        ],
      },
      {
        heading: 'Chắp tay và lễ lạy',
        paragraphs: [
          'Chắp tay (hiệp chưởng): hai bàn tay áp vào nhau trước ngực, các ngón khép lại như búp sen. Cử chỉ này thể hiện tâm cung kính và nhất tâm, không tán loạn. Người Phật tử cũng chắp tay chào nhau, kèm lời “A Di Đà Phật” hoặc “Mô Phật”.',
          'Lễ lạy theo cách “năm vóc sát đất” (ngũ thể đầu địa): hai đầu gối, hai cánh tay và trán chạm đất. Khi lạy, hạ mình xuống chậm rãi, ý thức từng cử động — đó là lúc buông bỏ bản ngã, tập khiêm cung.',
        ],
      },
      {
        heading: 'Dâng hương',
        paragraphs: [
          'Thường dâng một hoặc ba nén hương. Ba nén hương hay được hiểu là tượng trưng cho giới hương, định hương và tuệ hương — hương thơm của đời sống đạo đức, tâm an định và trí tuệ sáng suốt.',
          'Không cần đốt nhiều hương hay hương to. Hãy chú ý an toàn phòng cháy và giữ không khí trong lành, nhất là trong nhà có người già và trẻ nhỏ.',
        ],
      },
      {
        heading: 'Một thời khoá đơn giản',
        paragraphs: [
          'Thời khoá là giờ tu tập cố định mỗi ngày — sáng sớm hoặc buổi tối, chỉ cần 15 đến 30 phút nhưng đều đặn. Trình tự có thể tham khảo:',
        ],
        list: [
          'Rửa mặt, ăn mặc gọn gàng; thắp đèn, dâng hương.',
          'Chắp tay đứng ngay ngắn, tâm lắng lại vài hơi thở; lễ Phật ba lạy.',
          'Tụng một bài kinh ngắn (ví dụ Bát-nhã Tâm Kinh, kinh A Di Đà hoặc phẩm Phổ Môn).',
          'Niệm danh hiệu Phật hoặc ngồi thiền ít phút.',
          'Hồi hướng: nguyện điều lành mình làm được đem lại an vui cho mọi người.',
        ],
      },
      {
        heading: 'Khi đến chùa',
        paragraphs: [
          'Ăn mặc kín đáo, nói năng nhỏ nhẹ, tắt chuông điện thoại. Khi đi nhiễu quanh tháp hay điện Phật, theo truyền thống giữ tháp ở phía bên tay phải của mình. Kính trọng chư Tăng Ni và giữ gìn cảnh chùa sạch đẹp.',
        ],
      },
    ],
    keyPoints: [
      'Lễ nghi để nuôi tâm cung kính, không phải để cầu xin hay mặc cả.',
      'Bàn thờ Phật đặt nơi trang nghiêm, sạch sẽ; lễ vật thanh tịnh, không cúng mặn.',
      'Năm vóc sát đất: hai gối, hai tay và trán chạm đất.',
      'Thời khoá ngắn mà đều đặn quý hơn thời khoá dài mà thất thường; kết thúc bằng hồi hướng.',
    ],
    quiz: [
      {
        q: 'Khi lễ lạy “năm vóc sát đất”, năm phần nào của thân chạm đất?',
        options: ['Hai bàn chân, hai tay và trán', 'Hai gối, hai tay và trán', 'Hai gối, hai vai và trán', 'Hai tay, ngực và trán'],
        answer: 1,
        explain: 'Ngũ thể đầu địa: hai đầu gối, hai cánh tay và trán chạm đất — biểu hiện sự khiêm cung trọn vẹn.',
      },
      {
        q: 'Lễ vật nào phù hợp để dâng lên bàn thờ Phật?',
        options: ['Gà luộc và rượu', 'Vàng mã', 'Hoa tươi, đèn, nước sạch, hương, trái cây', 'Tiền mặt đặt trên tượng'],
        answer: 2,
        explain: 'Lễ vật dâng Phật nên thanh tịnh, giản dị và không có đồ mặn.',
      },
      {
        q: 'Ba nén hương thường được hiểu là tượng trưng cho điều gì?',
        options: ['Phước, lộc, thọ', 'Quá khứ, hiện tại, vị lai', 'Cha, mẹ, thầy', 'Giới hương, định hương, tuệ hương'],
        answer: 3,
        explain: 'Hương thơm của giới (đạo đức), định (tâm an) và tuệ (hiểu biết) — điều mình nguyện vun bồi.',
      },
      {
        q: 'Chắp tay hình búp sen thể hiện điều gì?',
        options: ['Tâm cung kính và nhất tâm', 'Lời cầu xin tài lộc', 'Sự van nài thần linh', 'Một thói quen xã giao'],
        answer: 0,
        explain: 'Hai bàn tay hợp lại thể hiện tâm chuyên nhất, cung kính, không tán loạn.',
      },
      {
        q: 'Một thời khoá tu tập tại gia thường kết thúc bằng việc gì?',
        options: ['Xin xăm', 'Hồi hướng', 'Đốt vàng mã', 'Rung chuông thật lâu'],
        answer: 1,
        explain: 'Hồi hướng là chia sẻ điều lành mình làm được đến mọi người, mọi loài — mở rộng tâm, không giữ riêng cho mình.',
      },
    ],
  },
  {
    id: 'ngu-gioi',
    title: 'Năm giới cho người tại gia',
    subtitle: 'Ngũ giới — nền tảng của hạnh phúc gia đình và xã hội',
    level: 'nhap-mon',
    minutes: 7,
    icon: 'ShieldCheck',
    sections: [
      {
        heading: 'Giới là hàng rào bảo vệ',
        paragraphs: [
          'Giới không phải là sự trói buộc, mà như hàng rào bảo vệ khu vườn: giữ cho hạt giống lành được lớn lên, ngăn những điều gây khổ cho mình và người. Người giữ giới sống thanh thản, không phải lo sợ, hối hận.',
          'Trong đạo Phật, Giới là nền tảng của Định và Tuệ — ba môn học căn bản gọi là Tam vô lậu học: Giới — Định — Tuệ.',
        ],
      },
      {
        heading: 'Năm giới',
        paragraphs: ['Năm giới dành cho người Phật tử tại gia (cư sĩ) gồm:'],
        list: [
          'Không sát sinh — tôn trọng và bảo vệ sự sống.',
          'Không trộm cắp — không lấy của không được cho, tôn trọng tài sản người khác.',
          'Không tà dâm — chung thuỷ, tôn trọng hạnh phúc gia đình mình và người.',
          'Không nói dối — nói lời chân thật, có lợi ích.',
          'Không uống rượu và dùng các chất gây say, gây nghiện — giữ tâm trí tỉnh táo.',
        ],
      },
      {
        heading: 'Mặt tích cực của mỗi giới',
        paragraphs: [
          'Mỗi giới không chỉ là “không làm điều ác” mà còn mở ra “làm điều lành”. Không sát sinh đi cùng với lòng thương yêu, bảo vệ muôn loài. Không trộm cắp đi cùng với hạnh bố thí, chia sẻ. Không tà dâm đi cùng với trách nhiệm và chung thuỷ. Không nói dối đi cùng với ái ngữ — lời nói dịu dàng, xây dựng. Không dùng chất say đi cùng với việc chăm sóc thân tâm khoẻ mạnh.',
        ],
      },
      {
        heading: 'Thọ giới và giữ giới',
        paragraphs: [
          'Người Phật tử thường thọ Năm giới trong lễ quy y. Nếu chưa giữ được trọn vẹn, có thể phát nguyện giữ những giới mình giữ được trước, rồi nỗ lực dần dần.',
          'Khi lỡ phạm giới, điều quan trọng không phải là tự dằn vặt, mà là thành tâm sám hối: nhận ra lỗi, sửa đổi và nguyện không tái phạm. Sám hối chân thật là thay đổi hành vi, không chỉ là đọc lời sám.',
          'Ngoài Năm giới, vào những ngày nhất định, người tại gia có thể thọ Bát quan trai giới — tám giới giữ trong một ngày một đêm, sống gần với đời sống xuất gia.',
        ],
      },
    ],
    keyPoints: [
      'Năm giới: không sát sinh, không trộm cắp, không tà dâm, không nói dối, không dùng chất gây say.',
      'Giới là nền tảng của Định và Tuệ (Tam vô lậu học).',
      'Mỗi giới đều có mặt tích cực: thương yêu, chia sẻ, chung thuỷ, chân thật, tỉnh táo.',
      'Có thể giữ dần từng giới; khi phạm thì sám hối bằng cách thay đổi thật sự.',
    ],
    quiz: [
      {
        q: 'Giới thứ năm trong Năm giới là gì?',
        options: ['Không nói dối', 'Không sát sinh', 'Không ăn mặn', 'Không uống rượu và dùng chất gây say'],
        answer: 3,
        explain: 'Giới thứ năm giúp giữ tâm trí tỉnh táo — nền tảng để giữ trọn bốn giới còn lại.',
      },
      {
        q: 'Tam vô lậu học gồm ba môn học nào?',
        options: ['Giới, Định, Tuệ', 'Văn, Tư, Tu', 'Tín, Hạnh, Nguyện', 'Kinh, Luật, Luận'],
        answer: 0,
        explain: 'Giữ giới giúp tâm an định; tâm định thì trí tuệ phát sinh.',
      },
      {
        q: 'Mặt tích cực đi cùng giới “không trộm cắp” là gì?',
        options: ['Tiết kiệm tối đa', 'Bố thí, chia sẻ', 'Không cho ai mượn đồ', 'Làm việc nhiều hơn'],
        answer: 1,
        explain: 'Không lấy của người đi đôi với tâm rộng rãi, biết chia sẻ với người khác.',
      },
      {
        q: 'Nếu chưa thể giữ trọn Năm giới, người Phật tử nên làm gì?',
        options: ['Chưa nên quy y', 'Bỏ qua việc giữ giới', 'Phát nguyện giữ những giới mình giữ được và nỗ lực dần', 'Nhờ người khác giữ giới thay'],
        answer: 2,
        explain: 'Có thể thọ trì từng phần, rồi dần dần giữ trọn — quan trọng là sự chân thành và tiến bộ.',
      },
      {
        q: 'Sám hối chân thật là gì?',
        options: ['Đọc lời sám thật nhiều lần', 'Cúng dường để xoá tội', 'Tự trách mình thật nặng nề', 'Nhận ra lỗi, sửa đổi và nguyện không tái phạm'],
        answer: 3,
        explain: 'Sám hối là thay đổi hành vi và tâm ý, không phải nghi thức để “xoá” lỗi lầm.',
      },
    ],
  },

  /* ---------------- CĂN BẢN ---------------- */
  {
    id: 'nhan-qua-nghiep',
    title: 'Nhân quả và Nghiệp',
    subtitle: 'Gieo gì gặt nấy — nhưng không phải định mệnh',
    level: 'can-ban',
    minutes: 7,
    icon: 'Sprout',
    sections: [
      {
        heading: 'Nghiệp là gì?',
        paragraphs: [
          'Nghiệp (karma) nghĩa là hành động có chủ ý. Đức Phật dạy rằng tác ý — ý muốn đứng sau hành động — chính là nghiệp. Cùng một hành động, nhưng xuất phát từ lòng tốt hay từ ác ý thì kết quả rất khác nhau.',
          'Nghiệp được tạo ra qua ba cửa: thân (việc làm), khẩu (lời nói) và ý (suy nghĩ). Vì thế tu tập là chăm sóc cả ba.',
        ],
      },
      {
        heading: 'Nhân, duyên và quả',
        paragraphs: [
          'Một hạt lúa (nhân) cần có đất, nước, ánh nắng (duyên) mới nảy mầm thành cây lúa (quả). Cũng vậy, một hành động thiện hay ác là nhân; khi đủ điều kiện, nó sẽ trổ thành kết quả tương ứng.',
          'Hiểu nhân quả giúp ta sống có trách nhiệm: không đổ lỗi cho số phận, cho người khác, mà nhìn lại hành động của chính mình.',
        ],
      },
      {
        heading: 'Quả báo theo thời gian',
        paragraphs: [
          'Quả của nghiệp không nhất thiết đến ngay. Kinh luận thường chia làm ba thời: hiện báo (trổ quả ngay trong đời này), sinh báo (trổ quả ở đời kế tiếp) và hậu báo (trổ quả ở những đời sau nữa).',
          'Vì vậy, có khi thấy người làm ác vẫn sung sướng, người làm lành vẫn gặp khó khăn — đó là vì nhân quả cần thời gian và điều kiện, không phải vì nhân quả sai.',
        ],
      },
      {
        heading: 'Nhân quả không phải định mệnh',
        paragraphs: [
          'Trong kinh có ví dụ về nắm muối: bỏ một nắm muối vào chén nước nhỏ thì nước rất mặn, nhưng bỏ vào dòng sông lớn thì hầu như không thấy mặn. Cũng vậy, khi tâm rộng lớn và thiện nghiệp dồi dào, quả của nghiệp xấu sẽ nhẹ đi.',
          'Nghiệp có thể chuyển hoá. Không ai có thể “mua” được phước hay “cúng” để xoá nghiệp; điều thật sự thay đổi tương lai là thay đổi cách mình nghĩ, nói và làm ngay hôm nay.',
        ],
      },
    ],
    keyPoints: [
      'Nghiệp là hành động có tác ý, qua ba cửa thân — khẩu — ý.',
      'Nhân cần có duyên mới thành quả.',
      'Quả báo có thể đến ngay, đời sau, hoặc nhiều đời sau.',
      'Nghiệp không phải định mệnh: sống thiện hơn hôm nay là cách chuyển hoá nghiệp.',
    ],
    quiz: [
      {
        q: 'Theo lời Phật dạy, yếu tố cốt lõi tạo nên nghiệp là gì?',
        options: ['Ngày giờ sinh', 'Tác ý (ý muốn)', 'Số mệnh an bài', 'Phong thuỷ nhà ở'],
        answer: 1,
        explain: 'Đức Phật dạy tác ý chính là nghiệp: ý muốn đứng sau hành động quyết định tính chất thiện hay ác.',
      },
      {
        q: 'Nghiệp được tạo ra qua ba cửa nào?',
        options: ['Thân, khẩu, ý', 'Mắt, tai, mũi', 'Quá khứ, hiện tại, vị lai', 'Cha, mẹ, bản thân'],
        answer: 0,
        explain: 'Việc làm (thân), lời nói (khẩu) và suy nghĩ (ý) đều tạo nghiệp.',
      },
      {
        q: 'Trong ví dụ hạt lúa, đất, nước và ánh nắng tượng trưng cho điều gì?',
        options: ['Nhân', 'Quả', 'Duyên', 'Nghiệp'],
        answer: 2,
        explain: 'Duyên là những điều kiện hỗ trợ giúp nhân trổ thành quả.',
      },
      {
        q: 'Ví dụ về nắm muối bỏ vào dòng sông muốn nói điều gì?',
        options: ['Làm ác không sao cả', 'Muối không có tác dụng', 'Nên tránh xa sông nước', 'Tâm rộng lớn, thiện nghiệp dồi dào thì quả xấu nhẹ đi'],
        answer: 3,
        explain: 'Nghiệp có thể chuyển hoá: nuôi lớn thiện tâm làm quả của nghiệp xấu trở nên nhẹ hơn.',
      },
      {
        q: 'Cách nào thật sự giúp chuyển hoá nghiệp?',
        options: ['Thay đổi cách nghĩ, nói và làm', 'Cúng thật nhiều lễ vật', 'Đeo vật phẩm hộ mệnh', 'Xem ngày tốt để làm việc'],
        answer: 0,
        explain: 'Nhân quả do chính mình tạo, nên chỉ có thể chuyển hoá bằng hành động và tâm ý của chính mình.',
      },
    ],
  },
  {
    id: 'thap-thien',
    title: 'Mười điều thiện',
    subtitle: 'Thập thiện nghiệp — sống lành qua thân, lời và ý',
    level: 'can-ban',
    minutes: 6,
    icon: 'HeartHandshake',
    sections: [
      {
        heading: 'Thiện nghiệp trong đời thường',
        paragraphs: [
          'Mười điều thiện (Thập thiện nghiệp) là những hành vi lành mạnh mà Đức Phật khuyên người tu tập, được nói rõ trong kinh Thập Thiện Nghiệp Đạo. Đây là nền tảng đạo đức để có đời sống an vui, gia đình êm ấm, xã hội hoà bình.',
          'Mười điều được chia theo ba cửa tạo nghiệp: ba điều thuộc thân, bốn điều thuộc lời nói và ba điều thuộc ý.',
        ],
      },
      {
        heading: 'Ba điều thiện của thân',
        paragraphs: ['Không làm hại sự sống, không lấy của không được cho, và giữ gìn sự chung thuỷ.'],
        list: ['Không sát sinh', 'Không trộm cắp', 'Không tà dâm'],
      },
      {
        heading: 'Bốn điều thiện của lời nói',
        paragraphs: ['Lời nói tưởng nhẹ nhưng có thể xây dựng hoặc phá vỡ một mối quan hệ, một gia đình.'],
        list: [
          'Không nói dối — nói lời chân thật.',
          'Không nói hai lưỡi — không đâm thọc, gây chia rẽ.',
          'Không nói lời độc ác — không chửi mắng, mỉa mai, làm tổn thương.',
          'Không nói thêu dệt — không nói lời phù phiếm, thêu dệt vô ích.',
        ],
      },
      {
        heading: 'Ba điều thiện của ý',
        paragraphs: ['Ý là gốc của mọi lời nói và việc làm, nên chăm sóc ý là chăm sóc tận gốc.'],
        list: [
          'Không tham lam — biết đủ, biết chia sẻ.',
          'Không sân hận — nuôi dưỡng lòng bao dung, nhẫn nại.',
          'Không si mê — sáng suốt, hiểu đúng về nhân quả.',
        ],
      },
      {
        heading: 'Thực tập mỗi ngày',
        paragraphs: [
          'Cuối ngày, có thể dành vài phút nhìn lại: hôm nay mình đã giữ được những điều nào, lỡ phạm điều nào. Không phán xét nặng nề, chỉ nhận diện và nguyện làm tốt hơn vào ngày mai. Nhật ký thiện hạnh trong ứng dụng có thể giúp bạn làm việc này.',
        ],
      },
    ],
    keyPoints: [
      'Mười điều thiện chia theo 3 thân — 4 khẩu — 3 ý.',
      'Bốn điều thiện của lời: không nói dối, không nói hai lưỡi, không nói lời độc ác, không nói thêu dệt.',
      'Ba điều thiện của ý: không tham, không sân, không si.',
      'Ý là gốc — chăm sóc ý là chăm sóc tận gốc mọi hành vi.',
    ],
    quiz: [
      {
        q: 'Mười điều thiện được chia theo ba cửa như thế nào?',
        options: ['5 thân, 3 khẩu, 2 ý', '3 thân, 4 khẩu, 3 ý', '4 thân, 3 khẩu, 3 ý', '2 thân, 4 khẩu, 4 ý'],
        answer: 1,
        explain: 'Ba điều thuộc thân, bốn điều thuộc lời nói và ba điều thuộc ý.',
      },
      {
        q: '“Nói hai lưỡi” có nghĩa là gì?',
        options: ['Nói được hai thứ tiếng', 'Nói quá nhanh', 'Đâm thọc, nói lời gây chia rẽ', 'Nói đùa vui vẻ'],
        answer: 2,
        explain: 'Nói hai lưỡi là đến chỗ này nói xấu chỗ kia, gây mất đoàn kết, chia rẽ.',
      },
      {
        q: 'Điều nào sau đây thuộc nhóm thiện nghiệp của ý?',
        options: ['Không sân hận', 'Không trộm cắp', 'Không nói dối', 'Không tà dâm'],
        answer: 0,
        explain: 'Ba điều thiện của ý là không tham, không sân, không si.',
      },
      {
        q: '“Không nói thêu dệt” là tránh loại lời nói nào?',
        options: ['Lời khen ngợi chân thành', 'Lời góp ý thẳng thắn', 'Lời kể chuyện cho con cháu', 'Lời phù phiếm, thêu dệt vô ích'],
        answer: 3,
        explain: 'Nói thêu dệt (ỷ ngữ) là lời trau chuốt nhưng vô ích, có thể khơi dậy tham dục hay hiểu lầm.',
      },
      {
        q: 'Việc nào thuộc thiện nghiệp của thân?',
        options: ['Không nói lời độc ác', 'Không trộm cắp', 'Không tham lam', 'Không si mê'],
        answer: 1,
        explain: 'Ba điều thiện của thân: không sát sinh, không trộm cắp, không tà dâm.',
      },
    ],
  },
  {
    id: 'tu-dieu-de',
    title: 'Tứ Diệu Đế',
    subtitle: 'Bốn sự thật cao quý về khổ và con đường thoát khổ',
    level: 'can-ban',
    minutes: 8,
    icon: 'Lightbulb',
    sections: [
      {
        heading: 'Giáo lý nền tảng',
        paragraphs: [
          'Tứ Diệu Đế (hay Tứ Thánh Đế) là bài pháp đầu tiên Đức Phật giảng sau khi thành đạo, và là nền tảng của mọi truyền thống Phật giáo. “Đế” nghĩa là sự thật.',
          'Có thể hình dung như cách một thầy thuốc chữa bệnh: nhận ra bệnh, tìm nguyên nhân gây bệnh, biết rằng bệnh có thể khỏi, và đưa ra phương thuốc.',
        ],
      },
      {
        heading: '1. Khổ đế — sự thật về khổ',
        paragraphs: [
          'Cuộc sống có những điều không như ý. Đức Phật không bi quan; Ngài chỉ nhìn thẳng vào sự thật để có thể vượt qua nó. Kinh điển thường nói đến tám nỗi khổ:',
        ],
        list: [
          'Sinh, già, bệnh, chết',
          'Thương yêu mà phải xa lìa (ái biệt ly)',
          'Oán ghét mà phải gặp gỡ (oán tắng hội)',
          'Mong cầu mà không được (cầu bất đắc)',
          'Năm uẩn — thân và tâm — luôn biến động, không thể nắm giữ (ngũ ấm xí thịnh)',
        ],
      },
      {
        heading: '2. Tập đế — nguyên nhân của khổ',
        paragraphs: [
          'Khổ không tự nhiên mà có. Nguyên nhân sâu xa là lòng tham ái, khát khao bám víu, cùng với vô minh — không thấy rõ bản chất vô thường của mọi sự. Ta khổ không phải vì mọi thứ thay đổi, mà vì ta muốn chúng đừng thay đổi.',
        ],
      },
      {
        heading: '3. Diệt đế — khổ có thể chấm dứt',
        paragraphs: [
          'Đây là tin vui của đạo Phật: khổ đau có thể chấm dứt. Khi tham ái và vô minh được dập tắt, tâm đạt đến trạng thái an lạc, tự do gọi là Niết-bàn. Niết-bàn không phải là một cõi xa xôi, mà là sự vắng mặt của phiền não ngay trong tâm.',
        ],
      },
      {
        heading: '4. Đạo đế — con đường thoát khổ',
        paragraphs: [
          'Con đường dẫn đến chấm dứt khổ đau chính là Bát Chánh Đạo — tám yếu tố chân chánh mà ta sẽ tìm hiểu trong bài tiếp theo.',
        ],
      },
    ],
    keyPoints: [
      'Bốn sự thật: Khổ — Tập — Diệt — Đạo.',
      'Như thầy thuốc: biết bệnh, biết nguyên nhân, biết bệnh khỏi được, có phương thuốc.',
      'Nguyên nhân của khổ là tham ái và vô minh.',
      'Con đường thoát khổ là Bát Chánh Đạo.',
    ],
    quiz: [
      {
        q: 'Tứ Diệu Đế gồm bốn sự thật nào?',
        options: ['Khổ, Tập, Diệt, Đạo', 'Sinh, Lão, Bệnh, Tử', 'Từ, Bi, Hỷ, Xả', 'Thân, Thọ, Tâm, Pháp'],
        answer: 0,
        explain: 'Khổ đế, Tập đế, Diệt đế, Đạo đế — bài pháp đầu tiên của Đức Phật.',
      },
      {
        q: 'Tập đế nói về điều gì?',
        options: ['Cách tập thể dục', 'Nguyên nhân của khổ', 'Sự chấm dứt khổ', 'Các nghi lễ cần tập'],
        answer: 1,
        explain: '“Tập” là nguyên nhân tích tụ: tham ái và vô minh là gốc rễ của khổ đau.',
      },
      {
        q: 'Diệt đế chỉ điều gì?',
        options: ['Tiêu diệt kẻ thù', 'Diệt trừ côn trùng', 'Sự chấm dứt khổ đau — Niết-bàn', 'Sự chết'],
        answer: 2,
        explain: 'Diệt đế là sự thật rằng khổ có thể chấm dứt khi tham ái và vô minh được dập tắt.',
      },
      {
        q: 'Đạo đế chính là con đường nào?',
        options: ['Lục độ Ba-la-mật', 'Con đường hành hương', 'Mười hai nhân duyên', 'Bát Chánh Đạo'],
        answer: 3,
        explain: 'Con đường thoát khổ trong Tứ Diệu Đế chính là Bát Chánh Đạo.',
      },
      {
        q: '“Cầu bất đắc khổ” là nỗi khổ nào?',
        options: ['Mong cầu mà không được', 'Thương yêu phải xa lìa', 'Oán ghét phải gặp nhau', 'Già yếu bệnh tật'],
        answer: 0,
        explain: 'Cầu bất đắc là nỗi khổ khi điều mình mong muốn không thành.',
      },
    ],
  },
  {
    id: 'bat-chanh-dao',
    title: 'Bát Chánh Đạo',
    subtitle: 'Tám nẻo đường chân chánh dẫn đến an lạc',
    level: 'can-ban',
    minutes: 8,
    icon: 'Route',
    sections: [
      {
        heading: 'Con đường Trung đạo',
        paragraphs: [
          'Bát Chánh Đạo là Đạo đế trong Tứ Diệu Đế — con đường thực hành cụ thể để chấm dứt khổ đau. Tám yếu tố này không phải tám bước làm lần lượt, mà như tám sợi chỉ cùng dệt nên một tấm vải: chúng nâng đỡ lẫn nhau.',
          'Truyền thống thường xếp tám chi phần vào ba nhóm của Tam vô lậu học: Tuệ, Giới và Định.',
        ],
      },
      {
        heading: 'Nhóm Tuệ — thấy đúng, nghĩ đúng',
        paragraphs: [],
        list: [
          'Chánh kiến — hiểu biết đúng đắn về nhân quả, về khổ và con đường thoát khổ.',
          'Chánh tư duy — suy nghĩ hướng về buông xả, thương yêu, không làm hại.',
        ],
      },
      {
        heading: 'Nhóm Giới — sống đúng',
        paragraphs: [],
        list: [
          'Chánh ngữ — lời nói chân thật, hoà nhã, có lợi ích.',
          'Chánh nghiệp — hành động không làm hại mình và người.',
          'Chánh mạng — nuôi sống bản thân bằng nghề nghiệp chân chánh.',
        ],
      },
      {
        heading: 'Nhóm Định — tu tâm đúng',
        paragraphs: [],
        list: [
          'Chánh tinh tấn — siêng năng ngăn điều ác chưa sinh, dứt điều ác đã sinh, làm điều thiện chưa có, tăng trưởng điều thiện đã có (Tứ chánh cần).',
          'Chánh niệm — biết rõ những gì đang diễn ra nơi thân và tâm trong giây phút hiện tại.',
          'Chánh định — tâm an trú vững vàng, chuyên nhất, không tán loạn.',
        ],
      },
      {
        heading: 'Chánh mạng trong đời sống hôm nay',
        paragraphs: [
          'Trong kinh, Đức Phật khuyên người cư sĩ tránh năm nghề buôn bán: buôn bán vũ khí, buôn bán người, buôn bán sinh vật để giết thịt, buôn bán rượu và chất gây say, buôn bán thuốc độc.',
          'Ngày nay, tinh thần ấy có thể mở rộng: làm ăn trung thực, không lừa dối khách hàng, không kiếm tiền bằng cách gây hại cho sức khoẻ, môi trường hay hạnh phúc của người khác.',
        ],
      },
    ],
    keyPoints: [
      'Tám chi phần: Chánh kiến, Chánh tư duy, Chánh ngữ, Chánh nghiệp, Chánh mạng, Chánh tinh tấn, Chánh niệm, Chánh định.',
      'Ba nhóm: Tuệ (kiến, tư duy) — Giới (ngữ, nghiệp, mạng) — Định (tinh tấn, niệm, định).',
      'Tám yếu tố nâng đỡ lẫn nhau, không phải tám bước rời rạc.',
      'Chánh mạng: kiếm sống chân chánh, không gây hại.',
    ],
    quiz: [
      {
        q: 'Bát Chánh Đạo có bao nhiêu chi phần?',
        options: ['Bốn', 'Sáu', 'Tám', 'Mười'],
        answer: 2,
        explain: '“Bát” nghĩa là tám: tám yếu tố chân chánh của con đường thoát khổ.',
      },
      {
        q: 'Chánh mạng nghĩa là gì?',
        options: ['Sống thật lâu', 'Nuôi sống bản thân bằng nghề nghiệp chân chánh', 'Tin vào số mệnh', 'Giữ gìn mạng sống bằng mọi giá'],
        answer: 1,
        explain: 'Chánh mạng là kiếm sống ngay thẳng, không gây hại cho người và vật.',
      },
      {
        q: 'Nhóm Giới trong Bát Chánh Đạo gồm những chi phần nào?',
        options: ['Chánh kiến, Chánh tư duy', 'Chánh tinh tấn, Chánh niệm, Chánh định', 'Chánh kiến, Chánh định', 'Chánh ngữ, Chánh nghiệp, Chánh mạng'],
        answer: 3,
        explain: 'Lời nói, hành động và cách kiếm sống chân chánh thuộc về Giới.',
      },
      {
        q: 'Tứ chánh cần (bốn sự siêng năng chân chánh) thuộc chi phần nào?',
        options: ['Chánh tinh tấn', 'Chánh ngữ', 'Chánh kiến', 'Chánh mạng'],
        answer: 0,
        explain: 'Ngăn ác chưa sinh, dứt ác đã sinh, làm thiện chưa có, tăng trưởng thiện đã có — đó là Chánh tinh tấn.',
      },
      {
        q: 'Chánh niệm là gì?',
        options: ['Nhớ thật nhiều kinh điển', 'Niệm Phật thật to', 'Biết rõ những gì đang diễn ra nơi thân tâm trong hiện tại', 'Suy nghĩ về tương lai'],
        answer: 2,
        explain: 'Chánh niệm là sự tỉnh thức, có mặt trọn vẹn với giây phút hiện tại.',
      },
    ],
  },

  /* ---------------- NÂNG CAO ---------------- */
  {
    id: 'tu-vo-luong-tam',
    title: 'Bốn tâm vô lượng',
    subtitle: 'Từ, Bi, Hỷ, Xả — trái tim rộng mở không biên giới',
    level: 'nang-cao',
    minutes: 7,
    icon: 'Heart',
    sections: [
      {
        heading: 'Vì sao gọi là “vô lượng”?',
        paragraphs: [
          'Bốn tâm vô lượng (Tứ vô lượng tâm), còn gọi là bốn Phạm trú, là bốn phẩm chất của trái tim được nuôi lớn đến mức không còn giới hạn — trải rộng đến mọi người, mọi loài, không phân biệt thân sơ.',
        ],
      },
      {
        heading: 'Bốn tâm',
        paragraphs: [],
        list: [
          'Từ — mong muốn đem niềm vui, sự an lành đến cho người khác.',
          'Bi — mong muốn làm vơi bớt khổ đau của người khác.',
          'Hỷ — vui mừng trước hạnh phúc, thành công của người khác, không ganh tị.',
          'Xả — tâm bình đẳng, buông bỏ thiên vị, không bám víu cũng không ghét bỏ.',
        ],
      },
      {
        heading: 'Những “kẻ thù” dễ nhầm lẫn',
        paragraphs: [
          'Các bản luận giải xưa chỉ ra rằng mỗi tâm có một “kẻ thù gần” — trông giống nhưng không phải — và một “kẻ thù xa” — trái ngược hoàn toàn. Nhận ra chúng giúp ta thực tập đúng:',
        ],
        list: [
          'Từ: dễ nhầm với sự luyến ái, bám víu; trái ngược với sân hận.',
          'Bi: dễ nhầm với sự buồn rầu, thương hại; trái ngược với sự tàn nhẫn.',
          'Hỷ: dễ nhầm với sự hưng phấn hời hợt; trái ngược với lòng ganh tị.',
          'Xả: dễ nhầm với sự thờ ơ, vô cảm; trái ngược với tham và sân.',
        ],
      },
      {
        heading: 'Thực tập quán từ bi',
        paragraphs: [
          'Một cách thực tập phổ biến là gửi những lời chúc lành theo thứ tự từ gần đến xa: trước hết cho chính mình, rồi đến người thân yêu, người không thân không ghét, người mình khó chịu, và cuối cùng là tất cả mọi loài.',
          'Có thể thầm nhủ: “Mong cho tôi được bình an. Mong cho tôi được an vui. Mong cho tôi thoát khỏi khổ đau.” — rồi thay “tôi” bằng người khác. Bắt đầu từ chính mình vì khó có thể trao đi điều mà mình chưa có.',
        ],
      },
    ],
    keyPoints: [
      'Từ: ban vui — Bi: cứu khổ — Hỷ: vui theo — Xả: bình đẳng.',
      'Xả không phải thờ ơ; Bi không phải thương hại.',
      'Kẻ thù xa của Hỷ là ganh tị; của Từ là sân hận.',
      'Quán từ bi bắt đầu từ chính mình rồi lan rộng ra mọi loài.',
    ],
    quiz: [
      {
        q: 'Tâm “Hỷ” là gì?',
        options: ['Vui khi được khen', 'Vui với niềm vui, thành công của người khác', 'Cười thật nhiều', 'Vui vì tránh được khổ'],
        answer: 1,
        explain: 'Hỷ là niềm vui chân thành trước hạnh phúc của người khác — liều thuốc cho lòng ganh tị.',
      },
      {
        q: 'Tâm “Bi” là gì?',
        options: ['Mong làm vơi bớt khổ đau của người khác', 'Buồn bã, bi quan', 'Thương hại người kém may mắn', 'Khóc khi thấy người khổ'],
        answer: 0,
        explain: 'Bi là lòng muốn giúp người bớt khổ — chủ động, ấm áp, khác với buồn rầu hay thương hại.',
      },
      {
        q: 'Tâm “Xả” khác với sự thờ ơ ở điểm nào?',
        options: ['Không khác gì cả', 'Xả là không quan tâm ai', 'Xả là tâm bình đẳng, không thiên vị, nhưng vẫn quan tâm', 'Xả là bỏ đi mọi trách nhiệm'],
        answer: 2,
        explain: 'Thờ ơ là “kẻ thù gần” của Xả. Xả thật sự là tâm quân bình, không bám víu cũng không ghét bỏ.',
      },
      {
        q: 'Khi thực tập quán từ bi, ta thường bắt đầu gửi lời chúc lành đến ai?',
        options: ['Người mình ghét nhất', 'Người nổi tiếng', 'Tất cả chúng sinh cùng lúc', 'Chính mình'],
        answer: 3,
        explain: 'Bắt đầu từ chính mình, rồi đến người thân, người trung tính, người khó chịu và mọi loài.',
      },
      {
        q: '“Kẻ thù xa” — điều trái ngược hoàn toàn — với tâm Hỷ là gì?',
        options: ['Lòng ganh tị', 'Sự lười biếng', 'Sự sợ hãi', 'Sự im lặng'],
        answer: 0,
        explain: 'Ganh tị khiến ta khó chịu trước hạnh phúc của người khác — ngược hẳn với tâm Hỷ.',
      },
    ],
  },
  {
    id: 'luc-do',
    title: 'Sáu Ba-la-mật',
    subtitle: 'Lục độ — sáu hạnh đưa người qua bờ giác',
    level: 'nang-cao',
    minutes: 8,
    icon: 'HandHeart',
    sections: [
      {
        heading: 'Ba-la-mật là gì?',
        paragraphs: [
          'Ba-la-mật (pāramitā) thường được giảng là “đến bờ bên kia” — từ bờ mê sang bờ giác. Trong Phật giáo Đại thừa, sáu Ba-la-mật (Lục độ) là sáu hạnh căn bản của Bồ-tát: tu tập để tự giác ngộ và giúp người khác cùng giác ngộ.',
        ],
      },
      {
        heading: 'Sáu hạnh',
        paragraphs: [],
        list: [
          'Bố thí — cho đi, chia sẻ.',
          'Trì giới — giữ gìn đạo đức, không làm hại.',
          'Nhẫn nhục — kiên nhẫn, bao dung trước nghịch cảnh và lời chê trách.',
          'Tinh tấn — siêng năng, bền bỉ trên đường lành.',
          'Thiền định — tâm an tĩnh, chuyên nhất.',
          'Trí tuệ (Bát-nhã) — thấy rõ bản chất vô thường, vô ngã của mọi sự.',
        ],
      },
      {
        heading: 'Ba cách bố thí',
        paragraphs: ['Bố thí không chỉ là cho tiền của. Truyền thống nói đến ba loại bố thí:'],
        list: [
          'Tài thí — chia sẻ tiền bạc, vật chất, sức lực.',
          'Pháp thí — chia sẻ hiểu biết, lời khuyên lành, giáo pháp.',
          'Vô uý thí — đem lại sự an tâm, giúp người hết sợ hãi.',
        ],
      },
      {
        heading: 'Cho mà không vướng mắc',
        paragraphs: [
          'Bố thí trọn vẹn nhất là khi “ba ngôi đều không” (tam luân không tịch): không chấp vào người cho, người nhận và vật được cho. Cho mà không mong đáp lại, không kể công, không xem mình hơn người.',
          'Trí tuệ được xem là “con mắt” dẫn đường cho năm hạnh còn lại: bố thí có trí tuệ thì không thành ban ơn, nhẫn nhục có trí tuệ thì không thành cam chịu, tinh tấn có trí tuệ thì không thành cố chấp.',
        ],
      },
    ],
    keyPoints: [
      'Lục độ: Bố thí, Trì giới, Nhẫn nhục, Tinh tấn, Thiền định, Trí tuệ.',
      'Ba loại bố thí: tài thí, pháp thí, vô uý thí.',
      'Tam luân không tịch: cho mà không chấp người cho, người nhận, vật cho.',
      'Trí tuệ dẫn đường cho năm hạnh còn lại.',
    ],
    quiz: [
      {
        q: '“Ba-la-mật” thường được giảng là gì?',
        options: ['Đến bờ bên kia', 'Bí mật lớn', 'Ba điều quý', 'Lời cầu nguyện'],
        answer: 0,
        explain: 'Pāramitā: vượt qua bờ mê, đến bờ giác ngộ.',
      },
      {
        q: 'Ba loại bố thí gồm những gì?',
        options: ['Cho tiền, cho gạo, cho áo', 'Tài thí, pháp thí, vô uý thí', 'Bố thí sáng, trưa, tối', 'Cho người thân, người lạ, người ghét'],
        answer: 1,
        explain: 'Chia sẻ vật chất (tài thí), hiểu biết (pháp thí) và sự an tâm (vô uý thí).',
      },
      {
        q: '“Vô uý thí” là gì?',
        options: ['Cho mà không sợ mất', 'Bố thí cho người không sợ ai', 'Cho đi những thứ vô giá trị', 'Đem lại sự an tâm, giúp người hết sợ hãi'],
        answer: 3,
        explain: '“Vô uý” là không sợ hãi. An ủi, che chở, giúp người vượt qua lo âu đều là vô uý thí.',
      },
      {
        q: '“Tam luân không tịch” trong bố thí nghĩa là gì?',
        options: ['Bố thí ba lần mỗi ngày', 'Cho đi ba thứ cùng lúc', 'Không chấp vào người cho, người nhận và vật được cho', 'Không bố thí cho ba hạng người'],
        answer: 2,
        explain: 'Cho mà không mong đáp lại, không kể công — đó là bố thí trọn vẹn.',
      },
      {
        q: 'Ba-la-mật thứ sáu, dẫn đường cho năm hạnh còn lại, là gì?',
        options: ['Nhẫn nhục', 'Tinh tấn', 'Thiền định', 'Trí tuệ (Bát-nhã)'],
        answer: 3,
        explain: 'Trí tuệ Bát-nhã như con mắt soi đường để các hạnh khác không đi lệch.',
      },
    ],
  },
  {
    id: 'phap-mon-viet-nam',
    title: 'Tịnh Độ và Thiền tại Việt Nam',
    subtitle: 'Các pháp môn và truyền thống tu tập quen thuộc',
    level: 'nang-cao',
    minutes: 9,
    icon: 'Mountain',
    sections: [
      {
        heading: 'Nhiều pháp môn, một mục đích',
        paragraphs: [
          'Người xưa ví giáo pháp như nhiều cánh cửa cùng dẫn vào một ngôi nhà. Mỗi người có căn cơ, hoàn cảnh khác nhau nên chọn cách tu khác nhau, nhưng đích đến chung là sự an lạc và giác ngộ.',
          'Phật giáo Việt Nam có sự hoà quyện giữa nhiều truyền thống, và nhiều chùa thực hành “Thiền Tịnh song tu” — vừa niệm Phật vừa tọa thiền. Giáo hội Phật giáo Việt Nam (thành lập năm 1981) quy tụ nhiều hệ phái cùng sinh hoạt hoà hợp.',
        ],
      },
      {
        heading: 'Tịnh Độ tông',
        paragraphs: [
          'Pháp môn Tịnh Độ lấy việc niệm danh hiệu Đức Phật A Di Đà làm chính, nguyện vãng sinh về cõi Tịnh độ Cực Lạc. Ba điều cốt yếu (ba tư lương) là Tín — Nguyện — Hạnh: tin sâu, nguyện thiết, và thực hành niệm Phật đều đặn.',
          'Các bộ kinh căn bản thường được gọi chung là Tịnh độ tam kinh: kinh A Di Đà, kinh Vô Lượng Thọ và kinh Quán Vô Lượng Thọ. Vì giản dị, dễ thực hành, pháp môn này rất phổ biến trong đời sống Phật tử Việt Nam.',
        ],
      },
      {
        heading: 'Thiền phái Trúc Lâm Yên Tử',
        paragraphs: [
          'Thiền phái Trúc Lâm do vua Trần Nhân Tông sáng lập sau khi Ngài nhường ngôi, xuất gia tu hành trên núi Yên Tử (Quảng Ninh). Ba vị Tổ đầu tiên là Trần Nhân Tông, Pháp Loa và Huyền Quang — gọi là Trúc Lâm Tam Tổ.',
          'Trúc Lâm được xem là thiền phái mang đậm bản sắc Việt. Tinh thần “Cư trần lạc đạo” — sống giữa đời thường mà vẫn an vui với đạo — được thể hiện trong bài phú cùng tên của vua Trần Nhân Tông. Ngày nay, dòng thiền này được phục hưng với nhiều thiền viện trên cả nước.',
        ],
      },
      {
        heading: 'Thiền phái Lâm Tế và Tào Động',
        paragraphs: [
          'Lâm Tế và Tào Động là hai dòng thiền khởi nguồn từ Trung Hoa, truyền sang Việt Nam vào khoảng thế kỷ XVII. Dòng Lâm Tế phát triển rộng khắp, trong đó nhánh Lâm Tế Liễu Quán — do Thiền sư Liễu Quán, người Việt, khai mở — có ảnh hưởng sâu rộng, đặc biệt ở miền Trung. Dòng Tào Động hiện được duy trì ở một số chùa miền Bắc.',
          'Hai dòng thiền đều chú trọng tu tâm, quay về tự tánh; nhiều chùa thuộc các dòng này cũng kết hợp niệm Phật và tụng kinh trong thời khoá hằng ngày.',
        ],
      },
      {
        heading: 'Hệ phái Khất sĩ',
        paragraphs: [
          'Hệ phái Khất sĩ do Tổ sư Minh Đăng Quang khai sáng tại miền Nam vào giữa thế kỷ XX, với tôn chỉ “Nối truyền Thích-ca Chánh pháp”. Chư Tăng Ni Khất sĩ giữ nếp sống giản dị, đi khất thực, dung hợp tinh thần của cả Phật giáo Nam truyền và Bắc truyền. Các ngôi tịnh xá là nơi sinh hoạt đặc trưng của hệ phái.',
        ],
      },
      {
        heading: 'Thái độ đúng của người học Phật',
        paragraphs: [
          'Không có pháp môn nào “cao” hay “thấp” một cách tuyệt đối; pháp môn phù hợp là pháp môn giúp mình bớt khổ, sống thiện hơn. Người Phật tử nên tôn trọng mọi truyền thống, không chê bai pháp môn khác, và nên chọn một pháp môn để chuyên tâm theo sự hướng dẫn của thầy lành bạn tốt.',
        ],
      },
    ],
    keyPoints: [
      'Tịnh Độ: niệm danh hiệu A Di Đà với Tín — Nguyện — Hạnh.',
      'Trúc Lâm Yên Tử do vua Trần Nhân Tông sáng lập, mang tinh thần “Cư trần lạc đạo”.',
      'Lâm Tế, Tào Động truyền vào Việt Nam khoảng thế kỷ XVII; Khất sĩ do Tổ sư Minh Đăng Quang khai sáng.',
      'Tôn trọng mọi pháp môn, chọn pháp môn hợp căn cơ và chuyên tâm thực hành.',
    ],
    quiz: [
      {
        q: 'Thiền phái Trúc Lâm Yên Tử do ai sáng lập?',
        options: ['Thiền sư Liễu Quán', 'Vua Trần Nhân Tông', 'Lục Tổ Huệ Năng', 'Tổ sư Minh Đăng Quang'],
        answer: 1,
        explain: 'Vua Trần Nhân Tông sau khi xuất gia trên núi Yên Tử đã sáng lập thiền phái Trúc Lâm.',
      },
      {
        q: 'Ba tư lương cốt yếu của pháp môn Tịnh Độ là gì?',
        options: ['Giới, Định, Tuệ', 'Văn, Tư, Tu', 'Tín, Nguyện, Hạnh', 'Từ, Bi, Hỷ'],
        answer: 2,
        explain: 'Tin sâu, nguyện thiết và hành trì niệm Phật — ba điều như ba chân của một chiếc vạc.',
      },
      {
        q: 'Hệ phái Khất sĩ do ai khai sáng?',
        options: ['Tổ sư Minh Đăng Quang', 'Vua Trần Nhân Tông', 'Thiền sư Pháp Loa', 'Thiền sư Huyền Quang'],
        answer: 0,
        explain: 'Tổ sư Minh Đăng Quang khai sáng hệ phái Khất sĩ tại miền Nam với tôn chỉ “Nối truyền Thích-ca Chánh pháp”.',
      },
      {
        q: 'Tinh thần “Cư trần lạc đạo” có nghĩa là gì?',
        options: ['Phải lên núi mới tu được', 'Từ bỏ gia đình để tu', 'Chỉ tu khi về già', 'Sống giữa đời thường mà vẫn an vui với đạo'],
        answer: 3,
        explain: 'Đây là tinh thần nhập thế của Phật giáo đời Trần, thể hiện qua bài phú của vua Trần Nhân Tông.',
      },
      {
        q: 'Thái độ đúng của người học Phật đối với các pháp môn khác là gì?',
        options: ['Chỉ pháp môn của mình là đúng', 'Tôn trọng, chọn pháp môn hợp căn cơ và chuyên tâm', 'Thử mỗi ngày một pháp môn', 'Tránh xa các chùa khác truyền thống'],
        answer: 1,
        explain: 'Các pháp môn như nhiều cánh cửa cùng vào một ngôi nhà — tôn trọng lẫn nhau và chuyên tâm thực hành.',
      },
      {
        q: 'Bộ ba kinh căn bản của Tịnh Độ tông gồm những kinh nào?',
        options: ['Kinh A Di Đà, Vô Lượng Thọ, Quán Vô Lượng Thọ', 'Kinh Pháp Hoa, Hoa Nghiêm, Lăng Nghiêm', 'Kinh Kim Cang, Bát-nhã, Duy Ma', 'Kinh Pháp Cú, Từ Bi, Hạnh Phúc'],
        answer: 0,
        explain: 'Tịnh độ tam kinh: A Di Đà, Vô Lượng Thọ và Quán Vô Lượng Thọ.',
      },
    ],
  },
]

/** Tra cứu nhanh theo id. */
export function getLesson(id) {
  return LESSONS.find((l) => l.id === id) ?? null
}

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id) ?? null
}
