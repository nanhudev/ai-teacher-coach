import type { ChineseTextBrief } from '../chinese/textAgent'
import type { PptDesign } from '../components/ppt/types'
import { planChinesePpt } from './planningAgent'
import { pickVisualSystem } from './visualAgent'
import { attachAssets } from './assetAgent'
import { renderPlanToEngine } from './renderToEngine'
import { scorePptOs } from './qualityAgent'
import { directVisualStory, countBulletDumps } from './visualDirector'
import { pptSkills } from './skills'

/**
 * PPT OS V3 流水线
 * Planning → VisualDirector → Asset → Render → Quality（<90 稀疏重跑）
 */
export function runPptOs(brief: ChineseTextBrief, preferTemplate?: string): PptDesign {
  if (!brief.matched || !brief.text) {
    throw new Error('PPT OS 需要已匹配的教材 brief')
  }

  const visual = pickVisualSystem(brief, preferTemplate)
  let plan = planChinesePpt(brief, false)
  plan = { ...plan, slides: directVisualStory(plan.slides) }
  let slides = renderPlanToEngine(attachAssets(plan.slides, brief.title))
  let score = scorePptOs(slides, brief)

  if (
    score.total < pptSkills.design.rules.min_quality_score ||
    countBulletDumps(plan.slides) > 0
  ) {
    plan = planChinesePpt(brief, true)
    plan = { ...plan, slides: directVisualStory(plan.slides) }
    slides = renderPlanToEngine(attachAssets(plan.slides, brief.title))
    score = scorePptOs(slides, brief)
  }

  return {
    template_id: visual.template_id,
    template_name: visual.template_name,
    title: brief.title,
    learning_objective: plan.learning_objective,
    total_minutes: slides.reduce((a, s) => a + (s.minutes_hint || 3), 0),
    slides,
    design_score: score,
    engine: 'ppt-os-v3',
    course_brief: {
      topic: brief.title,
      author: brief.author,
      kind: brief.text.kind,
      skills: ['chinese_literature', 'public_lesson', 'visual_narrative'],
    },
  }
}
