/**
 * Máy trạng thái trắc nghiệm (dùng với useReducer) và hàm chấm điểm.
 * Tách khỏi component để kiểm thử độc lập và để giao diện chỉ lo hiển thị.
 */

export const INITIAL_QUIZ = Object.freeze({ index: 0, answers: [], revealed: false, done: false })

/** Chấm điểm: answers[i] là chỉ số phương án người dùng chọn cho câu i. */
export function gradeQuiz(quiz, answers) {
  const total = quiz.length
  const correct = quiz.reduce((n, item, i) => (answers[i] === item.answer ? n + 1 : n), 0)
  return { correct, total, score: total ? correct / total : 0 }
}

/**
 * Actions:
 *  { type: 'select', choice, total } — chọn đáp án cho câu hiện tại (chỉ một lần)
 *  { type: 'next', total }           — sang câu tiếp, hoặc kết thúc ở câu cuối
 *  { type: 'restart' }
 */
export function quizReducer(state, action) {
  switch (action.type) {
    case 'select': {
      if (state.done || state.revealed) return state
      if (!Number.isInteger(action.choice) || action.choice < 0) return state
      const answers = state.answers.slice()
      answers[state.index] = action.choice
      return { ...state, answers, revealed: true }
    }
    case 'next': {
      if (state.done || !state.revealed) return state
      if (state.index >= action.total - 1) return { ...state, done: true }
      return { ...state, index: state.index + 1, revealed: false }
    }
    case 'restart':
      return INITIAL_QUIZ
    default:
      return state
  }
}

/** Phím '1'..'4' (cả bàn phím số) → chỉ số 0..3; không hợp lệ → -1. */
export function keyToOptionIndex(key, count = 4) {
  if (typeof key !== 'string' || key.length !== 1) return -1
  const n = key.charCodeAt(0) - 49 // '1' = 49
  return n >= 0 && n < count ? n : -1
}

/** Lời nhận xét nhẹ nhàng theo điểm — khích lệ, không phán xét. */
export function scoreMessage(score) {
  if (score >= 1) return { title: 'Tròn đầy!', text: 'Bạn đã nắm vững bài học. Điều quý nhất là đem hiểu biết này vào đời sống mỗi ngày.' }
  if (score >= 0.8) return { title: 'Rất tốt!', text: 'Bạn đã hiểu những điểm cốt lõi. Đọc lại phần giải thích để thêm vững chãi.' }
  if (score >= 0.5) return { title: 'Đang tiến bộ', text: 'Bạn đã nắm được một phần. Hãy đọc lại bài và thử thêm lần nữa nhé.' }
  return { title: 'Chậm mà chắc', text: 'Học Phật không vội. Đọc lại từng phần, rồi quay lại làm bài khi thấy sẵn sàng.' }
}
