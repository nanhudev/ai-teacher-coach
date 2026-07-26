import { Link, Navigate } from 'react-router-dom'
import { useDemo } from '../state/DemoContext'
import { StepNav } from '../components/StepNav'
import { exportProjectBackup } from '../storage/localProjectStore'

export function EvaluationPage() {
  const { session, answered, persistNow } = useDemo()
  if (!session) return <Navigate to="/demo" replace />
  const ev = session.evaluation
  const report = session.classroom_sim_report
  const answeredCount = Object.keys(answered).length

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-leaf">课堂评价报告</p>
          <h1 className="font-display mt-1 text-3xl">本次教学反馈</h1>
          <p className="mt-2 text-sm text-ink-muted">
            虚拟班级已完成{answeredCount}/{session.simulation_turns.length} 轮问答            {session.local_project_id ? ' · 已自动保存到我的课程' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void persistNow('评价页确认保存')}
            className="rounded-full bg-leaf px-4 py-2 text-sm text-white"
          >
            保存到我的课程          </button>
          {session.local_project_id && (
            <button
              type="button"
              onClick={() => void exportProjectBackup(session.local_project_id!)}
              className="rounded-full bg-card px-4 py-2 text-sm ring-1 ring-ink/10"
            >
              导出课程备份
            </button>
          )}
          <Link
            to="/app/projects"
            className="rounded-full bg-paper-2 px-4 py-2 text-sm text-ink ring-1 ring-ink/8"
          >
            我的课程
          </Link>
        </div>
      </div>

      {report && (
        <section className="mt-6 rounded-2xl bg-leaf-deep p-5 text-white">
          <p className="text-sm text-white/70">课堂问答能力</p>
          <p className="font-display mt-1 text-5xl">{report.total_score}</p>
          <p className="mt-2 text-sm text-white/85">{report.summary}</p>
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            {report.by_persona.map((p) => (
              <li key={p.persona_id} className="rounded-lg bg-white/10 p-2">
                {p.name}（{p.level}）均分{p.avg_score}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-2xl bg-card p-6 ring-1 ring-ink/8">
          <p className="text-sm text-ink-muted">备课包综合评分</p>
          <p className="font-display mt-2 text-6xl text-leaf-deep">{ev.total_score}</p>
          <p className="mt-1 text-sm text-ink-muted">/ 100</p>
          <div className="mt-6 space-y-2">
            {ev.scores.map((s) => (
              <div key={s.id}>
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>{s.name}</span>
                  <span>
                    {s.score}/{s.max}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full bg-leaf"
                    style={{ width: `${(s.score / s.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          <Block
            title="优势"
            items={report?.strengths?.length ? report.strengths : ev.strengths}
            tone="good"
          />
          <Block
            title="问题"
            items={report?.problems?.length ? report.problems : ev.issues}
            tone="warn"
          />
          <Block
            title="优化建议"
            items={report?.suggestions?.length ? report.suggestions : ev.suggestions}
            tone="tip"
          />
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-card p-5 ring-1 ring-ink/8">
        <p className="font-display text-lg">给课程论老师看什么？</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          虚拟班级对应：课堂互动、形成性评价、学情分析、教师专业发展。不是「帮你写教案」的聊天机器人，而是「帮你练一堂课」的训练场。        </p>
        <Link
          to="/"
          className="mt-4 inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white"
        >
          再体验另一门课
        </Link>
      </div>

      <StepNav back="/demo/simulation" />
    </div>
  )
}

function Block({
  title,
  items,
  tone,
}: {
  title: string
  items: string[]
  tone: 'good' | 'warn' | 'tip'
}) {
  const bg =
    tone === 'good' ? 'bg-[#e7f2ed]' : tone === 'warn' ? 'bg-[#f8ebe3]' : 'bg-paper'
  return (
    <section className={`rounded-2xl ${bg} p-5`}>
      <h2 className="font-display text-lg">{title}</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </section>
  )
}
