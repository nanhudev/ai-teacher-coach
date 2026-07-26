/** 给老师看的「本课依据」一行，不展示政策全文 */
export function CurriculumBasisBadge({
  line,
  taskGroup,
  className = '',
}: {
  line?: string
  taskGroup?: string
  className?: string
}) {
  const text = line || '本课依据：新课标核心素养 × 学习任务群 × 新高考评价体系'
  return (
    <div
      className={`rounded-xl bg-leaf/8 px-3 py-2 text-sm text-leaf-deep ring-1 ring-leaf/15 ${className}`}
    >
      <p className="font-medium">{text}</p>
      {taskGroup && <p className="mt-0.5 text-xs text-ink-muted">学习任务群：{taskGroup}</p>}
    </div>
  )
}
