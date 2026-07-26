import type { DemoSession } from '../types/demo'
import { runChineseTextAgent } from './textAgent'
import { buildChinesePpt } from './pptEngine'
import { applyRevisionToSession } from './lessonRevisionAgent'
import {
  buildClassroomPersonas,
  buildClassroomTurns,
} from './classroomSim'
import { analyzeImpact, type ImpactReport, type CourseModule } from './impactAnalyzer'
import type { ChineseTextBrief } from './textAgent'

export type SyncResult = {
  session: DemoSession
  impact: ImpactReport
  synced: CourseModule[]
  source: 'local' | 'deepseek'
}

function oneLinerOf(session: DemoSession) {
  const titleMatch = session.meta.label.match(/《(.+?)》/)
  return titleMatch
    ? `高中语文 ${titleMatch[1]}`
    : `高中语文 ${session.director.course || session.meta.label}`
}

function applyDirectorIntent(session: DemoSession, intent: string): DemoSession {
  const d = session.director
  const focus = {
    name: '教师教学重点（磨课）',
    reason: intent.slice(0, 120),
  }
  const strategies = [focus, ...d.teaching_strategy.filter((s) => s.name !== focus.name)].slice(0, 5)
  const objectives = [
    `能围绕「${intent.slice(0, 24)}」结合原文说明观点`,
    ...d.learning_objectives.filter((o) => !o.includes('教师教学重点')),
  ].slice(0, 5)

  const blueprint = session.blueprint
    ? {
        ...session.blueprint,
        learning_objectives: objectives,
        knowledge_structure: Array.from(
          new Set([intent.slice(0, 16), ...session.blueprint.knowledge_structure]),
        ).slice(0, 8),
      }
    : session.blueprint

  return {
    ...session,
    teacher_intent: intent,
    director: {
      ...d,
      teaching_strategy: strategies,
      learning_objectives: objectives,
      teaching_mode: `${d.teaching_mode} · 磨课迭代`,
    },
    blueprint,
  }
}

function rebuildSim(session: DemoSession, brief: ChineseTextBrief, intent: string): DemoSession {
  // inject intent into core questions so banks lean toward teacher focus
  const focused: ChineseTextBrief = {
    ...brief,
    core_questions: [intent.slice(0, 48), ...brief.core_questions].slice(0, 4),
  }
  const personas = buildClassroomPersonas(focused)
  // bias first question of each persona toward intent
  for (const p of personas) {
    if (p.question_bank?.[0]) {
      p.question_bank[0] = `老师，关于「${intent.slice(0, 18)}」，课文里哪里最能证明？`
    }
    if (p.knowledge_gap?.[0]) p.knowledge_gap[0] = intent.slice(0, 20)
  }
  const turns = buildClassroomTurns(personas)
  return {
    ...session,
    personas,
    simulation_turns: turns,
    classroom_sim_report: undefined,
    sim_context: {
      title: brief.title,
      author: brief.author,
      keywords: [
        ...brief.knowledge_points.文言实词.slice(0, 2).map((x) => x.split('：')[0]),
        ...session.meta.knowledge_points,
      ].slice(0, 6),
      excerpts: (brief.text?.excerpts || []).map((e) => e.text).slice(0, 4),
      stage: '磨课同步后',
    },
  }
}

/**
 * 同步 AI 优化全部受影响模块
 * 本地规则为底；可选 DeepSeek 结果由调用方合并
 */
export function syncCourseFromIntent(
  session: DemoSession,
  intent: string,
  opts?: { forceModules?: CourseModule[] },
): SyncResult {
  const impact = analyzeImpact(intent, session)
  const modules = new Set(opts?.forceModules || impact.affected_modules)
  const synced: CourseModule[] = []
  let next: DemoSession = { ...session, teacher_intent: intent, last_impact: impact }

  if (modules.has('director') || modules.has('blueprint')) {
    next = applyDirectorIntent(next, intent)
    if (modules.has('director')) synced.push('director')
    if (modules.has('blueprint')) synced.push('blueprint')
  }

  if (modules.has('lesson')) {
    next = applyRevisionToSession(next, intent, { syncPpt: false })
    next = { ...next, teacher_intent: intent, last_impact: impact }
    synced.push('lesson')
  }

  const brief = runChineseTextAgent(oneLinerOf(next))

  if (modules.has('ppt') && brief.matched) {
    const ppt = buildChinesePpt(brief) as unknown as DemoSession['ppt']
    // stamp teacher focus on cover subtitle if present
    if (ppt.slides?.[0] && typeof ppt.slides[0] === 'object') {
      const cover = ppt.slides[0] as Record<string, unknown>
      cover.subtitle = `${cover.subtitle || brief.author || ''} · 磨课重点：${intent.slice(0, 20)}`
    }
    next = { ...next, ppt }
    synced.push('ppt')
  }

  if (modules.has('simulation') && brief.matched) {
    next = rebuildSim(next, brief, intent)
    synced.push('simulation')
  }

  if (modules.has('evaluation')) {
    next = {
      ...next,
      evaluation: {
        ...next.evaluation,
        suggestions: [
          `磨课意见「${intent.slice(0, 28)}」已同步到受影响模块，建议再练一堂课验证。`,
          ...next.evaluation.suggestions.filter((s) => !s.includes('磨课意见')),
        ].slice(0, 5),
        strengths: [
          '教师主动调整教学思想并驱动全课同步',
          ...next.evaluation.strengths,
        ].slice(0, 4),
      },
      objective_alignment: {
        ...next.objective_alignment,
        summary: `已按教师意见同步：${synced.join('、')}`,
        suggestions: impact.affected_modules.map(
          (m) => impact.reasons[m] || `已更新 ${m}`,
        ),
      },
    }
    synced.push('evaluation')
  }

  return { session: next, impact, synced: Array.from(new Set(synced)), source: 'local' }
}
