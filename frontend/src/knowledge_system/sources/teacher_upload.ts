import type { SourcedChunk } from '../types'

const KEY = 'aiteacher.chinese.teacher_upload.v1'

export type TeacherUploadDoc = {
  id: string
  title: string
  /** 原文摘录或教案文本 */
  content: string
  kind: '原文' | '教案' | '注释' | '考点' | '其他'
  uploaded_at: string
}

function read(): TeacherUploadDoc[] {
  try {
    if (typeof localStorage === 'undefined') return []
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as TeacherUploadDoc[]) : []
  } catch {
    return []
  }
}

function write(docs: TeacherUploadDoc[]) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(KEY, JSON.stringify(docs.slice(-50)))
  } catch {
    /* ignore */
  }
}

export function listTeacherUploads() {
  return read()
}

export function saveTeacherUpload(doc: Omit<TeacherUploadDoc, 'id' | 'uploaded_at'> & { id?: string }) {
  const docs = read()
  const item: TeacherUploadDoc = {
    id: doc.id || `up-${Date.now()}`,
    title: doc.title,
    content: doc.content,
    kind: doc.kind,
    uploaded_at: new Date().toISOString(),
  }
  docs.push(item)
  write(docs)
  return item
}

export function searchTeacherUpload(topic: string): SourcedChunk[] {
  const s = topic.replace(/\s+/g, '')
  return read()
    .filter((d) => s.includes(d.title) || d.title.includes(s.slice(0, 4)) || d.content.includes(s.slice(0, 4)))
    .flatMap((d, i) => {
      const kind: SourcedChunk['kind'] =
        d.kind === '原文'
          ? 'original_text'
          : d.kind === '注释'
            ? 'annotation'
            : d.kind === '考点'
              ? 'exam_point'
              : 'teaching_resource'
      return [
        {
          id: `upload-${d.id}-${i}`,
          kind,
          content: d.content.slice(0, 500),
          meta: { title: d.title, upload_kind: d.kind },
          source: 'teacher_upload' as const,
          source_label: `教师上传·${d.kind}`,
          confidence: 0.92,
          topic: d.title,
        },
      ]
    })
}
