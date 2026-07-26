/** Course Blueprint — 全 Agent 共享的课程蓝图 */

export type BlueprintCategory =
  | 'humanities'
  | 'math'
  | 'stem'
  | 'primary'
  | 'english'
  | 'university'
  | 'general'

export type CourseBlueprint = {
  version: 'ultimate-1'
  raw_input: string
  course: {
    subject: string
    grade: string
    topic: string
    difficulty: 'easy' | 'medium' | 'hard'
    category: BlueprintCategory
    knowledge_type: string
  }
  learning_objectives: string[]
  knowledge_structure: string[]
  common_mistakes: string[]
  pedagogy: { name: string; use: string }[]
  lesson_flow: { stage: string; intent: string; theory: string; minutes: number }[]
  visual_direction: {
    template: string
    design_system_id: string
    style: string
    layout_rule: string
    image_style: string
    rhythm: string
  }
  assessment_strategy: string[]
  exercises: {
    basic: string[]
    advanced: string[]
    open: string[]
  }
  classroom_activities: string[]
}

export type PipelineStepId =
  | 'understand'
  | 'director'
  | 'lesson'
  | 'visual'
  | 'ppt'
  | 'exercise'
  | 'simulation'
  | 'evaluation'
  | 'export_ready'
  | 'complete'

export type PipelineProgress = {
  step: PipelineStepId
  status: 'running' | 'done' | 'error'
  message: string
  progress: number
  preview?: Record<string, unknown>
}
