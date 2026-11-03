/**
 * Nội dung chữ của trang Thiền — tự biên soạn, ngắn, nhẹ nhàng.
 * Không hứa hẹn "công đức" hay hiệu quả thần kỳ; chỉ nhắc quay về hơi thở và thân tâm.
 */

/** Câu nhắc chánh niệm luân phiên trong lúc ngồi. */
export const MINDFUL_PROMPTS = [
  'Biết mình đang thở vào. Biết mình đang thở ra.',
  'Nếu tâm đi lang thang, chỉ cần nhẹ nhàng đưa về hơi thở.',
  'Thả lỏng đôi vai, thả lỏng vầng trán, thả lỏng đôi tay.',
  'Không cần cố gắng. Chỉ cần có mặt với giây phút này.',
  'Ý nghĩ đến rồi đi như mây qua trời. Mình không cần đuổi theo.',
  'Cảm nhận thân đang ngồi vững vàng trên mặt đất.',
  'Mỗi hơi thở ra là một lần buông bớt.',
  'Lắng nghe những âm thanh quanh mình, rồi trở về hơi thở.',
  'Cho phép mọi cảm giác có mặt, không chống đối, không bám víu.',
  'Thở nhẹ như làn gió, lặng như mặt hồ.',
  'Mỉm cười nhẹ với chính mình.',
  'Bây giờ, ở đây, mình đang bình an.',
]

/** Cảm nhận sau buổi ngồi — map vào setDayMood(1..5). Biểu tượng là tên icon lucide. */
export const MOODS = [
  { value: 1, label: 'Nặng nề', icon: 'CloudRain' },
  { value: 2, label: 'Xao động', icon: 'Cloud' },
  { value: 3, label: 'Bình thường', icon: 'CloudSun' },
  { value: 4, label: 'Nhẹ nhàng', icon: 'Sun' },
  { value: 5, label: 'An lạc', icon: 'Sparkles' },
]

/** Lời nhắn nhẹ sau khi chọn cảm nhận — không phán xét buổi ngồi "tốt" hay "dở". */
export const MOOD_REPLIES = {
  1: 'Có những buổi ngồi nặng nề — biết được điều đó đã là chánh niệm rồi.',
  2: 'Tâm xao động là chuyện bình thường. Mỗi lần quay về là một lần tập.',
  3: 'Một buổi ngồi bình thường cũng là một buổi ngồi quý.',
  4: 'Mong sự nhẹ nhàng này theo bạn suốt phần còn lại của ngày.',
  5: 'Hãy mang chút an lạc ấy vào lời nói và việc làm hôm nay.',
}

/** Lời hồi hướng ngắn, tự soạn. */
export const DEDICATION = 'Nguyện cho sự tĩnh lặng của buổi ngồi hôm nay lan đến người thân và muôn loài; nguyện cho tất cả đều được bình an, bớt khổ đau.'

/** Kệ hồi hướng truyền thống trong nghi thức tụng niệm Việt Nam. */
export const DEDICATION_VERSE = ['Nguyện đem công đức này', 'Hướng về khắp tất cả', 'Đệ tử và chúng sanh', 'Đều trọn thành Phật đạo.']

/** Hướng dẫn tư thế cho người mới. */
export const POSTURE_STEPS = [
  {
    title: 'Chọn chỗ ngồi',
    text: 'Một góc yên tĩnh, thoáng khí. Có thể ngồi trên bồ đoàn, gối dày hoặc ghế — miễn là thân vững và thoải mái.',
  },
  {
    title: 'Cách ngồi',
    text: 'Bán già (một bàn chân đặt lên đùi bên kia), kiết già (hai bàn chân lên hai đùi) hoặc ngồi xếp bằng đơn giản. Ngồi ghế thì đặt hai bàn chân phẳng trên sàn.',
  },
  {
    title: 'Lưng thẳng tự nhiên',
    text: 'Cột sống thẳng nhưng không gồng, như một chuỗi hạt được treo nhẹ từ đỉnh đầu. Cằm hơi thu vào.',
  },
  {
    title: 'Vai và tay',
    text: 'Đôi vai buông lỏng. Hai bàn tay đặt chồng lên nhau trong lòng, hai đầu ngón cái chạm nhẹ — hoặc đặt tự nhiên trên đùi.',
  },
  {
    title: 'Mắt và miệng',
    text: 'Mắt khép hờ nhìn xuống phía trước, hoặc nhắm hẳn nếu thấy dễ chịu. Môi khép nhẹ, đầu lưỡi chạm nhẹ hàm trên.',
  },
]

/** Hướng dẫn cách thở. */
export const BREATH_TIPS = [
  {
    title: 'Thở bằng mũi, nhẹ nhàng',
    text: 'Không ép hơi, không cố thở thật sâu. Hơi thở dần tự chậm lại khi thân tâm lắng xuống.',
  },
  {
    title: 'Đếm hơi thở',
    text: 'Người mới có thể đếm: thở vào, thở ra — đếm "một"; tiếp tục đến "mười" rồi bắt đầu lại. Lỡ quên số thì cứ quay về "một", không sao cả.',
  },
  {
    title: 'Khi tâm lang thang',
    text: 'Đó là điều tự nhiên. Nhận biết "mình vừa nghĩ", rồi nhẹ nhàng trở về hơi thở — không trách mình.',
  },
  {
    title: 'Xả thiền từ tốn',
    text: 'Khi chuông kết thúc, đừng đứng dậy ngay. Thở vài hơi, xoa ấm hai bàn tay, xoa mặt, xoa nhẹ chân rồi mới đứng lên.',
  },
]

export const HEALTH_NOTE =
  'Các kiểu thở có giữ hơi (4–7–8, Hộp) không phù hợp với mọi người. Nếu bạn đang mang thai, có bệnh tim mạch, hô hấp hoặc thấy chóng mặt, hãy chọn "Tự nhiên" và hỏi ý kiến bác sĩ.'
