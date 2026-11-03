/**
 * Câu tự vấn cho chế độ "Chiêm nghiệm". Mục đích: đưa lời dạy từ trang giấy vào đời sống hằng ngày,
 * nên câu hỏi hướng về hành vi cụ thể, không phán xét.
 */

export const REFLECTIONS = {
  tam: [
    'Lúc này, tâm mình đang nghiêng về điều gì — lo lắng, mong cầu hay bình yên?',
    'Hôm nay có ý nghĩ nào mình để nó dẫn đi quá xa không?',
    'Nếu chỉ được giữ một ý niệm lành suốt ngày mai, mình chọn ý niệm nào?',
    'Điều gì giúp tâm mình lắng lại nhanh nhất khi rối bời?',
  ],
  'tu-bi': [
    'Hôm nay ai quanh mình đang cần được lắng nghe hơn là được khuyên bảo?',
    'Có người nào mình còn giữ chút giận hờn? Mình có thể hiểu họ thêm một chút không?',
    'Một việc tử tế nhỏ mình có thể làm ngay trong hôm nay là gì?',
    'Mình đã đối xử với chính bản thân dịu dàng như với người mình thương chưa?',
  ],
  'nhan-qua': [
    'Hôm nay mình đã gieo những hạt giống gì qua lời nói và việc làm?',
    'Có điều gì mình đang nhận lại mà nhìn kỹ thì chính mình đã gieo nhân?',
    'Một thói quen nhỏ nào mình muốn thay đổi để ngày mai nhẹ nhàng hơn?',
    'Mình có xem nhẹ một điều thiện nhỏ nào vì nghĩ nó không đáng kể?',
  ],
  'tinh-tan': [
    'Việc tu tập nào mình đã định làm mà còn trì hoãn?',
    'Nếu chỉ dành năm phút mỗi ngày, mình sẽ dành cho điều gì?',
    'Hôm nay mình đã thắng được chính mình ở điểm nào, dù rất nhỏ?',
    'Điều gì thường kéo mình xa khỏi thời khoá tu tập — và mình có thể làm gì với nó?',
  ],
  'vo-thuong': [
    'Nếu hôm nay là ngày cuối cùng gặp một người thân, mình muốn nói gì với họ?',
    'Điều gì mình đang nắm chặt mà thật ra đã và đang đổi thay?',
    'Một khó khăn hiện tại sẽ còn quan trọng thế nào sau mười năm nữa?',
    'Hôm nay mình đã trân quý điều gì mà trước giờ vẫn coi là hiển nhiên?',
  ],
  'tri-tue': [
    'Mình đang tin điều gì chỉ vì quen nghe, chưa từng tự mình xem xét?',
    'Lỗi nào của bản thân mình hay bỏ qua nhưng lại dễ thấy ở người khác?',
    'Nếu nhìn lại chuyện phiền lòng hôm nay từ phía người kia, mình thấy gì khác?',
    'Có bài học nào cuộc sống đã dạy mình nhiều lần mà mình chưa học xong?',
  ],
  'nhan-nhuc': [
    'Lần gần nhất mình nổi giận, điều gì thật sự nằm bên dưới cơn giận đó?',
    'Khi bị chê trách, mình có thể dừng lại một hơi thở trước khi đáp lời không?',
    'Lời khen hay tiếng chê nào đang làm mình dao động nhiều nhất?',
    'Nhẫn nại với ai là điều khó nhất với mình lúc này — và vì sao?',
  ],
  'an-lac': [
    'Ngay bây giờ, mình đang có đủ những điều kiện hạnh phúc nào?',
    'Điều gì mình có thể buông xuống để thấy nhẹ lòng hơn?',
    'Khoảnh khắc bình yên nhất trong ngày hôm nay là lúc nào?',
    'Mình có đang đuổi theo một niềm vui nhỏ mà bỏ quên niềm an lạc lớn hơn?',
  ],
}

const FALLBACK = REFLECTIONS.tam

/** Băm chuỗi đơn giản (djb2) — để mỗi câu luôn đi kèm cùng một bộ câu hỏi, không nhảy lung tung khi render lại. */
export function hashString(str) {
  let h = 5381
  for (const ch of String(str)) h = ((h << 5) + h + ch.codePointAt(0)) >>> 0
  return h
}

/** Lấy `count` câu tự vấn cho một pháp ngữ, ổn định theo id. */
export function reflectionsFor(quote, count = 3) {
  const pool = REFLECTIONS[quote?.theme] ?? FALLBACK
  const n = Math.min(count, pool.length)
  const start = hashString(quote?.id ?? '') % pool.length
  return Array.from({ length: n }, (_, i) => pool[(start + i) % pool.length])
}
