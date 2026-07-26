import { saveAs } from 'file-saver'
import type { DemoSession } from '../types/demo'
import { idbDel, idbGet, idbKeys, idbSet } from './indexedDB'
import { buildZip } from './zipStore'
import type {
  LocalCourseProject,
  LocalProjectSummary,
  LocalProjectVersion,
  SimulationRunRecord,
} from './storageTypes'

const INDEX_KEY = 'aiteacher.projects.index.v1'
const LS_PREFIX = 'aiteacher.project.'

type IndexItem = {
  id: string
  title: string
  topic: string
  updatedAt: string
  createdAt: string
}

function now() {
  return new Date().toISOString()
}

function readIndex(): IndexItem[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    return raw ? (JSON.parse(raw) as IndexItem[]) : []
  } catch {
    return []
  }
}

function writeIndex(items: IndexItem[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(items.slice(0, 80)))
}

function upsertIndex(p: LocalCourseProject) {
  const items = readIndex().filter((x) => x.id !== p.id)
  items.unshift({
    id: p.id,
    title: p.title,
    topic: p.topic,
    updatedAt: p.updatedAt,
    createdAt: p.createdAt,
  })
  writeIndex(items)
}

function removeIndex(id: string) {
  writeIndex(readIndex().filter((x) => x.id !== id))
}

async function writeBody(p: LocalCourseProject) {
  try {
    await idbSet(p.id, p)
  } catch {
    // IDB 失败则退回 localStorage（小项目）
    localStorage.setItem(LS_PREFIX + p.id, JSON.stringify(p))
  }
  // 索引永远在 localStorage，刷新可列目录
  upsertIndex(p)
}

async function readBody(id: string): Promise<LocalCourseProject | null> {
  try {
    const fromIdb = await idbGet<LocalCourseProject>(id)
    if (fromIdb) return fromIdb
  } catch {
    /* fallthrough */
  }
  try {
    const raw = localStorage.getItem(LS_PREFIX + id)
    return raw ? (JSON.parse(raw) as LocalCourseProject) : null
  } catch {
    return null
  }
}

export function newProjectId() {
  return `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function topicFromSession(session: DemoSession) {
  return session.director?.course || session.meta?.label?.match(/《(.+?)》/)?.[1] || session.meta?.label || '未命名课文'
}

export function titleFromSession(session: DemoSession) {
  const topic = topicFromSession(session)
  return `高中语文《${topic}》`
}

/** 从当前会话创建或覆盖保存 */
export async function saveProjectFromSession(
  session: DemoSession,
  opts?: {
    answered?: LocalCourseProject['answered']
    change?: string
    projectId?: string
  },
): Promise<LocalCourseProject> {
  const id = opts?.projectId || session.local_project_id || newProjectId()
  const existing = await readBody(id)
  const createdAt = existing?.createdAt || now()
  const topic = topicFromSession(session)
  const title = titleFromSession(session)

  const versionEntry: LocalProjectVersion = {
    version: (existing?.versions?.length || 0) + 1,
    change: opts?.change || (existing ? '自动更新课程' : 'AI 初稿生成'),
    time: now(),
    lesson_version: session.lesson_version || 1,
  }

  const withId: DemoSession = { ...session, local_project_id: id }

  const project: LocalCourseProject = {
    id,
    title,
    subject: '高中语文',
    topic,
    createdAt,
    updatedAt: now(),
    session: withId,
    answered: opts?.answered ?? existing?.answered,
    simulationSessions: existing?.simulationSessions || [],
    versions: [...(existing?.versions || []), versionEntry].slice(-40),
  }

  await writeBody(project)
  return project
}

/** 轻量更新（不强制加版本日志） */
export async function updateProject(
  id: string,
  patch: Partial<Pick<LocalCourseProject, 'session' | 'answered' | 'title'>> & {
    change?: string
    bumpVersion?: boolean
  },
): Promise<LocalCourseProject | null> {
  const cur = await readBody(id)
  if (!cur) return null
  const next: LocalCourseProject = {
    ...cur,
    title: patch.title || cur.title,
    topic: patch.session ? topicFromSession(patch.session) : cur.topic,
    updatedAt: now(),
    session: patch.session
      ? { ...patch.session, local_project_id: id }
      : cur.session,
    answered: patch.answered !== undefined ? patch.answered : cur.answered,
    versions: patch.bumpVersion
      ? [
          ...cur.versions,
          {
            version: cur.versions.length + 1,
            change: patch.change || '更新',
            time: now(),
            lesson_version: patch.session?.lesson_version || cur.session.lesson_version,
          },
        ].slice(-40)
      : cur.versions,
  }
  await writeBody(next)
  return next
}

export async function appendSimulationRun(
  id: string,
  run: SimulationRunRecord,
): Promise<LocalCourseProject | null> {
  const cur = await readBody(id)
  if (!cur) return null
  const next: LocalCourseProject = {
    ...cur,
    updatedAt: now(),
    simulationSessions: [...cur.simulationSessions, run].slice(-30),
    versions: [
      ...cur.versions,
      {
        version: cur.versions.length + 1,
        change: `模拟课堂记录（评分 ${run.score ?? '—'}）`,
        time: now(),
      },
    ].slice(-40),
  }
  await writeBody(next)
  return next
}

export async function getProject(id: string) {
  return readBody(id)
}

export async function listProjects(): Promise<LocalProjectSummary[]> {
  const index = readIndex()
  const out: LocalProjectSummary[] = []
  for (const item of index) {
    const p = await readBody(item.id)
    if (!p) continue
    const lastSim = p.simulationSessions[p.simulationSessions.length - 1]
    out.push({
      id: p.id,
      title: p.title,
      topic: p.topic,
      subject: p.subject,
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
      hasLesson: !!p.session.lesson,
      hasPpt: !!p.session.ppt?.slides?.length,
      hasSimulation: (p.simulationSessions?.length || 0) > 0 || Object.keys(p.answered || {}).length > 0,
      hasEvaluation: !!p.session.evaluation || !!p.session.classroom_sim_report,
      versionCount: p.versions?.length || 1,
      lastSimScore: lastSim?.score,
    })
  }
  return out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
}

export async function deleteProject(id: string) {
  removeIndex(id)
  try {
    await idbDel(id)
  } catch {
    /* */
  }
  localStorage.removeItem(LS_PREFIX + id)
}

export async function duplicateProject(id: string, titleSuffix = '副本'): Promise<LocalCourseProject | null> {
  const cur = await readBody(id)
  if (!cur) return null
  const nid = newProjectId()
  const copy: LocalCourseProject = {
    ...JSON.parse(JSON.stringify(cur)),
    id: nid,
    title: `${cur.title} · ${titleSuffix}`,
    createdAt: now(),
    updatedAt: now(),
    session: { ...cur.session, local_project_id: nid, case_id: nid },
    versions: [
      {
        version: 1,
        change: `复制自「${cur.title}」`,
        time: now(),
      },
    ],
    simulationSessions: [],
    answered: undefined,
  }
  await writeBody(copy)
  return copy
}

/** 导出课程备份 zip */
export async function exportProjectBackup(id: string) {
  const p = await readBody(id)
  if (!p) throw new Error('项目不存在')
  const topic = p.topic || '课程'
  const zip = buildZip([
    { name: '教案.json', content: JSON.stringify(p.session.lesson, null, 2) },
    { name: 'PPT结构.json', content: JSON.stringify(p.session.ppt, null, 2) },
    {
      name: '模拟记录.json',
      content: JSON.stringify(
        { answered: p.answered, simulationSessions: p.simulationSessions, report: p.session.classroom_sim_report },
        null,
        2,
      ),
    },
    {
      name: '评价报告.json',
      content: JSON.stringify(p.session.evaluation || {}, null, 2),
    },
    {
      name: '项目元数据.json',
      content: JSON.stringify(
        {
          id: p.id,
          title: p.title,
          topic: p.topic,
          versions: p.versions,
          director: p.session.director,
          exportedAt: now(),
        },
        null,
        2,
      ),
    },
  ])
  saveAs(zip, `${topic}课程包.zip`)
}

/** —— 账号迁移预留 —— */
export async function exportProject(id: string) {
  return readBody(id)
}

export async function importProject(raw: LocalCourseProject | string): Promise<string> {
  const p = typeof raw === 'string' ? (JSON.parse(raw) as LocalCourseProject) : raw
  const id = p.id?.startsWith('proj_') ? p.id : newProjectId()
  const next = { ...p, id, updatedAt: now(), session: { ...p.session, local_project_id: id } }
  await writeBody(next)
  return id
}

/** 登录后把游客项目挂到账号：当前仅本地复制并标注 */
export async function mergeGuestProject(guest: LocalCourseProject, userId: string): Promise<string> {
  const id = newProjectId()
  const merged: LocalCourseProject = {
    ...guest,
    id,
    title: guest.title,
    updatedAt: now(),
    session: { ...guest.session, local_project_id: id },
    versions: [
      ...guest.versions,
      { version: guest.versions.length + 1, change: `合并游客项目 → 用户 ${userId}`, time: now() },
    ],
  }
  await writeBody(merged)
  return id
}

/** 修复：列出 IDB 中有但索引丢失的项目 */
export async function reconcileIndex() {
  try {
    const keys = await idbKeys()
    const index = readIndex()
    const known = new Set(index.map((i) => i.id))
    for (const k of keys) {
      if (known.has(k)) continue
      const p = await idbGet<LocalCourseProject>(k)
      if (p?.id) upsertIndex(p)
    }
  } catch {
    /* ignore */
  }
}
