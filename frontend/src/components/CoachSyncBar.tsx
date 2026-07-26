import { useMemo, useState } from 'react'
import { useDemo } from '../state/DemoContext'
import { analyzeImpact } from '../chinese/impactAnalyzer'
import { syncCourseFromIntent } from '../chinese/courseSync'
import { requestCourseSync } from '../api/demo'

const MODULE_LABEL: Record<string, string> = {
  director: '教研分析',
  lesson: '教案',
  ppt: '课件',
  simulation: '课堂模拟',
  evaluation: '评价',
  blueprint: '课程蓝图',
}

/**
 * 磨课同步条：教师写意图 → 影响预览 → 一键同步全课
 */
export function CoachSyncBar({
  defaultIntent = '',
  compact = false,
}: {
  defaultIntent?: string
  compact?: boolean
}) {
  const { session, setSession, persistNow, setAnswered } = useDemo()
  const [intent, setIntent] = useState(
    () => defaultIntent || session?.teacher_intent || '我希望突出苏轼人生困境，不要只讲旷达。',
  )
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const preview = useMemo(() => analyzeImpact(intent, session), [intent, session])

  if (!session) return null

  async function onSync() {
    const text = intent.trim()
    if (!text) return
    setBusy(true)
    setMsg('')
    try {
      // 可选：DeepSeek 细化 lesson_request / 影响面
      let workingIntent = text
      const remote = await requestCourseSync(text, session!)
      if (remote?.ok && remote.patch?.lesson_request) {
        workingIntent = String(remote.patch.lesson_request)
      }
      if (remote?.ok && Array.isArray(remote.patch?.affected_modules)) {
        // DeepSeek 指定模块时，强制这些模块
        const force = remote.patch.affected_modules as import('../chinese/impactAnalyzer').CourseModule[]
        const result = syncCourseFromIntent(session!, workingIntent, { forceModules: force })
        setSession(result.session)
        if (result.synced.includes('simulation')) setAnswered({})
        await persistNow(`磨课同步：${result.synced.map((m) => MODULE_LABEL[m] || m).join('、')}`)
        setMsg(
          `已同步 ${result.synced.map((m) => MODULE_LABEL[m] || m).join('、')}` +
            (remote.ok ? '（DeepSeek 已理解意见）' : '（本地规则）'),
        )
        return
      }

      const result = syncCourseFromIntent(session!, workingIntent)
      setSession(result.session)
      if (result.synced.includes('simulation')) setAnswered({})
      await persistNow(`磨课同步：${result.synced.map((m) => MODULE_LABEL[m] || m).join('、')}`)
      setMsg(`已同步 ${result.synced.map((m) => MODULE_LABEL[m] || m).join('、')}`)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '同步失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className={`rounded-2xl bg-card ring-1 ring-ink/8 ${compact ? 'p-4' : 'p-5'} ${compact ? '' : 'mt-6'}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-medium tracking-wide text-leaf">AI 教研协同</p>
          <h2 className="font-display mt-1 text-lg">修改教学思想，同步整节课</h2>
        </div>
        <button
          type="button"
          disabled={busy || !intent.trim()}
          onClick={() => void onSync()}
          className="rounded-full bg-leaf-deep px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? '正在同步…' : '同步 AI 优化全部课程'}
        </button>
      </div>

      <textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        rows={compact ? 2 : 3}
        placeholder="例如：我希望突出苏轼人生困境，不要只讲旷达。"
        className="mt-3 w-full rounded-xl border-0 bg-paper/80 px-3 py-2.5 text-sm outline-none ring-1 ring-ink/8 focus:ring-leaf/40"
        disabled={busy}
      />

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="text-ink-muted">将影响：</span>
        {preview.affected_modules.map((m) => (
          <span key={m} className="rounded-full bg-leaf/10 px-2.5 py-1 text-leaf">
            ✓ {MODULE_LABEL[m] || m}
          </span>
        ))}
        {preview.untouched_modules.slice(0, 2).map((m) => (
          <span key={m} className="rounded-full bg-paper px-2.5 py-1 text-ink-muted">
            × {MODULE_LABEL[m] || m}
          </span>
        ))}
      </div>

      {msg && <p className="mt-2 text-sm text-ink-muted">{msg}</p>}
    </section>
  )
}
