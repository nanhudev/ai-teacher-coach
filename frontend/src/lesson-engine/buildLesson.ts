import type { CourseBrief } from '../ppt-engine/v3/types'
import type { LessonPlan } from '../types/demo'

/** 中学可直接用的标准教案（对齐常见教务模板 + 中高考分层作业） */
export function buildStandardLesson(brief: CourseBrief): LessonPlan {
  const topic = brief.topic
  const concepts = brief.key_concepts
  const mistakes = brief.common_mistakes
  const isExamTrack = /初中|高中/.test(brief.grade)
  const examLabel = /高中/.test(brief.grade) ? '高考' : /初中/.test(brief.grade) ? '中考' : '学段测评'

  const knowledge = concepts.slice(0, 2).map((c) => `能准确表述「${c}」并完成基础练习`)
  const process = [
    '经历观察—提问—归纳的探究过程',
    '学会用学科语言解释关键步骤',
  ]
  const values = [
    brief.category === 'humanities'
      ? '体会文本中的价值选择与人文关怀'
      : brief.category === 'math' || brief.category === 'stem'
        ? '养成严谨推理与证据意识'
        : '建立积极学习态度与合作意识',
  ]

  return {
    title: `《${topic}》教学设计（教案）`,
    lesson_type: '新授课',
    periods: '1 课时（40–45 分钟）',
    subject: brief.subject,
    grade: brief.grade,
    textbook_analysis:
      `本节围绕「${topic}」，承接学生已有经验，突出${concepts[0] || '核心概念'}，` +
      `为后续综合运用与${examLabel}相关题型奠基。`,
    student_analysis:
      `多数学生具备相关基础，但对「${mistakes[0] || '抽象概念'}」易混淆；` +
      `需用直观表征与分层追问降低门槛，同时给学有余力者拓展通道。`,
    objectives_3d: {
      knowledge,
      process,
      values,
    },
    objectives: [...knowledge, ...process.slice(0, 1), ...values],
    key_points: concepts.length ? concepts : [`理解${topic}的核心含义`],
    difficulty_points: mistakes.length ? mistakes : [`突破${topic}的抽象理解`],
    materials: ['多媒体课件', '黑板/电子白板', '课堂练习单（基础+提升）', '出口票纸条'],
    methods: ['问题导向', '启发式讲授', '合作探究', '形成性评价'],
    process: [
      {
        stage: '一、导入新课',
        teacher_action: `创设与「${topic}」相关的真实/认知冲突情境，提出主问题，明确本课学习任务。`,
        student_action: '自由表达直觉与已有经验，明确本节要解决的问题。',
        intent: '激活前概念，建立学习期待',
        theory: '建构主义',
        time: '5分钟',
      },
      {
        stage: '二、新知探究',
        teacher_action: `围绕「${concepts[0] || topic}」组织讲解/示范，适时给出支架问题，揭示易错点：${mistakes[0] || '概念混淆'}。`,
        student_action: '观察、标注、小组讨论，尝试用自己的话复述关键。',
        intent: '突破重点，化解难点',
        theory: '支架式教学',
        time: '18分钟',
      },
      {
        stage: '三、巩固应用',
        teacher_action: isExamTrack
          ? `组织分层练习：基础题对准课标要求；提升题贴近${examLabel}常见设问与陷阱。`
          : '组织操作/练习，巡视指导并收集典型作答。',
        student_action: '独立完成 → 同桌互查 → 展示讲评。',
        intent: '检测目标达成，暴露错误并即时纠正',
        theory: '掌握学习',
        time: '12分钟',
      },
      {
        stage: '四、课堂小结',
        teacher_action: '引导学生回扣目标，板书结构化梳理；出口票一句话检测。',
        student_action: '用一句话概括本节收获，提出仍存疑问。',
        intent: '形成知识框架，留下学习证据',
        theory: '形成性评价',
        time: '3分钟',
      },
      {
        stage: '五、作业布置',
        teacher_action: '布置分层作业并说明完成标准与提交方式。',
        student_action: '记录作业要求，明确自己选择的层级。',
        intent: '巩固迁移，服务不同学情',
        theory: '差异化教学',
        time: '2分钟',
      },
    ],
    board_design:
      `课题：${topic}\n` +
      `一、核心：${concepts.slice(0, 3).join(' / ') || topic}\n` +
      `二、方法：问题 → 表征 → 练习 → 反思\n` +
      `三、易错：${mistakes[0] || '（课堂生成）'}`,
    homework: {
      basic: [`完成基础练习 2–3 题（对准「${concepts[0] || topic}」）`, '整理课堂笔记中的关键句/公式'],
      advanced: isExamTrack
        ? [`完成 1 道${examLabel}风格变式题，写出解题思路`]
        : ['完成提升练习 1 题，能向同伴讲解'],
      extension: [
        brief.category === 'humanities'
          ? '写 80–120 字微写作：把本课思想迁移到一则生活情境'
          : '找一个生活实例，用本课概念解释，并说明适用条件',
      ],
    },
    exam_link: isExamTrack
      ? {
          exam_type: examLabel,
          points: concepts.slice(0, 3),
          question_types:
            brief.category === 'math' || brief.category === 'stem'
              ? ['概念辨析', '计算/推断', '综合应用']
              : ['理解概括', '分析鉴赏', '开放探究'],
          tips: [
            `审题先定位「${concepts[0] || '核心概念'}」`,
            `警惕易错：${mistakes[0] || '概念偷换'}`,
            '答案要有学科术语与步骤证据',
          ],
        }
      : undefined,
    reflection_prompt:
      '（课后填写）目标达成度？哪一环节超时/过快？学困生是否得到支架？下次如何调整分层练习？',
    activities: ['情境导入', '新知探究', '分层练习', '出口票'],
    assessment: ['出口票', '课堂展示', '分层作业'],
  }
}
