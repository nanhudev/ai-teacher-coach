import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useDemo } from '../state/DemoContext'
import { StepNav } from '../components/StepNav'
import { exportCoursePack } from '../export/coursePack'
import { CurriculumBasisBadge } from '../components/CurriculumBasisBadge'
import { CoachSyncBar } from '../components/CoachSyncBar'

export function DirectorPage() {
  const { session, setSession, persistNow } = useDemo()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  if (!session) return <Navigate to="/demo" replace />
  const current = session
  const d = current.director
  const bp = current.blueprint

  async function onPack() {
    setBusy(true)
    setMsg('')
    try {
      await exportCoursePack(current)
      setMsg('已开始下载：教案.docx + 课件.pptx + 作业.docx')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '导出失败')
    } finally {
      setBusy(false)
    }
  }

  function patchObjective(i: number, value: string) {
    const learning_objectives = [...d.learning_objectives]
    learning_objectives[i] = value
    setSession({
      ...current,
      director: { ...d, learning_objectives },
    })
  }

  function patchStrategyReason(i: number, value: string) {
    const teaching_strategy = d.teaching_strategy.map((s, idx) =>
      idx === i ? { ...s, reason: value } : s,
    )
    setSession({
      ...current,
      director: { ...d, teaching_strategy },
    })
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-leaf">AI 语文教研组 · 可编辑磨课</p>
          <h1 className="font-display mt-1 text-3xl">{d.course}</h1>
          <p className="mt-2 text-ink-muted">
            {d.grade}
            {d.subject} · {d.course_type} · {d.teaching_mode}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={onPack}
          className="rounded-full bg-leaf-deep px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? '打包中…' : '导出完整课程包'}
        </button>
      </div>
      {msg && <p className="mt-2 text-sm text-ink-muted">{msg}</p>}

      <CurriculumBasisBadge
        className="mt-4"
        line={current.curriculum_alignment?.basis_line}
        taskGroup={current.curriculum_alignment?.learning_task_group}
      />

      <CoachSyncBar />

      {current.last_impact && (
        <p className="mt-2 text-xs text-ink-muted">
          上次同步影响：{current.last_impact.affected_modules.join('、')}
        </p>
      )}

      {current.gaokao_value && (
        <section className="mt-4 rounded-2xl bg-card p-4 ring-1 ring-ink/8">
          <h2 className="text-sm font-medium text-ink">新高考价值（{current.gaokao_value.volume}）</h2>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs text-ink-muted">
            {current.gaokao_value.classroom_hooks.map((h) => (
              <li key={h} className="rounded-full bg-paper px-2.5 py-1">
                {h}
              </li>
            ))}
          </ul>
        </section>
      )}

      {bp && (
        <section className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-ink/8">
          <h2 className="font-display text-lg">课程蓝图（共享）</h2>
          <p className="mt-1 text-xs text-ink-muted">一句话：{bp.raw_input || current.meta.label}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {bp.knowledge_structure.map((k) => (
              <span key={k} className="rounded-full bg-leaf/10 px-2.5 py-1 text-leaf">
                {k}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Panel title="推荐教学模式 / 策略（可改）">
          <ul className="space-y-3">
            {d.teaching_strategy.map((s, i) => (
              <li key={s.name} className="rounded-xl bg-paper/80 p-3">
                <p className="font-medium">{s.name}</p>
                <textarea
                  value={s.reason}
                  onChange={(e) => patchStrategyReason(i, e.target.value)}
                  onBlur={() => void persistNow('编辑教研策略')}
                  rows={2}
                  className="mt-2 w-full rounded-lg bg-white/70 px-2 py-1.5 text-sm text-ink-muted outline-none ring-1 ring-ink/5"
                />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="教育学理论依据">
          <ul className="space-y-3">
            {d.recommended_theories.map((t) => (
              <li key={t.name} className="rounded-xl bg-paper/80 p-3">
                <p className="font-medium">{t.name}</p>
                <p className="mt-1 text-sm text-ink-muted">{t.reason}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="学习目标（可改）">
          <ul className="space-y-2">
            {d.learning_objectives.map((o, i) => (
              <li key={i}>
                <textarea
                  value={o}
                  onChange={(e) => patchObjective(i, e.target.value)}
                  onBlur={() => void persistNow('编辑学习目标')}
                  rows={2}
                  className="w-full rounded-lg bg-paper/80 px-2 py-1.5 text-sm outline-none ring-1 ring-ink/5"
                />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="学生难点预判">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {d.student_difficulties.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="教学流程" className="mt-4">
        <p className="mb-3 text-xs text-ink-muted">
          注入：{current.knowledge_injected.pedagogy_rule_names.join(' · ')}
        </p>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {d.stages.map((s) => (
            <li key={s.stage} className="rounded-xl bg-paper/80 p-3">
              <p className="font-medium">{s.stage}</p>
              <p className="mt-1 text-sm text-ink-muted">{s.intent}</p>
              <p className="mt-2 text-xs text-leaf">{s.theory}</p>
            </li>
          ))}
        </ol>
      </Panel>

      <StepNav next="/demo/lesson" nextLabel="查看教案" />
    </div>
  )
}

function Panel({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl bg-card p-5 ring-1 ring-ink/8 ${className}`}>
      <h2 className="font-display text-lg">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}
