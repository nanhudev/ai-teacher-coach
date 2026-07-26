import type { EngineSlide } from '../components/ppt/types'
import type { PlannedSlide } from './types'
import { pptSkills } from './skills'

const LAYOUT_MAP = pptSkills.layout.layouts as Record<
  string,
  { component: string; type: string }
>

/**
 * Renderer：Plan → EngineSlide（现有 React / Pptx 渲染层）
 */
export function renderPlanToEngine(slides: PlannedSlide[]): EngineSlide[] {
  return slides.map((s, i) => {
    const layout = LAYOUT_MAP[s.layout] || LAYOUT_MAP.literature_card
    const steps =
      s.analysis_cards?.map((c) => ({ label: c.word, detail: c.effect })) ||
      s.steps

    const slide: EngineSlide = {
      id: i + 1,
      type: (layout.type || s.type) as EngineSlide['type'],
      component: layout.component,
      title: s.title,
      subtitle: s.subtitle,
      key_message: s.key_message || s.text_excerpt,
      bullets: s.bullets,
      steps,
      left: (s as PlannedSlide & { left?: string[] }).left,
      right: (s as PlannedSlide & { right?: string[] }).right,
      purpose: s.slide_goal,
      interaction: `学生：${s.student_action}`,
      closing: s.closing || `教师：${s.teacher_action}`,
      curriculum_goal: s.curriculum_goal,
      student_task: s.student_action,
      teacher_guidance: s.teacher_action,
      text_evidence: s.text_excerpt,
      visual_prompt: s.visual_prompt,
      source_reference: s.source_reference,
      minutes_hint: s.minutes_hint,
      slide_goal: s.slide_goal,
      main_question: s.main_question,
      analysis_cards: s.analysis_cards,
    }
    return slide
  })
}
