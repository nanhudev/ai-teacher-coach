import { Navigate } from 'react-router-dom'
import { useDemo } from '../state/DemoContext'
import { StepNav } from '../components/StepNav'

export function BeforeAfterPage() {
  const { session } = useDemo()
  if (!session) return <Navigate to="/demo" replace />
  const { before, after } = session.before_after

  return (
    <div>
      <p className="text-sm text-leaf">教研对比</p>
      <h1 className="font-display mt-1 text-3xl">Before / After</h1>
      <p className="mt-2 text-sm text-ink-muted">
        老师真正想看到的：不是又一个文件，而是「比原来好在哪里」。      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl bg-card p-5 ring-1 ring-ink/8">
          <h2 className="font-display text-xl text-accent">{before.title}</h2>
          <ul className="mt-4 space-y-3">
            {before.issues.map((i) => (
              <li key={i.label} className="rounded-xl bg-paper p-3">
                <p className="font-medium">{i.label}</p>
                <p className="mt-1 text-sm text-ink-muted">{i.detail}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl bg-card p-5 ring-1 ring-leaf/30">
          <h2 className="font-display text-xl text-leaf-deep">{after.title}</h2>
          <ul className="mt-4 space-y-3">
            {after.improvements.map((i) => (
              <li key={i.label} className="rounded-xl bg-[#e7f2ed] p-3">
                <p className="font-medium">{i.label}</p>
                <p className="mt-1 text-sm text-ink-muted">{i.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <StepNav back="/demo/ppt" next="/demo/simulation" nextLabel="进入虚拟班级 · 练课" />
    </div>
  )
}
