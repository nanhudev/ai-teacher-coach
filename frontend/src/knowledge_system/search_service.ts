import type { SourcedChunk } from './types'
import { AUTHOR_REGISTRY, PEDAGOGY_CHUNKS } from './chinese_knowledge/seeds'
import { searchTextbook } from './sources/textbook'
import { searchCurated } from './sources/curated'
import { searchTeacherUpload } from './sources/teacher_upload'

const BASE =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE) ||
  '/api/v1'

/**
 * Search Service
 * 优先级：国家课标约束（Agent 层）→ 教材精校 → 教师上传 → 权威公开语料 → 教研方法
 * 联网默认关闭；结果须 Verifier 审核，禁止直通生成
 */
export async function searchKnowledge(topic: string, opts?: { allowInternet?: boolean }): Promise<SourcedChunk[]> {
  const chunks: SourcedChunk[] = []

  chunks.push(...searchTextbook(topic))
  chunks.push(...searchTeacherUpload(topic))
  chunks.push(...searchCurated(topic))
  chunks.push(...searchPedagogy(topic))
  chunks.push(...searchAuthorRegistry(topic))

  if (opts?.allowInternet) {
    const net = await searchInternetGated(topic)
    chunks.push(...net)
  }

  return dedupe(chunks)
}

/** 同步检索（Demo 主路径，默认不开联网） */
export function searchKnowledgeSync(topic: string): SourcedChunk[] {
  return dedupe([
    ...searchTextbook(topic),
    ...searchTeacherUpload(topic),
    ...searchCurated(topic),
    ...searchPedagogy(topic),
    ...searchAuthorRegistry(topic),
  ])
}

function searchPedagogy(topic: string): SourcedChunk[] {
  const classical = /记$|说$|赋$|序$|表$|书$|劝学|出师|兰亭|鸿门|赤壁|文言/.test(topic)
  const bag = classical
    ? [...PEDAGOGY_CHUNKS.文言方法, ...PEDAGOGY_CHUNKS.公开课, ...PEDAGOGY_CHUNKS.核心素养]
    : [...PEDAGOGY_CHUNKS.散文方法, ...PEDAGOGY_CHUNKS.公开课, ...PEDAGOGY_CHUNKS.核心素养]
  return bag.map((c) => ({ ...c, topic }))
}

function searchAuthorRegistry(topic: string): SourcedChunk[] {
  const s = topic.replace(/\s+/g, '')
  const key = Object.keys(AUTHOR_REGISTRY).find((k) => s.includes(k))
  if (!key) return []
  const a = AUTHOR_REGISTRY[key]
  return [
    {
      id: `author-${key}`,
      kind: 'author_background',
      content: `${a.author}${a.dynasty ? ` · ${a.dynasty}` : ''}：${a.note}`,
      meta: { author: a.author, dynasty: a.dynasty || '', works: a.works.join('、') },
      source: 'curated',
      source_label: '文学常识·作者时代',
      confidence: 0.9,
      topic: key,
    },
  ]
}

/** 联网：只走后端，且结果标 internet + 低置信 */
async function searchInternetGated(topic: string): Promise<SourcedChunk[]> {
  try {
    const res = await fetch(`${BASE}/knowledge/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, subject: '高中语文' }),
    })
    if (!res.ok) return []
    const data = (await res.json()) as { chunks?: SourcedChunk[] }
    return (data.chunks || []).map((c) => ({
      ...c,
      source: 'internet',
      source_label: c.source_label || '互联网资料',
      confidence: Math.min(c.confidence ?? 0.55, 0.7),
    }))
  } catch {
    return []
  }
}

function dedupe(chunks: SourcedChunk[]) {
  const seen = new Set<string>()
  return chunks.filter((c) => {
    const k = `${c.kind}|${c.content.slice(0, 40)}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
