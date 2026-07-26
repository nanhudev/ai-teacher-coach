import type { RetrievalBundle, TextUnderstanding, SourcedChunk } from '../types'
import { parseChineseInput } from '../../knowledge/chinese/parseInput'

/**
 * Text Understanding Agent
 * 把检索片段整理成可教学的理解结构（不凭空造原文）
 */
export function runTextUnderstanding(bundle: RetrievalBundle): TextUnderstanding {
  const topic = bundle.query.topic
  const parsed = parseChineseInput(bundle.query.raw || topic)
  const classical =
    parsed.kindGuess === 'classical' ||
    parsed.kindGuess === 'poetry' ||
    /记$|说$|赋$|书$|表$|序$/.test(topic)

  const bg = bundle.author_background[0]
  const author = bg?.meta?.author || parsed.authorHint
  const dynasty = bg?.meta?.dynasty

  const key_sentences = bundle.original_text.slice(0, 4).map((c) => {
    const tech = pickTechnique(c, classical)
    return {
      text: c.content,
      technique: tech,
      effect: c.meta?.label || '服务主旨与情感',
      source: c.source_label,
      confidence: c.confidence,
    }
  })

  const important_words = bundle.annotations
    .filter((c) => c.meta?.word)
    .slice(0, 8)
    .map((c) => ({
      word: c.meta!.word!,
      meaning: c.meta!.meaning || c.content,
      example: c.meta?.example,
      source: c.source_label,
      confidence: c.confidence,
    }))

  const exam_value = [
    ...bundle.exam_points.map((c) => c.content),
    ...bundle.teaching_resources
      .filter((c) => c.kind === 'method')
      .map((c) => c.content),
  ].slice(0, 6)

  const writing_features = inferFeatures(bundle, classical)
  const core_theme =
    bg?.meta?.theme ||
    bg?.content?.split('｜')[1] ||
    (key_sentences[0] ? `围绕「${key_sentences[0].text.slice(0, 12)}…」展开` : `《${topic}》核心主旨（待教材核对）`)

  return {
    text_type: classical ? '文言文' : parsed.kindGuess === 'poetry' ? '诗歌' : '现代散文',
    core_theme,
    key_sentences,
    important_words,
    writing_features,
    exam_value,
    author,
    dynasty,
  }
}

function pickTechnique(c: SourcedChunk, classical: boolean) {
  if (c.meta?.technique) return c.meta.technique
  if (/先|后|或…或|对比|而/.test(c.content)) return '对比'
  return classical ? '文言表达' : '描写与抒情'
}

function inferFeatures(bundle: RetrievalBundle, classical: boolean) {
  const fromTeach = bundle.teaching_resources
    .filter((c) => c.meta?.technique)
    .map((c) => c.meta!.technique!)
  if (fromTeach.length) return [...new Set(fromTeach)].slice(0, 4)
  return classical
    ? ['文言实词虚词', '论证或叙事', '关键句']
    : ['结构布局', '表现手法', '情景关系']
}
