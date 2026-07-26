/**
 * CurriculumReviewerAgent
 * 教材符合度 25 + 课标 25 + 新高考 20 + 教学逻辑 20 + 视觉 10
 */
import type { CurriculumAlignment } from './curriculumAgent'
import type { GaokaoExamValue } from './gaokaoAgent'
import type { LessonPlan, PptDesign } from '../types/demo'

export type CurriculumReview = {
  total: number
  textbook: number
  curriculum: number
  gaokao: number
  pedagogy: number
  visual: number
  pass: boolean
  issues: string[]
  suggestions: string[]
  basis_line: string
}

export function runCurriculumReviewer(input: {
  curriculum: CurriculumAlignment
  gaokao: GaokaoExamValue
  lesson: LessonPlan
  ppt: PptDesign
  hasOriginalText: boolean
  hasAnnotations: boolean
}): CurriculumReview {
  const { curriculum, gaokao, lesson, ppt, hasOriginalText, hasAnnotations } = input
  const issues: string[] = []
  const suggestions: string[] = []

  // 教材 25
  let textbook = 8
  if (hasOriginalText) textbook += 10
  else {
    issues.push('缺少可引用原文')
    suggestions.push('补入教材关键句后再生成细读页')
  }
  if (hasAnnotations) textbook += 5
  if (lesson.textbook_analysis && lesson.textbook_analysis.length > 20) textbook += 2
  textbook = Math.min(25, textbook)

  // 课标 25
  let cur = 10
  if (curriculum.core_competencies.length >= 4) cur += 6
  if (curriculum.learning_task_group) cur += 5
  const objText = JSON.stringify(lesson.objectives_3d || lesson.objectives || [])
  if (/语言|思维|审美|文化|素养/.test(objText)) cur += 4
  else {
    issues.push('教学目标未显式对接核心素养')
    suggestions.push('在三维目标中点明素养维度')
  }
  cur = Math.min(25, cur)

  // 新高考 20
  let gk = 6
  const hooks = gaokao.classroom_hooks.length
  const examBits = Object.values(gaokao.exam_value).flat().length
  gk += Math.min(8, hooks * 3)
  gk += Math.min(6, Math.floor(examBits / 2))
  if (lesson.exam_link || /高考|翻译|赏析/.test(JSON.stringify(lesson.process || []))) gk += 2
  else suggestions.push('教学过程增加对准新高考Ⅰ卷的微题')
  gk = Math.min(20, gk)

  // 教学逻辑 20
  let ped = 6
  const stages = lesson.process?.length || 0
  if (stages >= 5) ped += 6
  if (lesson.process?.some((p) => /问题|导入/.test(p.stage))) ped += 3
  if (lesson.process?.some((p) => /迁移|高考|作业/.test(p.stage))) ped += 3
  if (lesson.board_design) ped += 2
  ped = Math.min(20, ped)

  // 视觉 10
  let visual = 4
  const slides = ppt.slides?.length || 0
  if (slides >= 12 && slides <= 20) visual += 3
  if ((ppt.design_score?.total || 0) >= 80) visual += 3
  visual = Math.min(10, visual)

  const total = textbook + cur + gk + ped + visual
  const pass = total >= 85

  if (!pass) {
    suggestions.push('自动优化：强化原文证据、素养目标表述与高考微题')
  }

  return {
    total,
    textbook,
    curriculum: cur,
    gaokao: gk,
    pedagogy: ped,
    visual,
    pass,
    issues,
    suggestions: [...new Set(suggestions)].slice(0, 4),
    basis_line: curriculum.basis_line,
  }
}
