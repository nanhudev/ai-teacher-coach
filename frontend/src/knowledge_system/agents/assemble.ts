import type { ChineseTextKnowledge, LiteraryKind } from '../../knowledge/chinese/types'
import { parseChineseInput, slugifyTitle } from '../../knowledge/chinese/parseInput'
import { sanitizePack } from '../../knowledge/chinese/generateKnowledge'
import { saveGeneratedText } from '../../knowledge/chinese/generated/cache'
import { lookupTextbookPack } from '../sources/textbook'
import { runKnowledgeRetrieval } from './retrieval'
import { runTextUnderstanding } from './text_understanding'
import { runKnowledgeVerifier } from './verifier'
import type { RetrievalBundle, TextUnderstanding, VerificationResult } from '../types'

export type RagBuildResult = {
  pack: ChineseTextKnowledge
  bundle: RetrievalBundle
  understanding: TextUnderstanding
  verification: VerificationResult
  from: 'verified' | 'rag_cached' | 'rag_assembled'
}

/**
 * RAG 主入口：检索 → 理解 → 审核 → 组装教学包 → 缓存
 * 禁止 DeepSeek/模板凭空造原文注释
 */
export function retrieveAndBuildPack(oneLiner: string): RagBuildResult {
  const parsed = parseChineseInput(oneLiner)

  // 教材精校整包直通（仍走审核标记）
  const textbook = lookupTextbookPack(oneLiner)
  if (textbook) {
    const pack = {
      ...textbook,
      source: 'verified' as const,
      confidence: 1,
    }
    const bundle = runKnowledgeRetrieval({ topic: textbook.title, raw: oneLiner })
    const understanding = runTextUnderstanding(bundle)
    const verification = runKnowledgeVerifier(bundle)
    return {
      pack,
      bundle,
      understanding,
      verification: { ...verification, verified: true, confidence: 1 },
      from: 'verified',
    }
  }

  const bundle = runKnowledgeRetrieval({
    subject: '高中语文',
    grade: '高中',
    topic: parsed.title,
    raw: oneLiner,
  })
  const understanding = runTextUnderstanding(bundle)
  const verification = runKnowledgeVerifier(bundle)
  const pack = assemblePack(parsed.title, bundle, understanding, verification)
  const clean = sanitizePack(pack)
  saveGeneratedText({ ...clean, source: 'cached' })
  return {
    pack: clean,
    bundle,
    understanding,
    verification,
    from: 'rag_assembled',
  }
}

function assemblePack(
  title: string,
  bundle: RetrievalBundle,
  u: TextUnderstanding,
  v: VerificationResult,
): ChineseTextKnowledge {
  const accepted = v.accepted_chunks
  const originals = accepted.filter((c) => c.kind === 'original_text')
  const annos = accepted.filter((c) => c.kind === 'annotation' && c.meta?.word)
  const exams = accepted.filter((c) => c.kind === 'exam_point')
  const bg = accepted.find((c) => c.kind === 'author_background')

  const kind: LiteraryKind =
    u.text_type === '文言文' ? 'classical' : u.text_type === '诗歌' ? 'poetry' : 'modern_prose'
  const isClassical = kind === 'classical' || kind === 'poetry'

  const shiCi = annos
    .filter((c) => c.meta?.pos !== '虚词')
    .map((c) => ({
      word: c.meta!.word!,
      meaning: c.meta!.meaning || '',
      example: c.meta?.example || originals[0]?.content?.slice(0, 16) || title,
    }))
  const xuCi = annos
    .filter((c) => c.meta?.pos === '虚词' || /于|而|之|以|其|者|所/.test(c.meta?.word || ''))
    .map((c) => ({
      word: c.meta!.word!,
      usage: c.meta!.meaning || '',
      example: c.meta?.example,
    }))

  // 无可靠注释时：不造假词，只放「待核对」支架
  const annotation =
    shiCi.length > 0
      ? {
          实词: shiCi.slice(0, 6),
          虚词: xuCi.slice(0, 4).length
            ? xuCi.slice(0, 4)
            : [{ word: '于／而／之', usage: '结合原文落实（待教材核对）', example: title }],
          句式: isClassical
            ? [{ type: '判断／被动／倒装', example: '从原文各找 1 例', note: '课前核对教材' }]
            : undefined,
        }
      : {
          实词: [
            {
              word: '（待教材核对）',
              meaning: '请从教材注释整理 5 个重点实词，禁止凭空填写',
              example: `见《${title}》注释`,
            },
          ],
          虚词: [{ word: '之／而／以', usage: '结合语境', example: '对照教材' }],
        }

  const excerpts =
    originals.length > 0
      ? originals.slice(0, 4).map((c) => ({
          label: c.meta?.label || '原文',
          text: c.content,
        }))
      : [
          {
            label: '待补原文',
            text: `请对照教材录入《${title}》关键句。系统已准备公开课框架，不编造原文。`,
          },
        ]

  const confidence = v.confidence
  const sourceLabel = bundle.text_source

  return {
    id: slugifyTitle(title),
    title,
    author: u.author || '（请核对教材）',
    dynasty: u.dynasty || (isClassical ? '（据教材核对）' : '现代'),
    unit: (bundle.query.unit as ChineseTextKnowledge['unit']) || '必修上',
    kind,
    ppt_style: isClassical ? 'classical' : 'modern_prose',
    source: confidence >= 0.9 ? 'verified' : confidence >= 0.75 ? 'cached' : 'ai_generated',
    confidence,
    excerpts,
    background: bg?.content || `围绕高中语文篇目《${title}》备课。资料来源：${sourceLabel}。`,
    background_bullets: [
      u.author || '作者（待核）',
      u.dynasty || '',
      u.core_theme.slice(0, 18),
      `来源：${sourceLabel}`.slice(0, 20),
    ].filter(Boolean),
    core_questions: [
      u.core_theme && !/待教材核对/.test(u.core_theme)
        ? `《${title}》如何表现「${u.core_theme.slice(0, 30)}」？`
        : `《${title}》要解决的核心问题是什么？`,
      u.key_sentences[0]
        ? `如何理解「${u.key_sentences[0].text.slice(0, 18)}」在全文中的作用？`
        : `哪一句最能体现作者态度？`,
      originals.length >= 2
        ? `从「${originals.map((c) => c.meta?.label || '关键句').slice(0, 3).join('—')}」看，全文的情感或论证怎样推进？`
        : `本课与高考如何对接？`,
    ],
    classroom_questions: [
      `读《${title}》，你最想弄清什么？`,
      u.key_sentences[0]
        ? `「${u.key_sentences[0].text.slice(0, 12)}」在说什么？请举证据。`
        : `哪一句最能代表作者？请举证据。`,
      isClassical ? `若出高考实词题，你抓哪两个词？` : `主旨能用文本证据说清吗？`,
    ],
    annotation,
    sentence_analysis: u.key_sentences.slice(0, 2).map((k) => ({
      sentence: k.text,
      translation: isClassical ? '课堂完成翻译（据注释）' : '口头释义',
      meaning: k.effect,
      grammar: k.technique,
    })),
    paragraph_analysis: excerpts.slice(0, 2).map((ex, i) => ({
      paragraph: i + 1,
      content: ex.text,
      analysis: isClassical ? ['实词', '句式', '主旨'] : ['结构', '手法', '情感'],
      teaching_value: ex.label,
    })),
    key_sentences: u.key_sentences.slice(0, 3).map((k) => ({
      text: k.text,
      technique: k.technique,
      effect: k.effect,
    })),
    stacked_words: (shiCi.length ? shiCi : []).slice(0, 5).map((w) => ({
      word: w.word,
      effect: w.meaning,
    })),
    scenery_layers: isClassical
      ? ['解题', '疏通文意', '关键句', '主旨探究', '高考迁移']
      : ['导入', '整体感知', '细读', '主旨', '高考迁移'],
    emotion_arc: originals.length
      ? originals.slice(0, 3).map((c) => ({
          stage: c.meta?.label || '关键文本',
          detail: c.content.slice(0, 24),
        }))
      : [
          { stage: '初读', detail: '整体感知' },
          { stage: '细读', detail: '证据链' },
          { stage: '探究', detail: u.core_theme.slice(0, 16) },
        ],
    literary_features: u.writing_features,
    structure: originals.length
      ? originals.slice(0, 4).map((c) => ({
          part: c.meta?.label || '文本层次',
          content: c.content.slice(0, 36),
        }))
      : [
          { part: '导入', content: '问题驱动' },
          { part: '初读', content: isClassical ? '疏通文意' : '整体感知' },
          { part: '细读', content: '关键句证据' },
          { part: '探究', content: '主旨价值' },
          { part: '迁移', content: '高考对接' },
        ],
    exam_points: exams.length
      ? exams.map((e) => e.content).slice(0, 5)
      : u.exam_value.slice(0, 5),
    gaokao_method: isClassical
      ? [
          { label: '实词', detail: '语境推断' },
          { label: '翻译', detail: '直译加句式' },
          { label: '主旨', detail: '观点加证据' },
        ]
      : [
          { label: '手法', detail: '指出手法' },
          { label: '画面', detail: '再现内容' },
          { label: '情感', detail: '落到主旨' },
        ],
    practice_item: {
      prompt: isClassical
        ? `从《${title}》选一句翻译，并指出 1 处特殊句式。`
        : `从《${title}》选一句赏析（手法→画面→情感）。`,
      hint: originals.length ? '必须引用已检索原文' : '必须引用教材原文',
    },
    knowledge_tree: isClassical
      ? ['实词虚词', '句式', '翻译', '主旨', '高考']
      : ['结构', '手法', '情感', '主旨', '高考'],
    common_questions: [`概括《${title}》主旨。`, '结合文本说明一个教学重点。'],
    teaching_difficulties: [
      originals.length ? '只背名句不见结构与价值' : '缺少原文时易空谈理论',
      isClassical ? '文言障碍影响主旨理解' : '只摘好句不见情感脉络',
      ...v.issues.slice(0, 1),
    ].filter(Boolean),
    visual_prompts: [
      isClassical
        ? `《${title}》文言公开课，宣纸墨色留白，16:9`
        : `《${title}》现代文公开课，文学杂志留白，16:9`,
    ],
  }
}
