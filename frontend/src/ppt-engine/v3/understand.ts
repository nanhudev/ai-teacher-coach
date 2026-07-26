import type { CourseBrief, SubjectCategory } from './types'

const HUM = /语文|历史|政治|思政|文学|作文|阅读|文言文|诗歌|道法|道德/
const MATH = /数学|代数|几何|函数|导数|微积分|概率|统计|方程|分数|小数|三角函数/
const STEM = /物理|化学|生物|科学|实验|力学|牛顿|电路|光学|分子/
const PRIMARY_GRADE = /小学|一年级|二年级|三年级|四年级|五年级|六年级/

function inferSubject(topic: string, subjectHint: string): string {
  const blob = `${subjectHint}${topic}`
  if (MATH.test(blob) || MATH.test(subjectHint)) return subjectHint || '数学'
  if (STEM.test(blob)) return subjectHint || (STEM.exec(blob)?.[0] ?? '科学')
  if (HUM.test(blob)) return subjectHint || (HUM.exec(blob)?.[0] ?? '语文')
  return subjectHint || '综合'
}

function categoryOf(subject: string, grade: string, topic: string): SubjectCategory {
  if (PRIMARY_GRADE.test(grade) || /小学/.test(subject)) {
    if (MATH.test(subject + topic)) return 'primary'
    if (HUM.test(subject + topic)) return 'primary'
    return 'primary'
  }
  if (MATH.test(subject) || MATH.test(topic)) return 'math'
  if (STEM.test(subject) || STEM.test(topic)) return 'stem'
  if (HUM.test(subject) || HUM.test(topic)) return 'humanities'
  return 'general'
}

function conceptsFor(category: SubjectCategory, topic: string, points: string[]): string[] {
  if (points.length) return points.slice(0, 5)
  if (category === 'math') {
    if (/导数/.test(topic)) return ['瞬时变化率', '切线斜率', '极限思想', '几何意义']
    if (/分数/.test(topic)) return ['部分与整体', '分数意义', '同分母加减', '数轴表示']
    return ['核心概念', '典型例题', '易错点', '迁移应用']
  }
  if (category === 'stem') {
    if (/牛顿|第二定律/.test(topic)) return ['F=ma', '合力', '加速度', '质量']
    return ['现象观察', '核心定律', '实验证据', '应用场景']
  }
  if (category === 'humanities') {
    if (/赤壁/.test(topic)) return ['景情理交融', '主客问答', '变与不变', '旷达']
    if (/工业/.test(topic)) return ['蒸汽动力', '工厂制度', '城市化', '社会变革']
    return ['文本主线', '关键意象', '思想主旨', '迁移表达']
  }
  return ['认识对象', '操作体验', '表达分享']
}

function mistakesFor(category: SubjectCategory, topic: string): string[] {
  if (category === 'math' && /导数/.test(topic)) return ['把平均变化率当成瞬时', '切线画成割线', '符号忽略']
  if (category === 'math' && /分数/.test(topic)) return ['分母越大越大', '把分数当两个独立数']
  if (category === 'stem' && /牛顿|第二/.test(topic)) return ['把 F=ma 当成定义而非定律', '忽略合力']
  if (category === 'humanities' && /赤壁/.test(topic)) return ['只翻译字词不入情', '把旷达理解成摆烂']
  if (category === 'humanities' && /工业/.test(topic)) return ['只记发明家名单', '忽略社会结构变化']
  return ['概念停留在名词', '缺少证据与迁移']
}

/** CourseUnderstandingAgent（规则版；有后端时由 LLM 增强） */
export function understandCourse(input: {
  course: string
  subject?: string
  grade?: string
  knowledge_points?: string[]
}): CourseBrief {
  const topic = (input.course || '').trim() || '未命名课程'
  const grade = (input.grade || '高中').trim()
  const subject = inferSubject(topic, (input.subject || '').trim())
  const category = categoryOf(subject, grade, topic)
  const points = (input.knowledge_points || []).map((s) => s.trim()).filter(Boolean)

  const styleMap: Record<SubjectCategory, string> = {
    humanities: 'narrative_close_reading',
    math: 'concept_visualization',
    stem: 'model_and_experiment',
    primary: 'playful_scaffolding',
    general: 'inquiry_cycle',
  }
  const visualMap: Record<SubjectCategory, string> = {
    humanities: 'imagery + timeline + sparse text',
    math: 'diagram + graph',
    stem: 'process + model diagram',
    primary: 'card + illustration + interaction',
    general: 'mixed layouts',
  }

  return {
    subject,
    grade,
    topic,
    category,
    teaching_style: styleMap[category],
    recommended_visual_language: visualMap[category],
    difficulty: /大学/.test(grade) ? 'university' : /小学/.test(grade) ? 'primary' : /初中/.test(grade) ? 'middle' : 'high_school',
    key_concepts: conceptsFor(category, topic, points),
    common_mistakes: mistakesFor(category, topic),
    knowledge_points: points.length ? points : conceptsFor(category, topic, []),
  }
}
