import type { RetrievalBundle, RetrievalQuery, SourcedChunk } from '../types'
import { searchKnowledgeSync } from '../search_service'
import { parseChineseInput } from '../../knowledge/chinese/parseInput'

/**
 * Knowledge Retrieval Agent
 * 按课程需求聚合多源资料，并按类型分桶
 */
export function runKnowledgeRetrieval(input: {
  subject?: string
  grade?: string
  topic: string
  raw?: string
}): RetrievalBundle {
  const raw = input.raw || `${input.grade || '高中'}${input.subject || '语文'} ${input.topic}`
  const parsed = parseChineseInput(raw)
  const topic = parsed.title || input.topic

  const query: RetrievalQuery = {
    subject: input.subject || '高中语文',
    grade: input.grade || '高中',
    topic,
    unit: parsed.unit,
    raw,
  }

  const chunks = searchKnowledgeSync(raw)
  return bucket(query, chunks)
}

function bucket(query: RetrievalQuery, chunks: SourcedChunk[]): RetrievalBundle {
  const original_text = chunks.filter((c) => c.kind === 'original_text')
  const annotations = chunks.filter((c) => c.kind === 'annotation')
  const author_background = chunks.filter((c) => c.kind === 'author_background')
  const teaching_resources = chunks.filter(
    (c) => c.kind === 'teaching_resource' || c.kind === 'method' || c.kind === 'structure',
  )
  const exam_points = chunks.filter((c) => c.kind === 'exam_point')

  const sources = [...new Set(chunks.map((c) => c.source_label))]
  const hasTextbook = chunks.some((c) => c.source === 'textbook')
  const text_source = hasTextbook
    ? '教材精校+权威资料'
    : sources.slice(0, 3).join(' + ') || '教研方法框架'

  return {
    query,
    text_source,
    chunks,
    original_text,
    annotations,
    author_background,
    teaching_resources,
    exam_points,
  }
}
