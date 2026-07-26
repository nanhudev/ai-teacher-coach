import type { LessonPlan } from '../types/demo'
import type { ChineseTextBrief } from './textAgent'
import type { CurriculumAlignment } from './curriculumAgent'
import type { GaokaoExamValue } from './gaokaoAgent'

/**
 * ChineseLessonDesigner V7
 * 教材分析 → 学情 → 课标匹配 → 核心问题 → 任务群过程 → 高考迁移
 */
export function designChineseLesson(
  brief: ChineseTextBrief,
  curriculum?: CurriculumAlignment,
  gaokao?: GaokaoExamValue,
): LessonPlan {
  const title = brief.title
  const isClassical = brief.text?.kind === 'classical'
  const q0 = brief.core_questions[0] || `《${title}》最想弄清什么？`
  const taskGroup = curriculum?.learning_task_group || (isClassical ? '中华传统文化经典研习' : '文学阅读与写作')
  const competencies = curriculum?.core_competencies || [
    '语言建构与运用',
    '思维发展与提升',
    '审美鉴赏与创造',
    '文化传承与理解',
  ]
  const examHooks = gaokao?.classroom_hooks || []
  const examPoints = [
    ...brief.exam_focus.slice(0, 3),
    ...(gaokao?.exam_value.classical_chinese || []).slice(0, 2),
    ...(gaokao?.exam_value.literature || []).slice(0, 2),
  ].filter(Boolean)

  return {
    title: `高中语文 ${brief.unit} 《${title}》教学设计`,
    lesson_type: '新授课',
    periods: '1–2 课时（可拆）',
    subject: '语文',
    grade: '高中',
    textbook_analysis:
      `【教材定位】《${title}》属高中语文${brief.unit}，学习任务群「${taskGroup}」。` +
      (brief.text_background ? ` ${brief.text_background}` : '') +
      ` 教学须紧扣教材原文与注释，禁止脱离文本空谈。`,
    student_analysis:
      `【学情】高一/高二学生${isClassical ? '有一定文言基础但仍惧长篇' : '易把写景当好词好句'}；` +
      `预判难点：${brief.teaching_difficulties[0] || '文本主旨理解不深'}。` +
      ` 设计支架时对照核心素养「${competencies.slice(0, 2).join('、')}」。`,
    objectives_3d: {
      knowledge: [
        isClassical
          ? `能落实本课重点实词/虚词与关键句翻译（语言建构与运用）`
          : `能指出文中关键词句与结构脉络（语言建构与运用）`,
        `能概括《${title}》主旨与写法，并用原文证据说明（思维发展与提升）`,
      ],
      process: [
        `在「${taskGroup}」任务驱动下完成问题—细读—归纳`,
        '能用文本证据支撑观点，完成课堂微题（对准新高考能力）',
      ],
      values: [
        isClassical
          ? `体会文化精神与安顿自我的智慧（文化传承与理解）`
          : `感受散文审美与人情，提升审美鉴赏力（审美鉴赏与创造）`,
        competencies[3] ? `增强文化自信，观照当代情境（${competencies[3]}）` : '观照当代情境',
      ],
    },
    objectives: [],
    key_points: [
      `核心问题：${brief.core_questions[0] || '抓住核心问题统领全课'}`,
      `任务群：${taskGroup}`,
      ...(examPoints.slice(0, 2) || []),
    ],
    difficulty_points: brief.teaching_difficulties.slice(0, 3),
    materials: ['教材', '多媒体课件', '字词卡片/学案', '新高考Ⅰ卷风格微题（选）'],
    methods: ['问题导向', '学习任务群', '支架式细读', '合作探究', '形成性评价'],
    process: [
      {
        stage: '一、导入（问题情境）',
        teacher_action: `不先介绍作者百科。抛出生活化问题导入，再揭示与《${title}》的关联。示例：「${q0.replace(/？$/, '')}——作者如何回答？」`,
        student_action: '自由表达直觉，进入问题场。',
        intent: `建构主义 + 任务群导入；对接素养：${competencies[1]}`,
        theory: '建构主义',
        time: '5分钟',
      },
      {
        stage: '二、初读文本',
        teacher_action: isClassical
          ? '范读/听读；明确任务：正音、圈实词、标情感变化处。提供字词支架卡（教材注释优先）。'
          : '默读全文；圈画文眼/关键词；标出情感起伏。',
        student_action: isClassical
          ? '完成字音词义初关，试译关键句。'
          : '找出文眼与结构标志句。',
        intent: '支架式教学：降低文字门槛；语言建构与运用',
        theory: '支架式教学',
        time: '10分钟',
      },
      {
        stage: '三、文本分析（任务驱动细读）',
        teacher_action: `紧扣核心问题「${brief.core_questions[0] || ''}」，组织细读任务：观点必须带原文证据。任务群焦点：${taskGroup}。`,
        student_action: '小组完成细读表，汇报一处证据链。',
        intent: '认知主义：建立文本图式；思维发展与提升',
        theory: '认知主义',
        time: '15分钟',
      },
      {
        stage: '四、深度探究',
        teacher_action: `追问价值/审美/文化意义。可对比：${brief.core_questions[2] || '价值边界在哪里？'} 点拨对齐「${competencies[2]} / ${competencies[3]}」。`,
        student_action: '辩论或书面陈述，引用原文。',
        intent: '建构主义：走向意义与文化理解',
        theory: '建构主义',
        time: '8分钟',
      },
      {
        stage: '五、高考迁移（新高考Ⅰ卷）',
        teacher_action: `微题对准：${examHooks[0] || examPoints[0] || '手法/实词/主旨'}。限时作答并讲评。${gaokao?.volume ? `（${gaokao.volume}能力向）` : ''}`,
        student_action: '独立完成 → 对答案 → 纠错。',
        intent: '形成性评价 + 关键能力检测',
        theory: 'Bloom目标分类',
        time: '5分钟',
      },
      {
        stage: '六、总结与作业',
        teacher_action: '板书知识树；出口票一句话；布置分层作业；留教学反思入口。',
        student_action: '完成出口票，记录作业。',
        intent: '形成性评价，留下学习证据',
        theory: '形成性评价',
        time: '2分钟',
      },
    ],
    board_design:
      `《${title}》｜${taskGroup}\n` +
      `核心问题：${brief.core_questions[0] || ''}\n` +
      `素养：${competencies.slice(0, 2).join(' · ')}\n` +
      `结构：${(brief.text?.structure || []).map((s) => s.part).join(' → ')}\n` +
      `高考：${examPoints.slice(0, 3).join(' / ')}`,
    homework: {
      basic: [
        isClassical
          ? `整理本课重点实词 ${Math.min(5, brief.knowledge_points.文言实词.length || 5)} 个并造句`
          : `摘抄文中 3 处写景妙句，标注手法`,
        `用一句话回答：${brief.core_questions[0] || '本文主旨是什么？'}`,
      ],
      advanced: [
        `完成 1 道新高考Ⅰ卷风格小题（对准：${examHooks[0] || examPoints[0] || '文本理解'}）`,
        `对照教学难点「${brief.teaching_difficulties[0] || ''}」写纠错笔记`,
      ],
      extension: [
        `微写作 100 字：把课文思想迁移到一则当代情境（作文素材积累）`,
        `比较阅读：自选一篇相关诗文，列对照表`,
      ],
    },
    exam_link: {
      exam_type: gaokao?.volume || '新高考Ⅰ卷',
      points: [...new Set(examPoints)].slice(0, 5),
      question_types: isClassical
        ? ['文言实词', '翻译', '内容理解', '探究开放']
        : ['内容理解', '手法赏析', '语言品味', '探究开放'],
      tips: [
        '先定位区间再作答',
        '赏析题：手法 + 效果 + 情感',
        '探究题：观点 + 文本证据 + 现实观照',
        ...(examHooks.slice(0, 1) || []),
      ],
    },
    reflection_prompt:
      '（课后）核心问题是否驱动全课？是否落实任务群与核心素养？高考微题难度是否匹配学情？原文证据是否充足？',
    activities: ['问题导入', '初读支架', '任务群细读', '深度探究', '新高考微题', '出口票'],
    assessment: ['出口票', '小组汇报', '新高考微题', '分层作业'],
  }
}
