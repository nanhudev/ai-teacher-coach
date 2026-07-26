import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { submitCourseReview } from '../api/review'
import { saveReview } from '../review/types'

export function ReviewUploadPage() {
  const nav = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const [topic, setTopic] = useState('')
  const [lessonPaste, setLessonPaste] = useState('')
  const [pptPaste, setPptPaste] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function onSubmit() {
    setBusy(true)
    setErr('')
    try {
      const report = await submitCourseReview({
        files,
        topicHint: topic,
        lessonText: lessonPaste,
        pptText: pptPaste,
      })
      saveReview(report)
      nav('/review/report')
    } catch (e) {
      setErr(e instanceof Error ? e.message : '诊断失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#1a1a1a]">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <Link to="/" className="font-display text-lg text-[#1e3a5f]">
          AI Teacher Coach
        </Link>
        <Link to="/demo" className="text-sm text-[#64748b] hover:text-[#1e3a5f]">
          去生成新课
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-20">
        <p className="text-xs tracking-[0.2em] text-[#1e3a5f]">评价线 · Review Mode</p>
        <h1 className="font-display mt-3 text-[clamp(1.8rem,4vw,2.6rem)] text-[#1a1a1a]">
          优化已有课程
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#64748b]">
          上传教案或课件，AI 按新课标与新高考做诊断评分，并给出可执行优化方案。不与「从零生成」混用。
        </p>

        <label className="mt-8 block text-sm font-medium">课题（可选）</label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="例如：赤壁赋"
          className="mt-2 w-full border border-[#1e3a5f]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#1e3a5f]"
          disabled={busy}
        />

        <label className="mt-6 block text-sm font-medium">上传文件</label>
        <p className="mt-1 text-xs text-[#94a3b8]">支持 .docx 教案 · .pptx 课件 · .txt / .md</p>
        <input
          type="file"
          multiple
          accept=".docx,.pptx,.txt,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
          className="mt-3 block w-full text-sm"
          disabled={busy}
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
        {!!files.length && (
          <ul className="mt-2 space-y-1 text-xs text-[#64748b]">
            {files.map((f) => (
              <li key={f.name}>
                {f.name} · {(f.size / 1024).toFixed(1)} KB
              </li>
            ))}
          </ul>
        )}

        <details className="mt-8 border border-[#1e3a5f]/10 bg-white px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">或粘贴文本（无文件时可用）</summary>
          <label className="mt-4 block text-xs text-[#64748b]">教案文本</label>
          <textarea
            value={lessonPaste}
            onChange={(e) => setLessonPaste(e.target.value)}
            rows={5}
            className="mt-1 w-full border border-[#1e3a5f]/10 px-3 py-2 text-sm outline-none"
            disabled={busy}
          />
          <label className="mt-3 block text-xs text-[#64748b]">课件文本（可从 PPT 复制）</label>
          <textarea
            value={pptPaste}
            onChange={(e) => setPptPaste(e.target.value)}
            rows={5}
            className="mt-1 w-full border border-[#1e3a5f]/10 px-3 py-2 text-sm outline-none"
            disabled={busy}
          />
        </details>

        <button
          type="button"
          disabled={busy || (!files.length && !lessonPaste.trim() && !pptPaste.trim())}
          onClick={() => void onSubmit()}
          className="mt-8 w-full bg-[#1e3a5f] py-3.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? '教研员诊断中…' : '开始 AI 诊断'}
        </button>
        {err && <p className="mt-3 text-sm text-red-700">{err}</p>}

        <p className="mt-6 text-xs leading-relaxed text-[#94a3b8]">
          预留：课堂录音 → 转写 → 课堂行为分析（teacher_record）。当前版本聚焦教案/课件诊断。
        </p>
      </main>
    </div>
  )
}
