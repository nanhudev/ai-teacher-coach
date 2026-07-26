/**
 * 虚拟班级 · 课堂问答训练引擎 V2
 * 课程绑定 · 每生 3 问 · 教师回应分析 · 结束报告
 * // ponytail: 规则分析器够 Demo；接 DeepSeek 当要个性化生成追问时再加
 */
import type { ChineseTextBrief } from './textAgent'
import type {
  ClassroomSimReport,
  Persona,
  PedagogyAnalysis,
  SimTurn,
  TeacherResponseAnalysis,
} from '../types/demo'

export const LEVEL_LABEL: Record<string, string> = {
  basic: '基础型',
  average: '普通型',
  advanced: '优秀型',
  struggling: '基础型',
  medium: '普通型',
  excellent: '优秀型',
}

export function buildClassroomPersonas(brief: ChineseTextBrief): Persona[] {
  const banks = buildQuestionBanks(brief)
  return [
    {
      id: 'p1',
      name: '小林',
      level: 'basic',
      personality: '理解慢，但愿意提问；需要具体例子',
      knowledge_gap: banks.basic.gaps,
      question_style: '需要具体例子与拆解',
      learning_state: {
        knowledge_gap: [...banks.basic.gaps],
        understood: [],
        confused: [...banks.basic.gaps],
      },
      question_bank: banks.basic.questions,
      sample_answers: banks.basic.samples,
      memory: { unresolved: [...banks.basic.gaps], resolved: [], understanding: {} },
    },
    {
      id: 'p2',
      name: '小陈',
      level: 'average',
      personality: '能读懂大意，会追问原因与经历关联',
      knowledge_gap: banks.average.gaps,
      question_style: '追问原因',
      learning_state: {
        knowledge_gap: [...banks.average.gaps],
        understood: [],
        confused: [...banks.average.gaps],
      },
      question_bank: banks.average.questions,
      sample_answers: banks.average.samples,
      memory: { unresolved: [...banks.average.gaps], resolved: [], understanding: {} },
    },
    {
      id: 'p3',
      name: '李明',
      level: 'advanced',
      personality: '深度思考，联系现实与文化价值',
      knowledge_gap: banks.advanced.gaps,
      question_style: '价值迁移与批判',
      learning_state: {
        knowledge_gap: [...banks.advanced.gaps],
        understood: [],
        confused: [...banks.advanced.gaps],
      },
      question_bank: banks.advanced.questions,
      sample_answers: banks.advanced.samples,
      memory: { unresolved: [...banks.advanced.gaps], resolved: [], understanding: {} },
    },
  ]
}

/** 9 轮：每生 3 问，按学生分组排列 */
export function buildClassroomTurns(personas: Persona[]): SimTurn[] {
  const turns: SimTurn[] = []
  for (const p of personas) {
    const qs = p.question_bank || []
    const samples = p.sample_answers || []
    for (let i = 0; i < 3; i++) {
      turns.push({
        persona_id: p.id,
        round: i + 1,
        question: qs[i] || `关于《${p.name}》还有什么不清楚？`,
        sample_answer: samples[i] || '先回应问题，再引用原文，最后追问学生。',
        understanding_delta: {
          gap: p.knowledge_gap[i] || p.knowledge_gap[0] || '文本理解',
          from: i === 0 ? '未理解' : '部分理解',
          to: i === 2 ? '深化理解' : '部分理解',
          note: `第 ${i + 1} 问 · ${LEVEL_LABEL[p.level] || p.level}`,
        },
      })
    }
  }
  return turns
}

type Bank = { questions: string[]; samples: string[]; gaps: string[] }

function buildQuestionBanks(brief: ChineseTextBrief): {
  basic: Bank
  average: Bank
  advanced: Bank
} {
  const t = brief.title
  const word = brief.knowledge_points.文言实词[0]?.split('：')[0]
  const excerpt =
    brief.text?.excerpts?.[0]?.text ||
    brief.text?.key_sentences?.[0]?.text ||
    ''
  const theme = brief.core_questions[0] || `《${t}》的主旨`
  const isBao = /报任安书|报任少卿/.test(t)
  const classical = brief.text?.kind === 'classical' || brief.ppt_style === 'classical'

  if (isBao) {
    return {
      basic: {
        gaps: ['为何隐忍苟活', '泰山鸿毛字面义', '名句情感'],
        questions: [
          '老师，我不理解为什么司马迁选择忍辱生存，而不是一死了之？',
          '「泰山」和「鸿毛」在文中到底什么意思？',
          '「人固有一死，或重于泰山，或轻于鸿毛」这句话表达了什么感情？',
        ],
        samples: [
          '先承认尊严与生命的冲突，再引「所以隐忍苟活…恨私心有所不尽」，点明为著书传世。',
          '用对比：泰山＝极重的死（价值），鸿毛＝极轻的死；让学生用自己的话再说一遍。',
          '引导：不是怕死，而是重新定义「怎样的死才有意义」——落到生死价值观。',
        ],
      },
      average: {
        gaps: ['生命价值差异', '强调忍辱的原因', '经历与文本关联'],
        questions: [
          '老师，为什么说生命的价值会不同？依据在哪里？',
          '作者为什么反复强调「隐忍」？只是自我安慰吗？',
          '这种选择和他遭受宫刑、要写《史记》的经历有什么关系？',
        ],
        samples: [
          '要求「观点+原文」：用之所趋异也 → 死的重量由取向决定。',
          '区分偷生与使命：隐忍是手段，著书才是目的；可追问学生如何证明。',
          '把李陵之祸、宫刑、《史记》未成串成证据链，让学生自己说清因果。',
        ],
      },
      advanced: {
        gaps: ['儒家价值', '当代意义', '删段与思想完整性'],
        questions: [
          '老师，司马迁的选择是否体现了某种儒家或史家价值？依据是什么？',
          '「泰山鸿毛」这种价值观在今天还有意义吗？会不会变成鸡汤？',
          '如果删掉「人固有一死…」这一段，全文的思想是否还完整？为什么？',
        ],
        samples: [
          '引导区分：忠孝/名节压力 vs 史家「究天人之际」的使命，要求引用原文辩论。',
          '开放探究：当代「有意义的坚持」与「无谓牺牲」边界，仍须回扣文本。',
          '结构检验：删掉价值观核心句，后面「隐忍」的辩护会失去尺度——让学生论证。',
        ],
      },
    }
  }

  // 通用：仍绑定本课字词/主旨/高考，禁止空泛闲聊
  const w = word || (classical ? '关键实词' : '文眼')
  return {
    basic: {
      gaps: [`「${w}」词义`, '关键句字面', '情感把握'],
      questions: [
        `老师，「${w}」在《${t}》里到底什么意思？我老记混。`,
        excerpt
          ? `「${excerpt.slice(0, 18)}${excerpt.length > 18 ? '…' : ''}」这句话我读不懂，能拆开讲吗？`
          : `《${t}》里哪一句最重要？我找不到。`,
        `读完后，作者到底想表达什么感情？`,
      ],
      samples: [
        '给语境例句 → 学生换说 → 对到注释义。',
        '关键词圈画 + 逐层释义，禁止一次讲完。',
        '观点必须带原文证据，再归纳情感。',
      ],
    },
    average: {
      gaps: ['主旨原因', '写法作用', '背景关联'],
      questions: [
        theme.includes('？') ? theme : `老师，${theme}？`,
        `作者为什么要这样写？手法和情感怎么连？`,
        `这和作者的经历/时代有什么关系？`,
      ],
      samples: [
        '要求「观点 + 原文证据」。',
        '手法 → 内容 → 情感三步口头复述。',
        '背景只服务文本，不堆百科。',
      ],
    },
    advanced: {
      gaps: ['价值探究', '当代迁移', '结构必要性'],
      questions: [
        `《${t}》的核心价值放到今天，还会成立吗？`,
        `如果出高考探究题，可能怎样设问？你会怎么答？`,
        `删掉最关键的一句/一段，文章思想还完整吗？`,
      ],
      samples: [
        '开放但必须回扣文本边界。',
        '观点—证据—迁移三步。',
        '用结构检验逼出主旨不可或缺性。',
      ],
    },
  }
}

/** TeacherResponseAnalyzer：规则评分，绑定课文关键词 */
export function analyzeTeacherResponse(input: {
  answer: string
  question: string
  brief: ChineseTextBrief
  persona: Persona
  round: number
  extraKeywords?: string[]
  excerpts?: string[]
}): { analysis: TeacherResponseAnalysis; delta: SimTurn['understanding_delta']; nextHint?: string } {
  const a = input.answer.trim()
  const brief = input.brief
  const keywords = [
    ...collectKeywords(brief),
    ...(input.extraKeywords || []),
    ...(input.excerpts || []).flatMap((e) => e.split(/[，。；]/).filter((x) => x.length >= 2 && x.length <= 10)),
  ]
  const cited =
    keywords.some((k) => k.length >= 2 && a.includes(k)) ||
    (input.excerpts || []).some((e) => e.length >= 4 && a.includes(e.slice(0, 8)))
  const addresses = overlapScore(a, input.question) >= 0.15 || /因为|所以|原文|例如|比如/.test(a)
  const clear = a.length >= 40
  const guides = /你觉得|为什么|能否|试着|看看|再读|追问|如果/.test(a)
  const highSchool = !/小学生|随便|无所谓|百度一下/.test(a) && a.length >= 20

  let knowledge_accuracy = cited ? 22 : 10
  let clarity = clear ? 16 : 8
  let responds_student = addresses ? 16 : 8
  let guides_thinking = guides ? 16 : 6
  let pedagogy = highSchool ? 12 : 6
  if (input.persona.level === 'basic' && cited && /也就是说|换句话说|比如/.test(a)) {
    pedagogy = Math.min(15, pedagogy + 3)
    clarity = Math.min(20, clarity + 2)
  }
  if (input.persona.level === 'advanced' && guides) guides_thinking = Math.min(20, guides_thinking + 2)
  if (a.length > 120) clarity = Math.min(20, clarity + 2)

  const score = Math.min(
    100,
    knowledge_accuracy + clarity + responds_student + guides_thinking + pedagogy,
  )

  const strengths: string[] = []
  const problems: string[] = []
  if (cited) strengths.push(`知识准确 ${knowledge_accuracy}/25 · 结合文本`)
  else problems.push('知识准确不足：缺少原文或关键词引用')
  if (addresses) strengths.push(`回应学生 ${responds_student}/20`)
  else problems.push('未紧扣学生问题')
  if (clear) strengths.push(`解释清晰 ${clarity}/20`)
  else problems.push('回答偏短，清晰度不足')
  if (guides) strengths.push(`引导思考 ${guides_thinking}/20`)
  else problems.push('缺少追问或支架')
  strengths.push(`教学方法 ${pedagogy}/15`)
  if (input.persona.level === 'basic' && !/也就是说|比如|拆|一步/.test(a)) {
    problems.push('面对基础型学生，解释跨度可能偏大')
  }

  const pedagogyAnalysis: PedagogyAnalysis = {
    constructivism: guides || cited
      ? '较好：尝试让学生联系文本建构意义'
      : '不足：偏单向告知，少让学生自己连证据',
    scaffolding:
      input.persona.level === 'basic' && (/比如|也就是说|先|再/.test(a) || clear)
        ? '较好：有拆解或举例支架'
        : input.persona.level === 'basic'
          ? '不足：对基础型缺少逐步提示'
          : guides
            ? '一般：有追问，可再分层'
            : '不足：支架不明显',
    formative:
      score >= 75
        ? '较好：能根据学情给出可继续的反馈点'
        : '不足：未充分根据学生缺口调整讲法',
  }

  const suggestion =
    problems[0]?.includes('原文') || problems[0]?.includes('关键词')
      ? `可引用「${keywords[0] || brief.title}」后再追问学生为什么`
      : input.persona.level === 'basic'
        ? '先拆关键词，再给一个近义例子，最后让学生复述'
        : '可以追问学生：你用哪句原文证明？'

  const improved = score >= 70
  const gap = input.persona.knowledge_gap[input.round - 1] || input.persona.knowledge_gap[0] || '文本理解'
  const delta = {
    gap,
    from: input.round === 1 ? '未理解' : '部分理解',
    to: improved ? (input.round >= 3 ? '深化理解' : '部分理解') : '仍困惑',
    note: improved ? '本问缺口有所缩小' : '需换更小支架再讲',
  }

  const nextHint =
    input.round < 3
      ? improved
        ? '下一问将基于已理解部分继续追问'
        : '下一问会回到未弄清的缺口，请准备更细的拆解'
      : undefined

  return {
    analysis: {
      score,
      strengths: strengths.slice(0, 4),
      problems: problems.slice(0, 3),
      suggestion,
      pedagogy_analysis: pedagogyAnalysis,
      cited_text: cited,
    },
    delta,
    nextHint,
  }
}

export function updatePersonaAfterAnswer(
  persona: Persona,
  delta: SimTurn['understanding_delta'],
  analysis: TeacherResponseAnalysis,
): Persona {
  const understood = [...(persona.learning_state?.understood || [])]
  const confused = [...(persona.learning_state?.confused || persona.knowledge_gap)]
  const gap = delta.gap
  if (analysis.score >= 70) {
    if (!understood.includes(gap)) understood.push(gap)
    const idx = confused.indexOf(gap)
    if (idx >= 0) confused.splice(idx, 1)
  } else if (!confused.includes(gap)) {
    confused.push(gap)
  }
  return {
    ...persona,
    learning_state: {
      knowledge_gap: persona.knowledge_gap,
      understood,
      confused,
    },
    memory: {
      unresolved: confused,
      resolved: understood,
      understanding: {
        ...persona.memory.understanding,
        [gap]: delta.to,
      },
    },
  }
}

export function buildClassroomReport(input: {
  personas: Persona[]
  turns: SimTurn[]
  analyses: { turnIndex: number; analysis: TeacherResponseAnalysis }[]
}): ClassroomSimReport {
  const byScore = input.analyses.map((x) => x.analysis.score)
  const total_score = byScore.length
    ? Math.round(byScore.reduce((a, b) => a + b, 0) / byScore.length)
    : 0

  const by_persona = input.personas.map((p) => {
    const idxs = input.turns
      .map((t, i) => (t.persona_id === p.id ? i : -1))
      .filter((i) => i >= 0)
    const scores = idxs
      .map((i) => input.analyses.find((a) => a.turnIndex === i)?.analysis.score)
      .filter((s): s is number => s != null)
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    return {
      persona_id: p.id,
      name: p.name,
      level: LEVEL_LABEL[p.level] || String(p.level),
      avg_score: avg,
      understood: p.learning_state?.understood || p.memory.resolved,
      still_confused: p.learning_state?.confused || p.memory.unresolved,
    }
  })

  const allStrengths = input.analyses.flatMap((a) => a.analysis.strengths)
  const allProblems = input.analyses.flatMap((a) => a.analysis.problems)
  const strengths = topFreq(allStrengths, 3)
  const problems = topFreq(allProblems, 3)
  const basic = by_persona.find((p) => p.level === '基础型')
  const suggestions = [
    basic && basic.avg_score < 80 ? '面对基础型学生：增加关键词拆解与举例' : '保持「观点+原文证据」节奏',
    problems.includes('缺少原文或关键词引用') ? '每答必引一句课文' : '可增加追问，落实形成性评价',
    '用板书把三名学生的缺口收成一条证据链',
  ]

  return {
    total_score,
    completed_rounds: input.analyses.length,
    total_rounds: input.turns.length,
    by_persona,
    strengths,
    problems: problems.length ? problems : ['互动轮次不足，建议完成 9 轮'],
    suggestions,
    summary: `课堂互动评分 ${total_score}/100。优势：${strengths[0] || '尚在形成'}。不足：${
      problems[0] || '暂无明显短板'
    }。`,
  }
}

function collectKeywords(brief: ChineseTextBrief): string[] {
  const fromText = [
    ...(brief.text?.excerpts || []).map((e) => e.text),
    ...(brief.text?.key_sentences || []).map((k) => k.text),
    ...(brief.text?.stacked_words || []).map((w) => w.word),
    ...brief.knowledge_points.文言实词.map((w) => w.split('：')[0]),
    brief.title,
    brief.author,
  ]
  const parts = fromText
    .join('｜')
    .split(/[，。；、｜\s]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && s.length <= 8)
  return [...new Set(parts)].slice(0, 24)
}

function overlapScore(a: string, b: string) {
  const toks = [...b].filter((c) => /[\u4e00-\u9fff]/.test(c))
  if (!toks.length) return 0
  const hit = toks.filter((c) => a.includes(c)).length
  return hit / toks.length
}

function topFreq(items: string[], n: number) {
  const m = new Map<string, number>()
  for (const x of items) m.set(x, (m.get(x) || 0) + 1)
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .slice(0, n)
}
