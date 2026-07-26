import type { ChineseTextKnowledge } from './types'
import { parseChineseInput } from './parseInput'

/**
 * 清洗：去掉拉丁文占位、内部枚举泄漏
 * 注：教学包组装已迁至 knowledge_system（RAG），此处只做后处理
 */
export function sanitizePack(pack: ChineseTextKnowledge): ChineseTextKnowledge {
  const p = JSON.parse(JSON.stringify(pack)) as ChineseTextKnowledge
  if (!p.author || /TBD|TODO|unknown/i.test(p.author)) {
    p.author = '（请核对教材）'
  }
  if (p.dynasty && /classical|modern/i.test(p.dynasty)) {
    p.dynasty = p.kind === 'modern_prose' ? '现代' : '（据教材核对）'
  }
  p.stacked_words = (p.stacked_words || []).filter((w) => !isLatinLeak(w.word + w.effect))
  p.scenery_layers = (p.scenery_layers || []).filter((s) => !isLatinLeak(s))
  p.emotion_arc = (p.emotion_arc || []).filter((a) => !isLatinLeak(a.stage + a.detail))
  p.literary_features = (p.literary_features || []).filter((s) => !isLatinLeak(s))
  p.structure = (p.structure || []).filter((s) => !isLatinLeak(s.part + s.content))
  if (!p.scenery_layers.length && p.structure.length) {
    p.scenery_layers = p.structure.map((s) => s.part)
  }
  if (!p.emotion_arc.length && p.structure.length) {
    p.emotion_arc = p.structure.map((s) => ({ stage: s.part, detail: s.content }))
  }
  if (!p.stacked_words.length && p.annotation?.实词?.length) {
    p.stacked_words = p.annotation.实词.slice(0, 5).map((w) => ({
      word: w.word,
      effect: w.meaning,
    }))
  }
  return p
}

function isLatinLeak(s: string) {
  if (!s) return true
  if (
    /word\d|key\d|pre-class|tongjia|decode|transfer|overview|evidence|inquire|lead-in|first.?read|close.?read|TBD|TODO|Please |What |Which |High-school|classical expression|argument structure/i.test(
      s,
    )
  )
    return true
  const letters = (s.match(/[A-Za-z]/g) || []).length
  return letters >= 4 && letters / Math.max(1, s.length) > 0.45
}

export function looksLikeChineseLesson(oneLiner: string) {
  const s = oneLiner || ''
  if (/语文/.test(s)) return true
  if (/《.+》/.test(s)) return true
  const parsed = parseChineseInput(s)
  if (parsed.title && parsed.title !== '未命名课文') {
    if (s.replace(/\s+/g, '').length <= 20) return true
  }
  return false
}
