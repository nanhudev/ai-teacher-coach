import type { ChineseTextBrief } from '../chinese/textAgent'
import type { PlannedSlide, PptPlan } from './types'
import { clipBody, clipTitle, pptSkills } from './skills'

/**
 * PPTPlanningAgent V3 — 公开课视觉叙事
 * 视觉中心 → 一问 → 原文证据 → 学生想 → 教师点拨
 * 禁止 concept + 连续 bullet 备课提纲
 */
export function planChinesePpt(
  brief: ChineseTextBrief,
  sparse = false,
): Omit<PptPlan, 'template_id' | 'template_name'> {
  const kb = brief.text!
  const t = brief.title
  const author = brief.author
  const qs = kb.classroom_questions?.length
    ? kb.classroom_questions
    : brief.core_questions
  const heroQ =
    qs[0] ||
    brief.core_questions[0] ||
    `为什么读《${t}》仍要停在这一句？`
  const cardLimit = sparse ? 3 : 3
  const slides: PlannedSlide[] = []
  let n = 0
  const push = (s: Omit<PlannedSlide, 'slide_number'>) => {
    slides.push({ ...s, slide_number: ++n })
  }

  const goal = pptSkills.literature.section_goals

  push({
    section: 'cover',
    type: 'cover',
    layout: 'cover_hero',
    title: clipTitle(t),
    subtitle: `${author}${kb.dynasty ? ` · ${kb.dynasty}` : ''}`,
    main_question: clipBody(heroQ, 28),
    key_message: clipBody(heroQ, 28),
    slide_goal: goal.cover,
    teacher_action: '亮出主问题，不先给结论',
    student_action: '带着问题进入文本',
    visual_prompt: brief.visual_prompts[0] || `${t}公开课情境`,
    source_reference: `《${t}》· 封面`,
    minutes_hint: 1,
  })

  // 情境：词牌，不是百科 bullet
  const sceneTags =
    (kb.background_bullets || []).slice(0, 4).length >= 2
      ? (kb.background_bullets || []).slice(0, 4)
      : [author, kb.dynasty || '现代', '北国', '秋味'].filter(Boolean)
  push({
    section: 'author_context',
    type: 'image_scene',
    layout: 'image_scene',
    title: clipTitle(`${author}的秋`),
    main_question: clipBody(`走进《${t}》的心境`, 20),
    key_message: clipBody(
      kb.background || brief.text_background || '只留读懂文本的一个锚点',
      48,
    ),
    analysis_cards: sceneTags.slice(0, 4).map((w) => ({
      word: clipTitle(w, 6),
      effect: '',
    })),
    slide_goal: goal.author_context,
    teacher_action: '删百科，只留读文必需',
    student_action: '记下与文本相关的一个锚点',
    visual_prompt: brief.visual_prompts[0] || '北平秋晨',
    source_reference: `《${t}》· 情境`,
    minutes_hint: 2,
  })

  push({
    section: 'main_question',
    type: 'question_card',
    layout: 'question_card',
    title: clipTitle('先问真问题'),
    main_question: clipBody(heroQ, 32),
    key_message: clipBody(heroQ, 32),
    slide_goal: goal.main_question,
    teacher_action: '不先讲结论，把问题交给学生',
    student_action: '30 秒说直觉，不求正确',
    curriculum_goal: '思维发展与提升',
    source_reference: `《${t}》· 主问题`,
    minutes_hint: 3,
  })

  // 文眼 / 首句：quote_analysis（大问 + 原文 + 三词）
  const eye =
    kb.key_sentences?.[0] ||
    (kb.excerpts?.[0]
      ? {
          text: kb.excerpts[0].text,
          technique: '文眼',
          effect: '定调',
        }
      : null)
  const words =
    kb.stacked_words?.length
      ? kb.stacked_words
      : (kb.annotation?.实词 || []).map((w) => ({ word: w.word, effect: w.meaning }))

  if (eye?.text) {
    push({
      section: 'text_excerpt',
      type: 'quote_analysis',
      layout: 'quote_analysis',
      title: clipTitle(eye.technique || '文眼'),
      main_question: clipBody(
        qs[0] || `为什么偏偏是「${words[0]?.word || '这一句'}」？`,
        32,
      ),
      text_excerpt: clipBody(eye.text, 56),
      key_message: clipBody(eye.text, 56),
      analysis_cards: words.slice(0, cardLimit).map((w) => ({
        word: clipTitle(w.word, 6),
        effect: clipBody(w.effect, 14),
      })),
      slide_goal: goal.text_excerpt,
      teacher_action: '写的是景，落的是人',
      student_action: '圈一词，说画面',
      curriculum_goal: '语言建构 · 审美鉴赏',
      source_reference: `《${t}》· 文眼`,
      closing: clipBody(eye.effect || '三词定调', 24),
      minutes_hint: 6,
    })
  }

  // 其余原文：每页一问一证（最多 2）
  const moreEx = (kb.excerpts || []).slice(eye?.text ? 1 : 0, sparse ? 2 : 3)
  moreEx.forEach((ex, i) => {
    const q = qs[Math.min(i + 1, qs.length - 1)] || '这句话写出了什么？'
    const cards =
      kb.scenery_layers?.slice(i * 2, i * 2 + 3).map((w) => ({
        word: clipTitle(w, 4),
        effect: '细处着笔',
      })) ||
      words.slice(0, 3).map((w) => ({
        word: clipTitle(w.word, 6),
        effect: clipBody(w.effect, 12),
      }))
    push({
      section: 'text_excerpt',
      type: 'quote_analysis',
      layout: 'quote_analysis',
      title: clipTitle(ex.label || '读这一句'),
      main_question: clipBody(q, 32),
      text_excerpt: clipBody(ex.text, 56),
      key_message: clipBody(ex.text, 56),
      analysis_cards: cards.slice(0, 3),
      slide_goal: goal.text_excerpt,
      teacher_action: '追问：你看见了什么画面？',
      student_action: '朗读 · 一句证据',
      curriculum_goal: '语言建构与运用 · 审美鉴赏',
      source_reference: `《${t}》· ${ex.label}`,
      minutes_hint: 5,
    })
  })

  // 手法：仍用 quote_analysis，不用 bullet
  const tech = kb.key_sentences?.[0] || kb.sentence_analysis?.[0]
  const techText =
    (tech && 'text' in tech ? tech.text : null) ||
    (tech && 'sentence' in tech ? (tech as { sentence: string }).sentence : '') ||
    kb.excerpts?.[0]?.text ||
    ''
  const technique =
    (tech && 'technique' in tech ? tech.technique : null) ||
    kb.literary_features?.[0] ||
    '手法'
  const effect =
    (tech && 'effect' in tech ? tech.effect : null) ||
    (tech && 'meaning' in tech ? (tech as { meaning: string }).meaning : null) ||
    '服务情感与画面'

  // ponytail: 文眼页已覆盖同句时跳过手法页，避免重复
  const eyeAlready = eye?.text && techText && eye.text.slice(0, 12) === techText.slice(0, 12)
  if (!eyeAlready && (!sparse || slides.length < 8)) {
    push({
      section: 'technique_analysis',
      type: 'quote_analysis',
      layout: 'quote_analysis',
      title: clipTitle(technique),
      main_question: clipBody(`「${technique}」如何服务情感？`, 28),
      text_excerpt: clipBody(techText, 56),
      key_message: clipBody(techText, 56),
      analysis_cards: [
        { word: clipTitle(technique, 6), effect: clipBody(effect, 14) },
        {
          word: clipTitle(kb.literary_features?.[1] || '证据', 6),
          effect: '回到原文',
        },
        {
          word: clipTitle(kb.literary_features?.[2] || '情感', 6),
          effect: clipBody(effect, 12),
        },
      ],
      slide_goal: goal.technique_analysis,
      teacher_action: '手法必须回到原文证据',
      student_action: '用原文证明手法作用',
      source_reference: `《${t}》· 手法`,
      minutes_hint: 5,
    })
  }

  const arc =
    kb.emotion_arc?.map((a) => `${a.stage}：${a.detail}`) ||
    kb.scenery_layers ||
    kb.structure?.map((s) => `${s.part}：${s.content}`) || [
      '走进情境',
      '细读证据',
      '情感落点',
    ]
  push({
    section: 'emotion_arc',
    type: 'process',
    layout: 'process_arc',
    title: clipTitle('情感路径'),
    main_question: clipBody('情绪如何一步步落下来？', 24),
    key_message: clipBody(
      arc.map((x) => clipTitle(x.split(/[：:]/)[0], 6)).join(' → '),
      40,
    ),
    steps: arc.slice(0, cardLimit + 1).map((label, i) => ({
      label: `${i + 1}`,
      detail: clipBody(label, 28),
    })),
    slide_goal: goal.emotion_arc,
    teacher_action: '看见变化，不贴标签',
    student_action: '给每一段标一个情绪词',
    source_reference: `《${t}》· 情感`,
    minutes_hint: 4,
  })

  push({
    section: 'classroom_task',
    type: 'question_card',
    layout: 'question_card',
    title: clipTitle('课堂任务'),
    main_question: clipBody(qs[1] || qs[0] || '你如何用原文证明？', 32),
    key_message: clipBody('观点 + 原文证据', 20),
    slide_goal: goal.classroom_task,
    teacher_action: '巡视支架，追问证据',
    student_action: '完成证据卡并展示',
    curriculum_goal: '语言建构 · 思维提升',
    source_reference: `《${t}》· 活动`,
    minutes_hint: 8,
  })

  const exam = (kb.exam_points || brief.exam_focus || []).slice(0, 3).map((x) =>
    clipBody(x, 22),
  )
  push({
    section: 'gaokao_transfer',
    type: 'comparison',
    layout: 'compare_lens',
    title: clipTitle('高考迁移'),
    subtitle: '可迁移的答题路径',
    main_question: clipBody('如何把本课答法带走？', 24),
    left: exam.length ? exam : [clipBody('手法—画面—情感', 18)],
    right: [clipBody('观点', 8), clipBody('原文证据', 10), clipBody('效果分析', 10)],
    slide_goal: goal.gaokao_transfer,
    teacher_action: '示范一条完整作答链',
    student_action: '用本课一句完成迁移',
    source_reference: `《${t}》· 高考`,
    minutes_hint: 5,
  })

  push({
    section: 'homework',
    type: 'homework',
    layout: 'homework_tier',
    title: clipTitle('分层作业'),
    main_question: clipBody('带走一句，写清证据', 20),
    steps: [
      { label: '基础', detail: clipBody('摘录文眼句，解释清/静/悲凉', 36) },
      { label: '提升', detail: clipBody('选一细小景物，写画面与心境', 36) },
      ...(sparse
        ? []
        : [{ label: '拓展', detail: clipBody('比较另一篇写秋散文的心境', 36) }]),
    ],
    slide_goal: goal.homework,
    teacher_action: '分层布置，反馈关键证据',
    student_action: '按层次完成并自查证据',
    source_reference: `《${t}》· 作业`,
    minutes_hint: 2,
  })

  push({
    section: 'summary',
    type: 'summary',
    layout: 'summary_close',
    title: clipTitle('本课带走'),
    main_question: clipBody(heroQ, 28),
    key_message: clipBody(heroQ, 28),
    steps: [
      { label: '一问', detail: '一个主问题' },
      { label: '一证', detail: '一处原文证据' },
      { label: '一感', detail: '一条情感变化' },
    ],
    slide_goal: '收束公开课，强化可带走的学习结果',
    teacher_action: '回扣主问题',
    student_action: '一句话出口票',
    source_reference: `《${t}》· 收束`,
    minutes_hint: 2,
  })

  return {
    topic: t,
    learning_objective: clipBody(heroQ, 40),
    slides,
    engine: 'ppt-os-v3',
  }
}
