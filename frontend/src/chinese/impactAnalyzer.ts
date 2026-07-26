import type { DemoSession } from '../types/demo'

export type CourseModule =
  | 'director'
  | 'lesson'
  | 'ppt'
  | 'simulation'
  | 'evaluation'
  | 'blueprint'

export type ImpactReport = {
  teacher_intent: string
  affected_modules: CourseModule[]
  untouched_modules: CourseModule[]
  reasons: Record<string, string>
}

const ALL: CourseModule[] = [
  'director',
  'lesson',
  'ppt',
  'simulation',
  'evaluation',
  'blueprint',
]

/**
 * ImpactAnalyzer — 判断教师修改意见影响哪些模块
 * // ponytail: 关键词规则够用；DeepSeek 细判走后端 /demo/sync
 */
export function analyzeImpact(intent: string, _session?: DemoSession | null): ImpactReport {
  const t = (intent || '').trim()
  const hit = (...ks: string[]) => ks.some((k) => t.includes(k))

  const affected = new Set<CourseModule>()
  const reasons: Record<string, string> = {}

  if (!t) {
    return {
      teacher_intent: t,
      affected_modules: [],
      untouched_modules: [...ALL],
      reasons: { note: '未提供修改意见' },
    }
  }

  // 教学思想 / 重点转向 → 几乎全链路
  if (hit('突出', '不要只', '侧重', '核心', '困境', '旷达', '主题', '思想', '重新分析', '教研')) {
    ;(['director', 'lesson', 'ppt', 'simulation', 'evaluation', 'blueprint'] as CourseModule[]).forEach(
      (m) => affected.add(m),
    )
    reasons.director = '教学思想调整，需重写教研分析'
    reasons.lesson = '教学目标与过程需对齐新重点'
    reasons.ppt = '课件重点页需同步'
    reasons.simulation = '课堂提问需跟随新重点'
  }

  if (hit('文言', '实词', '虚词', '字词', '句式', '注释')) {
    affected.add('lesson')
    affected.add('ppt')
    affected.add('simulation')
    reasons.lesson = '文言教学比重变化'
    reasons.ppt = '需增加字词/原文页'
    reasons.simulation = '基础型学生问题需偏字词'
  }

  if (hit('导入', '活动', '互动', '讨论', '任务群', '探究', '讲授', '公开课', '时间', '分钟')) {
    affected.add('lesson')
    affected.add('ppt')
    reasons.lesson = '课堂环节设计变化'
    reasons.ppt = '课堂任务页需同步'
  }

  if (hit('课件', 'PPT', '幻灯', '板书', '视觉')) {
    affected.add('ppt')
    reasons.ppt = '明确要求改课件'
  }

  if (hit('模拟', '提问', '学生问', '练课', '追问')) {
    affected.add('simulation')
    reasons.simulation = '课堂模拟问题需重生成'
  }

  if (hit('评价', '评分', '作业', '检测')) {
    affected.add('evaluation')
    affected.add('lesson')
    reasons.evaluation = '评价维度调整'
  }

  if (hit('目标', '素养', '课标', '高考')) {
    affected.add('director')
    affected.add('lesson')
    affected.add('blueprint')
    reasons.director = '目标与课标对齐需更新'
  }

  // 默认：有意图至少动教研+教案
  if (!affected.size) {
    affected.add('director')
    affected.add('lesson')
    reasons.director = '默认同步教研分析'
    reasons.lesson = '默认同步教案'
  }

  const list = ALL.filter((m) => affected.has(m))
  return {
    teacher_intent: t,
    affected_modules: list,
    untouched_modules: ALL.filter((m) => !affected.has(m)),
    reasons,
  }
}
