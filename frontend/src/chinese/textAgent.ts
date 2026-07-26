import {
  resolveChineseText,
  type ChineseTextKnowledge,
} from '../knowledge/chinese'

export type ChineseTextBrief = {
  matched: boolean
  text: ChineseTextKnowledge | null
  /** 知识来源 */
  source?: 'verified' | 'ai_generated' | 'cached'
  confidence?: number
  /** 是否刚动态生成 */
  freshly_generated?: boolean
  miss_hint?: string
  /** RAG 审核摘要 */
  rag?: {
    text_source: string
    verified: boolean
    confidence: number
    issues: string[]
  }
  text_background: string
  core_questions: string[]
  knowledge_points: {
    文言实词: string[]
    虚词: string[]
    特殊句式: string[]
    文学手法: string[]
  }
  exam_focus: string[]
  teaching_difficulties: string[]
  visual_prompts: string[]
  ppt_style: ChineseTextKnowledge['ppt_style']
  unit: string
  title: string
  author: string
}

function toBrief(
  text: ChineseTextKnowledge,
  from: 'verified' | 'ai_generated' | 'cached',
  freshly: boolean,
  rag?: ChineseTextBrief['rag'],
): ChineseTextBrief {
  return {
    matched: true,
    text,
    source: from,
    confidence: text.confidence ?? (from === 'verified' ? 1 : 0.75),
    freshly_generated: freshly,
    rag,
    text_background: text.background,
    core_questions: text.core_questions,
    knowledge_points: {
      文言实词: text.annotation.实词.map((w) => `${w.word}：${w.meaning}`),
      虚词: text.annotation.虚词.map((w) => `${w.word}：${w.usage}`),
      特殊句式: (text.annotation.句式 || []).map((s) => `${s.type}｜${s.example}`),
      文学手法: text.literary_features,
    },
    exam_focus: text.exam_points,
    teaching_difficulties: text.teaching_difficulties,
    visual_prompts: text.visual_prompts,
    ppt_style: text.ppt_style,
    unit: text.unit,
    title: text.title,
    author: text.author,
  }
}

/**
 * ChineseTextAgent
 * RAG：检索 → 审核 → 教学包（永不「知识库不存在」）
 */
export function runChineseTextAgent(oneLiner: string): ChineseTextBrief {
  const line = (oneLiner || '').trim()
  if (!line) {
    return {
      matched: false,
      text: null,
      miss_hint: '请输入课题，例如：高中语文 必修上 师说',
      text_background: '',
      core_questions: [],
      knowledge_points: { 文言实词: [], 虚词: [], 特殊句式: [], 文学手法: [] },
      exam_focus: [],
      teaching_difficulties: [],
      visual_prompts: [],
      ppt_style: 'classical',
      unit: '必修上',
      title: '',
      author: '',
    }
  }

  const { text, from, generating, rag } = resolveChineseText(line)
  return toBrief(text, from, generating, rag)
}
