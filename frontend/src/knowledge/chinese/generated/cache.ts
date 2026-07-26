import type { ChineseTextKnowledge } from '../types'
import { parseChineseInput, slugifyTitle, type ParsedChineseInput } from '../parseInput'
import { SEED_GENERATED } from './seeds'

const STORAGE_KEY = 'aiteacher.chinese.generated.v2'

type Store = Record<string, ChineseTextKnowledge>

function readStore(): Store {
  try {
    if (typeof localStorage === 'undefined') return {}
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Store
  } catch {
    return {}
  }
}

function writeStore(store: Store) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* quota / private mode */
  }
}

/** 种子包 + localStorage 已生成包 */
export function lookupGeneratedText(input: string): ChineseTextKnowledge | null {
  const parsed = parseChineseInput(input)
  const id = slugifyTitle(parsed.title)

  const seed = SEED_GENERATED.find(
    (t) => t.id === id || t.title === parsed.title || input.replace(/\s+/g, '').includes(t.title),
  )
  if (seed) return { ...seed, source: seed.source || 'ai_generated' }

  const store = readStore()
  if (store[id]) return { ...store[id], source: 'cached', confidence: store[id].confidence ?? 0.8 }
  for (const t of Object.values(store)) {
    if (parsed.title && (t.title === parsed.title || parsed.title.includes(t.title))) {
      return { ...t, source: 'cached' }
    }
  }
  return null
}

export function saveGeneratedText(text: ChineseTextKnowledge) {
  const store = readStore()
  store[text.id] = { ...text, source: text.source || 'ai_generated' }
  writeStore(store)
}

export function listGeneratedCases() {
  return SEED_GENERATED.map((t) => ({
    id: t.id,
    label: `AI教学包 · 《${t.title}》`,
    subject: '语文',
    grade: '高中',
    knowledge_points: t.exam_points.slice(0, 3),
    oneLiner: `高中语文 ${t.unit} ${t.title}`,
    source: 'ai_generated' as const,
  }))
}

export type { ParsedChineseInput }
