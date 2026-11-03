import { dayProgress } from '../../lib/stats'

/**
 * Chọn MỘT gợi ý phù hợp ngữ cảnh (giờ trong ngày, ngày vía, tiến độ thời khoá).
 * Thứ tự ưu tiên có chủ ý: ngày vía quan trọng nhất trong năm → buổi sáng hợp nhất cho thiền
 * → buổi tối dành cho tự vấn/hồi hướng → mùng Một/Rằm nhắc đi chùa → phần thời khoá còn thiếu.
 *
 * @param {{ hour: number, day?: object, goals: object, holidays?: Array, fasting?: boolean, socVong?: boolean }} ctx
 * @returns {{ id: string, icon: string, title: string, text: string, to: string, cta: string }}
 */
export function suggestFor({ hour, day, goals, holidays = [], fasting = false, socVong = false }) {
  const d = day ?? {}
  const p = dayProgress(d, goals)
  const deeds = d.thienHanh?.length ?? 0

  if (holidays.length) {
    const h = holidays[0]
    return {
      id: 'ngay-via',
      icon: 'book',
      title: `Hôm nay là ${h.short}`,
      text: `${h.desc} Bạn có thể dành ít phút tụng một thời kinh, hoặc nếu có duyên thì đến chùa lễ Phật.`,
      to: '/kinh',
      cta: 'Chọn bài kinh',
    }
  }

  if (hour < 4) {
    return {
      id: 'dem-khuya',
      icon: 'moon',
      title: 'Đêm đã khuya',
      text: 'Thở chậm vài hơi, buông những suy nghĩ trong ngày rồi nghỉ ngơi. Giấc ngủ đủ cũng là cách chăm sóc thân tâm.',
      to: '/thien',
      cta: 'Thở vài phút',
    }
  }

  if (hour < 10 && p.thien < 1) {
    return {
      id: 'thien-sang',
      icon: 'sunrise',
      title: 'Mười phút tĩnh lặng đầu ngày',
      text: 'Buổi sáng tâm còn trong. Ngồi yên, theo dõi hơi thở mười phút trước khi bắt đầu công việc.',
      to: '/thien',
      cta: 'Ngồi thiền',
    }
  }

  if (hour >= 20) {
    if (deeds > 0) {
      return {
        id: 'hoi-huong',
        icon: 'heart',
        title: 'Hồi hướng cuối ngày',
        text: 'Hôm nay bạn đã làm được việc lành. Dành một phút nhìn lại và hồi hướng cho người thân, cho mọi người.',
        to: '/nhat-ky',
        cta: 'Viết lời hồi hướng',
      }
    }
    return {
      id: 'tu-van',
      icon: 'notebook',
      title: 'Nhìn lại một ngày',
      text: 'Hôm nay mình đã nói lời tử tế với ai? Có điều gì cần sám hối? Ghi lại vài dòng để ngày mai sống tốt hơn.',
      to: '/nhat-ky',
      cta: 'Mở nhật ký',
    }
  }

  if (socVong) {
    return {
      id: 'di-chua',
      icon: 'map',
      title: 'Hôm nay là ngày đi chùa',
      text: 'Mùng Một và ngày Rằm là dịp nhiều người về chùa lễ Phật, nghe pháp. Nếu thu xếp được, hãy ghé một ngôi chùa gần nhà.',
      to: '/hanh-huong',
      cta: 'Tìm chùa',
    }
  }

  if (p.niem < 1) {
    return {
      id: 'niem-phat',
      icon: 'beads',
      title: 'Niệm Phật giữa ngày',
      text: 'Giữa bộn bề công việc, vài phút niệm Phật giúp tâm lắng lại. Không cần đủ số, chỉ cần chuyên chú.',
      to: '/niem-phat',
      cta: 'Niệm Phật',
    }
  }

  if (fasting) {
    return {
      id: 'an-chay',
      icon: 'leaf',
      title: 'Hôm nay là ngày chay',
      text: 'Một bữa ăn thanh đạm, ăn chậm và biết ơn. Giữ lời nói nhẹ nhàng cũng là giữ trai giới.',
      to: '/lich',
      cta: 'Xem lịch chay',
    }
  }

  if (p.thienHanh < 1) {
    return {
      id: 'thien-hanh',
      icon: 'hand',
      title: 'Một việc lành nhỏ',
      text: 'Gọi điện hỏi thăm cha mẹ, nhường đường, nói lời cảm ơn… Làm xong thì ghi lại để nuôi dưỡng thói quen tốt.',
      to: '/nhat-ky',
      cta: 'Ghi thiện hạnh',
    }
  }

  if (p.thien < 1) {
    return {
      id: 'thien',
      icon: 'wind',
      title: 'Vài phút trở về hơi thở',
      text: 'Bạn còn một chút thời gian thiền cho hôm nay. Ngồi yên ở bất cứ đâu, chỉ cần biết mình đang thở.',
      to: '/thien',
      cta: 'Ngồi thiền',
    }
  }

  return {
    id: 'hoc-phat',
    icon: 'book',
    title: 'Thời khoá đã tròn',
    text: 'Tuỳ hỷ với sự tinh tấn của bạn. Nếu còn thời gian, đọc một bài học Phật pháp ngắn để hiểu sâu hơn điều mình thực hành.',
    to: '/hoc-phat',
    cta: 'Học Phật',
  }
}
