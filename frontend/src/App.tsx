import { BrowserRouter, HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { DemoProvider, useDemo } from './state/DemoContext'
import { DemoShell } from './components/DemoShell'
import { MarketingHomePage } from './pages/MarketingHomePage'
import { DemoEntryPage } from './pages/DemoEntryPage'
import { ShowcasePage } from './pages/ShowcasePage'
import { MyCoursesPage } from './pages/MyCoursesPage'
import { DirectorPage } from './pages/DirectorPage'
import { LessonPage } from './pages/LessonPage'
import { PptPage } from './pages/PptPage'
import { BeforeAfterPage } from './pages/BeforeAfterPage'
import { SimulationPage } from './pages/SimulationPage'
import { EvaluationPage } from './pages/EvaluationPage'
import { UserInfoPage } from './pages/UserInfoPage'
import { track } from './services/telemetry'
import { setAnalyticsConsent } from './services/telemetry'
import { useState } from 'react'

function AnalyticsTracker() {
  const location = useLocation()
  useEffect(() => {
    void track('page_view', { path: location.pathname })
  }, [location.pathname])
  return null
}

function ConsentBanner() {
  const [visible, setVisible] = useState(() => localStorage.getItem('aiteacher:analytics-consent') == null)
  if (!visible) return null
  return (
    <div className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-2xl bg-[#1e293b] p-4 text-sm text-white shadow-2xl">
      <p>为改进生成速度和课程质量，我们希望记录页面、耗时、错误及最多240字的课程输入预览，保存90天。你可以拒绝或随时删除。</p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => { setAnalyticsConsent(true); setVisible(false) }} className="bg-white px-3 py-1.5 text-[#1e293b]">允许改进统计</button>
        <button onClick={() => { setAnalyticsConsent(false); setVisible(false) }} className="border border-white/40 px-3 py-1.5">暂不允许</button>
      </div>
    </div>
  )
}

function Guard({ children }: { children: React.ReactNode }) {
  const { session } = useDemo()
  if (!session) return <Navigate to="/demo" replace />
  return <DemoShell>{children}</DemoShell>
}

export default function App() {
  // ponytail: CloudBase 静态托管无 SPA rewrite，子路径用 HashRouter
  const useHash = (import.meta.env.BASE_URL || '/') !== '/'
  const Router = useHash ? HashRouter : BrowserRouter
  const basename = useHash
    ? undefined
    : (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || undefined

  return (
    <DemoProvider>
      <Router basename={basename}>
        <AnalyticsTracker />
        <ConsentBanner />
        <Routes>
          <Route path="/" element={<MarketingHomePage />} />
          <Route path="/demo" element={<DemoEntryPage />} />
          <Route path="/showcase" element={<ShowcasePage />} />
          <Route path="/app" element={<Navigate to="/app/projects" replace />} />
          <Route path="/app/projects" element={<MyCoursesPage />} />
          <Route path="/projects" element={<MyCoursesPage />} />
          <Route path="/userinfo" element={<UserInfoPage />} />
          <Route
            path="/demo/director"
            element={
              <Guard>
                <DirectorPage />
              </Guard>
            }
          />
          <Route
            path="/demo/lesson"
            element={
              <Guard>
                <LessonPage />
              </Guard>
            }
          />
          <Route
            path="/demo/ppt"
            element={
              <Guard>
                <PptPage />
              </Guard>
            }
          />
          <Route
            path="/demo/before-after"
            element={
              <Guard>
                <BeforeAfterPage />
              </Guard>
            }
          />
          <Route
            path="/demo/simulation"
            element={
              <Guard>
                <SimulationPage />
              </Guard>
            }
          />
          <Route
            path="/demo/evaluation"
            element={
              <Guard>
                <EvaluationPage />
              </Guard>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </DemoProvider>
  )
}
