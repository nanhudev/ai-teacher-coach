import { Link, useLocation } from 'react-router-dom'
import { useDemo } from '../state/DemoContext'

const ALL_STEPS = [
  { path: '/demo/director', label: '教研分析', modes: ['full'] as const },
  { path: '/demo/lesson', label: '教案', modes: ['full', 'lesson'] as const },
  { path: '/demo/ppt', label: '课件预览', modes: ['full', 'ppt'] as const },
  { path: '/demo/before-after', label: '对比', modes: ['full'] as const },
  { path: '/demo/simulation', label: '虚拟班级', modes: ['full'] as const },
  { path: '/demo/evaluation', label: '评价报告', modes: ['full'] as const },
]

export function DemoShell({ children }: { children: React.ReactNode }) {
  const { session, saveHint, persistNow } = useDemo()
  const loc = useLocation()
  const mode = session?.mode || 'full'
  const steps = ALL_STEPS.filter((s) => (s.modes as readonly string[]).includes(mode))

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="font-display text-lg tracking-wide text-ink">
            AI Teacher Coach
          </Link>
          {session && (
            <p className="hidden min-w-0 flex-1 truncate text-sm text-ink-muted sm:block">
              {session.meta.label}
              {saveHint && <span className="ml-2 text-xs text-leaf">· {saveHint}</span>}
              {mode !== 'full' && (
                <span className="ml-2 rounded-full bg-leaf/10 px-2 py-0.5 text-xs text-leaf">
                  {mode === 'lesson' ? '仅教案' : '仅课件'}
                </span>
              )}
            </p>
          )}
          <div className="flex shrink-0 items-center gap-3">
            {session && (
              <button
                type="button"
                onClick={() => void persistNow('手动保存')}
                className="hidden text-sm text-ink-muted underline-offset-2 hover:underline sm:inline"
              >
                保存
              </button>
            )}
            <Link to="/app/projects" className="text-sm text-ink-muted underline-offset-2 hover:underline">
              我的课程
            </Link>
            <Link to="/demo" className="text-sm text-leaf-deep underline-offset-4 hover:underline">
              新建
            </Link>
          </div>
        </div>
        {session && steps.length > 0 && (
          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
            {steps.map((s) => {
              const active = loc.pathname === s.path
              return (
                <Link
                  key={s.path}
                  to={s.path}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition ${
                    active
                      ? 'bg-leaf text-white'
                      : 'bg-paper-2/80 text-ink-muted hover:bg-paper-2'
                  }`}
                >
                  {s.label}
                </Link>
              )
            })}
          </nav>
        )}
      </header>
      <main key={loc.pathname} className="sc-page-in mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
