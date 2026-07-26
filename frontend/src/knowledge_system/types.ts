/**
 * 高中语文知识系统 V6 — 来源标注的知识片段
 * 壁垒在审核链，不在「联网搜索」
 */

export type KnowledgeSourceKind =
  | 'textbook' // 精校教材 / verified
  | 'teacher_upload' // 教师私有资料
  | 'curated' // 权威公开资料（离线语料）
  | 'pedagogy' // 教研方法/高考体系（非课文原文）
  | 'internet' // 互联网（默认低可信，必须过审核）

export type ChunkKind =
  | 'original_text'
  | 'annotation'
  | 'author_background'
  | 'teaching_resource'
  | 'exam_point'
  | 'structure'
  | 'method'

export type SourcedChunk = {
  id: string
  kind: ChunkKind
  content: string
  /** 结构化附加（字词义、标签等） */
  meta?: Record<string, string>
  source: KnowledgeSourceKind
  source_label: string
  confidence: number
  topic?: string
}

export type RetrievalQuery = {
  subject: string
  grade: string
  topic: string
  unit?: string
  raw?: string
}

export type RetrievalBundle = {
  query: RetrievalQuery
  text_source: string
  chunks: SourcedChunk[]
  original_text: SourcedChunk[]
  annotations: SourcedChunk[]
  author_background: SourcedChunk[]
  teaching_resources: SourcedChunk[]
  exam_points: SourcedChunk[]
}

export type TextUnderstanding = {
  text_type: '文言文' | '现代散文' | '叙事' | '诗歌'
  core_theme: string
  key_sentences: { text: string; technique: string; effect: string; source: string; confidence: number }[]
  important_words: { word: string; meaning: string; example?: string; source: string; confidence: number }[]
  writing_features: string[]
  exam_value: string[]
  author?: string
  dynasty?: string
}

export type VerificationResult = {
  verified: boolean
  confidence: number
  issues: string[]
  suggestions: string[]
  /** 允许进入课程生成的片段 */
  accepted_chunks: SourcedChunk[]
}
