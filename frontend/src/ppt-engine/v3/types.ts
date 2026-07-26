/** PPT Engine V3 — Slide DSL + 学科理解 */

export type SubjectCategory = 'humanities' | 'math' | 'stem' | 'primary' | 'general'

export type DesignSystemId =
  | 'museum_story'
  | 'math_precision'
  | 'stem_visual'
  | 'primary_colorful'
  | 'academic_minimal'
  | 'modern_classroom'

export type ChartSpec =
  | {
      kind: 'function'
      expression: 'x2' | 'sin' | 'linear' | 'exp'
      label: string
      tangent_at?: number
      x_min?: number
      x_max?: number
    }
  | {
      kind: 'bars'
      label: string
      categories: string[]
      values: number[]
    }
  | {
      kind: 'fraction_pie'
      label: string
      numerator: number
      denominator: number
    }

export type CourseBrief = {
  subject: string
  grade: string
  topic: string
  category: SubjectCategory
  teaching_style: string
  recommended_visual_language: string
  difficulty: string
  key_concepts: string[]
  common_mistakes: string[]
  knowledge_points: string[]
}

export type DesignSystem = {
  id: DesignSystemId
  style: string
  /** maps to existing preview/export theme */
  template_id: string
  color_palette: string[]
  font_pair: string
  image_style: string
  layout_rule: string
  rhythm: string
}

export type DslElement =
  | { type: 'text'; max_words?: number; role?: 'title' | 'key' | 'body' }
  | { type: 'bullets'; max?: number }
  | { type: 'chart'; data: ChartSpec }
  | { type: 'timeline' }
  | { type: 'comparison' }
  | { type: 'steps' }

export type SlideDsl = {
  slide_type: string
  title: string
  purpose: string
  layout: 'hero_visual' | 'split' | 'full' | 'centered' | 'timeline' | 'comparison'
  elements: DslElement[]
  subtitle?: string
  key_message?: string
  bullets?: string[]
  left?: string[]
  right?: string[]
  steps?: { label: string; detail?: string }[]
  interaction?: string
  closing?: string
  minutes_hint?: number
  chart?: ChartSpec
  visual_prompt?: string
}

export type SlidePlan = {
  title: string
  learning_objective: string
  total_minutes: number
  design: DesignSystem
  brief: CourseBrief
  slides: SlideDsl[]
}
