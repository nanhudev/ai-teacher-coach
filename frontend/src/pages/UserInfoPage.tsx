import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  analyticsConsent,
  connectCloudBase,
  eraseMyAnalytics,
  getIdentity,
  setAnalyticsConsent,
} from '../services/telemetry'

const API = import.meta.env.VITE_API_BASE || '/api/v1'

type Metrics = {
  summary: { users: number; sessions: number; events: number; errors: number; sessions_per_user: number }
  daily: { day: string; users: number; events: number }[]
  problems: { error_code: string; count: number }[]
  course_types: { course_type: string; count: number }[]
  details: { ts: number; name: string; course_type: string; ok: number; error_code: string; content_preview: string }[]
  retention_note: string
}

export function UserInfoPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [identity, setIdentity] = useState(getIdentity())
  const [consent, setConsent] = useState(analyticsConsent())
  const [adminToken, setAdminToken] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function load(token = adminToken) {
    const response = await fetch(`${API}/telemetry/metrics?days=30`, {
      headers: token ? { 'x-admin-token': token } : {},
    })
    if (response.ok) setMetrics(await response.json())
  }

  useEffect(() => { void load('') }, [])

  return (
    <main className="min-h-screen bg-[#F7F4EF] px-5 py-10 text-[#1f2937]">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between border-b border-black/10 pb-5">
          <div>
            <p className="text-xs tracking-[.2em] text-[#8E2F2B]">DEVELOPER CONSOLE</p>
            <h1 className="mt-2 font-display text-4xl">用户与产品健康度</h1>
          </div>
          <Link to="/" className="text-sm">返回产品</Link>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="bg-white p-5 ring-1 ring-black/5">
            <h2 className="font-display text-xl">身份与数据授权</h2>
            <p className="mt-2 text-sm text-slate-600">当前：{identity.mode} · {identity.userId.slice(0, 18)}…</p>
            <label className="mt-4 flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => {
                  setConsent(event.target.checked)
                  setAnalyticsConsent(event.target.checked)
                }}
              />
              <span>允许收集页面访问、生成耗时、错误和课程类型。课程输入仅保存最多240字预览，保存期90天。</span>
            </label>
            <button
              className="mt-4 border-b border-red-700 text-sm text-red-700"
              onClick={async () => { await eraseMyAnalytics(); setMessage('当前身份的统计数据已删除') }}
            >
              删除我的统计数据
            </button>
          </div>

          <div className="bg-white p-5 ring-1 ring-black/5">
            <h2 className="font-display text-xl">CloudBase 正式登录</h2>
            <div className="mt-3 grid gap-2">
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="用户名" className="border p-2" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="密码" className="border p-2" />
              <button
                className="bg-[#1e3a5f] px-4 py-2 text-white"
                onClick={async () => {
                  try { setIdentity(await connectCloudBase(username, password)); setMessage('CloudBase 登录成功') }
                  catch (error) { setMessage(error instanceof Error ? error.message : '登录失败') }
                }}
              >
                登录并合并身份
              </button>
            </div>
          </div>
        </section>

        {message && <p className="mt-3 text-sm text-[#8E2F2B]">{message}</p>}

        {metrics && (
          <>
            <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                ['用户', metrics.summary.users], ['会话', metrics.summary.sessions],
                ['事件', metrics.summary.events], ['错误', metrics.summary.errors],
                ['人均会话', metrics.summary.sessions_per_user],
              ].map(([label, value]) => (
                <div key={label} className="bg-white p-4 ring-1 ring-black/5">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-3xl">{value}</p>
                </div>
              ))}
            </section>

            <section className="mt-6 grid gap-5 md:grid-cols-2">
              <List title="用户常见问题 / Bug" rows={metrics.problems.map(x => [`${x.error_code || '未知错误'}`, x.count])} />
              <List title="课程类型分布" rows={metrics.course_types.map(x => [x.course_type || '未分类', x.count])} />
            </section>

            <section className="mt-6 bg-white p-5 ring-1 ring-black/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl">输入与事件明细</h2>
                  <p className="mt-1 text-xs text-slate-500">明细必须通过服务端管理员令牌验证，令牌不会写入浏览器包。</p>
                </div>
                <div className="flex gap-2">
                  <input value={adminToken} onChange={(e) => setAdminToken(e.target.value)} type="password" placeholder="管理员令牌" className="border p-2 text-sm" />
                  <button onClick={() => void load()} className="bg-[#1e3a5f] px-3 text-sm text-white">查看明细</button>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {metrics.details.length ? metrics.details.map((item, index) => (
                  <div key={`${item.ts}-${index}`} className="border-t py-2">
                    <span>{new Date(item.ts * 1000).toLocaleString()} · {item.name} · {item.course_type}</span>
                    {item.error_code && <span className="ml-2 text-red-700">{item.error_code}</span>}
                    {item.content_preview && <p className="mt-1 text-slate-600">{item.content_preview}</p>}
                  </div>
                )) : <p className="text-slate-500">输入管理员令牌后显示脱敏明细。</p>}
              </div>
              <p className="mt-4 text-xs text-slate-500">{metrics.retention_note}</p>
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function List({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <section className="bg-white p-5 ring-1 ring-black/5">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length ? rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between border-b pb-2 text-sm">
            <span>{label}</span><strong>{value}</strong>
          </div>
        )) : <p className="text-sm text-slate-500">暂无数据</p>}
      </div>
    </section>
  )
}
