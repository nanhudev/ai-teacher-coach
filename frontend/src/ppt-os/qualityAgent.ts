import type { ChineseTextBrief } from '../chinese/textAgent'
import type { DesignScore, EngineSlide } from '../components/ppt/types'
import { hasLatinLeak } from '../chinese/displayLabels'
import { pptSkills } from './skills'

/**
 * QualityCheckAgent V3 — 惩罚 bullet 提纲，要求视觉叙事页
 */
export function scorePptOs(slides: EngineSlide[], brief: ChineseTextBrief): DesignScore {
  const kb = brief.text
  const issues: string[] = []
  const suggestions: string[] = []
  const joined = slides
    .map((s) =>
      [
        s.title,
        s.key_message,
        s.main_question,
        s.text_evidence,
        ...(s.bullets || []),
        ...(s.steps || []).map((x) => x.detail || ''),
        ...(s.analysis_cards || []).map((c) => c.word + c.effect),
      ].join(''),
    )
    .join('')

  let content = 20
  if (kb) {
    const needles = [
      kb.excerpts?.[0]?.text?.slice(0, 6),
      kb.excerpts?.[1]?.text?.slice(0, 6),
      kb.key_sentences?.[0]?.text?.slice(0, 6),
      ...(kb.stacked_words || []).map((w) => w.word),
    ].filter(Boolean) as string[]
    const hit = needles.filter((n) => joined.includes(n)).length
    content += Math.min(25, hit * 6)
    if (hit < 2) {
      issues.push('原文证据不足')
      suggestions.push('至少两处关键原文上台')
    }
  } else {
    content = 10
    issues.push('未绑定教材')
  }

  let teaching = 15
  const withGoal = slides.filter((s) => s.slide_goal || s.purpose).length
  const withStudent = slides.filter((s) => s.student_task || s.interaction?.includes('学生')).length
  const withQ = slides.filter(
    (s) => s.type === 'question' || s.type === 'question_card' || s.main_question,
  ).length
  const narrative = slides.filter((s) =>
    ['quote_analysis', 'image_scene', 'text_analysis', 'quote', 'question_card'].includes(s.type),
  ).length
  teaching += Math.min(10, Math.floor((withGoal / slides.length) * 10))
  teaching += withQ >= 1 ? 8 : 0
  teaching += narrative >= 3 ? 12 : narrative >= 2 ? 6 : 0
  teaching += withStudent >= slides.length * 0.6 ? 5 : 2
  if (narrative < 2) {
    issues.push('视觉叙事页不足')
    suggestions.push('用 quote_analysis / question_card，勿用 bullet 提纲')
  }
  teaching = Math.min(40, teaching)

  let visual = 18
  const bulletDumps = slides.filter((s) => (s.bullets?.length || 0) >= 3).length
  if (bulletDumps) {
    issues.push(`${bulletDumps} 页仍是 bullet 提纲`)
    suggestions.push('改为大问+原文+词卡')
    visual -= bulletDumps * 8
  }
  const dense = slides.filter((s) => {
    const body = [s.key_message, ...(s.bullets || [])].join('')
    return [...body].length > pptSkills.design.rules.body_max_chars + 20
  }).length
  visual += Math.max(0, 8 - dense * 3)
  const [lo, hi] = pptSkills.design.rules.ideal_slide_count
  if (slides.length >= lo && slides.length <= hi) visual += 6
  else {
    issues.push('页数偏离公开课节奏')
    suggestions.push(`建议 ${lo}-${hi} 页`)
  }
  visual = Math.max(0, Math.min(30, visual))

  const leak = slides.some((s) =>
    hasLatinLeak([s.title, s.key_message, ...(s.bullets || [])].join(' ')),
  )
  if (leak) {
    issues.push('出现英文/内部字段')
    suggestions.push('全部中文展示')
    content = Math.min(content, 18)
  }

  const missingGoal = slides.filter((s) => !s.slide_goal && !s.purpose).length
  if (missingGoal) {
    issues.push(`${missingGoal} 页缺少教学目的`)
    suggestions.push('每页必须有 slide_goal')
    teaching = Math.min(teaching, 22)
  }

  const total = Math.min(100, content + teaching + visual)
  if (total < pptSkills.design.rules.min_quality_score) {
    suggestions.push('自动稀疏重排：减字、增问题、保原文、去 bullet')
  }

  return {
    total,
    visual,
    pedagogy: teaching,
    density: Math.max(0, 20 - dense * 3 - bulletDumps * 5),
    interaction: Math.min(20, withStudent),
    issues,
    suggestions,
  }
}
