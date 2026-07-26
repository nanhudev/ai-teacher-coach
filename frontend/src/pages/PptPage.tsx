import { Navigate } from 'react-router-dom'
import { useState } from 'react'
import { downloadPptx, switchPptTemplate } from '../api/demo'
import { useDemo } from '../state/DemoContext'
import { StepNav } from '../components/StepNav'
import { PptStudio } from '../components/ppt/PptStudio'
import type { PptDesign, PptTemplateId } from '../components/ppt/types'
import { normalizeTemplateId } from '../components/ppt/types'
import { CoachSyncBar } from '../components/CoachSyncBar'
import { syncCourseFromIntent } from '../chinese/courseSync'

export function PptPage() {
  const { session, setSession, persistNow } = useDemo()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [slideNote, setSlideNote] = useState('')

  if (!session) return <Navigate to="/demo" replace />

  const current = session
  const { case_id, meta, mode } = current
  const ppt = current.ppt as unknown as PptDesign

  async function onDownload() {
    setBusy(true)
    setErr('')
    try {
      await downloadPptx(case_id, `${meta.label}.pptx`, ppt)
    } catch (e) {
      setErr(e instanceof Error ? e.message : '导出失败')
    } finally {
      setBusy(false)
    }
  }

  async function onTemplateChange(id: PptTemplateId) {
    if (normalizeTemplateId(ppt.template_id) === id) return
    setBusy(true)
    setErr('')
    try {
      const newPpt = await switchPptTemplate(case_id, id, current)
      setSession({ ...current, ppt: newPpt })
    } catch (e) {
      setErr(e instanceof Error ? e.message : '切换模板失败')
    } finally {
      setBusy(false)
    }
  }

  async function onRegenPpt() {
    const note = slideNote.trim() || current.teacher_intent || '按当前教案重点重做课件'
    setBusy(true)
    setErr('')
    try {
      const { session: next } = syncCourseFromIntent(current, note, {
        forceModules: ['ppt', 'lesson'],
      })
      setSession(next)
      await persistNow('AI 重做课件')
      setSlideNote('')
    } catch (e) {
      setErr(e instanceof Error ? e.message : '重做失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="text-sm text-leaf">PPT OS V2 · Skill 约束公开课</p>
      <h1 className="font-display mt-1 text-3xl">教育课件工作室</h1>
      <p className="mt-2 text-sm text-ink-muted">
        策划 → 视觉模板 → 质检；每页必有教学目标，禁止文章切页
      </p>
      {err && <p className="mt-2 text-sm text-accent">{err}</p>}

      <CoachSyncBar compact />

      <section className="mt-4 rounded-2xl bg-card p-4 ring-1 ring-ink/8">
        <p className="text-sm font-medium">对本课课件的修改意见</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={slideNote}
            onChange={(e) => setSlideNote(e.target.value)}
            placeholder="例如：增加原文分析页，突出人生困境"
            className="min-w-0 flex-1 rounded-xl bg-paper/80 px-3 py-2 text-sm outline-none ring-1 ring-ink/8"
            disabled={busy}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void onRegenPpt()}
            className="rounded-full bg-leaf px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {busy ? '重做中…' : 'AI 重做课件'}
          </button>
        </div>
      </section>

      <div className="mt-6">
        <PptStudio
          ppt={ppt}
          onTemplateChange={onTemplateChange}
          onDownload={onDownload}
          downloading={busy}
        />
      </div>

      {mode === 'ppt' ? (
        <StepNav back="/demo" />
      ) : (
        <StepNav back="/demo/lesson" next="/demo/before-after" nextLabel="看 Before / After" />
      )}
    </div>
  )
}
