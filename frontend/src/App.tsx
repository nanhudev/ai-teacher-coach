import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
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
        <Routes>
          <Route path="/" element={<MarketingHomePage />} />
          <Route path="/demo" element={<DemoEntryPage />} />
          <Route path="/showcase" element={<ShowcasePage />} />
          <Route path="/app" element={<Navigate to="/app/projects" replace />} />
          <Route path="/app/projects" element={<MyCoursesPage />} />
          <Route path="/projects" element={<MyCoursesPage />} />
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
