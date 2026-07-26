import type { RetrievalBundle, VerificationResult, SourcedChunk } from '../types'

const MIN_ORIG = 1
const INTERNET_CAP = 0.7
const LATIN =
  /word\d|key\d|TBD|TODO|decode|transfer|first_read|pre-class|tongjia|[A-Za-z]{5,}/i

/**
 * KnowledgeVerifierAgent
 * 防止胡编：原文真实、注释有来源、考点合理、互联网降权
 */
export function runKnowledgeVerifier(bundle: RetrievalBundle): VerificationResult {
  const issues: string[] = []
  const suggestions: string[] = []
  const accepted: SourcedChunk[] = []

  for (const c of bundle.chunks) {
    if (LATIN.test(c.content)) {
      issues.push(`拒绝拉丁/内部字段：${c.id}`)
      continue
    }
    if (c.source === 'internet' && c.confidence > INTERNET_CAP) {
      accepted.push({ ...c, confidence: INTERNET_CAP })
      continue
    }
    // 注释必须挂在有原文或高可信源上
    if (c.kind === 'annotation' && c.confidence < 0.8 && !bundle.original_text.length) {
      issues.push(`无原文支撑的注释已降权：${c.content.slice(0, 12)}`)
      accepted.push({ ...c, confidence: Math.min(c.confidence, 0.6) })
      continue
    }
    accepted.push(c)
  }

  const originals = accepted.filter((c) => c.kind === 'original_text')
  const annos = accepted.filter((c) => c.kind === 'annotation')
  const hasTextbook = accepted.some((c) => c.source === 'textbook')
  const hasCurated = accepted.some((c) => c.source === 'curated' || c.source === 'teacher_upload')

  if (originals.length < MIN_ORIG) {
    issues.push('缺少可引用原文（将用教研框架备课，课前须补教材原文）')
    suggestions.push('上传教材段落或核对纸质教材关键句')
  }
  if (!annos.length && originals.length) {
    suggestions.push('建议补充教材注释中的实词虚词')
  }
  if (accepted.some((c) => c.source === 'internet')) {
    issues.push('含互联网资料：已限制置信度，禁止直接当教材原文')
    suggestions.push('以教材或教师上传为准复核')
  }

  let confidence = 0.55
  if (hasTextbook) confidence = 0.98
  else if (hasCurated && originals.length >= 2 && annos.length >= 2) confidence = 0.88
  else if (originals.length >= 1) confidence = 0.78
  else confidence = 0.62

  // 互联网占比过高则降分
  const netRatio =
    accepted.filter((c) => c.source === 'internet').length / Math.max(1, accepted.length)
  if (netRatio > 0.3) confidence = Math.min(confidence, 0.7)

  const verified = confidence >= 0.75 && originals.length >= 1

  if (!verified) {
    suggestions.push('可继续生成课程框架，但课件须标注「请对照教材核对」')
  }

  return {
    verified,
    confidence,
    issues: [...new Set(issues)],
    suggestions: [...new Set(suggestions)],
    accepted_chunks: accepted,
  }
}
