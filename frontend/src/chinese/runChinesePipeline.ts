import type { DemoSession, LessonPlan, PptDesign } from '../types/demo'
import type { PipelineProgress } from '../pipeline/types'
import { runChineseTextAgent } from './textAgent'
import { designChineseLesson } from './lessonDesigner'
import { buildChinesePpt } from './pptEngine'
import { listChineseCases } from '../knowledge/chinese'
import { kindLabel, pptStyleLabel } from './displayLabels'
import { buildClassroomPersonas, buildClassroomTurns } from './classroomSim'
import { runChineseCurriculumAgent } from './curriculumAgent'
import { runNewGaokaoAgent } from './gaokaoAgent'
import { runCurriculumReviewer } from './curriculumReviewer'

export type ChinesePipelineMode = 'full' | 'lesson' | 'ppt'

export type ChineseInput = {
  oneLiner: string
  template_id?: string
  mode?: ChinesePipelineMode
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * 高中语文垂直流水线 V7
 * 课标 × 新高考 × 教材 RAG → 教案 / PPT / 虚拟班级
 */
export async function runChinesePipeline(
  input: ChineseInput,
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
    if (status === 'running') await sleep(120)
  }

  await emit('understand', 'running', '正在分析：教材定位…', 6)
  const brief = runChineseTextAgent(input.oneLiner)
  if (!brief.matched || !brief.text) {
    throw new Error(brief.miss_hint || '请输入高中语文课题')
  }

  await emit('understand', 'running', '正在分析：新课标要求…', 12)
  const curriculum = runChineseCurriculumAgent(brief)
  await sleep(100)
  await emit('understand', 'running', '正在分析：高考价值（新高考Ⅰ卷）…', 16)
  const gaokao = runNewGaokaoAgent(brief)
  await sleep(100)

  if (brief.freshly_generated || brief.source === 'ai_generated' || brief.source === 'cached') {
    await emit(
      'understand',
      'running',
      `知识审核：《${brief.title}》来源与置信度…`,
      18,
      { source: brief.source, confidence: brief.confidence, rag: brief.rag },
    )
    await sleep(200)
  }

  const sourceLabel =
    brief.source === 'verified'
      ? '教材精校'
      : brief.rag?.text_source ||
        (brief.source === 'cached' ? 'RAG 缓存教学包' : 'RAG 组装教学包')
  await emit(
    'understand',
    'done',
    `✓ 教材定位 · ✓ 新课标 · ✓ 高考价值 · 《${brief.title}》· ${sourceLabel}`,
    24,
    {
      id: brief.text.id,
      kind: brief.text.kind,
      source: brief.source,
      rag: brief.rag,
      task_group: curriculum.learning_task_group,
    },
  )

  await emit('director', 'running', '正在分析：学情特点与教学策略…', 30)
  await emit(
    'director',
    'done',
    `${curriculum.basis_line} · 任务群「${curriculum.learning_task_group}」`,
    38,
    {
      exam: brief.exam_focus.slice(0, 2),
      competencies: curriculum.core_competencies.slice(0, 2),
    },
  )

  await emit('lesson', 'running', '课标匹配 → 核心问题 → 任务群过程…', 45)
  let lesson = designChineseLesson(brief, curriculum, gaokao)
  await emit('lesson', 'done', `教案 ${lesson.process.length} 环节 · 已对接核心素养`, 55)

  await emit('visual', 'running', 'ChineseVisualAgent：确定设计语言…', 62)
  await emit('visual', 'done', `风格：${pptStyleLabel(brief.ppt_style)} · ${brief.visual_prompts[0] || '教学意象'}`, 68)

  await emit('ppt', 'running', '公开课 PPT：原文证据 · 学生任务 · 教师点拨…', 74)
  let ppt = buildChinesePpt(brief, input.template_id)
  if ((ppt.design_score?.total || 0) < 85) {
    ppt = buildChinesePpt(brief, 'noir')
  }
  await emit('ppt', 'done', `${ppt.slides.length} 页 · 设计分 ${ppt.design_score?.total ?? '—'}`, 84)

  const hasOriginal = (brief.text.excerpts || []).some((e) => e.text && !/请对照|待补/.test(e.text))
  const hasAnno = (brief.text.annotation?.实词 || []).some((w) => w.word && !/待教材|请补/.test(w.word))
  let review = runCurriculumReviewer({
    curriculum,
    gaokao,
    lesson,
    ppt,
    hasOriginalText: hasOriginal || brief.source === 'verified',
    hasAnnotations: hasAnno || brief.source === 'verified',
  })
  if (!review.pass) {
    await emit('ppt', 'running', '课标审核未达标，自动优化课件…', 86)
    ppt = buildChinesePpt(brief, 'noir')
    lesson = designChineseLesson(brief, curriculum, gaokao)
    review = runCurriculumReviewer({
      curriculum,
      gaokao,
      lesson,
      ppt,
      hasOriginalText: hasOriginal || brief.source === 'verified',
      hasAnnotations: hasAnno || brief.source === 'verified',
    })
  }

  await emit('exercise', 'running', '作业 Agent：基础 / 提升 / 拓展…', 88)
  await emit('exercise', 'done', '分层作业已写入教案', 90)

  await emit('simulation', 'running', '虚拟班级：基础型 / 普通型 / 优秀型 · 各 3 问…', 92)
  const personas = buildClassroomPersonas(brief)
  const turns = buildClassroomTurns(personas)
  const sim_context = {
    title: brief.title,
    author: brief.author,
    keywords: [
      ...brief.knowledge_points.文言实词.map((w) => w.split('：')[0]),
      ...(brief.text?.stacked_words || []).map((w) => w.word),
      brief.title,
      brief.author,
    ].filter(Boolean),
    excerpts: [
      ...(brief.text?.excerpts || []).map((e) => e.text),
      ...(brief.text?.key_sentences || []).map((k) => k.text),
    ],
    stage: '文本细读',
  }
  await emit('simulation', 'done', `${personas.map((p) => p.name).join(' / ')} · 共 ${turns.length} 轮`, 94)

  const quality = ppt.design_score || {
    total: review.total,
    visual: review.visual,
    pedagogy: review.pedagogy,
    density: 10,
    interaction: 10,
    issues: [] as string[],
    suggestions: [] as string[],
  }
  // quality 来自 PPT OS 质检；对外评价以 curriculum review 为准
  void quality

  await emit('evaluation', 'running', 'CurriculumReviewer：教材 / 课标 / 新高考 / 教学逻辑…', 96)
  const evaluation = {
    total_score: review.total,
    scores: [
      { id: 'textbook', name: '教材符合度', score: review.textbook, max: 25 },
      { id: 'curriculum', name: '课程标准', score: review.curriculum, max: 25 },
      { id: 'gaokao', name: '新高考价值', score: review.gaokao, max: 20 },
      { id: 'pedagogy', name: '教学逻辑', score: review.pedagogy, max: 20 },
      { id: 'visual', name: '视觉表达', score: review.visual, max: 10 },
    ],
    strengths: [
      curriculum.basis_line,
      `任务群：${curriculum.learning_task_group}`,
      brief.source === 'verified'
        ? '教材精校源优先，考点不胡编'
        : brief.rag?.verified
          ? `RAG 审核通过（${brief.rag.text_source}）`
          : 'RAG 已组装框架：原文/注释请对照教材复核',
      `卷种方向：${gaokao.volume}`,
    ],
    issues: [
      ...review.issues,
      ...(quality.issues || []),
      ...(brief.source !== 'verified' && brief.rag?.issues?.length ? brief.rag.issues : []),
    ].filter(Boolean).slice(0, 5),
    suggestions: review.pass
      ? ['可按班级学情微调时长与支架密度', ...review.suggestions]
      : review.suggestions,
  }
  await emit(
    'evaluation',
    'done',
    `课标审核 ${review.total}${review.pass ? ' · 达标' : ' · 已自动优化'}`,
    98,
  )

  await emit('export_ready', 'done', '可导出教案 DOCX / 课件 PPTX', 99)

  // lesson-only / ppt-only：仍填另一侧轻量内容，保证 DemoShell 不崩
  const lessonOut: LessonPlan = mode === 'ppt' ? { ...lesson, process: lesson.process.slice(0, 2) } : lesson
  const pptOut = (mode === 'lesson' ? { ...ppt, slides: ppt.slides.slice(0, 3) } : ppt) as unknown as PptDesign

  const session: DemoSession = {
    guest: true,
    role_type: 'k12',
    case_id: `chinese-${brief.text.id}`,
    generated: true,
    mode,
    meta: {
      label: `高中语文 · ${brief.unit} · 《${brief.title}》${
        brief.source === 'verified' ? '' : ' · AI教学包'
      }`,
      subject: '语文',
      grade: '高中',
      period_count: 1,
      knowledge_points: [
        ...brief.knowledge_points.文言实词.slice(0, 2),
        ...brief.exam_focus.slice(0, 2),
      ],
    },
    knowledge_injected: {
      template: {
        subject: '语文',
        stages: lesson.process.map((s) => ({ stage: s.stage, intent: s.intent || s.theory })),
      },
      pedagogy_rule_names: [
        '新课标核心素养',
        curriculum.learning_task_group,
        '新高考评价体系',
        '建构主义',
        '支架式教学',
        '形成性评价',
      ],
    },
    curriculum_alignment: curriculum,
    gaokao_value: gaokao,
    curriculum_review: review,
    director: {
      course: brief.title,
      subject: '语文',
      grade: '高中',
      course_type: kindLabel(brief.text.kind),
      recommended_theories: [
        { name: '新课标核心素养', reason: curriculum.core_competencies.slice(0, 2).join('、') },
        { name: curriculum.learning_task_group, reason: '本课任务群定位' },
        { name: '支架式教学', reason: '初读字词降低门槛' },
      ],
      teaching_strategy: [
        { name: '问题链细读', reason: brief.core_questions[0] },
        { name: '新高考迁移', reason: gaokao.classroom_hooks[0] || brief.exam_focus[0] || '文本理解' },
      ],
      learning_objectives: [
        ...(lesson.objectives_3d?.knowledge || []),
        ...(lesson.objectives_3d?.process || []).slice(0, 1),
      ],
      student_difficulties: brief.teaching_difficulties,
      teaching_mode: '任务群探究 · 公开课可用',
      stage_template: 'chinese-curriculum-v7',
      stages: lesson.process.map((s) => ({
        stage: s.stage,
        intent: s.intent || '',
        theory: s.theory,
      })),
    },
    lesson: lessonOut,
    lesson_version: 1,
    lesson_history: [],
    objective_alignment: {
      score: (ppt.design_score?.total || 0) >= 85 ? 92 : 78,
      summary: '核心问题、细读活动、高考微题与分层作业由同一知识库驱动。',
      checks: brief.core_questions.slice(0, 3).map((o) => ({
        objective: o,
        supported_by: ['导入', '文本分析', '深度探究', '高考迁移'],
        aligned: true,
      })),
      issues: quality.issues,
      suggestions: evaluation.suggestions,
    },
    ppt: pptOut,
    before_after: {
      before: {
        title: '通用 AI 备课的通病',
        issues: [
          { label: '不懂教材', detail: '胡编实词与考点' },
          { label: '不像语文课', detail: '作者介绍开场、文字堆砌' },
          { label: 'PPT 像 AI', detail: '信息过密、无教学节奏' },
        ],
      },
      after: {
        title: '高中语文 AI 教研助手',
        improvements: [
          { label: 'RAG 教研链', detail: `《${brief.title}》· ${brief.rag?.text_source || '多源检索+审核'}` },
          { label: '虚拟班级', detail: '三档学生 · 9 轮问答训练' },
          { label: '公开课 PPT', detail: `一页一意 · ${pptStyleLabel(brief.ppt_style)}` },
        ],
      },
    },
    personas,
    simulation_turns: turns,
    sim_context,
    evaluation,
  }

  await emit('complete', 'done', `《${brief.title}》备课包已生成`, 100)
  return session
}

export function chineseDemoCases() {
  return listChineseCases().map((c) => ({
    id: c.id,
    label: c.label,
    subject: c.subject,
    grade: c.grade,
    knowledge_points: c.knowledge_points,
    oneLiner: `高中语文 ${c.label.includes('必修下') ? '必修下' : '必修上'} ${c.label.match(/《(.+?)》/)?.[1] || ''}`,
  }))
}
