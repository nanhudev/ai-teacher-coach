/**
 * ChineseCurriculumAgent
 * 依据新课标输出本课约束（核心素养 × 学习任务群 × 评价关注点）
 */
import type { ChineseTextBrief } from './textAgent'
import {
  CORE_COMPETENCIES,
  CURRICULUM_META,
  LEARNING_TASK_GROUPS,
  type TaskGroupKey,
} from '../knowledge/chinese/authority'

export type CurriculumAlignment = {
  standard: string
  core_competencies: string[]
  learning_task_group: string
  learning_task_group_id: TaskGroupKey
  assessment_focus: string[]
  /** 给老师看的一行依据（隐藏政策全文） */
  basis_line: string
  confidence: number
}

export function runChineseCurriculumAgent(brief: ChineseTextBrief): CurriculumAlignment {
  const kind = brief.text?.kind || (brief.ppt_style === 'classical' ? 'classical' : 'modern_prose')
  const groupKey = pickTaskGroup(kind, brief.title)
  const group = LEARNING_TASK_GROUPS[groupKey]

  const competencies = CORE_COMPETENCIES.map((c) => c.name)
  // 按文体突出 2–3 维，仍四维齐全写入，突出写在 assessment
  const assessment_focus = pickAssessment(kind, brief)

  return {
    standard: CURRICULUM_META.name,
    core_competencies: competencies,
    learning_task_group: group.name,
    learning_task_group_id: groupKey,
    assessment_focus,
    basis_line: '本课依据：新课标核心素养 × 学习任务群 × 新高考评价体系',
    confidence: CURRICULUM_META.confidence,
  }
}

function pickTaskGroup(
  kind: string,
  title: string,
): TaskGroupKey {
  if (kind === 'classical' || /说$|记$|赋$|序$|表$|书$|劝学|出师|兰亭/.test(title)) {
    return 'classical'
  }
  if (kind === 'poetry' || /诗|词|曲/.test(title)) return 'poetry'
  if (/论|说理|辩论/.test(title)) return 'argumentative'
  if (kind === 'modern_prose' || kind === 'narrative') return 'literature'
  return 'literature'
}

function pickAssessment(kind: string, brief: ChineseTextBrief): string[] {
  if (kind === 'classical') {
    return ['文言理解', '文化意义', '思维发展', ...(brief.exam_focus.slice(0, 1) || [])]
  }
  if (kind === 'poetry') {
    return ['审美鉴赏', '意象意境', '情感主旨']
  }
  return ['文本理解', '审美鉴赏', '语言品味', ...(brief.exam_focus.slice(0, 1) || [])]
}
