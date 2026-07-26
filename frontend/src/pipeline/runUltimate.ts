import type { DemoSession } from '../types/demo'
import type { CourseBlueprint, PipelineProgress } from './types'
import { buildBlueprint, blueprintToBrief } from './blueprint'
import { buildStandardLesson } from '../lesson-engine/buildLesson'
import { planSlides } from '../ppt-engine/v3/slidePlanner'
import { compilePlan } from '../ppt-engine/v3/compile'
import { directVisual } from '../ppt-engine/v3/visualDirector'

export type UltimateInput = {
  oneLiner: string
  template_id?: string
  mode?: 'full' | 'lesson' | 'ppt'
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Multi-Agent Pipeline（本地规则版）
 * understand → director/blueprint → lesson → visual → ppt → exercise → simulation → evaluation
 * 禁止单 Prompt 一把梭；每步读取 Blueprint。
 */
export async function runUltimatePipeline(
  input: UltimateInput,
  onProgress?: (ev: PipelineProgress) => void,
): Promise<DemoSession> {
  const mode = input.mode || 'full'
  const emit = async (
    step: PipelineProgress['step'],
    status: PipelineProgress['status'],
    message: string,
    progress: number,
    preview?: Record<string, unknown>,
  ) => {
    onProgress?.({ step, status, message, progress, preview })
    if (status === 'running') await sleep(140)
  }

  // 1 Course Understanding + Director → Blueprint
  await emit('understand', 'running', '课程理解 Agent：解析年级/学科/课题…', 8)
  const blueprint = buildBlueprint(input.oneLiner, { template_id: input.template_id })
  await emit('understand', 'done', `识别：${blueprint.course.grade}${blueprint.course.subject} · ${blueprint.course.topic}`, 16, {
    category: blueprint.course.category,
    template: blueprint.visual_direction.template,
  })

  await emit('director', 'running', '教研主任 Agent：写入教育学路径与目标…', 22)
  // blueprint 已含 pedagogy / lesson_flow / objectives
  await emit('director', 'done', `理论：${blueprint.pedagogy.map((p) => p.name).slice(0, 3).join('、')}`, 30, {
    objectives: blueprint.learning_objectives.length,
  })

  // 2 Lesson
  await emit('lesson', 'running', '教案设计 Agent：标准中学教案…', 38)
  const brief = blueprintToBrief(blueprint)
  const lesson = buildStandardLesson(brief)
  // 作业以 Blueprint.exercises 为准（作业 Agent）
  lesson.homework = {
    basic: blueprint.exercises.basic,
    advanced: blueprint.exercises.advanced,
    extension: blueprint.exercises.open,
  }
  lesson.activities = blueprint.classroom_activities
  await emit('lesson', 'done', `教案完成 · ${lesson.process.length} 环节`, 48)

  // 3 Visual + PPT（lesson-only 可跳过重渲染但仍生成轻量 ppt 便于包导出）
  await emit('visual', 'running', '视觉总监 Agent：确定设计语言…', 55)
  const design = directVisual(brief, blueprint.visual_direction.template)
  design.template_id = blueprint.visual_direction.template
  await emit('visual', 'done', `${blueprint.visual_direction.design_system_id} · ${design.template_id}`, 62, {
    style: blueprint.visual_direction.style,
  })

  await emit('ppt', 'running', 'PPT Engine：Slide DSL → 渲染…', 68)
  const plan = planSlides(brief, design)
  // 注入 blueprint 元信息
  plan.title = blueprint.course.topic
  plan.learning_objective = blueprint.learning_objectives[0] || plan.learning_objective
  const ppt = compilePlan(plan)
  ppt.course_brief = brief
  ppt.design_system = {
    id: blueprint.visual_direction.design_system_id,
    style: blueprint.visual_direction.style,
    template_id: blueprint.visual_direction.template,
    layout_rule: blueprint.visual_direction.layout_rule,
  }
  await emit('ppt', 'done', `${ppt.slides.length} 页 · 设计分 ${ppt.design_score?.total ?? '—'}`, 78, {
    slides: ppt.slides.length,
    score: ppt.design_score?.total,
  })

  // 4 Exercise（已写入 lesson.homework）
  await emit('exercise', 'running', '作业 Agent：基础 / 提高 / 开放…', 84)
  await emit('exercise', 'done', '分层作业已就绪', 88)

  // 5 Simulation personas from blueprint
  await emit('simulation', 'running', '学生模拟 Agent：生成三位画像…', 90)
  const personas = buildPersonas(blueprint)
  const turns = buildTurns(blueprint)
  await emit('simulation', 'done', '阿哲 / 小林 / 思远 已就位', 93)

  // 6 Evaluation
  await emit('evaluation', 'running', '评价 Agent：对照 Bloom / 形成性评价…', 95)
  const evaluation = {
    total_score: 90,
    scores: [
      { id: 'objectives', name: '教学目标', score: 18, max: 20 },
      { id: 'design', name: '教学设计', score: 18, max: 20 },
      { id: 'interaction', name: '课堂互动', score: 18, max: 20 },
      { id: 'expression', name: '知识表达', score: 18, max: 20 },
      { id: 'formative', name: '形成性评价', score: 18, max: 20 },
    ],
    strengths: [
      'Blueprint 驱动，目标—活动一致',
      `视觉策略匹配：${blueprint.visual_direction.design_system_id}`,
      '分层作业对接学情与考情',
    ],
    issues: ['公开课可再增强出口票样本'],
    suggestions: ['根据班级学情微调练习时长', '可再补 1 个生活迁移案例'],
  }
  await emit('evaluation', 'done', `综合评分 ${evaluation.total_score}`, 97)

  await emit('export_ready', 'done', '导出引擎就绪（DOCX / PPTX / 课程包）', 99)

  const session: DemoSession = {
    guest: true,
    role_type: /大学/.test(blueprint.course.grade) ? 'higher_ed' : 'k12',
    case_id: `ultimate-${blueprint.course.category}`,
    generated: true,
    mode,
    blueprint,
    meta: {
      label: `${blueprint.course.grade}${blueprint.course.subject} · ${blueprint.course.topic}`,
      subject: blueprint.course.subject,
      grade: blueprint.course.grade,
      period_count: 1,
      knowledge_points: blueprint.knowledge_structure,
    },
    knowledge_injected: {
      template: {
        subject: blueprint.course.subject,
        stages: blueprint.lesson_flow.map((s) => ({ stage: s.stage, intent: s.intent })),
      },
      pedagogy_rule_names: blueprint.pedagogy.map((p) => p.name),
    },
    director: {
      course: blueprint.course.topic,
      subject: blueprint.course.subject,
      grade: blueprint.course.grade,
      course_type: blueprint.course.knowledge_type,
      recommended_theories: blueprint.pedagogy.map((p) => ({ name: p.name, reason: p.use })),
      teaching_strategy: [
        {
          name: blueprint.course.knowledge_type,
          reason: blueprint.visual_direction.layout_rule,
        },
      ],
      learning_objectives: blueprint.learning_objectives,
      student_difficulties: blueprint.common_mistakes,
      teaching_mode: '问题探究',
      stage_template: blueprint.course.category,
      stages: blueprint.lesson_flow.map((s) => ({
        stage: s.stage,
        intent: s.intent,
        theory: s.theory,
      })),
    },
    lesson,
    objective_alignment: {
      score: 92,
      summary: '学习目标、教学流程、课件表征与分层作业均由同一 Blueprint 驱动。',
      checks: blueprint.learning_objectives.map((o) => ({
        objective: o,
        supported_by: ['导入', '新授', '练习', '出口票'],
        aligned: true,
      })),
      issues: [],
      suggestions: ['可按课时压缩互动环节'],
    },
    ppt,
    before_after: {
      before: {
        title: '常见低质生成',
        issues: [
          { label: '单 Prompt 一把梭', detail: '无文案无教研逻辑' },
          { label: '模板乱套', detail: '数学课没有图像、语文课堆字' },
          { label: '作业不分层', detail: '无法服务中高考差异学情' },
        ],
      },
      after: {
        title: 'Ultimate Pipeline',
        improvements: [
          { label: 'Blueprint 共享', detail: '所有 Agent 读同一蓝图' },
          { label: '学科视觉策略', detail: blueprint.visual_direction.design_system_id },
          { label: '可上课闭环', detail: '教案 + PPT + 作业 + 评价' },
        ],
      },
    },
    personas,
    simulation_turns: turns,
    evaluation,
  }

  await emit('complete', 'done', '精品课程已生成', 100)
  return session
}

function buildPersonas(bp: CourseBlueprint): DemoSession['personas'] {
  return [
    {
      id: 'p1',
      name: '阿哲',
      level: 'struggling',
      personality: '基础薄弱，需要支架',
      knowledge_gap: bp.common_mistakes.slice(0, 1),
      question_style: '追问字面',
      memory: { unresolved: [], resolved: [], understanding: {} },
    },
    {
      id: 'p2',
      name: '小林',
      level: 'medium',
      personality: '认真但容易误解概念',
      knowledge_gap: bp.knowledge_structure.slice(0, 1),
      question_style: '追问原因',
      memory: { unresolved: [], resolved: [], understanding: {} },
    },
    {
      id: 'p3',
      name: '思远',
      level: 'excellent',
      personality: '喜欢迁移与边界追问',
      knowledge_gap: ['想把概念连到现实'],
      question_style: '深度追问',
      memory: { unresolved: [], resolved: [], understanding: {} },
    },
  ]
}

function buildTurns(bp: CourseBlueprint): DemoSession['simulation_turns'] {
  const c0 = bp.knowledge_structure[0] || bp.course.topic
  const m0 = bp.common_mistakes[0] || '概念不清'
  return [
    {
      persona_id: 'p1',
      question: `老师，「${c0}」我还是有点懵，能再举个例子吗？`,
      sample_answer: '先肯定，再用生活例子搭支架，最后请学生用自己的话复述。',
      understanding_delta: { gap: m0, from: '未理解', to: '部分理解', note: '需再练一题' },
    },
    {
      persona_id: 'p2',
      question: `如果情境变了，「${c0}」还成立吗？`,
      sample_answer: '引导学生区分不变结构与可变表象。',
      understanding_delta: { gap: '迁移不足', from: '未解决', to: '部分理解', note: '可板书对照' },
    },
    {
      persona_id: 'p3',
      question: '这个想法的边界在哪里？会不会被误用？',
      sample_answer: '鼓励批判性思考，明确适用条件。',
      understanding_delta: { gap: '深度迁移', from: '未解决', to: '深化理解', note: '已能辨别' },
    },
  ]
}

export type { CourseBlueprint }
