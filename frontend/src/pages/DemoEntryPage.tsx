import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { CaseSummary } from '../types/demo'
import { useDemo } from '../state/DemoContext'
import { runChinesePipeline, chineseDemoCases } from '../chinese/runChinesePipeline'
import type { PipelineProgress } from '../pipeline/types'
import { listProjects } from '../storage/localProjectStore'
import type { LocalProjectSummary } from '../storage/storageTypes'

const DEFAULT_TOPIC = '高中语文 必修上 赤壁赋'

const HINTS = [
  '高中语文 必修上 赤壁赋',
  '高中语文 必修上 荷塘月色',
  '高中语文 必修上 师说',
  '高中语文 必修上 劝学',
  '高中语文 岳阳楼记',
  '高中语文 滕王阁序',
]

const STEP_LABEL: Record<string, string> = {
  understand: '教材理解',
  director: '教研分析',
  lesson: '教案设计',
  visual: '视觉语言',
  ppt: '精品课件',
  exercise: '分层作业',
  simulation: '虚拟班级',
  evaluation: '质量评价',
  export_ready: '导出就绪',
  complete: '完成',
}

function topicFromParam(raw: string | null): string {
  if (!raw?.trim()) return DEFAULT_TOPIC
  const t = raw.trim()
  if (t.includes('高中') || t.includes('语文')) return t
  return `高中语文 必修上 ${t.replace(/[《》]/g, '')}`
}

/** /demo — 教师体验入口（可直接生成一节课） */
export function DemoEntryPage() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { setSession, setAnswered, openProject, persistNow } = useDemo()
  const [oneLiner, setOneLiner] = useState(() => topicFromParam(params.get('topic')))
  const [mode, setMode] = useState<'full' | 'lesson' | 'ppt'>('full')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [log, setLog] = useState<PipelineProgress[]>([])
  const [cases, setCases] = useState<CaseSummary[]>([])
  const [recent, setRecent] = useState<LocalProjectSummary[]>([])

  useEffect(() => {
    setOneLiner(topicFromParam(params.get('topic')))
  }, [params])

  useEffect(() => {
    setCases(
      chineseDemoCases().map((c) => ({
        id: c.id,
        label: c.label,
        subject: c.subject,
        grade: c.grade,
        knowledge_points: c.knowledge_points,
      })),
    )
    void listProjects().then((list) => setRecent(list.slice(0, 4)))
  }, [])

  function onPipe(ev: PipelineProgress) {
    setLog((prev) => [...prev.filter((x) => !(x.step === ev.step && x.status === 'done')), ev])
    setProgress(ev.progress)
  }

  async function generate() {
    const text = oneLiner.trim()
    if (!text) return
    setLoading(true)
    setError('')
    setLog([])
    setProgress(3)
    try {
      const session = await runChinesePipeline(
        { oneLiner: text, mode, template_id: 'auto' },
        onPipe,
      )
      const id = `proj_${Date.now().toString(36)}`
      const withId = { ...session, local_project_id: id, case_id: id }
      setSession(withId)
      setAnswered({})
      await persistNow('AI 初稿生成')
      if (mode === 'ppt') nav('/demo/ppt')
      else if (mode === 'lesson') nav('/demo/lesson')
      else nav('/demo/director')
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  async function runCase(c: CaseSummary) {
    const title = c.label.match(/《(.+?)》/)?.[1] || c.label
    const unit = c.label.includes('必修下') ? '必修下' : '必修上'
    const line = `高中语文 ${unit} ${title}`
    setOneLiner(line)
    setLoading(true)
    setError('')
    setLog([])
    setProgress(3)
    try {
      const session = await runChinesePipeline(
        { oneLiner: line, mode: 'full', template_id: 'auto' },
        onPipe,
      )
      const id = `proj_${Date.now().toString(36)}`
      const withId = { ...session, local_project_id: id, case_id: id }
      setSession(withId)
      setAnswered({})
      await persistNow('AI 初稿生成')
      nav('/demo/director')
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F4EF]">
      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-4 pt-6">
        <Link to="/" className="font-display text-lg text-[#1e3a5f]">
          AI Teacher Coach
        </Link>
        <Link to="/app" className="text-sm text-[#64748b] hover:text-[#1e3a5f]">
          我的课程
        </Link>
      </header>

      <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center px-4 py-12">
        <p className="text-center text-xs tracking-[0.2em] text-[#1e3a5f]">体验 Demo</p>
        <p className="mt-3 text-center font-display text-[clamp(2rem,6vw,3rem)] leading-tight text-[#1a1a1a]">
          生成一节高中语文课
        </p>
        <p className="mt-3 text-center text-sm text-[#64748b]">
          已预填示例课文，也可换成你正在备的篇目
        </p>

        {!!recent.length && (
          <section className="mt-8 border border-[#1e3a5f]/10 bg-white/80 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">我的课堂 · 最近使用</p>
              <Link to="/app/projects" className="text-xs text-[#1e3a5f] underline-offset-2 hover:underline">
                全部课程
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {recent.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={async () => {
                      setLoading(true)
                      try {
                        const ok = await openProject(p.id)
                        if (ok) nav('/demo/director')
                        else setError('无法打开该课程')
                      } finally {
                        setLoading(false)
                      }
                    }}
                    className="flex w-full items-center justify-between gap-3 bg-[#F7F4EF] px-3 py-2.5 text-left text-sm hover:bg-white"
                  >
                    <span className="font-medium">{p.title}</span>
                    <span className="shrink-0 text-xs text-[#1e3a5f]">继续编辑 →</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-10 border border-[#1e3a5f]/12 bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={oneLiner}
              onChange={(e) => setOneLiner(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && generate()}
              placeholder="例如：高中语文 必修上 赤壁赋"
              className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3.5 text-base outline-none placeholder:text-[#94a3b8]"
              disabled={loading}
            />
            <button
              type="button"
              disabled={loading || !oneLiner.trim()}
              onClick={generate}
              className="shrink-0 bg-[#1e3a5f] px-6 py-3.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? '正在备课…' : '开始生成'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {(
            [
              ['full', '完整备课+练课'],
              ['lesson', '只要教案'],
              ['ppt', '只要课件'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={`px-3 py-1 text-xs transition ${
                mode === id
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-white/70 text-[#64748b] ring-1 ring-[#1e3a5f]/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {HINTS.map((h) => (
            <button
              key={h}
              type="button"
              disabled={loading}
              onClick={() => setOneLiner(h)}
              className="bg-white/60 px-3 py-1 text-xs text-[#64748b] ring-1 ring-[#1e3a5f]/8 hover:text-[#1a1a1a]"
            >
              {h}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-8 bg-[#1e3a5f] p-5 text-white">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">正在生成这节课</span>
              <span>{Math.min(99, Math.round(progress))}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden bg-white/20">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <ul className="mt-4 max-h-56 space-y-1.5 overflow-auto text-sm">
              {log.map((ev, i) => (
                <li key={`${ev.step}-${ev.status}-${i}`} className="flex gap-2">
                  <span className={ev.status === 'done' ? 'text-[#b8e0c8]' : 'text-[#fcd34d]'}>
                    {ev.status === 'done' ? '✓' : '…'}
                  </span>
                  <span>
                    <strong>{STEP_LABEL[ev.step] || ev.step}</strong>
                    {ev.message ? ` — ${ev.message}` : ''}
                  </span>
                </li>
              ))}
              {!log.length && <li className="text-white/70">正在理解课文…</li>}
            </ul>
          </div>
        )}

        {error && <p className="mt-4 text-center text-sm text-red-700">{error}</p>}

        {!!cases.length && (
          <section className="mt-14">
            <p className="text-center text-xs tracking-wide text-[#94a3b8]">精校篇目</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {cases.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={loading}
                  onClick={() => runCase(c)}
                  className="border border-[#1e3a5f]/10 bg-white/80 px-4 py-3 text-left text-sm hover:border-[#1e3a5f]/25 disabled:opacity-60"
                >
                  <p className="font-medium">{c.label}</p>
                  <p className="mt-1 text-xs text-[#64748b]">{c.knowledge_points.join(' · ')}</p>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
