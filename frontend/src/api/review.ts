import type { CourseReview } from '../review/types'
import { localReviewCourse } from '../review/localReview'

const BASE = import.meta.env.VITE_API_BASE || '/api/v1'

async function tryFetch(input: RequestInfo, init?: RequestInit) {
  try {
    return await fetch(input, init)
  } catch {
    return null
  }
}

export async function submitCourseReview(input: {
  files: File[]
  topicHint?: string
  lessonText?: string
  pptText?: string
}): Promise<CourseReview> {
  const fd = new FormData()
  if (input.topicHint) fd.append('topic_hint', input.topicHint)
  if (input.lessonText) fd.append('lesson_text', input.lessonText)
  if (input.pptText) fd.append('ppt_text', input.pptText)
  for (const f of input.files) fd.append('files', f)

  const res = await tryFetch(`${BASE}/review/analyze`, { method: 'POST', body: fd })
  if (res?.ok) return (await res.json()) as CourseReview

  // 前端兜底：尽量读文本文件；二进制 docx/pptx 只能提示走后端
  let lesson = input.lessonText || ''
  let ppt = input.pptText || ''
  const names: string[] = []
  for (const f of input.files) {
    names.push(f.name)
    const lower = f.name.toLowerCase()
    if (lower.endsWith('.txt') || lower.endsWith('.md')) {
      const t = await f.text()
      if (lower.includes('ppt') || lower.includes('课件')) ppt += `\n${t}`
      else lesson += `\n${t}`
    }
  }
  if (!lesson.trim() && !ppt.trim() && input.files.some((f) => /\.(docx|pptx)$/i.test(f.name))) {
    throw new Error('解析 docx/pptx 需要后端服务，请启动 API 后重试；也可粘贴文本诊断')
  }
  if (!lesson.trim() && !ppt.trim()) {
    throw new Error('请上传教案/课件，或粘贴文本')
  }
  return localReviewCourse({
    lessonText: lesson,
    pptText: ppt,
    topicHint: input.topicHint,
    sourceFiles: names,
  })
}
