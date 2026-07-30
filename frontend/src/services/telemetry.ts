const API = import.meta.env.VITE_API_BASE || '/api/v1'
const USER_KEY = 'aiteacher:user-id'
const CONSENT_KEY = 'aiteacher:analytics-consent'
const SESSION_KEY = 'aiteacher:session-id'

function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export function getIdentity() {
  let userId = localStorage.getItem(USER_KEY)
  if (!userId) {
    userId = makeId('guest')
    localStorage.setItem(USER_KEY, userId)
  }
  let sessionId = sessionStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = makeId('session')
    sessionStorage.setItem(SESSION_KEY, sessionId)
  }
  return { userId, sessionId, mode: userId.startsWith('guest-') ? '访客' : 'CloudBase' }
}

export function analyticsConsent() {
  return localStorage.getItem(CONSENT_KEY) === 'yes'
}

export function setAnalyticsConsent(enabled: boolean) {
  localStorage.setItem(CONSENT_KEY, enabled ? 'yes' : 'no')
}

export async function connectCloudBase(username: string, password: string) {
  const cloudbase = (await import('@cloudbase/js-sdk')).default
  const app = cloudbase.init({ env: 'bubble-8g3kzhr57e693e49' })
  const { error } = await app.auth().signInWithPassword({ username, password })
  if (error) throw new Error(error.message || 'CloudBase 登录失败')
  const session = await app.auth().getSession()
  const user = await app.auth().getUser()
  const uid = user.data?.user?.id || user.data?.user?.uid
  if (!session.data?.session || !uid) throw new Error('未建立有效登录会话')
  localStorage.setItem(USER_KEY, `cloudbase-${uid}`)
  return getIdentity()
}

export async function track(
  name: string,
  data: {
    path?: string
    course_type?: string
    duration_ms?: number
    ok?: boolean
    error_code?: string
    content_preview?: string
    payload?: Record<string, unknown>
  } = {},
) {
  if (!analyticsConsent()) return
  const identity = getIdentity()
  try {
    await fetch(`${API}/telemetry/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ ...identity, ...data, name, consent: true }),
    })
  } catch {
    // Analytics must never block teaching.
  }
}

export async function eraseMyAnalytics() {
  const { userId } = getIdentity()
  await fetch(`${API}/telemetry/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: { 'x-user-id': userId },
  })
}
