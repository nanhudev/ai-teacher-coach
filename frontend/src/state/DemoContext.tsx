import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import type { DemoSession } from '../types/demo'
import type { TeacherResponseAnalysis } from '../types/demo'
import {
  getProject,
  newProjectId,
  reconcileIndex,
  saveProjectFromSession,
  updateProject,
} from '../storage/localProjectStore'

export type AnsweredMap = Record<
  number,
  {
    answer: string
    delta: DemoSession['simulation_turns'][0]['understanding_delta']
    analysis?: TeacherResponseAnalysis
  }
>

type DemoContextValue = {
  session: DemoSession | null
  setSession: (s: DemoSession | null) => void
  answered: AnsweredMap
  setAnswered: Dispatch<SetStateAction<AnsweredMap>>
  /** 当前本地项目 id */
  projectId: string | null
  /** 打开已保存项目 */
  openProject: (id: string) => Promise<boolean>
  /** 立即落盘 */
  persistNow: (change?: string) => Promise<void>
  saveHint: string
}

const DemoContext = createContext<DemoContextValue | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<DemoSession | null>(null)
  const [answered, setAnswered] = useState<AnsweredMap>({})
  const [projectId, setProjectId] = useState<string | null>(null)
  const [saveHint, setSaveHint] = useState('')
  const answeredRef = useRef(answered)
  const sessionRef = useRef(session)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    answeredRef.current = answered
  }, [answered])

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    void reconcileIndex()
  }, [])

  const persist = useCallback(async (s: DemoSession, change?: string, bumpVersion = false) => {
    try {
      const id = s.local_project_id || newProjectId()
      const withId = { ...s, local_project_id: id }
      const existing = await getProject(id)
      if (!existing) {
        const p = await saveProjectFromSession(withId, {
          answered: answeredRef.current,
          change: change || 'AI 初稿生成',
          projectId: id,
        })
        setProjectId(p.id)
        setSaveHint(`已保存 · ${new Date(p.updatedAt).toLocaleTimeString()}`)
        return
      }
      const p = await updateProject(id, {
        session: withId,
        answered: answeredRef.current,
        change,
        bumpVersion: bumpVersion || !!change,
      })
      if (p) {
        setProjectId(p.id)
        setSaveHint(`已保存 · ${new Date(p.updatedAt).toLocaleTimeString()}`)
      }
    } catch {
      setSaveHint('本地保存失败（可稍后重试）')
    }
  }, [])

  const setSession = useCallback(
    (s: DemoSession | null) => {
      if (!s) {
        sessionRef.current = null
        setSessionState(null)
        setProjectId(null)
        return
      }
      const id = s.local_project_id || projectId || newProjectId()
      const next = { ...s, local_project_id: id, case_id: s.case_id || id }
      sessionRef.current = next
      setSessionState(next)
      setProjectId(id)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        void persist(next)
      }, 450)
    },
    [persist, projectId],
  )

  // 模拟作答变化也自动保存
  useEffect(() => {
    if (!session?.local_project_id) return
    if (!Object.keys(answered).length) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      void updateProject(session.local_project_id!, {
        session,
        answered,
        change: '更新模拟作答',
      }).then(() => setSaveHint(`已保存模拟 · ${new Date().toLocaleTimeString()}`))
    }, 600)
  }, [answered, session])

  const openProject = useCallback(async (id: string) => {
    const p = await getProject(id)
    if (!p) return false
    setProjectId(p.id)
    setSessionState({ ...p.session, local_project_id: p.id })
    setAnswered((p.answered as AnsweredMap) || {})
    setSaveHint('已打开本地课程')
    return true
  }, [])

  const persistNow = useCallback(async (change?: string) => {
    const s = sessionRef.current
    if (!s) return
    await persist(s, change || '手动保存', true)
  }, [persist])

  const value = useMemo(
    () => ({
      session,
      setSession,
      answered,
      setAnswered,
      projectId,
      openProject,
      persistNow,
      saveHint,
    }),
    [session, setSession, answered, projectId, openProject, persistNow, saveHint],
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo outside provider')
  return ctx
}
