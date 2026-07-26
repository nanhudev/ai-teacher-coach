import designRules from './skills/ppt_design_rules.json'
import litSkill from './skills/chinese_literature_skill.json'
import layoutSkill from './skills/visual_layout_skill.json'
import publicSkill from './skills/public_lesson_skill.json'
import imageSkill from './skills/image_skill.json'
import chartSkill from './skills/chart_skill.json'

export const pptSkills = {
  design: designRules,
  literature: litSkill,
  layout: layoutSkill,
  publicLesson: publicSkill,
  image: imageSkill,
  chart: chartSkill,
}

/** 压缩到公开课可读长度 */
export function clipTitle(s: string, max = pptSkills.design.rules.title_max_chars) {
  const t = (s || '').replace(/\s+/g, '').trim()
  return [...t].length <= max ? t : [...t].slice(0, max).join('')
}

export function clipBody(s: string, max = pptSkills.design.rules.body_max_chars) {
  const t = (s || '').trim()
  return [...t].length <= max ? t : `${[...t].slice(0, max - 1).join('')}…`
}
