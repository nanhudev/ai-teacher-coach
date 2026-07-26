import type { CaseSummary, DemoSession } from '../types/demo'
import type { PptTemplateId } from '../components/ppt/types'
import { normalizeTemplateId, TEMPLATE_META } from '../components/ppt/types'
import chibi from './offline-chibi.json'

export const OFFLINE_CASES: CaseSummary[] = [
  {
    id: 'chibi-fu',
    label: '高中语文 · 《赤壁赋》',
    subject: '语文',
    grade: '高中',
    knowledge_points: ['文言诵读', '景情理交融', '苏轼旷达'],
  },
]

export function getOfflineSession(caseId: string, templateId?: string): DemoSession | null {
  if (caseId !== 'chibi-fu' && caseId !== 'ai-chibi-fu') return null
  const session = structuredClone(chibi) as DemoSession
  const tid = normalizeTemplateId(templateId || session.ppt?.template_id || 'gamma')
  session.ppt = {
    ...session.ppt,
    template_id: tid,
    template_name: TEMPLATE_META[tid].name,
  }
  return session
}

export function applyOfflineTemplate(session: DemoSession, templateId: PptTemplateId): DemoSession {
  const tid = normalizeTemplateId(templateId)
  return {
    ...session,
    ppt: {
      ...session.ppt,
      template_id: tid,
      template_name: TEMPLATE_META[tid].name,
    },
  }
}
