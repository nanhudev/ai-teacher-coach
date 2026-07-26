import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useDemo } from '../state/DemoContext'
import { StepNav } from '../components/StepNav'
import { exportLessonDocx } from '../lesson-engine/exportLessonDocx'
import { exportCoursePack, exportHomeworkDocx } from '../export/coursePack'
import {
  REVISION_QUICK_TAGS,
  applyRevisionToSession,
  suggestImprovements,
} from '../chinese/lessonRevisionAgent'
import { CurriculumBasisBadge } from '../components/CurriculumBasisBadge'
import { CoachSyncBar } from '../components/CoachSyncBar'

export function LessonPage() {
  const { session, setSession, persistNow } = useDemo()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [request, setRequest] = useState('')
  const [syncPpt, setSyncPpt] = useState(true)
  const [revising, setRevising] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [pendingRevise, setPendingRevise] = useState<{
    request: string
    syncPpt: boolean
  } | null>(null)

  if (!session) return <Navigate to="/demo" replace />
  const current = session
  const { lesson, objective_alignment: align, meta, mode } = current
  const o3 = lesson.objectives_3d
  const hw = lesson.homework
  const version = current.lesson_version || 1

  const tips = useMemo(() => suggestImprovements(lesson), [lesson])

  async function onExport() {
    setBusy(true)
    setErr('')
    try {
      await exportLessonDocx(current, `${meta.label}-教案.docx`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : '导出失败')
    } finally {
      setBusy(false)
    }
  }

  async function onHomework() {
    setBusy(true)
    setErr('')
    try {
      await exportHomeworkDocx(current)
    } catch (e) {
      setErr(e instanceof Error ? e.message : '导出失败')
    } finally {
      setBusy(false)
    }
  }

  async function onPack() {
    setBusy(true)
    setErr('')
    try {
      await exportCoursePack(current)
    } catch (e) {
      setErr(e instanceof Error ? e.message : '导出失败')
    } finally {
      setBusy(false)
    }
  }

  function addTag(text: string) {
    setRequest((prev) => (prev.trim() ? `${prev.trim()}，{text}` : text))
  }

  function onRevise() {
    const req = request.trim()
    if (!req) {
      setErr('请输入修改需求，或点击快捷标签')
      return
    }
    setPendingRevise({ request: req, syncPpt })
    setPanelOpen(false)
  }

  async function commitRevise(mode: 'new' | 'replace') {
    if (!pendingRevise) return
    setRevising(true)
    setErr('')
    try {
      await new Promise((r) => setTimeout(r, 280))
      const next = applyRevisionToSession(current, pendingRevise.request, {
        syncPpt: pendingRevise.syncPpt,
      })
      if (mode === 'replace') {
        // 替换：不保留刚生成的历史叠层以外的「新版本号展示」——仍写入内容，但不强调新 V
        setSession({
          ...next,
          lesson_version: current.lesson_version || 1,
          lesson_history: current.lesson_history || [],
        })
        await persistNow(`替换教案，{pendingRevise.request.slice(0, 24)}`)
      } else {
        setSession(next)
        await persistNow(`新版教案，{pendingRevise.request.slice(0, 24)}`)
      }
      setPendingRevise(null)
      setRequest('')
    } catch (e) {
      setErr(e instanceof Error ? e.message : '优化失败')
    } finally {
      setRevising(false)
    }
  }

  function restoreVersion(v: number) {
    const snap = current.lesson_history?.find((h) => h.version === v)
    if (!snap) return
    setSession({
      ...current,
      lesson: JSON.parse(JSON.stringify(snap.lesson)),
      lesson_version: v,
      last_revision: {
        request: `回退分V${v}`,
        change_summary: [`已恢复V${v}`],
        revision_summary: [],
        teaching_improvement: tips,
      },
    })
    void persistNow(`回退教案分V${v}`)
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-leaf">
            中学标准教案 · V{version}
            {current.last_revision ? ' · 已磨课' : ''}
          </p>
          <h1 className="font-display mt-1 text-3xl">{lesson.title}</h1>
          <p className="mt-2 text-sm text-ink-muted">
            {lesson.subject || meta.subject} · {lesson.grade || meta.grade} ·{' '}
            {lesson.lesson_type || '新授课'} · {lesson.periods || '1课时'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="rounded-full bg-leaf-deep px-5 py-2.5 text-sm font-semibold text-white shadow-md"
          >
            重新优化教案
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={busy}
            className="rounded-full bg-card px-4 py-2.5 text-sm font-medium text-ink ring-1 ring-ink/10 disabled:opacity-60"
          >
            {busy ? '导出中…' : '下载教案 DOCX'}
          </button>
          <button
            type="button"
            onClick={onHomework}
            disabled={busy}
            className="rounded-full bg-card px-4 py-2.5 text-sm font-medium text-ink ring-1 ring-ink/10 disabled:opacity-60"
          >
            下载作业 DOCX
          </button>
          {mode === 'full' && (
            <button
              type="button"
              onClick={onPack}
              disabled={busy}
              className="rounded-full bg-card px-4 py-2.5 text-sm font-medium text-ink ring-1 ring-ink/10 disabled:opacity-60"
            >
              完整课程包            </button>
          )}
        </div>
      </div>
      {err && <p className="mt-2 text-sm text-accent">{err}</p>}

      <CurriculumBasisBadge
        className="mt-4"
        line={current.curriculum_alignment?.basis_line}
        taskGroup={current.curriculum_alignment?.learning_task_group}
      />

      <CoachSyncBar compact />

      {/* 推荐优化 */}
      <section className="mt-4 rounded-2xl bg-card/90 p-4 ring-1 ring-ink/8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-ink">推荐优化（像教研员看课）</h2>
          {(current.lesson_history?.length || 0) > 0 && (
            <button
              type="button"
              className="text-xs text-leaf underline-offset-2 hover:underline"
              onClick={() => setShowHistory((v) => !v)}
            >
              {showHistory ? '收起版本' : `历史版本，{current.lesson_history!.length}）`}
            </button>
          )}
        </div>
        <ul className="mt-2 space-y-1 text-sm text-ink-muted">
          {tips.map((t) => (
            <li key={t}>· {t}</li>
          ))}
        </ul>
        {current.last_revision && (
          <div className="mt-3 rounded-xl bg-paper-2/70 p-3 text-sm">
            <p className="font-medium text-ink">
              V{version} 修改摘要
              <span className="ml-2 font-normal text-ink-muted">
                「{current.last_revision.request.slice(0, 36)}
                {current.last_revision.request.length > 36 ? '…' : ''}。              </span>
            </p>
            <ul className="mt-1 list-disc pl-5 text-ink-muted">
              {current.last_revision.change_summary.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            {!!current.last_revision.revision_summary.length && (
              <ul className="mt-2 space-y-1 border-t border-ink/5 pt-2 text-xs text-ink-muted">
                {current.last_revision.revision_summary.map((r) => (
                  <li key={r.after}>
                    <span className="text-ink/70">{r.before}</span>
                    {' →'}
                    <span className="text-leaf-deep">{r.after}</span>
                    <span className="text-ink-muted">（{r.reason}，</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {showHistory && !!current.lesson_history?.length && (
          <ul className="mt-3 space-y-2 border-t border-ink/5 pt-3 text-sm">
            {current.lesson_history
              .slice()
              .reverse()
              .map((h) => (
                <li key={h.version} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    V{h.version}
                    <span className="ml-2 text-ink-muted">{h.request.slice(0, 28)}</span>
                  </span>
                  <button
                    type="button"
                    className="text-xs text-leaf underline-offset-2 hover:underline"
                    onClick={() => restoreVersion(h.version)}
                  >
                    恢复此版
                  </button>
                </li>
              ))}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.95fr]">
        <section className="rounded-2xl bg-card p-5 ring-1 ring-ink/8">
          <h2 className="font-display text-lg">教学过程（可编辑）</h2>
          <div className="mt-4 space-y-4">
            {lesson.process.map((p, idx) => (
              <article key={p.stage + p.time + idx} className="border-l-2 border-leaf/40 pl-4">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="font-medium">{p.stage}</h3>
                  <span className="text-xs text-leaf">{p.theory}</span>
                  <span className="text-xs text-ink-muted">{p.time}</span>
                </div>
                <label className="mt-2 block text-xs text-ink-muted">教师活动</label>
                <textarea
                  value={p.teacher_action}
                  onChange={(e) => {
                    const process = lesson.process.map((x, i) =>
                      i === idx ? { ...x, teacher_action: e.target.value } : x,
                    )
                    setSession({ ...current, lesson: { ...lesson, process } })
                  }}
                  onBlur={() => void persistNow('编辑教案·教师活动')}
                  rows={2}
                  className="mt-1 w-full rounded-lg bg-paper/70 px-2 py-1.5 text-sm outline-none ring-1 ring-ink/5"
                />
                <label className="mt-2 block text-xs text-ink-muted">学生活动</label>
                <textarea
                  value={p.student_action}
                  onChange={(e) => {
                    const process = lesson.process.map((x, i) =>
                      i === idx ? { ...x, student_action: e.target.value } : x,
                    )
                    setSession({ ...current, lesson: { ...lesson, process } })
                  }}
                  onBlur={() => void persistNow('编辑教案·学生活动')}
                  rows={2}
                  className="mt-1 w-full rounded-lg bg-paper/70 px-2 py-1.5 text-sm outline-none ring-1 ring-ink/5"
                />
                {p.intent && (
                  <p className="mt-1 text-xs text-ink-muted">设计意图：{p.intent}</p>
                )}
              </article>
            ))}
          </div>

          {hw && (
            <div className="mt-6 rounded-xl bg-paper-2/60 p-4">
              <h3 className="font-medium">分层作业</h3>
              <p className="mt-2 text-xs text-ink-muted">基础</p>
              <ul className="list-disc pl-5 text-sm">
                {hw.basic.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-muted">提升</p>
              <ul className="list-disc pl-5 text-sm">
                {hw.advanced.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-muted">拓展</p>
              <ul className="list-disc pl-5 text-sm">
                {hw.extension.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="space-y-4">
          {(lesson.textbook_analysis || lesson.student_analysis) && (
            <section className="rounded-2xl bg-card p-5 ring-1 ring-ink/8">
              <h2 className="font-display text-lg">教材 · 学情</h2>
              {lesson.textbook_analysis && (
                <p className="mt-3 text-sm leading-relaxed">{lesson.textbook_analysis}</p>
              )}
              {lesson.student_analysis && (
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{lesson.student_analysis}</p>
              )}
            </section>
          )}

          <section className="rounded-2xl bg-card p-5 ring-1 ring-ink/8">
            <h2 className="font-display text-lg">三维目标 · 重难点</h2>
            {o3 ? (
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-ink-muted">知识与技能</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {o3.knowledge.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-muted">过程与方法</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {o3.process.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-muted">情感态度与价值观</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {o3.values.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {lesson.objectives.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs font-medium text-ink-muted">重点</p>
            <p className="text-sm">{lesson.key_points.join('、')}</p>
            <p className="mt-3 text-xs font-medium text-ink-muted">难点</p>
            <p className="text-sm">{lesson.difficulty_points.join('、')}</p>
          </section>

          {lesson.exam_link && (
            <section className="rounded-2xl bg-card p-5 ring-1 ring-ink/8">
              <h2 className="font-display text-lg">{lesson.exam_link.exam_type}衔接</h2>
              <p className="mt-2 text-sm">考点：{lesson.exam_link.points.join('、')}</p>
              <p className="mt-1 text-sm text-ink-muted">
                题型：{lesson.exam_link.question_types.join('、')}
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                {lesson.exam_link.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>
          )}

          {mode === 'full' && (
            <section className="rounded-2xl bg-leaf-deep p-5 text-white">
              <div className="flex items-end justify-between gap-3">
                <h2 className="font-display text-lg">目标—活动一致性</h2>
                <p className="font-display text-4xl">{align.score}</p>
              </div>
              <p className="mt-2 text-sm text-white/80">{align.summary}</p>
            </section>
          )}
        </div>
      </div>

      {mode === 'lesson' ? <StepNav back="/demo" /> : (
        <StepNav back="/demo/director" next="/demo/ppt" nextLabel="查看课件预览" />
      )}

      {/* 磨课侧栏 */}
      {panelOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-ink/30 backdrop-blur-[2px]">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="关闭"
            onClick={() => !revising && setPanelOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-card shadow-2xl ring-1 ring-ink/10">
            <div className="border-b border-ink/8 px-5 py-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl">重新优化教案</h2>
                <button
                  type="button"
                  className="text-sm text-ink-muted"
                  onClick={() => !revising && setPanelOpen(false)}
                >
                  关闭
                </button>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                保留教材准确性与核心问题，按你的课型需求打磨              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-xs font-medium text-ink-muted">快捷优化</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {REVISION_QUICK_TAGS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => addTag(t.request)}
                    className="rounded-full bg-paper-2 px-3 py-1 text-xs text-ink ring-1 ring-ink/8 hover:bg-leaf/10 hover:text-leaf-deep"
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <label className="mt-5 block text-xs font-medium text-ink-muted">
                请输入修改需求              </label>
              <textarea
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                rows={6}
                placeholder="例如：我要参加省级公开课，增加学生互动，突出核心素养，控制在 5 分钟。"
                className="mt-2 w-full rounded-2xl border-0 bg-paper-2/80 px-4 py-3 text-sm text-ink outline-none ring-1 ring-ink/8 focus:ring-leaf/40"
              />

              <label className="mt-4 flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={syncPpt}
                  onChange={(e) => setSyncPpt(e.target.checked)}
                  className="accent-[var(--color-leaf,#1f6b55)]"
                />
                同步优化 PPT（公开课视觉）
              </label>
            </div>

            <div className="border-t border-ink/8 px-5 py-4">
              <button
                type="button"
                disabled={revising || !request.trim()}
                onClick={onRevise}
                className="w-full rounded-2xl bg-leaf-deep py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {revising ? '教研员打磨中…' : '生成新版教案'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {pendingRevise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl ring-1 ring-ink/10">
            <h2 className="font-display text-xl">已生成新版教案</h2>
            <p className="mt-2 text-sm text-ink-muted">
              需求：「{pendingRevise.request.slice(0, 48)}
              {pendingRevise.request.length > 48 ? '…' : ''}」是否保存为新版本？
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={revising}
                onClick={() => void commitRevise('new')}
                className="rounded-full bg-leaf-deep px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {revising ? '保存中…' : '保存为新版本'}
              </button>
              <button
                type="button"
                disabled={revising}
                onClick={() => void commitRevise('replace')}
                className="rounded-full bg-paper-2 px-4 py-2.5 text-sm text-ink ring-1 ring-ink/10"
              >
                替换当前
              </button>
              <button
                type="button"
                disabled={revising}
                onClick={() => setPendingRevise(null)}
                className="rounded-full px-4 py-2.5 text-sm text-ink-muted"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
