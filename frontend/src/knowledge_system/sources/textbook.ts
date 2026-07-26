import type { ChineseTextKnowledge } from '../../knowledge/chinese/types'
import type { SourcedChunk } from '../types'
import { chibiFu } from '../../knowledge/chinese/texts/chibi-fu'
import { heTangYueSe } from '../../knowledge/chinese/texts/he-tang-yue-se'
import { guDuDeQiu } from '../../knowledge/chinese/texts/gu-du-de-qiu'
import { hongMenYan } from '../../knowledge/chinese/texts/hong-men-yan'
import { baoRenAnShu } from '../../knowledge/chinese/texts/bao-ren-an-shu'

/** 精校包 = 教材源（最高可信），不是「唯一架构」 */
export const TEXTBOOK_PACKS: ChineseTextKnowledge[] = [
  chibiFu,
  heTangYueSe,
  guDuDeQiu,
  hongMenYan,
  baoRenAnShu,
]

const ALIASES: Record<string, string> = {
  赤壁赋: 'chibi-fu',
  前赤壁赋: 'chibi-fu',
  荷塘月色: 'he-tang-yue-se',
  故都的秋: 'gu-du-de-qiu',
  鸿门宴: 'hong-men-yan',
  报任安书: 'bao-ren-an-shu',
  报任少卿书: 'bao-ren-an-shu',
}

export function searchTextbook(topic: string): SourcedChunk[] {
  const s = (topic || '').replace(/\s+/g, '')
  let hit: ChineseTextKnowledge | null = null
  for (const [alias, id] of Object.entries(ALIASES)) {
    if (s.includes(alias)) {
      hit = TEXTBOOK_PACKS.find((t) => t.id === id) || null
      break
    }
  }
  if (!hit) hit = TEXTBOOK_PACKS.find((t) => s.includes(t.title)) || null
  if (!hit) return []
  return packToChunks(hit, 'textbook', `教材精校·《${hit.title}》`, 1)
}

export function lookupTextbookPack(topic: string): ChineseTextKnowledge | null {
  const chunks = searchTextbook(topic)
  if (!chunks.length) return null
  const title = chunks[0].topic
  return TEXTBOOK_PACKS.find((t) => t.title === title) || null
}

export function packToChunks(
  hit: ChineseTextKnowledge,
  source: SourcedChunk['source'],
  source_label: string,
  confidence: number,
): SourcedChunk[] {
  const chunks: SourcedChunk[] = []
  hit.excerpts.forEach((ex, i) => {
    chunks.push({
      id: `${hit.id}-ex-${i}`,
      kind: 'original_text',
      content: ex.text,
      meta: { label: ex.label, title: hit.title, author: hit.author },
      source,
      source_label,
      confidence,
      topic: hit.title,
    })
  })
  hit.annotation.实词.forEach((w, i) => {
    chunks.push({
      id: `${hit.id}-shi-${i}`,
      kind: 'annotation',
      content: `${w.word}：${w.meaning}`,
      meta: { word: w.word, meaning: w.meaning, example: w.example, pos: '实词' },
      source,
      source_label: `${source_label}·实词`,
      confidence,
      topic: hit.title,
    })
  })
  hit.annotation.虚词.forEach((w, i) => {
    chunks.push({
      id: `${hit.id}-xu-${i}`,
      kind: 'annotation',
      content: `${w.word}：${w.usage}`,
      meta: { word: w.word, meaning: w.usage, example: w.example || '', pos: '虚词' },
      source,
      source_label: `${source_label}·虚词`,
      confidence,
      topic: hit.title,
    })
  })
  chunks.push({
    id: `${hit.id}-bg`,
    kind: 'author_background',
    content: hit.background,
    meta: {
      author: hit.author,
      dynasty: hit.dynasty || '',
      bullets: (hit.background_bullets || []).join('｜'),
    },
    source,
    source_label: `${source_label}·背景`,
    confidence,
    topic: hit.title,
  })
  hit.exam_points.forEach((e, i) => {
    chunks.push({
      id: `${hit.id}-exam-${i}`,
      kind: 'exam_point',
      content: e,
      source,
      source_label: `${source_label}·考点`,
      confidence,
      topic: hit.title,
    })
  })
  ;(hit.key_sentences || []).forEach((k, i) => {
    chunks.push({
      id: `${hit.id}-ks-${i}`,
      kind: 'teaching_resource',
      content: `${k.text}｜手法：${k.technique}｜效果：${k.effect}`,
      meta: { text: k.text, technique: k.technique, effect: k.effect },
      source,
      source_label: `${source_label}·手法`,
      confidence,
      topic: hit.title,
    })
  })
  return chunks
}
