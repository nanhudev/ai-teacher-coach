import { Link } from 'react-router-dom'
import { PptShowcase } from '../components/marketing/PptShowcase'
import { LessonPreview } from '../components/marketing/LessonPreview'

const STEPS = [
  {
    n: '01',
    title: '输入课程',
    body: '高中语文 · 《赤壁赋》',
    detail: 'AI 正在分析教材定位、核心素养与新高考考点。',
  },
  {
    n: '02',
    title: '生成教案',
    body: '教学目标 · 重点难点 · 任务群路径',
    detail: '语言建构与运用 · 思维发展与提升 · 理解苏轼精神世界',
  },
  {
    n: '03',
    title: '精品课件',
    body: '封面 → 原文分析 → 知识点 → 课堂任务 → 总结',
    detail: '真实渲染的课堂幻灯片，可左右翻页预览。',
  },
  {
    n: '04',
    title: '课堂模拟',
    body: '三位虚拟学生提问，即时分析回答质量',
    detail: '练完一堂课，再走进真实教室。',
  },
]

const CAPS = [
  { t: '智能备课', d: '教材 → 教案 → PPT，一气呵成' },
  { t: '新高考适配', d: '课程标准 · 核心素养 · 评价体系' },
  { t: 'AI 课堂训练', d: '模拟不同学生提问与追问' },
  { t: '教学成长分析', d: '课后自动生成课堂评价报告' },
]

const TRUST = ['新课标核心素养', '学习任务群', '建构主义教学', '形成性评价']

export function MarketingHomePage() {
  return (
    <div className="mkt min-h-screen bg-[#F7F4EF] text-[#1a1a1a]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <p className="font-display text-lg tracking-wide text-[#1e3a5f]">AI Teacher Coach</p>
        <nav className="flex items-center gap-5 text-sm text-[#475569]">
          <Link to="/review" className="hover:text-[#1e3a5f]">
            优化已有课
          </Link>
          <Link to="/showcase" className="hover:text-[#1e3a5f]">
            完整案例
          </Link>
          <Link to="/app" className="hover:text-[#1e3a5f]">
            我的课程
          </Link>
        </nav>
      </header>

      {/* Hero — brand first, one CTA, real PPT */}
      <section className="relative overflow-hidden border-b border-[#1e3a5f]/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_520px_at_15%_-10%,rgba(30,58,95,0.09),transparent),radial-gradient(700px_400px_at_95%_30%,rgba(15,23,42,0.05),transparent)]" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pb-24 lg:pt-14">
          <div>
            <p className="font-display text-[clamp(2.6rem,6vw,3.75rem)] leading-[1.08] tracking-tight text-[#1e3a5f]">
              AI Teacher Coach
            </p>
            <p className="mt-3 text-base text-[#475569] sm:text-lg">
              基于新课标与新高考体系的
              <br className="hidden sm:block" />
              AI 高中语文备课与课堂训练助手
            </p>
            <h1 className="font-display mt-8 text-[clamp(1.6rem,3.5vw,2.15rem)] leading-snug text-[#1a1a1a]">
              让 AI 成为你的智能教研助手
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#64748b]">
              像和年轻教研员一起磨课：改教学思想，AI 同步教案、课件与课堂模拟。
            </p>

            <ul className="mt-8 space-y-2 text-sm text-[#334155]">
              <li className="flex gap-2">
                <span className="text-[#1e3a5f]">↓</span>
                <span>输入一篇课文</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#1e3a5f]">✓</span>
                <span>自动生成教学设计 · 精品 PPT · 课堂模拟 · 教学评价</span>
              </li>
            </ul>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/demo?topic=赤壁赋"
                className="inline-flex bg-[#1e3a5f] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-[#152a45]"
              >
                体验 AI 生成一节课
              </Link>
              <Link to="/showcase" className="text-sm text-[#1e3a5f] underline-offset-4 hover:underline">
                先看《赤壁赋》完整案例
              </Link>
            </div>
          </div>

          <div className="mkt-rise">
            <PptShowcase topic="高中语文 必修上 赤壁赋" />
          </div>
        </div>
      </section>

      {/* 4 steps */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-xs tracking-[0.22em] text-[#1e3a5f]">核心流程</p>
        <h2 className="font-display mt-2 text-3xl text-[#1a1a1a]">四步，备好一堂课</h2>
        <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n}>
              <p className="font-display text-3xl text-[#1e3a5f]/25">{s.n}</p>
              <p className="mt-2 text-lg font-medium text-[#1a1a1a]">{s.title}</p>
              <p className="mt-2 text-sm text-[#1e3a5f]">{s.body}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#64748b]">{s.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* PPT focus */}
      <section className="border-y border-[#1e3a5f]/10 bg-[#FFFCFA]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="text-xs tracking-[0.22em] text-[#1e3a5f]">精品课件</p>
          <h2 className="font-display mt-2 text-3xl">像公开课一样的 PPT</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#64748b]">
            不是提纲目录，而是可直接上课的幻灯片：原文细读、课堂任务、高考迁移。
          </p>
          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-xs tracking-wide text-[#94a3b8]">普通 PPT</p>
              <div className="mt-3 aspect-[16/9] border border-dashed border-[#cbd5e1] bg-[#f1f5f9] p-6">
                <p className="text-sm text-[#94a3b8]">目录式提纲</p>
                <ul className="mt-4 space-y-2 text-sm text-[#64748b]">
                  <li>1. 作者介绍</li>
                  <li>2. 背景简介</li>
                  <li>3. 文言注释</li>
                  <li>4. 中心思想</li>
                </ul>
              </div>
            </div>
            <div>
              <p className="text-xs tracking-wide text-[#1e3a5f]">AI 优化 PPT</p>
              <div className="mt-3">
                <PptShowcase topic="高中语文 必修上 赤壁赋" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lesson preview */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs tracking-[0.22em] text-[#1e3a5f]">教案预览</p>
            <h2 className="font-display mt-2 text-3xl">精品教案，关键结构一目了然</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#64748b]">
              教材分析、核心素养目标、课堂任务、板书设计——写给真正要上课的老师。
            </p>
            <Link
              to="/demo?topic=赤壁赋"
              className="mt-8 inline-flex border border-[#1e3a5f] px-5 py-2.5 text-sm text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white"
            >
              用《赤壁赋》生成完整教案
            </Link>
          </div>
          <LessonPreview title="赤壁赋" />
        </div>
      </section>

      {/* Classroom sim peek */}
      <section className="border-y border-[#1e3a5f]/10 bg-[#FFFCFA]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="text-xs tracking-[0.22em] text-[#1e3a5f]">课堂模拟</p>
          <h2 className="font-display mt-2 text-3xl">先练一堂课，再进教室</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              { name: '小林', tag: '基础型', q: '老师，苏轼为什么要夜游赤壁？' },
              { name: '小陈', tag: '思考型', q: '「乐—悲—喜」的转折靠哪句原文？' },
              { name: '李明', tag: '挑战型', q: '旷达是不是在逃避现实？' },
            ].map((s) => (
              <div key={s.name} className="border border-[#1e3a5f]/12 bg-white px-5 py-5">
                <p className="font-medium text-[#1a1a1a]">{s.name}</p>
                <p className="mt-1 text-xs text-[#1e3a5f]">{s.tag}学生</p>
                <p className="mt-4 text-sm leading-relaxed text-[#475569]">{s.q}</p>
                <p className="mt-3 text-xs text-[#94a3b8]">AI 分析回答质量 · 给出改进建议</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-xs tracking-[0.22em] text-[#1e3a5f]">产品能力</p>
        <h2 className="font-display mt-2 text-3xl">为高中语文教师而设计</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CAPS.map((c) => (
            <div key={c.t} className="border-t border-[#1e3a5f]/20 pt-4">
              <p className="text-lg font-medium text-[#1a1a1a]">{c.t}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#64748b]">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="border-t border-[#1e3a5f]/10 bg-[#1e3a5f] text-[#F7F4EF]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="font-display text-2xl sm:text-3xl">基于教育学理论设计</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm">
                <span className="text-[#93c5fd]">✓</span>
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-12">
            <Link
              to="/demo?topic=赤壁赋"
              className="inline-flex bg-[#F7F4EF] px-6 py-3.5 text-sm font-medium text-[#1e3a5f] hover:bg-white"
            >
              体验 AI 生成一节课
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-xs text-[#94a3b8]">
        <p>AI Teacher Coach · 智课助手</p>
        <div className="flex gap-4">
          <Link to="/demo" className="hover:text-[#1e3a5f]">
            Demo
          </Link>
          <Link to="/app" className="hover:text-[#1e3a5f]">
            工作区
          </Link>
          <Link to="/showcase" className="hover:text-[#1e3a5f]">
            教授展示
          </Link>
        </div>
      </footer>

      <style>{`
        .mkt-rise { animation: mktRise 0.7s ease both; }
        @keyframes mktRise {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  )
}
