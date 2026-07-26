import { Link } from 'react-router-dom'

export function StepNav({
  back,
  next,
  nextLabel = '下一步',
}: {
  back?: string
  next?: string
  nextLabel?: string
}) {
  return (
    <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
      {back ? (
        <Link to={back} className="text-sm text-ink-muted hover:text-ink">
          ← 上一步
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link
          to={next}
          className="rounded-full bg-leaf px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-leaf-deep"
        >
          {nextLabel} →
        </Link>
      )}
    </div>
  )
}
