export type TheoryRef = { name: string; reason: string }

export type DirectorBrief = {
  course: string
  subject: string
  grade: string
  course_type: string
  recommended_theories: TheoryRef[]
  teaching_strategy: TheoryRef[]
  learning_objectives: string[]
  student_difficulties: string[]
  teaching_mode: string
  stage_template: string
  stages: { stage: string; intent: string; theory: string }[]
  research_brief?: {
    central_problem?: string
    academic_tensions?: string[]
    common_misreadings?: string[]
    comparative_reading?: string[]
    curriculum_basis?: string[]
    advanced_insights?: string[]
  }
}

export type LessonPlan = {
  title: string
  objectives: string[]
  key_points: string[]
  difficulty_points: string[]
  process: {
    stage: string
    teacher_action: string
    student_action: string
    theory: string
    time: string
    intent?: string
  }[]
  activities: string[]
  assessment: string[]
  /** 中学标准字段 */
  lesson_type?: string
  periods?: string
  subject?: string
  grade?: string
  textbook_analysis?: string
  student_analysis?: string
  objectives_3d?: {
    knowledge: string[]
    process: string[]
    values: string[]
  }
  materials?: string[]
  methods?: string[]
  board_design?: string
  homework?: {
    basic: string[]
    advanced: string[]
    extension: string[]
  }
  exam_link?: {
    exam_type: string
    points: string[]
    question_types: string[]
    tips: string[]
  }
  reflection_prompt?: string
}

export type ObjectiveAlignment = {
  score: number
  summary: string
  checks: {
    objective: string
    supported_by: string[]
    aligned: boolean
    note?: string
  }[]
  issues: string[]
  suggestions: string[]
}

export type PptDesign = {
  template_id: string
  template_name: string
  title?: string
  learning_objective?: string
  total_minutes?: number
  slides: Record<string, unknown>[]
  design_score?: {
    total: number
    visual: number
    pedagogy: number
    density: number
    interaction: number
    issues: string[]
    suggestions: string[]
  }
  engine?: string
}

export type PersonaLevel = 'basic' | 'average' | 'advanced'

export type LearningState = {
  knowledge_gap: string[]
  understood: string[]
  confused: string[]
}

export type Persona = {
  id: string
  name: string
  /** basic=基础型 average=普通型 advanced=优秀型 */
  level: PersonaLevel | string
  personality: string
  knowledge_gap: string[]
  question_style: string
  learning_state?: LearningState
  /** 本场固定 3 问（课程绑定） */
  question_bank?: string[]
  sample_answers?: string[]
  memory: {
    unresolved: string[]
    resolved: string[]
    understanding: Record<string, string>
  }
}

export type PedagogyAnalysis = {
  constructivism: string
  scaffolding: string
  formative: string
}

export type TeacherResponseAnalysis = {
  score: number
  /** 五维评分（可选，DeepSeek / 本地规则） */
  scores?: {
    knowledge_accuracy: number
    clarity: number
    responds_student: number
    guides_thinking: number
    pedagogy: number
  }
  strengths: string[]
  problems: string[]
  suggestion: string
  pedagogy_analysis: PedagogyAnalysis
  /** 是否引用了课文证据 */
  cited_text: boolean
  source?: 'local' | 'deepseek'
}

export type SimTurn = {
  persona_id: string
  /** 该学生第几问 1–3；旧数据可缺省 */
  round?: number
  question: string
  sample_answer: string
  understanding_delta: {
    gap: string
    from: string
    to: string
    note: string
  }
  /** 提交后由分析器写入 */
  analysis?: TeacherResponseAnalysis
}

export type ClassroomSimReport = {
  total_score: number
  completed_rounds: number
  total_rounds: number
  by_persona: {
    persona_id: string
    name: string
    level: string
    avg_score: number
    understood: string[]
    still_confused: string[]
  }[]
  strengths: string[]
  problems: string[]
  suggestions: string[]
  summary: string
}

export type Evaluation = {
  total_score: number
  scores: { id: string; name: string; score: number; max: number }[]
  strengths: string[]
  issues: string[]
  suggestions: string[]
}

export type BeforeAfter = {
  before: { title: string; issues: { label: string; detail: string }[] }
  after: { title: string; improvements: { label: string; detail: string }[] }
}

export type DemoSession = {
  guest: boolean
  role_type: string
  case_id: string
  generated?: boolean
  /** 本地工作区项目 id（无登录） */
  local_project_id?: string
  /** 新课标 × 任务群 × 新高考依据（给老师看摘要，不堆文件） */
  curriculum_alignment?: import('../chinese/curriculumAgent').CurriculumAlignment
  gaokao_value?: import('../chinese/gaokaoAgent').GaokaoExamValue
  curriculum_review?: import('../chinese/curriculumReviewer').CurriculumReview
  /** full=完整流；lesson=只教案；ppt=只课件 */
  mode?: 'full' | 'lesson' | 'ppt'
  /** Ultimate：全 Agent 共享蓝图 */
  blueprint?: import('../pipeline/types').CourseBlueprint
  meta: {
    label: string
    subject: string
    grade: string
    period_count: number
    knowledge_points: string[]
  }
  knowledge_injected: {
    template: { subject: string; stages: { stage: string; intent: string }[] }
    pedagogy_rule_names: string[]
  }
  director: DirectorBrief
  lesson: LessonPlan
  /** 教案磨课版本（V1 起） */
  lesson_version?: number
  /** 历史版本（不含当前） */
  lesson_history?: LessonRevisionRecord[]
  /** 最近一次修订摘要 */
  last_revision?: {
    request: string
    change_summary: string[]
    revision_summary: { before: string; after: string; reason: string }[]
    teaching_improvement: string[]
  }
  /** 教师磨课意图（驱动全课同步） */
  teacher_intent?: string
  /** 最近一次影响分析 */
  last_impact?: {
    teacher_intent: string
    affected_modules: string[]
    untouched_modules: string[]
    reasons: Record<string, string>
  }
  objective_alignment: ObjectiveAlignment
  ppt: PptDesign
  before_after: BeforeAfter
  personas: Persona[]
  simulation_turns: SimTurn[]
  /** 模拟课堂上下文（问题绑定课文） */
  sim_context?: {
    title: string
    author: string
    keywords: string[]
    excerpts: string[]
    stage: string
  }
  /** 9 轮结束后的课堂问答能力报告 */
  classroom_sim_report?: ClassroomSimReport
  evaluation: Evaluation
}

/** 教案迭代版本记录 */
export type LessonRevisionRecord = {
  version: number
  parent_version: number
  request: string
  change_summary: string[]
  lesson: LessonPlan
  created_at: string
}

export type CaseSummary = {
  id: string
  label: string
  subject: string
  grade: string
  knowledge_points: string[]
}
