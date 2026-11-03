/**
 * Thư viện kinh — HỢP ĐỒNG API (các trang khác có thể dùng, giữ nguyên tên export):
 *   SUTRAS: [{ id, title, subtitle, category: 'kinh'|'chu'|'ke'|'nghi-thuc', tradition?, minutes,
 *              description, sections: [{ heading?, note?, lines?: string[], ref?: sutraId }],
 *              meaning?: string[], notes?: string[] }]
 *   SUTRA_CATEGORIES: [{ id, label, short }]
 *   getSutra(id) => sutra | undefined
 *
 * Nguyên tắc nội dung:
 * - Kinh văn, chú, kệ truyền thống: giữ nguyên phiên âm Hán-Việt phổ biến trong thời khoá tụng tại Việt Nam.
 * - Phần nghĩa ("Lược giải") do ứng dụng tự diễn đạt bằng lời văn hiện đại, không chép bản dịch của tác giả nào.
 * - `ref` trong một section: dẫn chiếu tới bài khác (trình đọc sẽ chèn nội dung bài đó vào chỗ này),
 *   giúp nghi thức không phải lặp lại kinh văn và chỉ cần sửa một nơi.
 * - Ký hiệu "(3 lần)" ở cuối dòng: dòng đó tụng lặp lại — chế độ "Tụng theo" tự nhân thời gian.
 */

export const SUTRA_CATEGORIES = [
  { id: 'kinh', label: 'Kinh', short: 'Kinh' },
  { id: 'chu', label: 'Thần chú', short: 'Chú' },
  { id: 'ke', label: 'Kệ & tán', short: 'Kệ' },
  { id: 'nghi-thuc', label: 'Nghi thức', short: 'Nghi thức' },
]

export const SUTRAS = [
  {
    id: 'bat-nha-tam-kinh',
    title: 'Bát Nhã Tâm Kinh',
    subtitle: 'Ma Ha Bát Nhã Ba La Mật Đa Tâm Kinh',
    category: 'kinh',
    tradition: 'Đại thừa · Hán dịch: ngài Huyền Trang',
    minutes: 4,
    description:
      'Bài kinh ngắn mà cô đọng tinh tuý trí tuệ Bát Nhã: thấy rõ thân tâm do duyên hợp, buông bớt chấp giữ để tâm không còn sợ hãi.',
    sections: [
      {
        heading: 'Ma Ha Bát Nhã Ba La Mật Đa Tâm Kinh',
        lines: [
          'Quán Tự Tại Bồ Tát hành thâm Bát Nhã Ba La Mật Đa thời,',
          'chiếu kiến ngũ uẩn giai không, độ nhất thiết khổ ách.',
          'Xá Lợi Tử! Sắc bất dị không, không bất dị sắc,',
          'sắc tức thị không, không tức thị sắc,',
          'thọ, tưởng, hành, thức diệc phục như thị.',
          'Xá Lợi Tử! Thị chư pháp không tướng,',
          'bất sanh bất diệt, bất cấu bất tịnh, bất tăng bất giảm.',
          'Thị cố không trung vô sắc, vô thọ, tưởng, hành, thức,',
          'vô nhãn, nhĩ, tỷ, thiệt, thân, ý,',
          'vô sắc, thanh, hương, vị, xúc, pháp,',
          'vô nhãn giới, nãi chí vô ý thức giới,',
          'vô vô minh, diệc vô vô minh tận,',
          'nãi chí vô lão tử, diệc vô lão tử tận,',
          'vô khổ, tập, diệt, đạo, vô trí diệc vô đắc.',
          'Dĩ vô sở đắc cố, Bồ Đề Tát Đỏa y Bát Nhã Ba La Mật Đa cố,',
          'tâm vô quái ngại, vô quái ngại cố, vô hữu khủng bố,',
          'viễn ly điên đảo mộng tưởng, cứu cánh Niết Bàn.',
          'Tam thế chư Phật y Bát Nhã Ba La Mật Đa cố,',
          'đắc A Nậu Đa La Tam Miệu Tam Bồ Đề.',
          'Cố tri Bát Nhã Ba La Mật Đa, thị đại thần chú, thị đại minh chú,',
          'thị vô thượng chú, thị vô đẳng đẳng chú,',
          'năng trừ nhất thiết khổ, chân thật bất hư.',
          'Cố thuyết Bát Nhã Ba La Mật Đa chú, tức thuyết chú viết:',
          'Yết đế, yết đế, ba la yết đế, ba la tăng yết đế, Bồ đề tát bà ha. (3 lần)',
        ],
      },
    ],
    meaning: [
      'Bồ Tát Quán Tự Tại, khi thực hành sâu xa trí tuệ Bát Nhã, soi thấy năm uẩn — sắc (thân thể, vật chất), thọ (cảm giác), tưởng (tri giác), hành (các tâm hành) và thức (nhận biết) — đều không có tự tánh riêng biệt, nhờ vậy vượt qua mọi khổ ách.',
      'Ngài nói với Xá Lợi Phất: hình sắc không khác tánh không, tánh không không khác hình sắc. "Không" ở đây không phải là hư vô, mà là mọi sự vật đều do nhiều duyên hợp thành, không có một cái "tự thân" cố định, tách rời. Cảm giác, tri giác, tâm hành và nhận thức cũng đều như vậy.',
      'Nhìn bằng con mắt ấy, các pháp vốn không thật sự sinh ra hay mất đi, không dơ cũng không sạch, không thêm cũng không bớt. Những cặp đối đãi này là cách tâm phân biệt dán nhãn lên thực tại.',
      'Vì thế trong tánh không, năm uẩn, sáu căn, sáu trần, mười tám giới không còn là những thực thể cố định; chuỗi duyên khởi từ vô minh đến già chết, cùng sự chấm dứt của chúng, Bốn Sự Thật (khổ, tập, diệt, đạo), cho tới trí tuệ và sự chứng đắc — tất cả đều không bị nắm giữ như một vật sở hữu.',
      'Vì không còn gì để nắm bắt, người tu nương trí tuệ Bát Nhã nên tâm không vướng mắc; không vướng mắc nên không sợ hãi, xa lìa những cái thấy điên đảo như mộng, đạt tới Niết Bàn rốt ráo. Chư Phật trong ba đời cũng nương trí tuệ này mà thành tựu giác ngộ trọn vẹn (A Nậu Đa La Tam Miệu Tam Bồ Đề).',
      'Câu chú cuối thường được giữ nguyên âm khi tụng. Ý nghĩa thường được giảng là: "Đi qua, đi qua, đi qua bờ bên kia, tất cả cùng qua bờ bên kia — giác ngộ, thành tựu."',
    ],
    notes: [
      'Đây là bản Hán dịch của ngài Huyền Trang (đời Đường), phiên âm Hán-Việt phổ biến trong thời khoá tụng tại các chùa Bắc tông ở Việt Nam.',
      'Một số bản in có khác biệt nhỏ về chữ (vd. "Đỏa"/"Đõa", "sanh"/"sinh") — đều cùng một bản kinh.',
    ],
  },
  {
    id: 'kinh-tu-bi',
    title: 'Kinh Từ Bi',
    subtitle: 'Metta Sutta — bản lược giải tiếng Việt',
    category: 'kinh',
    tradition: 'Nam truyền · Kinh Tập (Sutta Nipāta)',
    minutes: 4,
    description:
      'Lời dạy nuôi lớn tâm thương yêu không giới hạn đến mọi loài, như người mẹ che chở đứa con duy nhất. Bản diễn ý bằng tiếng Việt hiện đại.',
    sections: [
      {
        heading: 'Nếp sống của người hướng thiện',
        note: 'Lược giải — văn bản do ứng dụng diễn ý theo tinh thần bài kinh, không phải bản dịch từng chữ.',
        lines: [
          'Người khéo hướng thiện, mong chạm tới bình an,',
          'hãy sống ngay thẳng, chân thật và có năng lực,',
          'nói lời mềm mỏng, lòng không kiêu căng,',
          'biết đủ, dễ nuôi, ít việc bận rộn, sống đơn giản,',
          'giữ các giác quan lắng dịu, cư xử có hiểu biết,',
          'không đeo bám, không cầu cạnh nơi các gia đình,',
          'và không làm một việc nhỏ nào khiến bậc hiền trí phải chê trách.',
        ],
      },
      {
        heading: 'Lời nguyện thương yêu',
        lines: [
          'Mong cho mọi loài được an vui, được yên ổn, được hạnh phúc.',
          'Hết thảy chúng sanh đang có mặt trên đời,',
          'dù yếu hay mạnh, dù lớn hay nhỏ, dù cao hay thấp,',
          'dù thấy được hay không thấy được, dù ở gần hay ở xa,',
          'đã sinh ra hay đang chờ sinh ra —',
          'mong tất cả đều được an lạc.',
        ],
      },
      {
        heading: 'Giữ lòng không làm hại',
        lines: [
          'Đừng ai lừa gạt ai, đừng ai khinh rẻ ai, ở bất cứ nơi đâu.',
          'Đừng vì giận dữ hay ác ý mà mong người khác gặp khổ đau.',
        ],
      },
      {
        heading: 'Tâm thương không bờ bến',
        lines: [
          'Như người mẹ liều cả mạng sống để che chở đứa con duy nhất,',
          'ta nuôi lớn tâm thương không giới hạn đến với mọi loài.',
          'Để lòng từ lan rộng khắp thế gian,',
          'phía trên, phía dưới và bốn phương chung quanh,',
          'không ngăn ngại, không hận thù, không oán kết.',
          'Khi đứng, khi đi, khi ngồi hay khi nằm,',
          'bao lâu còn tỉnh thức, hãy giữ vững niệm từ ấy —',
          'đó là cách sống cao thượng ngay trong đời này.',
        ],
      },
      {
        heading: 'Kết',
        lines: [
          'Không chấp vào tà kiến, giữ gìn giới hạnh, thấy biết rõ ràng,',
          'buông được lòng tham đắm các dục,',
          'người ấy không còn trở lại vòng thai sinh.',
        ],
      },
    ],
    meaning: [
      'Bài kinh gồm hai phần. Phần đầu nói về nếp sống làm nền cho lòng từ: ngay thẳng, khiêm hạ, biết đủ, giản dị, giữ giới. Lòng thương khó lớn lên trong một đời sống nhiều toan tính và bận rộn.',
      'Phần sau là lời nguyện mở rộng tâm từ đến mọi loài, không phân biệt mạnh yếu, gần xa, thấy hay không thấy. Hình ảnh người mẹ bảo vệ đứa con duy nhất cho thấy lòng từ không phải cảm xúc thoáng qua mà là sự tận tâm.',
      'Lòng từ được thực tập trong mọi tư thế — đi, đứng, nằm, ngồi — chứ không chỉ khi ngồi tụng. Đọc xong bài kinh, có thể thử gửi lời mong an lành đến một người đang khiến mình khó chịu: đó là chỗ bài kinh trở thành thật.',
    ],
    notes: [
      'Văn bản ở đây là bản LƯỢC GIẢI (diễn ý) do ứng dụng biên soạn bằng tiếng Việt hiện đại, giữ đúng các ý chính của bài kinh; không thay thế các bản dịch chính thức.',
    ],
  },
  {
    id: 'tu-vo-luong-tam',
    title: 'Quán Tứ Vô Lượng Tâm',
    subtitle: 'Từ · Bi · Hỷ · Xả — bài quán chiếu ngắn',
    category: 'kinh',
    tradition: 'Bài thực tập do ứng dụng biên soạn',
    minutes: 3,
    description:
      'Bốn tâm rộng lớn Đức Phật thường khuyên vun bồi. Bài quán đi từ bản thân, đến người thân, người xa lạ, người khó thương và mọi loài.',
    sections: [
      {
        heading: 'Từ — mong cho an vui',
        note: 'Ngồi yên, thở chậm vài hơi. Đọc chậm từng dòng và để ý nghĩa thấm vào lòng.',
        lines: [
          'Mong rằng tôi được an ổn, thân khoẻ, tâm yên.',
          'Mong rằng những người tôi thương được an ổn.',
          'Mong rằng những người tôi chưa quen biết được an ổn.',
          'Mong rằng cả người đang làm tôi buồn lòng cũng được an ổn.',
          'Mong rằng hết thảy mọi loài được an ổn.',
        ],
      },
      {
        heading: 'Bi — mong cho bớt khổ',
        lines: [
          'Mong cho ai đang đau ốm được vơi bớt đau đớn.',
          'Mong cho ai đang lo sợ tìm được chỗ nương tựa.',
          'Mong cho ai đang lầm lạc nhận ra lối về.',
        ],
      },
      {
        heading: 'Hỷ — vui với niềm vui của người',
        lines: [
          'Thấy người khác thành công, tôi biết vui theo, không ganh tị.',
          'Mong niềm vui chính đáng của mọi người được bền lâu.',
        ],
      },
      {
        heading: 'Xả — tâm bình đẳng, buông nhẹ',
        lines: [
          'Tôi nhìn mọi người bằng tâm bình đẳng, không thiên vị.',
          'Điều đã qua, tôi xin buông nhẹ, không ôm giữ oán hờn.',
        ],
      },
    ],
    meaning: [
      'Từ (mettā) là mong cho người khác được an vui. Bi (karuṇā) là mong cho người khác bớt khổ và sẵn lòng giúp đỡ. Hỷ (muditā) là vui theo hạnh phúc, thành công của người khác. Xả (upekkhā) là tâm bình đẳng, không thiên vị, không bám víu.',
      'Gọi là "vô lượng" vì bốn tâm này được mở rộng đến mọi loài, không giới hạn bởi thân sơ hay thương ghét. Cách thực tập truyền thống thường bắt đầu từ chính mình, rồi đến người thân, người dưng, người khó thương và sau cùng là tất cả.',
      'Bốn tâm nâng đỡ lẫn nhau: từ bi thiếu xả dễ thành lo âu, dính mắc; xả thiếu từ bi dễ thành lạnh lùng. Thực tập đều đặn giúp lòng mềm lại và vững hơn.',
    ],
    notes: ['Các câu quán là lời văn do ứng dụng biên soạn theo tinh thần Tứ Vô Lượng Tâm; bạn có thể đổi thành lời của chính mình.'],
  },
  {
    id: 'chu-vang-sanh',
    title: 'Chú Vãng Sanh',
    subtitle: 'Bạt Nhất Thiết Nghiệp Chướng Căn Bản Đắc Sanh Tịnh Độ Đà La Ni',
    category: 'chu',
    tradition: 'Tịnh độ tông',
    minutes: 2,
    description:
      'Thần chú quen thuộc trong thời khoá Tịnh độ, thường tụng sau Tâm Kinh và trong các buổi cầu siêu, tưởng nhớ người đã khuất.',
    sections: [
      {
        heading: 'Vãng Sanh Quyết Định Chân Ngôn',
        note: 'Thường tụng 3 lần. Giữ nguyên âm, tụng đều, rõ chữ.',
        lines: [
          'Nam mô A di đa bà dạ,',
          'Đa tha già đa dạ,',
          'Đa điệt dạ tha,',
          'A di rị đô bà tỳ,',
          'A di rị đa, tất đam bà tỳ,',
          'A di rị đa, tỳ ca lan đế,',
          'A di rị đa, tỳ ca lan đa,',
          'Già di nị, già già na,',
          'Chỉ đa ca lệ, ta bà ha.',
        ],
      },
    ],
    meaning: [
      'Thần chú (đà la ni) theo truyền thống được giữ nguyên âm và không dịch nghĩa từng chữ. Điều quan trọng là tâm khi tụng: chuyên chú, thành kính, hướng về Tịnh độ của Đức Phật A Di Đà.',
      'Tên đầy đủ của chú có nghĩa là "Đà la ni nhổ tận gốc mọi nghiệp chướng, được sinh về Tịnh độ". Người tụng nương vào đó mà phát nguyện sửa mình, buông điều ác, làm điều lành.',
    ],
    notes: ['Phiên âm có thể khác nhau đôi chút giữa các bản (vd. "già"/"dà"); hãy tụng theo bản bạn quen.'],
  },
  {
    id: 'luc-tu-dai-minh',
    title: 'Lục Tự Đại Minh Chân Ngôn',
    subtitle: 'Án ma ni bát di hồng',
    category: 'chu',
    tradition: 'Gắn với hạnh nguyện Bồ Tát Quán Thế Âm',
    minutes: 1,
    description: 'Câu chân ngôn sáu chữ quen thuộc, gắn với lòng đại bi của Bồ Tát Quán Thế Âm. Ngắn gọn, dễ nhớ, có thể trì niệm bất cứ lúc nào.',
    sections: [
      {
        heading: 'Lục Tự Đại Minh Chân Ngôn',
        note: 'Trì niệm chậm rãi, mỗi câu một hơi thở.',
        lines: ['Án ma ni bát di hồng. (7 lần)'],
      },
    ],
    meaning: [
      'Chân ngôn sáu âm (tiếng Phạn: Oṃ maṇi padme hūṃ) thường được giữ nguyên âm khi trì tụng. Hai chữ giữa thường được giảng là "viên ngọc" và "hoa sen" — biểu tượng cho lòng từ bi và trí tuệ trong sáng, không nhiễm bùn nhơ.',
      'Trì niệm chân ngôn là dịp nhắc mình nuôi lòng từ bi như Bồ Tát Quán Thế Âm: biết lắng nghe và làm vơi nỗi khổ của người khác.',
    ],
  },
  {
    id: 'ke-khai-kinh',
    title: 'Kệ Khai Kinh',
    subtitle: 'Bài kệ mở đầu trước khi tụng kinh',
    category: 'ke',
    minutes: 1,
    description: 'Bốn câu kệ bày tỏ lòng trân quý khi được gặp giáo pháp, và nguyện hiểu đúng nghĩa chân thật của lời Phật dạy.',
    sections: [
      {
        lines: [
          'Nam mô Bổn Sư Thích Ca Mâu Ni Phật. (3 lần)',
          'Vô thượng thâm thâm vi diệu pháp,',
          'Bá thiên vạn kiếp nan tao ngộ,',
          'Ngã kim kiến văn đắc thọ trì,',
          'Nguyện giải Như Lai chân thật nghĩa.',
        ],
      },
    ],
    meaning: [
      'Giáo pháp cao tột, sâu xa và mầu nhiệm;',
      'trăm nghìn muôn kiếp thật khó được gặp.',
      'Nay con được thấy, được nghe, được thọ trì,',
      'nguyện hiểu thấu nghĩa chân thật của Như Lai. (Lược giải)',
    ],
  },
  {
    id: 'ke-tam-quy',
    title: 'Kệ Tam Quy',
    subtitle: 'Quy y Phật · Quy y Pháp · Quy y Tăng',
    category: 'ke',
    minutes: 2,
    description: 'Lời nương tựa Tam Bảo — nền tảng của người Phật tử. Gồm bài Tam quy ngắn và bài Tam tự quy thường đọc cuối thời khoá.',
    sections: [
      {
        heading: 'Tam quy',
        lines: [
          'Quy y Phật, quy y Pháp, quy y Tăng.',
          'Quy y Phật, lưỡng túc tôn.',
          'Quy y Pháp, ly dục tôn.',
          'Quy y Tăng, chúng trung tôn.',
        ],
      },
      {
        heading: 'Tam tự quy',
        note: 'Mỗi lời quy y, chắp tay lạy một lạy (hoặc xá một xá).',
        lines: [
          'Tự quy y Phật, đương nguyện chúng sanh,',
          'thể giải đại đạo, phát vô thượng tâm.',
          'Tự quy y Pháp, đương nguyện chúng sanh,',
          'thâm nhập kinh tạng, trí huệ như hải.',
          'Tự quy y Tăng, đương nguyện chúng sanh,',
          'thống lý đại chúng, nhất thiết vô ngại.',
        ],
      },
    ],
    meaning: [
      'Tam quy: Con nương tựa Phật — bậc tôn quý đầy đủ phước đức và trí tuệ ("lưỡng túc"). Con nương tựa Pháp — lời dạy giúp lìa xa tham dục. Con nương tựa Tăng — đoàn thể tu học hoà hợp, đáng kính trong mọi chúng.',
      'Tam tự quy: Tự mình quay về nương tựa Phật, nguyện cho chúng sanh hiểu rõ đạo lớn, phát tâm cầu giác ngộ cao tột. Tự mình quay về nương tựa Pháp, nguyện cho chúng sanh thấm sâu kinh điển, trí tuệ rộng như biển. Tự mình quay về nương tựa Tăng, nguyện cho chúng sanh biết dẫn dắt, hoà hợp đại chúng, mọi sự đều không ngăn ngại. (Lược giải)',
      'Chữ "tự" nhắc rằng quy y không phải trao mình cho ai, mà là chính mình chọn sống theo con đường tỉnh thức.',
    ],
  },
  {
    id: 'ke-sam-hoi',
    title: 'Kệ Sám Hối',
    subtitle: 'Nhìn lại lỗi lầm để làm mới chính mình',
    category: 'ke',
    minutes: 1,
    description: 'Bốn câu kệ thừa nhận những lỗi lầm do tham, sân, si gây ra qua thân, lời nói và ý nghĩ — và thành tâm làm mới.',
    sections: [
      {
        note: 'Thường tụng 3 lần, mỗi lần một lạy. Tụng chậm, thành thật nhìn lại mình.',
        lines: [
          'Vãng tích sở tạo chư ác nghiệp,',
          'Giai do vô thủy tham sân si,',
          'Tùng thân ngữ ý chi sở sanh,',
          'Nhất thiết ngã kim giai sám hối.',
        ],
      },
    ],
    meaning: [
      'Bao nhiêu nghiệp xấu con đã tạo từ trước,',
      'đều bởi tham lam, giận hờn, si mê từ thuở nào;',
      'phát sinh từ thân hành, lời nói và ý nghĩ —',
      'hôm nay con xin thành tâm sám hối tất cả. (Lược giải)',
      'Sám hối không phải tự dằn vặt, mà là thấy rõ lỗi, nhận trách nhiệm và nguyện không tái phạm. Sau khi tụng, có thể ghi một điều muốn sửa vào Nhật ký để lời sám hối thành hành động.',
    ],
  },
  {
    id: 'ke-hoi-huong',
    title: 'Kệ Hồi Hướng',
    subtitle: 'Hướng điều lành về cho tất cả',
    category: 'ke',
    minutes: 1,
    description: 'Bài kệ khép lại mỗi thời khoá: không giữ điều lành cho riêng mình, mà gửi đến tất cả chúng sanh.',
    sections: [
      {
        lines: ['Nguyện dĩ thử công đức,', 'Phổ cập ư nhất thiết,', 'Ngã đẳng dữ chúng sanh,', 'Giai cộng thành Phật đạo.'],
      },
    ],
    meaning: [
      'Nguyện đem những điều lành của thời tu này,',
      'trải rộng đến khắp tất cả;',
      'chúng con cùng với muôn loài,',
      'đều cùng thành tựu Phật đạo. (Lược giải)',
      'Hồi hướng giúp việc tu không dừng lại ở lợi ích riêng. Điều lành thật sự nằm ở tâm được mở rộng và cách mình sống với người chung quanh sau khi tụng xong.',
    ],
  },
  {
    id: 'ke-nguyen-vang-sanh',
    title: 'Kệ Nguyện Vãng Sanh',
    subtitle: 'Nguyện sanh Tây phương Tịnh độ',
    category: 'ke',
    tradition: 'Tịnh độ tông',
    minutes: 1,
    description: 'Bốn câu kệ phát nguyện của người niệm Phật, thường đọc ở phần cuối thời khoá Tịnh độ trước khi hồi hướng.',
    sections: [
      {
        lines: [
          'Nguyện sanh Tây phương Tịnh độ trung,',
          'Cửu phẩm liên hoa vi phụ mẫu,',
          'Hoa khai kiến Phật ngộ vô sanh,',
          'Bất thối Bồ Tát vi bạn lữ.',
        ],
      },
    ],
    meaning: [
      'Nguyện được sinh về cõi Tịnh độ phương Tây,',
      'lấy hoa sen chín phẩm làm nơi thác sinh như cha mẹ;',
      'hoa nở thấy Phật, ngộ được lý vô sanh,',
      'cùng các vị Bồ Tát không còn thối chuyển làm bạn đồng tu. (Lược giải)',
    ],
  },
  {
    id: 'tan-phat-a-di-da',
    title: 'Tán Phật A Di Đà',
    subtitle: 'Bài tán dương Đức Phật A Di Đà',
    category: 'ke',
    tradition: 'Tịnh độ tông',
    minutes: 2,
    description: 'Bài tán ca ngợi tướng hảo, ánh sáng và bốn mươi tám đại nguyện của Đức Phật A Di Đà, mở đầu thời khoá niệm Phật.',
    sections: [
      {
        lines: [
          'A Di Đà Phật thân kim sắc,',
          'Tướng hảo quang minh vô đẳng luân,',
          'Bạch hào uyển chuyển ngũ Tu Di,',
          'Hám mục trừng thanh tứ đại hải,',
          'Quang trung hoá Phật vô số ức,',
          'Hoá Bồ Tát chúng diệc vô biên,',
          'Tứ thập bát nguyện độ chúng sanh,',
          'Cửu phẩm hàm linh đăng bỉ ngạn.',
          'Nam mô Tây phương Cực lạc thế giới, đại từ đại bi, A Di Đà Phật.',
        ],
      },
    ],
    meaning: [
      'Thân Phật A Di Đà sắc vàng ròng, tướng tốt và hào quang không gì sánh được. Sợi lông trắng giữa đôi mày uyển chuyển như năm núi Tu Di, đôi mắt trong xanh như bốn biển lớn.',
      'Trong hào quang hoá hiện vô số chư Phật và vô biên Bồ Tát. Với bốn mươi tám lời nguyện lớn, Ngài cứu độ chúng sanh, đưa muôn loài trong chín phẩm sen lên tới bờ giác. (Lược giải)',
      'Những hình ảnh lớn lao trong bài tán là cách diễn tả công hạnh và lòng từ vô lượng của Đức Phật, giúp người niệm Phật phát khởi lòng tin và sự kính ngưỡng.',
    ],
  },
  {
    id: 'nghi-thuc-niem-phat',
    title: 'Nghi thức Niệm Phật tại gia',
    subtitle: 'Thời khoá ngắn cho buổi tối ở nhà',
    category: 'nghi-thuc',
    tradition: 'Soạn theo khung thời khoá Tịnh độ truyền thống',
    minutes: 15,
    description:
      'Một thời khoá trọn vẹn khoảng 15 phút: tịnh tâm, đảnh lễ, tán Phật, Tâm Kinh, Chú Vãng Sanh, niệm Phật hiệu, phát nguyện và hồi hướng.',
    sections: [
      {
        heading: 'Tịnh tâm & dâng hương',
        note: 'Rửa tay, thắp hương (hoặc chỉ chắp tay nếu không có hương). Đứng ngay ngắn trước bàn thờ Phật, thở chậm vài hơi cho tâm lắng xuống.',
      },
      {
        heading: 'Đảnh lễ Tam Bảo',
        note: 'Đọc xong, lạy một lạy (hoặc xá ba xá).',
        lines: [
          'Nhất tâm đảnh lễ: Nam mô tận hư không, biến pháp giới,',
          'quá, hiện, vị lai thập phương chư Phật, Tôn Pháp, Hiền Thánh Tăng,',
          'thường trụ Tam Bảo.',
        ],
      },
      { ref: 'tan-phat-a-di-da' },
      { ref: 'bat-nha-tam-kinh' },
      { ref: 'chu-vang-sanh', note: 'Tụng 3 lần.' },
      {
        heading: 'Niệm Phật hiệu',
        note: 'Niệm chậm rãi, rõ từng chữ, tai nghe rõ tiếng mình. Có thể niệm nhiều hơn tuỳ thời gian — trang Niệm Phật giúp bạn đếm.',
        lines: [
          'Nam mô Tây phương Cực lạc thế giới, đại từ đại bi, A Di Đà Phật.',
          'Nam mô A Di Đà Phật. (10 lần)',
          'Nam mô Quán Thế Âm Bồ Tát. (3 lần)',
          'Nam mô Đại Thế Chí Bồ Tát. (3 lần)',
          'Nam mô Thanh Tịnh Đại Hải Chúng Bồ Tát. (3 lần)',
        ],
      },
      {
        heading: 'Phát nguyện',
        note: 'Lời nguyện bằng tiếng Việt do ứng dụng gợi ý — bạn có thể nói bằng lời của chính mình.',
        lines: [
          'Con xin nguyện sống tỉnh thức trong từng việc nhỏ,',
          'nói lời hiền, làm việc lành, không nuôi oán hận,',
          'biết ơn, biết đủ, thương người như thương thân,',
          'cùng tất cả chúng sanh hướng về con đường giác ngộ.',
        ],
      },
      { ref: 'ke-nguyen-vang-sanh' },
      { ref: 'ke-hoi-huong' },
      {
        heading: 'Kết thúc',
        note: 'Chắp tay xá ba xá. Ngồi yên thêm một phút, mang sự an tĩnh này vào phần còn lại của ngày.',
      },
    ],
    meaning: [
      'Nghi thức này được sắp xếp theo khung thời khoá Tịnh độ thường thấy: tịnh tâm → đảnh lễ → tán Phật → tụng kinh, trì chú → niệm Phật hiệu → phát nguyện → hồi hướng. Mỗi phần có một ý nghĩa riêng: lắng tâm, khởi lòng kính, nuôi trí tuệ, chuyên niệm, rồi mở rộng tâm ra với mọi người.',
      'Nếu ít thời gian, có thể chỉ giữ ba phần cốt lõi: đảnh lễ, niệm Phật hiệu và hồi hướng. Đều đặn mỗi ngày một chút quý hơn thật dài nhưng thất thường.',
    ],
    notes: [
      'Các bài kinh, chú, kệ bên trong được dẫn chiếu từ thư viện — bấm "Mở bài riêng" để đọc riêng và xem lược giải từng bài.',
      'Ở chùa, thời khoá có thể dài hơn và khác nhau tuỳ truyền thống; hãy theo hướng dẫn của thầy hoặc đạo tràng nơi bạn tu học.',
    ],
  },
  {
    id: 'muoi-niem-buoi-sang',
    title: 'Mười niệm buổi sáng',
    subtitle: 'Thực tập niệm Phật hai phút khi vừa thức dậy',
    category: 'nghi-thuc',
    tradition: 'Theo tinh thần pháp "thập niệm" của Tịnh độ',
    minutes: 2,
    description: 'Bắt đầu ngày mới bằng mười câu niệm Phật trọn vẹn và một lời hồi hướng. Ngắn đến mức không có lý do để bỏ qua.',
    sections: [
      {
        heading: 'Chuẩn bị',
        note: 'Sau khi rửa mặt, đứng hoặc ngồi ngay ngắn, chắp tay hướng về bàn thờ Phật (hoặc hướng Tây). Mỗi câu niệm trọn một hơi thở, chậm và rõ.',
      },
      {
        heading: 'Mười niệm',
        lines: Array.from({ length: 10 }, () => 'Nam mô A Di Đà Phật.'),
      },
      { ref: 'ke-hoi-huong' },
    ],
    meaning: [
      'Pháp "thập niệm" là cách thực tập được nhiều vị thầy Tịnh độ khuyên dùng cho người bận rộn: mỗi sáng niệm mười câu Phật hiệu, mỗi câu trọn một hơi thở, rồi hồi hướng.',
      'Giá trị nằm ở sự đều đặn và tâm chuyên chú, không ở số lượng. Mười câu thật sự có mặt quý hơn trăm câu niệm trong lúc tâm tán loạn.',
    ],
  },
]

const BY_ID = new Map(SUTRAS.map((s) => [s.id, s]))

export function getSutra(id) {
  return BY_ID.get(id)
}
