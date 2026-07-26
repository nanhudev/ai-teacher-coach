import type { CourseBrief, DesignSystem, SlideDsl, SlidePlan, ChartSpec } from './types'

function chartFor(brief: CourseBrief): ChartSpec | undefined {
  if (brief.category === 'math' && /导数/.test(brief.topic)) {
    return { kind: 'function', expression: 'x2', label: 'y = x² 与切线', tangent_at: 1, x_min: -2, x_max: 2 }
  }
  if (brief.category === 'math' || (brief.category === 'primary' && /分数/.test(brief.topic))) {
    if (/分数/.test(brief.topic)) {
      return { kind: 'fraction_pie', label: '认识 3/4', numerator: 3, denominator: 4 }
    }
    return { kind: 'function', expression: 'linear', label: '变化示意', x_min: -2, x_max: 2 }
  }
  if (brief.category === 'stem' && /牛顿|第二/.test(brief.topic)) {
    return {
      kind: 'bars',
      label: '同力不同质量 → 加速度',
      categories: ['m小', 'm中', 'm大'],
      values: [3, 2, 1],
    }
  }
  return undefined
}

function humanitiesSlides(brief: CourseBrief): SlideDsl[] {
  const t = brief.topic
  const narrative =
    /赤壁/.test(t)
      ? '一场夜游，改变了一位诗人的精神世界'
      : /工业/.test(t)
        ? '蒸汽改变的不只是机器，还有人的生活'
        : `走进「${t}」的精神现场`
  return [
    {
      slide_type: 'cover',
      title: t,
      purpose: '建立课堂气质',
      layout: 'hero_visual',
      key_message: narrative,
      subtitle: `${brief.grade}${brief.subject}`,
      closing: '公开课叙事开场',
      minutes_hint: 1,
      visual_prompt: `${t}，博物馆展览式氛围，低信息密度，教育用途`,
      elements: [{ type: 'text', role: 'title' }],
    },
    {
      slide_type: 'question',
      title: /赤壁/.test(t) ? '若你被贬到陌生之地' : /工业/.test(t) ? '如果没有蒸汽机' : '先问一个真问题',
      purpose: '激发探究',
      layout: 'centered',
      key_message: /赤壁/.test(t) ? '月夜江上，你会想什么？' : /工业/.test(t) ? '今天的生活会少什么？' : '本课最想弄清什么？',
      bullets: ['先感受，再入文', '把心带进现场'],
      interaction: '30秒自由说一句',
      minutes_hint: 3,
      elements: [{ type: 'text', role: 'key' }],
    },
    {
      slide_type: 'concept',
      title: '本课学习目标',
      purpose: '明确目标',
      layout: 'full',
      key_message: '三件事，做实一课',
      bullets: brief.key_concepts.slice(0, 3),
      minutes_hint: 2,
      elements: [{ type: 'bullets' }],
    },
    {
      slide_type: 'timeline',
      title: /工业/.test(t) ? '工业革命时间线' : '文本情绪起伏',
      purpose: '建立结构图式',
      layout: 'timeline',
      steps: /工业/.test(t)
        ? [
            { label: '蒸汽', detail: '动力革命' },
            { label: '工厂', detail: '生产组织' },
            { label: '城市', detail: '社会结构' },
          ]
        : [
            { label: '起', detail: '情境入场' },
            { label: '承', detail: '细读关键' },
            { label: '转', detail: '思想转折' },
            { label: '合', detail: '迁移当下' },
          ],
      minutes_hint: 4,
      elements: [{ type: 'timeline' }],
    },
    {
      slide_type: 'image_text',
      title: /赤壁/.test(t) ? '景中藏情' : /工业/.test(t) ? '工厂里的人' : '关键现场',
      purpose: '美学细读',
      layout: 'hero_visual',
      key_message: /赤壁/.test(t) ? '景不是背景板' : '证据在细节里',
      bullets: brief.key_concepts.slice(0, 3),
      visual_prompt: `${t} 教育叙事插画，留白，非装饰性`,
      minutes_hint: 5,
      elements: [{ type: 'text' }, { type: 'bullets' }],
    },
    {
      slide_type: 'comparison',
      title: /赤壁/.test(t) ? '客之悲 vs 苏之喜' : /工业/.test(t) ? '技术 vs 社会' : '对照理解',
      purpose: '对照',
      layout: 'comparison',
      key_message: '同一现象，两种观法',
      left: /赤壁/.test(t) ? ['人生须臾', '慕英雄而不遇'] : ['效率提升', '机器节奏'],
      right: /赤壁/.test(t) ? ['物与我皆无尽', '共适清风明月'] : ['阶层流动', '城市扩张'],
      minutes_hint: 5,
      elements: [{ type: 'comparison' }],
    },
    {
      slide_type: 'activity',
      title: '小组任务',
      purpose: '课堂互动',
      layout: 'full',
      key_message: '用证据说话',
      bullets: ['找出一处关键', '写出对应感受/影响', '汇报一句结论'],
      interaction: '4人组 6 分钟',
      minutes_hint: 6,
      elements: [{ type: 'bullets' }],
    },
    {
      slide_type: 'question',
      title: /赤壁/.test(t) ? '旷达会不会变成摆烂？' : '进步一定更好吗？',
      purpose: '深度追问',
      layout: 'centered',
      key_message: '边界在哪里？',
      bullets: brief.common_mistakes.slice(0, 2),
      interaction: '同桌互答 1 分钟',
      minutes_hint: 3,
      elements: [{ type: 'text' }],
    },
    {
      slide_type: 'summary',
      title: '带走三句话',
      purpose: '总结',
      layout: 'full',
      bullets: brief.key_concepts.slice(0, 3),
      closing: '下课，但不结束思考',
      minutes_hint: 2,
      elements: [{ type: 'bullets' }],
    },
    {
      slide_type: 'homework',
      title: '出口票 + 微写作',
      purpose: '迁移',
      layout: 'centered',
      bullets: ['一句话解释今天的核心', '写 80 字迁移短文'],
      closing: '下节课分享',
      minutes_hint: 2,
      elements: [{ type: 'bullets' }],
    },
  ]
}

function mathSlides(brief: CourseBrief, chart?: ChartSpec): SlideDsl[] {
  const isDeriv = /导数/.test(brief.topic)
  const isFrac = /分数/.test(brief.topic)
  return [
    {
      slide_type: 'cover',
      title: brief.topic,
      purpose: '图形优先开场',
      layout: 'hero_visual',
      key_message: isDeriv ? '变化，可以被看见' : isFrac ? '把「一份」看见' : '先看见，再命名',
      subtitle: `${brief.grade}数学 · 概念可视化`,
      minutes_hint: 1,
      chart,
      elements: chart ? [{ type: 'chart', data: chart }] : [{ type: 'text' }],
    },
    {
      slide_type: 'question',
      title: isDeriv ? '车速表读的是什么？' : isFrac ? '一块蛋糕怎么分才公平？' : '今天的真问题',
      purpose: '直觉导入',
      layout: 'centered',
      key_message: isDeriv ? '瞬时变化率从哪来？' : '部分与整体',
      interaction: '先猜再验证',
      minutes_hint: 3,
      elements: [{ type: 'text' }],
    },
    {
      slide_type: 'concept',
      title: '核心概念',
      purpose: '建立定义',
      layout: 'full',
      key_message: brief.key_concepts[0] || '抓住定义',
      bullets: brief.key_concepts.slice(0, 3),
      minutes_hint: 4,
      elements: [{ type: 'bullets' }],
    },
    {
      slide_type: 'chart',
      title: isDeriv ? '导数的几何意义' : isFrac ? '分数的直观模型' : '图像说话',
      purpose: '视觉建立',
      layout: 'hero_visual',
      key_message: isDeriv ? '切线斜率 = 导数' : '涂色即含义',
      chart,
      bullets: isDeriv ? ['曲线', '切点', '切线斜率'] : ['分子', '分母', '整体'],
      minutes_hint: 6,
      elements: chart ? [{ type: 'chart', data: chart }, { type: 'bullets' }] : [{ type: 'bullets' }],
    },
    {
      slide_type: 'process',
      title: isDeriv ? '从平均到瞬时' : '操作步骤',
      purpose: '过程可视化',
      layout: 'full',
      steps: isDeriv
        ? [
            { label: '割线', detail: '平均变化率' },
            { label: '逼近', detail: 'Δx → 0' },
            { label: '切线', detail: '瞬时变化率' },
          ]
        : [
            { label: '分', detail: '等分整体' },
            { label: '取', detail: '取若干份' },
            { label: '说', detail: '用分数表达' },
          ],
      minutes_hint: 5,
      elements: [{ type: 'steps' }],
    },
    {
      slide_type: 'comparison',
      title: '易错对照',
      purpose: '纠错',
      layout: 'comparison',
      key_message: '把错因放上台面',
      left: brief.common_mistakes.slice(0, 2).length ? brief.common_mistakes.slice(0, 2) : ['常见误解'],
      right: isDeriv ? ['瞬时 ≠ 平均', '切线 ≠ 割线'] : ['分母大 ≠ 更大', '先定整体'],
      minutes_hint: 4,
      elements: [{ type: 'comparison' }],
    },
    {
      slide_type: 'activity',
      title: '课堂练习',
      purpose: '即时反馈',
      layout: 'full',
      key_message: '动手算 / 画一画',
      bullets: ['独立完成 1 题', '同桌互查', '展示思路'],
      interaction: '8 分钟限时',
      minutes_hint: 8,
      elements: [{ type: 'bullets' }],
    },
    {
      slide_type: 'summary',
      title: '一句话带走',
      purpose: '总结',
      layout: 'full',
      bullets: brief.key_concepts.slice(0, 3),
      closing: '今晚能讲给家长听吗？',
      minutes_hint: 2,
      elements: [{ type: 'bullets' }],
    },
    {
      slide_type: 'homework',
      title: '巩固任务',
      purpose: '迁移',
      layout: 'centered',
      bullets: ['基础题 2 道', '挑战题 1 道', '错因复盘一句'],
      minutes_hint: 2,
      elements: [{ type: 'bullets' }],
    },
  ]
}

function stemSlides(brief: CourseBrief, chart?: ChartSpec): SlideDsl[] {
  return [
    {
      slide_type: 'cover',
      title: brief.topic,
      purpose: '现象开场',
      layout: 'hero_visual',
      key_message: '先看见现象，再建模型',
      subtitle: `${brief.grade}${brief.subject}`,
      minutes_hint: 1,
      elements: [{ type: 'text' }],
    },
    {
      slide_type: 'question',
      title: '同样的力，为什么加速度不同？',
      purpose: '矛盾导入',
      layout: 'centered',
      key_message: '质量在扮演什么角色？',
      interaction: '先预测实验',
      minutes_hint: 3,
      elements: [{ type: 'text' }],
    },
    {
      slide_type: 'concept',
      title: '核心定律',
      purpose: '模型',
      layout: 'full',
      key_message: /牛顿|第二/.test(brief.topic) ? 'F = ma' : brief.key_concepts[0] || '抓住定律',
      bullets: brief.key_concepts.slice(0, 3),
      minutes_hint: 4,
      elements: [{ type: 'bullets' }],
    },
    {
      slide_type: 'chart',
      title: '关系可视化',
      purpose: '数据/示意',
      layout: 'hero_visual',
      key_message: '同力不同质量',
      chart,
      bullets: ['F 一定', 'm 增大', 'a 减小'],
      minutes_hint: 5,
      elements: chart ? [{ type: 'chart', data: chart }] : [{ type: 'bullets' }],
    },
    {
      slide_type: 'process',
      title: '实验流程',
      purpose: '科学探究',
      layout: 'full',
      steps: [
        { label: '控制变量', detail: '只改质量' },
        { label: '测加速度', detail: '记录数据' },
        { label: '归纳关系', detail: '对照 F=ma' },
      ],
      minutes_hint: 6,
      elements: [{ type: 'steps' }],
    },
    {
      slide_type: 'comparison',
      title: '易错点',
      purpose: '澄清',
      layout: 'comparison',
      left: brief.common_mistakes.slice(0, 2),
      right: ['合力才是 F', '方向与矢量'],
      minutes_hint: 4,
      elements: [{ type: 'comparison' }],
    },
    {
      slide_type: 'activity',
      title: '应用题挑战',
      purpose: '迁移',
      layout: 'full',
      bullets: ['画受力图', '列方程', '检查单位'],
      interaction: '小组板演',
      minutes_hint: 8,
      elements: [{ type: 'bullets' }],
    },
    {
      slide_type: 'summary',
      title: '带走模型',
      purpose: '总结',
      layout: 'full',
      bullets: brief.key_concepts.slice(0, 3),
      minutes_hint: 2,
      elements: [{ type: 'bullets' }],
    },
    {
      slide_type: 'homework',
      title: '课后任务',
      purpose: '巩固',
      layout: 'centered',
      bullets: ['基础计算', '生活现象解释一句'],
      minutes_hint: 2,
      elements: [{ type: 'bullets' }],
    },
  ]
}

function primarySlides(brief: CourseBrief, chart?: ChartSpec): SlideDsl[] {
  return [
    {
      slide_type: 'cover',
      title: brief.topic,
      purpose: '趣味开场',
      layout: 'hero_visual',
      key_message: '今天我们来玩一个「分一分」',
      subtitle: `${brief.grade}${brief.subject}`,
      chart,
      minutes_hint: 1,
      elements: chart ? [{ type: 'chart', data: chart }] : [{ type: 'text' }],
    },
    {
      slide_type: 'question',
      title: '怎样分才公平？',
      purpose: '情境',
      layout: 'centered',
      key_message: '先想办法，再学名字',
      interaction: '同桌说说',
      minutes_hint: 3,
      elements: [{ type: 'text' }],
    },
    {
      slide_type: 'chart',
      title: '看得见的分数',
      purpose: '直观模型',
      layout: 'hero_visual',
      key_message: chart && chart.kind === 'fraction_pie' ? chart.label : '涂色表示部分',
      chart,
      minutes_hint: 6,
      elements: chart ? [{ type: 'chart', data: chart }] : [{ type: 'bullets' }],
    },
    {
      slide_type: 'concept',
      title: '给它起名字',
      purpose: '符号',
      layout: 'full',
      bullets: brief.key_concepts.slice(0, 3),
      minutes_hint: 4,
      elements: [{ type: 'bullets' }],
    },
    {
      slide_type: 'activity',
      title: '动手分一分',
      purpose: '操作',
      layout: 'full',
      bullets: ['用紙片折', '涂色', '说分数'],
      interaction: '小组比赛',
      minutes_hint: 8,
      elements: [{ type: 'bullets' }],
    },
    {
      slide_type: 'comparison',
      title: '小心陷阱',
      purpose: '纠错',
      layout: 'comparison',
      left: brief.common_mistakes.slice(0, 2),
      right: ['先看整体', '再看份数'],
      minutes_hint: 4,
      elements: [{ type: 'comparison' }],
    },
    {
      slide_type: 'summary',
      title: '今天学会了',
      purpose: '总结',
      layout: 'full',
      bullets: brief.key_concepts.slice(0, 3),
      minutes_hint: 2,
      elements: [{ type: 'bullets' }],
    },
    {
      slide_type: 'homework',
      title: '回家任务',
      purpose: '巩固',
      layout: 'centered',
      bullets: ['找生活中的分数', '画一画讲给家人听'],
      minutes_hint: 2,
      elements: [{ type: 'bullets' }],
    },
  ]
}

/** SlidePlanningAgent */
export function planSlides(brief: CourseBrief, design: DesignSystem): SlidePlan {
  const chart = chartFor(brief)
  let slides: SlideDsl[]
  if (brief.category === 'humanities') slides = humanitiesSlides(brief)
  else if (brief.category === 'math') slides = mathSlides(brief, chart)
  else if (brief.category === 'stem') slides = stemSlides(brief, chart)
  else if (brief.category === 'primary') slides = primarySlides(brief, chart)
  else slides = mathSlides(brief, chart)

  return {
    title: brief.topic,
    learning_objective: `理解并运用：${brief.key_concepts.slice(0, 2).join('、')}`,
    total_minutes: 45,
    design,
    brief,
    slides,
  }
}
