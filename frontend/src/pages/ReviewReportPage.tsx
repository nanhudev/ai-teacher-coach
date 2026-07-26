import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { loadReview, type CourseReview } from '../review/types'
import { useDemo } from '../state/DemoContext'
import { runChinesePipeline } from '../chinese/runChinesePipeline'
import { syncCourseFromIntent } from '../chinese/courseSync'

function ScoreRing({ score, label }: { score: number; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-3xl text-[#1e3a5f]">{score}</p>
      <p className="mt-1 text-xs text-[#64748b]">{label}</p>
    </div>
  )
}

export function ReviewReportPage() {
  const nav = useNavigate()
  const { setSession, setAnswered, persistNow } = useDemo()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const review = useMemo(() => loadReview(), [])

  if (!review) return <Navigate to="/review" replace />

  async function onOptimize(r: CourseReview) {
    setBusy(true)
    setMsg('')
    try {
      const topic = r.topic.includes('高中') ? r.topic : `高中语文 ${r.topic}`
      const brief = r.optimize_brief || r.suggestions.slice(0, 3).join('；')
      let session = await runChinesePipeline({
        oneLiner: topic,
        mode: 'full',
        template_id: 'auto',
      })
      // 用诊断意见驱动磨课同步 → Version 2
      const synced = syncCourseFromIntent(session, brief)
      session = {
        ...synced.session,
        local_project_id: `proj_${Date.now().toString(36)}`,
        case_id: `review-v2-${Date.now().toString(36)}`,
        lesson_version: 2,
        last_revision: {
          request: `诊断优化：${brief}`,
          change_summary: [
            `来自课程诊断（${r.total_score}分）`,
            ...r.suggestions.slice(0, 3),
          ],
          revision_summary: (r.lesson_analysis.problems || []).slice(0, 3).map((p) => ({
            before: p,
            after: '已按诊断建议重构',
            reason: 'Review Mode → Create 共用 Blueprint',
          })),
          teaching_improvement: r.lesson_analysis.optimization.slice(0, 4),
        },
      }
      setSession(session)
      setAnswered({})
      await persistNow(`诊断优化 V2 · ${r.topic}`)
      setMsg('已生成优化版 V2，正在进入工作区…')
      nav('/demo/director')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '生成优化版失败')
    } finally {
      setBusy(false)
    }
  }

  const r = review

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#1a1a1a]">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5">
        <Link to="/" className="font-display text-lg text-[#1e3a5f]">
          AI Teacher Coach
        </Link>
        <Link to="/review" className="text-sm text-[#64748b] hover:text-[#1e3a5f]">
          重新上传
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-24">
        <p className="text-xs tracking-[0.2em] text-[#1e3a5f]">诊断报告</p>
        <h1 className="font-display mt-2 text-3xl">《{r.topic}》课程诊断</h1>
        <p className="mt-2 text-sm text-[#64748b]">
          来源：{r.source === 'deepseek' ? 'DeepSeek 教研员评价' : '规则诊断（可接 DeepSeek）'}
          {r.source_files?.length ? ` · ${r.source_files.join('、')}` : ''}
        </p>

        <section className="mt-8 border border-[#1e3a5f]/12 bg-white px-6 py-8">
          <p className="text-xs tracking-wide text-[#1e3a5f]">总评分</p>
          <p className="font-display mt-2 text-5xl text-[#1e3a5f]">
            {r.total_score}
            <span className="text-2xl text-[#94a3b8]">/100</span>
          </p>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-5">
            <ScoreRing score={r.curriculum_score} label="课程标准" />
            <ScoreRing score={r.teaching_score} label="教学设计" />
            <ScoreRing score={r.ppt_score || 0} label="PPT质量" />
            <ScoreRing score={r.activity_score} label="学生活动" />
            <ScoreRing score={r.visual_score || 0} label="视觉节奏" />
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="border border-[#1e3a5f]/12 bg-white px-5 py-6">
            <h2 className="font-display text-xl">教案评价 · {r.lesson_analysis.score}</h2>
            <Block title="优点" items={r.lesson_analysis.strengths} tone="good" />
            <Block title="问题" items={r.lesson_analysis.problems} tone="bad" />
            <Block title="优化方案" items={r.lesson_analysis.optimization} tone="fix" />
          </section>
          <section className="border border-[#1e3a5f]/12 bg-white px-5 py-6">
            <h2 className="font-display text-xl">
              PPT 评价 · {r.ppt_analysis.score || '—'}
            </h2>
            <p className="mt-2 text-xs text-[#64748b]">
              内容 {r.ppt_analysis.content_score || 0} · 视觉 {r.ppt_analysis.visual_score || 0}
            </p>
            <Block title="问题" items={r.ppt_analysis.issues} tone="bad" />
            <Block title="优化方案" items={r.ppt_analysis.optimization} tone="fix" />
          </section>
        </div>

        <section className="mt-8 border border-[#1e3a5f]/12 bg-white px-5 py-6">
          <h2 className="font-display text-xl">综合建议</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[#475569]">
            {r.suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[#94a3b8]">
            依据：{(r.theory_basis || []).join(' · ')}
          </p>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void onOptimize(r)}
            className="bg-[#1e3a5f] px-6 py-3.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? '正在生成优化版…' : 'AI 优化这节课（生成 V2）'}
          </button>
          <Link
            to="/review"
            className="border border-[#1e3a5f] px-5 py-3.5 text-sm text-[#1e3a5f]"
          >
            再诊断一份
          </Link>
        </div>
        {msg && <p className="mt-3 text-sm text-[#64748b]">{msg}</p>}
      </main>
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
  tone: 'good' | 'bad' | 'fix'
}) {
  if (!items?.length) return null
  const color =
    tone === 'good' ? 'text-[#166534]' : tone === 'bad' ? 'text-[#9a3412]' : 'text-[#1e3a5f]'
  return (
    <div className="mt-4">
      <p className={`text-xs font-medium ${color}`}>{title}</p>
      <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-[#475569]">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  )
}
