/** 高中语文课文知识库类型 — 知识库优先，禁止胡编 */

export type ChineseUnit = '必修上' | '必修下' | '选择性必修' | '其他'

export type LiteraryKind = 'classical' | 'modern_prose' | 'narrative' | 'poetry'

export type ParagraphAnalysis = {
  paragraph: number
  content: string
  analysis: string[]
  teaching_value: string
}

export type KeySentence = {
  text: string
  technique: string
  effect: string
}

export type StackedWord = {
  word: string
  effect: string
}

export type ChineseTextKnowledge = {
  id: string
  title: string
  author: string
  dynasty?: string
  unit: ChineseUnit
  kind: LiteraryKind
  /** 课文节选/关键段（教学用） */
  excerpts: { label: string; text: string }[]
  background: string
  /** 课堂用短背景（非百科） */
  background_bullets?: string[]
  core_questions: string[]
  /** 公开课问题链（比 core_questions 更口语、可追问） */
  classroom_questions?: string[]
  annotation: {
    实词: { word: string; meaning: string; example: string }[]
    虚词: { word: string; usage: string; example?: string }[]
    句式?: { type: string; example: string; note: string }[]
  }
  sentence_analysis: {
    sentence: string
    translation: string
    grammar?: string
    meaning: string
  }[]
  /** 段落细读（PPT 文本细读核心） */
  paragraph_analysis?: ParagraphAnalysis[]
  /** 手法例句：原句→手法→效果 */
  key_sentences?: KeySentence[]
  /** 叠词/炼字 */
  stacked_words?: StackedWord[]
  /** 写景层次 */
  scenery_layers?: string[]
  /** 情感变化弧 */
  emotion_arc?: { stage: string; detail: string }[]
  literary_features: string[]
  structure: { part: string; content: string }[]
  exam_points: string[]
  /** 高考答题步骤 */
  gaokao_method?: { label: string; detail: string }[]
  /** 课堂练习（必须来自课文） */
  practice_item?: { prompt: string; hint: string }
  /** 知识树节点 */
  knowledge_tree?: string[]
  common_questions: string[]
  teaching_difficulties: string[]
  visual_prompts: string[]
  /** PPT 设计语言 */
  ppt_style: 'classical' | 'modern_prose' | 'competition' | 'gaokao_review'
  /** 知识来源分级 */
  source?: 'verified' | 'ai_generated' | 'cached'
  /** AI 生成置信度 0–1 */
  confidence?: number
}
