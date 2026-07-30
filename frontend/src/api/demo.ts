import type { CaseSummary, DemoSession } from '../types/demo'
import type { PptTemplateId } from '../components/ppt/types'
import { applyOfflineTemplate, getOfflineSession } from '../data/offline'
import { exportPptxClient } from '../ppt-engine/v3/exportPptx'
import type { PptDesign } from '../components/ppt/types'
import { chineseDemoCases, runChinesePipeline } from '../chinese/runChinesePipeline'
import { looksLikeChineseLesson } from '../knowledge/chinese'

const BASE = import.meta.env.VITE_API_BASE || '/api/v1'

export type StreamEvent = {
  step: string
  status: string
  message?: string
  progress?: number
  index?: number
  total?: number
  preview?: Record<string, unknown>
  session?: DemoSession
}

async function tryFetch(input: RequestInfo, init?: RequestInit): Promise<Response | null> {
  try {
    return await fetch(input, init)
  } catch {
    return null
  }
}

export async function fetchCases(): Promise<CaseSummary[]> {
  // P0：只暴露高中语文知识库案例（禁止数学/物理等）
  return chineseDemoCases().map((c) => ({
    id: c.id,
    label: c.label,
    subject: c.subject,
    grade: c.grade,
    knowledge_points: c.knowledge_points,
  }))
}

export async function startDemo(
  caseId: string,
  roleType = 'k12',
  useAi = false,
): Promise<DemoSession> {
  const res = await tryFetch(`${BASE}/demo/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_id: caseId, role_type: roleType, use_ai: useAi }),
  })
  if (res?.ok) return res.json()
  const chinese = chineseDemoCases().find((c) => c.id === caseId)
  if (chinese) {
    return runChinesePipeline({ oneLiner: chinese.oneLiner, mode: 'full' })
  }
  const offline = getOfflineSession(caseId)
  if (offline) return offline
  throw new Error('无法启动体验：请输入高中语文课题')
}

async function readSse(
  res: Response,
  onEvent: (ev: StreamEvent) => void,
): Promise<DemoSession> {
  if (!res.ok || !res.body) {
    const t = await res.text()
    throw new Error(t || '流式生成失败')
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let session: DemoSession | null = null
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const chunks = buf.split('\n\n')
    buf = chunks.pop() || ''
    for (const chunk of chunks) {
      const line = chunk.split('\n').find((l) => l.startsWith('data: '))
      if (!line) continue
      const ev = JSON.parse(line.slice(6)) as StreamEvent
      onEvent(ev)
      if (ev.step === 'error') throw new Error(ev.message || '生成失败')
      if (ev.step === 'complete' && ev.session) session = ev.session
    }
  }
  if (!session) throw new Error('未收到完整结果')
  return session
}

export async function generateCustomStream(
  input: {
    course: string
    subject: string
    grade: string
    knowledge_points?: string[]
    period_count?: number
    template_id?: string
    mode?: 'full' | 'lesson' | 'ppt'
    require_ai?: boolean
  },
  onEvent: (ev: StreamEvent) => void,
): Promise<DemoSession> {
  const request = () =>
    tryFetch(`${BASE}/demo/generate/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  let res = await request()
  if (res && [502, 503, 504].includes(res.status)) {
    onEvent({
      step: 'understand',
      status: 'running',
      message: '生成服务正在唤醒，已自动重试，请稍候',
      progress: 5,
    })
    await new Promise((resolve) => window.setTimeout(resolve, 2200))
    res = await request()
  }
  if (res?.ok && res.body) return readSse(res, onEvent)
  if (input.require_ai) {
    const detail = res ? await res.text().catch(() => '') : ''
    throw new Error(
      detail ||
        'DeepSeek 课程生成服务暂时不可用。本次不会退回空框架，请稍后重试。',
    )
  }

  const oneLiner = `${input.grade}${input.subject} ${input.course}`
  const onPipe = (p: {
    step: string
    status: string
    message: string
    progress: number
    preview?: Record<string, unknown>
  }) =>
    onEvent({
      step: p.step,
      status: p.status,
      message: p.message,
      progress: p.progress,
      preview: p.preview,
    })

  // 高中语文：知识库优先 + AI 动态教学包（任意课题）
  if (looksLikeChineseLesson(oneLiner) || /语文/.test(input.subject)) {
    return runChinesePipeline(
      { oneLiner, template_id: input.template_id, mode: input.mode || 'full' },
      onPipe,
    )
  }
  throw new Error('当前版本专注高中语文。例如：高中语文 必修上 师说')
}

export async function startDemoStream(
  caseId: string,
  useAi: boolean,
  onEvent: (ev: StreamEvent) => void,
  roleType = 'k12',
): Promise<DemoSession> {
  const res = await tryFetch(`${BASE}/demo/start/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_id: caseId, role_type: roleType, use_ai: useAi }),
  })
  if (res?.ok && res.body) return readSse(res, onEvent)

  const chinese = chineseDemoCases().find((c) => c.id === caseId)
  if (chinese) {
    return runChinesePipeline({ oneLiner: chinese.oneLiner, mode: 'full' }, (p) =>
      onEvent({
        step: p.step,
        status: p.status,
        message: p.message,
        progress: p.progress,
        preview: p.preview,
      }),
    )
  }
  const offline = getOfflineSession(caseId)
  if (offline) {
    onEvent({ step: 'complete', status: 'done', message: '完成', progress: 100, session: offline })
    return offline
  }
  throw new Error('无法启动该示例')
}

export async function submitSimAnswer(
  caseId: string,
  turnIndex: number,
  teacherAnswer: string,
) {
  const res = await tryFetch(`${BASE}/demo/cases/${caseId}/simulate/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ turn_index: turnIndex, teacher_answer: teacherAnswer }),
  })
  if (res?.ok) return res.json()
  return {
    turn_index: turnIndex,
    teacher_answer: teacherAnswer,
    persona_id: `p${turnIndex + 1}`,
    understanding_delta: {
      gap: '即时反馈',
      from: '未解决',
      to: '部分理解',
      note: '本地模拟反馈',
    },
    hint_sample_answer: '先肯定提问，再结合板书要点回应。',
  }
}

export async function switchPptTemplate(caseId: string, templateId: PptTemplateId, session: DemoSession) {
  const res = await tryFetch(`${BASE}/demo/cases/${caseId}/ppt/template`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template_id: templateId }),
  })
  if (res?.ok) return res.json()
  return applyOfflineTemplate(session, templateId).ppt
}

export async function downloadPptx(
  _caseId: string,
  filenameHint = 'lesson.pptx',
  ppt?: PptDesign,
) {
  const res = await tryFetch(`${BASE}/demo/cases/${_caseId}/pptx`, { method: 'POST' })
  if (res?.ok) {
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filenameHint.endsWith('.pptx') ? filenameHint : `${filenameHint}.pptx`
    a.click()
    URL.revokeObjectURL(url)
    return
  }
  if (!ppt) throw new Error('无课件数据可导出')
  await exportPptxClient(ppt, filenameHint)
}

/** DeepSeek 理解磨课意见；失败返回 null，前端走本地 sync */
export async function requestCourseSync(teacherIntent: string, session: DemoSession) {
  const res = await tryFetch(`${BASE}/demo/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teacher_intent: teacherIntent, session }),
  })
  if (!res?.ok) return null
  try {
    return (await res.json()) as {
      ok: boolean
      source?: string
      patch?: {
        affected_modules?: string[]
        lesson_request?: string
        simulation_focus?: string
        director_patch?: Record<string, unknown>
        reasons?: Record<string, string>
      }
      error?: string
    }
  } catch {
    return null
  }
}

/** DeepSeek 五维评分；失败返回 null */
export async function evaluateTeacherAnswerRemote(
  session: DemoSession,
  turnIndex: number,
  teacherAnswer: string,
) {
  const res = await tryFetch(`${BASE}/demo/evaluate-answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      turn_index: turnIndex,
      teacher_answer: teacherAnswer,
      session,
    }),
  })
  if (!res?.ok) return null
  try {
    return await res.json()
  } catch {
    return null
  }
}

export { chineseDemoCases }
