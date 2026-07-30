import type { ChineseTextKnowledge } from './types'
import { lookupGeneratedText, listGeneratedCases } from './generated/cache'
import { looksLikeChineseLesson } from './generateKnowledge'
import { parseChineseInput } from './parseInput'
import {
  retrieveAndBuildPack,
  TEXTBOOK_PACKS,
  listCuratedTitles,
} from '../../knowledge_system'

/** @deprecated 名称保留：精校教材源（RAG 最高优先级），不再是唯一架构 */
export const VERIFIED_TEXTS: ChineseTextKnowledge[] = TEXTBOOK_PACKS
export const CHINESE_TEXTS = VERIFIED_TEXTS

/**
 * RAG 解析：教材精校 → 教师上传 → 权威语料 → 教研方法 → 审核 → 缓存
 * 验收：任意高中语文课文不应再出现「知识库不存在」
 */
export function resolveChineseText(input: string): {
  text: ChineseTextKnowledge
  from: 'verified' | 'ai_generated' | 'cached'
  generating: boolean
  rag?: {
    text_source: string
    verified: boolean
    confidence: number
    issues: string[]
  }
} {
  const result = retrieveAndBuildPack(input)
  const from: 'verified' | 'ai_generated' | 'cached' =
    result.from === 'verified'
      ? 'verified'
      : result.verification.confidence >= 0.75
        ? 'cached'
        : 'ai_generated'

  return {
    text: result.pack,
    from,
    generating: result.from === 'rag_assembled',
    rag: {
      text_source: result.bundle.text_source,
      verified: result.verification.verified,
      confidence: result.verification.confidence,
      issues: result.verification.issues,
    },
  }
}

/** 兼容旧调用 */
export function lookupVerifiedText(input: string): ChineseTextKnowledge | null {
  const r = retrieveAndBuildPack(input)
  return r.from === 'verified' ? r.pack : null
}

export function lookupChineseText(input: string): ChineseTextKnowledge | null {
  return resolveChineseText(input).text
}

export function listChineseCases() {
  const verified = TEXTBOOK_PACKS.map((t) => ({
    id: t.id,
    label: `高中语文 · ${t.unit} · 《${t.title}》`,
    subject: '语文',
    grade: '高中',
    knowledge_points: t.exam_points.slice(0, 3),
    author: t.author,
    kind: t.kind,
    oneLiner: `高中语文 ${t.unit} ${t.title}`,
    hint: `${t.author}${t.dynasty ? ` · ${t.dynasty}` : ''} · 教材精校`,
    source: 'verified' as const,
  }))
  const curated = listCuratedTitles()
    .filter((title) => !TEXTBOOK_PACKS.some((t) => t.title === title))
    .map((title) => ({
      id: `rag-${title}`,
      label: `重点精校 · 《${title}》`,
      subject: '语文',
      grade: '高中',
      knowledge_points: ['自动检索', '知识审核', '公开课生成'],
      oneLiner: `高中语文 《${title}》`,
      hint: '关键原句 · 注释 · 主旨 · 考点已核',
      source: 'ai_generated' as const,
    }))
  return [...verified, ...curated, ...listGeneratedCases()]
}

export { parseChineseInput, looksLikeChineseLesson, lookupGeneratedText }

/** 旧名：已改为 RAG 组装 */
export { retrieveAndBuildPack as generateChineseKnowledge } from '../../knowledge_system'

export type { ChineseTextKnowledge }
