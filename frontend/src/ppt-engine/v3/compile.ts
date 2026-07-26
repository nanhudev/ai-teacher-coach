import type { PptDesign, EngineSlide, SlideType, DesignScore } from '../../components/ppt/types'
import { TEMPLATE_META, normalizeTemplateId } from '../../components/ppt/types'
import type { SlideDsl, SlidePlan, ChartSpec } from './types'

function scorePlan(slides: EngineSlide[]): DesignScore {
  const types = new Set(slides.map((s) => s.type))
  const hasQ = slides.some((s) => s.type === 'question')
  const hasA = slides.some((s) => s.type === 'activity')
  const hasChart = slides.some((s) => s.chart)
  const visual = Math.min(30, 14 + types.size * 2 + (hasChart ? 4 : 0))
  const pedagogy = 10 + (hasQ ? 8 : 0) + (hasA ? 6 : 0) + 4
  const density = 18
  const interaction = Math.min(20, 8 + slides.filter((s) => s.interaction).length * 4)
  const issues: string[] = []
  const suggestions: string[] = []
  if (!hasChart && slides.some((s) => s.type === 'chart')) {
    /* noop */
  }
  if (!hasQ) issues.push('缺少问题导入')
  if (!hasA) suggestions.push('可再加强互动页')
  return {
    total: Math.min(100, visual + pedagogy + density + interaction),
    visual,
    pedagogy,
    density,
    interaction,
    issues,
    suggestions,
  }
}

function mapType(t: string): SlideType {
  if (t === 'chart') return 'chart'
  const allowed: SlideType[] = [
    'cover',
    'opening',
    'question',
    'concept',
    'image_text',
    'timeline',
    'comparison',
    'process',
    'activity',
    'summary',
    'homework',
    'chart',
  ]
  return (allowed.includes(t as SlideType) ? t : 'concept') as SlideType
}

const COMP: Record<string, string> = {
  cover: 'CoverSlide',
  opening: 'CoverSlide',
  question: 'QuestionSlide',
  concept: 'ConceptSlide',
  image_text: 'ImageTextSlide',
  timeline: 'TimelineSlide',
  comparison: 'ComparisonSlide',
  process: 'ProcessSlide',
  activity: 'ActivitySlide',
  summary: 'SummarySlide',
  homework: 'HomeworkSlide',
  chart: 'ChartSlide',
}

/** SlideRenderer：DSL → 预览引擎结构 */
export function compilePlan(plan: SlidePlan): PptDesign {
  const tid = normalizeTemplateId(plan.design.template_id)
  const slides: EngineSlide[] = plan.slides.map((s: SlideDsl, i) => {
    const type = mapType(s.slide_type)
    const chart: ChartSpec | undefined = s.chart
    return {
      id: i + 1,
      type,
      component: COMP[type] || 'ConceptSlide',
      purpose: s.purpose,
      title: s.title,
      subtitle: s.subtitle,
      key_message: s.key_message,
      bullets: s.bullets,
      left: s.left,
      right: s.right,
      steps: s.steps,
      interaction: s.interaction,
      closing: s.closing,
      layout: s.layout === 'hero_visual' ? 'full' : s.layout === 'centered' ? 'centered' : 'full',
      minutes_hint: s.minutes_hint,
      chart,
      visual_prompt: s.visual_prompt,
    }
  })

  return {
    template_id: tid,
    template_name: TEMPLATE_META[tid]?.name || plan.design.style,
    title: plan.title,
    learning_objective: plan.learning_objective,
    total_minutes: plan.total_minutes,
    slides,
    design_score: scorePlan(slides),
    engine: 'ppt-design-engine-v3',
    design_system: plan.design,
    course_brief: plan.brief,
  }
}
