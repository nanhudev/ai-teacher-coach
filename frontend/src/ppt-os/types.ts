/** PPT OS V3 — 公开课视觉叙事策划 */

export type AnalysisCard = { word: string; effect: string }

export type PlannedSlide = {
  slide_number: number
  section: string
  type:
    | 'cover'
    | 'question'
    | 'question_card'
    | 'quote_analysis'
    | 'image_scene'
    | 'text_analysis'
    | 'quote'
    | 'process'
    | 'activity'
    | 'comparison'
    | 'summary'
    | 'homework'
    | 'timeline'
    | 'concept'
  layout: string
  title: string
  subtitle?: string
  main_question?: string
  text_excerpt?: string
  analysis_cards?: AnalysisCard[]
  bullets?: string[]
  left?: string[]
  right?: string[]
  steps?: { label: string; detail?: string }[]
  key_message?: string
  slide_goal: string
  teacher_action: string
  student_action: string
  curriculum_goal?: string
  visual_prompt?: string
  source_reference?: string
  closing?: string
  minutes_hint?: number
}

export type PptPlan = {
  topic: string
  template_id: string
  template_name: string
  learning_objective: string
  slides: PlannedSlide[]
  engine: 'ppt-os-v2' | 'ppt-os-v3'
}
