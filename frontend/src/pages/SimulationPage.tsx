import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useDemo } from '../state/DemoContext'
import { StepNav } from '../components/StepNav'
import {
  LEVEL_LABEL,
  analyzeTeacherResponse,
  buildClassroomReport,
  updatePersonaAfterAnswer,
} from '../chinese/classroomSim'
import type { ChineseTextBrief } from '../chinese/textAgent'
import type { TeacherResponseAnalysis } from '../types/demo'
import { appendSimulationRun } from '../storage/localProjectStore'
import { evaluateTeacherAnswerRemote } from '../api/demo'

type RoundAnswer = {
  answer: string
  delta: {
    gap: string
    from: string
    to: string
    note: string
  }
  analysis: TeacherResponseAnalysis
}

export function SimulationPage() {
  const { session, setSession, answered, setAnswered } = useDemo()
  const [personaId, setPersonaId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [animKey, setAnimKey] = useState(0)

  const brief = useMemo(() => sessionToBrief(session), [session])

  if (!session) return <Navigate to="/demo" replace />

  const personas = session.personas
  const turns = session.simulation_turns
  const activeId = personaId || personas[0]?.id
  const persona = personas.find((p) => p.id === activeId) || personas[0]

  const personaTurns = turns
    .map((t, i) => ({ turn: t, index: i }))
    .filter((x) => x.turn.persona_id === persona?.id)

  const answeredMap = answered as Record<number, RoundAnswer>
  const doneCount = Object.keys(answeredMap).length
  const allDone = doneCount >= turns.length && turns.length > 0

  // 当前该生未答的最近一轮
  const currentSlot =
    personaTurns.find((x) => !answeredMap[x.index]) || personaTurns[personaTurns.length - 1]
  const current = currentSlot?.turn
  const turnIndex = currentSlot?.index ?? 0
  const done = answeredMap[turnIndex]
  const report = session.classroom_sim_report

  if (!persona || !current) {
    return (
      <div className="rounded-2xl bg-card p-6 ring-1 ring-ink/8">
        <p className="text-accent">学生数据不完整，请重新生成课程。</p>
        <StepNav back="/demo/before-after" />
      </div>
    )
  }

  function selectPersona(id: string) {
    setPersonaId(id)
    setAnimKey((k) => k + 1)
    const slots = turns
      .map((t, i) => ({ turn: t, index: i }))
      .filter((x) => x.turn.persona_id === id)
    const next = slots.find((x) => !answeredMap[x.index]) || slots[0]
    setText(next && answeredMap[next.index] ? answeredMap[next.index].answer : '')
  }

  async function onSubmit() {
    if (!text.trim() || !session || !brief || !persona) return
    setBusy(true)
    setAnalysisProgress(8)
    const progressTimer = window.setInterval(
      () => setAnalysisProgress((value) => Math.min(92, value + 7)),
      450,
    )
    try {
      let analysis: TeacherResponseAnalysis
      let delta: RoundAnswer['delta']

      const remote = await evaluateTeacherAnswerRemote(session, turnIndex, text.trim())
      if (remote?.score != null && remote?.understanding_delta) {
        const scores = remote.scores || {}
        analysis = {
          score: Number(remote.score) || 0,
          strengths: remote.analysis ? [String(remote.analysis)] : [],
          problems: [],
          suggestion: String(remote.suggestion || remote.ai_feedback || ''),
          pedagogy_analysis: {
            constructivism: String(remote.theory || '结合学生已有认知'),
            scaffolding: scores.guides_thinking
              ? `引导思考 ${scores.guides_thinking}/20`
              : '见分项建议',
            formative: scores.responds_student
              ? `回应学生 ${scores.responds_student}/20`
              : '见分项建议',
          },
          cited_text: /原文|文本|句/.test(String(remote.analysis || '')),
        }
        delta = remote.understanding_delta
      } else {
        const local = analyzeTeacherResponse({
          answer: text.trim(),
          question: current.question,
          brief,
          persona,
          round: current.round || 1,
          extraKeywords: session.sim_context?.keywords,
          excerpts: session.sim_context?.excerpts,
        })
        analysis = local.analysis
        delta = local.delta
      }

      setAnswered((prev) => ({
        ...prev,
        [turnIndex]: { answer: text.trim(), delta, analysis },
      }))

      const nextPersonas = session.personas.map((p) =>
        p.id === persona.id ? updatePersonaAfterAnswer(p, delta, analysis) : p,
      )
      const nextAnswered = {
        ...answeredMap,
        [turnIndex]: { answer: text.trim(), delta, analysis },
      }
      const completed = Object.keys(nextAnswered).length
      let classroom_sim_report = session.classroom_sim_report
      if (completed >= turns.length) {
        classroom_sim_report = buildClassroomReport({
          personas: nextPersonas,
          turns,
          analyses: Object.entries(nextAnswered).map(([i, v]) => ({
            turnIndex: Number(i),
            analysis: v.analysis,
          })),
        })
        const pid = session.local_project_id
        if (pid && classroom_sim_report) {
          void appendSimulationRun(pid, {
            id: `sim_${Date.now().toString(36)}`,
            startedAt: new Date().toISOString(),
            finishedAt: new Date().toISOString(),
            score: classroom_sim_report.total_score,
            completedRounds: classroom_sim_report.completed_rounds,
            totalRounds: classroom_sim_report.total_rounds,
            report: classroom_sim_report,
            answers: Object.entries(nextAnswered).map(([i, v]) => ({
              turnIndex: Number(i),
              score: v.analysis?.score,
              answerPreview: v.answer.slice(0, 80),
            })),
          })
        }
      }
      setSession({
        ...session,
        personas: nextPersonas,
        classroom_sim_report,
      })
      setText('')
      setAnimKey((k) => k + 1)
    } finally {
      window.clearInterval(progressTimer)
      setAnalysisProgress(100)
      setBusy(false)
    }
  }

  function onRestart() {
    setAnswered({})
    setText('')
    setPersonaId(personas[0]?.id || null)
    setSession({
      ...session!,
      classroom_sim_report: undefined,
      personas: personas.map((p) => ({
        ...p,
        learning_state: {
          knowledge_gap: [...p.knowledge_gap],
          understood: [],
          confused: [...p.knowledge_gap],
        },
        memory: { unresolved: [...p.knowledge_gap], resolved: [], understanding: {} },
      })),
    })
    setAnimKey((k) => k + 1)
  }

  const stage = session.sim_context?.stage || '文本细读'

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-leaf">虚拟班级 · 课堂问答训练</p>
          <h1 className="font-display mt-1 text-3xl">
            {session.meta.grade}
            {session.meta.subject}《{session.director.course}。          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            当前教学阶段：{stage} · 进度 {doneCount}/{turns.length} 轮          </p>
        </div>
        <button
          type="button"
          onClick={onRestart}
          className="rounded-full bg-paper-2 px-4 py-2 text-sm text-ink-muted ring-1 ring-ink/8"
        >
          重新开始模拟        </button>
      </div>

      {allDone && report && (
        <section className="mt-6 rounded-2xl bg-leaf-deep p-5 text-white shadow-lg">
          <p className="text-sm text-white/70">课堂问答能力报告</p>
          <p className="font-display mt-1 text-4xl">{report.total_score}/100</p>
          <p className="mt-2 text-sm text-white/85">{report.summary}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {report.by_persona.map((p) => (
              <div key={p.persona_id} className="rounded-xl bg-white/10 p-3 text-sm">
                <p className="font-medium">
                  {p.name} · {p.level}
                </p>
                <p className="mt-1 text-white/80">均分 {p.avg_score}</p>
                <p className="mt-1 text-xs text-white/70">
                  已懂：{p.understood.slice(0, 2).join('、') || '…'}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <p>优势：{report.strengths.join('、') || '…'}</p>
            <p>不足：{report.problems.join('、') || '…'}</p>
          </div>
          <p className="mt-2 text-sm text-amber-100">建议：{report.suggestions[0]}</p>
        </section>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)_260px]">
        {/* 左：学生列表 */}
        <aside className="space-y-2">
          <p className="px-1 text-xs font-medium text-ink-muted">虚拟学生</p>
          {personas.map((p) => {
            const slots = turns
              .map((t, i) => ({ t, i }))
              .filter((x) => x.t.persona_id === p.id)
            const finished = slots.filter((x) => answeredMap[x.i]).length
            const active = p.id === persona.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPersona(p.id)}
                className={`w-full rounded-2xl p-3 text-left transition ${
                  active
                    ? 'bg-leaf text-white shadow-md ring-2 ring-leaf/40'
                    : 'bg-card ring-1 ring-ink/8 hover:ring-leaf/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} tone={active ? 'onLeaf' : 'leaf'} />
                  <div className="min-w-0">
                    <p className="font-medium">{p.name}</p>
                    <p className={`text-xs ${active ? 'text-white/80' : 'text-ink-muted'}`}>
                      {LEVEL_LABEL[p.level] || p.level}
                    </p>
                    <p className={`mt-1 text-[11px] ${active ? 'text-white/70' : 'text-ink-muted'}`}>
                      {finished}/3 问                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </aside>

        {/* 中：问答 */}
        <section
          key={animKey}
          className="rounded-2xl bg-card p-5 ring-1 ring-ink/8 animate-[fadeUp_.3s_ease]"
        >
          <div className="flex items-center gap-3">
            <Avatar name={persona.name} tone="leaf" large />
            <div>
              <p className="font-display text-xl">{persona.name}</p>
              <p className="text-xs text-ink-muted">
                {LEVEL_LABEL[persona.level]} · {persona.personality}
              </p>
              <p className="mt-1 text-xs text-leaf">
                第{current.round || 1}/3 问 · {done ? ' · 已回应' : ' · 等待你的讲解'}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-paper/80 px-4 py-3">
            <p className="text-xs text-ink-muted">当前状态</p>
            <p className="mt-1 text-sm">
              缺口：{(persona.learning_state?.confused || persona.knowledge_gap).slice(0, 2).join('、') || '…'}
            </p>
            <p className="mt-1 text-sm text-leaf-deep">
              已懂：{(persona.learning_state?.understood || []).slice(0, 2).join('、') || '尚未建立'}
            </p>
          </div>

          <blockquote className="font-display mt-6 text-xl leading-relaxed text-ink">
            「{current.question}」</blockquote>

          {!done ? (
            <div className="mt-6">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="用教师身份回答这位学生…"
                className="w-full rounded-xl border border-ink/10 bg-paper/50 p-3 text-sm outline-none focus:border-leaf"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={busy || !text.trim()}
                  className="rounded-full bg-leaf px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {busy ? '分析中…' : '提交回答'}
                </button>
                <button
                  type="button"
                  onClick={() => setText(current.sample_answer)}
                  className="rounded-full bg-paper-2 px-4 py-2 text-sm text-ink-muted"
                >
                  填入参考回答                </button>
              </div>
              {busy && (
                <div className="mt-4 rounded-xl bg-leaf/10 p-3">
                  <div className="flex justify-between text-xs text-ink-muted">
                    <span>正在分析回答与学生理解变化</span>
                    <span>{analysisProgress}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-leaf to-amber-400 transition-all duration-500"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <div className="rounded-xl bg-paper p-3 text-sm">
                <p className="text-xs text-ink-muted">你的回答</p>
                <p className="mt-1">{done.answer}</p>
              </div>
              <div className="rounded-xl bg-[#e7f2ed] p-3 text-sm">
                <p className="text-xs font-medium text-leaf-deep">学生理解变化</p>
                <p className="mt-2">
                  {done.delta.gap}：{done.delta.from} →<strong>{done.delta.to}</strong>
                </p>
                <p className="mt-1 text-ink-muted">{done.delta.note}</p>
              </div>
              {personaTurns.some((x) => !answeredMap[x.index]) && (
                <button
                  type="button"
                  onClick={() => {
                    const next = personaTurns.find((x) => !answeredMap[x.index])
                    if (next) {
                      setAnimKey((k) => k + 1)
                      setText('')
                    }
                  }}
                  className="text-sm text-leaf underline-offset-2 hover:underline"
                >
                  继续回答{persona.name}的下一问→                </button>
              )}
            </div>
          )}
        </section>

        {/* 右：即时反馈 */}
        <aside className="space-y-3">
          <div className="rounded-2xl bg-card p-4 ring-1 ring-ink/8">
            <p className="text-xs font-medium text-ink-muted">AI 即时反馈</p>
            {done?.analysis ? (
              <div className="mt-3 space-y-3 text-sm">
                <p className="font-display text-3xl text-leaf-deep">{done.analysis.score}</p>
                <div>
                  <p className="text-xs text-ink-muted">优势</p>
                  <ul className="mt-1 list-disc pl-4">
                    {done.analysis.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">问题</p>
                  <ul className="mt-1 list-disc pl-4 text-accent">
                    {done.analysis.problems.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <p className="rounded-lg bg-paper px-2 py-2 text-xs leading-relaxed">
                  建议：{done.analysis.suggestion}
                </p>
                <div className="rounded-lg bg-slate-900 p-3 text-[11px] text-white/85">
                  <p className="text-white/50">教育理论</p>
                  <p className="mt-1">建构主义：{done.analysis.pedagogy_analysis.constructivism}</p>
                  <p className="mt-1">支架式：{done.analysis.pedagogy_analysis.scaffolding}</p>
                  <p className="mt-1">形成性评价：{done.analysis.pedagogy_analysis.formative}</p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">提交回答后，这里给出评分与教学建议。</p>
            )}
          </div>

          <div className="rounded-2xl bg-card p-4 text-xs text-ink-muted ring-1 ring-ink/8">
            <p className="font-medium text-ink">本场记忆</p>
            <ul className="mt-2 space-y-2">
              {personas.map((p) => (
                <li key={p.id}>
                  <span className="text-ink">{p.name}</span>：懂{' '}
                  {(p.learning_state?.understood || []).length} · 惑{' '}
                  {(p.learning_state?.confused || p.knowledge_gap).length}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <StepNav
        back="/demo/before-after"
        next="/demo/evaluation"
        nextLabel={allDone ? '查看总评报告' : '跳过剩余轮次 · 去评价'}
      />
    </div>
  )
}

function Avatar({
  name,
  tone = 'leaf',
  large,
}: {
  name: string
  tone?: 'leaf' | 'onLeaf'
  large?: boolean
}) {
  const size = large ? 'h-14 w-14 text-lg' : 'h-10 w-10 text-sm'
  const style =
    tone === 'onLeaf'
      ? 'bg-white/20 text-white ring-2 ring-white/40'
      : 'bg-leaf/15 text-leaf-deep ring-1 ring-leaf/20'
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-semibold transition ${size} ${style}`}
    >
      {name.slice(0, 1)}
    </div>
  )
}

function sessionToBrief(session: ReturnType<typeof useDemo>['session']): ChineseTextBrief | null {
  if (!session) return null
  const title = session.sim_context?.title || session.director.course
  const excerpts = session.sim_context?.excerpts || []
  return {
    matched: true,
    text: excerpts.length
      ? ({
          id: 'sim',
          title,
          author: session.sim_context?.author || '',
          unit: '必修上',
          kind: 'classical',
          ppt_style: 'classical',
          excerpts: excerpts.map((t, i) => ({ label: `摘录${i + 1}`, text: t })),
          background: '',
          core_questions: session.director.learning_objectives,
          annotation: { 实词: [], 虚词: [] },
          sentence_analysis: [],
          literary_features: [],
          structure: [],
          exam_points: session.meta.knowledge_points,
          common_questions: [],
          teaching_difficulties: session.director.student_difficulties,
          visual_prompts: [],
        } as ChineseTextBrief['text'])
      : null,
    source: 'cached',
    text_background: session.lesson.textbook_analysis || '',
    core_questions: session.director.learning_objectives.slice(0, 3),
    knowledge_points: {
      文言实词: (session.sim_context?.keywords || session.meta.knowledge_points).map((k) => `${k}`),
      虚词: [],
      特殊句式: [],
      文学手法: [],
    },
    exam_focus: session.meta.knowledge_points,
    teaching_difficulties: session.director.student_difficulties,
    visual_prompts: [],
    ppt_style: 'classical',
    unit: '必修上',
    title,
    author: session.sim_context?.author || '',
  }
}
