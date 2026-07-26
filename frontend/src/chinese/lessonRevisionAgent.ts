import type { LessonPlan, LessonRevisionRecord, DemoSession } from '../types/demo'
import { runChineseTextAgent } from './textAgent'
import { buildChinesePpt } from './pptEngine'

export type RevisionResult = {
  lesson: LessonPlan
  change_summary: string[]
  revision_summary: { before: string; after: string; reason: string }[]
  teaching_improvement: string[]
}

export const REVISION_QUICK_TAGS: { id: string; label: string; request: string }[] = [
  {
    id: 'open-class',
    label: '公开课模式',
    request: '改成省级公开课比赛风格，突出问题链与核心素养，控制在45分钟',
  },
  {
    id: 'inquiry',
    label: '探究式课堂',
    request: '减少教师讲授，提高学生探究，增加小组讨论与证据链汇报',
  },
  {
    id: 'less-lecture',
    label: '减少讲授',
    request: '减少教师讲授比例，把讲解改为点拨，把时间还给学生活动',
  },
  {
    id: 'more-interact',
    label: '增加互动',
    request: '增加课堂互动：同桌互答、小组辩论、出口票',
  },
  {
    id: 'gaokao',
    label: '高考复习模式',
    request: '增加高考考点分析与课堂微题，强化手法—画面—情感答题路径',
  },
  {
    id: 'scaffold',
    label: '学困生友好',
    request: '面向高一基础较弱学生，增加支架、降低文言门槛、分步任务',
  },
  {
    id: 'wenyan',
    label: '加强文言字词',
    request: '增加文言实词虚词与特殊句式教学，初读阶段拉长',
  },
  {
    id: '45min',
    label: '压到45分钟',
    request: '严格控制在45分钟一课时完成，压缩冗余环节',
  },
  {
    id: 'task-group',
    label: '任务群教学',
    request: '使用学习任务群方式重组教学过程，用驱动任务统领课堂',
  },
  {
    id: 'objectives',
    label: '教学目标优化',
    request: '优化教学目标表述，使其更可观察、可评价，对接核心素养',
  },
]

function cloneLesson(lesson: LessonPlan): LessonPlan {
  return JSON.parse(JSON.stringify(lesson)) as LessonPlan
}

function has(req: string, ...keys: string[]) {
  return keys.some((k) => req.includes(k))
}

/**
 * Lesson Revision Agent
 * 基于原教案 + 自然语言需求做二次优化（保留核心问题与教材准确性）
 */
export function reviseChineseLesson(
  original: LessonPlan,
  request: string,
  ctx?: { knowledgePoints?: string[]; coreQuestion?: string },
): RevisionResult {
  const lesson = cloneLesson(original)
  const req = (request || '').trim()
  const change_summary: string[] = []
  const revision_summary: RevisionResult['revision_summary'] = []
  const teaching_improvement: string[] = []
  const coreQ =
    ctx?.coreQuestion ||
    lesson.key_points[0] ||
    lesson.process.find((p) => /导入|问题/.test(p.stage))?.teacher_action ||
    '保留原核心问题'

  if (!req) {
    return {
      lesson: original,
      change_summary: ['未提供修改需求'],
      revision_summary: [],
      teaching_improvement: suggestImprovements(original),
    }
  }

  // —— 公开课 ——
  if (has(req, '公开课', '比赛', '省级')) {
    const before = lesson.lesson_type || '新授课'
    lesson.lesson_type = '公开课（比赛可用）'
    lesson.methods = Array.from(
      new Set([...(lesson.methods || []), '问题链驱动', '证据细读', '当堂展示']),
    )
    lesson.process = lesson.process.map((p) => ({
      ...p,
      intent: (p.intent || '') + (p.intent?.includes('公开课') ? '' : '；公开课：可观察的学生表现'),
      student_action: p.student_action.includes('汇报')
        ? p.student_action
        : `${p.student_action}；准备一句可展示的证据发言`,
    }))
    revision_summary.push({
      before: `课型：${before}`,
      after: '课型：公开课（比赛可用）',
      reason: '突出可展示的问题链与学生证据表达',
    })
    change_summary.push('升级为公开课比赛风格', '强化学生可展示发言')
    teaching_improvement.push('公开课评审更看重学生思维可见，而非教师讲得多漂亮')
  }

  // —— 减少讲授 / 探究 ——
  if (has(req, '减少讲授', '探究', '学生参与', '少讲')) {
    lesson.process = lesson.process.map((p) => {
      const teacher = compressLecture(p.teacher_action)
      const student = expandInquiry(p.student_action, p.stage)
      return {
        ...p,
        teacher_action: teacher,
        student_action: student,
        theory: p.theory.includes('探究') ? p.theory : `${p.theory}·探究`,
        intent: '降低讲授占比，学生先发现、教师再点拨',
      }
    })
    if (!lesson.process.some((p) => /探究|小组/.test(p.stage))) {
      lesson.process.splice(Math.min(3, lesson.process.length), 0, {
        stage: '合作探究（加）',
        teacher_action: '发布探究任务卡：观点 + 原文证据；巡视点拨，不抢答。',
        student_action: '小组完成证据卡并推选发言人汇报。',
        theory: '建构主义',
        intent: '提高学生探究占比',
        time: '8分钟',
      })
    }
    lesson.methods = Array.from(new Set([...(lesson.methods || []), '合作探究', '证据链']))
    revision_summary.push({
      before: '教师讲解偏多',
      after: '教师点拨 + 学生探究/汇报',
      reason: '响应减少讲授、提高参与的需求',
    })
    change_summary.push('压缩教师讲授', '增加小组探究环节')
  }

  // —— 增加互动 ——
  if (has(req, '互动', '讨论', '辩论', '出口票')) {
    lesson.process = lesson.process.map((p) => ({
      ...p,
      student_action: ensureInteract(p.student_action),
    }))
    if (!lesson.assessment?.includes('出口票')) {
      lesson.assessment = [...(lesson.assessment || []), '出口票', '同桌互答']
    }
    const last = lesson.process[lesson.process.length - 1]
    if (last && !/出口票|总结/.test(last.teacher_action)) {
      last.teacher_action += '；发放出口票：用一句话回答核心问题。'
      last.student_action += '；完成出口票。'
    }
    revision_summary.push({
      before: '互动偏弱',
      after: '同桌互答 / 小组汇报 / 出口票',
      reason: '形成性评价与参与感同步提升',
    })
    change_summary.push('增加课堂互动设计')
  }

  // —— 高考 ——
  if (has(req, '高考', '考点', '迁移')) {
    const points = ctx?.knowledgePoints?.slice(0, 4) || lesson.exam_link?.points || lesson.key_points
    lesson.exam_link = {
      exam_type: '高考',
      points: points.slice(0, 4),
      question_types: ['文言实词/翻译', '内容理解', '手法赏析', '探究开放'],
      tips: ['先定位区间', '手法→画面→情感', '探究题：观点+证据+观照'],
    }
    if (!lesson.process.some((p) => /高考|迁移/.test(p.stage))) {
      lesson.process.push({
        stage: '高考迁移（加）',
        teacher_action: `出示微题对准：${points[0] || '手法/实词'}。限时作答并讲评答题路径。`,
        student_action: '独立完成 → 对答案 → 纠错笔记。',
        theory: 'Bloom目标分类',
        intent: '把课堂所得迁移到考场题型',
        time: '6分钟',
      })
    }
    revision_summary.push({
      before: lesson.exam_link ? '考衔接偏弱' : '缺高考链接',
      after: '专设高考迁移 + 答题路径',
      reason: '教师明确要求强化考点',
    })
    change_summary.push('强化高考考点与微题')
  }

  // —— 学困 / 高一 ——
  if (has(req, '学困', '基础弱', '高一', '支架')) {
    const before = lesson.student_analysis || ''
    lesson.student_analysis =
      '面向高一/基础较弱学生：降低起点，先过字词关与整体感知，再谈主旨。' +
      (before ? `（原学情：${before.slice(0, 40)}…）` : '')
    lesson.process = lesson.process.map((p) => {
      if (/初读|字词|疏通/.test(p.stage) || /初读/.test(p.teacher_action)) {
        return {
          ...p,
          teacher_action: `提供字词支架卡与范读；${p.teacher_action}`,
          student_action: `先完成支架任务再讨论；${p.student_action}`,
          time: bumpTime(p.time, 3),
          theory: '支架式教学',
        }
      }
      return p
    })
    lesson.difficulty_points = [
      '降低门槛：先过字词与句读',
      ...lesson.difficulty_points.slice(0, 2),
    ]
    revision_summary.push({
      before: '默认中等学情',
      after: '学困生友好：支架加长、初读加时',
      reason: '匹配基础较弱班级',
    })
    change_summary.push('学情改为学困生友好', '加长初读支架')
  }

  // —— 文言字词 ——
  if (has(req, '实词', '虚词', '文言', '句式')) {
    const exists = lesson.process.some((p) => /字词|实词|虚词/.test(p.stage))
    if (!exists) {
      lesson.process.splice(1, 0, {
        stage: '字词攻坚（加）',
        teacher_action: '出示本课重点实词/虚词/句式卡片，示例→迁移→当堂检测。',
        student_action: '整理字词表，互测 3 个词，试译 1 句。',
        theory: '支架式教学',
        intent: '扫清文言障碍，服务后续探究',
        time: '8分钟',
      })
    } else {
      lesson.process = lesson.process.map((p) =>
        /字词|初读|实词/.test(p.stage)
          ? {
              ...p,
              teacher_action: `${p.teacher_action}；突出实词语境义与虚词辨析。`,
              time: bumpTime(p.time, 2),
            }
          : p,
      )
    }
    if (lesson.objectives_3d) {
      lesson.objectives_3d.knowledge = [
        '掌握本课重点实词、虚词与相关句式',
        ...lesson.objectives_3d.knowledge.filter((x) => !/实词|虚词/.test(x)).slice(0, 2),
      ]
    }
    revision_summary.push({
      before: '字词教学偏弱或隐含',
      after: '专设/加长文言字词环节',
      reason: '落实文言基础，服务文本理解',
    })
    change_summary.push('加强文言实词虚词教学')
  }

  // —— 45 分钟 ——
  if (has(req, '45', '一课时', '压缩')) {
    lesson.periods = '1 课时（45分钟）'
    lesson.process = redistributeTime(lesson.process, 45)
    revision_summary.push({
      before: original.periods || '时长偏松',
      after: '严格 45 分钟一课时',
      reason: '公开课/日常课时间硬约束',
    })
    change_summary.push('课时压缩为45分钟并重配时间')
  }

  // —— 任务群 ——
  if (has(req, '任务群', '学习任务')) {
    lesson.methods = Array.from(new Set([...(lesson.methods || []), '学习任务群', '驱动性任务']))
    lesson.process = lesson.process.map((p, i) => ({
      ...p,
      stage: p.stage.includes('任务') ? p.stage : `${p.stage} · 任务${i + 1}`,
      teacher_action: `发布任务：${extractTask(p)}；${compressLecture(p.teacher_action)}`,
      student_action: `完成任务并展示；${p.student_action}`,
      intent: '以任务统领学习，避免碎片活动',
    }))
    revision_summary.push({
      before: '环节并列',
      after: '任务群驱动重组',
      reason: '新课标学习任务群取向',
    })
    change_summary.push('按任务群重组教学过程')
  }

  // —— 目标优化 ——
  if (has(req, '目标', '核心素养', '可评价')) {
    if (lesson.objectives_3d) {
      lesson.objectives_3d = {
        knowledge: lesson.objectives_3d.knowledge.map((o) => makeObservable(o, '能指出/能翻译')),
        process: lesson.objectives_3d.process.map((o) => makeObservable(o, '能完成/能用证据')),
        values: lesson.objectives_3d.values.map((o) =>
          o.includes('核心素养') ? o : `${o}（语言建构与文化自信）`,
        ),
      }
    }
    revision_summary.push({
      before: '目标偏笼统',
      after: '目标可观察、可评价，点明核心素养',
      reason: '便于公开课评课与形成性评价',
    })
    change_summary.push('优化教学目标表述')
  }

  // 始终保留核心问题提示
  if (lesson.key_points[0] !== coreQ && coreQ) {
    lesson.key_points = [coreQ, ...lesson.key_points.filter((k) => k !== coreQ)].slice(0, 4)
  }
  lesson.reflection_prompt =
    (lesson.reflection_prompt || '') +
    `｜修订需求：${req.slice(0, 40)}${req.length > 40 ? '…' : ''}`

  if (!change_summary.length) {
    // 泛化优化：加点拨语言
    lesson.process = lesson.process.map((p) => ({
      ...p,
      teacher_action: `${p.teacher_action}（点拨紧扣：${String(coreQ).slice(0, 18)}）`,
    }))
    change_summary.push('按需求微调教学用语，保留原结构')
    revision_summary.push({
      before: '原教案结构',
      after: '强化核心问题贯穿',
      reason: '未匹配到强标签时的稳健优化',
    })
  }

  teaching_improvement.push(...suggestImprovements(lesson))

  return { lesson, change_summary, revision_summary, teaching_improvement }
}

/** 诊断建议（磨课前展示） */
export function suggestImprovements(lesson: LessonPlan): string[] {
  const tips: string[] = []
  const teacherLen = lesson.process.reduce((n, p) => n + p.teacher_action.length, 0)
  const studentLen = lesson.process.reduce((n, p) => n + p.student_action.length, 0)
  const ratio = teacherLen / Math.max(1, teacherLen + studentLen)
  if (ratio > 0.62) {
    tips.push(`教师讲授文字占比约 ${Math.round(ratio * 100)}%，建议增加学生探究与汇报`)
  }
  if (!lesson.process.some((p) => /出口票|互答|汇报|小组/.test(p.student_action + p.stage))) {
    tips.push('形成性评价不足：可加出口票或同桌互答')
  }
  if (!lesson.exam_link?.points?.length) {
    tips.push('高考衔接偏弱：可加考点微题')
  }
  if (!lesson.process.some((p) => /问题|导入/.test(p.stage))) {
    tips.push('导入问题链不够显眼：建议开场真问题')
  }
  const totalMin = lesson.process.reduce((n, p) => n + parseMinutes(p.time), 0)
  if (totalMin > 50) tips.push(`环节合计约 ${totalMin} 分钟，公开课建议压到 45`)
  if (!tips.length) tips.push('结构较完整；可按公开课/学困/高考等标签继续打磨')
  return tips
}

export function applyRevisionToSession(
  session: DemoSession,
  request: string,
  opts?: { syncPpt?: boolean },
): DemoSession {
  const ver = session.lesson_version || 1
  const history: LessonRevisionRecord[] = [
    ...(session.lesson_history || []),
    {
      version: ver,
      parent_version: Math.max(0, ver - 1),
      request: session.last_revision?.request || '初版',
      change_summary: session.last_revision?.change_summary || ['初代生成'],
      lesson: cloneLesson(session.lesson),
      created_at: new Date().toISOString(),
    },
  ]

  const titleMatch = session.meta.label.match(/《(.+?)》/)
  const oneLiner = titleMatch
    ? `高中语文 ${titleMatch[1]}`
    : `高中语文 ${session.meta.label}`
  const brief = runChineseTextAgent(oneLiner)

  const revised = reviseChineseLesson(session.lesson, request, {
    knowledgePoints: session.meta.knowledge_points,
    coreQuestion: brief.core_questions[0] || session.director.learning_objectives[0],
  })

  let ppt = session.ppt
  if (opts?.syncPpt && brief.matched) {
    ppt = buildChinesePpt(brief, 'showcase') as unknown as DemoSession['ppt']
  }

  return {
    ...session,
    lesson: revised.lesson,
    lesson_version: ver + 1,
    lesson_history: history.slice(-8),
    last_revision: {
      request,
      change_summary: revised.change_summary,
      revision_summary: revised.revision_summary,
      teaching_improvement: revised.teaching_improvement,
    },
    ppt,
    objective_alignment: {
      ...session.objective_alignment,
      score: Math.min(98, (session.objective_alignment.score || 85) + 2),
      summary: `V${ver + 1} 磨课：${revised.change_summary.slice(0, 2).join('；')}`,
      suggestions: revised.teaching_improvement.slice(0, 3),
    },
  }
}

function compressLecture(s: string) {
  if (s.includes('点拨')) return s
  return s.replace(/讲解|讲授|详细介绍/g, '点拨').replace(/，然后/, '；学生先行后，')
}

function expandInquiry(s: string, stage: string) {
  if (/小组|互答|探究|证据/.test(s)) return s
  if (/导入/.test(stage)) return `${s}；同桌互说 20 秒。`
  return `${s}；小组用「观点+原文」完成证据卡。`
}

function ensureInteract(s: string) {
  if (/互答|汇报|出口票|辩论/.test(s)) return s
  return `${s}；同桌互答后举手分享。`
}

function parseMinutes(t: string) {
  const m = t?.match(/(\d+)/)
  return m ? Number(m[1]) : 5
}

function bumpTime(t: string, add: number) {
  return `${parseMinutes(t) + add}分钟`
}

function redistributeTime(process: LessonPlan['process'], total: number) {
  const n = Math.max(1, process.length)
  const base = Math.floor(total / n)
  let rest = total - base * n
  return process.map((p) => {
    const extra = rest > 0 ? 1 : 0
    rest -= extra
    return { ...p, time: `${base + extra}分钟` }
  })
}

function extractTask(p: LessonPlan['process'][0]) {
  return p.stage.replace(/（加）|·.*$/, '').slice(0, 12)
}

function makeObservable(o: string, verb: string) {
  if (/^能/.test(o)) return o
  return `${verb}${o.replace(/^掌握|^理解|^体会/, '')}`
}
