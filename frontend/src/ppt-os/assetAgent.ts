import type { PlannedSlide } from './types'
import { clipBody, pptSkills } from './skills'

/**
 * AssetAgent — 为每页生成教学向视觉需求（不随机配图）
 */
export function attachAssets(slides: PlannedSlide[], topic: string): PlannedSlide[] {
  const slots = pptSkills.image.slots
  return slides.map((s) => {
    if (s.visual_prompt) return s
    let prompt = `${topic}·教学配图`
    if (s.section === 'cover') prompt = `${topic}：${slots.cover}`
    else if (s.section === 'author_context') prompt = `${topic}：${slots.author}`
    else if (s.section === 'text_excerpt' || s.section === 'keyword_analysis')
      prompt = `${topic}：${slots.text_analysis}`
    else if (s.section === 'emotion_arc') prompt = `${topic}：${slots.emotion}`
    return { ...s, visual_prompt: clipBody(prompt, 36) }
  })
}
