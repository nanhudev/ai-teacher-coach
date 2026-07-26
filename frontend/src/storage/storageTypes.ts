import type { DemoSession, ClassroomSimReport, TeacherResponseAnalysis } from '../types/demo'

/** 本地课程项目 — Demo 无登录工作区 */
export type LocalProjectVersion = {
  version: number
  change: string
  time: string
  /** 可选：该版教案快照 id（存在项目内 lesson_history） */
  lesson_version?: number
}

export type SimulationRunRecord = {
  id: string
  startedAt: string
  finishedAt?: string
  score?: number
  completedRounds: number
  totalRounds: number
  report?: ClassroomSimReport
  /** 本场作答摘要 */
  answers?: {
    turnIndex: number
    score?: number
    answerPreview: string
  }[]
}

export type LocalCourseProject = {
  id: string
  title: string
  subject: '高中语文'
  topic: string
  createdAt: string
  updatedAt: string
  /** 完整 DemoSession（教案/PPT/模拟题库/评价） */
  session: DemoSession
  /** 最近一次模拟作答（热状态） */
  answered?: Record<
    number,
    {
      answer: string
      delta: DemoSession['simulation_turns'][0]['understanding_delta']
      analysis?: TeacherResponseAnalysis
    }
  >
  /** 历次模拟成长记录 */
  simulationSessions: SimulationRunRecord[]
  /** 项目级版本日志 */
  versions: LocalProjectVersion[]
}

export type LocalProjectSummary = {
  id: string
  title: string
  topic: string
  subject: string
  updatedAt: string
  createdAt: string
  hasLesson: boolean
  hasPpt: boolean
  hasSimulation: boolean
  hasEvaluation: boolean
  versionCount: number
  lastSimScore?: number
}

/** 未来账号合并预留 */
export type ProjectMigrationApi = {
  exportProject: (id: string) => Promise<LocalCourseProject | null>
  importProject: (raw: LocalCourseProject | string) => Promise<string>
  mergeGuestProject: (guest: LocalCourseProject, userId: string) => Promise<string>
}
