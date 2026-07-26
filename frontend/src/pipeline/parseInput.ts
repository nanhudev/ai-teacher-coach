/** 一句话解析：「高中数学 导数」「小学语文 狐假虎威」「大学教育心理学 建构主义」 */

const GRADE_PAT =
  /(小学|初中|高中|大学|一年级|二年级|三年级|四年级|五年级|六年级|七年级|八年级|九年级|高一|高二|高三)/

const SUBJECT_PAT =
  /(语文|数学|英语|历史|物理|化学|生物|政治|思政|地理|科学|道法|道德与法治|教育心理学|心理学|教育学|计算机|信息技术)/

export type ParsedCourseInput = {
  grade: string
  subject: string
  topic: string
  raw: string
}

export function parseOneLiner(input: string): ParsedCourseInput {
  const raw = (input || '').trim().replace(/\s+/g, ' ')
  if (!raw) {
    return { grade: '高中', subject: '综合', topic: '未命名课程', raw: '' }
  }

  let rest = raw
  let grade = '高中'
  let subject = ''

  const g = rest.match(GRADE_PAT)
  if (g) {
    grade = normalizeGrade(g[1])
    rest = rest.replace(g[1], ' ').replace(/\s+/g, ' ').trim()
  }

  const s = rest.match(SUBJECT_PAT)
  if (s) {
    subject = normalizeSubject(s[1])
    rest = rest.replace(s[1], ' ').replace(/\s+/g, ' ').trim()
  }

  // 「数学·导数」「数学：导数」「数学-导数」
  rest = rest.replace(/^[·:：\-—_/]+/, '').trim()

  // 若仍粘在一起如「数学导数」
  if (!subject) {
    const sticky = rest.match(
      /^(语文|数学|英语|历史|物理|化学|生物|政治|科学)(.+)$/,
    )
    if (sticky) {
      subject = sticky[1]
      rest = sticky[2].trim()
    }
  }

  const topic = rest || raw
  if (!subject) {
    subject = inferSubjectFromTopic(topic)
  }

  return { grade, subject, topic, raw }
}

function normalizeGrade(g: string): string {
  if (/一年级|二年级|三年级|四年级|五年级|六年级|小学/.test(g)) return '小学'
  if (/七年级|八年级|九年级|初中/.test(g)) return '初中'
  if (/高一|高二|高三|高中/.test(g)) return '高中'
  if (/大学/.test(g)) return '大学'
  return g
}

function normalizeSubject(s: string): string {
  if (/思政|道法|道德/.test(s)) return '政治'
  if (/教育心理学|心理学|教育学/.test(s)) return s.includes('心理') ? '教育心理学' : '教育学'
  if (/计算机|信息/.test(s)) return '信息技术'
  return s
}

function inferSubjectFromTopic(topic: string): string {
  if (/导数|函数|方程|几何|分数|概率|三角/.test(topic)) return '数学'
  if (/牛顿|力学|电路|光学|加速度/.test(topic)) return '物理'
  if (/化学|分子|原子|反应/.test(topic)) return '化学'
  if (/细胞|遗传|生态/.test(topic)) return '生物'
  if (/赤壁|文言文|诗歌|作文|狐假虎威|寓言/.test(topic)) return '语文'
  if (/工业|革命|朝代|战争/.test(topic)) return '历史'
  if (/constructivism|建构主义|学习理论|维果茨基|皮亚杰/.test(topic)) return '教育心理学'
  if (/grammar|reading|writing|词汇/.test(topic)) return '英语'
  return '综合'
}
