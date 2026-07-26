import type { DemoSession } from '../../types/demo'
import { understandCourse } from './understand'
import { directVisual } from './visualDirector'
import { planSlides } from './slidePlanner'
import { compilePlan } from './compile'
import { buildStandardLesson } from '../../lesson-engine/buildLesson'

export type GenerateInput = {
  course: string
  subject?: string
  grade?: string
  knowledge_points?: string[]
  template_id?: string
  case_id?: string
  mode?: 'full' | 'lesson' | 'ppt'
}

/** 任意课程 → V3 全链路（静态站本地引擎） */
export function buildSessionFromCourse(input: GenerateInput): DemoSession {
  const mode = input.mode || 'full'
  const brief = understandCourse({
    course: input.course,
    subject: input.subject,
    grade: input.grade,
    knowledge_points: input.knowledge_points,
  })
  const design = directVisual(brief, input.template_id === 'auto' ? undefined : input.template_id)
  const plan = planSlides(brief, design)
  const ppt = compilePlan(plan)
  const lesson = buildStandardLesson(brief)
  const objectives = brief.key_concepts.slice(0, 3)

  return {
    guest: true,
    role_type: 'k12',
    case_id: input.case_id || `gen-${brief.category}`,
    generated: true,
    mode,
    meta: {
      label: `${brief.grade}${brief.subject} · ${brief.topic}`,
      subject: brief.subject,
      grade: brief.grade,
      period_count: 1,
      knowledge_points: brief.knowledge_points,
    },
    knowledge_injected: {
      template: {
        subject: brief.subject,
        stages: [
          { stage: '导入', intent: '情境/问题' },
          { stage: '探究', intent: '概念可视化' },
          { stage: '练习', intent: '活动与纠错' },
          { stage: '总结', intent: '迁移巩固' },
        ],
      },
      pedagogy_rule_names: ['constructivism', 'scaffolding', 'bloom_taxonomy'],
    },
    director: {
      course: brief.topic,
      subject: brief.subject,
      grade: brief.grade,
      course_type: brief.category,
      recommended_theories: [
        { name: '建构主义', reason: '以问题与表征驱动意义建构' },
        { name: '支架式教学', reason: '降低抽象概念门槛' },
      ],
      teaching_strategy: [{ name: brief.teaching_style, reason: brief.recommended_visual_language }],
      learning_objectives: objectives,
      student_difficulties: brief.common_mistakes,
      teaching_mode: '问题探究',
      stage_template: brief.category,
      stages: [
        { stage: '导入', intent: '问题/情境', theory: '建构主义' },
        { stage: '展开', intent: '概念与表征', theory: '支架式教学' },
        { stage: '活动', intent: '练习与纠错', theory: '掌握学习' },
        { stage: '收束', intent: '总结迁移', theory: '认知主义' },
      ],
    },
    lesson,
    objective_alignment: {
      score: 90,
      summary: '目标—活动—表征一致；学科视觉语言已嵌入课件。',
      checks: objectives.map((o) => ({
        objective: o,
        supported_by: ['导入主问题', '新知探究', '分层练习', '出口票'],
        aligned: true,
      })),
      issues: [],
      suggestions: ['可根据班级学情增减练习时长'],
    },
    ppt,
    before_after: {
      before: {
        title: '常见旧课件/教案问题',
        issues: [
          { label: '文字堆砌', detail: '把讲稿贴进幻灯片或教案' },
          { label: '缺少学科表征', detail: '数学无图像、历史无时间线' },
          { label: '作业未分层', detail: '无法对接中高考差异学情' },
        ],
      },
      after: {
        title: 'AI Teacher Coach',
        improvements: [
          { label: '标准教案可导出', detail: '三维目标 + 过程表 + 分层作业' },
          { label: '学科自动识别', detail: `${brief.category} · ${design.id}` },
          { label: '课件可独立生成', detail: 'PPT / 教案分流' },
        ],
      },
    },
    personas: [
      {
        id: 'p1',
        name: '阿哲',
        level: 'struggling',
        personality: '基础薄弱，需要支架',
        knowledge_gap: brief.common_mistakes.slice(0, 1),
        question_style: '追问字面',
        memory: { unresolved: [], resolved: [], understanding: {} },
      },
      {
        id: 'p2',
        name: '小林',
        level: 'medium',
        personality: '能跟上但表达慢',
        knowledge_gap: brief.key_concepts.slice(0, 1),
        question_style: '追问原因',
        memory: { unresolved: [], resolved: [], understanding: {} },
      },
      {
        id: 'p3',
        name: '思远',
        level: 'excellent',
        personality: '喜欢迁移追问',
        knowledge_gap: ['想把概念连到现实'],
        question_style: '深度追问',
        memory: { unresolved: [], resolved: [], understanding: {} },
      },
    ],
    simulation_turns: [
      {
        persona_id: 'p1',
        question: `老师，关于「${brief.key_concepts[0] || brief.topic}」我还是有点懵，能再举个例子吗？`,
        sample_answer: '先肯定，再用一个生活例子搭支架，最后请学生用自己的话复述。',
        understanding_delta: {
          gap: brief.common_mistakes[0] || '概念不清',
          from: '未理解',
          to: '部分理解',
          note: '需要再练一题巩固',
        },
      },
      {
        persona_id: 'p2',
        question: `如果把「${brief.key_concepts[1] || brief.topic}」换成另一个情境，还成立吗？`,
        sample_answer: '引导学生迁移：不变的是结构，变的是表象。',
        understanding_delta: {
          gap: '迁移不足',
          from: '未解决',
          to: '部分理解',
          note: '可板书对照表',
        },
      },
      {
        persona_id: 'p3',
        question: `这个想法在今天的生活里怎么用？边界在哪里？`,
        sample_answer: '鼓励批判性思考，区分适用条件与误用。',
        understanding_delta: {
          gap: '深度迁移',
          from: '未解决',
          to: '深化理解',
          note: '已能做价值辨别',
        },
      },
    ],
    evaluation: {
      total_score: 88,
      scores: [
        { id: 'objectives', name: '教学目标', score: 18, max: 20 },
        { id: 'design', name: '教学设计', score: 18, max: 20 },
        { id: 'interaction', name: '课堂互动', score: 17, max: 20 },
        { id: 'expression', name: '知识表达', score: 18, max: 20 },
        { id: 'formative', name: '形成性评价', score: 17, max: 20 },
      ],
      strengths: ['标准教案结构完整', '学科视觉语言匹配', '分层作业对接考情'],
      issues: ['可根据课时再压缩页数'],
      suggestions: ['公开课可再加强出口票证据'],
    },
  }
}

/** @deprecated 案例以 knowledge/chinese 为准 */
export const PRESET_COURSES = [
  { course: '赤壁赋', subject: '语文', grade: '高中', knowledge_points: ['景情理', '旷达'] },
  { course: '荷塘月色', subject: '语文', grade: '高中', knowledge_points: ['通感', '情感变化'] },
  { course: '故都的秋', subject: '语文', grade: '高中', knowledge_points: ['清静悲凉', '对比'] },
  { course: '鸿门宴', subject: '语文', grade: '高中', knowledge_points: ['人物刻画', '叙事'] },
] as const
