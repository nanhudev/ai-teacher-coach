import type { CourseReview } from './types'
import curriculum from '../knowledge/chinese/evaluation/new_curriculum.json'
import gaokao from '../knowledge/chinese/evaluation/gaokao_standard.json'
import excellent from '../knowledge/chinese/evaluation/excellent_lesson.json'
import pptQuality from '../knowledge/chinese/evaluation/ppt_quality.json'

/**
 * 后端不可用时的前端规则诊断
 * // ponytail: 与 backend review_agent._heuristic 同思路，保证双模式可离线演示
 */
export function localReviewCourse(input: {
  lessonText: string
  pptText: string
  topicHint?: string
  sourceFiles?: string[]
}): CourseReview {
  const lesson = input.lessonText || ''
  const ppt = input.pptText || ''
  const blob = lesson + ppt
  const has = (...ks: string[]) => ks.some((k) => blob.includes(k))

  const strengths: string[] = []
  const problems: string[] = []
  const opts: string[] = []
  const issues: string[] = []

  let teach = 70
  if (has('教学目标', '目标')) {
    strengths.push('出现教学目标表述')
    teach += 5
  } else {
    problems.push('未明确写出可观察的教学目标')
    opts.push('用核心素养四维写可检测目标')
    teach -= 8
  }
  if (has('原文', '文本', '细读', '品析')) {
    strengths.push('有文本细读/品析意识')
    teach += 6
  } else {
    problems.push('缺少文本细读环节')
    opts.push('增加「圈画—证据—归纳」问题链')
    teach -= 10
  }
  if (has('学生', '小组', '讨论', '任务')) {
    strengths.push('包含学生活动设计')
    teach += 4
  } else {
    problems.push('学生活动偏弱')
    opts.push('每个环节补一句学生任务')
  }
  if (has('高考', '考点', '核心素养', '任务群', '课标')) {
    strengths.push('有课标/高考关联')
    teach += 4
  } else {
    problems.push('课标与新高考关联不足')
    opts.push('点明任务群与可迁移的高考设问')
  }

  let pptScore = 0
  let content = 0
  let visual = 0
  if (ppt) {
    content = 72
    visual = 68
    if (has('原文', '文本')) content += 8
    else {
      issues.push('缺少原文分析页')
      content -= 8
    }
    if (has('任务', '思考', '讨论')) content += 5
    else issues.push('缺少课堂任务/学生思考页')
    const longPages = ppt.split('【第').filter((x) => x.length > 350).length
    if (longPages >= 2) {
      issues.push('页面文字密度过高')
      visual -= 10
      opts.push('每页保留一个核心问题+一句原文证据')
    }
    pptScore = Math.round((content + visual) / 2)
  }

  const curriculumScore = has('核心素养', '任务群', '课标') ? 78 : 68
  const activity = has('学生', '小组', '讨论') ? 80 : 65
  const teachClamped = Math.min(95, Math.max(45, teach))
  const total = Math.round(
    ppt
      ? (teachClamped + curriculumScore + pptScore + activity) / 4
      : (teachClamped + curriculumScore + activity) / 3,
  )

  let topic = input.topicHint || ''
  const m = blob.match(/《([^》]+)》/)
  if (!topic && m) topic = m[1]
  if (!topic) topic = '高中语文课程'

  void curriculum
  void gaokao
  void excellent
  void pptQuality

  return {
    id: `local_${Date.now().toString(36)}`,
    source: 'local_heuristic',
    source_files: input.sourceFiles || [],
    topic,
    total_score: total,
    curriculum_score: curriculumScore,
    teaching_score: teachClamped,
    ppt_score: pptScore,
    activity_score: activity,
    visual_score: visual,
    content_score: content,
    lesson_analysis: {
      score: teachClamped,
      strengths: strengths.length ? strengths : ['材料已解析'],
      problems: problems.length ? problems : ['可对照公开课标准继续打磨'],
      optimization: opts.length ? opts : ['补问题链与文本证据'],
    },
    ppt_analysis: {
      score: pptScore,
      content_score: content,
      visual_score: visual,
      issues: issues.length ? issues : ppt ? [] : ['未上传课件'],
      optimization: opts.filter((o) => /页|课件|密度/.test(o)).slice(0, 4),
    },
    suggestions: [...opts, ...problems].slice(0, 6),
    optimize_brief: `优化《${topic}》：${(opts.length ? opts : problems).slice(0, 3).join('；')}`,
    theory_basis: ['新课标核心素养', '学习任务群', '新高考评价体系', '公开课标准'],
    extracted: {
      lesson_chars: lesson.length,
      ppt_chars: ppt.length,
      lesson_preview: lesson.slice(0, 400),
      ppt_preview: ppt.slice(0, 400),
    },
  }
}
