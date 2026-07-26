import type { ChineseTextBrief } from './textAgent'

/**
 * ChineseLessonAgent
 * 产出课堂问题链：问题 → 文本证据 → 学生发现（供 PPT / 教案共用）
 */
export function buildClassroomQuestionChain(brief: ChineseTextBrief): string[] {
  const fromKb = brief.text?.classroom_questions
  if (fromKb?.length) return fromKb
  // 回退：把 core_questions 改成可追问口语（仍不胡编考点）
  return brief.core_questions.map((q) => q.replace(/^分析|^概括/, '我们一起追问：'))
}
