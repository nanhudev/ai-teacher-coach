import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDemo } from '../state/DemoContext'
import {
  deleteProject,
  duplicateProject,
  exportProjectBackup,
  listProjects,
} from '../storage/localProjectStore'
import type { LocalProjectSummary } from '../storage/storageTypes'

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function MyCoursesPage() {
  const nav = useNavigate()
  const { openProject } = useDemo()
  const [items, setItems] = useState<LocalProjectSummary[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  async function refresh() {
    setItems(await listProjects())
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function onOpen(id: string) {
    setBusy(id)
    setMsg('')
    try {
      const ok = await openProject(id)
      if (!ok) {
        setMsg('打开失败：项目数据缺失')
        return
      }
      nav('/demo/director')
    } finally {
      setBusy(null)
    }
  }

  async function onDup(id: string) {
    setBusy(id)
    try {
      const copy = await duplicateProject(id, '公开课版')
      if (copy) {
        setMsg(`已复制：${copy.title}`)
        await refresh()
      }
    } finally {
      setBusy(null)
    }
  }

  async function onDel(id: string, title: string) {
    if (!confirm(`确定删除「${title}」？此操作不可恢复。`)) return
    setBusy(id)
    try {
      await deleteProject(id)
      await refresh()
      setMsg('已删除')
    } finally {
      setBusy(null)
    }
  }

  async function onExport(id: string) {
    setBusy(id)
    try {
      await exportProjectBackup(id)
      setMsg('课程备份已下载')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '导出失败')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-leaf">Local Workspace · 无需登录</p>
          <h1 className="font-display mt-1 text-3xl">我的课程</h1>
          <p className="mt-2 text-sm text-ink-muted">
            课程保存在本机浏览器。刷新不丢失；换设备请导出备份。
          </p>
        </div>
        <Link
          to="/demo"
          className="rounded-full bg-leaf-deep px-5 py-2.5 text-sm font-semibold text-white"
        >
          + 新建课程
        </Link>
      </div>

      {msg && <p className="mt-3 text-sm text-ink-muted">{msg}</p>}

      {!items.length ? (
        <div className="mt-12 rounded-2xl bg-card p-10 text-center ring-1 ring-ink/8">
          <p className="font-display text-xl">还没有保存的课程</p>
          <p className="mt-2 text-sm text-ink-muted">生成一节高中语文课后，会自动出现在这里。</p>
          <Link to="/demo" className="mt-6 inline-block text-sm text-leaf underline-offset-2 hover:underline">
            去创建课程 →
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((p) => (
            <li
              key={p.id}
              className="rounded-2xl bg-card p-5 ring-1 ring-ink/8 transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl">{p.title}</h2>
                  <p className="mt-1 text-xs text-ink-muted">更新于 {fmt(p.updatedAt)}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                    <Badge ok={p.hasLesson} label="教案" />
                    <Badge ok={p.hasPpt} label="PPT" />
                    <Badge ok={p.hasSimulation} label="模拟课堂" />
                    <Badge ok={p.hasEvaluation} label="评价" />
                    <span className="rounded-full bg-paper px-2 py-0.5 text-ink-muted">
                      {p.versionCount} 个版本
                    </span>
                    {p.lastSimScore != null && (
                      <span className="rounded-full bg-leaf/10 px-2 py-0.5 text-leaf">
                        最近模拟 {p.lastSimScore} 分
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy === p.id}
                    onClick={() => onOpen(p.id)}
                    className="rounded-full bg-leaf px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    继续编辑
                  </button>
                  <button
                    type="button"
                    disabled={busy === p.id}
                    onClick={() => onDup(p.id)}
                    className="rounded-full bg-paper-2 px-3 py-2 text-sm text-ink ring-1 ring-ink/8"
                  >
                    复制
                  </button>
                  <button
                    type="button"
                    disabled={busy === p.id}
                    onClick={() => onExport(p.id)}
                    className="rounded-full bg-paper-2 px-3 py-2 text-sm text-ink ring-1 ring-ink/8"
                  >
                    导出备份
                  </button>
                  <button
                    type="button"
                    disabled={busy === p.id}
                    onClick={() => onDel(p.id, p.title)}
                    className="rounded-full px-3 py-2 text-sm text-accent"
                  >
                    删除
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 ${
        ok ? 'bg-leaf/10 text-leaf' : 'bg-paper text-ink-muted'
      }`}
    >
      {ok ? '✓' : '○'} {label}
    </span>
  )
}
