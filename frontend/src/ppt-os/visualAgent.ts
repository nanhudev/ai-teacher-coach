import type { ChineseTextBrief } from '../chinese/textAgent'
import type { PptTemplateId } from '../components/ppt/types'
import { TEMPLATE_META, normalizeTemplateId } from '../components/ppt/types'
import { pptSkills } from './skills'

/**
 * VisualDesignAgent — 固定模板库，禁止随机商业风
 */
export function pickVisualSystem(
  brief: ChineseTextBrief,
  prefer?: string,
): { template_id: PptTemplateId; template_name: string } {
  if (prefer && prefer !== 'auto') {
    const id = normalizeTemplateId(prefer)
    // 语文公开课禁用 gamma 粉卡
    if (id === 'gamma' || id === 'classroom') {
      const fallback = brief.text?.kind === 'modern_prose' ? 'coral' : 'sage'
      return { template_id: fallback, template_name: TEMPLATE_META[fallback].name }
    }
    return { template_id: id, template_name: TEMPLATE_META[id]?.name || id }
  }

  const kind = brief.text?.kind
  const style = brief.ppt_style
  if (style === 'competition') {
    const t = pptSkills.design.templates.inquiry_showcase
    return { template_id: t.id as PptTemplateId, template_name: t.name }
  }
  if (kind === 'modern_prose' || kind === 'narrative' || style === 'modern_prose') {
    const t = pptSkills.design.templates.modern_academic
    return { template_id: t.id as PptTemplateId, template_name: t.name }
  }
  const t = pptSkills.design.templates.ink_literature
  return { template_id: t.id as PptTemplateId, template_name: t.name }
}
