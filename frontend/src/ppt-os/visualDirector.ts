import type { PlannedSlide } from './types'

/**
 * VisualDirector — 公开课视觉审查
 * 禁止 concept+连续 bullet；强制叙事页型
 */
const FORBIDDEN_BULLET_TYPES = new Set([
  'question',
  'question_card',
  'quote_analysis',
  'image_scene',
  'cover',
])

export function directVisualStory(slides: PlannedSlide[]): PlannedSlide[] {
  return slides.map((s) => {
    let next = { ...s }

    // concept + bullets → 情境页
    if (next.type === 'concept' || next.layout === 'literature_card') {
      if (next.bullets?.length && !next.text_excerpt && !next.analysis_cards?.length) {
        next = {
          ...next,
          type: 'image_scene',
          layout: 'image_scene',
          analysis_cards: next.bullets.slice(0, 4).map((b) => ({
            word: b.slice(0, 6),
            effect: '',
          })),
          key_message: next.key_message || next.bullets[0],
          bullets: undefined,
        }
      }
    }

    // 有原文 + 词卡 → quote_analysis
    if (
      (next.type === 'text_analysis' || next.layout === 'literature_card') &&
      (next.text_excerpt || next.key_message) &&
      (next.analysis_cards?.length || next.steps?.length)
    ) {
      next = {
        ...next,
        type: 'quote_analysis',
        layout: 'quote_analysis',
        bullets: undefined,
      }
    }

    // 问题页清 bullet
    if (next.type === 'question' || next.layout === 'question_focus') {
      next = {
        ...next,
        type: 'question_card',
        layout: 'question_card',
        main_question: next.main_question || next.key_message || next.title,
        bullets: undefined,
      }
    }

    if (FORBIDDEN_BULLET_TYPES.has(next.type) || FORBIDDEN_BULLET_TYPES.has(next.layout)) {
      next = { ...next, bullets: undefined }
    }

    // 连续 bullet ≥3 且无视觉结构 → 压成 steps
    if ((next.bullets?.length || 0) >= 3 && !next.steps?.length && !next.left) {
      next = {
        ...next,
        steps: next.bullets!.slice(0, 3).map((b, i) => ({
          label: `${i + 1}`,
          detail: b,
        })),
        bullets: undefined,
      }
    }

    return next
  })
}

/** 视觉叙事健康度：bullet 页越多越差 */
export function countBulletDumps(slides: PlannedSlide[]): number {
  return slides.filter((s) => (s.bullets?.length || 0) >= 3).length
}
