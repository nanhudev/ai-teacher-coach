import type { ReactNode } from 'react'
import type { ThemeTokens } from '../themes'

export function SlideShell({
  theme,
  children,
  className = '',
}: {
  theme: ThemeTokens
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`relative flex h-full w-full flex-col overflow-hidden ${className}`}
      style={{
        background: theme.bg,
        color: theme.fg,
        boxShadow: theme.shadow,
      }}
    >
      {theme.mesh && (
        <div className="pointer-events-none absolute inset-0" style={{ background: theme.mesh }} />
      )}
      {theme.archetype === 'ink' && (
        <>
          <div className="pointer-events-none absolute right-8 top-7 h-16 w-16 rounded-full border border-current opacity-[0.08]" />
          <div className="pointer-events-none absolute bottom-8 left-9 h-px w-36 bg-current opacity-10" />
          <div className="pointer-events-none absolute bottom-6 right-8 h-9 w-9 border-2 opacity-20" style={{ borderColor: theme.accent }} />
        </>
      )}
      {theme.archetype === 'editorial' && (
        <div className="pointer-events-none absolute inset-y-0 left-8 w-px opacity-20" style={{ background: theme.accent }} />
      )}
      {theme.archetype === 'illustrated' && (
        <>
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border-[18px] opacity-10" style={{ borderColor: theme.accent }} />
          <div className="pointer-events-none absolute bottom-8 left-10 rotate-[-8deg] text-4xl opacity-10">✎</div>
        </>
      )}
      <div className="relative z-[1] flex h-full min-h-0 flex-col">{children}</div>
    </div>
  )
}

export function BulletList({
  items,
  theme,
  size,
}: {
  items: string[]
  theme: ThemeTokens
  size?: string
}) {
  return (
    <ul className="space-y-3" style={{ fontSize: size || theme.bodySize }}>
        {items.slice(0, 5).map((b) => (
        <li key={b} className="flex gap-3 leading-snug">
          <span style={{ color: theme.accent }}>●</span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  )
}
