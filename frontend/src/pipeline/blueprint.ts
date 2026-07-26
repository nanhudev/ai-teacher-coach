import type { CourseBlueprint, BlueprintCategory } from './types'
import { parseOneLiner } from './parseInput'
import { directVisual } from '../ppt-engine/v3/visualDirector'
import type { CourseBrief, SubjectCategory } from '../ppt-engine/v3/types'

/** 轻量教育知识库（规则，非自由发挥） */
const PEDAGOGY = {
  constructivism: { name: '建构主义', use: '情境导入与意义建构' },
  scaffolding: { name: '支架式教学', use: '难点拆解与逐步放手' },
  cognitivism: { name: '认知主义', use: '结构化表征与图式建立' },
  behaviorism: { name: '行为主义', use: '练习强化与即时反馈' },
  bloom: { name: 'Bloom目标分类', use: '目标分层：理解→应用→分析' },
} as const

function mapCategory(subject: string, grade: string, topic: string): BlueprintCategory {
  if (/大学/.test(grade) || /教育心理|教育学|心理学/.test(subject + topic)) return 'university'
  if (/小学/.test(grade)) return 'primary'
  if (/英语/.test(subject)) return 'english'
  if (/数学/.test(subject) || /导数|分数|函数/.test(topic)) return 'math'
  if (/物理|化学|生物|科学/.test(subject) || /牛顿/.test(topic)) return 'stem'
  if (/语文|历史|政治/.test(subject) || /赤壁|工业|狐假虎威/.test(topic)) return 'humanities'
  return 'general'
}

function knowledgeType(cat: BlueprintCategory, topic: string): string {
  if (cat === 'math') return /几何/.test(topic) ? 'geometry' : 'concept_visualization'
  if (cat === 'stem') return 'model_and_experiment'
  if (cat === 'humanities') return /狐假|寓言|赤壁|诗歌/.test(topic) ? 'text_analysis' : 'narrative'
  if (cat === 'english') return 'language_skills'
  if (cat === 'university') return 'theory_application'
  if (cat === 'primary') return 'playful_concept'
  return 'inquiry'
}

function concepts(cat: BlueprintCategory, topic: string): string[] {
  if (/导数/.test(topic)) return ['瞬时变化率', '切线斜率', '极限思想', '几何意义']
  if (/分数/.test(topic)) return ['部分与整体', '分数意义', '等分', '数轴表示']
  if (/牛顿|第二/.test(topic)) return ['F=ma', '合力', '加速度', '质量']
  if (/赤壁/.test(topic)) return ['景情理交融', '主客问答', '变与不变', '旷达']
  if (/狐假虎威/.test(topic)) return ['寓意理解', '角色关系', '狐与虎', '生活迁移']
  if (/工业/.test(topic)) return ['蒸汽动力', '工厂制度', '城市化', '社会变革']
  if (/建构主义/.test(topic)) return ['主动建构', '最近发展区', '情境学习', '支架']
  if (cat === 'english') return ['词汇', '句型', '语篇理解', '口头表达']
  if (cat === 'math') return ['核心定义', '典型例题', '易错点', '迁移应用']
  if (cat === 'stem') return ['现象', '模型', '定律', '应用']
  return ['核心概念', '关键过程', '迁移表达']
}

function mistakes(_cat: BlueprintCategory, topic: string): string[] {
  if (/导数/.test(topic)) return ['把平均变化率当瞬时', '切线画成割线']
  if (/分数/.test(topic)) return ['分母越大越大', '分数当两个独立数']
  if (/牛顿/.test(topic)) return ['忽略合力', 'F=ma 当成定义']
  if (/赤壁/.test(topic)) return ['只翻译不入情', '旷达=摆烂']
  if (/狐假虎威/.test(topic)) return ['只记故事不悟寓意', '角色关系混淆']
  if (/建构主义/.test(topic)) return ['把建构当放任自学', '忽略支架必要性']
  return ['概念停留在名词', '缺少证据与迁移']
}

function toBriefCategory(cat: BlueprintCategory): SubjectCategory {
  if (cat === 'english' || cat === 'university') return cat === 'university' ? 'general' : 'general'
  if (cat === 'primary') return 'primary'
  if (cat === 'math') return 'math'
  if (cat === 'stem') return 'stem'
  if (cat === 'humanities') return 'humanities'
  return 'general'
}

/** CourseUnderstanding + TeachingDirector → Blueprint */
export function buildBlueprint(rawInput: string, opts?: { template_id?: string }): CourseBlueprint {
  const parsed = parseOneLiner(rawInput)
  const category = mapCategory(parsed.subject, parsed.grade, parsed.topic)
  const ks = concepts(category, parsed.topic)
  const ms = mistakes(category, parsed.topic)
  const brief: CourseBrief = {
    subject: parsed.subject,
    grade: parsed.grade,
    topic: parsed.topic,
    category: toBriefCategory(category),
    teaching_style: knowledgeType(category, parsed.topic),
    recommended_visual_language: '',
    difficulty: /小学/.test(parsed.grade) ? 'primary' : /大学/.test(parsed.grade) ? 'university' : 'high_school',
    key_concepts: ks,
    common_mistakes: ms,
    knowledge_points: ks,
  }
  // university humanities-like visual for edu psych
  if (category === 'university') {
    brief.category = 'general'
  }
  if (category === 'english') brief.category = 'general'

  const design = directVisual(
    brief,
    opts?.template_id === 'auto' ? undefined : opts?.template_id,
  )

  // override template mapping for english / university
  if (category === 'university') {
    design.template_id = opts?.template_id && opts.template_id !== 'auto' ? opts.template_id : 'academic'
    design.id = 'academic_minimal'
  }
  if (category === 'english') {
    design.template_id = opts?.template_id && opts.template_id !== 'auto' ? opts.template_id : 'gamma'
  }

  const difficulty: CourseBlueprint['course']['difficulty'] =
    /小学/.test(parsed.grade) ? 'easy' : /大学|导数|建构/.test(parsed.grade + parsed.topic) ? 'hard' : 'medium'

  const pedagogy =
    category === 'math' || category === 'stem'
      ? [PEDAGOGY.cognitivism, PEDAGOGY.scaffolding, PEDAGOGY.behaviorism, PEDAGOGY.bloom]
      : category === 'primary'
        ? [PEDAGOGY.constructivism, PEDAGOGY.behaviorism, PEDAGOGY.scaffolding]
        : [PEDAGOGY.constructivism, PEDAGOGY.scaffolding, PEDAGOGY.cognitivism, PEDAGOGY.bloom]

  const lesson_flow = [
    { stage: '导入', intent: '激活经验 / 抛出主问题', theory: PEDAGOGY.constructivism.name, minutes: 5 },
    { stage: '新授', intent: '核心概念与表征', theory: PEDAGOGY.scaffolding.name, minutes: 18 },
    { stage: '互动', intent: '合作探究 / 展示', theory: PEDAGOGY.constructivism.name, minutes: 8 },
    { stage: '练习', intent: '分层巩固与纠错', theory: PEDAGOGY.behaviorism.name, minutes: 10 },
    { stage: '总结', intent: '结构化收束 + 出口票', theory: PEDAGOGY.bloom.name, minutes: 4 },
  ]

  const objectives = [
    `理解「${ks[0] || parsed.topic}」的核心含义`,
    `能运用本课方法完成基础与变式任务`,
    `形成证据意识与迁移表达习惯`,
  ]

  return {
    version: 'ultimate-1',
    raw_input: parsed.raw || rawInput,
    course: {
      subject: parsed.subject,
      grade: parsed.grade,
      topic: parsed.topic,
      difficulty,
      category,
      knowledge_type: knowledgeType(category, parsed.topic),
    },
    learning_objectives: objectives,
    knowledge_structure: ks,
    common_mistakes: ms,
    pedagogy: pedagogy.map((p) => ({ name: p.name, use: p.use })),
    lesson_flow,
    visual_direction: {
      template: design.template_id,
      design_system_id: design.id,
      style: design.style,
      layout_rule: design.layout_rule,
      image_style: design.image_style,
      rhythm: design.rhythm,
    },
    assessment_strategy: ['出口票', '课堂展示', '分层作业', '形成性追问'],
    exercises: {
      basic: [
        `写出「${ks[0] || parsed.topic}」的一句话定义`,
        `完成 2 道基础练习（对准核心概念）`,
      ],
      advanced: [
        `完成 1 道变式题，写出关键步骤与理由`,
        `对照易错点「${ms[0] || '概念混淆'}」自查答案`,
      ],
      open: [
        `用本课概念解释一个生活/真实情境，并说明边界条件`,
        /语文|历史|狐假|赤壁/.test(parsed.subject + parsed.topic)
          ? '写 80–120 字微写作：迁移本课主旨'
          : '设计一道给同学的挑战题（含参考思路）',
      ],
    },
    classroom_activities: ['主问题讨论', '表征/文本细读', '小组任务', '分层练习讲评', '出口票'],
  }
}

export function blueprintToBrief(bp: CourseBlueprint): CourseBrief {
  return {
    subject: bp.course.subject,
    grade: bp.course.grade,
    topic: bp.course.topic,
    category: toBriefCategory(bp.course.category),
    teaching_style: bp.course.knowledge_type,
    recommended_visual_language: bp.visual_direction.layout_rule,
    difficulty: bp.course.grade.includes('小学')
      ? 'primary'
      : bp.course.grade.includes('大学')
        ? 'university'
        : 'high_school',
    key_concepts: bp.knowledge_structure,
    common_mistakes: bp.common_mistakes,
    knowledge_points: bp.knowledge_structure,
  }
}
